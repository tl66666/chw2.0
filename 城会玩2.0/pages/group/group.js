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
    currentPhotoIndex: 0,
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
    copiedInviteCode: false
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
    return {
      photoCityFilter: active,
      photoCityFilters: filters,
      visibleSharedPhotos: allPhotos.filter(function(photo) {
        return active === 'all' || (photo.cityId || photo.cityName) === active;
      }),
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
      visibleSharedPhotos: photoViews.visibleSharedPhotos,
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
    this.setData({ loading: true });

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
        content: '群组已保存在本机。多人同步需要云函数 group 可用。',
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
        content: '邀请码需要云端连接才能加入。请检查网络并确认 group 云函数已部署后重试。',
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
        title: '云端连接失败',
        content: '请确认 group 云函数已上传部署，并检查网络后重试。',
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
        featuredPhotos: views.featuredPhotos,
        photoCityFilters: views.photoCityFilters,
        photoCityFilter: views.photoCityFilter
      });
    }).catch(function() {
      wx.showToast({ title: '云端连接失败', icon: 'none' });
    });
  },

  clearLocalGroup: function() {
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
      featuredPhotos: [],
      photoCityFilters: [],
      photoCityFilter: 'all',
      travelPlans: [],
      isCloudBacked: false,
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
