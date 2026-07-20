var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var audioManager = require('../../utils/audio-manager.js').getAudioManager();
var groupView = require('../../utils/group-view.js');

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
    selectedProvinceId: '',
    searchKeyword: '',
    searchResults: [],
    showSearchPanel: false,
    recommendation: null
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    var self = this;
    this.loadData();
    if (app.refreshGroupCache) {
      app.refreshGroupCache(function(updated) {
        if (updated) self.loadData();
      });
    }
  },

  loadData: function() {
    var localVisitedCities = app.globalData.visitedCities || [];
    var visitedCities = groupView.mergeCityIds(localVisitedCities);
    var groupData = groupView.getGroupData();
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
    photoCount += groupView.getAllPhotos().length;

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
      provincePhotoCount += groupView.countPhotosForCities(provinceCityIds);

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

    // 最近记录只展示城市事件；省份仍是地图的聚合单位。
    var recentCities = [];
    var maxItems = 5;
    for (var i = visitedCities.length - 1; i >= 0 && recentCities.length < maxItems; i--) {
      var cityId = visitedCities[i];
      var pid = cityToProvinceMap[cityId];
      if (!pid) continue;

      var city = null;
      for (var cityIndex = 0; cityIndex < cities.length; cityIndex++) {
        if (cities[cityIndex].id === cityId) {
          city = cities[cityIndex];
          break;
        }
      }
      if (!city) continue;

      // 省份名
      var pName = pid;
      for (var pn = 0; pn < provinces.length; pn++) {
        if (provinces[pn].id === pid) { pName = provinces[pn].name; break; }
      }

      var allPhotos = [];
      if (cityTravelPhotos[cityId]) allPhotos = allPhotos.concat(cityTravelPhotos[cityId]);
      if (cityFoodPhotos[cityId]) allPhotos = allPhotos.concat(cityFoodPhotos[cityId]);
      if (cityPhotos[cityId]) allPhotos = allPhotos.concat(cityPhotos[cityId]);
      allPhotos = allPhotos.concat(groupView.getAllPhotos().filter(function(item) {
        return item.cityId === cityId;
      }));

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
        id: cityId,
        name: city.name,
        provinceName: pName,
        sourceText: localVisitedCities.indexOf(cityId) !== -1 ? '我的打卡' : '小队足迹',
        photoUrl: allPhotos.length > 0 ? this.getPhotoUrl(allPhotos[allPhotos.length - 1]) : '',
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
    this.resolveRecentPhotoUrls(recentCities);
    this.loadRecommendation();

    console.log('mapMarkers loaded:', mapMarkers.length, 'visitedProvinces:', visitedProvinceIds.length);
  },

  getPhotoUrl: function(photo) {
    if (!photo) return '';
    if (typeof photo === 'string') return photo;
    return photo.displayUrl || photo.localPath || photo.url || photo.fileId || '';
  },

  resolveRecentPhotoUrls: function(recentCities) {
    if (!wx.cloud || !recentCities || recentCities.length === 0) return;
    var fileList = [];
    recentCities.forEach(function(item) {
      if (item.photoUrl && item.photoUrl.indexOf('cloud://') === 0 && fileList.indexOf(item.photoUrl) === -1) {
        fileList.push(item.photoUrl);
      }
    });
    if (fileList.length === 0) return;

    var self = this;
    wx.cloud.getTempFileURL({ fileList: fileList }).then(function(res) {
      var map = {};
      (res.fileList || []).forEach(function(item) {
        if (item.fileID && item.tempFileURL) map[item.fileID] = item.tempFileURL;
      });
      var nextCities = (self.data.recentCities || []).map(function(item) {
        if (item.photoUrl && map[item.photoUrl]) item.photoUrl = map[item.photoUrl];
        return item;
      });
      self.setData({ recentCities: nextCities });
    }).catch(function() {});
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
      this.openProvinceOverviewById(province.id);
    }
  },

  openProvinceOverview: function(e) {
    audioManager.play('button_tap');
    var provinceId = e.currentTarget.dataset.provinceid;
    this.openProvinceOverviewById(provinceId);
  },

  openProvinceOverviewById: function(provinceId) {
    var provinceList = this.data.provinceList;
    for (var i = 0; i < provinceList.length; i++) {
      if (provinceList[i].id === provinceId) {
        this.setData({
          selectedProvince: provinceList[i].name,
          selectedProvinceId: provinceId
        });
        wx.navigateTo({
          url: '/pages/province-detail/province-detail?provinceId=' + provinceId
        });
        break;
      }
    }
  },

  openCityRecord: function(e) {
    var cityId = e.currentTarget.dataset.cityid;
    if (!cityId) return;
    audioManager.play('page_navigate');
    wx.navigateTo({ url: '/pages/city-detail/city-detail?cityId=' + cityId });
  },

  goToAlbum: function() {
    audioManager.play('button_tap');
    wx.switchTab({ url: '/pages/album/album' });
  },

  // ===== 城市搜索 =====
  onSearchInput: function(e) {
    var keyword = e.detail.value.trim();
    if (!keyword) {
      this.setData({ searchResults: [], showSearchPanel: false, searchKeyword: '' });
      return;
    }
    var visitedCities = app.globalData.visitedCities || [];
    var results = [];
    var kw = keyword.toLowerCase();
    for (var i = 0; i < cities.length; i++) {
      var c = cities[i];
      if (c.name.indexOf(keyword) > -1 ||
          (c.pinyin && c.pinyin.indexOf(kw) > -1) ||
          c.id.indexOf(kw) > -1) {
        var provName = '';
        for (var j = 0; j < provinces.length; j++) {
          if (provinces[j].id === c.provinceId) {
            provName = provinces[j].name;
            break;
          }
        }
        results.push({
          key: 'city:' + c.id,
          id: c.id,
          name: c.name,
          type: 'city',
          typeText: '城市',
          provinceId: c.provinceId,
          provinceName: provName,
          landmark: c.landmark || '',
          visited: visitedCities.indexOf(c.id) > -1
        });
      }
    }
    for (var pi = 0; pi < provinces.length; pi++) {
      var province = provinces[pi];
      if (province.name.indexOf(keyword) > -1 || province.id.indexOf(kw) > -1) {
        var provinceCityIds = provinceToCitiesMap[province.id] || [];
        var recordedCount = 0;
        for (var pci = 0; pci < provinceCityIds.length; pci++) {
          if (visitedCities.indexOf(provinceCityIds[pci]) > -1) recordedCount++;
        }
        results.push({
          key: 'province:' + province.id,
          id: province.id,
          name: province.name,
          type: 'province',
          typeText: '省份总览',
          provinceName: recordedCount + '/' + provinceCityIds.length + ' 座城市已记录',
          landmark: provinceLandmarks[province.id] || '',
          visited: recordedCount > 0
        });
      }
    }
    this.setData({
      searchKeyword: keyword,
      searchResults: results.slice(0, 20),
      showSearchPanel: true
    });
  },

  onSearchFocus: function() {
    if (this.data.searchResults.length > 0) {
      this.setData({ showSearchPanel: true });
    }
  },

  onSearchBlur: function() {
    var self = this;
    setTimeout(function() {
      self.setData({ showSearchPanel: false });
    }, 200);
  },

  onSearchClear: function() {
    this.setData({ searchKeyword: '', searchResults: [], showSearchPanel: false });
  },

  onSearchResultTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    if (type === 'province') {
      this.setData({ showSearchPanel: false, searchKeyword: '' });
      this.openProvinceOverviewById(id);
      return;
    }
    var cityId = id;
    var city = null;
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) { city = cities[i]; break; }
    }
    if (!city) return;
    audioManager.play('page_navigate');
    this.setData({ showSearchPanel: false, searchKeyword: '' });
    wx.navigateTo({
      url: '/pages/city-detail/city-detail?cityId=' + cityId
    });
  },

  // ===== 下一站推荐 =====
  loadRecommendation: function() {
    var cityGuides = require('../../utils/city-guides.js');
    var guides = cityGuides.cityGuides;
    var guideIds = Object.keys(guides);
    var visitedCities = app.globalData.visitedCities || [];

    // 筛选未打卡的城市
    var unvisited = [];
    for (var i = 0; i < guideIds.length; i++) {
      if (visitedCities.indexOf(guideIds[i]) === -1) {
        var g = guides[guideIds[i]];
        var cityName = '';
        var provinceName = '';
        for (var j = 0; j < cities.length; j++) {
          if (cities[j].id === guideIds[i]) {
            cityName = cities[j].name;
            for (var k = 0; k < provinces.length; k++) {
              if (provinces[k].id === cities[j].provinceId) {
                provinceName = provinces[k].name;
                break;
              }
            }
            break;
          }
        }
        if (cityName) {
          unvisited.push({
            id: guideIds[i],
            name: cityName,
            provinceName: provinceName,
            intro: g.intro,
            bestSeason: g.bestSeason
          });
        }
      }
    }

    if (unvisited.length === 0) {
      this.setData({ recommendation: null });
      return;
    }

    // 随机选一个
    var pick = unvisited[Math.floor(Math.random() * unvisited.length)];
    this.setData({ recommendation: pick });
  },

  onRecommendTap: function() {
    var rec = this.data.recommendation;
    if (!rec) return;
    audioManager.play('page_navigate');
    wx.navigateTo({
      url: '/pages/city-detail/city-detail?cityId=' + rec.id
    });
  },

  refreshRecommendation: function() {
    audioManager.play('button_tap');
    this.loadRecommendation();
  },

  onRecentImageError: function(e) {
    var index = e.currentTarget.dataset.index;
    var recentCities = this.data.recentCities;
    if (recentCities[index]) {
      recentCities[index].photoUrl = '';
      this.setData({ recentCities: recentCities });
    }
  }
});
