Component({
  data: {
    visible: false,
    contractName: '用户隐私保护指引'
  },

  methods: {
    show: function(contractName) {
      this.setData({
        visible: true,
        contractName: contractName || '用户隐私保护指引'
      });
    },

    hide: function() {
      this.setData({ visible: false });
    },

    preventMove: function() {},

    openContract: function() {
      if (wx.openPrivacyContract) {
        wx.openPrivacyContract();
      }
    },

    agree: function() {
      this.hide();
      this.triggerEvent('agree');
    },

    reject: function() {
      this.hide();
      this.triggerEvent('reject');
    }
  }
});
