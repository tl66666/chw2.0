var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var audioManager = require('../../utils/audio-manager.js').getAudioManager();
var groupView = require('../../utils/group-view.js');

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
    if (app.refreshGroupCache) {
      app.refreshGroupCache(function(updated) {
        if (updated) self.loadData();
      });
    }
  },

  loadData: function() {
    try {
    var visitedCities = groupView.mergeCityIds(app.globalData.visitedCities || []);
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
    wx.cloud.getTempFileURL({ fileList: fileList }).then(function(res) {
      var map = {};
      (res.fileList || []).forEach(function(item) {
        if (item.fileID && item.tempFileURL) map[item.fileID] = item.tempFileURL;
      });
      var allPhotos = (self.data.allPhotos || []).map(function(item) {
        if (item.url && map[item.url]) item.displayUrl = map[item.url];
        return item;
      });
      self.setData({ allPhotos: allPhotos });
      self.filterPhotos();
    }).catch(function() {});
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

  onPhotoLongPress: function(e) {
    var self = this;
    var index = e.currentTarget.dataset.index;
    var cityId = e.currentTarget.dataset.cityId;
    var photoType = e.currentTarget.dataset.type;
    var fileId = e.currentTarget.dataset.fileId;

    wx.showActionSheet({
      itemList: ['删除这张照片'],
      itemColor: '#F87171',
      success: function(res) {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '删除照片',
            content: '确定要删除这张照片吗？云端记录也会一并删除。',
            confirmColor: '#F87171',
            success: function(modalRes) {
              if (modalRes.confirm) {
                self.doDeletePhoto(cityId, photoType, fileId, index);
              }
            }
          });
        }
      }
    });
  },

  doDeletePhoto: function(cityId, photoType, fileId, index) {
    var self = this;

    // 从 globalData 中删除
    if (photoType === 'food') {
      var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
      var foodPhotos = cityFoodPhotos[cityId] || [];
      var foodIdx = foodPhotos.indexOf(fileId);
      if (foodIdx > -1) {
        foodPhotos.splice(foodIdx, 1);
        if (foodPhotos.length === 0) {
          delete cityFoodPhotos[cityId];
        } else {
          cityFoodPhotos[cityId] = foodPhotos;
        }
        app.globalData.cityFoodPhotos = cityFoodPhotos;
      }
    } else {
      var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
      var travelPhotos = cityTravelPhotos[cityId] || [];
      var travelIdx = travelPhotos.indexOf(fileId);
      if (travelIdx > -1) {
        travelPhotos.splice(travelIdx, 1);
        if (travelPhotos.length === 0) {
          delete cityTravelPhotos[cityId];
        } else {
          cityTravelPhotos[cityId] = travelPhotos;
        }
        app.globalData.cityTravelPhotos = cityTravelPhotos;
      }
    }

    app.saveData();

    // 删除云端照片记录
    if (wx.cloud && app.globalData.isLogin && fileId) {
      wx.cloud.callFunction({
        name: 'syncData',
        data: {
          action: 'removePhoto',
          data: {
            cityId: cityId,
            fileId: fileId
          }
        },
        timeout: 8000
      }).then(function(res) {
        console.log('[album] 云端照片记录已删除', res.result);
      }).catch(function(err) {
        console.warn('[album] 云端删除失败:', err);
      });
    }

    // 重新加载
    this.loadData();
    wx.showToast({ title: '已删除', icon: 'success' });
  },

  goToUpload: function() {
    audioManager.play('photo_upload');
    wx.navigateTo({
      url: '/package-album/pages/upload/upload'
    });
  }
});
