// 地图从省份进入时使用的精选目的地。它们是旅行地标，不是行政区列表。
var provinceHighlights = {
  beijing: ['故宫博物院', '慕田峪长城', '颐和园'], tianjin: ['五大道', '古文化街', '天津之眼'],
  hebei: ['承德避暑山庄', '北戴河', '山海关'], shanxi: ['平遥古城', '五台山', '云冈石窟'],
  neimenggu: ['呼伦贝尔大草原', '阿尔山', '额济纳胡杨林'], liaoning: ['沈阳故宫', '大连滨海路', '本溪水洞'],
  jilin: ['长白山天池', '吉林雾凇岛', '延吉西市场'], heilongjiang: ['哈尔滨中央大街', '雪乡', '漠河北极村'],
  shanghai: ['外滩', '豫园', '武康路'], jiangsu: ['苏州园林', '南京博物院', '扬州瘦西湖'],
  zhejiang: ['杭州西湖', '乌镇', '普陀山'], anhui: ['黄山', '宏村', '九华山'],
  fujian: ['鼓浪屿', '武夷山', '福建土楼'], jiangxi: ['庐山', '景德镇古窑', '婺源篁岭'],
  shandong: ['泰山', '青岛八大关', '曲阜三孔'], henan: ['龙门石窟', '少林寺', '清明上河园'],
  hubei: ['黄鹤楼', '神农架', '武当山'], hunan: ['张家界国家森林公园', '岳阳楼', '凤凰古城'],
  guangdong: ['广州永庆坊', '开平碉楼', '丹霞山'], guangxi: ['桂林漓江', '阳朔遇龙河', '德天跨国瀑布'],
  hainan: ['三亚亚龙湾', '蜈支洲岛', '万宁日月湾'], chongqing: ['洪崖洞', '长江索道', '武隆喀斯特'],
  sichuan: ['九寨沟', '都江堰', '峨眉山'], guizhou: ['黄果树瀑布', '梵净山', '西江千户苗寨'],
  yunnan: ['大理洱海', '丽江古城', '梅里雪山'], xizang: ['布达拉宫', '纳木错', '珠穆朗玛峰'],
  shaanxi: ['兵马俑', '华山', '黄河壶口瀑布'], gansu: ['莫高窟', '鸣沙山月牙泉', '张掖七彩丹霞'],
  qinghai: ['青海湖', '茶卡盐湖', '可可西里'], ningxia: ['沙坡头', '西夏陵', '贺兰山岩画'],
  xinjiang: ['喀纳斯', '赛里木湖', '喀什古城'], taiwan: ['日月潭', '阿里山', '太鲁阁峡谷'],
  hongkong: ['维多利亚港', '太平山顶', '西贡'], macau: ['大三巴牌坊', '澳门历史城区', '路环']
};

function getProvinceHighlights(provinceId) {
  return (provinceHighlights[provinceId] || []).slice();
}

module.exports = { provinceHighlights: provinceHighlights, getProvinceHighlights: getProvinceHighlights };
