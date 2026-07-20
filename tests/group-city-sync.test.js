const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../城会玩2.0');
const cityDetailSource = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');
const groupFunctionSource = fs.readFileSync(path.join(root, 'cloudfunctions/group/index.js'), 'utf8');

test('photo-led check-in also syncs the newly lit place to the current group', () => {
  const performCheckIn = cityDetailSource.slice(
    cityDetailSource.indexOf('performCheckIn: function'),
    cityDetailSource.indexOf('// 实际上传照片的方法')
  );

  assert.match(performCheckIn, /this\.syncCityToCurrentGroup\(cityId, provinceId, true\)/);
});

test('a successful group city sync returns the saved city for an immediate cache refresh', () => {
  const syncSingleCity = groupFunctionSource.slice(
    groupFunctionSource.indexOf('async function syncSingleCity'),
    groupFunctionSource.indexOf('async function shareGroupPhoto')
  );

  assert.match(syncSingleCity, /success:\s*true,\s*city:\s*\{/);
});

test('a group city storage failure is reported instead of being silently treated as a successful sync', () => {
  const syncSingleCity = groupFunctionSource.slice(
    groupFunctionSource.indexOf('async function syncSingleCity'),
    groupFunctionSource.indexOf('async function shareGroupPhoto')
  );

  assert.doesNotMatch(syncSingleCity, /return \{ success: true, skipped: true \}/);
  assert.match(syncSingleCity, /return \{ success: false, error: 'CITY_SYNC_FAILED'/);
});

test('the city detail page updates its current group cache after a confirmed sync', () => {
  const syncFunction = cityDetailSource.slice(
    cityDetailSource.indexOf('syncCityToCurrentGroup: function'),
    cityDetailSource.indexOf('loadGroupFootprint: function')
  );

  assert.match(syncFunction, /self\.cacheGroupCitySync\(groupData, result\.city\)/);
});
