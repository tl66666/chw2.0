var app = getApp();
var provinces = require('../../utils/provinces.js').provinces;
var cloudImage = require('../../utils/cloudImage.js');

var CLOUD_BASE = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269';

function getProvinceCoverPath(provinceId) {
  return CLOUD_BASE + '/cities/' + provinceId + '.png';
}

Page({
  data: {
    provinceId: '',
    provinceName: '',
    provinceAbbr: '',
    provinceCover: '',
    isProvinceVisited: false
  },

  onLoad: function(options) {
    this.loadProvince(options && options.provinceId);
  },

  onShow: function() {
    if (this.data.provinceId) this.refreshProvinceState();
  },

  loadProvince: function(provinceId) {
    var province = provinces.filter(function(item) { return item.id === provinceId; })[0];
    if (!province) return;

    this.setData({
      provinceId: province.id,
      provinceName: province.name,
      provinceAbbr: province.abbr || province.name.slice(0, 1),
      provinceCover: '',
      isProvinceVisited: (app.globalData.visitedProvinces || []).indexOf(province.id) !== -1
    });

    var self = this;
    var coverPath = getProvinceCoverPath(province.id);
    cloudImage.resolve(coverPath, function(url) {
      if (self.data.provinceId === province.id) self.setData({ provinceCover: url || '' });
    });
  },

  refreshProvinceState: function() {
    this.setData({
      isProvinceVisited: (app.globalData.visitedProvinces || []).indexOf(this.data.provinceId) !== -1
    });
  },

  toggleProvinceVisit: function() {
    var provinceId = this.data.provinceId;
    if (!provinceId) return;

    var visitedProvinces = (app.globalData.visitedProvinces || []).slice();
    var index = visitedProvinces.indexOf(provinceId);
    if (index === -1) {
      visitedProvinces.push(provinceId);
    } else {
      visitedProvinces.splice(index, 1);
    }

    app.globalData.visitedProvinces = visitedProvinces;
    app.globalData.manualProvinceRecords = true;
    app.saveData();
    app.syncProvinceRecords();
    this.refreshProvinceState();
    wx.showToast({ title: index === -1 ? '省份已点亮' : '已取消点亮', icon: 'success' });
  },

  openCard: function() {
    if (this.data.provinceId) {
      wx.navigateTo({ url: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId });
    }
  }
});
