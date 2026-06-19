function ensure(page, next) {
  if (!wx.getPrivacySetting) {
    next();
    return;
  }

  wx.getPrivacySetting({
    success: function(res) {
      if (!res.needAuthorization) {
        next();
        return;
      }

      var popup = page.selectComponent && page.selectComponent('#privacyPopup');
      if (!popup) {
        wx.showToast({
          title: '请先同意隐私保护指引',
          icon: 'none'
        });
        return;
      }

      page.__privacyNext = next;
      popup.show(res.privacyContractName);
    },
    fail: function() {
      next();
    }
  });
}

function handleAgree(page) {
  var next = page.__privacyNext;
  page.__privacyNext = null;
  if (typeof next === 'function') {
    next();
  }
}

function handleReject(page) {
  page.__privacyNext = null;
  wx.showToast({
    title: '已取消本次操作',
    icon: 'none'
  });
}

module.exports = {
  ensure: ensure,
  handleAgree: handleAgree,
  handleReject: handleReject
};
