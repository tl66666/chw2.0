const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '../城会玩2.0');

test('group page exposes travel plan creation, voting, and city-filtered photos', () => {
  const template = fs.readFileSync(path.join(root, 'pages/group/group.wxml'), 'utf8');

  assert.match(template, /bindtap="showPlanModal"/);
  assert.match(template, /bindtap="togglePlanVote"/);
  assert.match(template, /bindtap="selectPhotoCity"/);
  assert.match(template, /catchtap="toggleFeaturedPhoto"/);
});

test('group cloud function supports plans and featured photo actions', () => {
  const source = fs.readFileSync(path.join(root, 'cloudfunctions/group/index.js'), 'utf8');

  assert.match(source, /action === 'createTravelPlan'/);
  assert.match(source, /action === 'toggleTravelPlanVote'/);
  assert.match(source, /action === 'setFeaturedPhoto'/);
  assert.match(source, /collection\('group_trip_plans'\)/);
  assert.match(source, /collection\('group_plan_votes'\)/);
  assert.match(source, /START_AFTER_END/);
});
