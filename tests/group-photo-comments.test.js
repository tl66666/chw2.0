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

test('group photo sharing uses the uploaded cloud file identifier and refreshes group cache', () => {
  const source = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');
  const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const uploadSource = fs.readFileSync(path.join(root, 'package-album/pages/upload/upload.js'), 'utf8');
  const groupSource = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');

  assert.match(source, /item\.fileId \|\| item\.url \|\| item\.displayUrl/);
  assert.match(source, /app\.refreshGroupCache/);
  assert.match(source, /groupShareError/);
  assert.match(appSource, /photoRecords\.getFileId\(travelPhotos\[tp\]\)/);
  assert.match(appSource, /photoRecords\.getFileId\(foodPhotos\[fp\]\)/);
  assert.match(uploadSource, /item\.fileId \|\| item\.url \|\| item\.displayUrl/);
  assert.match(source, /sharePhotosToCurrentGroup: function\(cityId, activeTab, photos, done\)/);
  assert.match(source, /function cacheSharedPhoto\(fileId, photoId\)/);
  assert.match(source, /groupId: groupData\.groupInfo\.id,/);
  assert.match(source, /failed\.push\(\{ fileId: fileID, reason:/);
  assert.doesNotMatch(groupSource, /syncPersonalPhotosToGroup/);
});

test('photo sharing resolves the current cloud group instead of silently skipping without a cache', () => {
  const source = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');

  assert.match(source, /resolveCloudGroupForPhotoShare: function\(done\)/);
  assert.match(source, /this\.resolveCloudGroupForPhotoShare\(function\(groupData, failureReason\)/);
  assert.match(source, /reason: failureReason \|\| '未识别到当前云端群组'/);
  assert.match(source, /getGroupShareFailureReason: function\(result\)/);
  assert.match(source, /UNKNOWN_ACTION/);
});

test('album restores its original travel and food empty illustrations', () => {
  const indexTemplate = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
  const groupTemplate = fs.readFileSync(path.join(root, 'pages/group/group.wxml'), 'utf8');
  const albumTemplate = fs.readFileSync(path.join(root, 'pages/album/album.wxml'), 'utf8');

  assert.doesNotMatch(indexTemplate, /map-atlas-banner\.jpg/);
  assert.doesNotMatch(groupTemplate, /group-route-banner\.jpg/);
  assert.equal(fs.existsSync(path.join(root, 'images/ui', 'empty-travel.jpg')), true);
  assert.equal(fs.existsSync(path.join(root, 'images/ui', 'empty-food.jpg')), true);
  assert.match(albumTemplate, /empty-\{\{activeTab === 'food' \? 'food' : 'travel'\}\}\.jpg/);
  assert.doesNotMatch(albumTemplate, /album-empty-stamp\.png/);
});

test('map and group headers use purpose-specific paper travel illustrations', () => {
  const indexTemplate = fs.readFileSync(path.join(root, 'pages/index/index.wxml'), 'utf8');
  const groupTemplate = fs.readFileSync(path.join(root, 'pages/group/group.wxml'), 'utf8');

  assert.match(indexTemplate, /class="welcome-section"/);
  assert.match(groupTemplate, /class="hero"/);
  assert.match(indexTemplate, /src="\/images\/headers\/map-hero-final-v2\.png"/);
  assert.match(groupTemplate, /src="\/images\/headers\/group-hero-final-v2\.png"/);
  assert.equal(fs.existsSync(path.join(root, 'images/headers', 'map-hero-final-v2.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'images/headers', 'group-hero-final-v2.png')), true);
  assert.doesNotMatch(indexTemplate, /map-hero-v3\.png/);
  assert.doesNotMatch(groupTemplate, /group-hero-v3\.png/);
  assert.doesNotMatch(indexTemplate, /map-header\.jpg/);
  assert.doesNotMatch(groupTemplate, /group-header\.jpg/);
});

test('album and card catalog use the approved paper-travel header illustrations', () => {
  const albumTemplate = fs.readFileSync(path.join(root, 'pages/album/album.wxml'), 'utf8');
  const cardsTemplate = fs.readFileSync(path.join(root, 'pages/cards/cards.wxml'), 'utf8');

  assert.match(albumTemplate, /class="album-header-copy"/);
  assert.match(cardsTemplate, /class="cards-hero-copy"/);
  assert.match(albumTemplate, /src="\/images\/headers\/album-hero-final-v2\.png"/);
  assert.match(cardsTemplate, /src="\/images\/headers\/cards-hero-final-v3\.png"/);
  assert.equal(fs.existsSync(path.join(root, 'images/headers', 'album-hero-final-v2.png')), true);
  assert.equal(fs.existsSync(path.join(root, 'images/headers', 'cards-hero-final-v3.png')), true);
  assert.doesNotMatch(albumTemplate, /album-hero-v3\.png/);
  assert.doesNotMatch(cardsTemplate, /cards-hero-v3\.png/);
});

test('album ignores unscoped legacy group photos and always labels map records by province', () => {
  const albumSource = fs.readFileSync(path.join(root, 'pages/album/album.js'), 'utf8');
  const groupViewSource = fs.readFileSync(path.join(root, 'utils/group-view.js'), 'utf8');
  const groupCloudSource = fs.readFileSync(path.join(root, 'cloudfunctions/group/index.js'), 'utf8');

  assert.match(albumSource, /name: this\.getProvinceNameByCityId\(groupPhoto\.cityId\)/);
  assert.match(groupViewSource, /function isCurrentGroupPhoto\(photo, groupId\)/);
  assert.match(groupViewSource, /\.filter\(function\(photo\) \{ return isCurrentGroupPhoto\(photo, group\.groupInfo\.id\); \}\)/);
  assert.match(groupCloudSource, /groupId: p\.groupId,/);
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

test('group payload preserves a photo-sync error instead of presenting a broken collection as empty', () => {
  const source = fs.readFileSync(path.join(root, 'cloudfunctions/group/index.js'), 'utf8');
  const pageSource = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');
  const template = fs.readFileSync(path.join(root, 'pages/group/group.wxml'), 'utf8');

  assert.match(source, /photoSyncError/);
  assert.match(pageSource, /photoSyncError/);
  assert.match(template, /photoSyncError/);
});

test('group page independently verifies the shared photo feed instead of trusting a silent empty payload', () => {
  const source = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');

  assert.match(source, /verifySharedPhotoFeed: function\(payload\)/);
  assert.match(source, /action: 'getSharedPhotos'/);
  assert.doesNotMatch(source, /群相册云函数未更新|重新上传部署 group 云函数/);
  assert.match(source, /self\.verifySharedPhotoFeed\(result\)/);
});

test('group entry avoids duplicate photo reads when the primary payload is healthy', () => {
  const pageSource = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');
  const cloudSource = fs.readFileSync(path.join(root, 'cloudfunctions/group/index.js'), 'utf8');
  const onLoad = pageSource.slice(pageSource.indexOf('onLoad: function'), pageSource.indexOf('onShow: function'));

  assert.doesNotMatch(onLoad, /ensureLoginAndLoad\(\)/);
  assert.match(pageSource, /if \(result\.photoSyncError\) self\.verifySharedPhotoFeed\(result\);/);
  assert.match(cloudSource, /await Promise\.all\(\[\s*getGroupCities/);
});

test('a confirmed cloud exit clears a stale local group cache instead of restoring the old group', () => {
  const source = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');

  assert.match(source, /else if \(result\.success && !result\.groupInfo && !result\.offline\) \{\s*self\.clearLocalGroup\(\);/);
});

test('group loading ends and keeps local data when the cloud reports an offline error', () => {
  const source = fs.readFileSync(path.join(root, 'pages/group/group.js'), 'utf8');

  assert.match(source, /result\.success && !result\.groupInfo && result\.offline/);
  assert.match(source, /clearLocalGroup: function\(groupLoadError\)/);
  assert.match(source, /loading: false/);
  assert.match(source, /groupLoadError/);
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
