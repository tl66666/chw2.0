var app = getApp();
var provincesData = require('../../utils/provinces.js');
var charactersData = require('../../utils/characters.js');
var provinces = provincesData.provinces;
var cloudImage = require('../../utils/cloudImage.js');
var audioManager = require('../../utils/audio-manager.js').getAudioManager();

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
    this.loadCards();
  },

  onShow: function() {
    this.loadCards();
  },

  deriveVisitedProvinces: function() {
    var storedProvinces = app.globalData.visitedProvinces || [];
    var visitedProvinces = storedProvinces.slice();

    app.globalData.visitedProvinces = visitedProvinces;
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
    cloudImage.resolveMany(cloudPaths, function(urlMap) {
      var newCards = self.data.cards.slice();
      for (var i = 0; i < newCards.length; i++) {
        var resolvedUrl = urlMap[newCards[i].cloudPath];
        if (resolvedUrl) {
          newCards[i].imagePath = resolvedUrl;
        }
      }
      self.setData({ cards: newCards });
    });
  },

  filterByRarity: function(e) {
    audioManager.play('button_tap');
    var rarity = e.currentTarget.dataset.rarity;
    this.setData({
      selectedRarity: rarity,
      visibleCount: this.countVisibleCards(this.data.cards, rarity, this.data.ownedOnly)
    });
  },

  toggleOwnedOnly: function() {
    audioManager.play('button_tap');
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
    audioManager.play('page_navigate');
    var provinceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/package-cards/pages/card-detail/card-detail?provinceId=' + provinceId
    });
  },

  navigateToDetail: function(e) {
    this.goToCardDetail(e);
  },

  onShareAppMessage: function() {
    return {
      title: '我的旅行角色卡图鉴 - 城会玩2.0',
      path: '/pages/cards/cards'
    };
  }
});
