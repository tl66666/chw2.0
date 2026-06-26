const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    return { success: false, error: '未登录' };
  }
  
  try {
    switch (action) {
      case 'syncCityRecords':
        return await syncCityRecords(openid, data);
      case 'syncPhotos':
        return await syncPhotos(openid, data);
      case 'syncNotes':
        return await syncNotes(openid, data);
      case 'getAllData':
        return await getAllData(openid);
      case 'getGroupData':
        return await getGroupData(openid, data);
      case 'joinGroup':
        return await joinGroup(openid, data);
      case 'createGroup':
        return await createGroup(openid, data);
      case 'leaveGroup':
        return await leaveGroup(openid, data);
      case 'clearAllData':
        return await clearAllData(openid);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (error) {
    console.error('操作失败:', error);
    return { success: false, error: error.message };
  }
};

// 清除用户所有云端数据
async function clearAllData(openid) {
  try {
    // 删除城市记录
    try {
      await db.collection('cityRecords').where({ openid }).remove();
    } catch (e) { console.warn('clearAllData: cityRecords:', e.message); }
    // 删除照片
    try {
      await db.collection('photos').where({ openid }).remove();
    } catch (e) { console.warn('clearAllData: photos:', e.message); }
    // 删除笔记
    try {
      await db.collection('notes').where({ openid }).remove();
    } catch (e) { console.warn('clearAllData: notes:', e.message); }
    return { success: true };
  } catch (err) {
    console.error('clearAllData failed:', err);
    return { success: false, error: err.message };
  }
}

// 同步城市打卡记录
async function syncCityRecords(openid, records) {
  const now = new Date().toISOString();
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    // 检查是否已存在
    const existRes = await db.collection('cityRecords').where({
      _openid: openid,
      cityId: record.cityId
    }).get();
    
    if (existRes.data.length > 0) {
      // 更新
      await db.collection('cityRecords').doc(existRes.data[0]._id).update({
        data: {
          isVisited: record.isVisited,
          visitTime: record.visitTime || now,
          updateTime: now
        }
      });
    } else {
      // 新增
      await db.collection('cityRecords').add({
        data: {
          _openid: openid,
          cityId: record.cityId,
          provinceId: record.provinceId,
          isVisited: record.isVisited,
          visitTime: record.visitTime || now,
          createTime: now,
          updateTime: now
        }
      });
    }
  }
  
  // 更新用户统计
  await updateUserStats(openid);
  
  return { success: true, syncedCount: records.length };
}

// 同步照片记录
async function syncPhotos(openid, photos) {
  const now = new Date().toISOString();
  
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    if (photo._id) {
      // 更新已有照片
      await db.collection('photos').doc(photo._id).update({
        data: {
          description: photo.description || '',
          updateTime: now
        }
      });
    } else {
      const existRes = await db.collection('photos').where({
        _openid: openid,
        cityId: photo.cityId,
        fileId: photo.fileId || photo.url
      }).limit(1).get();

      if (existRes.data.length > 0) {
        await db.collection('photos').doc(existRes.data[0]._id).update({
          data: {
            type: photo.type || 'travel',
            url: photo.url,
            updateTime: now
          }
        });
      } else {
        // 新增照片
        await db.collection('photos').add({
          data: {
            _openid: openid,
            cityId: photo.cityId,
            provinceId: photo.provinceId,
            type: photo.type || 'travel',
            fileId: photo.fileId || photo.url,
            url: photo.url,
            thumbnail: photo.thumbnail || '',
            description: photo.description || '',
            createTime: now,
            updateTime: now
          }
        });
      }
    }
  }
  
  // 更新用户统计
  await updateUserStats(openid);
  
  return { success: true, syncedCount: photos.length };
}

// 同步笔记
async function syncNotes(openid, notes) {
  const now = new Date().toISOString();
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    
    const existRes = await db.collection('notes').where({
      _openid: openid,
      cityId: note.cityId
    }).get();
    
    if (existRes.data.length > 0) {
      await db.collection('notes').doc(existRes.data[0]._id).update({
        data: {
          content: note.content,
          updateTime: now
        }
      });
    } else {
      await db.collection('notes').add({
        data: {
          _openid: openid,
          cityId: note.cityId,
          provinceId: note.provinceId,
          content: note.content,
          createTime: now,
          updateTime: now
        }
      });
    }
  }
  
  return { success: true, syncedCount: notes.length };
}

// 获取用户所有数据
async function getAllData(openid) {
  // 获取城市记录
  const cityRes = await db.collection('cityRecords').where({
    _openid: openid
  }).get();
  
  // 获取照片
  const photoRes = await db.collection('photos').where({
    _openid: openid
  }).orderBy('createTime', 'desc').get();
  
  // 获取笔记
  const noteRes = await db.collection('notes').where({
    _openid: openid
  }).get();
  
  // 获取用户信息
  const userRes = await db.collection('users').where({
    _openid: openid
  }).get();
  
  return {
    success: true,
    data: {
      cityRecords: cityRes.data,
      photos: photoRes.data,
      notes: noteRes.data,
      userInfo: userRes.data[0] || null
    }
  };
}

// 创建共享群组
async function createGroup(openid, data) {
  try {
    const now = new Date().toISOString();
    const groupCode = generateGroupCode();
    
    const groupData = {
      _openid: openid,
      name: data.name || '未命名群组',
      type: data.type || 'friends',
      inviteCode: data.inviteCode || groupCode,
      members: [openid],
      admins: [openid],
      createTime: now,
      updateTime: now
    };
    
    const res = await db.collection('groups').add({
      data: groupData
    });
    
    // 更新用户的群组列表
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        currentGroup: res._id,
        groups: _.push(res._id)
      }
    });
    
    return {
      success: true,
      groupId: res._id,
      code: groupCode,
      message: '群组创建成功'
    };
  } catch (error) {
    console.error('创建群组失败:', error);
    return { success: false, error: '创建群组失败: ' + error.message };
  }
}

// 加入群组
async function joinGroup(openid, data) {
  try {
    const { inviteCode } = data;
    
    // 查找群组（使用 inviteCode 字段，与 group 云函数保持一致）
    const groupRes = await db.collection('groups').where({
      inviteCode: inviteCode
    }).get();
    
    if (groupRes.data.length === 0) {
      return { success: false, error: '群组不存在' };
    }
    
    const group = groupRes.data[0];
    
    // 检查是否已在群组中
    if (group.members && group.members.includes(openid)) {
      return { success: false, error: '你已经在该群组中' };
    }
    
    // 加入群组
    await db.collection('groups').doc(group._id).update({
      data: {
        members: _.push(openid),
        updateTime: new Date().toISOString()
      }
    });
    
    // 更新用户的群组列表
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        currentGroup: group._id,
        groups: _.push(group._id)
      }
    });
    
    return {
      success: true,
      groupId: group._id,
      message: '加入群组成功'
    };
  } catch (error) {
    console.error('加入群组失败:', error);
    return { success: false, error: '加入群组失败: ' + error.message };
  }
}

// 离开群组
async function leaveGroup(openid, data) {
  try {
    const { groupId } = data;
    
    const groupRes = await db.collection('groups').doc(groupId).get();
    
    if (!groupRes.data) {
      return { success: false, error: '群组不存在' };
    }
    
    const group = groupRes.data;
    
    // 从成员列表中移除
    const newMembers = group.members ? group.members.filter(id => id !== openid) : [];
    
    await db.collection('groups').doc(groupId).update({
      data: {
        members: newMembers,
        updateTime: new Date().toISOString()
      }
    });
    
    // 更新用户当前群组
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();
    
    if (userRes.data.length > 0) {
      const userGroups = userRes.data[0].groups || [];
      const newGroups = userGroups.filter(id => id !== groupId);
      
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          currentGroup: newGroups.length > 0 ? newGroups[0] : null,
          groups: newGroups
        }
      });
    }
    
    return { success: true, message: '已离开群组' };
  } catch (error) {
    console.error('离开群组失败:', error);
    return { success: false, error: '离开群组失败: ' + error.message };
  }
}

// 获取群组数据（合并所有成员的数据）
async function getGroupData(openid, data) {
  try {
    const { groupId } = data;
    
    // 检查用户是否在群组中
    const groupRes = await db.collection('groups').doc(groupId).get();
    
    if (!groupRes.data) {
      return { success: false, error: '群组不存在' };
    }
    
    const group = groupRes.data;
    
    if (!group.members || !group.members.includes(openid)) {
      return { success: false, error: '你不是该群组成员' };
    }
    
    // 获取所有成员的数据
    const members = group.members || [];
    
    // 获取所有成员的城市记录
    const cityRes = await db.collection('cityRecords').where({
      _openid: _.in(members)
    }).get();
    
    // 获取所有成员的照片
    const photoRes = await db.collection('photos').where({
      _openid: _.in(members)
    }).orderBy('createTime', 'desc').get();
    
    // 获取所有成员的信息
    const userRes = await db.collection('users').where({
      _openid: _.in(members)
    }).get();
    
    // 按用户分组数据
    const userData = {};
    
    for (const user of userRes.data) {
      userData[user._openid] = {
        nickName: user.nickName || '匿名用户',
        avatarUrl: user.avatarUrl || '',
        cities: [],
        photos: []
      };
    }
    
    for (const record of cityRes.data) {
      if (userData[record._openid]) {
        userData[record._openid].cities.push(record);
      }
    }
    
    for (const photo of photoRes.data) {
      if (userData[photo._openid]) {
        userData[photo._openid].photos.push(photo);
      }
    }
    
    return {
      success: true,
      group: {
        id: group._id,
        name: group.name,
        type: group.type,
        code: group.code
      },
      userData: userData
    };
  } catch (error) {
    console.error('获取群组数据失败:', error);
    return { success: false, error: '获取群组数据失败: ' + error.message };
  }
}

// 更新用户统计
async function updateUserStats(openid) {
  try {
    // 统计打卡城市
    const cityRes = await db.collection('cityRecords').where({
      _openid: openid,
      isVisited: true
    }).get();
    
    const visitedCities = cityRes.data.map(item => item.cityId);
    const visitedProvinces = [...new Set(cityRes.data.map(item => item.provinceId))];
    
    // 统计照片
    const travelPhotoRes = await db.collection('photos').where({
      _openid: openid,
      type: 'travel'
    }).count();
    
    const foodPhotoRes = await db.collection('photos').where({
      _openid: openid,
      type: 'food'
    }).count();
    
    // 更新用户统计
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        'stats.visitedCities': visitedCities,
        'stats.visitedProvinces': visitedProvinces,
        'stats.travelPhotoCount': travelPhotoRes.total,
        'stats.foodPhotoCount': foodPhotoRes.total
      }
    });
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
}

// 生成群组邀请码
function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
