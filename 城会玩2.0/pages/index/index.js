var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var audioManager = require('../../utils/audio-manager.js').getAudioManager();

// 省份真实经纬度坐标
var provinceCoords = {
  heilongjiang: { lng: 126.5, lat: 48.0 },
  jilin: { lng: 125.5, lat: 43.5 },
  liaoning: { lng: 122.5, lat: 41.0 },
  neimenggu: { lng: 117.0, lat: 44.0 },
  beijing: { lng: 116.4, lat: 39.9 },
  tianjin: { lng: 117.2, lat: 39.1 },
  hebei: { lng: 114.5, lat: 38.0 },
  shanxi: { lng: 112.0, lat: 37.5 },
  shandong: { lng: 118.0, lat: 36.0 },
  jiangsu: { lng: 119.5, lat: 33.0 },
  anhui: { lng: 117.0, lat: 32.0 },
  zhejiang: { lng: 120.0, lat: 29.0 },
  shanghai: { lng: 121.5, lat: 31.2 },
  fujian: { lng: 118.0, lat: 26.0 },
  jiangxi: { lng: 115.5, lat: 27.5 },
  henan: { lng: 113.5, lat: 34.0 },
  hubei: { lng: 112.0, lat: 31.0 },
  hunan: { lng: 112.0, lat: 27.5 },
  guangdong: { lng: 113.5, lat: 23.0 },
  guangxi: { lng: 108.5, lat: 23.5 },
  hainan: { lng: 110.0, lat: 19.0 },
  hongkong: { lng: 114.2, lat: 22.3 },
  macau: { lng: 113.5, lat: 22.2 },
  chongqing: { lng: 106.5, lat: 29.5 },
  sichuan: { lng: 102.5, lat: 30.5 },
  guizhou: { lng: 106.5, lat: 26.5 },
  yunnan: { lng: 102.5, lat: 25.0 },
  xizang: { lng: 88.0, lat: 31.0 },
  shaanxi: { lng: 108.5, lat: 35.5 },
  gansu: { lng: 103.5, lat: 36.0 },
  qinghai: { lng: 96.0, lat: 36.5 },
  ningxia: { lng: 106.0, lat: 37.5 },
  xinjiang: { lng: 85.0, lat: 42.0 },
  taiwan: { lng: 121.0, lat: 23.5 }
};

var hotCities = ['beijing', 'shanghai', 'hangzhou', 'xian', 'chengdu', 'guangzhou', 'nanjing', 'suzhou'];

// 预构建城市ID到省份ID的映射，避免重复循环
var cityToProvinceMap = {};
for (var i = 0; i < cities.length; i++) {
  cityToProvinceMap[cities[i].id] = cities[i].provinceId;
}

// 预构建省份到城市列表的映射
var provinceToCitiesMap = {};
for (var i = 0; i < cities.length; i++) {
  var pid = cities[i].provinceId;
  if (!provinceToCitiesMap[pid]) {
    provinceToCitiesMap[pid] = [];
  }
  provinceToCitiesMap[pid].push(cities[i].id);
}

Page({
  data: {
    visitedCount: 0,
    visitedProvinces: 0,
    photoCount: 0,
    totalCities: cities.length,
    completionRate: 0,
    provinceList: [],
    mapMarkers: [],
    recentCities: [],
    selectedProvince: '',
    selectedProvinceId: ''
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var cityPhotos = app.globalData.cityPhotos || {};

    // 计算已访问省份
    var visitedProvinceIds = [];
    for (var i = 0; i < visitedCities.length; i++) {
      var provinceId = cityToProvinceMap[visitedCities[i]];
      if (provinceId && visitedProvinceIds.indexOf(provinceId) === -1) {
        visitedProvinceIds.push(provinceId);
      }
    }

    // 计算照片数量
    var photoCount = 0;
    var photoKeys = Object.keys(cityPhotos);
    for (var k = 0; k < photoKeys.length; k++) {
      photoCount += cityPhotos[photoKeys[k]].length;
    }

    var completionRate = cities.length > 0 ? Math.round((visitedCities.length / cities.length) * 100) : 0;

    // 构建省份列表和地图标记
    var provinceList = [];
    var mapMarkers = [];

    for (var p = 0; p < provinces.length; p++) {
      var province = provinces[p];
      var coords = provinceCoords[province.id];
      if (!coords) continue;

      var provinceCityIds = provinceToCitiesMap[province.id] || [];
      
      var provincePhotoCount = 0;
      for (var pc = 0; pc < provinceCityIds.length; pc++) {
        if (cityPhotos[provinceCityIds[pc]]) {
          provincePhotoCount += cityPhotos[provinceCityIds[pc]].length;
        }
      }

      var isHot = false;
      for (var h = 0; h < hotCities.length; h++) {
        if (provinceCityIds.indexOf(hotCities[h]) !== -1) {
          isHot = true;
          break;
        }
      }

      var isVisited = visitedProvinceIds.indexOf(province.id) !== -1;

      provinceList.push({
        id: province.id,
        name: province.name,
        visited: isVisited,
        hot: isHot,
        photoCount: provincePhotoCount
      });

      mapMarkers.push({
        id: p + 1,
        latitude: coords.lat,
        longitude: coords.lng,
        title: province.name,
        iconPath: isVisited ? '/images/marker-visited.svg' : '/images/marker-normal.svg',
        width: 24,
        height: 24,
        callout: {
          content: province.name,
          color: '#4A4A4A',
          fontSize: 12,
          borderRadius: 8,
          bgColor: '#FFFFFF',
          padding: 6,
          display: 'BYCLICK',
          borderWidth: 1,
          borderColor: '#F4A6B5'
        }
      });
    }

    // 最近访问的城市
    var recentCities = [];
    var count = Math.min(5, visitedCities.length);
    for (var i = 0; i < count; i++) {
      var cityId = visitedCities[visitedCities.length - 1 - i];
      var cityName = cityId;
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === cityId) {
          cityName = cities[j].name;
          break;
        }
      }
      var photos = cityPhotos[cityId] || [];
      recentCities.push({
        id: cityId,
        name: cityName,
        photoUrl: photos.length > 0 ? photos[photos.length - 1] : '',
        visitDate: this.formatDate(new Date())
      });
    }

    this.setData({
      visitedCount: visitedCities.length,
      visitedProvinces: visitedProvinceIds.length,
      photoCount: photoCount,
      completionRate: completionRate,
      provinceList: provinceList,
      mapMarkers: mapMarkers,
      recentCities: recentCities
    });

    console.log('mapMarkers loaded:', mapMarkers.length);
  },

  formatDate: function(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  },

  onMarkerTap: function(e) {
    var markerId = e.detail.markerId;
    var index = markerId - 1;
    var province = this.data.provinceList[index];
    if (province) {
      this.setData({
        selectedProvince: province.name,
        selectedProvinceId: province.id
      });
      wx.navigateTo({
        url: '/pages/city-detail/city-detail?provinceId=' + province.id
      });
    }
  },

  goToUpload: function() {
    audioManager.play('button_tap');
    wx.navigateTo({ url: '/package-album/pages/upload/upload' });
  },

  goToAlbum: function() {
    audioManager.play('button_tap');
    wx.navigateTo({ url: '/package-album/pages/album/album' });
  },

  goToCityDetail: function(e) {
    audioManager.play('page_navigate');
    var cityId = e.currentTarget.dataset.cityid;
    wx.navigateTo({ url: '/pages/city-detail/city-detail?cityId=' + cityId });
  },

  shareMap: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onRecentImageError: function(e) {
    var index = e.currentTarget.dataset.index;
    var recentCities = this.data.recentCities;
    if (recentCities[index]) {
      recentCities[index].photoUrl = '';
      this.setData({ recentCities: recentCities });
    }
  },

  onShareAppMessage: function() {
    var visitedCount = this.data.visitedCount;
    var visitedProvinces = this.data.visitedProvinces;
    return {
      title: '我已点亮 ' + visitedCount + ' 座城市，足迹遍布 ' + visitedProvinces + ' 个省份！',
      path: '/pages/index/index'
    };
  }
});
