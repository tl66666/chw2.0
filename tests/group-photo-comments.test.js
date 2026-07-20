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

test('home map restores the original province check-in route with photo upload support', () => {
  const template = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
  const source = fs.readFileSync(path.join(root, 'pages/index/index.js'), 'utf8');

  assert.match(template, /bindtap="onProvinceTagTap"/);
  assert.match(source, /url: '\/pages\/city-detail\/city-detail\?provinceId='/);
  assert.doesNotMatch(source, /province-detail\/province-detail\?provinceId=/);
});

test('province entry restores its original city detail upload flow and card draw', () => {
  const source = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');

  assert.match(source, /loadProvinceData: function\(provinceId\)/);
  assert.match(source, /getProvinceImagePath\(provinceId\)/);
  assert.match(source, /isProvinceEntry: true/);
  assert.match(source, /unlock-card\/unlock-card\?provinceId=/);
});
