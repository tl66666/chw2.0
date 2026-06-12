var provincesData = require('../../utils/provinces.js');
var charactersData = require('../../utils/characters.js');
var cloudImage = require('../../utils/cloudImage.js');

Page({
  data: {
    provinceId: '',
    provinceName: '',
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

  // 获取云存储图片临时链接
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

  // 保存解锁记录
  saveUnlockRecord: function() {
    var app = getApp();
    var provinceId = this.data.provinceId;
    var visitedProvinces = app.globalData.visitedProvinces || [];

    if (visitedProvinces.indexOf(provinceId) === -1) {
      visitedProvinces.push(provinceId);
      app.globalData.visitedProvinces = visitedProvinces;

      try {
        wx.setStorageSync('visitedProvinces', JSON.stringify(visitedProvinces));
      } catch (e) {
        console.error('保存visitedProvinces失败:', e);
      }
    }
  },

  // 检查新成就
  checkNewAchievements: function() {
    var app = getApp();
    var visitedProvinces = app.globalData.visitedProvinces || [];
    var newAchievement = null;

    // 检查首次解锁成就
    if (visitedProvinces.length === 1) {
      newAchievement = {
        title: '初次探索',
        desc: '解锁第一个省份角色卡'
      };
    }

    // 检查收集成就
    if (visitedProvinces.length === 5) {
      newAchievement = {
        title: '旅行达人',
        desc: '解锁5个省份角色卡'
      };
    }

    if (visitedProvinces.length === 10) {
      newAchievement = {
        title: '足迹遍布',
        desc: '解锁10个省份角色卡'
      };
    }

    if (newAchievement) {
      this.setData({
        showAchievementPopup: true,
        newAchievement: newAchievement
      });

      // 3秒后关闭成就弹窗
      var self = this;
      setTimeout(function() {
        self.setData({ showAchievementPopup: false });
      }, 3000);
    }
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

  // 查看详情
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
  }
});
