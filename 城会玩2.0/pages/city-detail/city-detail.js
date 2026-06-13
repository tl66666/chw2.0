var app = getApp();
var citiesData = require('../../utils/cities.js');
var provincesData = require('../../utils/provinces.js');
var cities = citiesData.cities;
var provinces = provincesData.provinces;
var cloudImage = require('../../utils/cloudImage.js');
var audioManager = require('../../utils/audio-manager.js').getAudioManager();
var achievementsModule = require('../../utils/achievements.js');

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

// 云存储基础路径 - 使用当前环境
// 注意：正确的格式是 cloud://环境ID/文件路径
var CLOUD_BASE = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269';

// 获取省份对应的云存储图片路径
function getProvinceImagePath(provinceId) {
  var fileName = provinceToImageFile[provinceId];
  return fileName ? CLOUD_BASE + '/cities/' + fileName : '';
}

// 获取云存储图片 - 下载到本地临时文件
function getCloudImageUrl(cloudPath, callback) {
  cloudImage.resolve(cloudPath, callback);
}

Page({
  data: {
    cityId: '',
    cityName: '',
    provinceName: '',
    provinceId: '',
    landmark: '',
    cityImage: '',
    cityIntro: '',
    travelPhotos: [],
    foodPhotos: [],
    note: null,
    isVisited: false,
    activeTab: 'travel'
  },

  onLoad: function(options) {
    var cityId = options.cityId;
    var provinceId = options.provinceId;
    

    
    if (cityId) {
      this.loadCityData(cityId);
    } else if (provinceId) {
      this.loadProvinceData(provinceId);
    }
  },

  onShow: function() {
    this.loadPhotos();
    this.checkVisited();
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
      
      this.setData({
        cityId: city.id,
        cityName: city.name,
        provinceName: province ? province.name : '',
        provinceId: city.provinceId,
        landmark: city.landmark || '',
        cityImage: '', // 先清空，等获取临时链接后再设置
        cityIntro: cityIntros[cityId] || ''
      });
      
      // 异步获取云存储图片临时链接
      if (cloudPath) {
        getCloudImageUrl(cloudPath, function(imageUrl) {
          // 确保获取到的是临时文件路径，而不是 cloud:// 路径
          if (imageUrl && imageUrl.indexOf('cloud://') !== 0) {
            self.setData({
              cityImage: imageUrl
            });
          } else {
            console.error('Failed to get valid image URL:', imageUrl);
          }
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

    // 如果没找到显示城市，使用第一个城市
    if (!displayCity && provinceCities.length > 0) {
      displayCity = provinceCities[0];
    }

    var landmarkNames = [];
    for (var k = 0; k < Math.min(3, provinceCities.length); k++) {
      landmarkNames.push(provinceCities[k].name);
    }

    var self = this;
    this.setData({
      cityId: displayCity ? displayCity.id : provinceId,
      cityName: province ? province.name : '',
      provinceId: provinceId,
      provinceName: provinceCities.length + ' 座城市',
      cityImage: '', // 先清空，等获取临时链接后再设置
      landmark: landmarkNames.join('、')
    });
    
    // 异步获取云存储图片临时链接
    if (imagePath) {
      getCloudImageUrl(imagePath, function(imageUrl) {
        // 确保获取到的是临时文件路径，而不是 cloud:// 路径
        if (imageUrl && imageUrl.indexOf('cloud://') !== 0) {
          self.setData({
            cityImage: imageUrl
          });
        } else {
          console.error('Failed to get valid image URL:', imageUrl);
        }
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
    var travelPhotos = cityTravelPhotos[cityId] || [];
    
    // 加载美食照片
    var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
    var foodPhotos = cityFoodPhotos[cityId] || [];
    
    // 兼容旧数据：如果有旧版照片数据，迁移到旅游照片
    var cityPhotos = app.globalData.cityPhotos || {};
    var oldPhotos = cityPhotos[cityId] || [];
    if (oldPhotos.length > 0 && travelPhotos.length === 0) {
      travelPhotos = oldPhotos;
      cityTravelPhotos[cityId] = travelPhotos;
      app.globalData.cityTravelPhotos = cityTravelPhotos;
      app.saveData();
    }
    
    // 加载笔记
    var cityNotes = app.globalData.cityNotes || {};
    var note = cityNotes[cityId] || null;
    
    this.setData({ 
      travelPhotos: travelPhotos,
      foodPhotos: foodPhotos,
      note: note
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
      
      visitedCities.push(cityId);
      app.globalData.visitedCities = visitedCities;
      app.saveData();
      this.checkVisited();
      
      audioManager.play('checkin_success');

      // 检查特殊成就（夜猫子/早鸟/闪电侠）
      this.checkTimeAchievements();

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
      }
    } else {
      visitedCities.splice(index, 1);
      app.globalData.visitedCities = visitedCities;
      app.saveData();
      this.checkVisited();
      wx.showToast({ title: '已取消', icon: 'success' });
    }
  },

  checkFirstTimeInProvince: function(provinceId) {
    var visitedCities = app.globalData.visitedCities || [];
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
  checkTimeAchievements: function() {
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

    // 检查成就
    var stats = this.getStatsForAchievement();
    var unlockedIds = wx.getStorageSync('unlockedAchievements') || [];
    var newList = achievementsModule.checkNewAchievements(stats, unlockedIds);
    if (newList.length > 0) {
      newList.forEach(function(ach) {
        if (unlockedIds.indexOf(ach.id) === -1) unlockedIds.push(ach.id);
      });
      wx.setStorageSync('unlockedAchievements', unlockedIds);
    }
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
        }, 800);
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
        var tempFiles = res.tempFilePaths;
        
        if (activeTab === 'travel') {
          // 保存旅游照片
          var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
          var existingPhotos = cityTravelPhotos[cityId] || [];
          cityTravelPhotos[cityId] = existingPhotos.concat(tempFiles);
          app.globalData.cityTravelPhotos = cityTravelPhotos;
        } else {
          // 保存美食照片
          var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
          var existingPhotos = cityFoodPhotos[cityId] || [];
          cityFoodPhotos[cityId] = existingPhotos.concat(tempFiles);
          app.globalData.cityFoodPhotos = cityFoodPhotos;
        }
        
        app.saveData();
        
        // 更新UI
        self.loadPhotos();
        
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      }
    });
  },

  // 页面显示时检查是否有待上传的照片（从抽卡页面返回后）
  onShow: function() {
    this.loadPhotos();
    this.checkVisited();
    
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

  previewPhoto: function(e) {
    var url = e.currentTarget.dataset.url;
    var activeTab = this.data.activeTab;
    var photos = activeTab === 'travel' ? this.data.travelPhotos : this.data.foodPhotos;
    
    wx.previewImage({
      current: url,
      urls: photos
    });
  },

  deletePhoto: function(e) {
    var index = e.currentTarget.dataset.index;
    var cityId = this.data.cityId;
    var activeTab = this.data.activeTab;
    var self = this;
    
    wx.showModal({
      title: '删除照片',
      content: '确定要删除这张照片吗？',
      success: function(res) {
        if (res.confirm) {
          if (activeTab === 'travel') {
            var cityTravelPhotos = app.globalData.cityTravelPhotos || {};
            var photos = cityTravelPhotos[cityId] || [];
            photos.splice(index, 1);
            cityTravelPhotos[cityId] = photos;
            app.globalData.cityTravelPhotos = cityTravelPhotos;
          } else {
            var cityFoodPhotos = app.globalData.cityFoodPhotos || {};
            var photos = cityFoodPhotos[cityId] || [];
            photos.splice(index, 1);
            cityFoodPhotos[cityId] = photos;
            app.globalData.cityFoodPhotos = cityFoodPhotos;
          }
          
          app.saveData();
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
    var cityId = this.data.cityId;
    var note = this.data.note;
    
    var cityNotes = app.globalData.cityNotes || {};
    cityNotes[cityId] = note;
    app.globalData.cityNotes = cityNotes;
    app.saveData();
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  removeCity: function() {
    var cityId = this.data.cityId;
    var self = this;
    
    wx.showModal({
      title: '移除记录',
      content: '确定要移除这座城市的所有记录吗？',
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
          
          app.saveData();
          
          self.loadPhotos();
          self.checkVisited();
          
          wx.showToast({
            title: '已移除',
            icon: 'success'
          });
        }
      }
    });
  },

  shareCity: function() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
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
      imageUrl: this.data.travelPhotos[0] || ''
    };
  }
});
