const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function now() {
  return new Date().toISOString();
}

function makeGroupPayload(data, openid) {
  const userInfo = data.userInfo || {};
  const inviteCode = data.inviteCode || Math.random().toString(36).slice(2, 8).toUpperCase();
  const groupInfo = {
    id: data.id || `group_${Date.now()}`,
    name: data.name || '我的旅行小队',
    type: data.type || 'friends',
    inviteCode,
    createTime: now(),
    creatorOpenid: openid
  };

  return {
    success: true,
    groupInfo,
    isCreator: true,
    isAdmin: true,
    inviteCode,
    members: [{
      openid,
      nickName: userInfo.nickName || '城会玩旅人',
      avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg',
      isCreator: true,
      role: '创建者',
      cityCount: data.cityCount || 0,
      photoCount: data.photoCount || 0
    }],
    stats: {
      totalMembers: 1,
      totalCities: data.cityCount || 0,
      totalProvinces: data.provinceCount || 0,
      totalPhotos: data.photoCount || 0
    },
    sharedPhotos: []
  };
}

async function getMyGroup(openid) {
  try {
    const memberRes = await db.collection('group_members').where({ openid }).limit(1).get();
    const member = memberRes.data && memberRes.data[0];
    if (!member) {
      return { success: true, groupInfo: null };
    }

    const groupRes = await db.collection('groups').doc(member.groupId).get();
    const groupInfo = groupRes.data;
    const membersRes = await db.collection('group_members').where({ groupId: member.groupId }).get();
    const members = membersRes.data || [];

    return {
      success: true,
      groupInfo,
      isCreator: groupInfo.creatorOpenid === openid,
      isAdmin: groupInfo.creatorOpenid === openid || member.role === 'admin',
      inviteCode: groupInfo.inviteCode || '',
      members,
      stats: {
        totalMembers: members.length,
        totalCities: members.reduce((sum, item) => sum + (item.cityCount || 0), 0),
        totalProvinces: groupInfo.totalProvinces || 0,
        totalPhotos: members.reduce((sum, item) => sum + (item.photoCount || 0), 0)
      },
      sharedPhotos: groupInfo.sharedPhotos || []
    };
  } catch (err) {
    return { success: true, groupInfo: null, offline: true, error: err.message };
  }
}

async function createGroup(data, openid) {
  const payload = makeGroupPayload(data, openid);
  try {
    const addRes = await db.collection('groups').add({
      data: Object.assign({}, payload.groupInfo, {
        createdAt: db.serverDate(),
        sharedPhotos: []
      })
    });
    const groupId = addRes._id;
    payload.groupInfo.id = groupId;

    await db.collection('group_members').add({
      data: Object.assign({}, payload.members[0], {
        groupId,
        role: 'creator',
        joinedAt: db.serverDate()
      })
    });

    return payload;
  } catch (err) {
    payload.offline = true;
    payload.error = err.message;
    return payload;
  }
}

async function leaveGroup(openid) {
  try {
    await db.collection('group_members').where({ openid }).remove();
  } catch (err) {
    return { success: true, offline: true, error: err.message };
  }
  return { success: true };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = (event && event.openid) || wxContext.OPENID || 'mock_openid';
  const action = event && event.action;
  const data = (event && event.data) || {};

  if (action === 'getMyGroup') {
    return getMyGroup(openid);
  }
  if (action === 'createGroup') {
    return createGroup(data, openid);
  }
  if (action === 'leaveGroup') {
    return leaveGroup(openid);
  }

  return { success: false, error: 'UNKNOWN_ACTION' };
};
