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

function canFeatureSharedPhoto(groupInfo, openid) {
  return !!groupInfo && !!openid && groupInfo.creatorOpenid === openid;
}

function canManageTravelPlan(plan, groupInfo, openid) {
  return !!plan && !!openid && (
    plan.creatorOpenid === openid ||
    (groupInfo && groupInfo.creatorOpenid === openid)
  );
}

module.exports = {
  canRemoveSharedPhoto: canRemoveSharedPhoto,
  canLeaveGroup: canLeaveGroup,
  canTransferOwnership: canTransferOwnership,
  canFeatureSharedPhoto: canFeatureSharedPhoto,
  canManageTravelPlan: canManageTravelPlan
};
