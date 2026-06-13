var app = getApp();

Page({
  data: {
    groupInfo: null,
    isCreator: false,
    isAdmin: false,
    inviteCode: '',
    members: [],
    stats: {
      totalMembers: 0,
      totalCities: 0,
      totalProvinces: 0,
      totalPhotos: 0
    },
    sharedPhotos: [],
    loading: true,
    showCreateModal: false,
    showInviteModal: false,
    showJoinModal: false,
    showPhotosModal: false,
    currentPhotoIndex: 0,
    newGroupName: '',
    newGroupType: 'friends',
    joinCode: '',
    isGuest: false,
    groupTypeText: ''
  },

  // 阻止事件冒泡（空函数）
  preventClose: function() {},

  onLoad: function() {
    this.checkLoginStatus();
    this.loadGroupInfo();
  },

  onShow: function() {
    this.checkLoginStatus();
    this.loadGroupInfo();
    // 每次显示时同步用户最新数据到群组
    this.syncMyStats();
  },

  // 获取群组类型文本
  getGroupTypeText: function(type) {
    var map = { friends: '朋友', couple: '情侣', family: '家人' };
    return map[type] || '朋友';
  },

  // 获取用户城市数
  getUserCityCount: function() {
    return (app.globalData.visitedCities || []).length;
  },

  // 获取用户省份数
  getUserProvinceCount: function() {
    return (app.globalData.visitedProvinces || []).length;
  },

  // 获取用户照片数
  getUserPhotoCount: function() {
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var count = 0;
    Object.keys(cityTravelPhotos).forEach(function(k) { count += cityTravelPhotos[k].length; });
    Object.keys(cityPhotos).forEach(function(k) { count += cityPhotos[k].length; });
    Object.keys(cityFoodPhotos).forEach(function(k) { count += cityFoodPhotos[k].length; });
    return count;
  },

  // 获取用户统计数据对象
  getUserStats: function() {
    return {
      photoCount: this.getUserPhotoCount(),
      visitedCount: this.getUserCityCount(),
      visitedProvinces: this.getUserProvinceCount()
    };
  },

  // 检查登录状态
  checkLoginStatus: function() {
    var isLogin = app.globalData.isLogin;
    var userInfo = app.globalData.userInfo;
    var isGuest = userInfo && userInfo.nickName === '游客';
    
    this.setData({
      isGuest: isGuest
    });
    
    if (!isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '群组功能需要登录后才能使用',
        confirmText: '去登录',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            // 使用 reLaunch 跳转到登录页（launch页面不是tab页，但需要重新加载）
            wx.reLaunch({
              url: '/pages/launch/launch'
            });
          }
        }
      });
      return;
    }
    
    if (isGuest) {
      wx.showModal({
        title: '需要微信登录',
        content: '游客模式无法使用群组功能。微信登录后可以创建群组、邀请好友共享旅行数据。',
        confirmText: '微信登录',
        cancelText: '继续浏览',
        success: function(res) {
          if (res.confirm) {
            // 清除游客登录状态，强制重新登录
            app.globalData.isLogin = false;
            app.globalData.userInfo = null;
            app.globalData.useCloud = true;
            wx.removeStorageSync('userInfo');
            
            // 使用 reLaunch 跳转到登录页
            wx.reLaunch({
              url: '/pages/launch/launch'
            });
          }
        }
      });
    }
  },

  // 加载群组信息
  loadGroupInfo: function() {
    var self = this;
    var isLogin = app.globalData.isLogin;
    var userInfo = app.globalData.userInfo;
    var isGuest = userInfo && userInfo.nickName === '游客';
    
    if (!isLogin || isGuest) {
      self.setData({ loading: false });
      return;
    }
    
    self.setData({ loading: true });
    
    // 先检查本地存储
    var localGroup = wx.getStorageSync('myGroup');
    if (localGroup) {
      try {
        var groupData = JSON.parse(localGroup);
        self.setData({
          groupInfo: groupData.groupInfo,
          groupTypeText: self.getGroupTypeText(groupData.groupInfo.type),
          isCreator: groupData.isCreator || false,
          isAdmin: groupData.isAdmin || false,
          inviteCode: groupData.inviteCode || '',
          members: groupData.members || [],
          stats: groupData.stats || self.data.stats,
          sharedPhotos: groupData.sharedPhotos || [],
          loading: false
        });
        return;
      } catch (e) {
        console.log('解析本地群组数据失败');
      }
    }
    
    // 从云端获取
    if (app.globalData.useCloud) {
      wx.cloud.callFunction({
        name: 'group',
        data: {
          action: 'getMyGroup'
        },
        timeout: 15000
      }).then(function(res) {
        var result = res.result;
        if (result && result.success && result.groupInfo) {
          self.setData({
            groupInfo: result.groupInfo,
            groupTypeText: self.getGroupTypeText(result.groupInfo.type),
            isCreator: result.isCreator || false,
            isAdmin: result.isAdmin || false,
            inviteCode: result.inviteCode || '',
            members: result.members || [],
            stats: result.stats || self.data.stats,
            sharedPhotos: result.sharedPhotos || [],
            loading: false
          });
          // 保存到本地
          wx.setStorageSync('myGroup', JSON.stringify({
            groupInfo: result.groupInfo,
            isCreator: result.isCreator,
            isAdmin: result.isAdmin,
            inviteCode: result.inviteCode,
            members: result.members,
            stats: result.stats,
            sharedPhotos: result.sharedPhotos
          }));
        } else {
          self.setData({
            groupInfo: null,
            loading: false
          });
        }
      }).catch(function(err) {
        console.error('获取群组信息失败:', err);
        self.setData({
          groupInfo: null,
          loading: false
        });
      });
    } else {
      self.setData({ loading: false });
    }
  },

  // 显示创建弹窗
  showCreate: function() {
    if (this.data.isGuest) {
      wx.showModal({
        title: '需要微信登录',
        content: '游客模式无法创建群组',
        confirmText: '去登录',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/launch/launch' });
          }
        }
      });
      return;
    }
    this.setData({
      showCreateModal: true,
      newGroupName: '',
      newGroupType: 'friends'
    });
  },

  // 隐藏创建弹窗
  hideCreateModal: function() {
    this.setData({ showCreateModal: false });
  },

  // 输入群组名称
  onGroupNameInput: function(e) {
    var value = e.detail.value || '';
    this.setData({ newGroupName: value });
  },

  // 选择群组类型
  selectGroupType: function(e) {
    this.setData({ newGroupType: e.currentTarget.dataset.type });
  },

  // 创建群组
  createGroup: function() {
    var self = this;
    var name = this.data.newGroupName.trim();
    var type = this.data.newGroupType;
    
    if (!name) {
      wx.showToast({
        title: '请输入群组名称',
        icon: 'none'
      });
      return;
    }
    
    if (name.length < 2) {
      wx.showToast({
        title: '名称至少2个字',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '创建中...' });
    
    var userInfo = app.globalData.userInfo;
    var openid = app.globalData.openid || wx.getStorageSync('openid');
    
    // 安全生成6位邀请码（排除易混淆字符0/O/1/I/L）
    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    var inviteCode = '';
    for (var ci = 0; ci < 6; ci++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    var userCityCount = self.getUserCityCount();
    var userProvinceCount = self.getUserProvinceCount();
    var userPhotoCount = self.getUserPhotoCount();

    var groupData = {
      groupInfo: {
        id: 'group_' + Date.now(),
        name: name,
        type: type,
        createTime: new Date().toISOString(),
        creatorOpenid: openid
      },
      isCreator: true,
      isAdmin: true,
      inviteCode: inviteCode,
      members: [{
        openid: openid,
        nickName: userInfo.nickName || '用户',
        avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg',
        isCreator: true,
        role: '创建者',
        cityCount: userCityCount,
        photoCount: userPhotoCount
      }],
      stats: {
        totalMembers: 1,
        totalCities: userCityCount,
        totalProvinces: userProvinceCount,
        totalPhotos: userPhotoCount
      },
      sharedPhotos: []
    };
    
    // 先本地保存，确保断网也能用
    wx.setStorageSync('myGroup', JSON.stringify(groupData));
    
    // 如果启用云开发，同步到云端（等待结果再提示用户）
    if (app.globalData.useCloud) {
      wx.cloud.callFunction({
        name: 'group',
        data: {
          action: 'createGroup',
          data: {
            name: name,
            type: type,
            inviteCode: inviteCode,
            userInfo: userInfo,
            openid: openid,
            cityCount: userCityCount,
            photoCount: userPhotoCount,
            provinceCount: userProvinceCount
          }
        },
        timeout: 15000
      }).then(function(res) {
        wx.hideLoading();
        var result = res.result;
        if (result && result.success) {
          // 云端创建成功，用云端返回的 groupId 更新本地
          if (result.groupInfo && result.groupInfo.id) {
            groupData.groupInfo.id = result.groupInfo.id;
            wx.setStorageSync('myGroup', JSON.stringify(groupData));
          }
          self.setData({
            showCreateModal: false,
            groupInfo: groupData.groupInfo,
            groupTypeText: self.getGroupTypeText(type),
            isCreator: true,
            isAdmin: true,
            inviteCode: inviteCode,
            members: groupData.members,
            stats: groupData.stats,
            sharedPhotos: groupData.sharedPhotos
          });
          wx.showToast({ title: '创建成功', icon: 'success' });
        } else {
          // 云端失败，群组仅本地可用，好友将无法加入！
          var failMsg = (result && result.message) || '未知错误';
          console.error('[group] 云端创建失败:', failMsg);
          self.setData({
            showCreateModal: false,
            groupInfo: groupData.groupInfo,
            groupTypeText: self.getGroupTypeText(type),
            isCreator: true,
            isAdmin: true,
            inviteCode: inviteCode,
            members: groupData.members,
            stats: groupData.stats,
            sharedPhotos: groupData.sharedPhotos
          });
          wx.showModal({
            title: '⚠️ 云端同步失败',
            content: '群组已在本机创建，但云端写入失败：' + failMsg + '\n\n好友将无法通过云端加入！请先在微信开发者工具中：\n1) 右键 cloudfunctions/group → 上传并部署\n2) 确认云数据库集合 groups 和 group_members 已创建',
            showCancel: false
          });
        }
      }).catch(function(err) {
        wx.hideLoading();
        console.error('云端创建失败:', err);
        self.setData({
          showCreateModal: false,
          groupInfo: groupData.groupInfo,
          groupTypeText: self.getGroupTypeText(type),
          isCreator: true,
          isAdmin: true,
          inviteCode: inviteCode,
          members: groupData.members,
          stats: groupData.stats,
          sharedPhotos: groupData.sharedPhotos
        });
        wx.showModal({
          title: '云端连接失败',
          content: '群组已在本地创建，但云函数连接失败（' + (err.errMsg || '未知错误') + '）。好友可能无法加入，请检查云函数是否已部署。',
          showCancel: false
        });
      });
    } else {
      // 纯本地模式
      wx.hideLoading();
      self.setData({
        showCreateModal: false,
        groupInfo: groupData.groupInfo,
        groupTypeText: self.getGroupTypeText(type),
        isCreator: true,
        isAdmin: true,
        inviteCode: inviteCode,
        members: groupData.members,
        stats: groupData.stats,
        sharedPhotos: groupData.sharedPhotos
      });
      wx.showToast({ title: '创建成功（本地模式）', icon: 'success' });
    }
  },

  // 显示邀请弹窗
  showInvite: function() {
    this.setData({ showInviteModal: true });
  },

  // 隐藏邀请弹窗
  hideInviteModal: function() {
    this.setData({ showInviteModal: false });
  },

  // 复制邀请码
  copyInviteCode: function() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: function() {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 显示加入弹窗
  showJoin: function() {
    if (this.data.isGuest) {
      wx.showModal({
        title: '需要微信登录',
        content: '游客模式无法加入群组',
        confirmText: '去登录',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/launch/launch' });
          }
        }
      });
      return;
    }
    this.setData({
      showJoinModal: true,
      joinCode: ''
    });
  },

  // 隐藏加入弹窗
  hideJoinModal: function() {
    this.setData({ showJoinModal: false });
  },

  // 输入邀请码
  onJoinCodeInput: function(e) {
    var value = e.detail.value || '';
    this.setData({ joinCode: value.toUpperCase() });
  },

  // 加入群组
  joinGroup: function() {
    var self = this;
    var code = this.data.joinCode.trim();
    
    if (!code || code.length !== 6) {
      wx.showToast({
        title: '请输入6位邀请码',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '验证中...' });
    
    var userInfo = app.globalData.userInfo;
    var openid = app.globalData.openid || wx.getStorageSync('openid');
    
    // 调用云函数验证邀请码并加入群组
    if (app.globalData.useCloud) {
      wx.cloud.callFunction({
        name: 'group',
        data: {
          action: 'joinGroup',
          data: {
            inviteCode: code,
            userInfo: userInfo,
            openid: openid,
            cityCount: self.getUserCityCount(),
            photoCount: self.getUserPhotoCount(),
            provinceCount: self.getUserProvinceCount()
          }
        },
        timeout: 15000
      }).then(function(res) {
        wx.hideLoading();
        var result = res.result;
        
        if (result && result.success) {
          // 加入成功，保存群组信息
          var groupData = {
            groupInfo: result.groupInfo,
            isCreator: result.isCreator || false,
            isAdmin: result.isAdmin || false,
            inviteCode: result.inviteCode || code,
            members: result.members || [],
            stats: result.stats || self.data.stats,
            sharedPhotos: result.sharedPhotos || []
          };
          
          wx.setStorageSync('myGroup', JSON.stringify(groupData));
          
          self.setData({
            showJoinModal: false,
            joinCode: '',
            groupInfo: result.groupInfo,
            groupTypeText: self.getGroupTypeText(result.groupInfo.type),
            isCreator: result.isCreator || false,
            isAdmin: result.isAdmin || false,
            inviteCode: result.inviteCode || code,
            members: result.members || [],
            stats: result.stats || self.data.stats,
            sharedPhotos: result.sharedPhotos || [],
            loading: false
          });
          
          wx.showToast({
            title: '加入成功！',
            icon: 'success'
          });
        } else {
          var msg = (result && result.message) || '邀请码无效或群组不存在';
          console.error('[group] joinGroup 失败:', result);
          wx.showModal({
            title: '加入失败',
            content: msg + '\n\n请确认：\n1. 邀请码输入正确（6位，无空格）\n2. 创建者的云函数 group 已部署\n3. 创建者的数据库集合 groups 已创建',
            showCancel: false
          });
        }
      }).catch(function(err) {
        wx.hideLoading();
        console.error('[group] joinGroup 云函数调用失败:', err);
        wx.showModal({
          title: '网络错误',
          content: '云函数调用失败: ' + (err.errMsg || err.message || '未知错误') + '\n\n请检查：\n1. 云开发环境是否已开通\n2. 云函数 group 是否已上传并部署\n3. 网络连接是否正常\n\n或者使用本地模式加入（数据仅保存在本机）',
          confirmText: '本地加入',
          cancelText: '取消',
          showCancel: true,
          success: function(modalRes) {
            if (modalRes.confirm) {
              self.doLocalJoin(code);
            }
          }
        });
      });
    } else {
      // 纯本地模式
      wx.hideLoading();
      self.doLocalJoin(code);
    }
  },

  // 本地模式加入群组（云函数不可用时的降级方案）
  doLocalJoin: function(code) {
    var self = this;
    var userInfo = app.globalData.userInfo;
    var openid = app.globalData.openid || wx.getStorageSync('openid');
    var userCityCount = self.getUserCityCount();
    var userProvinceCount = self.getUserProvinceCount();
    var userPhotoCount = self.getUserPhotoCount();
    
    // 生成本地群组数据
    var groupData = {
      groupInfo: {
        id: 'group_local_' + Date.now(),
        name: '我的旅行小队',
        type: 'friends',
        createTime: new Date().toISOString(),
        creatorOpenid: openid,
        inviteCode: code
      },
      isCreator: false,
      isAdmin: false,
      inviteCode: code,
      members: [{
        openid: openid,
        nickName: (userInfo && userInfo.nickName) || '用户',
        avatarUrl: (userInfo && userInfo.avatarUrl) || '/images/avatar.jpg',
        isCreator: true,
        role: '创建者',
        cityCount: userCityCount,
        photoCount: userPhotoCount
      }],
      stats: {
        totalMembers: 1,
        totalCities: userCityCount,
        totalProvinces: userProvinceCount,
        totalPhotos: userPhotoCount
      },
      sharedPhotos: []
    };
    
    wx.setStorageSync('myGroup', JSON.stringify(groupData));
    
    self.setData({
      showJoinModal: false,
      joinCode: '',
      groupInfo: groupData.groupInfo,
      groupTypeText: '朋友',
      isCreator: false,
      isAdmin: false,
      inviteCode: code,
      members: groupData.members,
      stats: groupData.stats,
      sharedPhotos: groupData.sharedPhotos,
      loading: false
    });
    
    wx.showToast({
      title: '已加入（本地模式）',
      icon: 'success'
    });
  },

  // 退出群组
  leaveGroup: function() {
    var self = this;
    
    wx.showModal({
      title: '确认退出',
      content: '退出后将无法再查看群组数据，确定要退出吗？',
      confirmColor: '#e74c3c',
      confirmText: '退出',
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({ title: '退出中...' });
          
          // 清除本地群组数据
          wx.removeStorageSync('myGroup');
          
          // 如果启用云开发，同步到云端
          if (app.globalData.useCloud) {
            wx.cloud.callFunction({
              name: 'group',
              data: {
                action: 'leaveGroup'
              },
              timeout: 15000
            }).catch(function(err) {
              console.error('云端退出失败:', err);
            });
          }
          
          wx.hideLoading();
          
          self.setData({
            groupInfo: null,
            isCreator: false,
            isAdmin: false,
            inviteCode: '',
            members: [],
            stats: {
              totalMembers: 0,
              totalCities: 0,
              totalProvinces: 0,
              totalPhotos: 0
            },
            sharedPhotos: []
          });
          
          wx.showToast({
            title: '已退出群组',
            icon: 'success'
          });
        }
      }
    });
  },

  // 显示照片墙
  showPhotoWall: function() {
    this.setData({
      showPhotosModal: true,
      currentPhotoIndex: 0
    });
  },

  // 同步我的统计数据到群组
  syncMyStats: function() {
    var self = this;
    var groupInfo = self.data.groupInfo;
    if (!groupInfo || !groupInfo.id) return;
    if (!app.globalData.useCloud) return;

    var userStats = self.getUserStats();
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'syncMemberStats',
        data: {
          groupId: groupInfo.id,
          cityCount: userStats.visitedCount,
          photoCount: userStats.photoCount
        }
      },
      timeout: 5000
    }).catch(function() {});
  },

  // 上传照片到群组共享
  uploadSharePhoto: function() {
    var self = this;
    var groupInfo = self.data.groupInfo;
    if (!groupInfo || !groupInfo.id) {
      wx.showToast({ title: '请先加入群组', icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        wx.showLoading({ title: '上传中...' });
        var uploaded = 0;
        var failed = 0;
        var total = res.tempFilePaths.length;

        // 本地模式：直接添加到 sharedPhotos
        if (!app.globalData.useCloud) {
          for (var i = 0; i < res.tempFilePaths.length; i++) {
            self.data.sharedPhotos.unshift({
              id: 'local_' + Date.now() + '_' + i,
              url: res.tempFilePaths[i],
              userId: app.globalData.openid || 'local',
              userName: (app.globalData.userInfo && app.globalData.userInfo.nickName) || '我',
              userAvatar: (app.globalData.userInfo && app.globalData.userInfo.avatarUrl) || '/images/avatar.jpg',
              cityName: '',
              createTime: new Date().toISOString()
            });
          }
          self.setData({ sharedPhotos: self.data.sharedPhotos });
          wx.hideLoading();
          wx.showToast({ title: '共享成功', icon: 'success' });
          self.syncLocalGroupData();
          return;
        }

        // 云端模式：通过云函数上传
        for (var i = 0; i < res.tempFilePaths.length; i++) {
          (function(filePath, index) {
            wx.cloud.callFunction({
              name: 'group',
              data: {
                action: 'sharePhoto',
                data: {
                  groupId: groupInfo.id,
                  url: filePath,
                  cityName: ''
                }
              },
              timeout: 10000
            }).then(function(cfRes) {
              uploaded++;
              if (cfRes.result && cfRes.result.success) {
                self.data.sharedPhotos.unshift({
                  id: cfRes.result.photoId || ('temp_' + Date.now()),
                  url: filePath,
                  userId: app.globalData.openid || '',
                  userName: (app.globalData.userInfo && app.globalData.userInfo.nickName) || '我',
                  userAvatar: (app.globalData.userInfo && app.globalData.userInfo.avatarUrl) || '/images/avatar.jpg',
                  cityName: '',
                  createTime: new Date().toISOString()
                });
              } else {
                failed++;
              }
              if (uploaded + failed >= total) {
                wx.hideLoading();
                self.setData({ sharedPhotos: self.data.sharedPhotos });
                self.syncLocalGroupData();
                if (failed > 0) {
                  wx.showToast({ title: uploaded + '张成功,' + failed + '张失败', icon: 'none' });
                } else {
                  wx.showToast({ title: '共享成功', icon: 'success' });
                }
              }
            }).catch(function() {
              failed++;
              if (uploaded + failed >= total) {
                wx.hideLoading();
                self.setData({ sharedPhotos: self.data.sharedPhotos });
                self.syncLocalGroupData();
                wx.showToast({ title: uploaded + '张成功,' + failed + '张失败', icon: 'none' });
              }
            });
          })(res.tempFilePaths[i], i);
        }
      }
    });
  },

  // 同步本地群组数据到 storage
  syncLocalGroupData: function() {
    var data = {
      groupInfo: this.data.groupInfo,
      isCreator: this.data.isCreator,
      isAdmin: this.data.isAdmin,
      inviteCode: this.data.inviteCode,
      members: this.data.members,
      stats: this.data.stats,
      sharedPhotos: this.data.sharedPhotos
    };
    wx.setStorageSync('myGroup', JSON.stringify(data));
  },

  // 隐藏照片墙
  hidePhotosModal: function() {
    this.setData({ showPhotosModal: false });
  },

  // 照片切换
  onPhotoChange: function(e) {
    this.setData({
      currentPhotoIndex: e.detail.current
    });
  },

  // 预览图片
  previewImage: function(e) {
    var url = e.currentTarget.dataset.url;
    var urls = this.data.sharedPhotos.map(function(item) {
      return item.url;
    });
    
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 分享给好友
  onShareAppMessage: function() {
    var groupInfo = this.data.groupInfo;
    var inviteCode = this.data.inviteCode;
    
    if (groupInfo && inviteCode) {
      return {
        title: '邀请你加入「' + groupInfo.name + '」旅行群组',
        path: '/pages/group/group?inviteCode=' + inviteCode,
        imageUrl: '/images/share-group.png'
      };
    }
    
    return {
      title: '城会玩2.0 - 和朋友一起探索世界',
      path: '/pages/index/index'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    var groupInfo = this.data.groupInfo;
    
    return {
      title: groupInfo ? '「' + groupInfo.name + '」的城市图鉴' : '城会玩2.0 - 和朋友一起探索世界',
      query: groupInfo ? 'inviteCode=' + this.data.inviteCode : ''
    };
  }
});
