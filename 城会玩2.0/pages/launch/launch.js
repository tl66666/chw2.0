var app = getApp();

Page({
  data: {
    showStats: false,
    showFeatures: false
  },

  onLoad: function() {
    var self = this;
    setTimeout(function() {
      self.setData({ showStats: true });
    }, 450);

    setTimeout(function() {
      self.setData({ showFeatures: true });
    }, 760);
  },

  enterApp: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  goProfileLogin: function() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  }
});
