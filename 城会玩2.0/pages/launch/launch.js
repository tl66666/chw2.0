var app = getApp();

Page({
  data: {
    isLogin: false,
    userInfo: null,
    showStats: false,
    showFeatures: false,
    totalUsers: '12.8K',
    totalCities: '391',
    totalPhotos: '56.2K'
  },

  onLoad: function(options) {
    var fromPage = options.from || '';
    if (fromPage === 'switchLogin') {
      this.setData({
        isLogin: false,
        userInfo: null
      });
    } else {
      this.checkLoginStatus();
    }

    var self = this;
    setTimeout(function() {
      self.setData({ showStats: true });
    }, 500);

    setTimeout(function() {
      self.setData({ showFeatures: true });
    }, 800);
  },

  onShow: function() {
    this.checkLoginStatus();
  },

  checkLoginStatus: function() {
    var isLogin = app.globalData.isLogin;
    var userInfo = app.globalData.userInfo;
    var displayUserInfo = null;

    if (userInfo) {
      displayUserInfo = {
        nickName: userInfo.nickName || '城会玩旅人',
        avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg'
      };
    }

    this.setData({
      isLogin: isLogin,
      userInfo: displayUserInfo
    });
  },

  onWechatLogin: function() {
    var self = this;

    wx.showLoading({ title: '登录中...' });

    wx.getUserProfile({
      desc: '用于同步城市足迹和角色卡',
      success: function(res) {
        var userInfo = res.userInfo;
        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', JSON.stringify(userInfo));

        app.login(function(success) {
          wx.hideLoading();
          if (success) {
            self.setData({
              isLogin: true,
              userInfo: app.globalData.userInfo
            });

            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });

            setTimeout(function() {
              self.enterApp();
            }, 800);
          } else {
            wx.showToast({
              title: '登录失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({
          title: '需要授权后使用',
          icon: 'none'
        });
      }
    });
  },

  onGuestLogin: function() {
    var self = this;

    wx.showModal({
      title: '游客模式',
      content: '游客模式下数据只保存在本地，换设备或清缓存后可能丢失。登录微信后可以同步城市、照片和角色卡。',
      confirmText: '继续体验',
      cancelText: '微信登录',
      success: function(res) {
        if (res.confirm) {
          app.globalData.isLogin = true;
          app.globalData.userInfo = {
            nickName: '游客',
            avatarUrl: '/images/avatar.jpg'
          };
          app.globalData.useCloud = false;

          wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));

          self.setData({
            isLogin: true,
            userInfo: app.globalData.userInfo
          });

          wx.showToast({
            title: '已进入游客模式',
            icon: 'none'
          });

          setTimeout(function() {
            self.enterApp();
          }, 800);
        }
      }
    });
  },

  enterApp: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
