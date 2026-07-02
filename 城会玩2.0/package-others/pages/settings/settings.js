var app = getApp();

Page({
  data: {
    isDarkMode: false,
    showProvinceName: true,
    showCityCount: true,
    enableNotification: true,
    cacheSize: '0 KB',
    version: '1.0.0'
  },

  onLoad: function() {
    var isDark = wx.getStorageSync('darkMode') || false;
    var showProvince = wx.getStorageSync('showProvinceName');
    var showCity = wx.getStorageSync('showCityCount');
    var notify = wx.getStorageSync('enableNotification');

    this.setData({
      isDarkMode: isDark,
      showProvinceName: showProvince !== false,
      showCityCount: showCity !== false,
      enableNotification: notify !== false
    });

    this.calcCacheSize();
  },

  onShow: function() {
    this.calcCacheSize();
  },

  calcCacheSize: function() {
    var self = this;
    wx.getStorageInfo({
      success: function(res) {
        var size = res.currentSize;
        if (size < 1024) {
          self.setData({ cacheSize: size + ' KB' });
        } else {
          self.setData({ cacheSize: (size / 1024).toFixed(1) + ' MB' });
        }
      }
    });
  },

  // 切换主题
  toggleTheme: function(e) {
    var isDark = e.detail.value;
    wx.setStorageSync('darkMode', isDark);
    this.setData({ isDarkMode: isDark });
    wx.showToast({ title: isDark ? '已切换为深色模式' : '已切换为浅色模式', icon: 'none' });
  },

  // 切换显示省份名
  toggleProvinceName: function(e) {
    var value = e.detail.value;
    wx.setStorageSync('showProvinceName', value);
    this.setData({ showProvinceName: value });
  },

  // 切换显示城市数
  toggleCityCount: function(e) {
    var value = e.detail.value;
    wx.setStorageSync('showCityCount', value);
    this.setData({ showCityCount: value });
  },

  // 切换通知
  toggleNotification: function(e) {
    var value = e.detail.value;
    wx.setStorageSync('enableNotification', value);
    this.setData({ enableNotification: value });
    wx.showToast({ title: value ? '通知已开启' : '通知已关闭', icon: 'none' });
  },

  // 清除缓存
  clearCache: function() {
    var self = this;
    wx.showModal({
      title: '清除旅行数据',
      content: '确定要清除所有旅行记录吗？本地和云端数据都会被删除，此操作不可恢复。',
      confirmColor: '#F44336',
      success: function(res) {
        if (res.confirm) {
          // 清除本地旅行数据，但保留登录信息和设置
          var removeKeys = ['visitedCities', 'visitedProvinces', 'visitDates', 'cityPhotos', 'cityTravelPhotos', 'cityFoodPhotos', 'cityNotes', 'myGroup'];
          for (var i = 0; i < removeKeys.length; i++) {
            try { wx.removeStorageSync(removeKeys[i]); } catch (e) {}
          }
          // 清除 globalData
          if (app.globalData) {
            app.globalData.visitedCities = [];
            app.globalData.visitedProvinces = [];
            app.globalData.visitDates = {};
            app.globalData.cityPhotos = {};
            app.globalData.cityTravelPhotos = {};
            app.globalData.cityFoodPhotos = {};
            app.globalData.cityNotes = {};
          }
          // 清除云端数据
          if (wx.cloud && app.globalData.isLogin) {
            wx.cloud.callFunction({
              name: 'syncData',
              data: { action: 'clearAllData' },
              timeout: 8000
            }).then(function(res) {
              console.log('[settings] 云端数据已清除', res.result);
            }).catch(function(err) {
              console.warn('[settings] 云端清除失败:', err);
            });
          }
          self.setData({ cacheSize: '0 KB' });
          wx.showToast({ title: '数据已清除', icon: 'success' });
        }
      }
    });
  },

  // 关于我们
  aboutUs: function() {
    wx.showModal({
      title: '关于城会玩2.0',
      content: '版本：v2.0.0\n\n点亮城市，收集旅行角色卡。\n\n城会玩2.0是一款城市探索小程序，支持点亮中国地图、解锁地域角色卡、管理旅行相册，并和朋友共享探索进度。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 用户协议
  showAgreement: function() {
    wx.showModal({
      title: '用户协议',
      content: '1. 本小程序仅供个人旅行记录使用\n2. 用户上传的照片仅保存在本地\n3. 群组功能需登录后使用\n4. 我们不会收集您的个人隐私数据',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 隐私政策
  showPrivacy: function() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私：\n\n• 您的数据默认保存在手机本地\n• 登录后数据同步至云存储\n• 我们不会与第三方共享数据\n• 您可以随时删除账号和数据',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  logout: function() {
    var self = this;
    wx.showModal({
      title: '退出登录',
      content: '退出后数据仍保存在本地，重新登录后可恢复。确定退出吗？',
      confirmColor: '#F44336',
      success: function(res) {
        if (res.confirm) {
          app.globalData.isLogin = false;
          app.globalData.userInfo = null;
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('openid');

          wx.reLaunch({
            url: '/pages/launch/launch'
          });
        }
      }
    });
  }
});
