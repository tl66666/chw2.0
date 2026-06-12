var app = getApp();
var citiesData = require('../../../utils/cities.js');
var provincesData = require('../../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;

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
    if (!this.data.canSubmit) return;

    var selectedCity = this.data.selectedCity;
    var selectedPhotos = this.data.selectedPhotos;
    var note = this.data.note;
    var visitDate = this.data.visitDate;
    
    wx.showLoading({
      title: '保存中...'
    });

    var self = this;
    // 模拟保存过程
    setTimeout(function() {
      // 保存到全局数据
      var visitedCities = app.globalData.visitedCities || [];
      if (visitedCities.indexOf(selectedCity.id) === -1) {
        visitedCities.push(selectedCity.id);
        app.globalData.visitedCities = visitedCities;
      }

      // 保存照片
      var cityPhotos = app.globalData.cityPhotos || {};
      var existingPhotos = cityPhotos[selectedCity.id] || [];
      cityPhotos[selectedCity.id] = existingPhotos.concat(selectedPhotos);
      app.globalData.cityPhotos = cityPhotos;

      // 保存笔记
      if (note) {
        var cityNotes = app.globalData.cityNotes || {};
        cityNotes[selectedCity.id] = {
          content: note,
          date: visitDate
        };
        app.globalData.cityNotes = cityNotes;
      }

      // 保存到本地存储
      app.saveData();

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
    }, 1000);
  },

  cancel: function() {
    wx.navigateBack();
  }
});
