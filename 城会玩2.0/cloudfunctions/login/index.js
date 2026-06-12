const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { code, userInfo } = event;
  
  try {
    // 调用微信接口获取openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const unionid = wxContext.UNIONID;
    
    if (!openid) {
      return {
        success: false,
        error: '获取用户身份失败'
      };
    }
    
    // 查询用户是否已存在
    const userRes = await db.collection('users').where({
      _openid: openid
    }).get();
    
    let userData;
    const now = new Date().toISOString();
    
    if (userRes.data.length === 0) {
      // 新用户，创建记录
      userData = {
        _openid: openid,
        unionid: unionid || '',
        nickName: userInfo ? userInfo.nickName : '旅行者',
        avatarUrl: userInfo ? userInfo.avatarUrl : '',
        createTime: now,
        lastLoginTime: now,
        stats: {
          visitedCities: [],
          visitedProvinces: [],
          travelPhotoCount: 0,
          foodPhotoCount: 0
        },
        privacy: {
          allowSearch: true,
          allowFriendRequest: true,
          sharePhotos: 'friends', // all, friends, none
          shareVisited: 'friends' // all, friends, none
        },
        groups: [],
        currentGroup: null
      };
      
      await db.collection('users').add({
        data: userData
      });
    } else {
      // 老用户，更新登录时间
      userData = userRes.data[0];
      await db.collection('users').where({
        _openid: openid
      }).update({
        data: {
          lastLoginTime: now,
          nickName: userInfo ? userInfo.nickName : userData.nickName,
          avatarUrl: userInfo ? userInfo.avatarUrl : userData.avatarUrl
        }
      });
    }
    
    return {
      success: true,
      openid: openid,
      userInfo: {
        nickName: userData.nickName,
        avatarUrl: userData.avatarUrl,
        createTime: userData.createTime,
        stats: userData.stats,
        currentGroup: userData.currentGroup,
        groups: userData.groups || []
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
