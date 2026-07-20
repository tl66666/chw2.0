function canRemoveSharedPhoto(photo, openid) {
  return !!photo && !!openid && photo.openid === openid;
}

function canLeaveGroup(groupInfo, openid, memberCount) {
  return !groupInfo || groupInfo.creatorOpenid !== openid || memberCount <= 1;
}

function canTransferOwnership(currentOwnerOpenid, targetOpenid, memberOpenids) {
  return !!currentOwnerOpenid &&
    !!targetOpenid &&
    targetOpenid !== currentOwnerOpenid &&
    (memberOpenids || []).indexOf(targetOpenid) !== -1;
}

module.exports = {
  canRemoveSharedPhoto: canRemoveSharedPhoto,
  canLeaveGroup: canLeaveGroup,
  canTransferOwnership: canTransferOwnership
};
