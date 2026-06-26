App({
  globalData: {
    userInfo: null,
    openid: '',
    isLogin: false,
    visitedCities: [],
    visitedProvinces: [],
    visitDates: {},       // 城市访问日期记录 { cityId: '2024-01-15' }
    cityPhotos: {},
    cityTravelPhotos: {},
    cityFoodPhotos: {},
    cityNotes: {},
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
      // 云函数未部署或超时，切换到本地模式
      self.globalData.useCloud = false;
    });
  },

  // 合并云端数据
  mergeCloudData: function(cloudData) {
    // 合并城市记录
    if (cloudData.cityRecords) {
      for (var i = 0; i < cloudData.cityRecords.length; i++) {
        var record = cloudData.cityRecords[i];
        if (record.isVisited && this.globalData.visitedCities.indexOf(record.cityId) === -1) {
          this.globalData.visitedCities.push(record.cityId);
        }
      }
    }
    
    // 合并照片
    if (cloudData.photos) {
      for (var j = 0; j < cloudData.photos.length; j++) {
        var photo = cloudData.photos[j];
        var targetObj = photo.type === 'food' ? this.globalData.cityFoodPhotos : this.globalData.cityTravelPhotos;
        
        if (!targetObj[photo.cityId]) {
          targetObj[photo.cityId] = [];
        }
        
        // 避免重复
        var exists = false;
        for (var k = 0; k < targetObj[photo.cityId].length; k++) {
          if (targetObj[photo.cityId][k] === photo.url) {
            exists = true;
            break;
          }
        }
        
        if (!exists) {
          targetObj[photo.cityId].push(photo.url);
        }
      }
    }
    
    // 合并笔记
    if (cloudData.notes) {
      for (var m = 0; m < cloudData.notes.length; m++) {
        var note = cloudData.notes[m];
        this.globalData.cityNotes[note.cityId] = note.content;
      }
    }
    
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

    var photos = [];
    var travelKeys = Object.keys(this.globalData.cityTravelPhotos || {});
    for (var p = 0; p < travelKeys.length; p++) {
      var travelCityId = travelKeys[p];
      var travelPhotos = this.globalData.cityTravelPhotos[travelCityId] || [];
      for (var tp = 0; tp < travelPhotos.length; tp++) {
        photos.push({
          cityId: travelCityId,
          provinceId: this.getProvinceIdByCityId(travelCityId),
          type: 'travel',
          fileId: travelPhotos[tp],
          url: travelPhotos[tp]
        });
      }
    }

    var foodKeys = Object.keys(this.globalData.cityFoodPhotos || {});
    for (var f = 0; f < foodKeys.length; f++) {
      var foodCityId = foodKeys[f];
      var foodPhotos = this.globalData.cityFoodPhotos[foodCityId] || [];
      for (var fp = 0; fp < foodPhotos.length; fp++) {
        photos.push({
          cityId: foodCityId,
          provinceId: this.getProvinceIdByCityId(foodCityId),
          type: 'food',
          fileId: foodPhotos[fp],
          url: foodPhotos[fp]
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
    var cities = citiesData.cities;
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) {
        return cities[i].provinceId;
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
      var cityNotes = wx.getStorageSync('cityNotes');
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
      if (cityPhotos) {
        this.globalData.cityPhotos = JSON.parse(cityPhotos);
      }
      if (cityTravelPhotos) {
        this.globalData.cityTravelPhotos = JSON.parse(cityTravelPhotos);
      }
      if (cityFoodPhotos) {
        this.globalData.cityFoodPhotos = JSON.parse(cityFoodPhotos);
      }
      if (cityNotes) {
        this.globalData.cityNotes = JSON.parse(cityNotes);
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
      wx.setStorageSync('cityPhotos', JSON.stringify(this.globalData.cityPhotos));
      wx.setStorageSync('cityTravelPhotos', JSON.stringify(this.globalData.cityTravelPhotos));
      wx.setStorageSync('cityFoodPhotos', JSON.stringify(this.globalData.cityFoodPhotos));
      wx.setStorageSync('cityNotes', JSON.stringify(this.globalData.cityNotes));
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
