var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var groupView = require('../../utils/group-view.js');

function parseJSON(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

Page({
  data: {
    groupInfo: null,
    isCreator: false,
    isAdmin: false,
    inviteCode: '',
    members: [],
    stats: {
      totalMembers: 0,
      totalCities: 0,
      totalProvinces: 0,
      totalPhotos: 0
    },
    groupCities: [],
    sharedPhotos: [],
    recentActivities: [],
    loading: true,
    showCreateModal: false,
    showInviteModal: false,
    showJoinModal: false,
    showPhotosModal: false,
    currentPhotoIndex: 0,
    newGroupName: '',
    newGroupType: 'friends',
    joinCode: '',
    groupTypeText: ''
  },

  preventClose: function() {},

  onLoad: function(options) {
    if (options && options.inviteCode) {
      this.setData({
        showJoinModal: true,
        joinCode: String(options.inviteCode || '').toUpperCase()
      });
    }
    this.ensureLoginAndLoad();
  },

  onShow: function() {
    this.ensureLoginAndLoad();
  },

  ensureLoginAndLoad: function() {
    var self = this;
    if (app.globalData.isLogin && (app.globalData.openid || wx.getStorageSync('openid'))) {
      this.loadGroupInfo();
      this.syncMyStats();
      return;
    }

    if (typeof app.login === 'function') {
      app.login(function(ok) {
        if (ok) {
          self.loadGroupInfo();
          self.syncMyStats();
        } else {
          self.setData({ loading: false });
        }
      });
    } else {
      this.setData({ loading: false });
    }
  },

  canUseGroupCloud: function() {
    return !!(wx.cloud && (app.globalData.openid || wx.getStorageSync('openid')));
  },

  getSafeUserInfo: function() {
    var userInfo = app.globalData.userInfo || parseJSON(wx.getStorageSync('userInfo'), {}) || {};
    var openid = app.globalData.openid || wx.getStorageSync('openid') || '';
    var tail = openid ? String(openid).slice(-4).toUpperCase() : '';
    return {
      nickName: userInfo.nickName || (tail ? '旅行者' + tail : '微信用户'),
      avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg'
    };
  },

  getGroupTypeText: function(type) {
    var map = { friends: '朋友', couple: '情侣', family: '家人' };
    return map[type] || '朋友';
  },

  getCityName: function(cityId) {
    var cities = citiesData.cities || [];
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) return cities[i].name;
    }
    return cityId || '城市';
  },

  getProvinceIdByCityId: function(cityId) {
    var cities = citiesData.cities || [];
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) return cities[i].provinceId || '';
    }
    return '';
  },

  getVisitedProvinceIds: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var result = [];
    for (var i = 0; i < visitedCities.length; i++) {
      var provinceId = this.getProvinceIdByCityId(visitedCities[i]);
      if (provinceId && result.indexOf(provinceId) === -1) result.push(provinceId);
    }
    return result;
  },

  getUserPhotoCount: function() {
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var count = 0;
    Object.keys(cityTravelPhotos).forEach(function(k) { count += (cityTravelPhotos[k] || []).length; });
    Object.keys(cityPhotos).forEach(function(k) { count += (cityPhotos[k] || []).length; });
    Object.keys(cityFoodPhotos).forEach(function(k) { count += (cityFoodPhotos[k] || []).length; });
    return count;
  },

  getUserStats: function() {
    var cityIds = app.globalData.visitedCities || [];
    var provinceIds = this.getVisitedProvinceIds();
    var cityProvinceMap = {};
    var cityNames = {};
    for (var i = 0; i < cityIds.length; i++) {
      cityProvinceMap[cityIds[i]] = this.getProvinceIdByCityId(cityIds[i]);
      cityNames[cityIds[i]] = this.getCityName(cityIds[i]);
    }
    return {
      photoCount: this.getUserPhotoCount(),
      visitedCount: cityIds.length,
      visitedProvinces: provinceIds.length,
      cityIds: cityIds,
      provinceIds: provinceIds,
      cityProvinceMap: cityProvinceMap,
      cityNames: cityNames
    };
  },

  normalizeGroupPayload: function(payload) {
    payload = payload || {};
    return {
      groupInfo: payload.groupInfo || null,
      isCreator: payload.isCreator || false,
      isAdmin: payload.isAdmin || false,
      inviteCode: payload.inviteCode || '',
      members: payload.members || [],
      stats: payload.stats || this.data.stats,
      groupCities: payload.groupCities || [],
      sharedPhotos: payload.sharedPhotos || [],
      recentActivities: payload.recentActivities || []
    };
  },

  applyGroupData: function(payload) {
    var data = this.normalizeGroupPayload(payload);
    this.setData({
      groupInfo: data.groupInfo,
      groupTypeText: data.groupInfo ? this.getGroupTypeText(data.groupInfo.type) : '',
      isCreator: data.isCreator,
      isAdmin: data.isAdmin,
      inviteCode: data.inviteCode,
      members: data.members,
      stats: data.stats,
      groupCities: data.groupCities,
      sharedPhotos: data.sharedPhotos,
      recentActivities: data.recentActivities,
      loading: false
    });
    wx.setStorageSync('myGroup', JSON.stringify(data));
  },

  buildLocalActivities: function() {
    var userInfo = this.getSafeUserInfo();
    var localActivities = [];
    var visitedCities = groupView.mergeCityIds(app.globalData.visitedCities || []);
    var seenProv = {};
    var allCities = citiesData.cities || [];
    var allProvinces = provincesData.provinces || [];
    for (var i = 0; i < visitedCities.length && i < 20; i++) {
      var cityId = visitedCities[i];
      var provId = '';
      var provName = '';
      for (var c = 0; c < allCities.length; c++) {
        if (allCities[c].id === cityId) {
          provId = allCities[c].provinceId;
          break;
        }
      }
      if (!provId || seenProv[provId]) continue;
      seenProv[provId] = true;
      for (var p = 0; p < allProvinces.length; p++) {
        if (allProvinces[p].id === provId) {
          provName = allProvinces[p].name;
          break;
        }
      }
      if (provName) {
        localActivities.push({
          id: 'local_city_' + provId,
          type: 'city',
          userName: userInfo.nickName,
          cityName: provName,
          createTime: '',
          displayTime: '已探索'
        });
      }
    }
    return localActivities;
  },

  buildLocalGroupData: function(name, type, inviteCode, isCreator) {
    var userInfo = this.getSafeUserInfo();
    var openid = app.globalData.openid || wx.getStorageSync('openid') || 'local_user';
    var stats = this.getUserStats();
    var localActivities = this.buildLocalActivities();
    return {
      groupInfo: {
        id: 'group_local_' + Date.now(),
        name: name || '我的旅行小队',
        type: type || 'friends',
        inviteCode: inviteCode,
        createTime: new Date().toISOString(),
        creatorOpenid: isCreator ? openid : ''
      },
      isCreator: !!isCreator,
      isAdmin: !!isCreator,
      inviteCode: inviteCode,
      members: [{
        openid: openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        isCreator: !!isCreator,
        role: isCreator ? '创建者' : '成员',
        cityCount: stats.visitedCount,
        provinceCount: stats.visitedProvinces,
        photoCount: stats.photoCount
      }],
      stats: {
        totalMembers: 1,
        totalCities: stats.visitedCount,
        totalProvinces: stats.visitedProvinces,
        totalPhotos: stats.photoCount
      },
      groupCities: [],
      sharedPhotos: [],
      recentActivities: localActivities
    };
  },

  loadGroupInfo: function() {
    var self = this;
    this.setData({ loading: true });

    try {
      var localGroup = parseJSON(wx.getStorageSync('myGroup'), null);
      if (localGroup && localGroup.groupInfo) {
        var freshActivities = this.buildLocalActivities();
        if (freshActivities.length > 0) {
          localGroup.recentActivities = freshActivities;
          wx.setStorageSync('myGroup', JSON.stringify(localGroup));
        }
        this.applyGroupData(localGroup);
      }
    } catch (e) {
      console.error('[group] loadGroupInfo local data error:', e);
      this.setData({ loading: false });
    }

    if (!this.canUseGroupCloud()) {
      this.setData({ loading: false });
      return;
    }

    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'getMyGroup' },
      timeout: 15000
    }).then(function(res) {
      var result = res.result || {};
      if (result.success && result.groupInfo) {
        if ((!result.recentActivities || result.recentActivities.length === 0) &&
            localGroup && localGroup.recentActivities && localGroup.recentActivities.length > 0) {
          result.recentActivities = localGroup.recentActivities;
        }
        self.applyGroupData(result);
      } else if (!localGroup) {
        self.setData({ groupInfo: null, loading: false });
      } else {
        self.setData({ loading: false });
      }
    }).catch(function(err) {
      console.error('[group] getMyGroup failed:', err);
      self.setData({ loading: false });
    });
  },

  showCreate: function() {
    this.setData({
      showCreateModal: true,
      newGroupName: '',
      newGroupType: 'friends'
    });
  },

  hideCreateModal: function() {
    this.setData({ showCreateModal: false });
  },

  onGroupNameInput: function(e) {
    this.setData({ newGroupName: e.detail.value || '' });
  },

  selectGroupType: function(e) {
    this.setData({ newGroupType: e.currentTarget.dataset.type });
  },

  createGroup: function() {
    var self = this;
    var name = (this.data.newGroupName || '').trim();
    var type = this.data.newGroupType || 'friends';
    if (!name) {
      wx.showToast({ title: '请输入群组名称', icon: 'none' });
      return;
    }
    if (name.length < 2) {
      wx.showToast({ title: '名称至少2个字', icon: 'none' });
      return;
    }

    var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    var inviteCode = '';
    for (var i = 0; i < 6; i++) inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    var userInfo = this.getSafeUserInfo();
    var stats = this.getUserStats();
    var localData = this.buildLocalGroupData(name, type, inviteCode, true);

    wx.showLoading({ title: '创建中...' });
    wx.setStorageSync('myGroup', JSON.stringify(localData));

    if (!this.canUseGroupCloud()) {
      wx.hideLoading();
      this.applyGroupData(localData);
      this.setData({ showCreateModal: false });
      wx.showToast({ title: '已创建本地小队', icon: 'success' });
      return;
    }

    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'createGroup',
        data: {
          name: name,
          type: type,
          inviteCode: inviteCode,
          userInfo: userInfo,
          cityCount: stats.visitedCount,
          provinceCount: stats.visitedProvinces,
          photoCount: stats.photoCount,
          cityIds: stats.cityIds,
          provinceIds: stats.provinceIds,
          cityProvinceMap: stats.cityProvinceMap,
          cityNames: stats.cityNames
        }
      },
      timeout: 15000
    }).then(function(res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.success) {
        self.applyGroupData(result);
        self.setData({ showCreateModal: false });
        self.syncMyStats();
        self.syncMyPhotosToGroup(result.groupInfo && result.groupInfo.id);
        wx.showToast({ title: '创建成功', icon: 'success' });
      } else {
        self.applyGroupData(localData);
        self.setData({ showCreateModal: false });
        wx.showModal({
          title: '云端同步失败',
          content: (result.message || '群组已保存在本机，但好友可能暂时无法加入。'),
          showCancel: false
        });
      }
    }).catch(function(err) {
      wx.hideLoading();
      console.error('[group] create failed:', err);
      self.applyGroupData(localData);
      self.setData({ showCreateModal: false });
      wx.showModal({
        title: '云端连接超时',
        content: '群组已保存在本机。多人同步需要云函数 group 可用。',
        showCancel: false
      });
    });
  },

  showInvite: function() {
    this.setData({ showInviteModal: true });
  },

  hideInviteModal: function() {
    this.setData({ showInviteModal: false });
  },

  copyInviteCode: function() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: function() {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  showJoin: function() {
    this.setData({ showJoinModal: true, joinCode: '' });
  },

  hideJoinModal: function() {
    this.setData({ showJoinModal: false });
  },

  onJoinCodeInput: function(e) {
    this.setData({ joinCode: String(e.detail.value || '').toUpperCase() });
  },

  joinGroup: function() {
    var self = this;
    var code = (this.data.joinCode || '').trim().toUpperCase();
    if (code.length !== 6) {
      wx.showToast({ title: '请输入6位邀请码', icon: 'none' });
      return;
    }
    if (!this.canUseGroupCloud()) {
      var localData = this.buildLocalGroupData('我的旅行小队', 'friends', code, false);
      this.applyGroupData(localData);
      this.setData({ showJoinModal: false, joinCode: '' });
      wx.showToast({ title: '已本地加入', icon: 'success' });
      return;
    }

    var userInfo = this.getSafeUserInfo();
    var stats = this.getUserStats();
    wx.showLoading({ title: '加入中...' });
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'joinGroup',
        data: {
          inviteCode: code,
          userInfo: userInfo,
          cityCount: stats.visitedCount,
          provinceCount: stats.visitedProvinces,
          photoCount: stats.photoCount,
          cityIds: stats.cityIds,
          provinceIds: stats.provinceIds,
          cityProvinceMap: stats.cityProvinceMap,
          cityNames: stats.cityNames
        }
      },
      timeout: 15000
    }).then(function(res) {
      wx.hideLoading();
      var result = res.result || {};
      if (result.success) {
        self.applyGroupData(result);
        self.setData({ showJoinModal: false, joinCode: '' });
        self.syncMyStats();
        self.syncMyPhotosToGroup(result.groupInfo && result.groupInfo.id);
        wx.showToast({ title: '加入成功', icon: 'success' });
      } else {
        wx.showModal({
          title: '加入失败',
          content: result.message || '邀请码无效或群组不存在',
          showCancel: false
        });
      }
    }).catch(function(err) {
      wx.hideLoading();
      console.error('[group] join failed:', err);
      wx.showModal({
        title: '云端连接失败',
        content: '请确认 group 云函数已上传部署，并检查网络后重试。',
        showCancel: false
      });
    });
  },

  leaveGroup: function() {
    var self = this;
    wx.showModal({
      title: '退出群组',
      content: '退出后将不再同步这个群组的共同足迹，确定退出吗？',
      confirmText: '退出',
      confirmColor: '#D66F58',
      success: function(res) {
        if (!res.confirm) return;
        var localGroup = parseJSON(wx.getStorageSync('myGroup'), null);
        wx.removeStorageSync('myGroup');
        self.setData({
          groupInfo: null,
          isCreator: false,
          isAdmin: false,
          inviteCode: '',
          members: [],
          groupCities: [],
          recentActivities: [],
          sharedPhotos: [],
          stats: {
            totalMembers: 0,
            totalCities: 0,
            totalProvinces: 0,
            totalPhotos: 0
          }
        });

        if (self.canUseGroupCloud() && localGroup && localGroup.groupInfo) {
          wx.cloud.callFunction({
            name: 'group',
            data: { action: 'leaveGroup' },
            timeout: 10000
          }).catch(function() {});
        }
        wx.showToast({ title: '已退出', icon: 'success' });
      }
    });
  },

  syncMyStats: function() {
    var self = this;
    var groupInfo = this.data.groupInfo || (parseJSON(wx.getStorageSync('myGroup'), {}) || {}).groupInfo;
    if (!groupInfo || !groupInfo.id || !this.canUseGroupCloud()) return;
    var stats = this.getUserStats();
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'syncMemberStats',
        data: {
          groupId: groupInfo.id,
          cityCount: stats.visitedCount,
          provinceCount: stats.visitedProvinces,
          photoCount: stats.photoCount,
          cityIds: stats.cityIds,
          provinceIds: stats.provinceIds,
          cityProvinceMap: stats.cityProvinceMap,
          cityNames: stats.cityNames
        }
      },
      timeout: 8000
    }).then(function() {
      self.syncMyPhotosToGroup(groupInfo.id);
    }).catch(function(err) {
      console.warn('[group] syncMyStats failed:', err);
    });
  },

  collectShareablePhotos: function() {
    var photos = [];
    var addList = function(map, type) {
      Object.keys(map || {}).forEach(function(cityId) {
        (map[cityId] || []).forEach(function(item) {
          var fileId = typeof item === 'string' ? item : (item.fileId || item.url || '');
          if (!fileId || fileId.indexOf('wxfile://') === 0 || fileId.indexOf('http://tmp') === 0) return;
          photos.push({
            cityId: cityId,
            provinceId: getProvinceId(cityId),
            cityName: getCityName(cityId),
            fileId: fileId,
            url: fileId,
            type: type
          });
        });
      });
    };
    var cities = citiesData.cities || [];
    var cityNameMap = {};
    var cityProvinceMap = {};
    for (var i = 0; i < cities.length; i++) {
      cityNameMap[cities[i].id] = cities[i].name;
      cityProvinceMap[cities[i].id] = cities[i].provinceId || '';
    }
    function getCityName(cityId) { return cityNameMap[cityId] || cityId; }
    function getProvinceId(cityId) { return cityProvinceMap[cityId] || ''; }
    addList(app.globalData.cityTravelPhotos || {}, 'travel');
    addList(app.globalData.cityPhotos || {}, 'travel');
    addList(app.globalData.cityFoodPhotos || {}, 'food');
    return photos;
  },

  syncMyPhotosToGroup: function(groupId) {
    groupId = groupId || (this.data.groupInfo && this.data.groupInfo.id);
    if (!groupId || !this.canUseGroupCloud()) return;
    var photos = this.collectShareablePhotos();
    var index = 0;
    var self = this;
    function next() {
      if (index >= photos.length) {
        if (app.refreshGroupCache) {
          app.refreshGroupCache(function(updated) {
            if (updated) self.loadGroupInfo();
          });
        }
        return;
      }
      var item = photos[index++];
      wx.cloud.callFunction({
        name: 'group',
        data: {
          action: 'sharePhoto',
          data: {
            groupId: groupId,
            fileId: item.fileId,
            url: item.url,
            cityId: item.cityId,
            cityName: item.cityName,
            provinceId: item.provinceId,
            type: item.type
          }
        },
        timeout: 8000
      }).then(next).catch(next);
    }
    next();
  },

  showPhotoWall: function() {
    this.setData({ showPhotosModal: true, currentPhotoIndex: 0 });
  },

  hidePhotosModal: function() {
    this.setData({ showPhotosModal: false });
  },

  onPhotoChange: function(e) {
    this.setData({ currentPhotoIndex: e.detail.current });
  },

  previewImage: function(e) {
    var url = e.currentTarget.dataset.url;
    var urls = (this.data.sharedPhotos || []).map(function(item) { return item.url; }).filter(Boolean);
    if (!url || urls.length === 0) return;
    wx.previewImage({ current: url, urls: urls });
  }
});
