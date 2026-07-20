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

module.exports = {
  getFileId: getFileId,
  toAlbumPhoto: toAlbumPhoto,
  removeFromMap: removeFromMap
};
