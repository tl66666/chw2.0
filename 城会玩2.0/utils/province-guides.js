var cities = require('./cities.js').cities;
var provinces = require('./provinces.js').provinces;
var getCityGuide = require('./city-guides.js').getCityGuide;

var provinceLandmarks = {
  beijing: '故宫 / 长城 / 天安门', tianjin: '天津之眼 / 五大道 / 瓷房子', hebei: '避暑山庄 / 山海关 / 白洋淀',
  shanxi: '云冈石窟 / 平遥古城 / 五台山', neimenggu: '呼伦贝尔大草原 / 额济纳胡杨林 / 成吉思汗陵', liaoning: '沈阳故宫 / 星海广场 / 鸭绿江断桥',
  jilin: '长白山天池 / 吉林雾凇 / 伪满皇宫', heilongjiang: '冰雪大世界 / 圣索菲亚教堂 / 北极村', shanghai: '东方明珠 / 外滩 / 豫园',
  jiangsu: '中山陵 / 苏州园林 / 瘦西湖', zhejiang: '西湖 / 雷峰塔 / 普陀山', anhui: '黄山 / 宏村 / 九华山',
  fujian: '鼓浪屿 / 武夷山 / 永定土楼', jiangxi: '庐山 / 滕王阁 / 景德镇陶瓷', shandong: '泰山 / 趵突泉 / 蓬莱阁',
  henan: '少林寺 / 龙门石窟 / 清明上河园', hubei: '黄鹤楼 / 武当山 / 三峡大坝', hunan: '张家界 / 岳阳楼 / 凤凰古城',
  guangdong: '广州塔 / 丹霞山 / 开平碉楼', guangxi: '漓江 / 象鼻山 / 德天瀑布', hainan: '天涯海角 / 骑楼老街 / 蜈支洲岛',
  chongqing: '洪崖洞 / 解放碑 / 磁器口', sichuan: '九寨沟 / 大熊猫基地 / 乐山大佛', guizhou: '黄果树瀑布 / 千户苗寨 / 梵净山',
  yunnan: '丽江古城 / 大理洱海 / 西双版纳', xizang: '布达拉宫 / 纳木错 / 珠峰大本营', shaanxi: '兵马俑 / 大雁塔 / 华山',
  gansu: '莫高窟 / 月牙泉 / 嘉峪关', qinghai: '青海湖 / 茶卡盐湖 / 塔尔寺', ningxia: '西夏王陵 / 沙坡头 / 镇北堡影城',
  xinjiang: '天山天池 / 喀纳斯 / 喀什古城', taiwan: '台北101 / 日月潭 / 阿里山', hongkong: '维多利亚港 / 太平山顶 / 迪士尼', macau: '大三巴 / 澳门塔 / 威尼斯人'
};

function getProvinceGuide(provinceId) {
  var province = provinces.filter(function(item) { return item.id === provinceId; })[0];
  var city = cities.filter(function(item) { return province && item.provinceId === provinceId && item.name === province.capital; })[0];
  if (!city) city = cities.filter(function(item) { return item.provinceId === provinceId && getCityGuide(item.id); })[0];
  var guide = city && getCityGuide(city.id);
  return {
    startName: city ? city.name : (province ? province.capital : ''),
    guide: guide || null
  };
}

function getProvinceLandmarks(provinceId) {
  return String(provinceLandmarks[provinceId] || '').split(/\s*[\/,，、]\s*/).filter(Boolean);
}

module.exports = {
  provinceLandmarks: provinceLandmarks,
  getProvinceGuide: getProvinceGuide,
  getProvinceLandmarks: getProvinceLandmarks
};
