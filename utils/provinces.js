var provinces = [
  { id: "beijing", name: "北京市", abbr: "京", capital: "北京", lat: 39.9042, lng: 116.4074 },
  { id: "tianjin", name: "天津市", abbr: "津", capital: "天津", lat: 39.1252, lng: 117.1904 },
  { id: "hebei", name: "河北省", abbr: "冀", capital: "石家庄", lat: 38.0428, lng: 114.5149 },
  { id: "shanxi", name: "山西省", abbr: "晋", capital: "太原", lat: 37.8706, lng: 112.5489 },
  { id: "neimenggu", name: "内蒙古自治区", abbr: "蒙", capital: "呼和浩特", lat: 40.8414, lng: 111.7519 },
  { id: "liaoning", name: "辽宁省", abbr: "辽", capital: "沈阳", lat: 41.8057, lng: 123.4315 },
  { id: "jilin", name: "吉林省", abbr: "吉", capital: "长春", lat: 43.8171, lng: 125.3235 },
  { id: "heilongjiang", name: "黑龙江省", abbr: "黑", capital: "哈尔滨", lat: 45.8038, lng: 126.5350 },
  { id: "shanghai", name: "上海市", abbr: "沪", capital: "上海", lat: 31.2304, lng: 121.4737 },
  { id: "jiangsu", name: "江苏省", abbr: "苏", capital: "南京", lat: 32.0603, lng: 118.7969 },
  { id: "zhejiang", name: "浙江省", abbr: "浙", capital: "杭州", lat: 30.2741, lng: 120.1551 },
  { id: "anhui", name: "安徽省", abbr: "皖", capital: "合肥", lat: 31.8206, lng: 117.2272 },
  { id: "fujian", name: "福建省", abbr: "闽", capital: "福州", lat: 26.0745, lng: 119.2965 },
  { id: "jiangxi", name: "江西省", abbr: "赣", capital: "南昌", lat: 28.6820, lng: 115.8579 },
  { id: "shandong", name: "山东省", abbr: "鲁", capital: "济南", lat: 36.6512, lng: 117.1201 },
  { id: "henan", name: "河南省", abbr: "豫", capital: "郑州", lat: 34.7466, lng: 113.6253 },
  { id: "hubei", name: "湖北省", abbr: "鄂", capital: "武汉", lat: 30.5928, lng: 114.3055 },
  { id: "hunan", name: "湖南省", abbr: "湘", capital: "长沙", lat: 28.2280, lng: 112.9388 },
  { id: "guangdong", name: "广东省", abbr: "粤", capital: "广州", lat: 23.1291, lng: 113.2644 },
  { id: "guangxi", name: "广西壮族自治区", abbr: "桂", capital: "南宁", lat: 22.8170, lng: 108.3665 },
  { id: "hainan", name: "海南省", abbr: "琼", capital: "海口", lat: 20.0440, lng: 110.1999 },
  { id: "chongqing", name: "重庆市", abbr: "渝", capital: "重庆", lat: 29.5630, lng: 106.5516 },
  { id: "sichuan", name: "四川省", abbr: "川/蜀", capital: "成都", lat: 30.5728, lng: 104.0668 },
  { id: "guizhou", name: "贵州省", abbr: "贵/黔", capital: "贵阳", lat: 26.6470, lng: 106.6302 },
  { id: "yunnan", name: "云南省", abbr: "云/滇", capital: "昆明", lat: 25.0389, lng: 102.7183 },
  { id: "xizang", name: "西藏自治区", abbr: "藏", capital: "拉萨", lat: 29.6500, lng: 91.1000 },
  { id: "shaanxi", name: "陕西省", abbr: "陕/秦", capital: "西安", lat: 34.3416, lng: 108.9398 },
  { id: "gansu", name: "甘肃省", abbr: "甘/陇", capital: "兰州", lat: 36.0611, lng: 103.8343 },
  { id: "qinghai", name: "青海省", abbr: "青", capital: "西宁", lat: 36.6171, lng: 101.7782 },
  { id: "ningxia", name: "宁夏回族自治区", abbr: "宁", capital: "银川", lat: 38.4872, lng: 106.2309 },
  { id: "xinjiang", name: "新疆维吾尔自治区", abbr: "新", capital: "乌鲁木齐", lat: 43.8256, lng: 87.6168 },
  { id: "taiwan", name: "台湾省", abbr: "台", capital: "台北", lat: 25.0330, lng: 121.5654 },
  { id: "hongkong", name: "香港特别行政区", abbr: "港", capital: "香港", lat: 22.3193, lng: 114.1694 },
  { id: "macau", name: "澳门特别行政区", abbr: "澳", capital: "澳门", lat: 22.1987, lng: 113.5439 }
];

function getAllProvinces() {
  return provinces;
}

function getProvinceById(id) {
  for (var i = 0; i < provinces.length; i++) {
    if (provinces[i].id === id) {
      return provinces[i];
    }
  }
  return null;
}

function getProvinceByName(name) {
  for (var i = 0; i < provinces.length; i++) {
    if (provinces[i].name.indexOf(name) !== -1) {
      return provinces[i];
    }
  }
  return null;
}

module.exports = {
  provinces: provinces,
  getAllProvinces: getAllProvinces,
  getProvinceById: getProvinceById,
  getProvinceByName: getProvinceByName
};
