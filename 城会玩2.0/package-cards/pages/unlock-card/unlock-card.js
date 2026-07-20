var achievementsModule = require('../../../utils/achievements.js');
var provincesData = require('../../../utils/provinces.js');
var charactersData = require('../../../utils/characters.js');
var cloudImage = require('../../../utils/cloudImage.js');
var audioManager = require('../../../utils/audio-manager.js').getAudioManager();

Page({
  data: {
    provinceId: '',
    provinceName: '',
    provinceShort: '城市',
    fromMap: false,
    cardImage: '',
    character: null,
    rarity: 'R',
    rarityColor: '#9B9B9B',
    unlockText: '',
    phase: 0,
    cardFlipped: false,
    screenShake: false,
    showGlow: false,
    showParticles: false,
    showRarityBadge: false,
    showAttrs: false,
    showSkill: false,
    showDesc: false,
    showQuote: false,
    showAchievementPopup: false,
    newAchievement: {}
  },

  onLoad: function(options) {
    var provinceId = options.provinceId || '';
    var province = provincesData.getProvinceById(provinceId);
    if (!province) return;

    var character = charactersData.getCharacter(provinceId);
    var self = this;
    this.setData({
      provinceId: provinceId,
      provinceName: province.name,
      provinceShort: this.getProvinceShort(province),
      fromMap: options.fromMap === 'true',
      character: character,
      rarity: character.rarity,
      rarityColor: charactersData.getRarityColor(character.rarity)
    });

    cloudImage.resolve(
      'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269/cards/' + provinceId + '.png',
      function(imageUrl) {
        self.setData({ cardImage: imageUrl || '' });
        self.startUnlockSequence();
      }
    );
  },

  getProvinceShort: function(province) {
    if (!province || !province.name) return '城市';
    return province.name
      .replace('特别行政区', '')
      .replace('自治区', '')
      .replace('省', '')
      .replace('市', '')
      .slice(0, 2);
  },

  onCardImageError: function() {
    this.setData({ cardImage: '' });
  },

  startUnlockSequence: function() {
    var self = this;
    var rarity = this.data.character.rarity;
    this.setData({
      phase: 1,
      unlockText: '正在翻开 ' + this.data.provinceName + ' 的旅行卡...'
    });
    audioManager.play('card_flip_start');

    setTimeout(function() {
      if (self.data.phase === 1) self.setData({ unlockText: '正在收集旅行记忆...' });
    }, 550);

    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({ phase: 2, showGlow: true, unlockText: '即将揭晓...' });
    }, 1050);

    setTimeout(function() {
      if (self.data.phase !== 2) return;
      self.setData({
        phase: 3,
        showParticles: rarity === 'SSR' || rarity === 'UR',
        unlockText: ''
      });
      audioManager.play('card_flip_reveal');
      setTimeout(function() { self.setData({ cardFlipped: true }); }, 120);
      setTimeout(function() { self.setData({ showRarityBadge: true }); }, 480);
    }, 1550);

    setTimeout(function() {
      if (self.data.phase !== 3) return;
      var rarityText = { R: '普通', SR: '稀有', SSR: '超稀有', UR: '传说' }[rarity] || '旅行';
      self.setData({
        phase: 4,
        showAttrs: true,
        unlockText: '获得 ' + rarityText + ' 角色卡！'
      });
      audioManager.play({ R: 'rarity_r', SR: 'rarity_sr', SSR: 'rarity_ssr', UR: 'rarity_ur' }[rarity] || 'rarity_r');
      self.saveUnlockRecord();
      self.checkNewAchievements();
      setTimeout(function() { self.setData({ showSkill: true }); }, 250);
      setTimeout(function() { self.setData({ showDesc: true }); }, 500);
      setTimeout(function() { self.setData({ showQuote: true }); }, 750);
      setTimeout(function() { self.setData({ phase: 5 }); }, 360);
    }, 2250);
  },

  saveUnlockRecord: function() {
    var app = getApp();
    var provinceId = this.data.provinceId;
    var rarity = this.data.rarity;
    var visitedProvinces = app.globalData.visitedProvinces || [];
    if (visitedProvinces.indexOf(provinceId) !== -1) return;

    visitedProvinces.push(provinceId);
    app.globalData.visitedProvinces = visitedProvinces;
    app.globalData.cardCount = (app.globalData.cardCount || 0) + 1;
    if (rarity === 'SSR') app.globalData.ssrCount = (app.globalData.ssrCount || 0) + 1;
    if (rarity === 'UR') app.globalData.urCount = (app.globalData.urCount || 0) + 1;
    if (app.saveData) app.saveData();
  },

  getStats: function() {
    var app = getApp();
    var travel = app.globalData.cityTravelPhotos || {};
    var food = app.globalData.cityFoodPhotos || {};
    var legacy = app.globalData.cityPhotos || {};
    var photoCount = 0;
    var foodPhotoCount = 0;
    Object.keys(travel).forEach(function(key) { photoCount += travel[key].length; });
    Object.keys(legacy).forEach(function(key) { photoCount += legacy[key].length; });
    Object.keys(food).forEach(function(key) {
      foodPhotoCount += food[key].length;
      photoCount += food[key].length;
    });
    return {
      visitedCount: (app.globalData.visitedCities || []).length,
      visitedProvinces: (app.globalData.visitedProvinces || []).length,
      photoCount: photoCount,
      foodPhotoCount: foodPhotoCount,
      ssrCount: app.globalData.ssrCount || 0,
      urCount: app.globalData.urCount || 0,
      cardCount: app.globalData.cardCount || 0,
      nightVisit: app.globalData.nightVisit || false,
      earlyVisit: app.globalData.earlyVisit || false,
      dailyVisit: app.globalData.dailyVisit || 0,
      shareCount: app.globalData.shareCount || 0,
      noteCount: app.globalData.noteCount || 0,
      weekStreak: app.globalData.weekStreak || 0,
      monthStreak: app.globalData.monthStreak || 0,
      hasAllRarity: app.globalData.hasAllRarity || false
    };
  },

  checkNewAchievements: function() {
    var app = getApp();
    var unlockedIds = wx.getStorageSync('unlockedAchievements') || [];
    var newList = achievementsModule.checkNewAchievements(this.getStats(), unlockedIds);
    if (!newList.length) return;

    newList.forEach(function(achievement) {
      if (unlockedIds.indexOf(achievement.id) === -1) unlockedIds.push(achievement.id);
    });
    wx.setStorageSync('unlockedAchievements', unlockedIds);
    audioManager.play('achievement_unlock');
    this.setData({ showAchievementPopup: true, newAchievement: newList[0] });
  },

  closeAchievementPopup: function() {
    this.setData({ showAchievementPopup: false });
  },

  goToCards: function() {
    wx.navigateTo({
      url: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId
    });
  },

  backToMap: function() {
    if (this.data.fromMap) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onShareAppMessage: function() {
    return {
      title: '我解锁了 ' + this.data.provinceName + ' 的旅行角色卡',
      path: '/pages/index/index'
    };
  }
});
