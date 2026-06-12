// 所有省份角色卡数据
var provinceToCharacterDetail = {
  beijing: {
    name: '京城行者',
    title: '紫禁之巅',
    rarity: 'SSR',
    skill: '首都光环',
    description: '在故宫的红墙金瓦间穿梭，在现代CBD的摩天大楼中漫步。他是古老与现代的完美融合，是千年帝都的守护者。',
    attributes: { culture: 95, fashion: 85, food: 80, history: 100 },
    quote: '四九城里走一遭，千年历史脚下绕'
  },
  tianjin: {
    name: '津门相声家',
    title: '哏儿都达人',
    rarity: 'SR',
    skill: '相声buff',
    description: '一口地道的天津话，走到哪乐到哪。他是海河边的开心果，用相声治愈每一个旅人。',
    attributes: { culture: 80, fashion: 70, food: 85, history: 75 },
    quote: '嘛钱不钱的，乐呵乐呵得了'
  },
  hebei: {
    name: '燕赵侠士',
    title: '长城守望者',
    rarity: 'SR',
    skill: '万里长城',
    description: '站在长城之巅，眺望千里江山。他是燕赵大地的守护者，用豪情书写着河北的传奇。',
    attributes: { culture: 75, fashion: 60, food: 70, history: 90 },
    quote: '不到长城非好汉'
  },
  shanxi: {
    name: '晋商掌柜',
    title: '票号大东家',
    rarity: 'SR',
    skill: '精打细算',
    description: '平遥古城里的商业奇才，票号里的金融大佬。他用智慧守护着晋商的荣耀。',
    attributes: { culture: 80, fashion: 65, food: 75, history: 85 },
    quote: '诚信为本，童叟无欺'
  },
  neimenggu: {
    name: '草原雄鹰',
    title: '套马汉子',
    rarity: 'SSR',
    skill: '草原之歌',
    description: '骑着骏马在草原上驰骋，唱着悠扬的长调。他是草原的儿女，用热情款待每一位来客。',
    attributes: { culture: 85, fashion: 70, food: 80, history: 75 },
    quote: '天苍苍，野茫茫，风吹草低见牛羊'
  },
  liaoning: {
    name: '工业先锋',
    title: '共和国长子',
    rarity: 'SR',
    skill: '工业记忆',
    description: '从老工业基地到振兴先锋，他用钢铁般的意志书写着东北的辉煌。',
    attributes: { culture: 70, fashion: 75, food: 85, history: 80 },
    quote: '咱们工人有力量'
  },
  jilin: {
    name: '长白山人',
    title: '雪域守护者',
    rarity: 'SR',
    skill: '冰雪奇缘',
    description: '长白山的雪水滋养着他，雾凇岛的奇观陪伴着他。他是冰雪世界的精灵。',
    attributes: { culture: 75, fashion: 70, food: 80, history: 70 },
    quote: '长白山上有神仙'
  },
  heilongjiang: {
    name: '冰城艺术家',
    title: '冰雪魔法师',
    rarity: 'SSR',
    skill: '冰雪世界',
    description: '在零下三十度的严寒中，他用冰雪雕刻出最美的艺术品。哈尔滨的冬天因他而璀璨。',
    attributes: { culture: 80, fashion: 85, food: 75, history: 70 },
    quote: '北国风光，千里冰封'
  },
  shanghai: {
    name: '魔都潮人',
    title: '外滩弄潮儿',
    rarity: 'SSR',
    skill: '魔都速度',
    description: '手握咖啡，脚踩潮流，他是外滩最靓的仔。从法租界的梧桐到陆家嘴的霓虹，他用脚步丈量这座不夜城。',
    attributes: { culture: 80, fashion: 100, food: 85, history: 75 },
    quote: '魔都，一座来了就不想走的城市'
  },
  jiangsu: {
    name: '江南才子',
    title: '园林诗人',
    rarity: 'SSR',
    skill: '江南烟雨',
    description: '撑着油纸伞，漫步在苏州园林。他是江南水乡的才子，用诗词歌赋描绘着人间天堂。',
    attributes: { culture: 90, fashion: 80, food: 85, history: 85 },
    quote: '上有天堂，下有苏杭'
  },
  zhejiang: {
    name: '西湖仙子',
    title: '断桥佳人',
    rarity: 'SSR',
    skill: '西子湖畔',
    description: '断桥残雪，雷峰夕照。她是西湖边的仙子，用美丽守护着杭州的浪漫传说。',
    attributes: { culture: 85, fashion: 90, food: 80, history: 80 },
    quote: '欲把西湖比西子，淡妆浓抹总相宜'
  },
  anhui: {
    name: '黄山隐士',
    title: '云游道人',
    rarity: 'SR',
    skill: '黄山归来',
    description: '隐居黄山之巅，看云卷云舒。他是徽派建筑的守护者，用笔墨描绘着黄山的奇松怪石。',
    attributes: { culture: 85, fashion: 60, food: 75, history: 80 },
    quote: '五岳归来不看山，黄山归来不看岳'
  },
  fujian: {
    name: '海上丝路客',
    title: '妈祖守护者',
    rarity: 'SR',
    skill: '海丝之路',
    description: '从泉州港出发，沿着海上丝绸之路。他是闽南文化的传承者，用茶香传递着福建的温暖。',
    attributes: { culture: 80, fashion: 70, food: 85, history: 85 },
    quote: '爱拼才会赢'
  },
  jiangxi: {
    name: '瓷都匠人',
    title: '青花大师',
    rarity: 'SR',
    skill: '泥火艺术',
    description: '在景德镇的窑火旁，他用双手塑造着千年的瓷器传奇。他是泥与火的艺术家。',
    attributes: { culture: 90, fashion: 65, food: 70, history: 85 },
    quote: '白如玉，明如镜，薄如纸，声如磬'
  },
  shandong: {
    name: '齐鲁儒生',
    title: '孔孟传人',
    rarity: 'SSR',
    skill: '孔孟之道',
    description: '曲阜孔庙的钟声里，他传承着千年的儒家文化。他是礼仪之邦的守护者。',
    attributes: { culture: 95, fashion: 65, food: 80, history: 95 },
    quote: '有朋自远方来，不亦乐乎'
  },
  henan: {
    name: '中原行者',
    title: '少林武僧',
    rarity: 'SSR',
    skill: '功夫中原',
    description: '少林寺的钟声里，他修炼着绝世武功。他是中原大地的守护者，用武术传承着中华精神。',
    attributes: { culture: 85, fashion: 70, food: 80, history: 95 },
    quote: '天下功夫出少林'
  },
  hubei: {
    name: '江湖游侠',
    title: '黄鹤楼主',
    rarity: 'SR',
    skill: '江湖儿女',
    description: '站在黄鹤楼上，眺望长江东去。他是江湖中的游侠，用诗词书写着湖北的豪情。',
    attributes: { culture: 85, fashion: 75, food: 85, history: 80 },
    quote: '昔人已乘黄鹤去，此地空余黄鹤楼'
  },
  hunan: {
    name: '湘江北去',
    title: '橘子洲头',
    rarity: 'SR',
    skill: '湘江北去',
    description: '岳麓书院的书香里，他品味着湖湘文化的厚重。他是湘江边的诗人，用辣椒点燃生活的热情。',
    attributes: { culture: 85, fashion: 75, food: 90, history: 80 },
    quote: '独立寒秋，湘江北去'
  },
  guangdong: {
    name: '粤港潮人',
    title: '早茶大亨',
    rarity: 'SSR',
    skill: '食在广东',
    description: '一盅两件，得闲饮茶。他是广东美食的代言人，从广州塔到珠江夜游，他用味蕾记录这座城市。',
    attributes: { culture: 80, fashion: 85, food: 100, history: 75 },
    quote: '得闲饮茶'
  },
  guangxi: {
    name: '桂林画者',
    title: '山水画家',
    rarity: 'SSR',
    skill: '甲天下',
    description: '漓江的山水间，他用画笔记录着桂林的美。他是大自然的艺术家，用色彩描绘着广西的壮丽。',
    attributes: { culture: 80, fashion: 70, food: 75, history: 70 },
    quote: '桂林山水甲天下'
  },
  hainan: {
    name: '海岛浪人',
    title: '椰风少年',
    rarity: 'SSR',
    skill: '天涯海角',
    description: '椰林树影，水清沙白。他是海岛上的浪人，用阳光和海滩治愈每一个疲惫的灵魂。',
    attributes: { culture: 70, fashion: 85, food: 80, history: 60 },
    quote: '请到天涯海角来'
  },
  chongqing: {
    name: '山城棒棒',
    title: '火锅英雄',
    rarity: 'SSR',
    skill: '8D魔幻',
    description: '爬坡上坎，穿楼而过。他是8D魔幻城市的征服者，火锅是他的武器，夜景是他的战袍。',
    attributes: { culture: 75, fashion: 80, food: 95, history: 70 },
    quote: '勒是雾都'
  },
  sichuan: {
    name: '蜀地熊猫',
    title: '火锅熊猫',
    rarity: 'SSR',
    skill: '巴适得板',
    description: '戴着墨镜，吃着火锅，他是成都街头最悠闲的存在。麻辣鲜香是他的标签，慢生活是态度。',
    attributes: { culture: 85, fashion: 70, food: 100, history: 80 },
    quote: '巴适得很'
  },
  guizhou: {
    name: '苗岭歌者',
    title: '高山流水',
    rarity: 'SR',
    skill: '多彩贵州',
    description: '苗族的银饰叮当作响，侗族的大歌响彻山谷。他是贵州山间的歌者，用歌声传递着少数民族的热情。',
    attributes: { culture: 90, fashion: 75, food: 80, history: 75 },
    quote: '天无三日晴，地无三里平'
  },
  yunnan: {
    name: '彩云之南',
    title: '苍山洱海守望者',
    rarity: 'SSR',
    skill: '风花雪月',
    description: '苍山洱海之间，他用镜头记录着云南的美。他是彩云之南的守望者，用浪漫诠释着生活。',
    attributes: { culture: 85, fashion: 80, food: 85, history: 75 },
    quote: '彩云之南，我心的方向'
  },
  xizang: {
    name: '雪域圣僧',
    title: '布达拉宫守护者',
    rarity: 'UR',
    skill: '朝圣之路',
    description: '转经筒转动的是信仰，磕长头丈量的是虔诚。他是离天空最近的人，是雪域高原的守护者。',
    attributes: { culture: 100, fashion: 60, food: 65, history: 95 },
    quote: '扎西德勒'
  },
  shaanxi: {
    name: '秦俑守卫',
    title: '兵马俑复活',
    rarity: 'SSR',
    skill: '大秦帝国',
    description: '兵马俑的阵列中，他守护着秦始皇的荣耀。他是陕西大地的历史见证者，用沉默诉说着千年往事。',
    attributes: { culture: 90, fashion: 65, food: 90, history: 100 },
    quote: '秦王扫六合，虎视何雄哉'
  },
  gansu: {
    name: '丝路商队',
    title: '敦煌飞天',
    rarity: 'SSR',
    skill: '丝绸之路',
    description: '从长安到罗马，他沿着丝绸之路传播着文明。他是敦煌石窟的守护者，用壁画记录着东西方文明的交融。',
    attributes: { culture: 95, fashion: 65, food: 70, history: 90 },
    quote: '西出阳关无故人'
  },
  qinghai: {
    name: '高原牧民',
    title: '青海湖守护者',
    rarity: 'SR',
    skill: '天空之镜',
    description: '青海湖畔，他用歌声赞美着这片净土。他是高原上的牧民，用淳朴守护着青海的纯净。',
    attributes: { culture: 80, fashion: 60, food: 70, history: 70 },
    quote: '青海湖上，蓝天白云'
  },
  ningxia: {
    name: '西夏行者',
    title: '贺兰山猎人',
    rarity: 'R',
    skill: '塞上江南',
    description: '贺兰山下，他用弓箭守护着这片土地。他是西夏文化的传承者，用坚韧书写着宁夏的故事。',
    attributes: { culture: 75, fashion: 60, food: 70, history: 80 },
    quote: '塞上江南，鱼米之乡'
  },
  xinjiang: {
    name: '西域舞者',
    title: '天山雪莲',
    rarity: 'SSR',
    skill: '歌舞之乡',
    description: '天山下，葡萄架旁，他用舞蹈传递着新疆的热情。他是丝绸之路上的明珠，用美食和歌舞款待每一位来客。',
    attributes: { culture: 90, fashion: 85, food: 90, history: 80 },
    quote: '我们新疆好地方'
  },
  taiwan: {
    name: '宝岛游子',
    title: '海峡归人',
    rarity: 'SSR',
    skill: '宝岛风情',
    description: '阿里山的日出，日月潭的波光。他是宝岛的游子，用温情守护着台湾的美丽。',
    attributes: { culture: 85, fashion: 90, food: 90, history: 75 },
    quote: '乡愁是一湾浅浅的海峡'
  },
  hongkong: {
    name: '港风巨星',
    title: '维港之星',
    rarity: 'SSR',
    skill: '港片记忆',
    description: '维多利亚港的夜色中，他是那颗最亮的星。从旺角到中环，他用脚步丈量着这座东方之珠。',
    attributes: { culture: 85, fashion: 95, food: 90, history: 75 },
    quote: '东方之珠，我的爱人'
  },
  macau: {
    name: '濠江赌圣',
    title: '葡韵荷官',
    rarity: 'SR',
    skill: '东方拉斯维加斯',
    description: '大三巴的钟声里，他品味着中西文化的交融。他是澳门的传奇，用幸运守护着每一位来客。',
    attributes: { culture: 80, fashion: 85, food: 85, history: 75 },
    quote: '你可知Macau，不是我真姓'
  }
};

// 默认角色信息
var defaultCharacter = {
  name: '神秘旅人',
  title: '未知领域',
  rarity: 'R',
  skill: '探索未知',
  description: '这片神秘的土地等待着你的探索，去点亮它，解锁专属角色卡吧！',
  attributes: { culture: 50, fashion: 50, food: 50, history: 50 },
  quote: '世界那么大，我想去看看'
};

// 稀有度颜色
var rarityColors = {
  'R': '#9B9B9B',
  'SR': '#4A90E2',
  'SSR': '#F5A623',
  'UR': '#D0021B'
};

// 稀有度排序权重
var rarityWeight = {
  'R': 1,
  'SR': 2,
  'SSR': 3,
  'UR': 4
};

module.exports = {
  provinceToCharacterDetail: provinceToCharacterDetail,
  defaultCharacter: defaultCharacter,
  rarityColors: rarityColors,
  rarityWeight: rarityWeight,
  
  // 获取角色卡信息
  getCharacter: function(provinceId) {
    return provinceToCharacterDetail[provinceId] || defaultCharacter;
  },
  
  // 获取稀有度颜色
  getRarityColor: function(rarity) {
    return rarityColors[rarity] || '#9B9B9B';
  },
  
  // 获取稀有度权重（用于排序）
  getRarityWeight: function(rarity) {
    return rarityWeight[rarity] || 0;
  }
};
