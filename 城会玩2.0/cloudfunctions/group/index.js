const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 省份ID到名称映射
const PROVINCE_MAP = {
  beijing: '北京市', tianjin: '天津市', hebei: '河北省', shanxi: '山西省',
  neimenggu: '内蒙古自治区', liaoning: '辽宁省', jilin: '吉林省', heilongjiang: '黑龙江省',
  shanghai: '上海市', jiangsu: '江苏省', zhejiang: '浙江省', anhui: '安徽省',
  fujian: '福建省', jiangxi: '江西省', shandong: '山东省', henan: '河南省',
  hubei: '湖北省', hunan: '湖南省', guangdong: '广东省', guangxi: '广西壮族自治区',
  hainan: '海南省', chongqing: '重庆市', sichuan: '四川省', guizhou: '贵州省',
  yunnan: '云南省', xizang: '西藏自治区', shaanxi: '陕西省', gansu: '甘肃省',
  qinghai: '青海省', ningxia: '宁夏回族自治区', xinjiang: '新疆维吾尔自治区',
  taiwan: '台湾省', hongkong: '香港特别行政区', macau: '澳门特别行政区'
};
function provinceName(id) { return PROVINCE_MAP[id] || id || '地区'; }

function now() {
  return new Date().toISOString();
}

function safeUserInfo(userInfo, openid) {
  userInfo = userInfo || {};
  const tail = openid ? String(openid).slice(-4).toUpperCase() : '';
  return {
    nickName: userInfo.nickName || (tail ? `旅行者${tail}` : '微信用户'),
    avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg'
  };
}

function generateCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function displayTime(value) {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  } catch (e) {
    return '';
  }
}

function uniq(list) {
  return Array.from(new Set((list || []).filter(Boolean)));
}

function buildStats(members, groupCities, photos) {
  const provinceIds = uniq((groupCities || []).map(item => item.provinceId));
  return {
    totalMembers: members.length,
    totalCities: groupCities && groupCities.length ? groupCities.length : members.reduce((sum, item) => sum + (item.cityCount || 0), 0),
    totalProvinces: provinceIds.length || members.reduce((sum, item) => sum + (item.provinceCount || 0), 0),
    totalPhotos: photos && photos.length ? photos.length : members.reduce((sum, item) => sum + (item.photoCount || 0), 0)
  };
}

async function getGroupCities(groupId) {
  try {
    const res = await db.collection('group_city_records')
      .where({ groupId, isVisited: true })
      .orderBy('updateTime', 'desc')
      .limit(100)
      .get();

    const map = {};
    for (const item of res.data || []) {
      if (!map[item.cityId]) {
        map[item.cityId] = {
          id: item.cityId,
          cityId: item.cityId,
          cityName: item.cityName || item.cityId || '城市',
          provinceId: item.provinceId || '',
          provinceName: provinceName(item.provinceId),
          memberCount: 0,
          users: [],
          updateTime: item.updateTime || item.createTime || ''
        };
      }
      map[item.cityId].memberCount += 1;
      map[item.cityId].users.push({
        openid: item.openid,
        nickName: item.nickName || '成员',
        avatarUrl: item.avatarUrl || '/images/avatar.jpg'
      });
    }

    return Object.keys(map).map(key => map[key]).sort((a, b) => {
      return (b.updateTime || '').localeCompare(a.updateTime || '');
    });
  } catch (err) {
    console.warn('[group] getGroupCities: collection not ready, returning empty:', err.message);
    return [];
  }
}

async function getSharedPhotos(groupId, limit) {
  try {
    const photosRes = await db.collection('group_photos')
      .where({ groupId })
      .orderBy('createTime', 'desc')
      .limit(limit || 50)
      .get();

    return (photosRes.data || []).map(p => ({
      id: p._id,
      url: p.url || p.fileId,
      fileId: p.fileId || '',
      userId: p.openid,
      userName: p.nickName || '成员',
      userAvatar: p.avatarUrl || '/images/avatar.jpg',
      cityId: p.cityId || '',
      cityName: p.cityName || '',
      type: p.type || 'travel',
      createTime: p.createTime,
      displayTime: displayTime(p.createTime)
    }));
  } catch (err) {
    console.warn('[group] getSharedPhotos: collection not ready, returning empty:', err.message);
    return [];
  }
}

async function getCityFootprint(data, openid) {
  const groupId = data.groupId;
  const cityId = data.cityId;
  if (!groupId || !cityId) return { success: false, error: '缺少群组ID或城市ID' };

  try {
    const memberRes = await db.collection('group_members').where({ openid, groupId }).limit(1).get();
    const member = memberRes.data && memberRes.data[0];
    if (!member) return { success: false, error: '你不是该群组成员' };

    let cityRes = { data: [] };
    try {
      cityRes = await db.collection('group_city_records')
        .where({ groupId, cityId, isVisited: true })
        .orderBy('updateTime', 'desc')
        .limit(50)
        .get();
    } catch (e) {
      console.warn('[group] getCityFootprint: group_city_records query failed:', e.message);
    }

    const visitors = (cityRes.data || []).map(item => ({
      openid: item.openid,
      nickName: item.nickName || '成员',
      avatarUrl: item.avatarUrl || '/images/avatar.jpg',
      updateTime: item.updateTime || item.createTime || '',
      displayTime: displayTime(item.updateTime || item.createTime)
    }));

    let photoRes = { data: [] };
    try {
      photoRes = await db.collection('group_photos')
        .where({ groupId, cityId })
        .orderBy('createTime', 'desc')
        .limit(80)
        .get();
    } catch (e) {
      console.warn('[group] getCityFootprint: group_photos query failed:', e.message);
    }

    const photos = (photoRes.data || []).map(p => ({
      id: p._id,
      url: p.url || p.fileId,
      fileId: p.fileId || '',
      userId: p.openid,
      userName: p.nickName || '成员',
      userAvatar: p.avatarUrl || '/images/avatar.jpg',
      cityId: p.cityId || '',
      cityName: p.cityName || cityId,
      type: p.type || 'travel',
      createTime: p.createTime,
      displayTime: displayTime(p.createTime)
    }));

    const firstCity = cityRes.data && cityRes.data[0];
    return {
      success: true,
      city: firstCity ? {
        cityId,
        cityName: firstCity.cityName || cityId,
        provinceId: firstCity.provinceId || '',
        provinceName: provinceName(firstCity.provinceId),
        memberCount: visitors.length,
        users: visitors,
        updateTime: firstCity.updateTime || firstCity.createTime || ''
      } : null,
      visitors,
      photos,
      photoCount: photos.length
    };
  } catch (err) {
    console.error('[group] getCityFootprint failed:', err);
    return { success: false, error: err.message };
  }
}

async function buildRecentActivities(groupId, groupCities, sharedPhotos) {
  // 按省份去重：同一省份的多个城市只显示一条
  var seenProvinces = {};
  var cityActivities = [];
  for (var idx = 0; idx < (groupCities || []).length; idx++) {
    var item = groupCities[idx];
    var provId = item.provinceId || '';
    if (provId && seenProvinces[provId]) continue;
    seenProvinces[provId] = true;
    var placeName = item.provinceName || provinceName(item.provinceId) || item.cityName || '地区';
    // 如果有 provinceId 但没有 provinceName，用 provinceId 作为显示名（前端会进一步处理）
    cityActivities.push({
      id: 'city_' + (provId || item.cityId || idx),
      type: 'city',
      userName: item.users && item.users[0] ? item.users[0].nickName : '成员',
      cityName: placeName,
      provinceId: provId,
      createTime: item.updateTime || '',
      displayTime: displayTime(item.updateTime)
    });
  }

  const photoActivities = (sharedPhotos || []).slice(0, 8).map(item => ({
    id: `photo_${item.id}`,
    type: 'photo',
    userName: item.userName || '成员',
    cityName: item.cityName || '城市',
    createTime: item.createTime || '',
    displayTime: item.displayTime || displayTime(item.createTime)
  }));

  return cityActivities.concat(photoActivities).sort((a, b) => {
    return String(b.createTime || '').localeCompare(String(a.createTime || ''));
  }).slice(0, 10);
}

async function getMyGroup(openid) {
  try {
    const memberRes = await db.collection('group_members').where({ openid }).limit(1).get();
    const member = memberRes.data && memberRes.data[0];
    if (!member) return { success: true, groupInfo: null };

    const groupRes = await db.collection('groups').doc(member.groupId).get();
    const groupInfo = groupRes.data;
    const membersRes = await db.collection('group_members').where({ groupId: member.groupId }).orderBy('cityCount', 'desc').get();
    const members = (membersRes.data || []).map(m => ({
      openid: m.openid,
      nickName: m.nickName || '成员',
      avatarUrl: m.avatarUrl || '/images/avatar.jpg',
      isCreator: !!m.isCreator,
      role: m.role || '成员',
      cityCount: m.cityCount || 0,
      provinceCount: m.provinceCount || 0,
      photoCount: m.photoCount || 0
    }));

    const groupCities = await getGroupCities(member.groupId);
    const sharedPhotos = await getSharedPhotos(member.groupId, 50);
    const recentActivities = await buildRecentActivities(member.groupId, groupCities, sharedPhotos);

    return {
      success: true,
      groupInfo: {
        id: groupInfo._id,
        name: groupInfo.name,
        type: groupInfo.type,
        inviteCode: groupInfo.inviteCode || '',
        createTime: groupInfo.createTime,
        creatorOpenid: groupInfo.creatorOpenid
      },
      isCreator: groupInfo.creatorOpenid === openid,
      isAdmin: groupInfo.creatorOpenid === openid || member.role === 'admin',
      inviteCode: groupInfo.inviteCode || '',
      members,
      stats: buildStats(members, groupCities, sharedPhotos),
      groupCities,
      sharedPhotos,
      recentActivities
    };
  } catch (err) {
    console.error('[group] getMyGroup failed:', err);
    return { success: true, groupInfo: null, offline: true, error: err.message };
  }
}

async function createGroup(data, openid) {
  try {
    const userInfo = safeUserInfo(data.userInfo, openid);
    const inviteCode = data.inviteCode && data.inviteCode.length === 6 ? data.inviteCode : generateCode();
    const addRes = await db.collection('groups').add({
      data: {
        name: data.name || '我的旅行小队',
        type: data.type || 'friends',
        inviteCode,
        creatorOpenid: openid,
        createTime: now(),
        createdAt: db.serverDate()
      }
    });

    const groupId = addRes._id;
    await db.collection('group_members').add({
      data: {
        openid,
        groupId,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        isCreator: true,
        role: '创建者',
        cityCount: data.cityCount || 0,
        provinceCount: data.provinceCount || 0,
        photoCount: data.photoCount || 0,
        cityIds: data.cityIds || [],
        provinceIds: data.provinceIds || [],
        joinedAt: db.serverDate()
      }
    });

    await syncCityRecords({
      groupId,
      cityIds: data.cityIds || [],
      provinceIds: data.provinceIds || [],
      cityProvinceMap: data.cityProvinceMap || {},
      cityNames: data.cityNames || {},
      userInfo
    }, openid);

    return getMyGroup(openid);
  } catch (err) {
    console.error('[group] createGroup failed:', err);
    return {
      success: false,
      error: 'CREATE_FAILED',
      message: '群组创建失败：' + (err.message || '数据库写入失败')
    };
  }
}

async function joinGroup(data, openid) {
  const inviteCode = String((data && data.inviteCode) || '').trim().toUpperCase();
  if (!inviteCode || inviteCode.length !== 6) {
    return { success: false, error: 'INVALID_CODE', message: '邀请码需要6位字母数字' };
  }

  try {
    const groupRes = await db.collection('groups').where({ inviteCode }).limit(1).get();
    const group = groupRes.data && groupRes.data[0];
    if (!group) return { success: false, error: 'CODE_NOT_FOUND', message: '邀请码不存在，请检查输入是否正确' };

    const memberCheck = await db.collection('group_members').where({ openid, groupId: group._id }).limit(1).get();
    if (memberCheck.data && memberCheck.data.length > 0) {
      return getMyGroup(openid);
    }

    const countRes = await db.collection('group_members').where({ groupId: group._id }).count();
    if (countRes.total >= 20) {
      return { success: false, error: 'GROUP_FULL', message: '群组已满，最多20人' };
    }

    const userInfo = safeUserInfo(data.userInfo, openid);
    await db.collection('group_members').add({
      data: {
        openid,
        groupId: group._id,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        isCreator: false,
        role: '成员',
        cityCount: data.cityCount || 0,
        provinceCount: data.provinceCount || 0,
        photoCount: data.photoCount || 0,
        cityIds: data.cityIds || [],
        provinceIds: data.provinceIds || [],
        joinedAt: db.serverDate()
      }
    });

    await syncCityRecords({
      groupId: group._id,
      cityIds: data.cityIds || [],
      provinceIds: data.provinceIds || [],
      cityProvinceMap: data.cityProvinceMap || {},
      cityNames: data.cityNames || {},
      userInfo
    }, openid);

    return getMyGroup(openid);
  } catch (err) {
    console.error('[group] joinGroup failed:', err);
    return {
      success: false,
      error: 'CLOUD_ERROR',
      message: '加入失败：' + (err.message || '云端连接失败')
    };
  }
}

async function leaveGroup(openid) {
  try {
    await db.collection('group_members').where({ openid }).remove();
    try {
      await db.collection('group_city_records').where({ openid }).remove();
    } catch (e) {
      console.warn('[group] leaveGroup: group_city_records remove skipped:', e.message);
    }
    try {
      await db.collection('group_photos').where({ openid }).remove();
    } catch (e) {
      console.warn('[group] leaveGroup: group_photos remove skipped:', e.message);
    }
    return { success: true };
  } catch (err) {
    return { success: true, offline: true, error: err.message };
  }
}

async function syncCityRecords(data, openid) {
  const groupId = data.groupId;
  if (!groupId) return { success: false, error: '缺少群组ID' };

  try {
    const userInfo = safeUserInfo(data.userInfo, openid);
    const cityIds = uniq(data.cityIds || []);
    const provinceIds = data.provinceIds || [];
    const cityNames = data.cityNames || {};
    const cityProvinceMap = data.cityProvinceMap || {};

    for (let i = 0; i < cityIds.length; i++) {
      const cityId = cityIds[i];
      const provinceId = cityProvinceMap[cityId] || provinceIds[i] || data.provinceId || '';
      let existRes = { data: [] };
      try {
        existRes = await db.collection('group_city_records').where({ groupId, openid, cityId }).limit(1).get();
      } catch (e) {
        console.warn('[group] syncCityRecords: query failed, will try add:', e.message);
      }
      const payload = {
        groupId,
        openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        cityId,
        cityName: cityNames[cityId] || data.cityName || cityId,
        provinceId,
        isVisited: true,
        updateTime: now()
      };
      if (existRes.data && existRes.data.length > 0) {
        await db.collection('group_city_records').doc(existRes.data[0]._id).update({ data: payload });
      } else {
        await db.collection('group_city_records').add({ data: Object.assign(payload, { createTime: now() }) });
      }
    }

    return { success: true, syncedCount: cityIds.length };
  } catch (err) {
    console.warn('[group] syncCityRecords: collection not ready, skipping:', err.message);
    return { success: true, syncedCount: 0, skipped: true };
  }
}

async function syncSingleCity(data, openid) {
  if (!data.groupId || !data.cityId) return { success: false, error: '缺少群组ID或城市ID' };
  try {
    const userInfo = safeUserInfo(data.userInfo, openid);
    let existRes = { data: [] };
    try {
      existRes = await db.collection('group_city_records').where({
        groupId: data.groupId,
        openid,
        cityId: data.cityId
      }).limit(1).get();
    } catch (e) {
      console.warn('[group] syncSingleCity: query failed, will try add:', e.message);
    }

    const payload = {
      groupId: data.groupId,
      openid,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      cityId: data.cityId,
      cityName: data.cityName || data.cityId,
      provinceId: data.provinceId || '',
      isVisited: data.isVisited !== false,
      updateTime: now()
    };

    if (existRes.data && existRes.data.length > 0) {
      await db.collection('group_city_records').doc(existRes.data[0]._id).update({ data: payload });
    } else {
      await db.collection('group_city_records').add({ data: Object.assign(payload, { createTime: now() }) });
    }
    return { success: true };
  } catch (err) {
    console.warn('[group] syncSingleCity: collection not ready, skipping:', err.message);
    return { success: true, skipped: true };
  }
}

async function shareGroupPhoto(data, openid) {
  if (!data.groupId) return { success: false, error: '缺少群组ID' };
  try {
    const memberRes = await db.collection('group_members').where({ openid, groupId: data.groupId }).limit(1).get();
    const member = memberRes.data && memberRes.data[0];
    if (!member) return { success: false, error: '你不是该群组成员' };

    const fileId = data.fileId || data.url || '';
    const existRes = await db.collection('group_photos').where({
      groupId: data.groupId,
      openid,
      fileId
    }).limit(1).get();

    const payload = {
      groupId: data.groupId,
      openid,
      nickName: member.nickName || '成员',
      avatarUrl: member.avatarUrl || '/images/avatar.jpg',
      fileId,
      url: data.url || fileId,
      cityId: data.cityId || '',
      cityName: data.cityName || '',
      provinceId: data.provinceId || '',
      type: data.type || 'travel',
      createTime: db.serverDate()
    };

    if (existRes.data && existRes.data.length > 0) {
      await db.collection('group_photos').doc(existRes.data[0]._id).update({ data: payload });
      await refreshMemberPhotoCount(data.groupId, openid);
      return { success: true, photoId: existRes.data[0]._id, fileId, url: payload.url };
    }

    const res = await db.collection('group_photos').add({ data: payload });
    await refreshMemberPhotoCount(data.groupId, openid);
    return { success: true, photoId: res._id, fileId, url: payload.url };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function refreshMemberPhotoCount(groupId, openid) {
  try {
    const countRes = await db.collection('group_photos').where({ groupId, openid }).count();
    await db.collection('group_members').where({ groupId, openid }).update({
      data: {
        photoCount: countRes.total || 0,
        syncTime: db.serverDate()
      }
    });
  } catch (err) {
    console.error('[group] refreshMemberPhotoCount failed:', err);
  }
}

async function syncMemberStats(data, openid) {
  if (!data.groupId) return { success: false, error: '缺少群组ID' };
  try {
    await db.collection('group_members').where({ openid, groupId: data.groupId }).update({
      data: {
        cityCount: data.cityCount || 0,
        provinceCount: data.provinceCount || 0,
        photoCount: data.photoCount || 0,
        cityIds: data.cityIds || [],
        provinceIds: data.provinceIds || [],
        syncTime: db.serverDate()
      }
    });
    await syncCityRecords(data, openid);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = (event && event.openid) || wxContext.OPENID || 'mock_openid';
  const action = event && event.action;
  const data = (event && event.data) || {};

  if (action === 'getMyGroup') return getMyGroup(openid);
  if (action === 'createGroup') return createGroup(data, openid);
  if (action === 'joinGroup') return joinGroup(data, openid);
  if (action === 'leaveGroup') return leaveGroup(openid);
  if (action === 'syncMemberStats') return syncMemberStats(data, openid);
  if (action === 'syncCityRecord') return syncSingleCity(data, openid);
  if (action === 'sharePhoto') return shareGroupPhoto(data, openid);
  if (action === 'getCityFootprint') return getCityFootprint(data, openid);
  if (action === 'getSharedPhotos') {
    const photos = await getSharedPhotos(data.groupId, 50);
    return { success: true, photos };
  }

  return { success: false, error: 'UNKNOWN_ACTION' };
};
