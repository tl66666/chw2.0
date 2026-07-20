const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../城会玩2.0');

test('province check-in uses curated landmarks instead of the first three city names', () => {
  const highlights = require('../城会玩2.0/utils/province-highlights.js');

  assert.deepEqual(highlights.getProvinceHighlights('shaanxi'), ['兵马俑', '华山', '黄河壶口瀑布']);
  assert.deepEqual(highlights.getProvinceHighlights('sichuan'), ['九寨沟', '都江堰', '峨眉山']);
});

test('photo sync feedback never exposes cloud-function deployment instructions to travelers', () => {
  const cityDetail = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.js'), 'utf8');
  const upload = fs.readFileSync(path.join(root, 'package-album/pages/upload/upload.js'), 'utf8');

  assert.doesNotMatch(cityDetail, /重新部署\s*contentSecurity\s*云函数/);
  assert.doesNotMatch(upload, /重新部署\s*contentSecurity\s*云函数/);
});

test('character grid fills the card without aspect-fit side gutters', () => {
  const template = fs.readFileSync(path.join(root, 'pages/cards/cards.wxml'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'pages/cards/cards.wxss'), 'utf8');

  assert.match(template, /class="card-image[\s\S]*?mode="aspectFill"/);
  assert.match(styles, /\.card-image\s*\{[\s\S]*?top:\s*18rpx;[\s\S]*?height:\s*100%/);
});

test('city detail uses two balanced travel actions without hidden divider space', () => {
  const template = fs.readFileSync(path.join(root, 'pages/city-detail/city-detail.wxml'), 'utf8');

  assert.match(template, /class="quick-action-main/);
  assert.match(template, /class="quick-action-card/);
  assert.doesNotMatch(template, /action-divider/);
});
