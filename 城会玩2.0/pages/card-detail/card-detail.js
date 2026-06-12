var provincesData = require('../../utils/provinces.js');
var charactersData = require('../../utils/characters.js');
var cloudImage = require('../../utils/cloudImage.js');

Page({
  data: {
    provinceId: '',
    province: null,
    character: null,
    cardImage: '',
    rarityColor: '#9B9B9B',
    totalScore: 0,
    isUnlocked: false
  },

  onLoad: function(options) {
    var provinceId = options.provinceId || '';
    var province = provincesData.getProvinceById(provinceId);
    
    if (province) {
      var character = charactersData.getCharacter(provinceId);
      var rarityColor = charactersData.getRarityColor(character.rarity);
      var app = getApp();
      var visited = app.globalData.visitedProvinces || [];
      
      var attrs = character.attributes;
      var totalScore = Math.round((attrs.culture + attrs.fashion + attrs.food + attrs.history) / 4);
      
      var self = this;
      var cloudPath = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269/cards/' + provinceId + '.png';

      self.setData({
        provinceId: provinceId,
        province: province,
        character: character,
        rarityColor: rarityColor,
        totalScore: totalScore,
        isUnlocked: visited.indexOf(provinceId) !== -1,
        cardImage: ''
      });
      
      cloudImage.resolve(cloudPath, function(imageUrl) {
        if (imageUrl) {
          self.setData({ cardImage: imageUrl });
        }
      });
    }
  },

  // 返回
  goBack: function() {
    wx.navigateBack();
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '查看 ' + this.data.province.name + ' 的角色卡',
      path: '/pages/card-detail/card-detail?provinceId=' + this.data.provinceId
    };
  }
});
