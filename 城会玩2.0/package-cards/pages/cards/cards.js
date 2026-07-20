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
    progressPercent: 0,
    visibleCount: 34,
    selectedRarity: 'all',
    ownedOnly: false
  },

  onLoad: function() {
  },

  onShow: function() {
    this.loadCards();
  },

  deriveVisitedProvinces: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var storedProvinces = app.globalData.visitedProvinces || [];
    var visitedProvinces = storedProvinces.slice();
    var citiesData = require('../../../utils/cities.js');
    var cities = citiesData.cities;

    try {
      var cached = wx.getStorageSync('visitedProvinces');
      if (cached) {
        var cachedList = typeof cached === 'string' ? JSON.parse(cached) : cached;
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
    } catch (e2) {
      console.error('save visitedProvinces failed:', e2);
    }

    return visitedProvinces;
  },

  getProvinceShort: function(province) {
    if (!province || !province.name) return '城';
    return province.name.replace('特别行政区', '').replace('自治区', '').replace('省', '').replace('市', '').slice(0, 2);
  },

  countVisibleCards: function(cards, rarity, ownedOnly) {
    var count = 0;
    for (var i = 0; i < cards.length; i++) {
      if ((rarity === 'all' || cards[i].rarity === rarity) && (!ownedOnly || cards[i].isCollected)) {
        count++;
      }
    }
    return count;
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

      if (isCollected) collectedCount++;
      cloudPaths.push(cloudPath);

      cards.push({
        provinceId: province.id,
        provinceName: province.name,
        provinceShort: this.getProvinceShort(province),
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
        imagePath: ''
      });
    }

    this.setData({
      cards: cards,
      collectedCount: collectedCount,
      progressPercent: Math.round((collectedCount / provinces.length) * 100),
      visibleCount: this.countVisibleCards(cards, this.data.selectedRarity, this.data.ownedOnly)
    });

    this.loadCloudImages(cloudPaths);
  },

  loadCloudImages: function(cloudPaths) {
    var self = this;
    var token = (this.cardLoadToken || 0) + 1;
    var nextIndex = 0;
    this.cardLoadToken = token;

    function applyBatch(paths, done) {
      if (!paths.length || self.cardLoadToken !== token) {
        if (done) done();
        return;
      }
      cloudImage.resolveMany(paths, function(urlMap) {
        if (self.cardLoadToken !== token) return;
        var newCards = self.data.cards.slice();
        for (var i = 0; i < newCards.length; i++) {
          var resolvedUrl = urlMap[newCards[i].cloudPath];
          if (resolvedUrl) newCards[i].imagePath = resolvedUrl;
        }
        self.setData({ cards: newCards });
        if (done) done();
      });
    }

    function loadNextBatch() {
      if (self.cardLoadToken !== token) return;
      var nextPaths = cloudPaths.slice(nextIndex, nextIndex + 8);
      nextIndex += nextPaths.length;
      if (!nextPaths.length) return;
      applyBatch(nextPaths, function() {
        if (nextIndex < cloudPaths.length) setTimeout(loadNextBatch, 180);
      });
    }

    var initialPaths = cloudPaths.slice(0, 8);
    nextIndex = initialPaths.length;
    applyBatch(initialPaths, function() {
      if (nextIndex < cloudPaths.length) setTimeout(loadNextBatch, 180);
    });
  },

  filterByRarity: function(e) {
    var rarity = e.currentTarget.dataset.rarity;
    this.setData({
      selectedRarity: rarity,
      visibleCount: this.countVisibleCards(this.data.cards, rarity, this.data.ownedOnly)
    });
  },

  toggleOwnedOnly: function() {
    var ownedOnly = !this.data.ownedOnly;
    this.setData({
      ownedOnly: ownedOnly,
      visibleCount: this.countVisibleCards(this.data.cards, this.data.selectedRarity, ownedOnly)
    });
  },

  onCardImageError: function(e) {
    var provinceId = e.currentTarget.dataset.id;
    var cards = this.data.cards.slice();
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].provinceId === provinceId) {
        cards[i].imagePath = '';
        break;
      }
    }
    this.setData({ cards: cards });
  },

  goToCardDetail: function(e) {
    var provinceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/package-cards/pages/card-detail/card-detail?provinceId=' + provinceId
    });
  }
});
