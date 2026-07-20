function getFileId(photo) {
  if (typeof photo === 'string') return photo;
  return photo && (photo.fileId || photo.url) || '';
}

function toAlbumPhoto(photo, meta) {
  meta = meta || {};
  var fileId = getFileId(photo);
  var source = meta.source || 'local';
  var type = meta.type || 'travel';
  var cityId = meta.cityId || '';

  return {
    url: fileId,
    displayUrl: typeof photo === 'string' ? '' : (photo.displayUrl || photo.localPath || ''),
    fileId: fileId,
    cityId: cityId,
    cityName: meta.cityName || '',
    type: type,
    source: source,
    sourceIndex: meta.index,
    photoKey: source + ':' + type + ':' + cityId + ':' + fileId
  };
}

function removeFromMap(map, cityId, fileId) {
  var next = {};
  Object.keys(map || {}).forEach(function(key) {
    var photos = (map[key] || []).slice();
    if (key === cityId) {
      photos = photos.filter(function(photo) {
        return getFileId(photo) !== fileId;
      });
    }
    if (photos.length > 0) next[key] = photos;
  });
  return next;
}

function uniquePhotos(photos) {
  var seen = {};
  return (photos || []).filter(function(photo) {
    var fileId = getFileId(photo);
    if (!fileId) return false;
    var key = (photo.cityId || '') + ':' + (photo.type || 'travel') + ':' + fileId;
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function splitGroupSharePhotos(photos) {
  var shareable = [];
  var blocked = [];

  (photos || []).forEach(function(photo) {
    var fileId = getFileId(photo);
    var status = typeof photo === 'string' ? 'verified' : (photo.status || 'verified');

    if (status !== 'verified' && status !== 'local') {
      blocked.push({
        fileId: fileId,
        reason: (photo && photo.message) || '照片安全校验尚未完成，暂时只保存到个人相册'
      });
      return;
    }

    if (fileId && fileId.indexOf('cloud://') === 0) {
      shareable.push(fileId);
      return;
    }

    blocked.push({
      fileId: fileId,
      reason: '照片尚未完成云端上传'
    });
  });

  return { shareable: shareable, blocked: blocked };
}

module.exports = {
  getFileId: getFileId,
  toAlbumPhoto: toAlbumPhoto,
  removeFromMap: removeFromMap,
  uniquePhotos: uniquePhotos,
  splitGroupSharePhotos: splitGroupSharePhotos
};
