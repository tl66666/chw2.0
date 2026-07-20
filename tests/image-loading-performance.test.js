const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.join(__dirname, '../城会玩2.0');
const cloudImagePath = path.join(appRoot, 'utils/cloudImage.js');

function loadCloudImageWithStorage(storage, cloudCalls) {
  delete require.cache[require.resolve(cloudImagePath)];
  global.wx = {
    getStorageSync: function(key) {
      return storage[key] || '';
    },
    setStorageSync: function(key, value) {
      storage[key] = value;
    },
    cloud: {
      getTempFileURL: function(options) {
        cloudCalls.count++;
        options.success({
          fileList: [{
            status: 0,
            fileID: 'cloud://env/cards/jiangxi.png',
            tempFileURL: 'https://example.com/fresh-jiangxi.png'
          }]
        });
      },
      callFunction: function() {
        cloudCalls.count++;
      }
    }
  };
  return require(cloudImagePath);
}

test('refreshes a cloud image URL after restart instead of trusting a persisted temporary URL', () => {
  const storage = {
    cloudImageTempUrlCacheV1: JSON.stringify({
      expiresAt: Date.now() + 60 * 1000,
      urls: {
        'cloud://env/cards/jiangxi.png': 'https://example.com/jiangxi.png'
      }
    })
  };
  const cloudCalls = { count: 0 };
  const cloudImage = loadCloudImageWithStorage(storage, cloudCalls);

  let result = '';
  cloudImage.resolve('cloud://env/cards/jiangxi.png', function(url) {
    result = url;
  });

  assert.equal(result, 'https://example.com/fresh-jiangxi.png');
  assert.equal(cloudCalls.count, 1);
});

test('uses the launch page as the cold-start entry', () => {
  const appConfig = JSON.parse(fs.readFileSync(path.join(appRoot, 'app.json'), 'utf8'));
  assert.equal(appConfig.pages[0], 'pages/launch/launch');
});

test('card catalog refreshes on show without double-loading on its first appearance', () => {
  [
    'pages/cards/cards.js',
    'package-cards/pages/cards/cards.js'
  ].forEach(function(file) {
    const source = fs.readFileSync(path.join(appRoot, file), 'utf8');
    const onLoad = source.match(/onLoad: function\(\) \{([\s\S]*?)\r?\n  \},\r?\n\r?\n  onShow/);
    const onShow = source.match(/onShow: function\(\) \{([\s\S]*?)\r?\n  \},\r?\n\r?\n  deriveVisitedProvinces/);

    assert.ok(onLoad, file + ' must keep an onLoad lifecycle method');
    assert.ok(onShow, file + ' must keep an onShow lifecycle method');
    assert.doesNotMatch(onLoad[1], /loadCards\(/);
    assert.match(onShow[1], /loadCards\(/);
  });
});

test('cloud photo views reuse the shared temporary-url cache instead of bypassing it', () => {
  [
    'pages/album/album.js',
    'package-album/pages/album/album.js',
    'pages/city-detail/city-detail.js'
  ].forEach(function(file) {
    const source = fs.readFileSync(path.join(appRoot, file), 'utf8');
    assert.match(source, /cloudImage\.resolveMany\(fileList/);
  });
});

test('card catalogs resolve the first screen before continuing through the remaining card artwork', () => {
  [
    'pages/cards/cards.js',
    'package-cards/pages/cards/cards.js'
  ].forEach(function(file) {
    const source = fs.readFileSync(path.join(appRoot, file), 'utf8');
    assert.match(source, /cloudPaths\.slice\(0, 8\)/);
    assert.match(source, /setTimeout\(loadNextBatch, 180\)/);
    const template = fs.readFileSync(path.join(appRoot, file.replace(/\.js$/, '.wxml')), 'utf8');
    assert.match(template, /class="card-image[\s\S]*?lazy-load/);
  });
});

test('map welcome banner fills the full header while keeping a readable paper overlay for its copy', () => {
  const styles = fs.readFileSync(path.join(appRoot, 'pages/index/index.wxss'), 'utf8');
  const template = fs.readFileSync(path.join(appRoot, 'pages/index/index.wxml'), 'utf8');

  assert.match(styles, /\.welcome-banner\s*\{[\s\S]*?left:\s*0;[\s\S]*?width:\s*100%/);
  assert.match(styles, /\.welcome-overlay\s*\{/);
  assert.match(template, /class="welcome-overlay"/);
});
