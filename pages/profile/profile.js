var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;

// 等级配置
var LEVEL_CONFIG = [
  { level: 1, title: '旅行新手', minCities: 0, expPerCity: 10 },
  { level: 2, title: '背包客', minCities: 3, expPerCity: 12 },
  { level: 3, title: '探险家', minCities: 8, expPerCity: 15 },
  { level: 4, title: '旅行达人', minCities: 15, expPerCity: 18 },
  { level: 5, title: '环球行者', minCities: 25, expPerCity: 22 },
  { level: 6, title: '足迹大师', minCities: 40, expPerCity: 28 },
  { level: 7, title: '传奇旅人', minCities: 60, expPerCity: 35 },
  { level: 8, title: '世界征服者', minCities: 100, expPerCity: 50 }
];

// 活动类型对应的图标文字
var ACTIVITY_ICON_TEXT = {
  city: '城',
  photo: '照',
  food: '食',
  note: '记'
};

Page({
  data: {
    userInfo: {},
    visitedCount: 0,
    visitedProvinces: 0,
    travelPhotoCount: 0,
    foodPhotoCount: 0,
    photoCount: 0,
    completionRate: 0,
    levelInfo: {
      level: 1,
      title: '旅行新手',
      currentExp: 0,
      nextExp: 30,
      progress: 0,
      needCities: 3
    },
    recentActivities: []
  },

  onLoad: function() {
    this.loadUserInfo();
    this.loadStats();
    this.loadRecentActivities();
  },

  onShow: function() {
    this.loadUserInfo();
    this.loadStats();
    this.loadRecentActivities();
  },

  loadUserInfo: function() {
    var userInfo = app.globalData.userInfo || {};
    // 如果头像路径异常，尝试从本地存储恢复
    if (!userInfo.avatarUrl) {
      try {
        var stored = wx.getStorageSync('userInfo');
        if (stored) {
          var parsed = JSON.parse(stored);
          if (parsed.avatarUrl) {
            userInfo.avatarUrl = parsed.avatarUrl;
          }
        }
      } catch (e) {
        console.log('读取本地头像失败', e);
      }
    }
    // 避免传输base64头像数据过大，只保留必要字段
    var displayUserInfo = {
      nickName: userInfo.nickName || '旅行者',
      avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg'
    };
    this.setData({ userInfo: displayUserInfo });
  },

  // 头像加载失败处理
  onAvatarError: function() {
    this.setData({
      'userInfo.avatarUrl': '/images/avatar.jpg'
    });
  },

  loadStats: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var cityNotes = app.globalData.cityNotes || {};

    // 计算省份数量
    var visitedProvinceIds = [];
    for (var i = 0; i < visitedCities.length; i++) {
      var cityId = visitedCities[i];
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === cityId) {
          if (visitedProvinceIds.indexOf(cities[j].provinceId) === -1) {
            visitedProvinceIds.push(cities[j].provinceId);
          }
          break;
        }
      }
    }

    // 计算旅游照片数量
    var travelPhotoCount = 0;
    var travelKeys = Object.keys(cityTravelPhotos);
    for (var k = 0; k < travelKeys.length; k++) {
      travelPhotoCount += cityTravelPhotos[travelKeys[k]].length;
    }

    // 兼容旧数据
    var oldPhotoKeys = Object.keys(cityPhotos);
    for (var m = 0; m < oldPhotoKeys.length; m++) {
      travelPhotoCount += cityPhotos[oldPhotoKeys[m]].length;
    }

    // 计算美食照片数量
    var foodPhotoCount = 0;
    var foodKeys = Object.keys(cityFoodPhotos);
    for (var n = 0; n < foodKeys.length; n++) {
      foodPhotoCount += cityFoodPhotos[foodKeys[n]].length;
    }

    // 计算完成率
    var totalCities = cities.length;
    var completionRate = totalCities > 0 ? Math.round((visitedCities.length / totalCities) * 100) : 0;

    // 计算等级信息
    var levelInfo = this.calculateLevel(visitedCities.length);

    this.setData({
      visitedCount: visitedCities.length,
      visitedProvinces: visitedProvinceIds.length,
      travelPhotoCount: travelPhotoCount,
      foodPhotoCount: foodPhotoCount,
      photoCount: travelPhotoCount + foodPhotoCount,
      completionRate: completionRate,
      levelInfo: levelInfo
    });
  },

  // 计算等级
  calculateLevel: function(visitedCount) {
    var currentLevel = LEVEL_CONFIG[0];
    var nextLevel = LEVEL_CONFIG[1];

    for (var i = 0; i < LEVEL_CONFIG.length; i++) {
      if (visitedCount >= LEVEL_CONFIG[i].minCities) {
        currentLevel = LEVEL_CONFIG[i];
        nextLevel = LEVEL_CONFIG[i + 1] || null;
      } else {
        break;
      }
    }

    var currentExp = visitedCount * currentLevel.expPerCity;
    var nextExp = nextLevel ? nextLevel.minCities * currentLevel.expPerCity : currentExp;
    var prevExp = currentLevel.minCities * currentLevel.expPerCity;
    var progress = nextLevel ? Math.min(100, Math.round(((currentExp - prevExp) / (nextExp - prevExp)) * 100)) : 100;
    var needCities = nextLevel ? nextLevel.minCities - visitedCount : 0;

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      currentExp: currentExp,
      nextExp: nextExp,
      progress: progress,
      needCities: needCities
    };
  },

  // 加载最近活动
  loadRecentActivities: function() {
    var activities = [];
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityNotes = app.globalData.cityNotes || {};
    var cityPhotos = app.globalData.cityPhotos || {};

    // 收集所有活动数据
    var allActivities = [];

    // 城市访问记录
    for (var i = 0; i < visitedCities.length; i++) {
      var cityId = visitedCities[i];
      var cityName = this.getCityNameById(cityId);
      allActivities.push({
        type: 'city',
        iconText: ACTIVITY_ICON_TEXT.city,
        text: '点亮了城市：' + cityName,
        time: '已探索',
        sortKey: i
      });
    }

    // 旅行照片记录
    var travelKeys = Object.keys(cityTravelPhotos);
    for (var j = 0; j < travelKeys.length; j++) {
      var cityId = travelKeys[j];
      var cityName = this.getCityNameById(cityId);
      var photos = cityTravelPhotos[cityId];
      for (var p = 0; p < photos.length; p++) {
        allActivities.push({
          type: 'photo',
          iconText: ACTIVITY_ICON_TEXT.photo,
          text: '在 ' + cityName + ' 上传了旅行照片',
          time: '旅行记录',
          sortKey: 1000 + j * 100 + p
        });
      }
    }

    // 美食照片记录
    var foodKeys = Object.keys(cityFoodPhotos);
    for (var k = 0; k < foodKeys.length; k++) {
      var cityId = foodKeys[k];
      var cityName = this.getCityNameById(cityId);
      var photos = cityFoodPhotos[cityId];
      for (var q = 0; q < photos.length; q++) {
        allActivities.push({
          type: 'food',
          iconText: ACTIVITY_ICON_TEXT.food,
          text: '在 ' + cityName + ' 记录了美食',
          time: '美食记录',
          sortKey: 2000 + k * 100 + q
        });
      }
    }

    // 笔记记录
    var noteKeys = Object.keys(cityNotes);
    for (var n = 0; n < noteKeys.length; n++) {
      var cityId = noteKeys[n];
      var cityName = this.getCityNameById(cityId);
      if (cityNotes[cityId] && cityNotes[cityId].trim()) {
        allActivities.push({
          type: 'note',
          iconText: ACTIVITY_ICON_TEXT.note,
          text: '为 ' + cityName + ' 添加了旅行笔记',
          time: '笔记记录',
          sortKey: 3000 + n
        });
      }
    }

    // 兼容旧照片数据
    var oldKeys = Object.keys(cityPhotos);
    for (var o = 0; o < oldKeys.length; o++) {
      var cityId = oldKeys[o];
      var cityName = this.getCityNameById(cityId);
      var photos = cityPhotos[cityId];
      for (var r = 0; r < photos.length; r++) {
        allActivities.push({
          type: 'photo',
          iconText: ACTIVITY_ICON_TEXT.photo,
          text: '在 ' + cityName + ' 上传了照片',
          time: '旅行记录',
          sortKey: 4000 + o * 100 + r
        });
      }
    }

    // 取最近5条，倒序排列（最新的在前面）
    allActivities.sort(function(a, b) {
      return b.sortKey - a.sortKey;
    });

    activities = allActivities.slice(0, 5);

    this.setData({
      recentActivities: activities
    });
  },

  // 根据城市ID获取城市名称
  getCityNameById: function(cityId) {
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) {
        return cities[i].name;
      }
    }
    return '未知城市';
  },

  goToUpload: function() {
    wx.navigateTo({
      url: '/package-album/pages/upload/upload'
    });
  },

  goToAlbum: function() {
    wx.switchTab({
      url: '/package-album/pages/album/album'
    });
  },

  goToSettings: function() {
    wx.navigateTo({
      url: '/package-others/pages/settings/settings'
    });
  },

  goToGroup: function() {
    wx.navigateTo({
      url: '/package-others/pages/group/group'
    });
  },

  goToAchievements: function() {
    wx.navigateTo({
      url: '/package-others/pages/achievements/achievements'
    });
  },

  shareApp: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  clearData: function() {
    var self = this;
    wx.showModal({
      title: '清除数据',
      content: '确定要清除所有旅行记录吗？此操作不可恢复。',
      confirmColor: '#F87171',
      success: function(res) {
        if (res.confirm) {
          // 清除数据
          app.globalData.visitedCities = [];
          app.globalData.cityPhotos = {};
          app.globalData.cityTravelPhotos = {};
          app.globalData.cityFoodPhotos = {};
          app.globalData.cityNotes = {};
          app.saveData();

          // 更新UI
          self.loadStats();
          self.loadRecentActivities();

          wx.showToast({
            title: '数据已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 更换头像
  changeAvatar: function() {
    var self = this;

    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: function(res) {
        var sourceType = res.tapIndex === 0 ? ['album'] : ['camera'];

        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: sourceType,
          success: function(res) {
            var tempFilePath = res.tempFiles[0].tempFilePath;
            self.saveAvatar(tempFilePath);
          },
          fail: function(err) {
            console.log('选择图片失败', err);
          }
        });
      }
    });
  },

  // 保存头像
  saveAvatar: function(filePath) {
    var self = this;

    // 将图片保存到本地文件系统
    var fs = wx.getFileSystemManager();
    var savedPath = wx.env.USER_DATA_PATH + '/avatar_' + Date.now() + '.png';

    fs.copyFile({
      srcPath: filePath,
      destPath: savedPath,
      success: function() {
        // 更新全局数据
        if (!app.globalData.userInfo) {
          app.globalData.userInfo = {};
        }
        app.globalData.userInfo.avatarUrl = savedPath;

        // 保存到本地存储
        wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));

        // 更新页面数据
        self.setData({
          userInfo: app.globalData.userInfo
        });

        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      },
      fail: function() {
        // 如果复制失败，尝试使用base64
        self.saveAvatarAsBase64(filePath);
      }
    });
  },

  // 备用：base64保存头像
  saveAvatarAsBase64: function(filePath) {
    var self = this;

    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: 'base64',
      success: function(res) {
        var base64Data = 'data:image/png;base64,' + res.data;

        if (!app.globalData.userInfo) {
          app.globalData.userInfo = {};
        }
        app.globalData.userInfo.avatarUrl = base64Data;

        wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));

        self.setData({
          userInfo: app.globalData.userInfo
        });

        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      },
      fail: function() {
        // 最后尝试直接使用临时路径
        if (!app.globalData.userInfo) {
          app.globalData.userInfo = {};
        }
        app.globalData.userInfo.avatarUrl = filePath;

        wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));

        self.setData({
          userInfo: app.globalData.userInfo
        });

        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      }
    });
  },

  onShareAppMessage: function() {
    var visitedCount = this.data.visitedCount;
    var visitedProvinces = this.data.visitedProvinces;
    var levelTitle = this.data.levelInfo.title;
    return {
      title: '我是' + levelTitle + '，已点亮 ' + visitedCount + ' 座城市，足迹遍布 ' + visitedProvinces + ' 个省份！',
      path: '/pages/index/index'
    };
  }
});
