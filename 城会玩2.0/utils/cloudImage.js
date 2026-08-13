var cache = {};

// 检查云服务是否可用
function isCloudEnabled() {
  try {
    var app = getApp();
    return !!(app && app.globalData && app.globalData.useCloud && wx.cloud);
  } catch(e) {
    return false;
  }
}

function isCloudFile(fileID) {
  return typeof fileID === 'string' && fileID.indexOf('cloud://') === 0;
}

function isUsableImageUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }
  var value = url.trim();
  if (!value || value === '<URL>' || value.indexOf('<') !== -1 || value.indexOf('>') !== -1) {
    return false;
  }
  return value.indexOf('https://') === 0 ||
    value.indexOf('http://') === 0 ||
    value.indexOf('wxfile://') === 0 ||
    value.indexOf('tmp_') === 0 ||
    value.indexOf('/images/') === 0;
}

function done(callback, value) {
  if (typeof callback === 'function') {
    callback(isUsableImageUrl(value) ? value : '');
  }
}

function pickTempUrl(item) {
  if (item && item.status === 0 && isUsableImageUrl(item.tempFileURL)) {
    return item.tempFileURL;
  }
  return '';
}

function resolve(fileID, callback) {
  if (!isCloudFile(fileID)) {
    done(callback, fileID);
    return;
  }

  // 云服务不可用时，cloud:// URL 直接返回空（避免超时）
  if (!isCloudEnabled()) {
    done(callback, '');
    return;
  }

  if (cache[fileID]) {
    done(callback, cache[fileID]);
    return;
  }

  wx.cloud.getTempFileURL({
    fileList: [fileID],
    success: function(res) {
      var item = res.fileList && res.fileList[0];
      var url = pickTempUrl(item);
      if (url) {
        cache[fileID] = url;
        done(callback, url);
        return;
      }
      resolveByFunction(fileID, callback);
    },
    fail: function() {
      resolveByFunction(fileID, callback);
    }
  });
}

function resolveByFunction(fileID, callback) {
  wx.cloud.callFunction({
    name: 'getAssetUrl',
    data: { fileID: fileID },
    success: function(res) {
      var result = res.result || {};
      var url = isUsableImageUrl(result.url) ? result.url : '';
      if (result.success && url) {
        cache[fileID] = url;
        done(callback, url);
      } else {
        console.warn('getAssetUrl returned no usable url:', fileID, result);
        done(callback, '');
      }
    },
    fail: function(err) {
      console.warn('getAssetUrl call failed:', fileID, err);
      done(callback, '');
    }
  });
}

function finishPending(pendingState) {
  pendingState.pending--;
  if (pendingState.pending === 0 && typeof pendingState.callback === 'function') {
    pendingState.callback(pendingState.result);
  }
}

function resolveFallbackList(fileIDs, result, callback) {
  if (!fileIDs.length) {
    callback(result);
    return;
  }

  var state = {
    pending: fileIDs.length,
    result: result,
    callback: callback
  };

  for (var i = 0; i < fileIDs.length; i++) {
    (function(fileID) {
      resolveByFunction(fileID, function(url) {
        if (url) {
          result[fileID] = url;
        }
        finishPending(state);
      });
    })(fileIDs[i]);
  }
}

function resolveMany(fileIDs, callback) {
  var result = {};
  var uniqueCloudFiles = [];
  var seen = {};

  for (var i = 0; i < fileIDs.length; i++) {
    var fileID = fileIDs[i];
    if (!fileID || seen[fileID]) {
      continue;
    }
    seen[fileID] = true;

    if (cache[fileID]) {
      result[fileID] = cache[fileID];
    } else if (isCloudFile(fileID)) {
      uniqueCloudFiles.push(fileID);
    } else if (isUsableImageUrl(fileID)) {
      result[fileID] = fileID;
    }
  }

  if (!uniqueCloudFiles.length) {
    callback(result);
    return;
  }

  // 云服务不可用时，cloud:// URL 直接跳过（避免超时）
  if (!isCloudEnabled()) {
    callback(result);
    return;
  }

  wx.cloud.getTempFileURL({
    fileList: uniqueCloudFiles,
    success: function(res) {
      var failed = [];
      var list = res.fileList || [];
      var byFileID = {};

      for (var j = 0; j < list.length; j++) {
        byFileID[list[j].fileID] = list[j];
      }

      for (var k = 0; k < uniqueCloudFiles.length; k++) {
        var fileID = uniqueCloudFiles[k];
        var url = pickTempUrl(byFileID[fileID]);
        if (url) {
          cache[fileID] = url;
          result[fileID] = url;
        } else {
          failed.push(fileID);
        }
      }

      resolveFallbackList(failed, result, callback);
    },
    fail: function() {
      resolveFallbackList(uniqueCloudFiles, result, callback);
    }
  });
}

module.exports = {
  resolve: resolve,
  resolveMany: resolveMany,
  isUsableImageUrl: isUsableImageUrl
};
