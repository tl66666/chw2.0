const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const records = require('../城会玩2.0/utils/photo-records.js');
const reviewQueue = require('../城会玩2.0/utils/group-photo-review-queue.js');

test('normalizes a legacy travel photo with a stable identity', () => {
  const item = records.toAlbumPhoto('cloud://env/footprints/a.jpg', {
    cityId: 'shanghai',
    cityName: 'Shanghai',
    type: 'travel',
    index: 2
  });

  assert.equal(item.photoKey, 'local:travel:shanghai:cloud://env/footprints/a.jpg');
  assert.equal(item.fileId, 'cloud://env/footprints/a.jpg');
  assert.equal(item.source, 'local');
});

test('prefers an uploader file identifier over a display url', () => {
  assert.equal(
    records.getFileId({ fileId: 'cloud://env/id.jpg', url: 'https://example.com/image.jpg' }),
    'cloud://env/id.jpg'
  );
});

test('does not silently drop photos that are private after a failed security check', () => {
  const result = records.splitGroupSharePhotos([
    { fileId: 'cloud://env/verified.jpg', status: 'verified' },
    { fileId: 'cloud://env/private.jpg', status: 'private', message: '图片安全校验暂时不可用' },
    { fileId: 'wxfile://local.jpg', status: 'local' }
  ]);

  assert.deepEqual(result.shareable, ['cloud://env/verified.jpg']);
  assert.deepEqual(result.blocked, [
    { fileId: 'cloud://env/private.jpg', reason: '图片安全校验暂时不可用' },
    { fileId: 'wxfile://local.jpg', reason: '照片尚未完成云端上传' }
  ]);
});

test('keeps a failed in-group photo for automatic review without importing unrelated history', () => {
  const queued = reviewQueue.enqueue([], {
    groupId: 'group-a',
    fileId: 'cloud://env/pending.jpg',
    cityId: 'shaanxi',
    type: 'travel'
  });
  const duplicate = reviewQueue.enqueue(queued, {
    groupId: 'group-a',
    fileId: 'cloud://env/pending.jpg',
    cityId: 'shaanxi',
    type: 'travel'
  });

  assert.equal(duplicate.length, 1);
  assert.deepEqual(reviewQueue.forGroup(duplicate, 'group-a').map(function(item) { return item.fileId; }), ['cloud://env/pending.jpg']);
  assert.deepEqual(reviewQueue.forGroup(duplicate, 'group-b'), []);
  assert.deepEqual(reviewQueue.remove(duplicate, 'group-a', 'cloud://env/pending.jpg'), []);
});

test('group entry automatically reviews only photos queued while that group was active', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/app.js'), 'utf8');
  const cityDetail = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'), 'utf8');
  const groupSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/group/group.js'), 'utf8');

  assert.match(appSource, /queuePendingGroupPhotoReview: function\(entry\)/);
  assert.match(cityDetail, /queuePendingGroupPhotoReview/);
  assert.match(groupSource, /retryQueuedGroupPhotos: function\(groupInfo\)/);
  assert.match(groupSource, /app\.getPendingGroupPhotoReviews\(groupInfo\.id\)/);
});

test('cloud data merge and deletion use the durable file identifier for legacy photos', () => {
  const appSource = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/app.js'),
    'utf8'
  );
  const syncSource = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/cloudfunctions/syncData/index.js'),
    'utf8'
  );

  assert.match(appSource, /var photoUrl = photo\.fileId \|\| photo\.url/);
  assert.match(appSource, /markPhotoDeleted: function\(fileId\)/);
  assert.match(syncSource, /url: fileId/);
  assert.match(syncSource, /removed: removed/);
  assert.match(
    fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/album/album.js'), 'utf8'),
    /typeof res\.result\.removed === 'number'/
  );
});

test('a temporary personal-data sync failure does not switch photo uploads into local-only mode', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/app.js'), 'utf8');
  const syncFailure = appSource.match(/syncFromCloud: function\(\) \{[\s\S]*?\.catch\(function\(err\) \{([\s\S]*?)\n    \}\);/);

  assert.ok(syncFailure, 'syncFromCloud must retain an explicit failure handler');
  assert.doesNotMatch(syncFailure[1], /globalData\.useCloud\s*=\s*false/);
});

test('city check-in shows a local photo immediately while cloud moderation continues in the background', () => {
  const cityDetail = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'), 'utf8');

  assert.match(cityDetail, /saveCityPhotos\(cityId, activeTab, localPhotos, false, \{ skipGroupShare: true, silent: true \}\)/);
  assert.match(cityDetail, /uploadAndCheckPhotos\(tempFiles, 0, \[\], function\(pass, photos\)/);
  assert.match(cityDetail, /replaceLocalCityPhotos\(cityId, activeTab, tempFiles\)/);
});

test('a private group photo is shared after cloud upload without waiting for a slow review response', () => {
  const cityDetail = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'), 'utf8');

  assert.match(cityDetail, /reviewUploadedPhotoInBackground: function\(fileID, cityId, activeTab\)/);
  assert.match(cityDetail, /safePhotos\.push\(self\.buildPhotoItem\(uploadRes\.fileID, 'verified', '', filePath\)\);/);
  assert.match(cityDetail, /self\.reviewUploadedPhotoInBackground\(uploadRes\.fileID, self\.data\.cityId, self\.data\.activeTab\);/);
});

test('queued private-group photos are shared directly instead of repeatedly blocking on a slow review', () => {
  const groupSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/group/group.js'), 'utf8');

  assert.match(groupSource, /shareQueuedGroupPhoto: function\(groupInfo, item, done\)/);
  assert.match(groupSource, /self\.shareQueuedGroupPhoto\(groupInfo, item, function\(didShare\)/);
});

test('only durable cloud file ids return from cloud sync and city-detail deletion removes that id', () => {
  const appSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/app.js'), 'utf8');
  const cityDetail = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'), 'utf8');

  assert.match(appSource, /photoUrl\.indexOf\('cloud:\/\/'\) !== 0/);
  assert.match(cityDetail, /deletedFileId = photoRecords\.getFileId\(photos\[index\]\)/);
  assert.match(cityDetail, /app\.markPhotoDeleted\(deletedFileId\)/);
});

test('personal data clearing waits for a confirmed cloud reset before clearing local travel state', () => {
  const profileSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/profile/profile.js'), 'utf8');
  const syncSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/cloudfunctions/syncData/index.js'), 'utf8');

  assert.match(profileSource, /clearPersonalTravelState: function\(\)/);
  assert.match(profileSource, /if \(!result\.success\)/);
  assert.match(profileSource, /self\.clearPersonalTravelState\(\)/);
  assert.match(syncSource, /await db\.collection\('cityRecords'\)\.where\(\{ _openid: openid \}\)\.remove\(\)/);
  assert.match(syncSource, /await db\.collection\('photos'\)\.where\(\{ _openid: openid \}\)\.remove\(\)/);
});

test('personal data clearing verifies that the cloud no longer returns travel records', () => {
  const profileSource = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/profile/profile.js'), 'utf8');

  assert.match(profileSource, /verifyCloudTravelDataCleared: function\(done\)/);
  assert.match(profileSource, /action: 'getAllData'/);
  assert.match(profileSource, /self\.verifyCloudTravelDataCleared\(function\(verified, message\)/);
  assert.match(profileSource, /云端仍有旅行数据/);
});

test('both photo upload routes resolve the cloud group and report sharing failure', () => {
  const cityDetail = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'), 'utf8');
  const packageUpload = fs.readFileSync(path.join(__dirname, '../城会玩2.0/package-album/pages/upload/upload.js'), 'utf8');

  assert.match(cityDetail, /resolveCloudGroupForPhotoShare: function\(done\)/);
  assert.match(packageUpload, /resolveCloudGroupForPhotoShare: function\(done\)/);
  assert.match(cityDetail, /photoRecords\.splitGroupSharePhotos\(photos\)/);
  assert.match(packageUpload, /photoRecords\.splitGroupSharePhotos\(photos\)/);
  assert.match(packageUpload, /群相册未同步/);
});

test('photo moderation allows enough time before a photo is limited to the personal album', () => {
  const cityDetail = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'), 'utf8');
  const packageUpload = fs.readFileSync(path.join(__dirname, '../城会玩2.0/package-album/pages/upload/upload.js'), 'utf8');

  assert.match(cityDetail, /action:\s*'checkImage',[\s\S]{0,400}timeout:\s*20000/);
  assert.match(packageUpload, /action:\s*'checkImage',[\s\S]{0,400}timeout:\s*20000/);
});

test('a group-share retry is only offered when there are cloud-verified photos to retry', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.wxml'),
    'utf8'
  );

  assert.match(template, /class="group-share-retry" wx:if="\{\{pendingGroupPhotoShare\}\}"/);
});

test('removes only the requested file from one city and category', () => {
  const maps = {
    shanghai: ['cloud://a', 'cloud://b'],
    beijing: ['cloud://a']
  };

  const result = records.removeFromMap(maps, 'shanghai', 'cloud://a');

  assert.deepEqual(result.shanghai, ['cloud://b']);
  assert.deepEqual(result.beijing, ['cloud://a']);
  assert.notEqual(result, maps);
});

test('deduplicates the same uploaded file before it reaches the album grid', () => {
  const photos = records.uniquePhotos([
    { cityId: 'qinghai', type: 'travel', fileId: 'cloud://env/a.jpg', source: 'local' },
    { cityId: 'qinghai', type: 'travel', fileId: 'cloud://env/a.jpg', source: 'group' },
    { cityId: 'qinghai', type: 'food', fileId: 'cloud://env/a.jpg', source: 'local' }
  ]);

  assert.equal(photos.length, 2);
  assert.equal(photos[0].source, 'local');
});

test('the launch page opens first and routes into the map while album resolves province ids to Chinese names', () => {
  const appConfig = JSON.parse(fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/app.json'),
    'utf8'
  ));
  const albumSource = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/album/album.js'),
    'utf8'
  );

  assert.equal(appConfig.pages[0], 'pages/launch/launch');
  assert.match(
    fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/launch/launch.js'), 'utf8'),
    /wx\.switchTab\(\{\s*url: '\/pages\/index\/index'/
  );
  assert.match(albumSource, /if \(provinces\[p\]\.id === cityId\) return cityId;/);
  assert.match(albumSource, /if \(provinces\[j\]\.id === provinceId\) return provinces\[j\]\.name;/);
  assert.match(albumSource, /photoRecords\.uniquePhotos\(allPhotos\)/);
});

test('album cards provide a stable key and long-press deletion handler', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/album/album.wxml'),
    'utf8'
  );

  assert.match(template, /wx:key="photoKey"/);
  assert.match(template, /bindlongpress="requestDeletePhoto"/);
});

test('character detail preserves the full card image', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/package-cards/pages/card-detail/card-detail.wxml'),
    'utf8'
  );
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/package-cards/pages/card-detail/card-detail.wxss'),
    'utf8'
  );

  assert.match(template, /mode="aspectFit"/);
  assert.match(styles, /aspect-ratio:\s*3\s*\/\s*4/);
});

test('character card grid fills the artwork frame without side gutters', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxml'),
    'utf8'
  );

  assert.match(template, /class="card-image[\s\S]*?mode="aspectFill"/);
});

test('character card grid reserves a top safe area for portrait faces', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxss'),
    'utf8'
  );

  assert.match(styles, /\.card-image\s*\{[\s\S]*?top:\s*18rpx;[\s\S]*?height:\s*100%/);
});

test('province entries keep the province id across records, statistics, and photos', () => {
  const cityDetail = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.js'),
    'utf8'
  );
  const appSource = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/app.js'),
    'utf8'
  );
  const indexSource = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/index/index.js'),
    'utf8'
  );

  assert.match(cityDetail, /loadProvinceData:[\s\S]*?cityId:\s*provinceId,/);
  assert.match(appSource, /if \(provinces\[p\]\.id === cityId\)\s*\{\s*return cityId;/);
  assert.match(indexSource, /function getRecordProvinceId\(recordId\)/);
  assert.match(indexSource, /provincePhotoCount \+= countPhotosForRecord\(province\.id\)/);
});

test('group photo history is not exposed as a manual catch-up action', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/group/group.wxml'),
    'utf8'
  );
  const source = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/group/group.js'),
    'utf8'
  );

  assert.doesNotMatch(template, /syncPersonalPhotosToGroup/);
  assert.doesNotMatch(source, /syncPersonalPhotosToGroup/);
  assert.doesNotMatch(source, /getPersonalPhotoCandidates/);
});

test('city album labels make the beauty and food categories explicit', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.wxml'),
    'utf8'
  );

  assert.match(template, /美景/);
  assert.match(template, /美食/);
  assert.doesNotMatch(template, /城市记录/);
});

test('unlock animation has one short sequence instead of duplicate timers', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/package-cards/pages/unlock-card/unlock-card.js'),
    'utf8'
  );
  const sequenceCount = (source.match(/startUnlockSequence: function\(\)/g) || []).length;

  assert.equal(sequenceCount, 1);
  assert.doesNotMatch(source, /\}, 3800\);/);
  assert.match(source, /\}, 2250\);/);
});

test('city detail keeps its actions and shared photo states in the warm travel palette', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/city-detail/city-detail.wxss'),
    'utf8'
  );

  assert.doesNotMatch(styles, /#78B6A6|#4C9B8A|#4ECDC4|#2a9d8f/i);
});

test('group, map, and card catalog share the same warm palette', () => {
  const styles = [
    'pages/group/group.wxss',
    'pages/index/index.wxss',
    'pages/cards/cards.wxss',
    'package-cards/pages/card-detail/card-detail.wxss'
  ].map(function(file) {
    return fs.readFileSync(path.join(__dirname, '../城会玩2.0', file), 'utf8');
  }).join('\n');

  assert.doesNotMatch(styles, /#78B6A6|#4C9B8A|#4ECDC4|#365B51/i);
});

test('map, group, and card headers retain their layout after rejected draft removal', () => {
  const indexTemplate = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/index/index.wxml'), 'utf8');
  const groupTemplate = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/group/group.wxml'), 'utf8');
  const cardStyles = fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxss'), 'utf8');

  assert.match(indexTemplate, /class="welcome-section"/);
  assert.match(groupTemplate, /class="hero"/);
  assert.match(cardStyles, /cards-hero-copy/);
  assert.doesNotMatch(indexTemplate, /map-hero-v3\.png/);
  assert.doesNotMatch(groupTemplate, /group-hero-v3\.png/);
  assert.match(groupTemplate, /同行小队/);
  assert.match(fs.readFileSync(path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxml'), 'utf8'), /旅行图鉴/);
  const projectConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../城会玩2.0/project.config.json'), 'utf8'));
  assert.deepEqual(projectConfig.packOptions.ignore, []);
});

test('profile uses a restrained paper layout instead of stacked photo stat cards and a saturated header', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/profile/profile.wxml'),
    'utf8'
  );
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/profile/profile.wxss'),
    'utf8'
  );

  assert.doesNotMatch(template, /class="photo-stats"/);
  assert.match(styles, /background:\s*#E9E4DA;/);
  assert.match(styles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/);
});

test('profile presents a passport masthead with an editorial typography palette', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/profile/profile.wxml'),
    'utf8'
  );
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/profile/profile.wxss'),
    'utf8'
  );

  assert.match(template, /class="profile-masthead"/);
  assert.match(styles, /--profile-ink:\s*#3F3732;/);
  assert.match(styles, /--profile-display:\s*'Songti SC'/);
});

test('profile has a dedicated passport header illustration instead of a color-only masthead', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/profile/profile.wxml'),
    'utf8'
  );

  assert.match(template, /src="\/images\/headers\/profile-hero-final-v2\.png"/);
  assert.match(template, /class="profile-hero-art"/);
});

test('card catalog uses a single paper palette instead of rainbow rarity filter gradients', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxss'),
    'utf8'
  );

  assert.match(styles, /font-family:\s*'Songti SC'/);
  assert.doesNotMatch(styles, /filter-tab\.rarity-UR\.active\s*\{\s*background:\s*linear-gradient/);
  assert.match(styles, /\.filter-tab\.active\s*\{[\s\S]*?background:\s*#B65E4A;/);
});
