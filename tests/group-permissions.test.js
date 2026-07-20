const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const permissions = require('../城会玩2.0/cloudfunctions/group/permissions.js');

test('only the uploader can remove a shared group photo', () => {
  assert.equal(permissions.canRemoveSharedPhoto({ openid: 'owner' }, 'owner'), true);
  assert.equal(permissions.canRemoveSharedPhoto({ openid: 'owner' }, 'member'), false);
});

test('a creator must transfer an active group before leaving', () => {
  assert.equal(permissions.canLeaveGroup({ creatorOpenid: 'owner' }, 'owner', 2), false);
  assert.equal(permissions.canLeaveGroup({ creatorOpenid: 'owner' }, 'owner', 1), true);
  assert.equal(permissions.canLeaveGroup({ creatorOpenid: 'owner' }, 'member', 2), true);
});

test('a transfer target must be a different existing member', () => {
  assert.equal(permissions.canTransferOwnership('owner', 'member', ['owner', 'member']), true);
  assert.equal(permissions.canTransferOwnership('owner', 'owner', ['owner', 'member']), false);
  assert.equal(permissions.canTransferOwnership('owner', 'other', ['owner', 'member']), false);
});

test('a city sync requires membership in the target group', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../城会玩2.0/cloudfunctions/group/index.js'),
    'utf8'
  );
  const syncSingleCity = source.slice(
    source.indexOf('async function syncSingleCity'),
    source.indexOf('async function shareGroupPhoto')
  );

  assert.match(syncSingleCity, /where\(\{\s*openid,\s*groupId:\s*data\.groupId\s*\}\)/);
  assert.match(syncSingleCity, /if \(!member\) return \{ success: false, error: 'NOT_A_MEMBER' \}/);
});
