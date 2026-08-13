var app = getApp();
var provinces = require('../../utils/provinces.js').provinces;
var imageConfig = require('../../utils/image-config.js');
var provinceGuides = require('../../utils/province-guides.js');

Page({
  data: {
    provinceId: '',
    provinceName: '',
    provinceAbbr: '',
    provinceCover: '',
    isProvinceVisited: false,
    landmarks: [],
    provinceGuide: null,
    guideStartName: ''
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
    var guideData = provinceGuides.getProvinceGuide(province.id);

    this.setData({
      provinceId: province.id,
      provinceName: province.name,
      provinceAbbr: province.abbr || province.name.slice(0, 1),
      provinceCover: '',
      isProvinceVisited: (app.globalData.visitedProvinces || []).indexOf(province.id) !== -1,
      landmarks: provinceGuides.getProvinceLandmarks(province.id),
      provinceGuide: guideData.guide,
      guideStartName: guideData.startName
    });

    var self = this;
    var coverUrl = imageConfig.getCityImage(province.id);
    if (self.data.provinceId === province.id) self.setData({ provinceCover: coverUrl });
  },

  refreshProvinceState: function() {
    this.setData({
      isProvinceVisited: (app.globalData.visitedProvinces || []).indexOf(this.data.provinceId) !== -1
    });
  },

  toggleProvinceVisit: function() {
    var provinceId = this.data.provinceId;
    if (!provinceId) return;

    if (this.data.isProvinceVisited) {
      this.openCard();
      return;
    }
    this.openUnlockCard();
  },

  openUnlockCard: function() {
    if (this.data.provinceId) {
      wx.navigateTo({ url: '/package-cards/pages/unlock-card/unlock-card?provinceId=' + this.data.provinceId + '&fromMap=true' });
    }
  },

  openCard: function() {
    if (this.data.provinceId) {
      wx.navigateTo({ url: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId });
    }
  }
});
