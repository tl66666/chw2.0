var app = getApp();
var citiesData = require('../../../utils/cities.js');
var cities = citiesData.cities;

Page({
  data: {
    totalPhotos: 0,
    travelPhotoCount: 0,
    foodPhotoCount: 0,
    visitedCount: 0,
    visitedCities: [],
    selectedCity: '',
    activeTab: 'all',
    allPhotos: [],
    displayPhotos: []
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};

    // 计算统计数据
    var travelPhotoCount = 0;
    var foodPhotoCount = 0;
    var cityList = [];
    var allPhotos = [];

    for (var i = 0; i < visitedCities.length; i++) {
      var cityId = visitedCities[i];
      var cityName = cityId;
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === cityId) {
          cityName = cities[j].name;
          break;
        }
      }

      // 获取旅游照片
      var travelPhotos = cityTravelPhotos[cityId] || [];
      // 兼容旧数据
      var oldPhotos = cityPhotos[cityId] || [];
      if (oldPhotos.length > 0 && travelPhotos.length === 0) {
        travelPhotos = oldPhotos;
      }

      // 获取美食照片
      var foodPhotos = cityFoodPhotos[cityId] || [];

      // 只将有照片的城市加入筛选列表
      var cityPhotoCount = travelPhotos.length + foodPhotos.length;

      if (cityPhotoCount > 0) {
        cityList.push({
          id: cityId,
          name: cityName,
          photoCount: cityPhotoCount
        });
      }

      travelPhotoCount += travelPhotos.length;
      foodPhotoCount += foodPhotos.length;

      // 添加旅游照片
      for (var k = 0; k < travelPhotos.length; k++) {
        allPhotos.push({
          url: travelPhotos[k],
          cityId: cityId,
          cityName: cityName,
          type: 'travel',
          typeText: '旅行',
          date: this.formatDate(new Date()),
          index: k
        });
      }

      // 添加美食照片
      for (var m = 0; m < foodPhotos.length; m++) {
        allPhotos.push({
          url: foodPhotos[m],
          cityId: cityId,
          cityName: cityName,
          type: 'food',
          typeText: '美食',
          date: this.formatDate(new Date()),
          index: m
        });
      }
    }

    this.setData({
      totalPhotos: travelPhotoCount + foodPhotoCount,
      travelPhotoCount: travelPhotoCount,
      foodPhotoCount: foodPhotoCount,
      visitedCount: visitedCities.length,
      visitedCities: cityList,
      selectedCity: '',
      activeTab: 'all',
      allPhotos: allPhotos,
      displayPhotos: allPhotos
    });
  },

  formatDate: function(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterPhotos();
  },

  filterByCity: function(e) {
    var cityId = e.currentTarget.dataset.city;

    this.setData({
      selectedCity: cityId
    });

    this.filterPhotos();
  },

  filterPhotos: function() {
    var activeTab = this.data.activeTab;
    var selectedCity = this.data.selectedCity;
    var allPhotos = this.data.allPhotos;
    var filtered = [];

    for (var i = 0; i < allPhotos.length; i++) {
      var photo = allPhotos[i];
      var typeMatch = activeTab === 'all' || photo.type === activeTab;
      var cityMatch = selectedCity === '' || photo.cityId === selectedCity;

      if (typeMatch && cityMatch) {
        filtered.push(photo);
      }
    }

    this.setData({
      displayPhotos: filtered
    });
  },

  previewPhoto: function(e) {
    var url = e.currentTarget.dataset.url;
    var urls = [];
    for (var i = 0; i < this.data.displayPhotos.length; i++) {
      urls.push(this.data.displayPhotos[i].url);
    }

    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  goToUpload: function() {
    wx.navigateTo({
      url: '/package-album/pages/upload/upload'
    });
  }
});
