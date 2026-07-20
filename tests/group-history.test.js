const test = require('node:test');
const assert = require('node:assert/strict');
const history = require('../城会玩2.0/utils/group-history.js');

test('new group members start with zero shared travel history', () => {
  assert.deepEqual(history.createFreshGroupStats(), {
    cityCount: 0,
    provinceCount: 0,
    photoCount: 0,
    cityIds: [],
    provinceIds: []
  });
});

test('historical personal records are not auto-synced into a new group', () => {
  assert.equal(history.shouldAutoSyncHistory(), false);
});
