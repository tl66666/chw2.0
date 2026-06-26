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
          title: self.data.securityErrorMessage || '安全校验失败',
          icon: 'none'
        });
        self.setData({ securityErrorMessage: '' });
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
        self.setData({
          securityErrorMessage: self.getSecurityMessage(res.result, '内容安全校验失败')
        });
        callback(false, []);
        return;
      }

      self.uploadAndCheckPhotos(photos, 0, safePhotos, callback);
    }).catch(function(err) {
      self.setData({
        securityErrorMessage: self.getSecurityMessage(err, '安全校验服务暂时不可用')
      });
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
        timeout: 8000
      }).then(function(checkRes) {
        if (checkRes.result && checkRes.result.pass === false) {
          wx.cloud.deleteFile({ fileList: [uploadRes.fileID] }).catch(function() {});
          self.setData({
            securityErrorMessage: self.getSecurityMessage(checkRes.result, '图片安全校验失败')
          });
          callback(false, safePhotos);
          return;
        }
        safePhotos.push(self.buildPhotoItem(uploadRes.fileID, 'verified', '', filePath));
        self.uploadAndCheckPhotos(photos, index + 1, safePhotos, callback);
      }).catch(function(err) {
        safePhotos.push(self.buildPhotoItem(uploadRes.fileID, 'private', self.getSecurityMessage(err, '仅自己可见'), filePath));
        self.setData({
          securityErrorMessage: self.getSecurityMessage(err, '图片校验超时，请稍后重试')
        });
        self.uploadAndCheckPhotos(photos, index + 1, safePhotos, callback);
      });
    }).catch(function(err) {
      self.setData({
        securityErrorMessage: self.getSecurityMessage(err, '图片上传或安全校验失败')
      });
      callback(false, safePhotos);
    });
  },

  buildPhotoItem: function(fileID, status, message, localPath) {
    return {
      url: fileID,
      fileId: fileID,
      displayUrl: localPath || fileID,
      localPath: localPath || '',
      status: status || 'verified',
      message: message || '',
      createTime: Date.now()
    };
  },

  getSecurityMessage: function(result, fallback) {
    result = result || {};
    if (result.blocked) {
      return result.message || '内容未通过安全校验，请调整后再试';
    }
    if (result.retryable || result.checked === false) {
      return result.message || '安全校验服务暂时不可用，请稍后重试';
    }
    var raw = String(result.errMsg || result.message || result.error || '');
    if (raw.indexOf('-504003') !== -1 || raw.indexOf('FUNCTIONS_TIME_LIMIT') !== -1 || raw.indexOf('timed out') !== -1) {
      return '图片校验超时，请重新部署 contentSecurity 云函数后重试';
    }
    if (raw.indexOf('cloud.callFunction') !== -1 || raw.length > 40) {
      return fallback || '安全校验服务暂时不可用';
    }
    return raw || fallback || '安全校验失败';
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
    this.syncCityToGroup(selectedCity);
    this.sharePhotosToGroup(selectedCity, this.getVerifiedPhotoUrls(photos), function() {
      var finish = function() {
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
      };
      if (app.refreshGroupCache) app.refreshGroupCache(finish);
      else finish();
    });
  },

  getPhotoUrl: function(photo) {
    if (!photo) return '';
    return typeof photo === 'string' ? photo : (photo.displayUrl || photo.url || photo.fileId || '');
  },

  getVerifiedPhotoUrls: function(photos) {
    var self = this;
    return (photos || []).filter(function(item) {
      return typeof item === 'string' || item.status === 'verified' || item.status === 'local';
    }).map(function(item) {
      return self.getPhotoUrl(item);
    }).filter(Boolean);
  },

  sharePhotosToGroup: function(selectedCity, photos, done) {
    var localGroup = wx.getStorageSync('myGroup');
    if (!localGroup || !wx.cloud) {
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
            cityName: selectedCity.name,
            provinceId: selectedCity.provinceId || '',
            type: 'travel'
          }
        },
        timeout: 10000
      }).then(next).catch(next);
    }

    next();
  },

  syncCityToGroup: function(selectedCity) {
    var localGroup = wx.getStorageSync('myGroup');
    if (!selectedCity || !localGroup || !wx.cloud) return;

    var groupData = null;
    try {
      groupData = typeof localGroup === 'string' ? JSON.parse(localGroup) : localGroup;
    } catch (e) {}

    if (!groupData || !groupData.groupInfo || !groupData.groupInfo.id) return;

    var userInfo = app.globalData.userInfo || {};
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'syncCityRecord',
        data: {
          groupId: groupData.groupInfo.id,
          cityId: selectedCity.id,
          cityName: selectedCity.name || selectedCity.id,
          provinceId: selectedCity.provinceId || '',
          isVisited: true,
          userInfo: {
            nickName: userInfo.nickName || '微信用户',
            avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg'
          }
        }
      },
      timeout: 8000
    }).catch(function() {});
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
