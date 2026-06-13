var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var audioManager = require('../../utils/audio-manager.js').getAudioManager();

// 省份真实经纬度坐标
var provinceCoords = {
  heilongjiang: { lng: 126.5, lat: 48.0 },
  jilin: { lng: 125.5, lat: 43.5 },
  liaoning: { lng: 122.5, lat: 41.0 },
  neimenggu: { lng: 117.0, lat: 44.0 },
  beijing: { lng: 116.4, lat: 39.9 },
  tianjin: { lng: 117.2, lat: 39.1 },
  hebei: { lng: 114.5, lat: 38.0 },
  shanxi: { lng: 112.0, lat: 37.5 },
  shandong: { lng: 118.0, lat: 36.0 },
  jiangsu: { lng: 119.5, lat: 33.0 },
  anhui: { lng: 117.0, lat: 32.0 },
  zhejiang: { lng: 120.0, lat: 29.0 },
  shanghai: { lng: 121.5, lat: 31.2 },
  fujian: { lng: 118.0, lat: 26.0 },
  jiangxi: { lng: 115.5, lat: 27.5 },
  henan: { lng: 113.5, lat: 34.0 },
  hubei: { lng: 112.0, lat: 31.0 },
  hunan: { lng: 112.0, lat: 27.5 },
  guangdong: { lng: 113.5, lat: 23.0 },
  guangxi: { lng: 108.5, lat: 23.5 },
  hainan: { lng: 110.0, lat: 19.0 },
  hongkong: { lng: 114.2, lat: 22.3 },
  macau: { lng: 113.5, lat: 22.2 },
  chongqing: { lng: 106.5, lat: 29.5 },
  sichuan: { lng: 102.5, lat: 30.5 },
  guizhou: { lng: 106.5, lat: 26.5 },
  yunnan: { lng: 102.5, lat: 25.0 },
  xizang: { lng: 88.0, lat: 31.0 },
  shaanxi: { lng: 108.5, lat: 35.5 },
  gansu: { lng: 103.5, lat: 36.0 },
  qinghai: { lng: 96.0, lat: 36.5 },
  ningxia: { lng: 106.0, lat: 37.5 },
  xinjiang: { lng: 85.0, lat: 42.0 },
  taiwan: { lng: 121.0, lat: 23.5 }
};

var hotCities = ['beijing', 'shanghai', 'hangzhou', 'xian', 'chengdu', 'guangzhou', 'nanjing', 'suzhou'];

// 省份级别必打卡地标（精选每个省最知名的2-3个地标）
var provinceLandmarks = {
  beijing: '故宫 / 长城 / 天安门',
  tianjin: '天津之眼 / 五大道 / 瓷房子',
  hebei: '避暑山庄 / 山海关 / 白洋淀',
  shanxi: '云冈石窟 / 平遥古城 / 五台山',
  neimenggu: '呼伦贝尔大草原 / 额济纳胡杨林 / 成吉思汗陵',
  liaoning: '沈阳故宫 / 星海广场 / 鸭绿江断桥',
  jilin: '长白山天池 / 吉林雾凇 / 伪满皇宫',
  heilongjiang: '冰雪大世界 / 圣索菲亚教堂 / 北极村',
  shanghai: '东方明珠 / 外滩 / 豫园',
  jiangsu: '中山陵 / 苏州园林 / 瘦西湖',
  zhejiang: '西湖 / 雷峰塔 / 普陀山',
  anhui: '黄山 / 宏村 / 九华山',
  fujian: '鼓浪屿 / 武夷山 / 永定土楼',
  jiangxi: '庐山 / 滕王阁 / 景德镇陶瓷',
  shandong: '泰山 / 趵突泉 / 蓬莱阁',
  henan: '少林寺 / 龙门石窟 / 清明上河园',
  hubei: '黄鹤楼 / 武当山 / 三峡大坝',
  hunan: '张家界 / 岳阳楼 / 凤凰古城',
  guangdong: '广州塔 / 丹霞山 / 开平碉楼',
  guangxi: '漓江 / 象鼻山 / 德天瀑布',
  hainan: '天涯海角 / 骑楼老街 / 蜈支洲岛',
  chongqing: '洪崖洞 / 解放碑 / 磁器口',
  sichuan: '九寨沟 / 大熊猫基地 / 乐山大佛',
  guizhou: '黄果树瀑布 / 千户苗寨 / 梵净山',
  yunnan: '丽江古城 / 大理洱海 / 西双版纳',
  xizang: '布达拉宫 / 纳木错 / 珠峰大本营',
  shaanxi: '兵马俑 / 大雁塔 / 华山',
  gansu: '莫高窟 / 月牙泉 / 嘉峪关',
  qinghai: '青海湖 / 茶卡盐湖 / 塔尔寺',
  ningxia: '西夏王陵 / 沙坡头 / 镇北堡影城',
  xinjiang: '天山天池 / 喀纳斯 / 喀什古城',
  taiwan: '台北101 / 日月潭 / 阿里山',
  hongkong: '维多利亚港 / 太平山顶 / 迪士尼',
  macau: '大三巴 / 澳门塔 / 威尼斯人'
};

// 预构建城市ID到省份ID的映射，避免重复循环
var cityToProvinceMap = {};
for (var i = 0; i < cities.length; i++) {
  cityToProvinceMap[cities[i].id] = cities[i].provinceId;
}

// 预构建省份到城市列表的映射
var provinceToCitiesMap = {};
for (var i = 0; i < cities.length; i++) {
  var pid = cities[i].provinceId;
  if (!provinceToCitiesMap[pid]) {
    provinceToCitiesMap[pid] = [];
  }
  provinceToCitiesMap[pid].push(cities[i].id);
}

Page({
  data: {
    visitedCount: 0,
    visitedProvinces: 0,
    photoCount: 0,
    totalCities: cities.length,
    completionRate: 0,
    provinceList: [],
    mapMarkers: [],
    recentCities: [],
    selectedProvince: '',
    selectedProvinceId: ''
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var visitedCities = app.globalData.visitedCities || [];
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var cityPhotos = app.globalData.cityPhotos || {};
    var visitDates = app.globalData.visitDates || {};

    // 计算已访问省份
    var visitedProvinceIds = [];
    for (var i = 0; i < visitedCities.length; i++) {
      var provinceId = cityToProvinceMap[visitedCities[i]];
      if (provinceId && visitedProvinceIds.indexOf(provinceId) === -1) {
        visitedProvinceIds.push(provinceId);
      }
    }

    // 计算照片总数（合并新旧格式）
    var photoCount = 0;
    var photoKeys = Object.keys(cityTravelPhotos);
    for (var k = 0; k < photoKeys.length; k++) {
      photoCount += cityTravelPhotos[photoKeys[k]].length;
    }
    var foodKeys = Object.keys(cityFoodPhotos);
    for (var f = 0; f < foodKeys.length; f++) {
      photoCount += cityFoodPhotos[foodKeys[f]].length;
    }
    var oldKeys = Object.keys(cityPhotos);
    for (var o = 0; o < oldKeys.length; o++) {
      photoCount += cityPhotos[oldKeys[o]].length;
    }

    var completionRate = cities.length > 0 ? Math.round((visitedCities.length / cities.length) * 100) : 0;

    // 构建省份列表和地图标记
    var provinceList = [];
    var mapMarkers = [];

    for (var p = 0; p < provinces.length; p++) {
      var province = provinces[p];
      var coords = provinceCoords[province.id];
      if (!coords) continue;

      var provinceCityIds = provinceToCitiesMap[province.id] || [];
      
      // 计算省份下照片总数
      var provincePhotoCount = 0;
      for (var pc = 0; pc < provinceCityIds.length; pc++) {
        var cid = provinceCityIds[pc];
        if (cityTravelPhotos[cid]) provincePhotoCount += cityTravelPhotos[cid].length;
        if (cityFoodPhotos[cid]) provincePhotoCount += cityFoodPhotos[cid].length;
        if (cityPhotos[cid]) provincePhotoCount += cityPhotos[cid].length;
      }

      var isHot = false;
      for (var h = 0; h < hotCities.length; h++) {
        if (provinceCityIds.indexOf(hotCities[h]) !== -1) {
          isHot = true;
          break;
        }
      }

      var isVisited = visitedProvinceIds.indexOf(province.id) !== -1;
      
      // 计算该省已打卡城市数
      var visitedInProvince = 0;
      for (var vc = 0; vc < provinceCityIds.length; vc++) {
        if (visitedCities.indexOf(provinceCityIds[vc]) !== -1) {
          visitedInProvince++;
        }
      }

      provinceList.push({
        id: province.id,
        name: province.name,
        visited: isVisited,
        hot: isHot,
        photoCount: provincePhotoCount,
        totalCities: provinceCityIds.length,
        visitedCities: visitedInProvince
      });

      // 使用PNG格式标记（手机端兼容性更好）
      var markerIcon = isVisited ? '/images/marker-visited.png' : '/images/marker-normal.png';
      var markerWidth = isVisited ? 30 : 26;
      var markerHeight = isVisited ? 30 : 26;

      mapMarkers.push({
        id: p + 1,
        latitude: coords.lat,
        longitude: coords.lng,
        title: province.name + (isVisited ? ' ✓已点亮' : ''),
        iconPath: markerIcon,
        width: markerWidth,
        height: markerHeight,
        callout: {
          content: province.name + (isVisited ? ' ✓' : '') + '\n' + visitedInProvince + '/' + provinceCityIds.length + ' 城',
          color: isVisited ? '#E98296' : '#666666',
          fontSize: 11,
          borderRadius: 8,
          bgColor: '#FFFFFF',
          padding: 6,
          display: 'BYCLICK',
          borderWidth: 1,
          borderColor: isVisited ? '#F4A6B5' : '#CCCCCC'
        }
      });
    }

    // 最近记录——按省份聚合（去重，最近5个省份）
    var recentCities = [];
    var seenProvinces = {};
    var maxItems = 5;
    for (var i = visitedCities.length - 1; i >= 0 && recentCities.length < maxItems; i--) {
      var cityId = visitedCities[i];
      var pid = cityToProvinceMap[cityId];
      if (!pid || seenProvinces[pid]) continue;  // 跳过已出现的省份，去重
      seenProvinces[pid] = true;

      // 省份名
      var pName = pid;
      for (var pn = 0; pn < provinces.length; pn++) {
        if (provinces[pn].id === pid) { pName = provinces[pn].name; break; }
      }

      // 省份下所有城市的照片汇总
      var provinceCityIds = provinceToCitiesMap[pid] || [];
      var allPhotos = [];
      for (var pc = 0; pc < provinceCityIds.length; pc++) {
        var cid2 = provinceCityIds[pc];
        if (cityTravelPhotos[cid2]) allPhotos = allPhotos.concat(cityTravelPhotos[cid2]);
        if (cityFoodPhotos[cid2]) allPhotos = allPhotos.concat(cityFoodPhotos[cid2]);
        if (cityPhotos[cid2]) allPhotos = allPhotos.concat(cityPhotos[cid2]);
      }

      // 取该城市的打卡日期
      var visitDateStr = visitDates[cityId];
      var displayDate = '';
      if (visitDateStr) {
        var parts = visitDateStr.split('-');
        displayDate = parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
      } else {
        displayDate = this.formatDate(new Date());
      }

      recentCities.push({
        id: pid,                          // 省份ID，用于跳转省份详情
        name: pName,                     // 省份名，如"安徽"
        provinceName: provinceLandmarks[pid] || '',   // 省份地标，如"黄山 / 宏村 / 九华山"
        photoUrl: allPhotos.length > 0 ? allPhotos[allPhotos.length - 1] : '',
        visitDate: displayDate
      });
    }

    this.setData({
      visitedCount: visitedCities.length,
      visitedProvinces: visitedProvinceIds.length,
      photoCount: photoCount,
      completionRate: completionRate,
      provinceList: provinceList,
      mapMarkers: mapMarkers,
      recentCities: recentCities
    });

    console.log('mapMarkers loaded:', mapMarkers.length, 'visitedProvinces:', visitedProvinceIds.length);
  },

  formatDate: function(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '月' + day + '日';
  },

  onMarkerTap: function(e) {
    var markerId = e.detail.markerId;
    var index = markerId - 1;
    var province = this.data.provinceList[index];
    if (province) {
      this.setData({
        selectedProvince: province.name,
        selectedProvinceId: province.id
      });
      wx.navigateTo({
        url: '/pages/city-detail/city-detail?provinceId=' + province.id
      });
    }
  },

  // 省份标签点击（从已点亮列表点击）
  onProvinceTagTap: function(e) {
    audioManager.play('button_tap');
    var provinceId = e.currentTarget.dataset.provinceid;
    var provinceList = this.data.provinceList;
    for (var i = 0; i < provinceList.length; i++) {
      if (provinceList[i].id === provinceId) {
        this.setData({
          selectedProvince: provinceList[i].name,
          selectedProvinceId: provinceId
        });
        wx.navigateTo({
          url: '/pages/city-detail/city-detail?provinceId=' + provinceId
        });
        break;
      }
    }
  },

  goToUpload: function() {
    audioManager.play('button_tap');
    wx.navigateTo({ url: '/package-album/pages/upload/upload' });
  },

  goToAlbum: function() {
    audioManager.play('button_tap');
    wx.navigateTo({ url: '/package-album/pages/album/album' });
  },

  goToCityDetail: function(e) {
    audioManager.play('page_navigate');
    var cityId = e.currentTarget.dataset.cityid;
    wx.navigateTo({ url: '/pages/city-detail/city-detail?cityId=' + cityId });
  },

  shareMap: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  onRecentImageError: function(e) {
    var index = e.currentTarget.dataset.index;
    var recentCities = this.data.recentCities;
    if (recentCities[index]) {
      recentCities[index].photoUrl = '';
      this.setData({ recentCities: recentCities });
    }
  },

  onShareAppMessage: function() {
    var visitedCount = this.data.visitedCount;
    var visitedProvinces = this.data.visitedProvinces;
    return {
      title: '我已点亮 ' + visitedCount + ' 座城市，足迹遍布 ' + visitedProvinces + ' 个省份！',
      path: '/pages/index/index'
    };
  }
});
