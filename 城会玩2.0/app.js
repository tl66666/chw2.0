var photoRecords = require('./utils/photo-records.js');
var groupPhotoReviewQueue = require('./utils/group-photo-review-queue.js');

App({
  globalData: {
    userInfo: null,
    openid: '',
    isLogin: false,
    visitedCities: [],
    visitedProvinces: [],
    visitDates: {},       // 城市访问日期记录 { cityId: '2024-01-15' }
    cityDisplayNames: {}, // 城市打卡时的显示名称 { cityId: '四川省' / '昆明市' }
    cityPhotos: {},
    cityTravelPhotos: {},
    cityFoodPhotos: {},
    deletedPhotoIds: {},
    pendingGroupPhotoReviews: [],
    cityNotes: {},
    cityAvoidTips: {},
    cardCount: 0,
    ssrCount: 0,
    urCount: 0,
    settings: {
      showProvinceName: true,
      showCityCount: true
    },
    useCloud: true // 是否使用云开发，false时使用本地模式
  },

  onLaunch: function() {
    // 初始化云开发 - 使用 DYNAMIC_CURRENT_ENV 自动匹配当前环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      try {
        wx.cloud.init({
          env: wx.cloud.DYNAMIC_CURRENT_ENV,
          traceUser: true
        });
        console.log('云开发初始化成功');
      } catch (e) {
        console.error('云开发初始化失败:', e);
      }
    }

    this.loadStoredData();
    this.autoLogin();
    this.initAudioManager();
  },

  onShow: function() {
    this.loadStoredData();
  },

  // 自动登录（静默登录）
  autoLogin: function() {
    var self = this;
    var openid = wx.getStorageSync('openid');
    var userInfo = wx.getStorageSync('userInfo');
    
    if (openid && userInfo) {
      // 已有openid和用户信息，说明之前登录过
      this.globalData.openid = openid;
      this.globalData.isLogin = true;
      try {
        this.globalData.userInfo = JSON.parse(userInfo);
      } catch (e) {
        console.error('解析用户信息失败');
      }
      
      // 获取用户信息
      if (self.globalData.useCloud) {
        setTimeout(function() {
          self.syncFromCloud();
        }, 2000);
      }
    }
  },

  initAudioManager: function() {
    try { require('./utils/audio-manager.js'); } catch(e) {}
  },

  refreshGroupCache: function(callback) {
    if (!this.globalData.isLogin || !wx.cloud) {
      if (callback) callback(false);
      return;
    }

    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'getMyGroup' },
      timeout: 10000
    }).then(function(res) {
      var result = res.result || {};
      if (result.success && result.groupInfo) {
        wx.setStorageSync('myGroup', JSON.stringify(result));
        if (callback) callback(true, result);
      } else {
        if (callback) callback(false, result);
      }
    }).catch(function() {
      if (callback) callback(false);
    });
  },

  // 微信登录：只获取 openid，不强制索取头像昵称授权
  login: function(callback) {
    var self = this;
    
    wx.showLoading({ title: '登录中...' });
    
    // 第一步：获取微信登录凭证
    wx.login({
      success: function(res) {
        if (res.code) {
          var localUserInfo = self.globalData.userInfo || {};
          if (!localUserInfo.nickName || localUserInfo.nickName === '游客') {
            localUserInfo.nickName = '微信用户';
          }
          if (!localUserInfo.avatarUrl) {
            localUserInfo.avatarUrl = '/images/avatar.jpg';
          }

          wx.cloud.callFunction({
            name: 'login',
            data: {
              code: res.code,
              userInfo: localUserInfo
            },
            timeout: 10000
          }).then(function(res) {
            wx.hideLoading();
            var result = res.result;

            if (result && result.success) {
              self.globalData.openid = result.openid;
              self.globalData.isLogin = true;
              self.globalData.useCloud = true;
              self.globalData.userInfo = {
                nickName: (result.userInfo && result.userInfo.nickName) || localUserInfo.nickName || '微信用户',
                avatarUrl: (result.userInfo && result.userInfo.avatarUrl) || localUserInfo.avatarUrl || '/images/avatar.jpg'
              };

              wx.setStorageSync('openid', result.openid);
              wx.setStorageSync('userInfo', JSON.stringify(self.globalData.userInfo));

              self.syncFromCloud();

              wx.showToast({
                title: '登录成功',
                icon: 'success'
              });

              if (callback) callback(true);
            } else {
              wx.showToast({
                title: '登录失败，请检查云函数',
                icon: 'none'
              });
              if (callback) callback(false);
            }
          }).catch(function(err) {
            wx.hideLoading();
            console.error('登录调用失败:', err);
            wx.showToast({
              title: '登录失败，请部署 login 云函数',
              icon: 'none'
            });
            if (callback) callback(false);
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
          if (callback) callback(false);
        }
      },
      fail: function() {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
        if (callback) callback(false);
      }
    });
  },

  // 从云端同步数据
  syncFromCloud: function() {
    if (!this.globalData.isLogin) return;
    
    var self = this;
    wx.cloud.callFunction({
      name: 'syncData',
      data: {
        action: 'getAllData'
      },
      timeout: 8000
    }).then(function(res) {
      var result = res.result;
      if (result && result.success && result.data) {
        // 合并云端数据到本地
        self.mergeCloudData(result.data);
      }
    }).catch(function(err) {
      console.error('同步失败:', err);
      // A transient personal-data refresh must not downgrade later photo uploads to local paths.
      self.globalData.lastCloudSyncError = Date.now();
    });
  },

  // 合并云端数据 —— 使用替换模式，以云端为准
  mergeCloudData: function(cloudData) {
    // 城市记录：用云端数据替换本地
    var cloudVisitedCities = [];
    if (cloudData.cityRecords) {
      for (var i = 0; i < cloudData.cityRecords.length; i++) {
        var record = cloudData.cityRecords[i];
        if (record.isVisited && cloudVisitedCities.indexOf(record.cityId) === -1) {
          cloudVisitedCities.push(record.cityId);
        }
      }
    }
    this.globalData.visitedCities = cloudVisitedCities;

    // 照片：用云端数据替换本地
    var cloudTravelPhotos = {};
    var cloudFoodPhotos = {};
    if (cloudData.photos) {
      for (var j = 0; j < cloudData.photos.length; j++) {
        var photo = cloudData.photos[j];
        var photoUrl = photo.fileId || photo.url;
        // Expired temporary URLs cannot be refreshed and used to create blank, 403 photo cards.
        if (!photoUrl || photoUrl.indexOf('cloud://') !== 0 || (this.globalData.deletedPhotoIds || {})[photoUrl]) continue;
        var targetObj = photo.type === 'food' ? cloudFoodPhotos : cloudTravelPhotos;
        if (!targetObj[photo.cityId]) {
          targetObj[photo.cityId] = [];
        }
        targetObj[photo.cityId].push(photoUrl);
      }
    }
    this.globalData.cityTravelPhotos = cloudTravelPhotos;
    this.globalData.cityFoodPhotos = cloudFoodPhotos;
    this.globalData.cityPhotos = {};

    // 笔记：用云端数据替换本地
    var cloudNotes = {};
    if (cloudData.notes) {
      for (var m = 0; m < cloudData.notes.length; m++) {
        var note = cloudData.notes[m];
        cloudNotes[note.cityId] = note.content;
      }
    }
    this.globalData.cityNotes = cloudNotes;

    // 合并避坑指南
    var cloudAvoidTips = {};
    if (cloudData.avoidTips) {
      for (var at = 0; at < cloudData.avoidTips.length; at++) {
        var tip = cloudData.avoidTips[at];
        cloudAvoidTips[tip.cityId] = tip.content;
      }
    }
    this.globalData.cityAvoidTips = cloudAvoidTips;

    // 重新计算省份
    var citiesData = require('./utils/cities.js');
    var allCities = citiesData.cities || [];
    var visitedProvinceIds = [];
    for (var p = 0; p < cloudVisitedCities.length; p++) {
      for (var q = 0; q < allCities.length; q++) {
        if (allCities[q].id === cloudVisitedCities[p]) {
          if (visitedProvinceIds.indexOf(allCities[q].provinceId) === -1) {
            visitedProvinceIds.push(allCities[q].provinceId);
          }
          break;
        }
      }
    }
    this.globalData.visitedProvinces = visitedProvinceIds;

    this.saveData();
  },

  // 同步到云端
  syncToCloud: function() {
    if (!this.globalData.isLogin) return;
    if (!this.globalData.useCloud) return; // 本地模式不同步
    
    var self = this;
    
    // 同步城市记录
    var cityRecords = [];
    for (var i = 0; i < this.globalData.visitedCities.length; i++) {
      var cityId = this.globalData.visitedCities[i];
      cityRecords.push({
        cityId: cityId,
        provinceId: this.getProvinceIdByCityId(cityId),
        isVisited: true
      });
    }
    
    if (cityRecords.length > 0) {
      wx.cloud.callFunction({
        name: 'syncData',
        data: {
          action: 'syncCityRecords',
          data: cityRecords
        },
        timeout: 8000
      }).catch(function() { /* 静默失败 */ });
    }
    
    // 同步笔记
    var notes = [];
    var noteKeys = Object.keys(this.globalData.cityNotes);
    for (var j = 0; j < noteKeys.length; j++) {
      var cityId = noteKeys[j];
      notes.push({
        cityId: cityId,
        provinceId: this.getProvinceIdByCityId(cityId),
        content: this.globalData.cityNotes[cityId]
      });
    }
    
    if (notes.length > 0) {
      wx.cloud.callFunction({
        name: 'syncData',
        data: {
          action: 'syncNotes',
          data: notes
        },
        timeout: 8000
      }).catch(function() { /* 静默失败 */ });
    }

    // 同步避坑指南
    var avoidTips = [];
    var avoidKeys = Object.keys(this.globalData.cityAvoidTips || {});
    for (var ak = 0; ak < avoidKeys.length; ak++) {
      var avoidCityId = avoidKeys[ak];
      var tipContent = this.globalData.cityAvoidTips[avoidCityId];
      if (tipContent && tipContent.trim()) {
        avoidTips.push({
          cityId: avoidCityId,
          provinceId: this.getProvinceIdByCityId(avoidCityId),
          content: tipContent
        });
      }
    }
    if (avoidTips.length > 0) {
      wx.cloud.callFunction({
        name: 'syncData',
        data: {
          action: 'syncAvoidTips',
          data: avoidTips
        },
        timeout: 8000
      }).catch(function() { /* 静默失败 */ });
    }

    var photos = [];
    var deletedPhotoIds = this.globalData.deletedPhotoIds || {};
    var travelKeys = Object.keys(this.globalData.cityTravelPhotos || {});
    for (var p = 0; p < travelKeys.length; p++) {
      var travelCityId = travelKeys[p];
      var travelPhotos = this.globalData.cityTravelPhotos[travelCityId] || [];
      for (var tp = 0; tp < travelPhotos.length; tp++) {
        var travelFileId = photoRecords.getFileId(travelPhotos[tp]);
        if (!travelFileId || deletedPhotoIds[travelFileId]) continue;
        photos.push({
          cityId: travelCityId,
          provinceId: this.getProvinceIdByCityId(travelCityId),
          type: 'travel',
          fileId: travelFileId,
          url: travelFileId
        });
      }
    }

    var foodKeys = Object.keys(this.globalData.cityFoodPhotos || {});
    for (var f = 0; f < foodKeys.length; f++) {
      var foodCityId = foodKeys[f];
      var foodPhotos = this.globalData.cityFoodPhotos[foodCityId] || [];
      for (var fp = 0; fp < foodPhotos.length; fp++) {
        var foodFileId = photoRecords.getFileId(foodPhotos[fp]);
        if (!foodFileId || deletedPhotoIds[foodFileId]) continue;
        photos.push({
          cityId: foodCityId,
          provinceId: this.getProvinceIdByCityId(foodCityId),
          type: 'food',
          fileId: foodFileId,
          url: foodFileId
        });
      }
    }

    if (photos.length > 0) {
      wx.cloud.callFunction({
        name: 'syncData',
        data: {
          action: 'syncPhotos',
          data: photos
        },
        timeout: 8000
      }).catch(function() { /* 静默失败 */ });
    }
  },

  // 根据城市ID获取省份ID
  getProvinceIdByCityId: function(cityId) {
    var citiesData = require('./utils/cities.js');
    var provincesData = require('./utils/provinces.js');
    var cities = citiesData.cities;
    var provinces = provincesData.provinces;
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) {
        return cities[i].provinceId;
      }
    }
    for (var p = 0; p < provinces.length; p++) {
      if (provinces[p].id === cityId) {
        return cityId;
      }
    }
    return '';
  },

  loadStoredData: function() {
    try {
      var visitedCities = wx.getStorageSync('visitedCities');
      var visitedProvinces = wx.getStorageSync('visitedProvinces');
      var visitDates = wx.getStorageSync('visitDates');
      var cityPhotos = wx.getStorageSync('cityPhotos');
      var cityTravelPhotos = wx.getStorageSync('cityTravelPhotos');
      var cityFoodPhotos = wx.getStorageSync('cityFoodPhotos');
      var deletedPhotoIds = wx.getStorageSync('deletedPhotoIds');
      var pendingGroupPhotoReviews = wx.getStorageSync('pendingGroupPhotoReviews');
      var cityNotes = wx.getStorageSync('cityNotes');
      var cityAvoidTips = wx.getStorageSync('cityAvoidTips');
      var settings = wx.getStorageSync('settings');
      var cardCount = wx.getStorageSync('cardCount');
      var ssrCount = wx.getStorageSync('ssrCount');
      var urCount = wx.getStorageSync('urCount');

      if (visitedCities) {
        this.globalData.visitedCities = JSON.parse(visitedCities);
      }
      if (visitedProvinces) {
        this.globalData.visitedProvinces = JSON.parse(visitedProvinces);
      }
      if (visitDates) {
        this.globalData.visitDates = JSON.parse(visitDates);
      }
      var cityDisplayNames = wx.getStorageSync('cityDisplayNames');
      if (cityDisplayNames) {
        this.globalData.cityDisplayNames = JSON.parse(cityDisplayNames);
      }
      if (cityPhotos) {
        this.globalData.cityPhotos = JSON.parse(cityPhotos);
      }
      if (cityTravelPhotos) {
        this.globalData.cityTravelPhotos = JSON.parse(cityTravelPhotos);
      }
      if (cityFoodPhotos) {
        this.globalData.cityFoodPhotos = JSON.parse(cityFoodPhotos);
      }
      if (deletedPhotoIds) {
        this.globalData.deletedPhotoIds = JSON.parse(deletedPhotoIds);
      }
      if (pendingGroupPhotoReviews) {
        var parsedPhotoReviews = JSON.parse(pendingGroupPhotoReviews);
        this.globalData.pendingGroupPhotoReviews = Array.isArray(parsedPhotoReviews) ? parsedPhotoReviews : [];
      }
      if (cityNotes) {
        this.globalData.cityNotes = JSON.parse(cityNotes);
      }
      if (cityAvoidTips) {
        this.globalData.cityAvoidTips = JSON.parse(cityAvoidTips);
      }
      if (settings) {
        this.globalData.settings = JSON.parse(settings);
      }
      if (cardCount !== '') {
        this.globalData.cardCount = parseInt(cardCount) || 0;
      }
      if (ssrCount !== '') {
        this.globalData.ssrCount = parseInt(ssrCount) || 0;
      }
      if (urCount !== '') {
        this.globalData.urCount = parseInt(urCount) || 0;
      }
      // 恢复特殊成就相关统计
      var nightVisit = wx.getStorageSync('nightVisit');
      if (nightVisit) this.globalData.nightVisit = true;
      var earlyVisit = wx.getStorageSync('earlyVisit');
      if (earlyVisit) this.globalData.earlyVisit = true;
      var shareCount = wx.getStorageSync('shareCount');
      if (shareCount) this.globalData.shareCount = parseInt(shareCount) || 0;
      var noteCount = wx.getStorageSync('noteCount');
      if (noteCount) this.globalData.noteCount = parseInt(noteCount) || 0;
      var todayVisits = wx.getStorageSync('todayVisits');
      if (todayVisits) this.globalData.dailyVisit = todayVisits.count || 0;
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  },

  saveData: function() {
    try {
      wx.setStorageSync('visitedCities', JSON.stringify(this.globalData.visitedCities));
      wx.setStorageSync('visitedProvinces', JSON.stringify(this.globalData.visitedProvinces));
      wx.setStorageSync('visitDates', JSON.stringify(this.globalData.visitDates));
      wx.setStorageSync('cityDisplayNames', JSON.stringify(this.globalData.cityDisplayNames || {}));
      wx.setStorageSync('cityPhotos', JSON.stringify(this.globalData.cityPhotos));
      wx.setStorageSync('cityTravelPhotos', JSON.stringify(this.globalData.cityTravelPhotos));
      wx.setStorageSync('cityFoodPhotos', JSON.stringify(this.globalData.cityFoodPhotos));
      wx.setStorageSync('deletedPhotoIds', JSON.stringify(this.globalData.deletedPhotoIds || {}));
      wx.setStorageSync('pendingGroupPhotoReviews', JSON.stringify(this.globalData.pendingGroupPhotoReviews || []));
      wx.setStorageSync('cityNotes', JSON.stringify(this.globalData.cityNotes));
      wx.setStorageSync('cityAvoidTips', JSON.stringify(this.globalData.cityAvoidTips));
      wx.setStorageSync('settings', JSON.stringify(this.globalData.settings));
      wx.setStorageSync('cardCount', this.globalData.cardCount);
      wx.setStorageSync('ssrCount', this.globalData.ssrCount);
      wx.setStorageSync('urCount', this.globalData.urCount);
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  },

  addVisitedCity: function(cityId) {
    if (this.globalData.visitedCities.indexOf(cityId) === -1) {
      this.globalData.visitedCities.push(cityId);
      this.saveData();
      this.syncToCloud();
    }
  },

  getCityPhotos: function(cityId) {
    return this.globalData.cityPhotos[cityId] || [];
  },

  addCityPhoto: function(cityId, photoUrl) {
    if (!this.globalData.cityPhotos[cityId]) {
      this.globalData.cityPhotos[cityId] = [];
    }
    this.globalData.cityPhotos[cityId].push(photoUrl);
    this.saveData();
  },

  markPhotoDeleted: function(fileId) {
    if (!fileId) return;
    this.globalData.deletedPhotoIds = this.globalData.deletedPhotoIds || {};
    this.globalData.deletedPhotoIds[fileId] = true;
    this.saveData();
  },

  queuePendingGroupPhotoReview: function(entry) {
    this.globalData.pendingGroupPhotoReviews = groupPhotoReviewQueue.enqueue(
      this.globalData.pendingGroupPhotoReviews,
      entry
    );
    this.saveData();
  },

  getPendingGroupPhotoReviews: function(groupId) {
    return groupPhotoReviewQueue.forGroup(this.globalData.pendingGroupPhotoReviews, groupId);
  },

  removePendingGroupPhotoReview: function(groupId, fileId) {
    this.globalData.pendingGroupPhotoReviews = groupPhotoReviewQueue.remove(
      this.globalData.pendingGroupPhotoReviews,
      groupId,
      fileId
    );
    this.saveData();
  },

  getVisitedCityCount: function() {
    return this.globalData.visitedCities.length;
  },

  getVisitedProvinceCount: function() {
    var provincesData = require('./utils/provinces.js');
    var citiesData = require('./utils/cities.js');
    var provinces = provincesData.provinces;
    var cities = citiesData.cities;

    var visitedProvinceIds = [];
    for (var i = 0; i < this.globalData.visitedCities.length; i++) {
      var cityId = this.globalData.visitedCities[i];
      if (provinces.some(function(province) { return province.id === cityId; })) {
        if (visitedProvinceIds.indexOf(cityId) === -1) visitedProvinceIds.push(cityId);
        continue;
      }
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].id === cityId) {
          if (visitedProvinceIds.indexOf(cities[j].provinceId) === -1) {
            visitedProvinceIds.push(cities[j].provinceId);
          }
          break;
        }
      }
    }

    return visitedProvinceIds.length;
  },

  getStats: function() {
    var visitedCities = this.globalData.visitedCities || [];
    var cityTravelPhotos = this.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = this.globalData.cityFoodPhotos || {};

    var travelPhotoCount = 0;
    var travelKeys = Object.keys(cityTravelPhotos);
    for (var i = 0; i < travelKeys.length; i++) {
      travelPhotoCount += cityTravelPhotos[travelKeys[i]].length;
    }

    var foodPhotoCount = 0;
    var foodKeys = Object.keys(cityFoodPhotos);
    for (var j = 0; j < foodKeys.length; j++) {
      foodPhotoCount += cityFoodPhotos[foodKeys[j]].length;
    }

    return {
      visitedCount: visitedCities.length,
      visitedProvinces: this.getVisitedProvinceCount(),
      travelPhotoCount: travelPhotoCount,
      foodPhotoCount: foodPhotoCount,
      photoCount: travelPhotoCount + foodPhotoCount
    };
  }
});
