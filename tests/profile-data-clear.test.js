const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const profileScript = fs.readFileSync(
  path.join(__dirname, '../城会玩2.0/pages/profile/profile.js'),
  'utf8'
);
const syncDataFunction = fs.readFileSync(
  path.join(__dirname, '../城会玩2.0/cloudfunctions/syncData/index.js'),
  'utf8'
);

test('clearing personal travel data keeps the current group membership', () => {
  assert.doesNotMatch(profileScript, /data:\s*\{\s*action:\s*'leaveGroup'\s*\}/);
  assert.doesNotMatch(profileScript, /'myGroup'/);
  assert.doesNotMatch(profileScript, /groupView\.getGroupData\(\)\.activities/);
});

test('cloud data reset does not erase the current group reference', () => {
  const clearAllData = syncDataFunction.slice(
    syncDataFunction.indexOf('async function clearAllData'),
    syncDataFunction.indexOf('// 删除单个城市的云端记录')
  );

  assert.doesNotMatch(clearAllData, /currentGroup/);
  assert.doesNotMatch(clearAllData, /groups:\s*\[\]/);
});
