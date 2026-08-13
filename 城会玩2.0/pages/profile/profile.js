var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var privacy = require('../../utils/privacy.js');
var groupView = require('../../utils/group-view.js');

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
  food: '味',
  note: '记'
};

Page({
  data: {
    userInfo: {},
    isWechatUser: false,
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
    recentActivities: [],
    showEditProfile: false,
    editNickName: '',
    editAvatarUrl: ''
  },

  onLoad: function() {
    this.loadUserInfo();
    this.loadStats();
    this.loadRecentActivities();
  },

  onShow: function() {
    var self = this;
    this.loadUserInfo();
    this.loadStats();
    this.loadRecentActivities();
    if (app.refreshGroupCache) {
      app.refreshGroupCache(function(updated) {
        if (updated) {
          self.loadStats();
          self.loadRecentActivities();
        }
      });
    }
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
    this.setData({
      userInfo: displayUserInfo,
      isWechatUser: !!(app.globalData.isLogin && app.globalData.openid && displayUserInfo.nickName !== '游客')
    });
  },

  loginWithWechat: function() {
    var self = this;
    privacy.ensure(this, function() {
      app.globalData.useCloud = true;
      app.login(function(success) {
        if (success) {
          self.loadUserInfo();
          self.loadStats();
          self.loadRecentActivities();
        }
      });
    });
  },

  goLaunch: function() {
    wx.navigateTo({
      url: '/pages/launch/launch?from=profile'
    });
  },

  // 头像加载失败处理
  onAvatarError: function() {
    this.setData({
      'userInfo.avatarUrl': '/images/avatar.jpg'
    });
  },

  openEditProfile: function() {
    this.setData({
      showEditProfile: true,
      editNickName: this.data.userInfo.nickName || '旅行者',
      editAvatarUrl: this.data.userInfo.avatarUrl || '/images/avatar.jpg'
    });
  },

  closeEditProfile: function() {
    this.setData({
      showEditProfile: false
    });
  },

  onNickNameInput: function(e) {
    this.setData({
      editNickName: e.detail.value
    });
  },

  chooseEditAvatar: function() {
    var self = this;
    privacy.ensure(this, function() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: function(res) {
          if (res.tempFiles && res.tempFiles[0]) {
            self.setData({
              editAvatarUrl: res.tempFiles[0].tempFilePath
            });
          }
        }
      });
    });
  },

  saveProfile: function() {
    var self = this;
    var name = (this.data.editNickName || '').trim();
    if (!name) {
      wx.showToast({
        title: '先取个旅行昵称吧',
        icon: 'none'
      });
      return;
    }
    if (name.length > 12) {
      wx.showToast({
        title: '昵称最多 12 个字',
        icon: 'none'
      });
      return;
    }

    this.persistProfileAvatar(this.data.editAvatarUrl || '/images/avatar.jpg', function(avatarUrl) {
      if (!app.globalData.userInfo) {
        app.globalData.userInfo = {};
      }
      app.globalData.userInfo.nickName = name;
      app.globalData.userInfo.avatarUrl = avatarUrl || '/images/avatar.jpg';
      wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));

      self.setData({
        userInfo: {
          nickName: app.globalData.userInfo.nickName,
          avatarUrl: app.globalData.userInfo.avatarUrl
        },
        showEditProfile: false
      });

      wx.showToast({
        title: '资料已更新',
        icon: 'success'
      });
    });
  },

  persistProfileAvatar: function(filePath, done) {
    var userDataPath = '';
    try {
      userDataPath = wx.env.USER_DATA_PATH;
    } catch (e) {}
    // 已经是持久化路径（占位图、云端路径、网络URL、本地已保存路径）则直接返回
    if (!filePath || filePath.indexOf('/images/') === 0 || filePath.indexOf('cloud://') === 0 || filePath.indexOf('http') === 0 || (userDataPath && filePath.indexOf(userDataPath) === 0)) {
      done(filePath);
      return;
    }
    if (!userDataPath) {
      done(filePath);
      return;
    }

    var extMatch = filePath.match(/\.[a-zA-Z0-9]+$/);
    var destPath = userDataPath + '/profile_avatar_' + Date.now() + (extMatch ? extMatch[0] : '.jpg');
    try {
      wx.getFileSystemManager().copyFile({
        srcPath: filePath,
        destPath: destPath,
        success: function() {
          done(destPath);
        },
        fail: function() {
          done(filePath);
        }
      });
    } catch (e2) {
      done(filePath);
    }
  },

  loadStats: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var cityNotes = app.globalData.cityNotes || {};

    // 计算省份数量
    var visitedProvinceIds = app.globalData.visitedProvinces || [];

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
    try {
    var activities = [];
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityNotes = app.globalData.cityNotes || {};
    var cityPhotos = app.globalData.cityPhotos || {};

    // 收集所有活动数据
    var allActivities = [];

    // 城市访问记录 —— 每个城市单独显示一条
    var cityDisplayNames = app.globalData.cityDisplayNames || {};
    for (var i = 0; i < visitedCities.length; i++) {
      var cityId = visitedCities[i];
      var cityName = cityDisplayNames[cityId] || this.getCityNameById(cityId);
      allActivities.push({
        type: 'city',
        iconText: ACTIVITY_ICON_TEXT.city,
        text: '已点亮 ' + cityName,
        time: '已探索',
        sortKey: i
      });
    }

    // 旅行照片记录
    var travelKeys = Object.keys(cityTravelPhotos);
    for (var j = 0; j < travelKeys.length; j++) {
      var cityId = travelKeys[j];
      var placeName = this.getPlaceNameById(cityId);
      var photos = cityTravelPhotos[cityId];
      for (var p = 0; p < photos.length; p++) {
        allActivities.push({
          type: 'photo',
          iconText: ACTIVITY_ICON_TEXT.photo,
          text: '在 ' + placeName + ' 上传了旅行照片',
          time: '旅行记录',
          sortKey: 1000 + j * 100 + p
        });
      }
    }

    // 美食照片记录
    var foodKeys = Object.keys(cityFoodPhotos);
    for (var k = 0; k < foodKeys.length; k++) {
      var cityId = foodKeys[k];
      var placeName = this.getPlaceNameById(cityId);
      var photos = cityFoodPhotos[cityId];
      for (var q = 0; q < photos.length; q++) {
        allActivities.push({
          type: 'food',
          iconText: ACTIVITY_ICON_TEXT.food,
          text: '在 ' + placeName + ' 记录了美食',
          time: '美食记录',
          sortKey: 2000 + k * 100 + q
        });
      }
    }

    // 笔记记录
    var noteKeys = Object.keys(cityNotes);
    for (var n = 0; n < noteKeys.length; n++) {
      var cityId = noteKeys[n];
      var placeName = this.getPlaceNameById(cityId);
      if (cityNotes[cityId] && cityNotes[cityId].trim()) {
        allActivities.push({
          type: 'note',
          iconText: ACTIVITY_ICON_TEXT.note,
          text: '为 ' + placeName + ' 添加了旅行笔记',
          time: '笔记记录',
          sortKey: 3000 + n
        });
      }
    }

    // 兼容旧照片数据
    var oldKeys = Object.keys(cityPhotos);
    for (var o = 0; o < oldKeys.length; o++) {
      var cityId = oldKeys[o];
      var cityName = this.getPlaceNameById(cityId);
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
    } catch (err) {
      console.error('[profile] loadRecentActivities error:', err);
      this.setData({ recentActivities: [] });
    }
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

  // 根据城市ID获取省份ID
  getProvinceIdByCityId: function(cityId) {
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) return cities[i].provinceId;
    }
    for (var p = 0; p < provinces.length; p++) {
      if (provinces[p].id === cityId) return cityId;
    }
    return '';
  },

  // 根据省份ID获取省份名称
  getProvinceNameById: function(provinceId) {
    if (!provinceId) return '未知省份';
    for (var j = 0; j < provinces.length; j++) {
      if (provinces[j].id === provinceId) return provinces[j].name;
    }
    return '未知省份';
  },

  // 根据城市ID获取城市名称
  getPlaceNameById: function(cityId) {
    if (!cityId) return '未知城市';
    // 先查 cityDisplayNames（记录了打卡时的显示名称）
    var cityDisplayNames = app.globalData.cityDisplayNames || {};
    if (cityDisplayNames[cityId]) return cityDisplayNames[cityId];
    // 再尝试作为城市ID查找
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) {
        return cities[i].name;
      }
    }
    for (var p = 0; p < provinces.length; p++) {
      if (provinces[p].id === cityId) return provinces[p].name;
    }
    // 如果找不到，尝试作为城市名称字符串直接返回
    return cityId;
  },

  goToAlbum: function() {
    wx.switchTab({
      url: '/pages/album/album',
      fail: function(err) {
        console.error('[profile] switchTab to album failed:', err);
        wx.navigateTo({
          url: '/pages/album/album',
          fail: function(err2) {
            console.error('[profile] navigateTo album also failed:', err2);
            wx.showToast({ title: '打开相册失败，请重试', icon: 'none' });
          }
        });
      }
    });
  },

  goToSettings: function() {
    wx.navigateTo({
      url: '/package-others/pages/settings/settings'
    });
  },

  goToAchievements: function() {
    wx.navigateTo({
      url: '/package-others/pages/achievements/achievements'
    });
  },

  clearPersonalTravelState: function() {
    app.globalData.visitedCities = [];
    app.globalData.visitedProvinces = [];
    app.globalData.manualProvinceRecords = false;
    app.globalData.visitDates = {};
    app.globalData.cityDisplayNames = {};
    app.globalData.cityPhotos = {};
    app.globalData.cityTravelPhotos = {};
    app.globalData.cityFoodPhotos = {};
    app.globalData.cityNotes = {};
    app.globalData.cityAvoidTips = {};
    app.globalData.deletedPhotoIds = {};
    app.globalData.cardCount = 0;
    app.globalData.ssrCount = 0;
    app.globalData.urCount = 0;
    app.globalData.nightVisit = 0;
    app.globalData.earlyVisit = 0;
    app.globalData.shareCount = 0;
    app.globalData.noteCount = 0;
    app.globalData.dailyVisit = 0;
    app.globalData.todayVisits = 0;
    app.globalData.unlockedAchievements = [];
    app.saveData();

    var removeKeys = ['visitedCities', 'visitedProvinces', 'manualProvinceRecords', 'visitDates', 'cityDisplayNames', 'cityPhotos', 'cityTravelPhotos', 'cityFoodPhotos', 'cityNotes', 'cityAvoidTips', 'deletedPhotoIds', 'cardCount', 'ssrCount', 'urCount', 'nightVisit', 'earlyVisit', 'shareCount', 'noteCount', 'dailyVisit', 'todayVisits', 'unlockedAchievements'];
    for (var i = 0; i < removeKeys.length; i++) {
      try { wx.removeStorageSync(removeKeys[i]); } catch (e) {}
    }
    this.loadStats();
    this.loadRecentActivities();
  },

  verifyCloudTravelDataCleared: function(done) {
    if (!app.globalData.useCloud) {
      done(true);
      return;
    }
    wx.cloud.callFunction({
      name: 'syncData',
      data: { action: 'getAllData' },
      timeout: 15000
    }).then(function(response) {
      var result = response.result || {};
      var data = result.data || {};
      var remaining = [];
      if (!result.success) {
        done(false, '暂时无法确认数据是否已清除，请稍后再试。');
        return;
      }
      if ((data.cityRecords || []).length > 0) remaining.push('打卡记录');
      if ((data.photos || []).length > 0) remaining.push('照片');
      if ((data.notes || []).length > 0) remaining.push('笔记');
      if ((data.avoidTips || []).length > 0) remaining.push('避坑指南');
      if (remaining.length > 0) {
        done(false, '云端仍有旅行数据：' + remaining.join('、') + '。请稍后重试。');
        return;
      }
      done(true);
    }).catch(function(err) {
      done(false, (err && (err.errMsg || err.message)) || '无法核验云端清除结果，请检查网络');
    });
  },

  clearData: function() {
    var self = this;
    wx.showModal({
      title: '清除个人旅行数据',
      content: '确定要清除个人旅行记录吗？此操作不可恢复，云端数据也会一并清除。你仍会保留当前群组成员身份，群组内已经共享的内容不会受影响。',
      confirmColor: '#F87171',
      success: function(res) {
        if (!res.confirm) return;
        if (!app.globalData.useCloud || !wx.cloud || !app.globalData.isLogin) {
          wx.showModal({ title: '尚未完成清除', content: '请先登录并连接云开发后再清除，避免旧数据重新同步回来。', showCancel: false });
          return;
        }
        wx.showLoading({ title: '正在清除云端数据' });
        wx.cloud.callFunction({
          name: 'syncData',
          data: { action: 'clearAllData' },
          timeout: 15000
        }).then(function(response) {
          var result = response.result || {};
          if (!result.success) {
            wx.hideLoading();
            wx.showModal({ title: '暂时无法清除', content: '请检查网络后稍后重试。', showCancel: false });
            return;
          }
          self.verifyCloudTravelDataCleared(function(verified, message) {
            wx.hideLoading();
            if (!verified) {
              wx.showModal({ title: '尚未完成清除', content: message, showCancel: false });
              return;
            }
            self.clearPersonalTravelState();
            wx.showToast({ title: '个人数据已清除', icon: 'success' });
          });
        }).catch(function(err) {
          wx.hideLoading();
          wx.showModal({ title: '暂时无法清除', content: '请检查网络后稍后重试。', showCancel: false });
        });
      }
    });
  },

  // 更换头像
  changeAvatar: function() {
    var self = this;
    privacy.ensure(this, function() {
      self.changeAvatarAfterPrivacy();
    });
  },

  changeAvatarAfterPrivacy: function() {
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

    wx.showLoading({ title: '保存头像中...' });
    var extMatch = filePath.match(/\.[^.]+$/);
    var fs = wx.getFileSystemManager();
    var savePath = wx.env.USER_DATA_PATH + '/avatar_' + Date.now() + (extMatch ? extMatch[0] : '.jpg');

    fs.saveFile({
      tempFilePath: filePath,
      filePath: savePath,
      success: function(res) {
        var avatarUrl = res.savedFilePath;
        wx.hideLoading();
        if (!app.globalData.userInfo) {
          app.globalData.userInfo = {};
        }
        app.globalData.userInfo.avatarUrl = avatarUrl;
        wx.setStorageSync('userInfo', JSON.stringify(app.globalData.userInfo));
        self.setData({
          userInfo: app.globalData.userInfo,
          isWechatUser: !!(app.globalData.isLogin && app.globalData.openid)
        });
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      },
      fail: function(err) {
        console.error('头像保存失败:', err);
        wx.hideLoading();
        // 保存失败，尝试使用base64
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

  onPrivacyAgree: function() {
    privacy.handleAgree(this);
  },

  onPrivacyReject: function() {
    privacy.handleReject(this);
  }
});
