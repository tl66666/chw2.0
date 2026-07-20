const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('production pages no longer retain unsafe deletion or leave handlers', () => {
  const sources = [
    '城会玩2.0/pages/album/album.js',
    '城会玩2.0/pages/group/group.js',
    '城会玩2.0/cloudfunctions/group/index.js'
  ].map(file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8')).join('\n');

  assert.doesNotMatch(sources, /Unsafe/);
  assert.doesNotMatch(sources, /buildLocalActivities/);
  assert.doesNotMatch(sources, /syncMyStats/);
  assert.doesNotMatch(sources, /syncMyPhotosToGroup/);
  assert.doesNotMatch(sources, /getUserStats/);
  assert.doesNotMatch(sources, /syncMemberStats/);
});
