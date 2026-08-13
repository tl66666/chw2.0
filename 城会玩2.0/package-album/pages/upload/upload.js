var app = getApp();
var citiesData = require('../../../utils/cities.js');
var provincesData = require('../../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var privacy = require('../../../utils/privacy.js');
var photoRecords = require('../../../utils/photo-records.js');

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
      // 云端不可用时，直接通过本地文件系统保存照片
      this.uploadAndCheckPhotos(photos, 0, [], callback);
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
    var fs = wx.getFileSystemManager();
    var savePath = wx.env.USER_DATA_PATH + '/footprints_' + Date.now() + '_' + index + (extMatch ? extMatch[0] : '.jpg');

    fs.saveFile({
      tempFilePath: filePath,
      filePath: savePath,
      success: function(res) {
        var fileID = res.savedFilePath;
        // 本地存储模式下跳过云端安全校验，直接标记为已验证
        safePhotos.push(self.buildPhotoItem(fileID, 'verified', '', ''));
        self.uploadAndCheckPhotos(photos, index + 1, safePhotos, callback);
      },
      fail: function(err) {
        console.error('本地保存失败:', err);
        self.setData({
          securityErrorMessage: self.getSecurityMessage(err, '图片保存失败')
        });
        callback(false, safePhotos);
      }
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
      return '内容未通过安全校验，请调整后再试';
    }
    if (result.retryable || result.checked === false) {
      return '图片暂时无法同步，请稍后再试';
    }
    var raw = String(result.errMsg || result.message || result.error || '');
    if (raw.indexOf('-504003') !== -1 || raw.indexOf('FUNCTIONS_TIME_LIMIT') !== -1 || raw.indexOf('timed out') !== -1) {
      return '图片暂时无法同步，请稍后再试';
    }
    return fallback || '图片暂时无法同步，请稍后再试';
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
    var groupShareCandidates = photoRecords.splitGroupSharePhotos(photos);
    this.sharePhotosToGroup(selectedCity, groupShareCandidates.shareable, function(result) {
      var failedPhotos = ((result && result.failed) || []).concat(groupShareCandidates.blocked || []);
      self.queueFailedGroupPhotos(result && result.groupId, failedPhotos, selectedCity, visitDate);
      var failed = failedPhotos.length > 0 ? failedPhotos[0] : null;
      var finish = function() {
        wx.hideLoading();
        if (failed) {
          wx.showModal({
            title: '照片已保存到个人相册',
            content: '群相册未同步：' + (failed.reason || '请稍后重试'),
            showCancel: false,
            success: function() { wx.navigateBack(); }
          });
          return;
        }
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

  isLocalPhotoPath: function(fileId) {
    if (!fileId) return false;
    if (fileId.indexOf('wxfile://') === 0) return true;
    if (fileId.indexOf('http://tmp') === 0) return true;
    if (fileId.indexOf('http://store') === 0) return true;
    try {
      if (wx.env.USER_DATA_PATH && fileId.indexOf(wx.env.USER_DATA_PATH) === 0) return true;
    } catch (e) {}
    return false;
  },

  queueFailedGroupPhotos: function(groupId, photos, selectedCity, visitDate) {
    if (!groupId || !app.queuePendingGroupPhotoReview || !selectedCity) return;
    var self = this;

    (photos || []).forEach(function(photo) {
      var fileId = photoRecords.getFileId(photo);
      if (!fileId || !self.isLocalPhotoPath(fileId)) return;
      app.queuePendingGroupPhotoReview({
        groupId: groupId,
        fileId: fileId,
        cityId: selectedCity.id,
        cityName: selectedCity.name || '',
        provinceId: selectedCity.provinceId || '',
        type: 'travel',
        travelDate: visitDate || ''
      });
    });
  },

  getPhotoUrl: function(photo) {
    if (!photo) return '';
    return typeof photo === 'string' ? photo : (photo.displayUrl || photo.url || photo.fileId || '');
  },

  getVerifiedPhotoUrls: function(photos) {
    return (photos || []).filter(function(item) {
      return typeof item === 'string' || item.status === 'verified' || item.status === 'local';
    }).map(function(item) {
      return typeof item === 'string' ? item : (item.fileId || item.url || item.displayUrl || '');
    }).filter(Boolean);
  },

  resolveCloudGroupForPhotoShare: function(done) {
    if (!app.globalData.useCloud || !wx.cloud) {
      done(null, '云开发未初始化，请重新进入小程序后再试');
      return;
    }
    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'getMyGroup' },
      timeout: 10000
    }).then(function(res) {
      var result = res.result || {};
      if (result.success && result.groupInfo && result.groupInfo.id) {
        wx.setStorageSync('myGroup', JSON.stringify(result));
        done(result);
        return;
      }
      done(null, '暂时无法获取群组信息，请稍后再试');
    }).catch(function(err) {
      done(null, '暂时无法获取群组信息，请稍后再试');
    });
  },

  getGroupShareFailureReason: function(result) {
    var code = String((result && result.error) || '');
    if (code === 'UNKNOWN_ACTION') return '群相册暂时不可用，请稍后再试';
    if (code === 'NOT_A_MEMBER') return '当前微信账号不是这个群的成员，请重新进入群组';
    if (code === 'INVALID_FILE_ID') return '照片尚未完成云端上传，请稍后重新同步';
    return '群相册暂时未同步，请稍后再试';
  },

  sharePhotosToGroup: function(selectedCity, photos, done) {
    var self = this;
    this.resolveCloudGroupForPhotoShare(function(groupData, failureReason) {
      if (!groupData || !groupData.groupInfo || !groupData.groupInfo.id) {
        done({ synced: 0, failed: [{ fileId: '', reason: failureReason || '未识别到当前云端群组' }] });
        return;
      }
      var index = 0;
      var synced = 0;
      var failed = [];
      function next() {
        if (index >= photos.length) {
          done({ synced: synced, failed: failed, groupId: groupData.groupInfo.id });
          return;
        }
        var fileID = photos[index++];
        if (!fileID || !self.isLocalPhotoPath(fileID)) {
          failed.push({ fileId: fileID || '', reason: '照片尚未完成本地保存' });
          next();
          return;
        }
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
        }).then(function(res) {
          var result = res.result || {};
          if (result.success) synced += 1;
          else failed.push({ fileId: fileID, reason: self.getGroupShareFailureReason(result) });
          next();
        }).catch(function(err) {
          failed.push({ fileId: fileID, reason: (err && (err.errMsg || err.message)) || '群相册网络请求失败' });
          next();
        });
      }
      next();
    });
  },

  syncCityToGroup: function(selectedCity) {
    var localGroup = wx.getStorageSync('myGroup');
    if (!selectedCity || !localGroup || !app.globalData.useCloud || !wx.cloud) return;

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
