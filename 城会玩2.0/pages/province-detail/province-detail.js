var app = getApp();
var cities = require('../../utils/cities.js').cities;
var provinces = require('../../utils/provinces.js').provinces;
var groupView = require('../../utils/group-view.js');

Page({
  data: {
    provinceId: '',
    provinceName: '',
    totalCities: 0,
    visitedCities: 0,
    completionRate: 0,
    photoCount: 0,
    cities: []
  },

  onLoad: function(options) {
    this.loadProvince(options && options.provinceId);
  },

  onShow: function() {
    if (this.data.provinceId) this.loadProvince(this.data.provinceId);
  },

  loadProvince: function(provinceId) {
    if (!provinceId) return;
    var province = null;
    for (var p = 0; p < provinces.length; p++) {
      if (provinces[p].id === provinceId) {
        province = provinces[p];
        break;
      }
    }
    if (!province) return;

    var visitedIds = groupView.mergeCityIds(app.globalData.visitedCities || []);
    var localVisitedIds = app.globalData.visitedCities || [];
    var travelPhotos = app.globalData.cityTravelPhotos || {};
    var foodPhotos = app.globalData.cityFoodPhotos || {};
    var legacyPhotos = app.globalData.cityPhotos || {};
    var groupPhotos = groupView.getAllPhotos();
    var list = [];
    var photoCount = 0;

    for (var i = 0; i < cities.length; i++) {
      var city = cities[i];
      if (city.provinceId !== provinceId) continue;
      var count = (travelPhotos[city.id] || []).length + (foodPhotos[city.id] || []).length + (legacyPhotos[city.id] || []).length;
      for (var gp = 0; gp < groupPhotos.length; gp++) {
        if (groupPhotos[gp].cityId === city.id) count++;
      }
      photoCount += count;
      var recorded = visitedIds.indexOf(city.id) !== -1;
      list.push({
        id: city.id,
        name: city.name,
        landmark: city.landmark || '',
        photoCount: count,
        recorded: recorded,
        sourceText: localVisitedIds.indexOf(city.id) !== -1 ? '我的打卡' : (recorded ? '小队足迹' : '待探索')
      });
    }

    list.sort(function(a, b) {
      if (a.recorded !== b.recorded) return a.recorded ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    var visitedCount = list.filter(function(city) { return city.recorded; }).length;
    this.setData({
      provinceId: provinceId,
      provinceName: province.name,
      totalCities: list.length,
      visitedCities: visitedCount,
      completionRate: list.length ? Math.round((visitedCount / list.length) * 100) : 0,
      photoCount: photoCount,
      cities: list
    });
  },

  openCity: function(e) {
    var cityId = e.currentTarget.dataset.cityid;
    if (!cityId) return;
    wx.navigateTo({ url: '/pages/city-detail/city-detail?cityId=' + cityId });
  },

  openCard: function() {
    if (!this.data.provinceId) return;
    wx.navigateTo({ url: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId });
  }
});
