function createFreshGroupStats() {
  return {
    cityCount: 0,
    provinceCount: 0,
    photoCount: 0,
    cityIds: [],
    provinceIds: []
  };
}

function shouldAutoSyncHistory() {
  return false;
}

module.exports = {
  createFreshGroupStats: createFreshGroupStats,
  shouldAutoSyncHistory: shouldAutoSyncHistory
};
