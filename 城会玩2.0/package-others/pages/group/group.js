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
    
    // 生成邀请码
    var inviteCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    
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
    
    // 保存到本地
    wx.setStorageSync('myGroup', JSON.stringify(groupData));
    
    // 如果启用云开发，同步到云端
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
            openid: openid
          }
        },
        timeout: 15000
      }).then(function() {
        console.log('群组创建成功');
      }).catch(function(err) {
        console.error('云端创建失败:', err);
      });
    }
    
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
    
    wx.showToast({
      title: '创建成功',
      icon: 'success'
    });
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
    
    wx.showLoading({ title: '加入中...' });
    
    // 模拟加入成功（实际应该查询云端）
    setTimeout(function() {
      wx.hideLoading();
      
      // 这里简化处理，实际应该调用云函数验证邀请码
      wx.showModal({
        title: '加入群组',
        content: '邀请码 ' + code + ' 验证成功，确认加入该群组吗？',
        confirmText: '确认加入',
        success: function(res) {
          if (res.confirm) {
            self.setData({
              showJoinModal: false,
              joinCode: ''
            });
            wx.showToast({
              title: '加入成功',
              icon: 'success'
            });
          }
        }
      });
    }, 1000);
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
