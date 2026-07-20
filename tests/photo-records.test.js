const test = require('node:test');
const assert = require('node:assert/strict');
const records = require('../utils/photo-records.js');

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
