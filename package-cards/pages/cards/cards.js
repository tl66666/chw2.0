var app = getApp();
var provincesData = require('../../../utils/provinces.js');
var charactersData = require('../../../utils/characters.js');
var provinces = provincesData.provinces;
var cloudImage = require('../../../utils/cloudImage.js');

Page({
  data: {
    cards: [],
    collectedCount: 0,
    totalCount: 34,
    selectedRarity: 'all',
    ownedOnly: false
  },

  onLoad: function() {
    this.loadCards();
  },

  onShow: function() {
    this.loadCards();
  },

  // 从visitedCities派生visitedProvinces
  deriveVisitedProvinces: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var storedProvinces = app.globalData.visitedProvinces || [];
    var visitedProvinces = storedProvinces.slice();
    var citiesData = require('../../../utils/cities.js');
    var cities = citiesData.cities;

    try {
      var cached = wx.getStorageSync('visitedProvinces');
      if (cached) {
        var cachedList = JSON.parse(cached);
        if (Array.isArray(cachedList)) {
          for (var c = 0; c < cachedList.length; c++) {
            if (visitedProvinces.indexOf(cachedList[c]) === -1) {
              visitedProvinces.push(cachedList[c]);
            }
          }
        }
      }
    } catch (e) {
      console.warn('read visitedProvinces cache failed:', e);
    }

    for (var i = 0; i < visitedCities.length; i++) {
      var cityId = visitedCities[i];
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === cityId) {
          var provinceId = cities[j].provinceId;
          if (visitedProvinces.indexOf(provinceId) === -1) {
            visitedProvinces.push(provinceId);
          }
          break;
        }
      }
    }

    app.globalData.visitedProvinces = visitedProvinces;
    try {
      wx.setStorageSync('visitedProvinces', JSON.stringify(visitedProvinces));
    } catch (e) {
      console.error('save visitedProvinces failed:', e);
    }

    return visitedProvinces;
  },

  loadCards: function() {
    var visitedProvinces = this.deriveVisitedProvinces();
    var cards = [];
    var collectedCount = 0;
    var cloudPaths = [];

    for (var i = 0; i < provinces.length; i++) {
      var province = provinces[i];
      var character = charactersData.getCharacter(province.id);
      var rarityColor = charactersData.getRarityColor(character.rarity);
      var isCollected = visitedProvinces.indexOf(province.id) !== -1;
      var cloudPath = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269/cards/' + province.id + '.png';

      if (isCollected) {
        collectedCount++;
      }

      cloudPaths.push(cloudPath);
      cards.push({
        provinceId: province.id,
        provinceName: province.name,
        name: character.name,
        title: character.title,
        rarity: character.rarity,
        skill: character.skill,
        description: character.description,
        quote: character.quote,
        attributes: character.attributes,
        rarityColor: rarityColor,
        isCollected: isCollected,
        cloudPath: cloudPath,
        imagePath: '/images/ui/loading-bg.jpg'
      });
    }

    this.setData({
      cards: cards,
      collectedCount: collectedCount
    });

    this.loadCloudImages(cards, cloudPaths);
  },

  // 批量获取云存储图片临时链接
  loadCloudImages: function(cards, cloudPaths) {
    var self = this;
    cloudImage.resolveMany(cloudPaths, function(urlMap) {
      var newCards = self.data.cards.slice();
      for (var i = 0; i < newCards.length; i++) {
        var resolvedUrl = urlMap[newCards[i].cloudPath];
        if (resolvedUrl) {
          newCards[i].imagePath = resolvedUrl;
        }
      }
      self.setData({
        cards: newCards
      });
    });
  },

  getCitiesInProvince: function(provinceId) {
    var citiesData = require('../../../utils/cities.js');
    var cities = citiesData.cities;
    var result = [];
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].provinceId === provinceId) {
        result.push(cities[i]);
      }
    }
    return result;
  },

  filterByRarity: function(e) {
    var rarity = e.currentTarget.dataset.rarity;
    this.setData({
      selectedRarity: rarity
    });
  },

  toggleOwnedOnly: function() {
    this.setData({
      ownedOnly: !this.data.ownedOnly
    });
  },

  goToCardDetail: function(e) {
    var provinceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/package-cards/pages/card-detail/card-detail?provinceId=' + provinceId
    });
  }
});
