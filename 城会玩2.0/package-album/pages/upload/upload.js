var app = getApp();
var citiesData = require('../../../utils/cities.js');
var provincesData = require('../../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var privacy = require('../../../utils/privacy.js');

Page({
  data: {
    selectedCity: null,
    selectedPhotos: [],
    note: '',
    visitDate: '',
    canSubmit: false
  },

  onLoad: function() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    var monthStr = month < 10 ? '0' + month : '' + month;
    var dayStr = day < 10 ? '0' + day : '' + day;
    
    this.setData({
      visitDate: year + '-' + monthStr + '-' + dayStr
    });
  },

  showCityPicker: function() {
    var cityNames = [];
    for (var i = 0; i < cities.length && i < 20; i++) {
      cityNames.push(cities[i].name);
    }

    var self = this;
    wx.showActionSheet({
      itemList: cityNames,
      success: function(res) {
        var selectedCity = cities[res.tapIndex];
        self.setData({
          selectedCity: selectedCity
        });
        self.checkCanSubmit();
      }
    });
  },

  choosePhotos: function() {
    var self = this;
    privacy.ensure(this, function() {
      self.choosePhotosAfterPrivacy();
    });
  },

  choosePhotosAfterPrivacy: function() {
    var remainingCount = 9 - this.data.selectedPhotos.length;
    var self = this;
    
    wx.chooseImage({
      count: remainingCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var newPhotos = self.data.selectedPhotos.concat(res.tempFilePaths);
        self.setData({
          selectedPhotos: newPhotos
        });
        self.checkCanSubmit();
      }
    });
  },


  removePhoto: function(e) {
    var index = e.currentTarget.dataset.index;
    var photos = this.data.selectedPhotos.slice();
    photos.splice(index, 1);
    
    this.setData({
      selectedPhotos: photos
    });
    this.checkCanSubmit();
  },

  onNoteInput: function(e) {
    this.setData({
      note: e.detail.value
    });
  },

  onDateChange: function(e) {
    this.setData({
      visitDate: e.detail.value
    });
  },

  checkCanSubmit: function() {
    var selectedCity = this.data.selectedCity;
    var selectedPhotos = this.data.selectedPhotos;
    var canSubmit = selectedCity && selectedPhotos.length > 0;
    
    this.setData({
      canSubmit: canSubmit
    });
  },

  submit: function() {
    var self = this;
    privacy.ensure(this, function() {
      self.submitAfterPrivacy();
    });
  },

  submitAfterPrivacy: function() {
    if (!this.data.canSubmit) return;

    var selectedCity = this.data.selectedCity;
    var selectedPhotos = this.data.selectedPhotos;
    var note = this.data.note;
    var visitDate = this.data.visitDate;
    var self = this;
    
    wx.showLoading({
      title: '安全校验中...'
    });

    this.checkContentSafety(note, selectedPhotos, function(pass, safePhotos) {
      if (!pass) {
        wx.hideLoading();
        wx.showToast({
          title: '内容未通过安全校验',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({ title: '保存中...' });
      self.saveFootprint(selectedCity, safePhotos, note, visitDate);
    });
  },


  checkContentSafety: function(note, photos, callback) {
    if (!app.globalData.useCloud || !wx.cloud) {
      callback(true, photos);
      return;
    }

    var safePhotos = [];
    var self = this;

    wx.cloud.callFunction({
      name: 'contentSecurity',
      data: {
        action: 'checkText',
        text: note || ''
      },
      timeout: 10000
    }).then(function(res) {
      if (res.result && res.result.pass === false) {
        callback(false, []);
        return;
      }

      self.uploadAndCheckPhotos(photos, 0, safePhotos, callback);
    }).catch(function() {
      callback(false, []);
    });
  },

  uploadAndCheckPhotos: function(photos, index, safePhotos, callback) {
    var self = this;
    if (index >= photos.length) {
      callback(true, safePhotos);
      return;
    }

    var filePath = photos[index];
    var extMatch = filePath.match(/\.[^.]+$/);
    var cloudPath = 'footprints/' + Date.now() + '_' + index + (extMatch ? extMatch[0] : '.jpg');

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath
    }).then(function(uploadRes) {
      return wx.cloud.callFunction({
        name: 'contentSecurity',
        data: {
          action: 'checkImage',
          fileID: uploadRes.fileID
        },
        timeout: 15000
      }).then(function(checkRes) {
        if (checkRes.result && checkRes.result.pass === false) {
          wx.cloud.deleteFile({ fileList: [uploadRes.fileID] }).catch(function() {});
          callback(false, safePhotos);
          return;
        }
        safePhotos.push(uploadRes.fileID);
        self.uploadAndCheckPhotos(photos, index + 1, safePhotos, callback);
      });
    }).catch(function() {
      callback(false, safePhotos);
    });
  },

  saveFootprint: function(selectedCity, photos, note, visitDate) {
    var self = this;

    var visitedCities = app.globalData.visitedCities || [];
    if (visitedCities.indexOf(selectedCity.id) === -1) {
      visitedCities.push(selectedCity.id);
      app.globalData.visitedCities = visitedCities;
    }

    var visitDates = app.globalData.visitDates || {};
    visitDates[selectedCity.id] = visitDate;
    app.globalData.visitDates = visitDates;

    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var existingTravelPhotos = cityTravelPhotos[selectedCity.id] || [];
    cityTravelPhotos[selectedCity.id] = existingTravelPhotos.concat(photos);
    app.globalData.cityTravelPhotos = cityTravelPhotos;

    if (note) {
      var cityNotes = app.globalData.cityNotes || {};
      cityNotes[selectedCity.id] = note;
      app.globalData.cityNotes = cityNotes;
    }

    app.saveData();
    app.syncToCloud();
    this.sharePhotosToGroup(selectedCity, photos, function() {
      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000,
        success: function() {
          setTimeout(function() {
            wx.navigateBack();
          }, 1500);
        }
      });
    });
  },

  sharePhotosToGroup: function(selectedCity, photos, done) {
    var localGroup = wx.getStorageSync('myGroup');
    if (!localGroup || !app.globalData.useCloud) {
      done();
      return;
    }

    var groupData = null;
    try {
      groupData = JSON.parse(localGroup);
    } catch (e) {}

    if (!groupData || !groupData.groupInfo || !groupData.groupInfo.id) {
      done();
      return;
    }

    var index = 0;
    function next() {
      if (index >= photos.length) {
        done();
        return;
      }
      var fileID = photos[index++];
      wx.cloud.callFunction({
        name: 'group',
        data: {
          action: 'sharePhoto',
          data: {
            groupId: groupData.groupInfo.id,
            fileId: fileID,
            url: fileID,
            cityId: selectedCity.id,
            cityName: selectedCity.name
          }
        },
        timeout: 10000
      }).then(next).catch(next);
    }

    next();
  },

  cancel: function() {
    wx.navigateBack();
  },

  onPrivacyAgree: function() {
    privacy.handleAgree(this);
  },

  onPrivacyReject: function() {
    privacy.handleReject(this);
  }
});