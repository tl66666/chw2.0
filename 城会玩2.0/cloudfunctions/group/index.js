const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function now() {
  return new Date().toISOString();
}

// 安全生成6位邀请码
function generateCode() {
  var chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var code = '';
  for (var i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

    // 获取群组共享照片
    const photosRes = await db.collection('group_photos')
      .where({ groupId: member.groupId })
      .orderBy('createTime', 'desc')
      .limit(20)
      .get();
    const sharedPhotos = (photosRes.data || []).map(function(p) {
      return {
        id: p._id,
        url: p.url || p.fileId,
        userId: p.openid,
        userName: p.nickName || '成员',
        userAvatar: p.avatarUrl || '/images/avatar.jpg',
        cityName: p.cityName || '',
        createTime: p.createTime
      };
    });

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
      sharedPhotos: sharedPhotos
    };
  } catch (err) {
    return { success: true, groupInfo: null, offline: true, error: err.message };
  }
}

// 创建群组 — 必须确认数据库写入成功才返回 success: true
async function createGroup(data, openid) {
  try {
    const userInfo = data.userInfo || {};
    var inviteCode = data.inviteCode;
    if (!inviteCode || inviteCode.length !== 6) {
      inviteCode = generateCode();
    }
    console.log('[group] createGroup 邀请码:', inviteCode, '名称:', data.name);

    // 1. 写入 groups 集合
    const addRes = await db.collection('groups').add({
      data: {
        name: data.name || '我的旅行小队',
        type: data.type || 'friends',
        inviteCode: inviteCode,
        creatorOpenid: openid,
        totalProvinces: data.provinceCount || 0,
        sharedPhotos: [],
        createTime: now(),
        createdAt: db.serverDate()
      }
    });
    const groupId = addRes._id;
    console.log('[group] 群组创建成功, groupId:', groupId);

    // 2. 写入 group_members 集合
    await db.collection('group_members').add({
      data: {
        openid: openid,
        groupId: groupId,
        nickName: userInfo.nickName || '城会玩旅人',
        avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg',
        isCreator: true,
        role: '创建者',
        cityCount: data.cityCount || 0,
        photoCount: data.photoCount || 0,
        joinedAt: db.serverDate()
      }
    });
    console.log('[group] 成员添加成功');

    // 3. 返回成功
    return {
      success: true,
      groupInfo: {
        id: groupId,
        name: data.name || '我的旅行小队',
        type: data.type || 'friends',
        inviteCode: inviteCode,
        createTime: now(),
        creatorOpenid: openid
      },
      isCreator: true,
      isAdmin: true,
      inviteCode: inviteCode,
      members: [{
        openid: openid,
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
  } catch (err) {
    console.error('[group] createGroup 失败:', err);
    return { 
      success: false, 
      error: 'CREATE_FAILED', 
      message: '群组创建失败: ' + (err.message || '数据库错误') + '。请确认云开发数据库集合 groups 和 group_members 已创建。'
    };
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

// 通过邀请码加入群组
async function joinGroup(data, openid) {
  const inviteCode = (data && data.inviteCode || '').trim().toUpperCase();
  console.log('[group] joinGroup 尝试加入, 邀请码:', inviteCode, 'openid:', openid);
  
  if (!inviteCode || inviteCode.length !== 6) {
    return { success: false, error: 'INVALID_CODE', message: '邀请码格式不正确（需要6位字母数字）' };
  }

  try {
    // 1. 根据邀请码查找群组
    const groupRes = await db.collection('groups').where({ inviteCode }).limit(1).get();
    console.log('[group] 查询结果条数:', (groupRes.data || []).length);
    const group = groupRes.data && groupRes.data[0];
    if (!group) {
      return { success: false, error: 'CODE_NOT_FOUND', message: '邀请码不存在，请检查输入是否正确。注意区分大小写（如B和8）。' };
    }
    console.log('[group] 找到群组:', group.name, 'groupId:', group._id);

    // 2. 检查是否已经是成员
    const memberCheck = await db.collection('group_members')
      .where({ openid, groupId: group._id }).limit(1).get();
    if (memberCheck.data && memberCheck.data.length > 0) {
      return { success: false, error: 'ALREADY_MEMBER', message: '你已经是该群组的成员了' };
    }

    // 3. 检查群组人数上限（最多20人）
    const countRes = await db.collection('group_members').where({ groupId: group._id }).count();
    if (countRes.total >= 20) {
      return { success: false, error: 'GROUP_FULL', message: '群组已满（最多20人）' };
    }

    // 4. 添加为新成员
    const userInfo = data.userInfo || {};
    await db.collection('group_members').add({
      data: {
        openid,
        groupId: group._id,
        nickName: userInfo.nickName || '城会玩旅人',
        avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg',
        isCreator: false,
        role: '成员',
        cityCount: data.cityCount || 0,
        photoCount: data.photoCount || 0,
        joinedAt: db.serverDate()
      }
    });
    console.log('[group] 成员加入成功');

    // 5. 获取群组完整信息返回
    const membersRes = await db.collection('group_members').where({ groupId: group._id }).get();
    const members = membersRes.data || [];

    return {
      success: true,
      groupInfo: {
        id: group._id,
        name: group.name,
        type: group.type,
        inviteCode: group.inviteCode,
        createTime: group.createTime,
        creatorOpenid: group.creatorOpenid
      },
      isCreator: group.creatorOpenid === openid,
      isAdmin: false,
      inviteCode: group.inviteCode || '',
      members: members.map(function(m) {
        return {
          openid: m.openid,
          nickName: m.nickName,
          avatarUrl: m.avatarUrl,
          isCreator: m.isCreator || false,
          role: m.role || '成员',
          cityCount: m.cityCount || 0,
          photoCount: m.photoCount || 0
        };
      }),
      stats: {
        totalMembers: members.length,
        totalCities: members.reduce(function(sum, item) { return sum + (item.cityCount || 0); }, 0),
        totalProvinces: group.totalProvinces || 0,
        totalPhotos: members.reduce(function(sum, item) { return sum + (item.photoCount || 0); }, 0)
      },
      sharedPhotos: group.sharedPhotos || []
    };
  } catch (err) {
    console.error('[group] joinGroup 失败:', err);
    return { 
      success: false, 
      error: 'CLOUD_ERROR', 
      message: '加入失败: ' + (err.message || '数据库错误') + '。可能原因：1)云函数未部署 2)数据库集合未创建 3)网络超时' 
    };
  }
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
  if (action === 'joinGroup') {
    return joinGroup(data, openid);
  }
  if (action === 'sharePhoto') {
    return shareGroupPhoto(data, openid);
  }
  if (action === 'getSharedPhotos') {
    return getSharedPhotos(data, openid);
  }
  if (action === 'syncMemberStats') {
    return syncMemberStats(data, openid);
  }

  return { success: false, error: 'UNKNOWN_ACTION' };
};

// 共享照片到群组
async function shareGroupPhoto(data, openid) {
  const { groupId, fileId, url, cityName } = data;
  if (!groupId) {
    return { success: false, error: '缺少群组ID' };
  }
  try {
    // 获取用户信息
    const userRes = await db.collection('group_members').where({ openid, groupId }).limit(1).get();
    const member = userRes.data && userRes.data[0];
    if (!member) return { success: false, error: '你不是该群组成员' };

    const res = await db.collection('group_photos').add({
      data: {
        groupId,
        openid,
        nickName: member.nickName || '成员',
        avatarUrl: member.avatarUrl || '',
        fileId: fileId || '',
        url: url || fileId || '',
        cityName: cityName || '',
        createTime: db.serverDate()
      }
    });

    return { success: true, photoId: res._id, message: '照片已共享到群组' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 获取群组共享照片
async function getSharedPhotos(data, openid) {
  const { groupId } = data;
  if (!groupId) return { success: false, error: '缺少群组ID' };
  try {
    const res = await db.collection('group_photos')
      .where({ groupId })
      .orderBy('createTime', 'desc')
      .limit(50)
      .get();
    const photos = (res.data || []).map(function(p) {
      return {
        id: p._id,
        url: p.url || p.fileId,
        userId: p.openid,
        userName: p.nickName || '成员',
        userAvatar: p.avatarUrl || '/images/avatar.jpg',
        cityName: p.cityName || '',
        createTime: p.createTime
      };
    });
    return { success: true, photos };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// 同步成员统计数据
async function syncMemberStats(data, openid) {
  const { groupId, cityCount, photoCount } = data;
  if (!groupId) return { success: false, error: '缺少群组ID' };
  try {
    await db.collection('group_members').where({ openid, groupId }).update({
      data: {
        cityCount: cityCount || 0,
        photoCount: photoCount || 0,
        syncTime: db.serverDate()
      }
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
