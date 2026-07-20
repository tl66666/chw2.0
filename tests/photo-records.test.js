const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const records = require('../城会玩2.0/utils/photo-records.js');

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

test('character card grid preserves the full portrait artwork', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxml'),
    'utf8'
  );

  assert.match(template, /class="card-image[\s\S]*?mode="aspectFit"/);
});

test('character card grid reserves a top safe area for portrait faces', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/cards/cards.wxss'),
    'utf8'
  );

  assert.match(styles, /\.card-image\s*\{[\s\S]*?top:\s*16rpx;[\s\S]*?height:\s*calc\(100%\s*-\s*16rpx\)/);
});
