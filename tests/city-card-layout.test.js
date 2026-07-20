const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../城会玩2.0');

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
