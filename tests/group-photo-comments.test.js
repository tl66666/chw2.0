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

test('province overview uses one province cover and city cards only use real travel photos', () => {
  const template = fs.readFileSync(path.join(root, 'pages/province-detail/province-detail.wxml'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'pages/province-detail/province-detail.js'), 'utf8');

  assert.match(template, /class="province-cover"/);
  assert.match(template, /class="city-real-photo"/);
  assert.match(template, /class="city-atlas-card"/);
  assert.match(source, /provinceCover/);
  assert.match(source, /photoUrl/);
  assert.match(source, /landmarks/);
});

test('province city landmarks are split into a primary place and compact tags', () => {
  const template = fs.readFileSync(path.join(root, 'pages/province-detail/province-detail.wxml'), 'utf8');

  assert.match(template, /city-primary-landmark/);
  assert.match(template, /wx:for="{{item\.landmarks}}"/);
});

test('city detail does not reuse a province cover as a city image', () => {
  const source = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');

  const cityLoad = source.slice(source.indexOf('loadCityData: function'), source.indexOf('loadProvinceData: function'));
  assert.doesNotMatch(cityLoad, /getProvinceImagePath\(city\.provinceId\)/);
  assert.match(cityLoad, /cityImage: ''/);
});
