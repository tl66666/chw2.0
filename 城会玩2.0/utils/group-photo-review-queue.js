function getFileId(item) {
  return item && (item.fileId || item.url) || '';
}

function enqueue(items, entry) {
  var next = (items || []).slice();
  var groupId = entry && entry.groupId;
  var fileId = getFileId(entry);
  if (!groupId || !fileId || fileId.indexOf('cloud://') !== 0) return next;

  var exists = next.some(function(item) {
    return item && item.groupId === groupId && getFileId(item) === fileId;
  });
  if (!exists) {
    next.push({
      groupId: groupId,
      fileId: fileId,
      cityId: entry.cityId || '',
      cityName: entry.cityName || '',
      provinceId: entry.provinceId || '',
      type: entry.type || 'travel',
      travelDate: entry.travelDate || '',
      queuedAt: entry.queuedAt || Date.now()
    });
  }
  return next;
}

function forGroup(items, groupId) {
  return (items || []).filter(function(item) {
    return item && item.groupId === groupId && getFileId(item).indexOf('cloud://') === 0;
  });
}

function remove(items, groupId, fileId) {
  return (items || []).filter(function(item) {
    return !item || item.groupId !== groupId || getFileId(item) !== fileId;
  });
}

module.exports = {
  enqueue: enqueue,
  forGroup: forGroup,
  remove: remove
};
