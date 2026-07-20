var achievementsModule = require('../../../utils/achievements.js');

var provincesData = require('../../../utils/provinces.js');
var charactersData = require('../../../utils/characters.js');
var cloudImage = require('../../../utils/cloudImage.js');
var audioManager = require('../../../utils/audio-manager.js').getAudioManager();

Page({
  data: {
    provinceId: '',
    provinceName: '',
    provinceShort: '城',
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
    var fromMap = options.fromMap === 'true';
    var province = provincesData.getProvinceById(provinceId);

    if (province) {
      var character = charactersData.getCharacter(provinceId);
      var rarityColor = charactersData.getRarityColor(character.rarity);
      var self = this;



      var cloudPath = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269/cards/' + provinceId + '.png';
      this.getCloudImageUrl(cloudPath, function(imageUrl) {
        self.setData({
          provinceId: provinceId,
          provinceName: province.name,
          provinceShort: self.getProvinceShort(province),
          fromMap: fromMap,
          cardImage: imageUrl,
          character: character,
          rarity: character.rarity,
          rarityColor: rarityColor,
          phase: 0,
          cardFlipped: false,
          screenShake: false,
          showGlow: false,
          showParticles: false,
          showRarityBadge: false,
          showAttrs: false,
          showSkill: false,
          showDesc: false,
          showQuote: false
        });

        self.startUnlockSequence();
      });
    }
  },

  startUnlockSequence: function() {
    var self = this;
    var character = this.data.character;
    var rarity = character.rarity;

    this.setData({
      phase: 1,
      unlockText: '正在翻开 ' + this.data.provinceName + ' 的旅行卡...'
    });

    audioManager.play('card_flip_start');

    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({ unlockText: '正在收集城市记忆...' });
    }, 900);

    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({
        phase: 2,
        showGlow: true,
        unlockText: '即将揭晓...'
      });
    }, 1800);

    setTimeout(function() {
      if (self.data.phase !== 2) return;
      self.setData({
        phase: 3,
        showParticles: (rarity === 'SSR' || rarity === 'UR'),
        unlockText: ''
      });

      audioManager.play('card_flip_reveal');

      setTimeout(function() {
        self.setData({ cardFlipped: true });
      }, 180);

      setTimeout(function() {
        self.setData({ showRarityBadge: true });
      }, 900);
    }, 2800);

    setTimeout(function() {
      if (self.data.phase !== 3) return;

      var rarityText = '';
      switch (rarity) {
        case 'R': rarityText = '普通'; break;
        case 'SR': rarityText = '稀有'; break;
        case 'SSR': rarityText = '超稀有'; break;
        case 'UR': rarityText = '传说'; break;
      }

      self.setData({
        phase: 4,
        showAttrs: true,
        unlockText: '获得 ' + rarityText + ' 角色卡！'
      });

      switch (rarity) {
        case 'R': audioManager.play('rarity_r'); break;
        case 'SR': audioManager.play('rarity_sr'); break;
        case 'SSR': audioManager.play('rarity_ssr'); break;
        case 'UR': audioManager.play('rarity_ur'); break;
      }

      setTimeout(function() { self.setData({ showSkill: true }); }, 450);
      setTimeout(function() { self.setData({ showDesc: true }); }, 900);
      setTimeout(function() { self.setData({ showQuote: true }); }, 1300);

      self.saveUnlockRecord();

      setTimeout(function() {
        self.setData({ phase: 5 });
      }, 550);

      self.checkNewAchievements();
    }, 3800);
  },

  getProvinceShort: function(province) {
    if (!province || !province.name) return '城';
    return province.name.replace('特别行政区', '').replace('自治区', '').replace('省', '').replace('市', '').slice(0, 2);
  },

  onCardImageError: function() {
    this.setData({ cardImage: '' });
  },

  // 获取云存储图片 - 下载到本地临时文件
  getCloudImageUrl: function(cloudPath, callback) {
    cloudImage.resolve(cloudPath, callback);
  },

  // 完整的抽卡动画序列
  startUnlockSequence: function() {
    var self = this;
    var character = this.data.character;
    var rarity = character.rarity;

    // 阶段1：显示卡背，文字提示
    this.setData({
      phase: 1,
      unlockText: '正在探索 ' + this.data.provinceName + '...'
    });
    
    audioManager.play('card_flip_start');
    
    // 1.0秒后更新文字
    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({ unlockText: '解锁中...' });
    }, 1000);

    // 2.0秒后进入阶段2：光芒爆发
    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({
        phase: 2,
        showGlow: true,
        unlockText: '即将揭晓...'
      });

    }, 2000);

    // 3.0秒后进入阶段3：卡牌翻转展示
    setTimeout(function() {
      if (self.data.phase !== 2) return;
      self.setData({
        phase: 3,
        showParticles: (rarity === 'SSR' || rarity === 'UR'),
        unlockText: ''
      });
      
      audioManager.play('card_flip_reveal');
      
      // 延迟触发翻转动画
      setTimeout(function() {
        self.setData({ cardFlipped: true });
      }, 200);

      // 翻转完成后延迟显示稀有度徽章
      setTimeout(function() {
        self.setData({ showRarityBadge: true });
      }, 1000);
    }, 3000);

    // 4.0秒后进入阶段4：结果展示（卡牌角色信息）
    setTimeout(function() {
      if (self.data.phase !== 3) return;

      var rarityText = '';
      switch(rarity) {
        case 'R': rarityText = '普通'; break;
        case 'SR': rarityText = '稀有'; break;
        case 'SSR': rarityText = '超稀有'; break;
        case 'UR': rarityText = '传说'; break;
      }

      self.setData({
        phase: 4,
        showAttrs: true,
        unlockText: '获得 ' + rarityText + ' 角色卡！'
      });
      
      switch(rarity) {
        case 'R': audioManager.play('rarity_r'); break;
        case 'SR': audioManager.play('rarity_sr'); break;
        case 'SSR': audioManager.play('rarity_ssr'); break;
        case 'UR': audioManager.play('rarity_ur'); break;
      }
      
      // 延迟显示技能
      setTimeout(function() {
        self.setData({ showSkill: true });
      }, 500);

      // 延迟显示描述
      setTimeout(function() {
        self.setData({ showDesc: true });
      }, 1000);

      // 延迟显示台词
      setTimeout(function() {
        self.setData({ showQuote: true });
      }, 1500);

      // 保存解锁记录
      self.saveUnlockRecord();

      // 检查是否有新成就
      setTimeout(function() {
        self.setData({ phase: 5 });
      }, 600);

      self.checkNewAchievements();
    }, 4000);
  },

  // 保存解锁记录并更新图鉴统计
  saveUnlockRecord: function() {
    var app = getApp();
    var provinceId = this.data.provinceId;
    var rarity = this.data.rarity;
    var visitedProvinces = app.globalData.visitedProvinces || [];

    if (visitedProvinces.indexOf(provinceId) === -1) {
      visitedProvinces.push(provinceId);
      app.globalData.visitedProvinces = visitedProvinces;
      app.globalData.manualProvinceRecords = true;
      app.saveData();
      app.syncProvinceRecords();
      try {
        wx.setStorageSync('visitedProvinces', JSON.stringify(visitedProvinces));
      } catch (e) {}

      // 更新图鉴计数
      app.globalData.cardCount = (app.globalData.cardCount || 0) + 1;
      if (rarity === 'SSR') app.globalData.ssrCount = (app.globalData.ssrCount || 0) + 1;
      if (rarity === 'UR') app.globalData.urCount = (app.globalData.urCount || 0) + 1;
      try {
        wx.setStorageSync('cardCount', app.globalData.cardCount);
        wx.setStorageSync('ssrCount', app.globalData.ssrCount || 0);
        wx.setStorageSync('urCount', app.globalData.urCount || 0);
      } catch (e) {}
    }
  },

  // 检查并解锁新成就（调用成就模块统一管理）
  checkNewAchievements: function() {
    var app = getApp();
    var self = this;
    var stats = this.getStats();
    var unlockedIds = wx.getStorageSync('unlockedAchievements') || [];

    var newList = achievementsModule.checkNewAchievements(stats, unlockedIds);
    if (newList.length === 0) return;

    // 保存所有新成就
    newList.forEach(function(ach) {
      if (unlockedIds.indexOf(ach.id) === -1) {
        unlockedIds.push(ach.id);
      }
    });
    try { wx.setStorageSync('unlockedAchievements', unlockedIds); } catch (e) {}

    // 弹出第一个成就（有多个则依次弹出）
    audioManager.play('achievement_unlock');
    self.setData({
      showAchievementPopup: true,
      newAchievement: newList[0]
    });

    // 3秒后关闭，如果还有更多成就继续弹出
    var idx = 1;
    var showNext = function() {
      if (idx < newList.length) {
        self.setData({
          newAchievement: newList[idx]
        });
        idx++;
        setTimeout(showNext, 2500);
      } else {
        self.setData({ showAchievementPopup: false });
      }
    };
    setTimeout(showNext, 3000);
  },

  // 获取用户统计数据
  getStats: function() {
    var app = getApp();
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var photoCount = 0, foodPhotoCount = 0;

    Object.keys(cityTravelPhotos).forEach(function(k) { photoCount += cityTravelPhotos[k].length; });
    Object.keys(cityPhotos).forEach(function(k) { photoCount += cityPhotos[k].length; });
    Object.keys(cityFoodPhotos).forEach(function(k) {
      foodPhotoCount += cityFoodPhotos[k].length;
      photoCount += cityFoodPhotos[k].length;
    });

    var groupData = {};
    try {
      var storedGroup = wx.getStorageSync('myGroup');
      groupData = typeof storedGroup === 'string' ? JSON.parse(storedGroup || '{}') : (storedGroup || {});
    } catch (e) {}

    return {
      visitedCount: visitedCities.length,
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
      hasAllRarity: app.globalData.hasAllRarity || false,
      groupMemberCount: (groupData.members || []).length,
      groupCityCount: (groupData.groupCities || []).length,
      groupPhotoCount: (groupData.sharedPhotos || []).length
    };
  },

  // 关闭成就弹窗
  closeAchievementPopup: function() {
    this.setData({ showAchievementPopup: false });
  },

  // 返回地图
  backToMap: function() {
    if (this.data.fromMap) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 查看角色卡详情
  goToCards: function() {
    wx.navigateTo({
      url: '/package-cards/pages/card-detail/card-detail?provinceId=' + this.data.provinceId
    });
  },

  // 查看详情（显示属性面板）
  viewDetail: function() {
    this.setData({ phase: 5 });
  },

  // 返回结果展示
  backToResult: function() {
    this.setData({ phase: 4 });
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '我解锁了 ' + this.data.provinceName + ' 的角色卡！',
      path: '/pages/index/index'
    };
  },

  getProvinceShort: function(province) {
    if (!province || !province.name) return '城';
    return province.name
      .replace('特别行政区', '')
      .replace('自治区', '')
      .replace('省', '')
      .replace('市', '')
      .slice(0, 2);
  },

  onShareAppMessage: function() {
    return {
      title: '我解锁了 ' + this.data.provinceName + ' 的旅行角色卡！',
      path: '/pages/index/index'
    };
  },

  getProvinceShort: function(province) {
    if (!province || !province.name) return '城';
    return province.name
      .replace('特别行政区', '')
      .replace('自治区', '')
      .replace('省', '')
      .replace('市', '')
      .slice(0, 2);
  },

  startUnlockSequence: function() {
    var self = this;
    var character = this.data.character;
    var rarity = character.rarity;

    this.setData({
      phase: 1,
      unlockText: '正在翻开 ' + this.data.provinceName + ' 的旅行卡...'
    });
    audioManager.play('card_flip_start');

    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({ unlockText: '正在收集城市记忆...' });
    }, 900);

    setTimeout(function() {
      if (self.data.phase !== 1) return;
      self.setData({
        phase: 2,
        showGlow: true,
        unlockText: '即将揭晓...'
      });
    }, 1800);

    setTimeout(function() {
      if (self.data.phase !== 2) return;
      self.setData({
        phase: 3,
        showParticles: (rarity === 'SSR' || rarity === 'UR'),
        unlockText: ''
      });
      audioManager.play('card_flip_reveal');
      setTimeout(function() { self.setData({ cardFlipped: true }); }, 180);
      setTimeout(function() { self.setData({ showRarityBadge: true }); }, 900);
    }, 2800);

    setTimeout(function() {
      if (self.data.phase !== 3) return;

      var rarityText = '';
      switch (rarity) {
        case 'R': rarityText = '普通'; break;
        case 'SR': rarityText = '稀有'; break;
        case 'SSR': rarityText = '超稀有'; break;
        case 'UR': rarityText = '传说'; break;
      }

      self.setData({
        phase: 4,
        showAttrs: true,
        unlockText: '获得 ' + rarityText + ' 角色卡！'
      });

      switch (rarity) {
        case 'R': audioManager.play('rarity_r'); break;
        case 'SR': audioManager.play('rarity_sr'); break;
        case 'SSR': audioManager.play('rarity_ssr'); break;
        case 'UR': audioManager.play('rarity_ur'); break;
      }

      setTimeout(function() { self.setData({ showSkill: true }); }, 450);
      setTimeout(function() { self.setData({ showDesc: true }); }, 900);
      setTimeout(function() { self.setData({ showQuote: true }); }, 1300);

      self.saveUnlockRecord();
      setTimeout(function() { self.setData({ phase: 5 }); }, 550);
      self.checkNewAchievements();
    }, 3800);
  },

  onShareAppMessage: function() {
    return {
      title: '我解锁了 ' + this.data.provinceName + ' 的旅行角色卡！',
      path: '/pages/index/index'
    };
  }
});
