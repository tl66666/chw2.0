var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var imageConfig = require('../../utils/image-config.js');
var cloudImage = require('../../utils/cloudImage.js');
var audioManager = require('../../utils/audio-manager.js').getAudioManager();
var achievementsModule = require('../../utils/achievements.js');
var privacy = require('../../utils/privacy.js');
var groupView = require('../../utils/group-view.js');
var photoRecords = require('../../utils/photo-records.js');
var provinceHighlights = require('../../utils/province-highlights.js');

function todayString() {
  var date = new Date();
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

// 城市介绍数据
var cityIntros = {
  beijing: '中国的首都，三千多年历史的古都。故宫、长城、天坛等世界文化遗产汇聚于此，胡同文化与现代都市在这里完美融合。',
  tianjin: '海河之畔的北方明珠，天津之眼、五大道、意式风情区展现着这座城市的独特魅力，狗不理包子和相声文化享誉全国。',
  hebei: '环绕京津的燕赵大地，承德避暑山庄是世界文化遗产，秦皇岛北戴河是著名海滨度假胜地，白洋淀水乡风光令人流连。',
  shanxi: '华夏文明的重要发祥地，云冈石窟、五台山、平遥古城三大世界遗产坐落于此，晋商大院诉说昔日辉煌。',
  neimenggu: '辽阔的草原天堂，呼伦贝尔大草原一望无际，额济纳胡杨林金黄璀璨，成吉思汗陵庄严肃穆。',
  liaoning: '东北老工业基地兼山海胜地，沈阳故宫见证清朝肇始，大连星海广场眺望黄海波涛，丹东鸭绿江断桥铭记历史。',
  jilin: '长白山天池的神秘与壮美令人神往，吉林雾凇是冬日奇观，长春伪满皇宫讲述近代历史。',
  heilongjiang: '中国最北端的冰雪王国，哈尔滨冰雪大世界美轮美奂，北极村漠河可赏极光，五大连池火山地貌独一无二。',
  shanghai: '国际化大都市，东方明珠。外滩的万国建筑群与陆家嘴的摩天大楼交相辉映，城隍庙的小笼包和迪士尼的童话世界展现魔都魅力。',
  jiangsu: '江南水乡的精华所在，南京中山陵庄严肃穆，苏州园林巧夺天工，无锡太湖烟波浩渺，扬州瘦西湖如诗如画。',
  zhejiang: '人间天堂，西湖美景举世闻名。杭州灵隐禅钟、绍兴乌篷船摇橹、宁波天一阁书香、舟山普陀佛光，处处皆诗意。',
  anhui: '黄山奇松怪石云海温泉四绝冠绝天下，宏村西递徽派古村落美如水墨画，合肥包公园承载千年清廉。',
  fujian: '闽南文化的发源地，鼓浪屿琴声悠扬、武夷山九曲溪流、泉州开元寺古塔、永定土楼奇观，山海交融。',
  jiangxi: '红色摇篮与山水画廊，南昌滕王阁千古名篇、庐山瀑布飞流直下、景德镇瓷器名扬四海、婺源油菜花海如梦。',
  shandong: '孔孟之乡，礼仪之邦。泰山五岳独尊、趵突泉天下第一泉、蓬莱仙境海市蜃楼、青岛栈桥红瓦绿树。',
  henan: '中原腹地，华夏之源。洛阳龙门石窟气魄恢宏、登封少林寺武学圣地、开封清明上河园梦回大宋、安阳殷墟甲骨惊世。',
  hubei: '荆楚大地，武汉黄鹤楼千古绝唱、武当山道教圣地仙风道骨、三峡大坝现代奇迹、神农架原始秘境。',
  hunan: '湘楚文化浓厚，张家界砂岩峰林鬼斧神工、长沙橘子洲头伟人足迹、岳阳楼洞庭天下水、凤凰古城边城故事。',
  guangdong: '千年商都，改革开放前沿。广州塔婀娜多姿、深圳速度创造奇迹、潮汕牛肉火锅回味无穷、开平碉楼中西合璧。',
  guangxi: '山水甲天下，桂林漓江如百里画廊、阳朔西街异域风情、北海银滩白沙碧浪、德天瀑布跨国奇观。',
  hainan: '热带海岛天堂，三亚天涯海角浪漫至极、海口骑楼老街南洋风情、蜈支洲岛潜水胜地、文昌航天发射中心探索太空。',
  chongqing: '山城雾都，8D魔幻城市。洪崖洞灯火璀璨如千与千寻、磁器口古镇麻花香、解放碑繁华商圈、长江索道飞跃天堑。',
  sichuan: '天府之国，美食之都。九寨沟水景天堂、峨眉山佛光普照、乐山大佛千年端坐、稻城亚丁蓝色星球最后的净土。',
  guizhou: '山地公园省，黄果树瀑布雷霆万钧、西江千户苗寨万家灯火、梵净山红云金顶、中国天眼FAST探索宇宙。',
  yunnan: '彩云之南，丽江古城浪漫邂逅、大理洱海风花雪月、西双版纳热带雨林、香格里拉世外桃源。',
  xizang: '世界屋脊，心灵的净土。布达拉宫巍峨壮丽、纳木错圣湖湛蓝、珠峰大本营仰望世界之巅、冈仁波齐朝圣之路。',
  shaanxi: '十三朝古都，华夏根脉。西安兵马俑世界奇迹、华山险峻天下第一、黄帝陵华夏始祖、延安宝塔山红色记忆。',
  gansu: '丝绸之路黄金段，敦煌莫高窟壁画飞天、鸣沙山月牙泉沙漠奇观、嘉峪关长城雄关、张掖七彩丹霞如画。',
  qinghai: '三江之源，中华水塔。青海湖碧波万顷、茶卡盐湖天空之镜、塔尔寺藏传佛教圣地、可可西里无人区生命的禁区。',
  ningxia: '塞上江南，西夏王陵神秘莫测、沙坡头黄河与沙漠交汇、镇北堡西部影城电影圣地、贺兰山岩画远古密码。',
  xinjiang: '大美新疆，天山天池如碧玉镶嵌、喀纳斯湖水怪传说、喀什古城异域风情、那拉提草原空中花园。',
  taiwan: '宝岛台湾，台北101耸入云霄、日月潭碧波荡漾、阿里山日出云海、太鲁阁峡谷奇险、夜市小吃令人垂涎。',
  hongkong: '东方之珠，维多利亚港夜景璀璨、太平山顶俯瞰港岛、迪士尼乐园童话世界、旺角街头港味十足。',
  macau: '东方拉斯维加斯，大三巴牌坊中西合璧、澳门旅游塔勇敢者游戏、威尼斯人水城浪漫、葡式蛋挞甜蜜诱人。'
};

// 省份ID到图片文件名的映射（每个省一张）
var provinceToImageFile = {
  beijing: 'beijing.png',
  tianjin: 'tianjin.png',
  hebei: 'hebei.png',
  shanxi: 'shanxi.png',
  neimenggu: 'neimenggu.png',
  liaoning: 'liaoning.png',
  jilin: 'jilin.png',
  heilongjiang: 'heilongjiang.png',
  shanghai: 'shanghai.png',
  jiangsu: 'jiangsu.png',
  zhejiang: 'zhejiang.png',
  anhui: 'anhui.png',
  fujian: 'fujian.png',
  jiangxi: 'jiangxi.png',
  shandong: 'shandong.png',
  henan: 'henan.png',
  hubei: 'hubei.png',
  hunan: 'hunan.png',
  guangdong: 'guangdong.png',
  guangxi: 'guangxi.png',
  hainan: 'hainan.png',
  chongqing: 'chongqing.png',
  sichuan: 'sichuan.png',
  guizhou: 'guizhou.png',
  yunnan: 'yunnan.png',
  xizang: 'xizang.png',
  shaanxi: 'shaanxi.png',
  gansu: 'gansu.png',
  qinghai: 'qinghai.png',
  ningxia: 'ningxia.png',
  xinjiang: 'xinjiang.png',
  taiwan: 'taiwan.png',
  hongkong: 'hongkong.png',
  macau: 'macau.png'
};

// 获取省份对应的CDN图片路径
function getProvinceImagePath(provinceId) {
  return imageConfig.getCityImage(provinceId);
}

Page({
  data: {
    cityId: '',
    cityName: '',
    provinceName: '',
    provinceId: '',
    isProvinceEntry: false,
    landmark: '',
    landmarkList: [],
    cityGuide: null,
    cityImage: '',
    cityIntro: '',
    travelPhotos: [],
    foodPhotos: [],
    note: null,
    isVisited: false,
    activeTab: 'travel',
    photoTravelDate: '',
    groupFootprint: null,
    groupVisitors: [],
    groupSharedPhotos: [],
    groupPhotoCount: 0,
    hasGroup: false,
    loadingGroupFootprint: false,
    groupShareError: '',
    pendingGroupPhotoShare: null,
    syncingGroupPhotos: false,
    showAchievementPopup: false,
    newAchievement: {}
  },

  onLoad: function(options) {
    var cityId = options.cityId;
    var provinceId = options.provinceId;



    this.setData({ photoTravelDate: todayString() });
    if (cityId) {
      this.setData({ isProvinceEntry: false });
      this.loadCityData(cityId);
    } else if (provinceId) {
      this.setData({ isProvinceEntry: true });
      this.loadProvinceData(provinceId);
    }
  },

  loadCityData: function(cityId) {
    var city = null;
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].id === cityId) {
        city = cities[i];
        break;
      }
    }

    if (city) {
      var province = null;
      for (var j = 0; j < provinces.length; j++) {
        if (provinces[j].id === city.provinceId) {
          province = provinces[j];
          break;
        }
      }

      // 先设置基本数据，图片稍后异步加载
      var self = this;
      var cloudPath = getProvinceImagePath(city.provinceId);

      // 解析地标列表
      var landmarkStr = city.landmark || '';
      var landmarkArr = landmarkStr ? landmarkStr.split(/\s*[\/,，、]\s*/).filter(function(s) { return s.trim(); }) : [];

      // 获取城市攻略
      var cityGuidesData = require('../../utils/city-guides.js');
      var guide = cityGuidesData.getCityGuide(city.id);

      this.setData({
        cityId: city.id,
        cityName: city.name,
        provinceName: province ? province.name : '',
        provinceId: city.provinceId,
        landmark: city.landmark || '',
        landmarkList: landmarkArr,
        cityGuide: guide,
        cityImage: '',
        cityIntro: cityIntros[cityId] || ''
      });

      // 直接使用CDN图片URL
      if (cloudPath) {
        self.setData({
          cityImage: cloudPath
        });
      }
    }
  },

  loadProvinceData: function(provinceId) {
    var provinceCities = [];
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].provinceId === provinceId) {
        provinceCities.push(cities[i]);
      }
    }

    var province = null;
    for (var j = 0; j < provinces.length; j++) {
      if (provinces[j].id === provinceId) {
        province = provinces[j];
        break;
      }
    }

    // 获取省份图片路径
    var imagePath = getProvinceImagePath(provinceId);
    var displayCity = null;

    // 攻略优先使用省会，避免城市数组顺序影响省份页面的内容。
    for (var k = 0; k < provinceCities.length; k++) {
      if (province && provinceCities[k].name === province.capital) {
        displayCity = provinceCities[k];
        break;
      }
    }
    if (!displayCity && provinceCities.length > 0) {
      displayCity = provinceCities[0];
    }

    var landmarkArr = provinceHighlights.getProvinceHighlights(provinceId);
    var landmarkStr = landmarkArr.join('、');

    // 获取城市攻略
    var cityGuidesData = require('../../utils/city-guides.js');
    var guide = displayCity ? cityGuidesData.getCityGuide(displayCity.id) : null;

    var self = this;
    this.setData({
      // 地图入口记录的是省份本身，代表城市只用于补充攻略内容。
      cityId: provinceId,
      cityName: province ? province.name : '',
      provinceId: provinceId,
      provinceName: provinceCities.length + ' 座城市',
      cityImage: '',
      landmark: landmarkStr,
      landmarkList: landmarkArr,
      cityGuide: guide
    });

    // 直接使用CDN图片URL
    if (imagePath) {
      self.setData({
        cityImage: imagePath
      });
    }
  },

  checkVisited: function() {
    var cityId = this.data.cityId;
    var visitedCities = app.globalData.visitedCities || [];
    this.setData({
      isVisited: visitedCities.indexOf(cityId) !== -1
    });
  },

  loadPhotos: function() {
    var cityId = this.data.cityId;
    if (!cityId) return;

    // 加载旅游照片
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var travelPhotos = this.normalizePhotoList(cityTravelPhotos[cityId] || []);

    // 加载美食照片
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var foodPhotos = this.normalizePhotoList(cityFoodPhotos[cityId] || []);

    // 兼容旧数据：如果有旧版照片数据，迁移到旅游照片
    var cityPhotos = app.globalData.cityPhotos || {};
    var oldPhotos = this.normalizePhotoList(cityPhotos[cityId] || []);
    if (oldPhotos.length > 0 && travelPhotos.length === 0) {
      travelPhotos = oldPhotos;
      cityTravelPhotos[cityId] = travelPhotos;
      app.globalData.cityTravelPhotos = cityTravelPhotos;
      app.saveData();
    }

    travelPhotos = this.mergePhotoLists(travelPhotos, groupView.getPhotosByCity(cityId, 'travel'));
    foodPhotos = this.mergePhotoLists(foodPhotos, groupView.getPhotosByCity(cityId, 'food'));

    // 加载笔记
    var cityNotes = app.globalData.cityNotes || {};
    var note = cityNotes[cityId] || null;

    // 加载避坑指南
    var cityAvoidTips = app.globalData.cityAvoidTips || {};
    var avoidTip = cityAvoidTips[cityId] || null;

    this.setData({
      travelPhotos: travelPhotos,
      foodPhotos: foodPhotos,
      note: note,
      avoidTip: avoidTip
    });
    this.resolvePhotoDisplayUrls(cityId, travelPhotos, foodPhotos);
  },

  normalizePhotoList: function(list) {
    return (list || []).map(function(item) {
      if (!item || typeof item === 'string') return item;
      if (item.status === 'pending') {
        item.status = 'private';
        item.message = item.message || '图片已保存为仅自己可见';
      }
      if (!item.url && item.fileId) item.url = item.fileId;
      if (!item.fileId && item.url) item.fileId = item.url;
      if (!item.displayUrl && item.localPath) item.displayUrl = item.localPath;
      return item;
    });
  },

  mergePhotoLists: function(localList, groupList) {
    var result = (localList || []).slice();
    var seen = {};
    result.forEach(function(item) {
      var key = typeof item === 'string' ? item : (item.fileId || item.url || item.displayUrl);
      if (key) seen[key] = true;
    });
    (groupList || []).forEach(function(item) {
      var key = item.fileId || item.url || item.displayUrl;
      if (key && !seen[key]) {
        seen[key] = true;
        result.push(item);
      }
    });
    return result;
  },

  isCloudFileId: function(value) {
    return typeof value === 'string' && value.indexOf('cloud://') === 0;
  },

  resolvePhotoDisplayUrls: function(cityId, travelPhotos, foodPhotos) {
    if (!wx.cloud) return;

    var fileList = [];
    var collect = function(list) {
      (list || []).forEach(function(item) {
        var fileId = typeof item === 'string' ? item : (item && (item.fileId || item.url));
        if (fileId && fileId.indexOf('cloud://') === 0 && fileList.indexOf(fileId) === -1) {
          fileList.push(fileId);
        }
      });
    };
    collect(travelPhotos);
    collect(foodPhotos);
    if (fileList.length === 0) return;

    var self = this;
    cloudImage.resolveMany(fileList, function(map) {

      var apply = function(list) {
        return (list || []).map(function(item) {
          if (!item || typeof item === 'string') {
            return map[item] ? { url: item, fileId: item, displayUrl: map[item], status: 'verified' } : item;
          }
          var fileId = item.fileId || item.url;
          if (map[fileId]) item.displayUrl = map[fileId];
          return item;
        });
      };

      self.setData({
        travelPhotos: apply(self.data.travelPhotos),
        foodPhotos: apply(self.data.foodPhotos)
      });
    });
  },

  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  toggleVisit: function() {
    var cityId = this.data.cityId;
    var provinceId = this.data.provinceId;
    var self = this;
    var visitedCities = app.globalData.visitedCities || [];
    var index = visitedCities.indexOf(cityId);

    if (index === -1) {
      // 记录访问日期
      var today = new Date();
      var dateStr = today.getFullYear() + '-' +
                    String(today.getMonth() + 1).padStart(2, '0') + '-' +
                    String(today.getDate()).padStart(2, '0');
      var visitDates = app.globalData.visitDates || {};
      visitDates[cityId] = dateStr;
      app.globalData.visitDates = visitDates;

      // 记录显示名称：省份入口记录省份名，城市搜索记录城市名
      var cityDisplayNames = app.globalData.cityDisplayNames || {};
      if (this.data.isProvinceEntry) {
        var provName = '';
        for (var pi = 0; pi < provinces.length; pi++) {
          if (provinces[pi].id === provinceId) { provName = provinces[pi].name; break; }
        }
        cityDisplayNames[cityId] = provName || this.data.cityName;
      } else {
        cityDisplayNames[cityId] = this.data.cityName;
      }
      app.globalData.cityDisplayNames = cityDisplayNames;

      visitedCities.push(cityId);
      app.globalData.visitedCities = visitedCities;

      // 更新省份列表
      app.globalData.visitedProvinces = app.globalData.visitedProvinces || [];
      if (provinceId && app.globalData.visitedProvinces.indexOf(provinceId) === -1) {
        app.globalData.visitedProvinces.push(provinceId);
      }

      app.saveData();
      app.syncToCloud();
      this.syncCityToCurrentGroup(cityId, provinceId, true);
      this.checkVisited();

      audioManager.play('checkin_success');

      // 检查特殊成就（夜猫子/早鸟/闪电侠）
      this.markTimeAchievementStats();

      // 检查该省份是否是第一次点亮
      var isFirstTimeInProvince = this.checkFirstTimeInProvince(provinceId);

      if (isFirstTimeInProvince) {
        // 延迟后跳转到角色卡解锁页面
        setTimeout(function() {
          wx.navigateTo({
            url: '/package-cards/pages/unlock-card/unlock-card?provinceId=' + provinceId + '&fromMap=true'
          });
        }, 800);
      } else {
        wx.showToast({ title: '已点亮', icon: 'success' });
        this.checkAndShowAchievements();
      }
    } else {
      // 取消打卡前确认
      wx.showModal({
        title: '取消打卡',
        content: '确定要取消 ' + this.data.cityName + ' 的打卡记录吗？该城市的打卡状态将被移除。',
        confirmColor: '#F87171',
        confirmText: '取消打卡',
        cancelText: '再想想',
        success: function(res) {
          if (!res.confirm) return;
          self.doCancelVisit(cityId, provinceId, visitedCities, index);
        }
      });
    }
  },

  doCancelVisit: function(cityId, provinceId, visitedCities, index) {
    var self = this;
    visitedCities.splice(index, 1);
    app.globalData.visitedCities = visitedCities;

    // 移除访问日期
    var visitDates2 = app.globalData.visitDates || {};
    delete visitDates2[cityId];
    app.globalData.visitDates = visitDates2;

    // 移除显示名称
    var displayNames = app.globalData.cityDisplayNames || {};
    delete displayNames[cityId];
    app.globalData.cityDisplayNames = displayNames;

    // 重新计算省份
    var citiesData = require('../../utils/cities.js');
    var allCities = citiesData.cities || [];
    var stillHasProv = visitedCities.indexOf(provinceId) > -1;
    for (var ci = 0; ci < allCities.length; ci++) {
      if (allCities[ci].provinceId === provinceId &&
          visitedCities.indexOf(allCities[ci].id) > -1) {
        stillHasProv = true;
        break;
      }
    }
    if (!stillHasProv) {
      app.globalData.visitedProvinces = app.globalData.visitedProvinces || [];
      var provIdx = app.globalData.visitedProvinces.indexOf(provinceId);
      if (provIdx > -1) app.globalData.visitedProvinces.splice(provIdx, 1);
    }

    app.saveData();

    // 删除云端记录（防止syncFromCloud恢复数据）
    // 本地模式（useCloud=false）跳过云端删除，避免云函数超时卡顿
    if (app.globalData.useCloud && wx.cloud && app.globalData.isLogin) {
      wx.cloud.callFunction({
        name: 'syncData',
        data: {
          action: 'removeCityRecord',
          data: { cityId: cityId }
        },
        timeout: 20000
      }).then(function(res) {
        console.log('[toggleVisit] 云端记录已删除', res.result);
      }).catch(function(err) {
        console.warn('[toggleVisit] 云端删除失败:', err);
      });
    }

    this.syncCityToCurrentGroup(cityId, provinceId, false);
    this.checkVisited();
    wx.showToast({ title: '已取消打卡', icon: 'success' });
  },

  checkFirstTimeInProvince: function(provinceId) {
    var visitedCities = app.globalData.visitedCities || [];
    if (visitedCities.indexOf(provinceId) !== -1) return true;
    var citiesData = require('../../utils/cities.js');
    var cities = citiesData.cities;

    var count = 0;
    for (var i = 0; i < cities.length; i++) {
      if (cities[i].provinceId === provinceId && visitedCities.indexOf(cities[i].id) !== -1) {
        count++;
      }
    }

    // 如果只有当前这一个城市被点亮，说明是第一次
    return count === 1;
  },

  // 检查时间类特殊成就
  markTimeAchievementStats: function() {
    var app = getApp();
    var hour = new Date().getHours();
    var todayStr = new Date().toISOString().slice(0, 10);
    var todayVisits = wx.getStorageSync('todayVisits') || {};

    // 夜猫子成就
    if (hour >= 0 && hour < 5 && !app.globalData.nightVisit) {
      app.globalData.nightVisit = true;
      wx.setStorageSync('nightVisit', true);
    }
    // 早鸟成就
    if (hour >= 5 && hour < 8 && !app.globalData.earlyVisit) {
      app.globalData.earlyVisit = true;
      wx.setStorageSync('earlyVisit', true);
    }
    // 闪电侠成就计数
    if (!todayVisits.date || todayVisits.date !== todayStr) {
      todayVisits = { date: todayStr, count: 1 };
      app.globalData.dailyVisit = 1;
    } else {
      todayVisits.count++;
      app.globalData.dailyVisit = todayVisits.count;
    }
    wx.setStorageSync('todayVisits', todayVisits);

  },

  checkAndShowAchievements: function() {
    var self = this;
    var stats = this.getStatsForAchievement();
    var unlockedIds = wx.getStorageSync('unlockedAchievements') || [];
    var newList = achievementsModule.checkNewAchievements(stats, unlockedIds);
    if (newList.length === 0) return;

    newList.forEach(function(ach) {
      if (unlockedIds.indexOf(ach.id) === -1) unlockedIds.push(ach.id);
    });
    try { wx.setStorageSync('unlockedAchievements', unlockedIds); } catch (e) {}

    audioManager.play('achievement_unlock');
    var idx = 0;
    var showNext = function() {
      if (idx >= newList.length) {
        self.setData({ showAchievementPopup: false });
        return;
      }
      self.setData({
        showAchievementPopup: true,
        newAchievement: newList[idx]
      });
      idx++;
      setTimeout(showNext, 2600);
    };
    showNext();
  },

  closeAchievementPopup: function() {
    this.setData({ showAchievementPopup: false });
  },

  getStatsForAchievement: function() {
    var app = getApp();
    var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var photoCount = 0, foodPhotoCount = 0;
    Object.keys(cityTravelPhotos).forEach(function(k) { photoCount += cityTravelPhotos[k].length; });
    Object.keys(cityFoodPhotos).forEach(function(k) {
      foodPhotoCount += cityFoodPhotos[k].length;
      photoCount += cityFoodPhotos[k].length;
    });
    return {
      visitedCount: (app.globalData.visitedCities || []).length,
      visitedProvinces: (app.globalData.visitedProvinces || []).length,
      photoCount: photoCount,
      foodPhotoCount: foodPhotoCount,
      ssrCount: app.globalData.ssrCount || 0,
      urCount: app.globalData.urCount || 0,
      cardCount: app.globalData.cardCount || 0,
      nightVisit: app.globalData.nightVisit,
      earlyVisit: app.globalData.earlyVisit,
      dailyVisit: app.globalData.dailyVisit || 0,
      shareCount: app.globalData.shareCount || 0,
      noteCount: app.globalData.noteCount || 0,
      weekStreak: app.globalData.weekStreak || 0,
      monthStreak: app.globalData.monthStreak || 0,
      hasAllRarity: app.globalData.hasAllRarity || false
    };
  },

  addPhoto: function() {
    var self = this;
    privacy.ensure(this, function() {
      self.addPhotoAfterPrivacy();
    });
  },

  addPhotoAfterPrivacy: function() {
    var cityId = this.data.cityId;
    var provinceId = this.data.provinceId;
    var activeTab = this.data.activeTab;
    var isVisited = this.data.isVisited;
    var self = this;

    // 如果城市未打卡，先引导用户打卡（触发抽卡动画）
    if (!isVisited) {
      wx.showModal({
        title: '先打卡再上传',
        content: '上传足迹前需要先点亮这座城市，打卡后可解锁专属角色卡！',
        confirmText: '立即打卡',
        cancelText: '取消',
        success: function(res) {
          if (res.confirm) {
            // 执行打卡逻辑
            self.performCheckIn(cityId, provinceId, function() {
              // 打卡完成后继续上传照片
              self.doUploadPhoto(cityId, activeTab);
            });
          }
        }
      });
      return;
    }

    // 已打卡，直接上传
    this.doUploadPhoto(cityId, activeTab);
  },

  // 执行打卡逻辑（带抽卡动画）
  performCheckIn: function(cityId, provinceId, callback) {
    var self = this;
    var visitedCities = app.globalData.visitedCities || [];

    if (visitedCities.indexOf(cityId) === -1) {
      // 记录访问日期
      var today = new Date();
      var dateStr = today.getFullYear() + '-' +
                    String(today.getMonth() + 1).padStart(2, '0') + '-' +
                    String(today.getDate()).padStart(2, '0');
      var visitDates = app.globalData.visitDates || {};
      visitDates[cityId] = dateStr;
      app.globalData.visitDates = visitDates;

      visitedCities.push(cityId);
      app.globalData.visitedCities = visitedCities;
      app.saveData();
      app.syncToCloud();
      this.syncCityToCurrentGroup(cityId, provinceId, true);
      this.checkVisited();

      // 检查该省份是否是第一次点亮
      var isFirstTimeInProvince = this.checkFirstTimeInProvince(provinceId);

      if (isFirstTimeInProvince) {
        // 先显示打卡成功，再跳转抽卡页面
        wx.showToast({
          title: '打卡成功！',
          icon: 'success',
          duration: 800
        });

        // 延迟后跳转到角色卡解锁页面（带抽卡动画）
        setTimeout(function() {
          wx.navigateTo({
            url: '/package-cards/pages/unlock-card/unlock-card?provinceId=' + provinceId + '&fromMap=true',
            success: function() {
              // 抽卡页面返回后执行回调（上传照片）
              if (callback) {
                // 使用事件监听或全局标志来在返回后执行上传
                app.globalData._pendingUpload = {
                  cityId: cityId,
                  activeTab: self.data.activeTab
                };
              }
            }
          });
        }, 450);
      } else {
        wx.showToast({ title: '已点亮', icon: 'success' });
        if (callback) callback();
      }
    } else {
      if (callback) callback();
    }
  },

  // 实际上传照片的方法
  doUploadPhoto: function(cityId, activeTab) {
    var self = this;

    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempFiles = res.tempFilePaths || [];
        if (tempFiles.length === 0) return;

        var localPhotos = self.wrapLocalPhotos(tempFiles);
        self.saveCityPhotos(cityId, activeTab, localPhotos, false, { skipGroupShare: true, silent: true });
        wx.showToast({ title: '已加入相册', icon: 'success' });

        if (app.globalData.useCloud && wx.cloud) {
          self.uploadAndCheckPhotos(tempFiles, 0, [], function(pass, photos) {
            if (!pass || photos.length === 0) {
              self.setData({ securityErrorMessage: '' });
              return;
            }
            self.replaceLocalCityPhotos(cityId, activeTab, tempFiles);
            self.saveCityPhotos(cityId, activeTab, photos, false);
          });
          return;
        }
      }
    });
  },

  wrapLocalPhotos: function(paths) {
    return (paths || []).map(function(path) {
      return {
        url: path,
        fileId: path,
        status: 'local',
        createTime: Date.now()
      };
    });
  },

  replaceLocalCityPhotos: function(cityId, activeTab, localPaths) {
    var target = activeTab === 'food' ? app.globalData.cityFoodPhotos : app.globalData.cityTravelPhotos;
    if (!target || !target[cityId]) return;

    var pending = {};
    (localPaths || []).forEach(function(path) { pending[path] = true; });
    target[cityId] = target[cityId].filter(function(photo) {
      return !pending[photoRecords.getFileId(photo)];
    });
    app.saveData();
    this.loadPhotos();
  },

  uploadAndCheckPhotos: function(files, index, safePhotos, callback) {
    var self = this;
    if (index >= files.length) {
      callback(true, safePhotos);
      return;
    }

    var filePath = files[index];
    var extMatch = filePath.match(/\.[^.]+$/);
    var fs = wx.getFileSystemManager();
    var savePath = wx.env.USER_DATA_PATH + '/checkin_' + this.data.cityId + '_' + Date.now() + '_' + index + (extMatch ? extMatch[0] : '.jpg');

    fs.saveFile({
      tempFilePath: filePath,
      filePath: savePath,
      success: function(res) {
        safePhotos.push(self.buildPhotoItem(res.savedFilePath, 'verified', '', filePath));
        self.uploadAndCheckPhotos(files, index + 1, safePhotos, callback);
      },
      fail: function(err) {
        console.error('本地保存失败:', err);
        self.setData({
          securityErrorMessage: '图片保存失败'
        });
        callback(false, safePhotos);
      }
    });
  },

  reviewUploadedPhotoInBackground: function(fileID, cityId, activeTab) {
    // 本地模式无需云端审核
    return;
  },

  removeBlockedPhoto: function(fileID, cityId, activeTab) {
    var target = activeTab === 'food' ? app.globalData.cityFoodPhotos : app.globalData.cityTravelPhotos;
    if (target && target[cityId]) {
      target[cityId] = target[cityId].filter(function(photo) {
        return photoRecords.getFileId(photo) !== fileID;
      });
    }
    if (app.markPhotoDeleted) app.markPhotoDeleted(fileID);
    app.saveData();
    app.syncToCloud();
    this.loadPhotos();

    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'removeSharedPhoto', data: { fileId: fileID } },
      timeout: 10000
    }).then(function() {
      if (app.refreshGroupCache) app.refreshGroupCache();
    }).catch(function(err) {
      console.warn('[photo-review] blocked photo removal deferred:', err);
    });
  },

  buildPhotoItem: function(fileID, status, message, localPath) {
    return {
      url: fileID,
      fileId: fileID,
      displayUrl: localPath || fileID,
      localPath: localPath || '',
      status: status || 'verified',
      message: message || '',
      createTime: Date.now()
    };
  },

  getSecurityMessage: function(result, fallback) {
    result = result || {};
    if (result.blocked) {
      return '图片未通过安全校验，请更换后再试';
    }
    if (result.retryable || result.checked === false) {
      return '图片暂时无法同步，请稍后再试';
    }
    var raw = String(result.errMsg || result.message || result.error || '');
    if (raw.indexOf('-504003') !== -1 || raw.indexOf('FUNCTIONS_TIME_LIMIT') !== -1 || raw.indexOf('timed out') !== -1) {
      return '图片暂时无法同步，请稍后再试';
    }
    return fallback || '图片暂时无法同步，请稍后再试';
  },

  saveCityPhotos: function(cityId, activeTab, photos, shouldHideLoading, options) {
    var self = this;
    options = options || {};

    if (activeTab === 'travel') {
      var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
      var existingTravelPhotos = cityTravelPhotos[cityId] || [];
      cityTravelPhotos[cityId] = existingTravelPhotos.concat(photos);
      app.globalData.cityTravelPhotos = cityTravelPhotos;
    } else {
      var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
      var existingFoodPhotos = cityFoodPhotos[cityId] || [];
      cityFoodPhotos[cityId] = existingFoodPhotos.concat(photos);
      app.globalData.cityFoodPhotos = cityFoodPhotos;
    }

    app.saveData();
    app.syncToCloud();
    this.setData({ securityErrorMessage: '' });

    if (options.skipGroupShare) {
      this.loadPhotos();
      if (!options.silent) wx.showToast({ title: '添加成功', icon: 'success' });
      return;
    }

    var groupShareCandidates = photoRecords.splitGroupSharePhotos(photos);
    var verifiedPhotos = groupShareCandidates.shareable;
    this.sharePhotosToCurrentGroup(cityId, activeTab, verifiedPhotos, function(result) {
      if (shouldHideLoading) wx.hideLoading();
      var didSync = result && result.synced > 0;
      var failedPhotos = ((result && result.failed) || []).concat(groupShareCandidates.blocked || []);
      self.queueFailedGroupPhotos(result && result.groupId, failedPhotos, cityId, activeTab);
      var failedCount = failedPhotos.length;
      var firstFailure = failedCount > 0 ? failedPhotos[0] : null;
      var failureReason = firstFailure && firstFailure.reason ? firstFailure.reason : '请稍后再试';
      self.setData({
        groupShareError: failedCount > 0 ? '照片已保存到个人相册，群相册未同步：' + failureReason : '',
        pendingGroupPhotoShare: failedCount > 0 && verifiedPhotos.length > 0 ? {
          cityId: cityId,
          activeTab: activeTab,
          photos: verifiedPhotos
        } : null,
        syncingGroupPhotos: false
      });
      self.loadPhotos();
      self.loadGroupFootprint();
      if (didSync && app.refreshGroupCache) {
        app.refreshGroupCache(function() {
          self.loadGroupFootprint();
        });
      }
      if (!options.silent) wx.showToast({ title: '添加成功', icon: 'success' });
    });
  },

  queueFailedGroupPhotos: function(groupId, photos, cityId, activeTab) {
    if (!groupId || !app.queuePendingGroupPhotoReview) return;

    (photos || []).forEach(function(photo) {
      var fileId = photoRecords.getFileId(photo);
      if (!fileId || fileId.indexOf('cloud://') !== 0) return;
      app.queuePendingGroupPhotoReview({
        groupId: groupId,
        fileId: fileId,
        cityId: cityId,
        cityName: this.data.cityName || '',
        provinceId: this.data.provinceId || '',
        type: activeTab,
        travelDate: this.data.photoTravelDate || todayString()
      });
    }, this);
  },

  getPhotoUrl: function(photo) {
    if (!photo) return '';
    return typeof photo === 'string' ? photo : (photo.displayUrl || photo.url || photo.fileId || '');
  },

  getVerifiedPhotoUrls: function(photos) {
    return (photos || []).filter(function(item) {
      return typeof item === 'string' || item.status === 'verified' || item.status === 'local';
    }).map(function(item) {
      // `displayUrl` is only a local preview path. Group records must store the durable cloud file ID.
      return typeof item === 'string' ? item : (item.fileId || item.url || item.displayUrl || '');
    }).filter(Boolean);
  },

  onPhotoTravelDateChange: function(e) {
    this.setData({ photoTravelDate: e.detail.value || todayString() });
  },

  resolveCloudGroupForPhotoShare: function(done) {
    if (!wx.cloud) {
      done(null, '云开发未初始化，请重新进入小程序后再试');
      return;
    }

    wx.cloud.callFunction({
      name: 'group',
      data: { action: 'getMyGroup' },
      timeout: 10000
    }).then(function(res) {
      var result = res.result || {};
      if (result.success && result.groupInfo && result.groupInfo.id) {
        wx.setStorageSync('myGroup', JSON.stringify(result));
        done(result);
        return;
      }
      done(null, '暂时无法获取群组信息，请稍后再试');
    }).catch(function(err) {
      done(null, '暂时无法获取群组信息，请稍后再试');
    });
  },

  getGroupShareFailureReason: function(result) {
    var code = String((result && result.error) || '');
    if (code === 'UNKNOWN_ACTION') return '群相册暂时不可用，请稍后再试';
    if (code === 'NOT_A_MEMBER') return '当前微信账号不是这个群的成员，请重新进入群组';
    if (code === 'INVALID_FILE_ID') return '照片尚未完成云端上传，请稍后重新同步';
    return '群相册暂时未同步，请稍后再试';
  },

  sharePhotosToCurrentGroup: function(cityId, activeTab, photos, done) {
    var self = this;
    this.resolveCloudGroupForPhotoShare(function(groupData, failureReason) {
      if (!groupData || !groupData.groupInfo || !groupData.groupInfo.id) {
        done({
          synced: 0,
          failed: [{ fileId: '', reason: failureReason || '未识别到当前云端群组' }]
        });
        return;
      }
      self.sharePhotosToResolvedGroup(groupData, cityId, activeTab, photos, done);
    });
  },

  sharePhotosToResolvedGroup: function(groupData, cityId, activeTab, photos, done) {
    var page = this;
    var cityName = this.data.cityName || '';
    var provinceId = this.data.provinceId || '';
    var travelDate = this.data.photoTravelDate || todayString();
    var index = 0;
    var synced = 0;
    var failed = [];

    function cacheSharedPhoto(fileId, photoId) {
      var sharedPhotos = groupData.sharedPhotos || [];
      var exists = sharedPhotos.some(function(photo) {
        return photo && photo.groupId === groupData.groupInfo.id && photo.fileId === fileId;
      });
      if (!exists) {
        sharedPhotos.unshift({
          id: photoId || '',
          groupId: groupData.groupInfo.id,
          fileId: fileId,
          url: fileId,
          cityId: cityId,
          cityName: cityName,
          provinceId: provinceId,
          type: activeTab,
          travelDate: travelDate,
          userName: (app.globalData.userInfo || {}).nickName || '微信用户',
          userAvatar: (app.globalData.userInfo || {}).avatarUrl || '/images/avatar.jpg',
          createTime: Date.now()
        });
        groupData.sharedPhotos = sharedPhotos;
        wx.setStorageSync('myGroup', JSON.stringify(groupData));
      }
    }

    this.setData({ syncingGroupPhotos: true, groupShareError: '' });

    function next() {
      if (index >= photos.length) {
        done({ synced: synced, failed: failed, groupId: groupData.groupInfo.id });
        return;
      }

      var fileID = photos[index++];
      if (!fileID || fileID.indexOf('cloud://') !== 0) {
        failed.push({ fileId: fileID || '', reason: '照片尚未完成云端上传' });
        next();
        return;
      }
      wx.cloud.callFunction({
        name: 'group',
        data: {
          action: 'sharePhoto',
          data: {
            groupId: groupData.groupInfo.id,
            fileId: fileID,
            url: fileID,
            cityId: cityId,
            cityName: cityName,
            provinceId: provinceId,
            type: activeTab,
            travelDate: travelDate
          }
        },
        timeout: 10000
      }).then(function(res) {
        var result = res.result || {};
        if (result.success) {
          synced += 1;
          cacheSharedPhoto(fileID, result.photoId);
        } else {
          console.warn('[group-photo] sharePhoto rejected:', result.error || result.message || 'UNKNOWN');
          failed.push({ fileId: fileID, reason: page.getGroupShareFailureReason(result) });
        }
        next();
      }).catch(function(err) {
        console.error('[group-photo] sharePhoto request failed:', err);
        failed.push({
          fileId: fileID,
          reason: (err && (err.errMsg || err.message)) || '群相册网络请求失败'
        });
        next();
      });
    }
    next();
  },

  retryGroupPhotoShare: function() {
    var pending = this.data.pendingGroupPhotoShare;
    if (!pending || !pending.photos || pending.photos.length === 0) return;

    var self = this;
    wx.showLoading({ title: '正在同步群相册' });
    this.sharePhotosToCurrentGroup(pending.cityId, pending.activeTab, pending.photos, function(result) {
      wx.hideLoading();
      var failedCount = result && result.failed ? result.failed.length : 0;
      var firstFailure = failedCount > 0 ? result.failed[0] : null;
      var failureReason = firstFailure && firstFailure.reason ? firstFailure.reason : '请稍后再试';
      self.setData({
        groupShareError: failedCount > 0 ? '群相册仍未同步：' + failureReason : '',
        pendingGroupPhotoShare: failedCount > 0 ? pending : null,
        syncingGroupPhotos: false
      });
      if (result && result.synced > 0 && app.refreshGroupCache) {
        app.refreshGroupCache(function() {
          self.loadGroupFootprint();
        });
      }
      if (failedCount === 0) {
        self.loadGroupFootprint();
        wx.showToast({ title: '已同步到群相册', icon: 'success' });
      }
    });
  },

  syncCityToCurrentGroup: function(cityId, provinceId, isVisited) {
    var localGroup = wx.getStorageSync('myGroup');
    if (!localGroup || !wx.cloud) return;

    var groupData = null;
    try {
      groupData = typeof localGroup === 'string' ? JSON.parse(localGroup) : localGroup;
    } catch (e) {}

    if (!groupData || !groupData.groupInfo || !groupData.groupInfo.id) return;

    var userInfo = app.globalData.userInfo || {};
    var self = this;
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'syncCityRecord',
        data: {
          groupId: groupData.groupInfo.id,
          cityId: cityId,
          cityName: this.data.cityName || cityId,
          provinceId: provinceId || this.data.provinceId || '',
          isVisited: isVisited,
          userInfo: {
            nickName: userInfo.nickName || '微信用户',
            avatarUrl: userInfo.avatarUrl || '/images/avatar.jpg'
          }
        }
      },
      timeout: 8000
    }).then(function(res) {
      var result = res.result || {};
      if (!result.success) {
        console.warn('[group] city sync rejected:', result.error || 'CITY_SYNC_FAILED');
        return;
      }

      if (result.city) self.cacheGroupCitySync(groupData, result.city);
      self.loadGroupFootprint();
      if (app.refreshGroupCache) app.refreshGroupCache();
    }).catch(function(err) {
      console.warn('[group] city sync request failed:', err);
    });
  },

  cacheGroupCitySync: function(groupData, city) {
    if (!groupData || !groupData.groupInfo || !city || !city.cityId || !city.isVisited) return;

    var cities = groupData.groupCities || [];
    var exists = false;
    for (var i = 0; i < cities.length; i++) {
      if ((cities[i].cityId || cities[i].id) === city.cityId) {
        cities[i].cityName = city.cityName || cities[i].cityName || city.cityId;
        cities[i].provinceId = city.provinceId || cities[i].provinceId || '';
        cities[i].updateTime = city.updateTime || cities[i].updateTime || '';
        exists = true;
        break;
      }
    }

    if (!exists) {
      cities.unshift({
        id: city.cityId,
        cityId: city.cityId,
        cityName: city.cityName || city.cityId,
        provinceId: city.provinceId || '',
        memberCount: 1,
        users: [],
        updateTime: city.updateTime || ''
      });
      groupData.groupCities = cities;
      groupData.stats = groupData.stats || {};
      groupData.stats.totalCities = cities.length;
      var provinceMap = {};
      for (var j = 0; j < cities.length; j++) {
        if (cities[j].provinceId) provinceMap[cities[j].provinceId] = true;
      }
      groupData.stats.totalProvinces = Object.keys(provinceMap).length;
    }

    wx.setStorageSync('myGroup', JSON.stringify(groupData));
  },

  loadGroupFootprint: function() {
    var cityId = this.data.cityId;
    var localGroup = wx.getStorageSync('myGroup');
    if (!cityId || !localGroup || !wx.cloud) {
      this.setData({
        hasGroup: false,
        groupFootprint: null,
        groupVisitors: [],
        groupSharedPhotos: [],
        groupPhotoCount: 0,
        loadingGroupFootprint: false
      });
      return;
    }

    var groupData = null;
    try {
      groupData = typeof localGroup === 'string' ? JSON.parse(localGroup) : localGroup;
    } catch (e) {}

    if (!groupData || !groupData.groupInfo || !groupData.groupInfo.id) {
      this.setData({
        hasGroup: false,
        groupFootprint: null,
        groupVisitors: [],
        groupSharedPhotos: [],
        groupPhotoCount: 0,
        loadingGroupFootprint: false
      });
      return;
    }

    this.applyGroupFootprint(groupData);
    this.setData({ hasGroup: true, loadingGroupFootprint: true });

    var self = this;
    wx.cloud.callFunction({
      name: 'group',
      data: {
        action: 'getCityFootprint',
        data: {
          groupId: groupData.groupInfo.id,
          cityId: cityId
        }
      },
      timeout: 10000
    }).then(function(res) {
      var result = res.result || {};
      if (result.success) {
        self.setData({
          hasGroup: true,
          groupFootprint: result.city || null,
          groupVisitors: result.visitors || [],
          groupSharedPhotos: result.photos || [],
          groupPhotoCount: result.photoCount || ((result.photos || []).length),
          loadingGroupFootprint: false
        });
        self.resolveGroupPhotoDisplayUrls(result.photos || []);
        self.appendGroupPhotosToTabs(result.photos || []);
      } else {
        self.setData({ loadingGroupFootprint: false });
      }
    }).catch(function() {
      self.setData({ loadingGroupFootprint: false });
    });
  },

  applyGroupFootprint: function(groupData) {
    var cityId = this.data.cityId;
    var groupCities = groupData.groupCities || [];
    var sharedPhotos = groupData.sharedPhotos || [];
    var city = null;
    for (var i = 0; i < groupCities.length; i++) {
      if (groupCities[i].cityId === cityId || groupCities[i].id === cityId) {
        city = groupCities[i];
        break;
      }
    }

    var photos = [];
    for (var j = 0; j < sharedPhotos.length; j++) {
      if (sharedPhotos[j].cityId === cityId) photos.push(sharedPhotos[j]);
    }

    this.setData({
      hasGroup: true,
      groupFootprint: city,
      groupVisitors: city && city.users ? city.users : [],
      groupSharedPhotos: photos,
      groupPhotoCount: photos.length
    });
    this.resolveGroupPhotoDisplayUrls(photos);
  },

  resolveGroupPhotoDisplayUrls: function(photos) {
    if (!wx.cloud || !photos || photos.length === 0) return;
    var fileList = [];
    photos.forEach(function(item) {
      var fileId = item && (item.fileId || item.url);
      if (fileId && fileId.indexOf('cloud://') === 0 && fileList.indexOf(fileId) === -1) {
        fileList.push(fileId);
      }
    });
    if (fileList.length === 0) return;

    var self = this;
    cloudImage.resolveMany(fileList, function(map) {
      var nextPhotos = (self.data.groupSharedPhotos || []).map(function(item) {
        var fileId = item && (item.fileId || item.url);
        if (fileId && map[fileId]) item.displayUrl = map[fileId];
        return item;
      });
      self.setData({ groupSharedPhotos: nextPhotos });
      self.appendGroupPhotosToTabs(nextPhotos);
    });
  },

  appendGroupPhotosToTabs: function(photos) {
    var travel = [];
    var food = [];
    (photos || []).forEach(function(item) {
      var next = {
        url: item.url || item.fileId || '',
        fileId: item.fileId || item.url || '',
        displayUrl: item.displayUrl || '',
        status: 'group',
        message: '来自群组共享',
        type: item.type || 'travel',
        userName: item.userName || item.nickName || '群友',
        userAvatar: item.userAvatar || item.avatarUrl || '/images/avatar.jpg',
        createTime: item.createTime || Date.now()
      };
      if (next.type === 'food') food.push(next);
      else travel.push(next);
    });
    this.setData({
      travelPhotos: this.mergePhotoLists(this.data.travelPhotos, travel),
      foodPhotos: this.mergePhotoLists(this.data.foodPhotos, food)
    });
  },

  // 页面显示时检查是否有待上传的照片（从抽卡页面返回后）
  onShow: function() {
    var self = this;
    this.loadPhotos();
    this.checkVisited();
    this.loadGroupFootprint();
    if (app.refreshGroupCache) {
      app.refreshGroupCache(function(updated) {
        if (updated) {
          self.loadPhotos();
          self.loadGroupFootprint();
        }
      });
    }

    // 检查是否有从抽卡页面返回后待上传的照片
    var pendingUpload = app.globalData._pendingUpload;
    if (pendingUpload) {
      var cityId = pendingUpload.cityId;
      var activeTab = pendingUpload.activeTab;
      // 清除待上传标记
      app.globalData._pendingUpload = null;

      // 如果当前页面就是对应城市，直接上传
      if (cityId === this.data.cityId) {
        this.doUploadPhoto(cityId, activeTab);
      }
    }
  },

  previewGroupPhoto: function(e) {
    var index = e.currentTarget.dataset.index || 0;
    var photos = this.data.groupSharedPhotos || [];
    var urls = [];
    for (var i = 0; i < photos.length; i++) {
      var photoUrl = this.getPhotoUrl(photos[i]);
      if (photoUrl) urls.push(photoUrl);
    }
    if (urls.length === 0) return;
    wx.previewImage({
      current: urls[index] || urls[0],
      urls: urls
    });
  },

  previewPhoto: function(e) {
    var url = e.currentTarget.dataset.url;
    var activeTab = this.data.activeTab;
    var photos = activeTab === 'travel' ? this.data.travelPhotos : this.data.foodPhotos;
    var urls = [];
    for (var i = 0; i < photos.length; i++) {
      var photoUrl = this.getPhotoUrl(photos[i]);
      if (photoUrl) urls.push(photoUrl);
    }
    var current = this.getPhotoUrl(photos[e.currentTarget.dataset.index]) || url;

    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  deletePhoto: function(e) {
    var index = e.currentTarget.dataset.index;
    var cityId = this.data.cityId;
    var activeTab = this.data.activeTab;
    var self = this;

    wx.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？云端记录也会一并删除。',
      success: function(res) {
        if (res.confirm) {
          var deletedFileId = '';

          if (activeTab === 'travel') {
            var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
            var photos = cityTravelPhotos[cityId] || [];
            deletedFileId = photoRecords.getFileId(photos[index]);
            photos.splice(index, 1);
            cityTravelPhotos[cityId] = photos;
            app.globalData.cityTravelPhotos = cityTravelPhotos;
          } else {
            var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
            var photos = cityFoodPhotos[cityId] || [];
            deletedFileId = photoRecords.getFileId(photos[index]);
            photos.splice(index, 1);
            cityFoodPhotos[cityId] = photos;
            app.globalData.cityFoodPhotos = cityFoodPhotos;
          }

          if (app.markPhotoDeleted) app.markPhotoDeleted(deletedFileId);
          app.saveData();

          // 删除云端照片记录（防止syncFromCloud恢复数据）
          // 本地模式（useCloud=false）跳过云端删除，避免云函数超时卡顿
          if (app.globalData.useCloud && wx.cloud && app.globalData.isLogin && deletedFileId) {
            wx.cloud.callFunction({
              name: 'syncData',
              data: {
                action: 'removePhoto',
                data: {
                  cityId: cityId,
                  fileId: deletedFileId
                }
              },
              timeout: 8000
            }).then(function(res) {
              console.log('[deletePhoto] 云端照片记录已删除', res.result);
            }).catch(function(err) {
              console.warn('[deletePhoto] 云端删除失败:', err);
            });
          }

          self.loadPhotos();

          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  onNoteInput: function(e) {
    this.setData({
      note: e.detail.value
    });
  },

  saveNote: function() {
    var self = this;
    privacy.ensure(this, function() {
      self.saveNoteAfterPrivacy();
    });
  },

  saveNoteAfterPrivacy: function() {
    var cityId = this.data.cityId;
    var note = this.data.note || '';
    var self = this;

    if (app.globalData.useCloud && wx.cloud && note.trim()) {
      wx.showLoading({ title: '安全校验中...' });
      wx.cloud.callFunction({
        name: 'contentSecurity',
        data: {
          action: 'checkText',
          content: note
        },
        timeout: 15000
      }).then(function(res) {
        wx.hideLoading();
        if (res.result && res.result.pass === false) {
          wx.showToast({ title: self.getSecurityMessage(res.result, '内容安全校验失败'), icon: 'none' });
          return;
        }
        self.commitNote(cityId, note);
      }).catch(function() {
        wx.hideLoading();
        wx.showToast({ title: '安全校验服务暂时不可用', icon: 'none' });
      });
      return;
    }

    this.commitNote(cityId, note);
  },

  onPrivacyAgree: function() {
    privacy.handleAgree(this);
  },

  onPrivacyReject: function() {
    privacy.handleReject(this);
  },

  commitNote: function(cityId, note) {
    var cityNotes = app.globalData.cityNotes || {};
    cityNotes[cityId] = note;
    app.globalData.cityNotes = cityNotes;
    app.saveData();
    app.syncToCloud();

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  deleteNote: function() {
    var cityId = this.data.cityId;
    var self = this;

    wx.showModal({
      title: '删除笔记',
      content: '确定要删除这篇旅行笔记吗？',
      confirmColor: '#F87171',
      success: function(res) {
        if (res.confirm) {
          var cityNotes = app.globalData.cityNotes || {};
          delete cityNotes[cityId];
          app.globalData.cityNotes = cityNotes;
          app.saveData();

          // 删除云端笔记
          // 本地模式（useCloud=false）跳过云端删除，避免云函数超时卡顿
          if (app.globalData.useCloud && wx.cloud && app.globalData.isLogin) {
            wx.cloud.callFunction({
              name: 'syncData',
              data: {
                action: 'removeNote',
                data: { cityId: cityId }
              },
              timeout: 8000
            }).then(function(res) {
              console.log('[deleteNote] 云端笔记已删除', res.result);
            }).catch(function(err) {
              console.warn('[deleteNote] 云端删除失败:', err);
            });
          }

          self.setData({ note: '' });
          wx.showToast({ title: '笔记已删除', icon: 'success' });
        }
      }
    });
  },

  // ===== 避坑指南 =====
  onAvoidTipInput: function(e) {
    this.setData({ avoidTip: e.detail.value });
  },

  saveAvoidTip: function() {
    var self = this;
    privacy.ensure(this, function() {
      self.saveAvoidTipAfterPrivacy();
    });
  },

  saveAvoidTipAfterPrivacy: function() {
    var cityId = this.data.cityId;
    var avoidTip = this.data.avoidTip;

    if (!avoidTip || !avoidTip.trim()) {
      this.commitAvoidTip(cityId, '');
      return;
    }

    var self = this;
    // 本地模式直接保存
    if (!app.globalData.useCloud) {
      this.commitAvoidTip(cityId, avoidTip);
      return;
    }

    // 云端模式：文本安全校验
    if (wx.cloud && app.globalData.isLogin) {
      wx.showLoading({ title: '校验中...' });
      wx.cloud.callFunction({
        name: 'contentSecurity',
        data: {
          action: 'checkText',
          data: { content: avoidTip }
        },
        timeout: 15000
      }).then(function(res) {
        wx.hideLoading();
        if (res.result && res.result.pass) {
          self.commitAvoidTip(cityId, avoidTip);
        } else {
          wx.showToast({ title: '内容不合规', icon: 'none' });
        }
      }).catch(function(err) {
        wx.hideLoading();
        wx.showToast({ title: '安全校验暂时不可用', icon: 'none' });
      });
    } else {
      this.commitAvoidTip(cityId, avoidTip);
    }
  },

  commitAvoidTip: function(cityId, avoidTip) {
    var cityAvoidTips = app.globalData.cityAvoidTips || {};
    cityAvoidTips[cityId] = avoidTip;
    app.globalData.cityAvoidTips = cityAvoidTips;
    app.saveData();
    app.syncToCloud();
    wx.showToast({ title: '保存成功', icon: 'success' });
  },

  deleteAvoidTip: function() {
    var cityId = this.data.cityId;
    var self = this;
    wx.showModal({
      title: '删除避坑指南',
      content: '确定要删除这条避坑指南吗？',
      confirmColor: '#F87171',
      success: function(res) {
        if (res.confirm) {
          var cityAvoidTips = app.globalData.cityAvoidTips || {};
          delete cityAvoidTips[cityId];
          app.globalData.cityAvoidTips = cityAvoidTips;
          app.saveData();

          // 删除云端
          // 本地模式（useCloud=false）跳过云端删除，避免云函数超时卡顿
          if (app.globalData.useCloud && wx.cloud && app.globalData.isLogin) {
            wx.cloud.callFunction({
              name: 'syncData',
              data: {
                action: 'removeAvoidTip',
                data: { cityId: cityId }
              },
              timeout: 8000
            }).then(function(res) {
              console.log('[deleteAvoidTip] 云端避坑指南已删除', res.result);
            }).catch(function(err) {
              console.warn('[deleteAvoidTip] 云端删除失败:', err);
            });
          }

          self.setData({ avoidTip: '' });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  removeCity: function() {
    var cityId = this.data.cityId;
    var self = this;

    wx.showModal({
      title: '移除记录',
      content: '确定要移除这座城市的所有记录吗？云端数据也会一并删除。',
      confirmColor: '#F87171',
      success: function(res) {
        if (res.confirm) {
          // 从已访问列表移除
          var visitedCities = app.globalData.visitedCities || [];
          var index = visitedCities.indexOf(cityId);
          if (index > -1) {
            visitedCities.splice(index, 1);
            app.globalData.visitedCities = visitedCities;
          }

          // 移除旅游照片
          var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
          delete cityTravelPhotos[cityId];
          app.globalData.cityTravelPhotos = cityTravelPhotos;

          // 移除美食照片
          var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
          delete cityFoodPhotos[cityId];
          app.globalData.cityFoodPhotos = cityFoodPhotos;

          // 移除旧版照片数据
          var cityPhotos = app.globalData.cityPhotos || {};
          delete cityPhotos[cityId];
          app.globalData.cityPhotos = cityPhotos;

          // 移除笔记
          var cityNotes = app.globalData.cityNotes || {};
          delete cityNotes[cityId];
          app.globalData.cityNotes = cityNotes;

          // 移除避坑指南
          var cityAvoidTips = app.globalData.cityAvoidTips || {};
          delete cityAvoidTips[cityId];
          app.globalData.cityAvoidTips = cityAvoidTips;

          // 移除访问日期
          var cityVisitDates = app.globalData.visitDates || {};
          delete cityVisitDates[cityId];
          app.globalData.visitDates = cityVisitDates;

          // 重新计算省份
          app.globalData.visitedProvinces = app.globalData.visitedProvinces || [];
          var citiesData = require('../../utils/cities.js');
          var allCities = citiesData.cities || [];
          var stillHasProvince = false;
          for (var ci = 0; ci < allCities.length; ci++) {
            if (allCities[ci].provinceId === self.data.provinceId &&
                visitedCities.indexOf(allCities[ci].id) > -1) {
              stillHasProvince = true;
              break;
            }
          }
          if (!stillHasProvince) {
            var provIdx = app.globalData.visitedProvinces.indexOf(self.data.provinceId);
            if (provIdx > -1) app.globalData.visitedProvinces.splice(provIdx, 1);
          }

          app.saveData();

          // 删除云端记录（防止syncFromCloud恢复数据）
          // 本地模式（useCloud=false）跳过云端删除，避免云函数超时卡顿
          if (app.globalData.useCloud && wx.cloud && app.globalData.isLogin) {
            wx.cloud.callFunction({
              name: 'syncData',
              data: {
                action: 'removeCityRecord',
                data: { cityId: cityId }
              },
              timeout: 8000
            }).then(function(res) {
              console.log('[removeCity] 云端记录已删除', res.result);
            }).catch(function(err) {
              console.warn('[removeCity] 云端删除失败:', err);
            });
          }

          self.syncCityToCurrentGroup(cityId, self.data.provinceId, false);

          self.loadPhotos();
          self.checkVisited();
          self.setData({ note: '', avoidTip: '' });

          wx.showToast({
            title: '已移除',
            icon: 'success'
          });
        }
      }
    });
  },

  onImageError: function() {
    // 图片加载失败时显示默认背景
    this.setData({
      cityImage: ''
    });
  },

  goToCard: function() {
    var provinceId = this.data.provinceId;
    if (provinceId) {
      wx.navigateTo({
        url: '/package-cards/pages/card-detail/card-detail?provinceId=' + provinceId
      });
    }
  },

  onShareAppMessage: function() {
    var cityName = this.data.cityName;
    return {
      title: '我在 ' + cityName + ' 留下了足迹',
      path: '/pages/city-detail/city-detail?cityId=' + this.data.cityId,
      imageUrl: this.getPhotoUrl(this.data.travelPhotos[0]) || ''
    };
  }
});
