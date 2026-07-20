const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const permissions = require('../城会玩2.0/cloudfunctions/group/permissions.js');

const root = path.join(__dirname, '../城会玩2.0');

test('group page exposes date archives and a focused photo discussion flow', () => {
  const template = fs.readFileSync(path.join(root, 'pages/group/group.wxml'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');

  assert.match(template, /wx:for="{{photoArchives}}"/);
  assert.match(template, /bindtap="openPhotoDiscussion"/);
  assert.match(template, /bindtap="submitPhotoComment"/);
  assert.match(template, /bindtap="deletePhotoComment"/);
  assert.match(source, /buildPhotoViews: function\(photos, selectedCity\)/);
  assert.match(source, /photoArchives/);
});

test('new group photos preserve a selected travel date for archive grouping', () => {
  const template = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.wxml'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');

  assert.match(template, /bindchange="onPhotoTravelDateChange"/);
  assert.match(source, /photoTravelDate/);
  assert.match(source, /var travelDate = this\.data\.photoTravelDate \|\| todayString\(\)/);
  assert.match(source, /travelDate: travelDate/);
});

test('photo comments are server-owned and removable only by their author or group owner', () => {
  const source = fs.readFileSync(path.join(root, 'cloudfunctions/group/index.js'), 'utf8');

  assert.equal(permissions.canRemovePhotoComment({ openid: 'author' }, { creatorOpenid: 'owner' }, 'author'), true);
  assert.equal(permissions.canRemovePhotoComment({ openid: 'author' }, { creatorOpenid: 'owner' }, 'owner'), true);
  assert.equal(permissions.canRemovePhotoComment({ openid: 'author' }, { creatorOpenid: 'owner' }, 'member'), false);
  assert.match(source, /collection\('group_photo_comments'\)/);
  assert.match(source, /action === 'getPhotoComments'/);
  assert.match(source, /action === 'addPhotoComment'/);
  assert.match(source, /action === 'removePhotoComment'/);
});

test('home map keeps province summaries separate from city check-in records', () => {
  const template = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'pages/index/index.js'), 'utf8');
  const appConfig = fs.readFileSync(path.join(root, 'app.json'), 'utf8');

  assert.match(template, /bindtap="openProvinceOverview"/);
  assert.match(template, /bindtap="openCityRecord"/);
  assert.match(source, /url: '\/pages\/province-detail\/province-detail\?provinceId='/);
  assert.doesNotMatch(source, /city-detail\/city-detail\?provinceId=/);
  assert.match(appConfig, /pages\/province-detail\/province-detail/);
});

test('map province entry has one independent province check-in and card path', () => {
  const template = fs.readFileSync(path.join(root, 'pages/province-detail/province-detail.wxml'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'pages/province-detail/province-detail.js'), 'utf8');

  assert.match(template, /class="province-cover"/);
  assert.match(template, /bindtap="toggleProvinceVisit"/);
  assert.match(source, /isProvinceVisited/);
  assert.match(source, /visitedProvinces/);
  assert.match(template, /必打卡地标/);
  assert.match(template, /旅行指南/);
  assert.match(source, /openUnlockCard/);
  assert.doesNotMatch(template, /city-atlas-card/);
});

test('city detail does not reuse a province cover as a city image', () => {
  const source = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');

  const cityLoad = source.slice(source.indexOf('loadCityData: function'), source.indexOf('loadProvinceData: function'));
  assert.doesNotMatch(cityLoad, /getProvinceImagePath\(city\.provinceId\)/);
  assert.match(cityLoad, /cityImage: ''/);
});

test('province and city check-ins stay independent across page and cloud sync paths', () => {
  const home = fs.readFileSync(path.join(root, 'pages/index/index.js'), 'utf8');
  const city = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');
  const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const cloudSource = fs.readFileSync(path.join(root, 'cloudfunctions/syncData/index.js'), 'utf8');
  const cityToggle = city.slice(city.indexOf('toggleVisit: function'), city.indexOf('doCancelVisit: function'));

  assert.match(home, /app\.globalData\.visitedProvinces/);
  assert.doesNotMatch(cityToggle, /visitedProvinces/);
  assert.match(appSource, /manualProvinceRecords/);
  assert.match(cloudSource, /case 'syncProvinceRecords'/);
});
