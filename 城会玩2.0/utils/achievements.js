// 成就系统配置
var achievements = [
  {
    id: 'first_city',
    title: '初次探索',
    desc: '点亮第一座城市',
    icon: '🎯',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedCount >= 1; },
    reward: 100
  },
  {
    id: 'five_cities',
    title: '小试牛刀',
    desc: '点亮5座城市',
    icon: '🌟',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedCount >= 5; },
    reward: 200
  },
  {
    id: 'ten_cities',
    title: '旅行达人',
    desc: '点亮10座城市',
    icon: '✈️',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedCount >= 10; },
    reward: 500
  },
  {
    id: 'twenty_cities',
    title: '足迹遍布',
    desc: '点亮20座城市',
    icon: '🌍',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedCount >= 20; },
    reward: 1000
  },
  {
    id: 'fifty_cities',
    title: '城市猎人',
    desc: '点亮50座城市',
    icon: '🏆',
    badge: '/images/ui/badge-expert.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedCount >= 50; },
    reward: 2000
  },
  {
    id: 'first_province',
    title: '省份开拓者',
    desc: '点亮第一个省份',
    icon: '🗺️',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedProvinces >= 1; },
    reward: 150
  },
  {
    id: 'five_provinces',
    title: '区域探索者',
    desc: '点亮5个省份',
    icon: '📍',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedProvinces >= 5; },
    reward: 300
  },
  {
    id: 'ten_provinces',
    title: '中国通',
    desc: '点亮10个省份',
    icon: '🇨🇳',
    badge: '/images/ui/badge-expert.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedProvinces >= 10; },
    reward: 600
  },
  {
    id: 'all_provinces',
    title: '环游中国',
    desc: '点亮所有省份',
    icon: '👑',
    badge: '/images/ui/badge-king.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedProvinces >= 34; },
    reward: 5000
  },
  {
    id: 'first_photo',
    title: '摄影师',
    desc: '上传第一张照片',
    icon: '📸',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'collect',
    condition: function(stats) { return stats.photoCount >= 1; },
    reward: 100
  },
  {
    id: 'ten_photos',
    title: '摄影爱好者',
    desc: '上传10张照片',
    icon: '📷',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'collect',
    condition: function(stats) { return stats.photoCount >= 10; },
    reward: 300
  },
  {
    id: 'fifty_photos',
    title: '摄影大师',
    desc: '上传50张照片',
    icon: '🎨',
    badge: '/images/ui/badge-master.jpg',
    category: 'collect',
    condition: function(stats) { return stats.photoCount >= 50; },
    reward: 800
  },
  {
    id: 'first_ssr',
    title: '欧皇附体',
    desc: '获得第一张SSR角色卡',
    icon: '💎',
    badge: '/images/ui/badge-expert.jpg',
    category: 'collect',
    condition: function(stats) { return stats.ssrCount >= 1; },
    reward: 500
  },
  {
    id: 'first_ur',
    title: '传说降临',
    desc: '获得第一张UR角色卡',
    icon: '🔥',
    badge: '/images/ui/badge-king.jpg',
    category: 'collect',
    condition: function(stats) { return stats.urCount >= 1; },
    reward: 1000
  },
  {
    id: 'card_collector',
    title: '卡牌大师',
    desc: '收集10张角色卡',
    icon: '🎴',
    badge: '/images/ui/badge-master.jpg',
    category: 'collect',
    condition: function(stats) { return stats.cardCount >= 10; },
    reward: 500
  },
  {
    id: 'night_owl',
    title: '夜猫子',
    desc: '在凌晨0-5点点亮城市',
    icon: '🌙',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'special',
    condition: function(stats) { return stats.nightVisit; },
    reward: 200
  },
  {
    id: 'speed_runner',
    title: '闪电侠',
    desc: '一天内点亮3座城市',
    icon: '⚡',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'special',
    condition: function(stats) { return stats.dailyVisit >= 3; },
    reward: 300
  },
  {
    id: 'foodie',
    title: '美食家',
    desc: '上传5张美食照片',
    icon: '🍜',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'collect',
    condition: function(stats) { return stats.foodPhotoCount >= 5; },
    reward: 250
  },
  {
    id: 'social_butterfly',
    title: '社交达人',
    desc: '分享足迹到朋友圈',
    icon: '📢',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'social',
    condition: function(stats) { return stats.shareCount >= 1; },
    reward: 100
  },
  {
    id: 'hundred_cities',
    title: '百城之王',
    desc: '点亮100座城市',
    icon: '👑',
    badge: '/images/ui/badge-king.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedCount >= 100; },
    reward: 3000
  },
  {
    id: 'half_provinces',
    title: '半壁江山',
    desc: '点亮17个省份',
    icon: '🏔️',
    badge: '/images/ui/badge-expert.jpg',
    category: 'explore',
    condition: function(stats) { return stats.visitedProvinces >= 17; },
    reward: 1000
  },
  {
    id: 'hundred_photos',
    title: '影像巨匠',
    desc: '上传100张照片',
    icon: '📽️',
    badge: '/images/ui/badge-king.jpg',
    category: 'collect',
    condition: function(stats) { return stats.photoCount >= 100; },
    reward: 1500
  },
  {
    id: 'twenty_food',
    title: '饕餮盛宴',
    desc: '上传20张美食照片',
    icon: '🍱',
    badge: '/images/ui/badge-master.jpg',
    category: 'collect',
    condition: function(stats) { return stats.foodPhotoCount >= 20; },
    reward: 600
  },
  {
    id: 'all_rarity',
    title: '全图鉴',
    desc: '收集所有稀有度角色卡',
    icon: '💫',
    badge: '/images/ui/badge-king.jpg',
    category: 'collect',
    condition: function(stats) { return stats.hasAllRarity; },
    reward: 2000
  },
  {
    id: 'five_shares',
    title: '传播大使',
    desc: '分享5次足迹',
    icon: '📣',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'social',
    condition: function(stats) { return stats.shareCount >= 5; },
    reward: 400
  },
  {
    id: 'ten_notes',
    title: '旅行作家',
    desc: '写10条旅行笔记',
    icon: '✍️',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'social',
    condition: function(stats) { return stats.noteCount >= 10; },
    reward: 350
  },
  {
    id: 'week_streak',
    title: '坚持不懈',
    desc: '连续7天打卡',
    icon: '🔥',
    badge: '/images/ui/badge-expert.jpg',
    category: 'special',
    condition: function(stats) { return stats.weekStreak >= 7; },
    reward: 800
  },
  {
    id: 'month_streak',
    title: '月度达人',
    desc: '连续30天打卡',
    icon: '📅',
    badge: '/images/ui/badge-king.jpg',
    category: 'special',
    condition: function(stats) { return stats.monthStreak >= 30; },
    reward: 2000
  },
  {
    id: 'early_bird',
    title: '早起的鸟儿',
    desc: '在早上5-7点点亮城市',
    icon: '🌅',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'special',
    condition: function(stats) { return stats.earlyVisit; },
    reward: 200
  },
  {
    id: 'five_cards',
    title: '初出茅庐',
    desc: '收集5张角色卡',
    icon: '🃏',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'collect',
    condition: function(stats) { return stats.cardCount >= 5; },
    reward: 300
  },
  {
    id: 'twenty_cards',
    title: '收藏家',
    desc: '收集20张角色卡',
    icon: '🏛️',
    badge: '/images/ui/badge-expert.jpg',
    category: 'collect',
    condition: function(stats) { return stats.cardCount >= 20; },
    reward: 1000
  }
  ,
  {
    id: 'squad_starter',
    title: '旅行小队成立',
    desc: '创建或加入一个旅行群组',
    icon: '队',
    badge: '/images/ui/badge-newbie.jpg',
    category: 'social',
    condition: function(stats) { return stats.groupMemberCount >= 1; },
    reward: 200
  },
  {
    id: 'shared_album',
    title: '共同足迹墙',
    desc: '群组累计共享10张城市照片',
    icon: '图',
    badge: '/images/ui/badge-advanced.jpg',
    category: 'social',
    condition: function(stats) { return stats.groupPhotoCount >= 10; },
    reward: 500
  },
  {
    id: 'team_city_map',
    title: '小队城市地图',
    desc: '群组共同点亮20座城市',
    icon: '城',
    badge: '/images/ui/badge-expert.jpg',
    category: 'social',
    condition: function(stats) { return stats.groupCityCount >= 20; },
    reward: 900
  }
];

// 获取成就状态
function getAchievementStatus(stats, unlockedIds) {
  var result = [];
  for (var i = 0; i < achievements.length; i++) {
    var ach = achievements[i];
    var isUnlocked = unlockedIds.indexOf(ach.id) !== -1;
    var canUnlock = !isUnlocked && ach.condition(stats);

    result.push({
      id: ach.id,
      title: ach.title,
      desc: ach.desc,
      icon: ach.icon,
      badge: ach.badge,
      category: ach.category,
      reward: ach.reward,
      unlocked: isUnlocked,
      canUnlock: canUnlock
    });
  }
  return result;
}

// 检查新解锁的成就
function checkNewAchievements(stats, unlockedIds) {
  var newAchievements = [];
  for (var i = 0; i < achievements.length; i++) {
    var ach = achievements[i];
    if (unlockedIds.indexOf(ach.id) === -1 && ach.condition(stats)) {
      newAchievements.push(ach);
    }
  }
  return newAchievements;
}

// 计算总经验值
function calculateTotalExp(unlockedIds) {
  var total = 0;
  for (var i = 0; i < achievements.length; i++) {
    if (unlockedIds.indexOf(achievements[i].id) !== -1) {
      total += achievements[i].reward;
    }
  }
  return total;
}

// 计算等级
function calculateLevel(exp) {
  var level = 1;
  var needed = 100;

  while (exp >= needed) {
    exp -= needed;
    level++;
    needed = Math.floor(needed * 1.2);
  }

  return {
    level: level,
    currentExp: exp,
    neededExp: needed,
    progress: Math.floor((exp / needed) * 100)
  };
}

module.exports = {
  achievements: achievements,
  getAchievementStatus: getAchievementStatus,
  checkNewAchievements: checkNewAchievements,
  calculateTotalExp: calculateTotalExp,
  calculateLevel: calculateLevel
};
