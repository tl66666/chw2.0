var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var audioManager = require('../../utils/audio-manager.js').getAudioManager();
var groupView = require('../../utils/group-view.js');
var photoRecords = require('../../utils/photo-records.js');
var cloudImage = require('../../utils/cloudImage.js');

Page({
  data: {
    totalPhotos: 0,
    travelPhotoCount: 0,
    foodPhotoCount: 0,
    visitedCount: 0,
    visitedCities: [],
    selectedCity: '',
    activeTab: 'all',
    allPhotos: [],
    displayPhotos: []
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    var self = this;
    this.loadData();
    this.flushPendingPhotoRemovals();
    if (app.refreshGroupCache) {
      app.refreshGroupCache(function(updated) {
        if (updated) self.loadData();
      });
    }
  },

  loadData: function() {
    try {
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};

    // 计算统计数据
    var travelPhotoCount = 0;
    var foodPhotoCount = 0;
    var cityList = [];
    var allPhotos = [];
    var visitedProvinceIds = [];

    for (var i = 0; i < visitedCities.length; i++) {
      var cityId = visitedCities[i];
      var provinceId = this.getProvinceIdByCityId(cityId);
      if (provinceId && visitedProvinceIds.indexOf(provinceId) === -1) {
        visitedProvinceIds.push(provinceId);
      }
      var cityName = this.getProvinceNameByCityId(cityId);

      // 获取旅游照片
      var travelPhotos = cityTravelPhotos[cityId] || [];
      // 兼容旧数据
      var oldPhotos = cityPhotos[cityId] || [];
      if (oldPhotos.length > 0 && travelPhotos.length === 0) {
        travelPhotos = oldPhotos;
      }

      // 获取美食照片
      var foodPhotos = cityFoodPhotos[cityId] || [];

      // 只将有照片的城市加入筛选列表
      var cityPhotoCount = travelPhotos.length + foodPhotos.length;

      if (cityPhotoCount > 0) {
        cityList.push({
          id: cityId,
          name: cityName,
          photoCount: cityPhotoCount
        });
      }

      travelPhotoCount += travelPhotos.length;
      foodPhotoCount += foodPhotos.length;

      // 添加旅游照片
      for (var k = 0; k < travelPhotos.length; k++) {
        var travelPhoto = travelPhotos[k];
        allPhotos.push({
          url: typeof travelPhoto === 'string' ? travelPhoto : (travelPhoto.url || travelPhoto.fileId || ''),
          displayUrl: typeof travelPhoto === 'string' ? '' : (travelPhoto.displayUrl || travelPhoto.localPath || ''),
          status: typeof travelPhoto === 'string' ? 'verified' : (travelPhoto.status || 'verified'),
          cityId: cityId,
          cityName: cityName,
          type: 'travel',
          typeText: '旅行',
          date: this.formatDate(new Date()),
          index: k
        });
        var travelItem = allPhotos[allPhotos.length - 1];
        travelItem.fileId = photoRecords.getFileId(travelPhoto);
        travelItem.source = oldPhotos.length > 0 && (cityTravelPhotos[cityId] || []).length === 0 ? 'legacy' : 'local';
        travelItem.storageKey = travelItem.source === 'legacy' ? 'cityPhotos' : 'cityTravelPhotos';
        travelItem.photoKey = travelItem.source + ':travel:' + cityId + ':' + travelItem.fileId;
      }

      // 添加美食照片
      for (var m = 0; m < foodPhotos.length; m++) {
        var foodPhoto = foodPhotos[m];
        allPhotos.push({
          url: typeof foodPhoto === 'string' ? foodPhoto : (foodPhoto.url || foodPhoto.fileId || ''),
          displayUrl: typeof foodPhoto === 'string' ? '' : (foodPhoto.displayUrl || foodPhoto.localPath || ''),
          status: typeof foodPhoto === 'string' ? 'verified' : (foodPhoto.status || 'verified'),
          cityId: cityId,
          cityName: cityName,
          type: 'food',
          typeText: '美食',
          date: this.formatDate(new Date()),
          index: m
        });
        var foodItem = allPhotos[allPhotos.length - 1];
        foodItem.fileId = photoRecords.getFileId(foodPhoto);
        foodItem.source = 'local';
        foodItem.storageKey = 'cityFoodPhotos';
        foodItem.photoKey = 'local:food:' + cityId + ':' + foodItem.fileId;
      }
    }

    var groupPhotos = groupView.getAllPhotos();
    for (var gp = 0; gp < groupPhotos.length; gp++) {
      var groupPhoto = groupPhotos[gp];
      if (!groupPhoto.cityId) continue;
      var existingCity = false;
      for (var ci = 0; ci < cityList.length; ci++) {
        if (cityList[ci].id === groupPhoto.cityId) {
          cityList[ci].photoCount++;
          existingCity = true;
          break;
        }
      }
      if (!existingCity) {
        cityList.push({
          id: groupPhoto.cityId,
          name: this.getProvinceNameByCityId(groupPhoto.cityId),
          photoCount: 1
        });
      }
      if (groupPhoto.type === 'food') foodPhotoCount++;
      else travelPhotoCount++;
      allPhotos.push(groupPhoto);
      var groupProvinceId = this.getProvinceIdByCityId(groupPhoto.cityId);
      if (groupProvinceId && visitedProvinceIds.indexOf(groupProvinceId) === -1) {
        visitedProvinceIds.push(groupProvinceId);
      }
    }

    allPhotos = photoRecords.uniquePhotos(allPhotos);
    travelPhotoCount = 0;
    foodPhotoCount = 0;
    cityList = [];
    visitedProvinceIds = [];
    var cityPhotoMap = {};
    allPhotos.forEach(function(photo) {
      var provinceId = this.getProvinceIdByCityId(photo.cityId);
      if (provinceId && visitedProvinceIds.indexOf(provinceId) === -1) {
        visitedProvinceIds.push(provinceId);
      }
      if (!cityPhotoMap[photo.cityId]) {
        cityPhotoMap[photo.cityId] = {
          id: photo.cityId,
          name: this.getProvinceNameByCityId(photo.cityId),
          photoCount: 0
        };
        cityList.push(cityPhotoMap[photo.cityId]);
      }
      cityPhotoMap[photo.cityId].photoCount++;
      if (photo.type === 'food') foodPhotoCount++;
      else travelPhotoCount++;
    }, this);

    this.setData({
      totalPhotos: travelPhotoCount + foodPhotoCount,
      travelPhotoCount: travelPhotoCount,
      foodPhotoCount: foodPhotoCount,
      visitedCount: visitedProvinceIds.length,
      visitedCities: cityList,
      selectedCity: '',
      activeTab: 'all',
      allPhotos: allPhotos,
      displayPhotos: allPhotos
    });
    this.resolveAlbumPhotoDisplayUrls(allPhotos);
    } catch (err) {
      console.error('[album] loadData error:', err);
    }
  },

  getProvinceNameByCityId: function(cityId) {
    var provinceId = this.getProvinceIdByCityId(cityId);
    if (!provinceId) return cityId;
    for (var j = 0; j < provinces.length; j++) {
      if (provinces[j].id === provinceId) return provinces[j].name;
    }
    return cityId;
  },

  getProvinceIdByCityId: function(cityId) {
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) {
        return cities[i].provinceId;
      }
    }
    for (var p = 0; p < provinces.length; p++) {
      if (provinces[p].id === cityId) return cityId;
    }
    return '';
  },

  resolveAlbumPhotoDisplayUrls: function(photos) {
    if (!wx.cloud || !photos || photos.length === 0) return;
    var fileList = [];
    photos.forEach(function(item) {
      if (item.url && item.url.indexOf('cloud://') === 0 && fileList.indexOf(item.url) === -1) {
        fileList.push(item.url);
      }
    });
    if (fileList.length === 0) return;

    var self = this;
    cloudImage.resolveMany(fileList, function(map) {
      var allPhotos = (self.data.allPhotos || []).map(function(item) {
        if (item.url && map[item.url]) item.displayUrl = map[item.url];
        return item;
      });
      self.setData({ allPhotos: allPhotos });
      self.filterPhotos();
    });
  },

  formatDate: function(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  },

  switchTab: function(e) {
    audioManager.play('button_tap');
    var tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterPhotos();
  },

  filterByCity: function(e) {
    audioManager.play('button_tap');
    var cityId = e.currentTarget.dataset.city;

    this.setData({
      selectedCity: cityId
    });

    this.filterPhotos();
  },

  filterPhotos: function() {
    var activeTab = this.data.activeTab;
    var selectedCity = this.data.selectedCity;
    var allPhotos = this.data.allPhotos;
    var filtered = [];

    for (var i = 0; i < allPhotos.length; i++) {
      var photo = allPhotos[i];
      var typeMatch = activeTab === 'all' || photo.type === activeTab;
      var cityMatch = selectedCity === '' || photo.cityId === selectedCity;

      if (typeMatch && cityMatch) {
        filtered.push(photo);
      }
    }

    this.setData({
      displayPhotos: filtered
    });
  },

  previewPhoto: function(e) {
    var url = e.currentTarget.dataset.url;
    var urls = [];
    for (var i = 0; i < this.data.displayPhotos.length; i++) {
      urls.push(this.data.displayPhotos[i].displayUrl || this.data.displayPhotos[i].url);
    }

    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  requestDeletePhoto: function(e) {
    var photoKey = e.currentTarget.dataset.key;
    var allPhotos = this.data.allPhotos || [];
    var photo = null;
    for (var i = 0; i < allPhotos.length; i++) {
      if (allPhotos[i].photoKey === photoKey) {
        photo = allPhotos[i];
        break;
      }
    }
    if (!photo) return;
    if (photo.source === 'group') {
      wx.showToast({ title: '群友共享照片请由上传者删除', icon: 'none' });
      return;
    }

    var self = this;
    wx.showModal({
      title: '删除照片',
      content: '删除后将无法恢复，确定继续吗？',
      confirmText: '删除',
      confirmColor: '#D66F58',
      success: function(res) {
        if (res.confirm) self.deletePersonalPhoto(photo);
      }
    });
  },

  deletePersonalPhoto: function(photo) {
    var storageKey = photo.storageKey || (photo.type === 'food' ? 'cityFoodPhotos' : 'cityTravelPhotos');
    if (app.markPhotoDeleted) app.markPhotoDeleted(photo.fileId);
    app.globalData[storageKey] = photoRecords.removeFromMap(app.globalData[storageKey] || {}, photo.cityId, photo.fileId);
    app.saveData();
    this.loadData();
    this.removePhotoFromCloud(photo).then(function(removed) {
      wx.showToast({
        title: removed ? '照片已删除' : '已从本地删除，联网后会重试',
        icon: removed ? 'success' : 'none'
      });
    });
  },

  removePhotoFromCloud: function(photo) {
    if (!app.globalData.isLogin || !wx.cloud || !photo.fileId) return Promise.resolve(true);
    var self = this;
    var removeRecord = wx.cloud.callFunction({
      name: 'syncData',
      data: { action: 'removePhoto', data: { cityId: photo.cityId, fileId: photo.fileId } }
    }).then(function(res) {
      return !!(res.result && res.result.success && typeof res.result.removed === 'number');
    });
    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'removeSharedPhoto', data: { fileId: photo.fileId } }
    }).catch(function() {});
    return removeRecord.then(function(removed) {
      if (removed) {
        self.removePendingPhotoRemoval(photo.photoKey);
        if (photo.fileId.indexOf('cloud://') === 0) {
          wx.cloud.deleteFile({ fileList: [photo.fileId] }).catch(function() {});
        }
        return true;
      }
      self.queuePendingPhotoRemoval(photo);
      return false;
    }).catch(function() {
      self.queuePendingPhotoRemoval(photo);
      return false;
    });

  },

  getPendingPhotoRemovals: function() {
    try {
      var pending = wx.getStorageSync('pendingPhotoRemovals');
      return Array.isArray(pending) ? pending : JSON.parse(pending || '[]');
    } catch (e) {
      return [];
    }
  },

  queuePendingPhotoRemoval: function(photo) {
    var pending = this.getPendingPhotoRemovals();
    var exists = pending.some(function(item) { return item.photoKey === photo.photoKey; });
    if (!exists) {
      pending.push(photo);
      wx.setStorageSync('pendingPhotoRemovals', pending);
    }
  },

  removePendingPhotoRemoval: function(photoKey) {
    var pending = this.getPendingPhotoRemovals().filter(function(item) {
      return item.photoKey !== photoKey;
    });
    wx.setStorageSync('pendingPhotoRemovals', pending);
  },

  flushPendingPhotoRemovals: function() {
    if (!app.globalData.isLogin || !wx.cloud) return;
    var self = this;
    this.getPendingPhotoRemovals().forEach(function(photo) {
      self.removePhotoFromCloud(photo);
    });
  },

  goToMap: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
