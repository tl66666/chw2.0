var provincesData = require('../../../utils/provinces.js');
var charactersData = require('../../../utils/characters.js');
var cloudImage = require('../../../utils/cloudImage.js');

Page({
  data: {
    provinceId: '',
    province: null,
    provinceShort: '城',
    character: null,
    cardImage: '',
    rarityColor: '#9B9B9B',
    totalScore: 0,
    isUnlocked: false
  },

  onLoad: function(options) {
    this.loadDetail(options.provinceId || '');
  },

  loadDetail: function(provinceId) {
    var province = provincesData.getProvinceById(provinceId);
    if (!province) {
      wx.showToast({ title: '角色卡不存在', icon: 'none' });
      return;
    }

    var character = charactersData.getCharacter(provinceId);
    var rarityColor = charactersData.getRarityColor(character.rarity);
    var attrs = character.attributes || {};
    var totalScore = Math.round(((attrs.culture || 0) + (attrs.fashion || 0) + (attrs.food || 0) + (attrs.history || 0)) / 4);
    var cloudPath = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269/cards/' + provinceId + '.png';
    var self = this;

    this.setData({
      provinceId: provinceId,
      province: province,
      provinceShort: this.getProvinceShort(province),
      character: character,
      rarityColor: rarityColor,
      totalScore: totalScore,
      isUnlocked: this.checkUnlocked(provinceId),
      cardImage: ''
    });

    cloudImage.resolve(cloudPath, function(imageUrl) {
      if (imageUrl) {
        self.setData({ cardImage: imageUrl });
      }
    });
  },

  checkUnlocked: function(provinceId) {
    var app = getApp();
    var visitedProvinces = app.globalData.visitedProvinces || [];

    try {
      var cached = wx.getStorageSync('visitedProvinces');
      var cachedList = typeof cached === 'string' ? JSON.parse(cached || '[]') : cached;
      if (Array.isArray(cachedList)) {
        visitedProvinces = visitedProvinces.concat(cachedList);
      }
    } catch (e) {}

    if (visitedProvinces.indexOf(provinceId) !== -1) {
      return true;
    }

    var visitedCities = app.globalData.visitedCities || [];
    var citiesData = require('../../../utils/cities.js');
    var cities = citiesData.cities;
    for (var i = 0; i < visitedCities.length; i++) {
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === visitedCities[i] && cities[j].provinceId === provinceId) {
          return true;
        }
      }
    }
    return false;
  },

  getProvinceShort: function(province) {
    if (!province || !province.name) return '城';
    return province.name.replace('特别行政区', '').replace('自治区', '').replace('省', '').replace('市', '').slice(0, 2);
  },

  onCardImageError: function() {
    this.setData({ cardImage: '' });
  },

  goBack: function() {
    wx.navigateBack({
      fail: function() {
        wx.switchTab({ url: '/pages/cards/cards' });
      }
    });
  },

  goToMap: function() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage: function() {
    var provinceName = this.data.province ? this.data.province.name : '';
    return {
      title: '查看 ' + provinceName + ' 的旅行角色卡',
      path: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId
    };
  }
});
