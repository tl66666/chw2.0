function parseGroup() {
  var raw = '';
  try { raw = wx.getStorageSync('myGroup'); } catch (e) {}
  if (!raw) return null;
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch (e2) { return null; }
}

function uniq(list) {
  var result = [];
  (list || []).forEach(function(item) {
    if (item && result.indexOf(item) === -1) result.push(item);
  });
  return result;
}

function getGroupData() {
  var group = parseGroup();
  if (!group || !group.groupInfo) {
    return {
      hasGroup: false,
      groupInfo: null,
      cityIds: [],
      photos: [],
      activities: [],
      members: []
    };
  }

  var cityIds = [];
  (group.groupCities || []).forEach(function(item) {
    var cityId = item.cityId || item.id;
    if (cityId) cityIds.push(cityId);
  });
  (group.sharedPhotos || []).forEach(function(item) {
    if (item && item.cityId) cityIds.push(item.cityId);
  });

  return {
    hasGroup: true,
    groupInfo: group.groupInfo,
    cityIds: uniq(cityIds),
    photos: group.sharedPhotos || [],
    activities: group.recentActivities || [],
    members: group.members || [],
    stats: group.stats || {}
  };
}

function mergeCityIds(localIds) {
  var group = getGroupData();
  return uniq((localIds || []).concat(group.cityIds || []));
}

function getPhotosByCity(cityId, type) {
  var group = getGroupData();
  return (group.photos || []).filter(function(item) {
    if (!item || item.cityId !== cityId) return false;
    return !type || item.type === type;
  }).map(function(item) {
    return {
      url: item.url || item.fileId || '',
      fileId: item.fileId || item.url || '',
      displayUrl: item.displayUrl || '',
      localPath: '',
      status: 'group',
      message: '来自群组共享',
      type: item.type || 'travel',
      userName: item.userName || item.nickName || '群友',
      userAvatar: item.userAvatar || item.avatarUrl || '/images/avatar.jpg',
      createTime: item.createTime || Date.now()
    };
  });
}

function getAllPhotos() {
  var group = getGroupData();
  return (group.photos || []).map(function(item) {
    return {
      url: item.url || item.fileId || '',
      fileId: item.fileId || item.url || '',
      displayUrl: item.displayUrl || '',
      cityId: item.cityId || '',
      cityName: item.cityName || '',
      type: item.type || 'travel',
      typeText: item.type === 'food' ? '队友美食' : '队友旅行',
      status: 'group',
      userName: item.userName || item.nickName || '群友',
      date: item.displayTime || ''
    };
  });
}

function countPhotosForCities(cityIds) {
  var group = getGroupData();
  var map = {};
  (cityIds || []).forEach(function(id) { map[id] = true; });
  var count = 0;
  (group.photos || []).forEach(function(item) {
    if (item && map[item.cityId]) count++;
  });
  return count;
}

module.exports = {
  getGroupData: getGroupData,
  mergeCityIds: mergeCityIds,
  getPhotosByCity: getPhotosByCity,
  getAllPhotos: getAllPhotos,
  countPhotosForCities: countPhotosForCities
};
