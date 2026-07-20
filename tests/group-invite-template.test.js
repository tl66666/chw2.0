const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('invite modal identifies the group and offers share plus copy actions', () => {
  const template = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/pages/group/group.wxml'),
    'utf8'
  );

  assert.match(template, /class="invite-group-name"/);
  assert.match(template, /bindtap="copyInviteCode"/);
  assert.doesNotMatch(template, /open-type="share"/);
});
