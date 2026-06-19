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
    isGuest: false
  },

  onLoad: function() {
    this.checkLoginStatus();
    this.loadGroupInfo();
  },

  onShow: function() {
    this.checkLoginStatus();
    this.loadGroupInfo();
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
            wx.switchTab({
              url: '/pages/profile/profile'
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
            wx.switchTab({
              url: '/pages/profile/profile'
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
            wx.switchTab({ url: '/pages/profile/profile' });
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
        cityCount: app.getVisitedCityCount(),
        photoCount: app.getStats().photoCount
      }],
      stats: {
        totalMembers: 1,
        totalCities: app.getVisitedCityCount(),
        totalProvinces: app.getVisitedProvinceCount(),
        totalPhotos: app.getStats().photoCount
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
            cityCount: app.getVisitedCityCount(),
            photoCount: app.getStats().photoCount,
            provinceCount: app.getVisitedProvinceCount()
          }
        },
        timeout: 15000
      }).then(function(res) {
        wx.hideLoading();
        var result = res.result;
        if (result && result.success && result.groupInfo && result.groupInfo.id) {
          groupData.groupInfo.id = result.groupInfo.id;
          wx.setStorageSync('myGroup', JSON.stringify(groupData));
        }
        self.setData({
          showCreateModal: false,
          groupInfo: groupData.groupInfo,
          isCreator: true,
          isAdmin: true,
          inviteCode: inviteCode,
          members: groupData.members,
          stats: groupData.stats,
          sharedPhotos: groupData.sharedPhotos
        });
        if (result && result.success) {
          wx.showToast({ title: '创建成功', icon: 'success' });
        } else {
          var failMsg = (result && result.message) || '未知错误';
          console.error('[group] 云端创建失败:', failMsg);
          wx.showModal({
            title: '⚠️ 云端同步失败',
            content: '群组已在本机创建，但云端写入失败：' + failMsg + '\n\n好友将无法通过云端加入！请先在微信开发者工具中：\n1) 右键 cloudfunctions/group → 上传并部署\n2) 确认云数据库集合 groups 和 group_members 已创建',
            showCancel: false
          });
        }
      }).catch(function(err) {
        wx.hideLoading();
        console.error('[group] 云函数调用失败:', err);
        self.setData({
          showCreateModal: false,
          groupInfo: groupData.groupInfo,
          isCreator: true,
          isAdmin: true,
          inviteCode: inviteCode,
          members: groupData.members,
          stats: groupData.stats,
          sharedPhotos: groupData.sharedPhotos
        });
        wx.showModal({
          title: '⚠️ 云端连接失败',
          content: '云函数调用失败: ' + (err.errMsg || err.message || '未知错误') + '\n\n请检查：\n1. 云开发环境是否开通\n2. 云函数 group 是否已上传并部署\n3. 网络连接是否正常',
          showCancel: false
        });
      });
    } else {
      wx.hideLoading();
      self.setData({
        showCreateModal: false,
        groupInfo: groupData.groupInfo,
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
            wx.switchTab({ url: '/pages/profile/profile' });
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
            cityCount: app.getVisitedCityCount(),
            photoCount: app.getStats().photoCount
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
            isCreator: result.isCreator || false,
            isAdmin: result.isAdmin || false,
            inviteCode: result.inviteCode || code,
            members: result.members || [],
            stats: result.stats || self.data.stats,
            sharedPhotos: result.sharedPhotos || []
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
              self.doLocalJoin(code, userInfo, openid);
            }
          }
        });
      });
    } else {
      // 纯本地模式
      wx.hideLoading();
      self.doLocalJoin(code, userInfo, openid);
    }
  },

  // 本地模式加入群组（云函数不可用时的降级方案）
  doLocalJoin: function(code, userInfo, openid) {
    var self = this;
    
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
        cityCount: app.getVisitedCityCount(),
        photoCount: app.getStats().photoCount
      }],
      stats: {
        totalMembers: 1,
        totalCities: app.getVisitedCityCount(),
        totalProvinces: app.getVisitedProvinceCount(),
        totalPhotos: app.getStats().photoCount
      },
      sharedPhotos: []
    };
    
    wx.setStorageSync('myGroup', JSON.stringify(groupData));
    
    self.setData({
      showJoinModal: false,
      joinCode: '',
      groupInfo: groupData.groupInfo,
      isCreator: false,
      isAdmin: false,
      inviteCode: code,
      members: groupData.members,
      stats: groupData.stats,
      sharedPhotos: groupData.sharedPhotos
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
        path: '/package-others/pages/group/group?inviteCode=' + inviteCode
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
