var app = getApp();
var cities = require('../../utils/cities.js').cities;
var provinces = require('../../utils/provinces.js').provinces;
var groupView = require('../../utils/group-view.js');
var cloudImage = require('../../utils/cloudImage.js');

var CLOUD_BASE = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269';

function getProvinceCoverPath(provinceId) {
  return CLOUD_BASE + '/cities/' + provinceId + '.png';
}

function splitLandmarks(value) {
  return String(value || '').split(/\s*[\/,，、]\s*/).filter(function(item) {
    return item.trim();
  });
}

function getPhotoReference(photo) {
  if (!photo) return '';
  if (typeof photo === 'string') return photo;
  return photo.fileId || photo.url || photo.displayUrl || photo.localPath || '';
}

Page({
  data: {
    provinceId: '',
    provinceName: '',
    provinceCover: '',
    provinceAbbr: '',
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
    var province = provinces.filter(function(item) { return item.id === provinceId; })[0];
    if (!province) return;

    var visitedIds = groupView.mergeCityIds(app.globalData.visitedCities || []);
    var localVisitedIds = app.globalData.visitedCities || [];
    var travelPhotos = app.globalData.cityTravelPhotos || {};
    var foodPhotos = app.globalData.cityFoodPhotos || {};
    var legacyPhotos = app.globalData.cityPhotos || {};
    var groupPhotos = groupView.getAllPhotos();
    var list = [];
    var photoCount = 0;

    cities.forEach(function(city) {
      if (city.provinceId !== provinceId) return;

      var photos = (travelPhotos[city.id] || []).concat(foodPhotos[city.id] || [], legacyPhotos[city.id] || []);
      groupPhotos.forEach(function(photo) {
        if (photo.cityId === city.id) photos.push(photo);
      });

      var landmarkParts = splitLandmarks(city.landmark);
      var photoUrl = getPhotoReference(photos[0]);
      var recorded = visitedIds.indexOf(city.id) !== -1;
      photoCount += photos.length;
      list.push({
        id: city.id,
        name: city.name,
        photoCount: photos.length,
        photoRef: photoUrl,
        photoUrl: photoUrl && photoUrl.indexOf('cloud://') !== 0 ? photoUrl : '',
        recorded: recorded,
        sourceText: localVisitedIds.indexOf(city.id) !== -1 ? '我的足迹' : (recorded ? '小队足迹' : '等待出发'),
        primaryLandmark: landmarkParts[0] || '城市漫游',
        landmarks: landmarkParts.slice(1, 3)
      });
    });

    list.sort(function(a, b) {
      if ((b.photoCount > 0) !== (a.photoCount > 0)) return b.photoCount > 0 ? 1 : -1;
      if (a.recorded !== b.recorded) return a.recorded ? -1 : 1;
      return a.name.localeCompare(b.name, 'zh-Hans-CN');
    });

    var visitedCount = list.filter(function(city) { return city.recorded; }).length;
    this.setData({
      provinceId: provinceId,
      provinceName: province.name,
      provinceAbbr: province.abbr || province.name.slice(0, 1),
      provinceCover: '',
      totalCities: list.length,
      visitedCities: visitedCount,
      completionRate: list.length ? Math.round((visitedCount / list.length) * 100) : 0,
      photoCount: photoCount,
      cities: list
    });
    this.resolveImages(getProvinceCoverPath(provinceId), list);
  },

  resolveImages: function(coverPath, cityList) {
    var self = this;
    var imageRefs = [coverPath];
    cityList.forEach(function(city) {
      if (city.photoRef) imageRefs.push(city.photoRef);
    });
    cloudImage.resolveMany(imageRefs, function(urlMap) {
      var citiesWithPhotos = (self.data.cities || []).map(function(city) {
        if (city.photoRef && urlMap[city.photoRef]) city.photoUrl = urlMap[city.photoRef];
        return city;
      });
      self.setData({
        provinceCover: urlMap[coverPath] || '',
        cities: citiesWithPhotos
      });
    });
  },

  openCity: function(e) {
    var cityId = e.currentTarget.dataset.cityid;
    if (cityId) wx.navigateTo({ url: '/pages/city-detail/city-detail?cityId=' + cityId });
  },

  openCard: function() {
    if (this.data.provinceId) {
      wx.navigateTo({ url: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId });
    }
  }
});
