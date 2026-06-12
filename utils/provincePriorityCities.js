// 每个省份优先显示图片的城市（省会 + 著名旅游城市）
// 这些城市会优先加载图片，其余城市显示省份默认图或留空

var provincePriorityCities = {
  // 直辖市
  beijing: ['beijing'],
  tianjin: ['tianjin'],
  shanghai: ['shanghai'],
  chongqing: ['chongqing'],

  // 河北省
  hebei: ['shijiazhuang', 'qinhuangdao', 'chengde'],

  // 山西省
  shanxi: ['taiyuan', 'datong'],

  // 内蒙古
  neimenggu: ['hohhot', 'huhehaote'],

  // 辽宁省
  liaoning: ['shenyang', 'dalian'],

  // 吉林省
  jilin: ['changchun'],

  // 黑龙江省
  heilongjiang: ['harbin'],

  // 江苏省
  jiangsu: ['nanjing', 'suzhou', 'wuxi', 'yangzhou'],

  // 浙江省
  zhejiang: ['hangzhou', 'ningbo', 'shaoxing', 'wenzhou'],

  // 安徽省
  anhui: ['hefei', 'huangshan'],

  // 福建省
  fujian: ['fuzhou', 'xiamen', 'quanzhou'],

  // 江西省
  jiangxi: ['nanchang', 'jingdezhen'],

  // 山东省
  shandong: ['jinan', 'qingdao', 'yantai'],

  // 河南省
  henan: ['zhengzhou', 'kaifeng', 'luoyang'],

  // 湖北省
  hubei: ['wuhan', 'yichang'],

  // 湖南省
  hunan: ['changsha', 'zhangjiajie'],

  // 广东省
  guangdong: ['guangzhou', 'shenzhen', 'zhuhai', 'foshan', 'shantou'],

  // 广西
  guangxi: ['nanning', 'guilin', 'beihai'],

  // 海南省
  hainan: ['haikou', 'sanya'],

  // 四川省
  sichuan: ['chengdu', 'leshan'],

  // 贵州省
  guizhou: ['guiyang', 'zunyi'],

  // 云南省
  yunnan: ['kunming', 'dali', 'lijiang', 'jinghong'],

  // 西藏
  xizang: ['lhasa'],

  // 陕西省
  shaanxi: ['xian', 'yanan'],

  // 甘肃省
  gansu: ['lanzhou', 'dunhuang'],

  // 青海省
  qinghai: ['xining'],

  // 宁夏
  ningxia: ['yinchuan'],

  // 新疆
  xinjiang: ['urumqi', 'kashgar'],

  // 台湾
  taiwan: ['taipei'],

  // 香港
  hongkong: ['hongkong'],

  // 澳门
  macau: ['macau']
};

// 获取省份优先城市列表
function getPriorityCities(provinceId) {
  return provincePriorityCities[provinceId] || [];
}

// 检查城市是否在优先列表中
function isPriorityCity(provinceId, cityId) {
  var list = provincePriorityCities[provinceId] || [];
  return list.indexOf(cityId) !== -1;
}

module.exports = {
  provincePriorityCities: provincePriorityCities,
  getPriorityCities: getPriorityCities,
  isPriorityCity: isPriorityCity
};
