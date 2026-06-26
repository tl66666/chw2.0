var achievementsModule = require('../../utils/achievements.js');

// 图标文字映射
var iconTextMap = {
  first_city: '起',
  five_cities: '5',
  ten_cities: '10',
  twenty_cities: '20',
  fifty_cities: '50',
  hundred_cities: '百',
  first_province: '省',
  five_provinces: '5',
  ten_provinces: '10',
  half_provinces: '半',
  all_provinces: '全',
  first_photo: '图',
  ten_photos: '10',
  fifty_photos: '50',
  hundred_photos: '百',
  first_ssr: 'SSR',
  first_ur: 'UR',
  card_collector: '卡',
  five_cards: '5',
  twenty_cards: '20',
  all_rarity: '全',
  night_owl: '夜',
  early_bird: '早',
  speed_runner: '速',
  foodie: '食',
  twenty_food: '20',
  social_butterfly: '享',
  five_shares: '5',
  ten_notes: '笔',
  week_streak: '7',
  month_streak: '30'
};

// 计算进度信息
function calculateProgress(ach, stats) {
  var current = 0;
  var target = 0;

  switch (ach.id) {
    case 'first_city':
      current = stats.visitedCount || 0;
      target = 1;
      break;
    case 'five_cities':
      current = stats.visitedCount || 0;
      target = 5;
      break;
    case 'ten_cities':
      current = stats.visitedCount || 0;
      target = 10;
      break;
    case 'twenty_cities':
      current = stats.visitedCount || 0;
      target = 20;
      break;
    case 'fifty_cities':
      current = stats.visitedCount || 0;
      target = 50;
      break;
    case 'hundred_cities':
      current = stats.visitedCount || 0;
      target = 100;
      break;
    case 'first_province':
      current = stats.visitedProvinces || 0;
      target = 1;
      break;
    case 'five_provinces':
      current = stats.visitedProvinces || 0;
      target = 5;
      break;
    case 'ten_provinces':
      current = stats.visitedProvinces || 0;
      target = 10;
      break;
    case 'half_provinces':
      current = stats.visitedProvinces || 0;
      target = 17;
      break;
    case 'all_provinces':
      current = stats.visitedProvinces || 0;
      target = 34;
      break;
    case 'first_photo':
      current = stats.photoCount || 0;
      target = 1;
      break;
    case 'ten_photos':
      current = stats.photoCount || 0;
      target = 10;
      break;
    case 'fifty_photos':
      current = stats.photoCount || 0;
      target = 50;
      break;
    case 'hundred_photos':
      current = stats.photoCount || 0;
      target = 100;
      break;
    case 'first_ssr':
      current = stats.ssrCount || 0;
      target = 1;
      break;
    case 'first_ur':
      current = stats.urCount || 0;
      target = 1;
      break;
    case 'card_collector':
      current = stats.cardCount || 0;
      target = 10;
      break;
    case 'five_cards':
      current = stats.cardCount || 0;
      target = 5;
      break;
    case 'twenty_cards':
      current = stats.cardCount || 0;
      target = 20;
      break;
    case 'all_rarity':
      current = stats.hasAllRarity ? 1 : 0;
      target = 1;
      break;
    case 'night_owl':
      current = stats.nightVisit ? 1 : 0;
      target = 1;
      break;
    case 'early_bird':
      current = stats.earlyVisit ? 1 : 0;
      target = 1;
      break;
    case 'speed_runner':
      current = stats.dailyVisit || 0;
      target = 3;
      break;
    case 'foodie':
      current = stats.foodPhotoCount || 0;
      target = 5;
      break;
    case 'twenty_food':
      current = stats.foodPhotoCount || 0;
      target = 20;
      break;
    case 'social_butterfly':
      current = stats.shareCount || 0;
      target = 1;
      break;
    case 'five_shares':
      current = stats.shareCount || 0;
      target = 5;
      break;
    case 'ten_notes':
      current = stats.noteCount || 0;
      target = 10;
      break;
    case 'week_streak':
      current = stats.weekStreak || 0;
      target = 7;
      break;
    case 'month_streak':
      current = stats.monthStreak || 0;
      target = 30;
      break;
  }

  var percent = target > 0 ? Math.min(100, Math.floor((current / target) * 100)) : 0;
  var text = current >= target ? '已完成' : current + '/' + target;

  return {
    current: current,
    target: target,
    percent: percent,
    text: text
  };
}

Page({
  data: {
    achievements: [],
    filteredAchievements: [],
    unlockedCount: 0,
    totalCount: 0,
    totalReward: 0,
    totalProgress: 0,
    activeCategory: 'all',
    categoryCounts: {
      all: 0,
      explore: 0,
      collect: 0,
      social: 0,
      special: 0
    },
    // 成就解锁弹窗
    showAchievementPopup: false,
    newAchievement: {}
  },

  onLoad: function() {
    this.loadAchievements();
  },

  onShow: function() {
    this.loadAchievements();
  },

  loadAchievements: function() {
    var stats = this.getUserStats();
    var unlockedIds = wx.getStorageSync('unlockedAchievements') || [];
    var resultList = achievementsModule.getAchievementStatus(stats, unlockedIds);
    var unlockedCount = 0;
    var totalReward = 0;
    var categoryCounts = { all: resultList.length, explore: 0, collect: 0, social: 0, special: 0 };

    // 处理成就数据
    var processedList = resultList.map(function(item) {
      var category = item.category || 'special';
      var progress = calculateProgress(item, stats);

      if (item.unlocked) {
        unlockedCount++;
        totalReward += item.reward;
      }
      categoryCounts[category]++;

      return {
        id: item.id,
        title: item.title,
        desc: item.desc,
        iconText: iconTextMap[item.id] || '成',
        badge: item.badge,
        category: category,
        categoryName: getCategoryName(category),
        reward: item.reward,
        unlocked: item.unlocked,
        canUnlock: item.canUnlock,
        progressText: item.unlocked ? '' : progress.text,
        progressPercent: progress.percent
      };
    });

    var totalProgress = resultList.length > 0 ? Math.floor((unlockedCount / resultList.length) * 100) : 0;

    this.setData({
      achievements: processedList,
      filteredAchievements: processedList,
      unlockedCount: unlockedCount,
      totalCount: resultList.length,
      totalReward: totalReward,
      totalProgress: totalProgress,
      categoryCounts: categoryCounts
    });
  },

  // 显示成就解锁弹窗
  showAchievementPopup: function(achievement) {
    this.setData({
      showAchievementPopup: true,
      newAchievement: achievement
    });
  },

  // 关闭成就解锁弹窗
  closeAchievementPopup: function() {
    this.setData({
      showAchievementPopup: false
    });
  },

  switchCategory: function(e) {
    var category = e.currentTarget.dataset.category;
    var filtered = this.data.achievements;

    if (category !== 'all') {
      filtered = this.data.achievements.filter(function(item) {
        return item.category === category;
      });
    }

    this.setData({
      activeCategory: category,
      filteredAchievements: filtered
    });
  },

  getUserStats: function() {
    var app = getApp();
    var visitedCities = app.globalData.visitedCities || [];

    // 从 visitedCities 派生已访问省份
    var citiesModule = require('../../utils/cities.js');
    var cities = citiesModule.cities;
    var provinceIds = [];
    for (var i = 0; i < visitedCities.length; i++) {
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === visitedCities[i]) {
          if (provinceIds.indexOf(cities[j].provinceId) === -1) {
            provinceIds.push(cities[j].provinceId);
          }
          break;
        }
      }
    }

    // 计算照片总数
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var photoCount = 0;
    var foodPhotoCount = 0;

    var travelKeys = Object.keys(cityTravelPhotos);
    for (var k = 0; k < travelKeys.length; k++) {
      photoCount += cityTravelPhotos[travelKeys[k]].length;
    }
    var oldKeys = Object.keys(cityPhotos);
    for (var m = 0; m < oldKeys.length; m++) {
      photoCount += cityPhotos[oldKeys[m]].length;
    }
    var foodKeys = Object.keys(cityFoodPhotos);
    for (var n = 0; n < foodKeys.length; n++) {
      foodPhotoCount += cityFoodPhotos[foodKeys[n]].length;
      photoCount += cityFoodPhotos[foodKeys[n]].length;
    }

    var groupData = {};
    try {
      var storedGroup = wx.getStorageSync('myGroup');
      groupData = typeof storedGroup === 'string' ? JSON.parse(storedGroup || '{}') : (storedGroup || {});
    } catch (e) {}

    return {
      visitedCount: visitedCities.length,
      visitedProvinces: provinceIds.length,
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

  onPullDownRefresh: function() {
    this.loadAchievements();
    wx.stopPullDownRefresh();
  },

  onShareAppMessage: function() {
    return {
      title: '我已解锁 ' + this.data.unlockedCount + '/' + this.data.totalCount + ' 个成就！',
      path: '/pages/index/index'
    };
  }
});

function getCategoryName(category) {
  var names = {
    explore: '探索',
    collect: '收集',
    social: '社交',
    special: '特殊'
  };
  return names[category] || '其他';
}
