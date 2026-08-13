var app = getApp();
var groupView = require('../../utils/group-view.js');
var groupHistory = require('../../utils/group-history.js');

function parseJSON(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

function getArchiveDateKey(value) {
  var raw = String(value || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  var date = new Date(value);
  if (isNaN(date.getTime())) return '未标记日期';
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

function getArchiveDateLabel(key) {
  if (key === '未标记日期') return key;
  var today = getArchiveDateKey(new Date());
  if (key === today) return '今天';
  var date = new Date(key + 'T00:00:00');
  return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
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
    visibleSharedPhotos: [],
    photoArchives: [],
    featuredPhotos: [],
    photoCityFilters: [],
    photoCityFilter: 'all',
    travelPlans: [],
    recentActivities: [],
    loading: true,
    showCreateModal: false,
    showInviteModal: false,
    showJoinModal: false,
    showPlanModal: false,
    showPhotosModal: false,
    showPhotoDiscussion: false,
    currentPhotoIndex: 0,
    activePhoto: null,
    activePhotoComments: [],
    newPhotoComment: '',
    newGroupName: '',
    newGroupType: 'friends',
    newPlanTitle: '',
    newPlanCity: '',
    newPlanStartDate: '',
    newPlanEndDate: '',
    newPlanNote: '',
    joinCode: '',
    groupTypeText: '',
    isCloudBacked: false,
    copiedInviteCode: false,
    photoSyncError: '',
    groupLoadError: ''
  },

  preventClose: function() {},

  onLoad: function(options) {
    if (options && options.inviteCode) {
      this.setData({
        showJoinModal: true,
        joinCode: String(options.inviteCode || '').toUpperCase()
      });
    }
  },

  onShow: function() {
    this.ensureLoginAndLoad();
  },

  ensureLoginAndLoad: function() {
    var self = this;
    if (app.globalData.isLogin && (app.globalData.openid || wx.getStorageSync('openid'))) {
      this.loadGroupInfo();
      return;
    }

    if (typeof app.login === 'function') {
      app.login(function(ok) {
        if (ok) {
          self.loadGroupInfo();
        } else {
          self.setData({ loading: false });
        }
      });
    } else {
      this.setData({ loading: false });
    }
  },

  canUseGroupCloud: function() {
    // 群组功能保留云连接尝试，连不上时自动降级到本地模式
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
      photoSyncError: payload.photoSyncError || '',
      groupLoadError: payload.groupLoadError || '',
      travelPlans: payload.travelPlans || [],
      recentActivities: payload.recentActivities || []
    };
  },

  buildPhotoViews: function(photos, selectedCity) {
    var allPhotos = photos || [];
    var filters = [{ id: 'all', name: '全部' }];
    var seen = {};
    allPhotos.forEach(function(photo) {
      var id = photo.cityId || photo.cityName || '';
      if (id && !seen[id]) {
        seen[id] = true;
        filters.push({ id: id, name: photo.cityName || '城市' });
      }
    });
    var active = selectedCity || 'all';
    if (active !== 'all' && !seen[active]) active = 'all';
    var visiblePhotos = allPhotos.filter(function(photo) {
      return active === 'all' || (photo.cityId || photo.cityName) === active;
    });
    var archivesByDate = {};
    visiblePhotos.forEach(function(photo) {
      var dateKey = getArchiveDateKey(photo.travelDate || photo.createTime);
      if (!archivesByDate[dateKey]) {
        archivesByDate[dateKey] = { key: dateKey, label: getArchiveDateLabel(dateKey), photos: [] };
      }
      archivesByDate[dateKey].photos.push(photo);
    });
    var photoArchives = Object.keys(archivesByDate).sort(function(a, b) {
      return b.localeCompare(a);
    }).map(function(key) {
      var archive = archivesByDate[key];
      archive.count = archive.photos.length;
      return archive;
    });
    return {
      photoCityFilter: active,
      photoCityFilters: filters,
      visibleSharedPhotos: visiblePhotos,
      photoArchives: photoArchives,
      featuredPhotos: allPhotos.filter(function(photo) { return photo.isFeatured; })
    };
  },

  applyGroupData: function(payload, isCloudBacked) {
    var data = this.normalizeGroupPayload(payload);
    var photoViews = this.buildPhotoViews(data.sharedPhotos, this.data.photoCityFilter);
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
      photoSyncError: data.photoSyncError,
      groupLoadError: data.groupLoadError,
      visibleSharedPhotos: photoViews.visibleSharedPhotos,
      photoArchives: photoViews.photoArchives,
      featuredPhotos: photoViews.featuredPhotos,
      photoCityFilters: photoViews.photoCityFilters,
      photoCityFilter: photoViews.photoCityFilter,
      travelPlans: data.travelPlans,
      recentActivities: data.recentActivities,
      isCloudBacked: !!isCloudBacked,
      loading: false
    });
    wx.setStorageSync('myGroup', JSON.stringify(data));
  },

  getSharedPhotoFeedError: function(result) {
    var code = String((result && result.error) || '');
    if (code === 'UNKNOWN_ACTION') return '群相册暂时不可用，请稍后再试。';
    if (code === 'NOT_A_MEMBER') return '当前账号不是这个群的成员，请重新进入或加入群组。';
    return '群相册暂时不可用，请稍后再试。';
  },

  verifySharedPhotoFeed: function(payload) {
    var self = this;
    var groupInfo = payload && payload.groupInfo;
    if (!groupInfo || !groupInfo.id || !wx.cloud) return;

    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'getSharedPhotos', data: { groupId: groupInfo.id } },
      timeout: 15000
    }).then(function(response) {
      var result = response.result || {};
      var nextPayload = Object.assign({}, payload);
      if (result.success) {
        nextPayload.sharedPhotos = result.photos || [];
        nextPayload.photoSyncError = '';
      } else {
        console.warn('[group-photo] getSharedPhotos rejected:', result.error || result.message || 'UNKNOWN');
        nextPayload.sharedPhotos = [];
        nextPayload.photoSyncError = self.getSharedPhotoFeedError(result);
      }
      self.applyGroupData(nextPayload, true);
    }).catch(function(err) {
      console.error('[group-photo] getSharedPhotos request failed:', err);
      var nextPayload = Object.assign({}, payload, {
        sharedPhotos: [],
        photoSyncError: '群相册暂时不可用，请稍后再试。'
      });
      self.applyGroupData(nextPayload, true);
    });
  },

  buildLocalGroupData: function(name, type, inviteCode, isCreator) {
    var userInfo = this.getSafeUserInfo();
    var openid = app.globalData.openid || wx.getStorageSync('openid') || 'local_user';
    var stats = groupHistory.createFreshGroupStats();
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
        cityCount: stats.cityCount,
        provinceCount: stats.provinceCount,
        photoCount: stats.photoCount
      }],
      stats: {
        totalMembers: 1,
        totalCities: stats.cityCount,
        totalProvinces: stats.provinceCount,
        totalPhotos: stats.photoCount
      },
      groupCities: [],
      sharedPhotos: [],
      travelPlans: [],
      recentActivities: []
    };
  },

  loadGroupInfo: function() {
    var self = this;
    this.setData({ loading: true, groupLoadError: '' });

    try {
      var localGroup = parseJSON(wx.getStorageSync('myGroup'), null);
      if (localGroup && localGroup.groupInfo) {
        this.applyGroupData(localGroup, false);
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
        self.applyGroupData(result, true);
        if (result.photoSyncError) self.verifySharedPhotoFeed(result);
        self.retryQueuedGroupPhotos(result.groupInfo);
      } else if (result.success && !result.groupInfo && result.offline) {
        if (localGroup && localGroup.groupInfo) {
          self.applyGroupData(localGroup, false);
        }
        self.setData({
          loading: false,
          groupLoadError: '群组暂时无法连接，已保留本机内容，请稍后再试。'
        });
      } else if (result.success && !result.groupInfo && !result.offline) {
        self.clearLocalGroup();
      } else if (!localGroup) {
        self.setData({ groupInfo: null, loading: false });
      } else {
        self.setData({ loading: false });
      }
    }).catch(function(err) {
      console.error('[group] getMyGroup failed:', err);
      if (localGroup && localGroup.groupInfo) {
        self.applyGroupData(localGroup, false);
      }
      self.setData({
        loading: false,
        groupLoadError: '云服务未连接，已切换到本地模式。可创建群组查看自己的打卡数据，邀请好友加入和照片共享功能需要云服务支持。'
      });
    });
  },

  retryQueuedGroupPhotos: function(groupInfo) {
    if (this._retryingQueuedGroupPhotos || !groupInfo || !groupInfo.id || !wx.cloud ||
        !app.getPendingGroupPhotoReviews || !app.removePendingGroupPhotoReview) return;

    var pending = app.getPendingGroupPhotoReviews(groupInfo.id);
    if (!pending || pending.length === 0) return;

    var self = this;
    var index = 0;
    var synced = 0;
    this._retryingQueuedGroupPhotos = true;

    function finish() {
      self._retryingQueuedGroupPhotos = false;
      if (synced > 0 && app.refreshGroupCache) {
        app.refreshGroupCache(function(updated, payload) {
          if (updated && payload) self.applyGroupData(payload, true);
        });
      }
    }

    function next() {
      if (index >= pending.length) {
        finish();
        return;
      }

      var item = pending[index++];
      var fileId = item && item.fileId;
      if (!fileId || fileId.indexOf('cloud://') !== 0) {
        app.removePendingGroupPhotoReview(groupInfo.id, fileId);
        next();
        return;
      }

      self.shareQueuedGroupPhoto(groupInfo, item, function(didShare) {
        if (didShare) synced += 1;
        next();
      });
      return;

      wx.cloud.callFunction({
        name: 'contentSecurity',
        data: { action: 'checkImage', fileID: fileId },
        timeout: 20000
      }).then(function(checkResponse) {
        var check = checkResponse.result || {};
        if (!check.pass) {
          if (check.blocked) app.removePendingGroupPhotoReview(groupInfo.id, fileId);
          else console.warn('[group-photo] automatic review deferred:', check.error || check.message || 'CHECK_PENDING');
          next();
          return;
        }

        return wx.cloud.callFunction({
          name: 'group',
          data: {
            action: 'sharePhoto',
            data: {
              groupId: groupInfo.id,
              fileId: fileId,
              url: fileId,
              cityId: item.cityId || '',
              cityName: item.cityName || '',
              provinceId: item.provinceId || '',
              type: item.type || 'travel',
              travelDate: item.travelDate || ''
            }
          },
          timeout: 10000
        }).then(function(shareResponse) {
          var shared = shareResponse.result || {};
          if (shared.success) {
            synced += 1;
            app.removePendingGroupPhotoReview(groupInfo.id, fileId);
          } else if (shared.error === 'INVALID_FILE_ID') {
            app.removePendingGroupPhotoReview(groupInfo.id, fileId);
          } else {
            console.warn('[group-photo] automatic share deferred:', shared.error || shared.message || 'SHARE_PENDING');
          }
          next();
        });
      }).catch(function(err) {
        console.warn('[group-photo] automatic review request deferred:', err);
        next();
      });
    }

    next();
  },

  shareQueuedGroupPhoto: function(groupInfo, item, done) {
    var fileId = item && item.fileId;
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'sharePhoto',
        data: {
          groupId: groupInfo.id,
          fileId: fileId,
          url: fileId,
          cityId: item.cityId || '',
          cityName: item.cityName || '',
          provinceId: item.provinceId || '',
          type: item.type || 'travel',
          travelDate: item.travelDate || ''
        }
      },
      timeout: 10000
    }).then(function(response) {
      var shared = response.result || {};
      if (shared.success || shared.error === 'INVALID_FILE_ID') {
        app.removePendingGroupPhotoReview(groupInfo.id, fileId);
        done(!!shared.success);
        return;
      }
      console.warn('[group-photo] queued share deferred:', shared.error || shared.message || 'SHARE_PENDING');
      done(false);
    }).catch(function(err) {
      console.warn('[group-photo] queued share request deferred:', err);
      done(false);
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
    var stats = groupHistory.createFreshGroupStats();
    var localData = this.buildLocalGroupData(name, type, inviteCode, true);

    wx.showLoading({ title: '创建中...' });
    wx.setStorageSync('myGroup', JSON.stringify(localData));

    if (!this.canUseGroupCloud()) {
      wx.hideLoading();
      this.applyGroupData(localData, false);
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
          cityCount: stats.cityCount,
          provinceCount: stats.provinceCount,
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
        self.applyGroupData(result, true);
        self.setData({ showCreateModal: false });
        wx.showToast({ title: '创建成功', icon: 'success' });
      } else {
        self.applyGroupData(localData, false);
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
      self.applyGroupData(localData, false);
      self.setData({ showCreateModal: false });
      wx.showModal({
        title: '云端连接超时',
        content: '群组已保存在本机；网络恢复后可继续与同行同步。',
        showCancel: false
      });
    });
  },

  showInvite: function() {
    this.setData({ showInviteModal: true, copiedInviteCode: false });
  },

  hideInviteModal: function() {
    this.setData({ showInviteModal: false });
  },

  copyInviteCode: function() {
    var self = this;
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: function() {
        self.setData({ copiedInviteCode: true });
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
      wx.showModal({
        title: '暂时无法加入群组',
        content: '邀请码暂时无法验证，请检查网络后再试。',
        showCancel: false
      });
      return;
    }

    var userInfo = this.getSafeUserInfo();
    var stats = groupHistory.createFreshGroupStats();
    wx.showLoading({ title: '加入中...' });
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'joinGroup',
        data: {
          inviteCode: code,
          userInfo: userInfo,
          cityCount: stats.cityCount,
          provinceCount: stats.provinceCount,
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
        self.applyGroupData(result, true);
        self.setData({ showJoinModal: false, joinCode: '' });
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
        title: '云服务未连接',
        content: '加入群组需要云服务支持，当前云服务未连接。可创建本地群组查看自己的数据。',
        showCancel: false
      });
    });
  },

  showPlanModal: function() {
    if (!this.data.isCloudBacked) {
      wx.showToast({ title: '旅行计划需要云端群组', icon: 'none' });
      return;
    }
    this.setData({
      showPlanModal: true,
      newPlanTitle: '',
      newPlanCity: '',
      newPlanStartDate: '',
      newPlanEndDate: '',
      newPlanNote: ''
    });
  },

  hidePlanModal: function() {
    this.setData({ showPlanModal: false });
  },

  onPlanTitleInput: function(e) {
    this.setData({ newPlanTitle: e.detail.value || '' });
  },

  onPlanCityInput: function(e) {
    this.setData({ newPlanCity: e.detail.value || '' });
  },

  onPlanNoteInput: function(e) {
    this.setData({ newPlanNote: e.detail.value || '' });
  },

  onPlanStartDateChange: function(e) {
    this.setData({ newPlanStartDate: e.detail.value || '' });
  },

  onPlanEndDateChange: function(e) {
    this.setData({ newPlanEndDate: e.detail.value || '' });
  },

  updateTravelPlans: function(result) {
    if (result && result.success && result.plans) {
      this.setData({ travelPlans: result.plans });
      return true;
    }
    wx.showToast({ title: (result && result.message) || '操作失败，请稍后重试', icon: 'none' });
    return false;
  },

  createTravelPlan: function() {
    var self = this;
    var title = (this.data.newPlanTitle || '').trim();
    if (title.length < 2) {
      wx.showToast({ title: '计划名称至少 2 个字', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '创建计划中' });
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'createTravelPlan',
        data: {
          groupId: this.data.groupInfo.id,
          title: title,
          cityName: this.data.newPlanCity,
          startDate: this.data.newPlanStartDate,
          endDate: this.data.newPlanEndDate,
          note: this.data.newPlanNote
        }
      },
      timeout: 10000
    }).then(function(res) {
      wx.hideLoading();
      if (self.updateTravelPlans(res.result || {})) {
        self.setData({ showPlanModal: false });
        wx.showToast({ title: '旅行计划已创建', icon: 'success' });
      }
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '云端连接失败', icon: 'none' });
    });
  },

  togglePlanVote: function(e) {
    var self = this;
    var planId = e.currentTarget.dataset.id;
    if (!planId || !this.data.isCloudBacked) return;
    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'toggleTravelPlanVote', data: { groupId: this.data.groupInfo.id, planId: planId } },
      timeout: 10000
    }).then(function(res) {
      self.updateTravelPlans(res.result || {});
    }).catch(function() {
      wx.showToast({ title: '投票失败，请重试', icon: 'none' });
    });
  },

  deleteTravelPlan: function(e) {
    var self = this;
    var planId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除旅行计划',
      content: '删除后投票也会一并移除，确定继续吗？',
      confirmText: '删除',
      confirmColor: '#D66F58',
      success: function(res) {
        if (!res.confirm) return;
        wx.cloud.callFunction({
          name: 'group',
          data: { action: 'deleteTravelPlan', data: { groupId: self.data.groupInfo.id, planId: planId } },
          timeout: 10000
        }).then(function(result) {
          self.updateTravelPlans(result.result || {});
        }).catch(function() {
          wx.showToast({ title: '删除失败，请重试', icon: 'none' });
        });
      }
    });
  },

  selectPhotoCity: function(e) {
    var views = this.buildPhotoViews(this.data.sharedPhotos, e.currentTarget.dataset.city);
    this.setData(views);
  },

  toggleFeaturedPhoto: function(e) {
    var self = this;
    var photoId = e.currentTarget.dataset.id;
    var featured = e.currentTarget.dataset.featured !== true && e.currentTarget.dataset.featured !== 'true';
    if (!this.data.isCreator || !photoId) return;
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'setFeaturedPhoto',
        data: { groupId: this.data.groupInfo.id, photoId: photoId, featured: featured }
      },
      timeout: 10000
    }).then(function(res) {
      var result = res.result || {};
      if (!result.success) {
        wx.showToast({ title: result.message || '设置精选失败', icon: 'none' });
        return;
      }
      var views = self.buildPhotoViews(result.photos || [], self.data.photoCityFilter);
      self.setData({
        sharedPhotos: result.photos || [],
        visibleSharedPhotos: views.visibleSharedPhotos,
        photoArchives: views.photoArchives,
        featuredPhotos: views.featuredPhotos,
        photoCityFilters: views.photoCityFilters,
        photoCityFilter: views.photoCityFilter
      });
    }).catch(function() {
      wx.showToast({ title: '云端连接失败', icon: 'none' });
    });
  },

  openPhotoDiscussion: function(e) {
    var photoId = e.currentTarget.dataset.id;
    var photos = this.data.sharedPhotos || [];
    var photo = null;
    for (var i = 0; i < photos.length; i++) {
      if (photos[i].id === photoId) {
        photo = photos[i];
        break;
      }
    }
    if (!photo || !this.data.isCloudBacked) return;
    this.setData({
      showPhotoDiscussion: true,
      activePhoto: photo,
      activePhotoComments: [],
      newPhotoComment: ''
    });
    this.loadPhotoComments(photoId);
  },

  closePhotoDiscussion: function() {
    this.setData({ showPhotoDiscussion: false, activePhoto: null, activePhotoComments: [], newPhotoComment: '' });
  },

  loadPhotoComments: function(photoId) {
    var self = this;
    var activePhoto = this.data.activePhoto;
    if (!photoId || !activePhoto || !this.data.groupInfo) return;
    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'getPhotoComments', data: { groupId: this.data.groupInfo.id, photoId: photoId } },
      timeout: 10000
    }).then(function(res) {
      self.applyPhotoCommentResult(res.result || {}, photoId);
    }).catch(function() {
      wx.showToast({ title: '评论加载失败，请重试', icon: 'none' });
    });
  },

  applyPhotoCommentResult: function(result, photoId) {
    if (!result || !result.success) {
      wx.showToast({ title: (result && result.message) || '评论操作失败，请重试', icon: 'none' });
      return false;
    }
    var nextPhotos = (this.data.sharedPhotos || []).map(function(photo) {
      if (photo.id !== photoId) return photo;
      var next = Object.assign({}, photo);
      next.commentCount = result.commentCount || 0;
      return next;
    });
    var views = this.buildPhotoViews(nextPhotos, this.data.photoCityFilter);
    var active = this.data.activePhoto && this.data.activePhoto.id === photoId
      ? Object.assign({}, this.data.activePhoto, { commentCount: result.commentCount || 0 })
      : this.data.activePhoto;
    this.setData({
      sharedPhotos: nextPhotos,
      visibleSharedPhotos: views.visibleSharedPhotos,
      photoArchives: views.photoArchives,
      featuredPhotos: views.featuredPhotos,
      activePhoto: active,
      activePhotoComments: result.comments || []
    });
    return true;
  },

  onPhotoCommentInput: function(e) {
    this.setData({ newPhotoComment: e.detail.value || '' });
  },

  submitPhotoComment: function() {
    var self = this;
    var content = (this.data.newPhotoComment || '').trim();
    var photo = this.data.activePhoto;
    if (!photo || !content) {
      wx.showToast({ title: '先写下一句留言', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '发布中' });
    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'addPhotoComment', data: { groupId: this.data.groupInfo.id, photoId: photo.id, content: content } },
      timeout: 10000
    }).then(function(res) {
      wx.hideLoading();
      if (self.applyPhotoCommentResult(res.result || {}, photo.id)) {
        self.setData({ newPhotoComment: '' });
      }
    }).catch(function() {
      wx.hideLoading();
      wx.showToast({ title: '云端连接失败', icon: 'none' });
    });
  },

  deletePhotoComment: function(e) {
    var self = this;
    var commentId = e.currentTarget.dataset.id;
    var photo = this.data.activePhoto;
    if (!photo || !commentId) return;
    wx.showModal({
      title: '删除留言',
      content: '删除后无法恢复，确定继续吗？',
      confirmText: '删除',
      confirmColor: '#D66F58',
      success: function(res) {
        if (!res.confirm) return;
        wx.cloud.callFunction({
          name: 'group',
          data: { action: 'removePhotoComment', data: { groupId: self.data.groupInfo.id, photoId: photo.id, commentId: commentId } },
          timeout: 10000
        }).then(function(result) {
          self.applyPhotoCommentResult(result.result || {}, photo.id);
        }).catch(function() {
          wx.showToast({ title: '删除失败，请重试', icon: 'none' });
        });
      }
    });
  },

  previewActivePhoto: function() {
    var photo = this.data.activePhoto;
    if (!photo || !photo.url) return;
    wx.previewImage({ current: photo.url, urls: [photo.url] });
  },

  clearLocalGroup: function(groupLoadError) {
    wx.removeStorageSync('myGroup');
    this.setData({
      groupInfo: null,
      isCreator: false,
      isAdmin: false,
      inviteCode: '',
      members: [],
      groupCities: [],
      recentActivities: [],
      sharedPhotos: [],
      visibleSharedPhotos: [],
      photoArchives: [],
      featuredPhotos: [],
      photoCityFilters: [],
      photoCityFilter: 'all',
      travelPlans: [],
      isCloudBacked: false,
      loading: false,
      groupLoadError: groupLoadError || '',
      photoSyncError: '',
      stats: { totalMembers: 0, totalCities: 0, totalProvinces: 0, totalPhotos: 0 }
    });
  },

  confirmLeaveGroup: function() {
    var self = this;
    wx.showModal({
      title: '退出群组',
      content: '退出后将不再同步这个群组的共同足迹，确定退出吗？',
      confirmText: '退出',
      confirmColor: '#D66F58',
      success: function(res) {
        if (!res.confirm) return;
        if (!self.data.isCloudBacked) {
          self.clearLocalGroup();
          wx.showToast({ title: '已删除本机草稿', icon: 'success' });
          return;
        }
        wx.showLoading({ title: '正在退出' });
        wx.cloud.callFunction({ name: 'group', data: { action: 'leaveGroup' }, timeout: 10000 })
          .then(function(result) {
            wx.hideLoading();
            var payload = result.result || {};
            if (!payload.success) {
              wx.showModal({ title: '退出失败', content: payload.message || '群组数据未发生变化，请稍后重试。', showCancel: false });
              return;
            }
            self.clearLocalGroup();
            wx.showToast({ title: '已退出群组', icon: 'success' });
          })
          .catch(function() {
            wx.hideLoading();
            wx.showModal({ title: '网络连接失败', content: '未退出群组，请检查网络后重试。', showCancel: false });
          });
      }
    });
  },

  transferOwnershipAndLeave: function(target) {
    var self = this;
    wx.showLoading({ title: '正在转让群主' });
    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'transferOwnership', data: { targetOpenid: target.openid } },
      timeout: 10000
    }).then(function(result) {
      wx.hideLoading();
      var payload = result.result || {};
      if (!payload.success) {
        wx.showModal({ title: '转让失败', content: payload.message || '群主没有变化，请稍后重试。', showCancel: false });
        return;
      }
      self.applyGroupData(payload, true);
      self.confirmLeaveGroup();
    }).catch(function() {
      wx.hideLoading();
      wx.showModal({ title: '网络连接失败', content: '未转让群主，请检查网络后重试。', showCancel: false });
    });
  },

  leaveGroup: function() {
    var self = this;
    var targets = (this.data.members || []).filter(function(member) {
      return member.openid && member.openid !== (app.globalData.openid || wx.getStorageSync('openid'));
    });
    if (this.data.isCreator && this.data.isCloudBacked && targets.length > 0) {
      wx.showActionSheet({
        itemList: targets.map(function(member) { return '转让给 ' + (member.nickName || '成员'); }),
        success: function(res) { self.transferOwnershipAndLeave(targets[res.tapIndex]); }
      });
      return;
    }
    this.confirmLeaveGroup();
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
