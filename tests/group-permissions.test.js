const test = require('node:test');
const assert = require('node:assert/strict');
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
