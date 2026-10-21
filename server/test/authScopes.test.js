import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBearerToken, checkToolScope } from '../src/mcp/auth.js';
import { MCP_DEMO_TOKEN, MCP_ALLOWED_SCOPES } from '../src/config.js';

test('Authentication and Scope Tests', async (t) => {
  await t.test('parseBearerToken rejects missing or malformed headers', () => {
    assert.equal(parseBearerToken(undefined), null);
    assert.equal(parseBearerToken(''), null);
    assert.equal(parseBearerToken('Basic dXNlcjpwYXNz'), null);
    assert.equal(parseBearerToken('Bearer'), null);
    assert.equal(parseBearerToken('Bearer wrong-token'), null);
  });

  await t.test('parseBearerToken accepts valid demo token and returns scopes', () => {
    const authInfo = parseBearerToken(`Bearer ${MCP_DEMO_TOKEN}`);
    assert.ok(authInfo);
    assert.equal(authInfo.token, MCP_DEMO_TOKEN);
    assert.equal(authInfo.clientId, 'mcp-learning-client');
    assert.deepEqual(authInfo.scopes, MCP_ALLOWED_SCOPES);
  });

  await t.test('checkToolScope blocks calls when extra or authInfo is missing', () => {
    const check1 = checkToolScope(undefined, 'knowledge:read');
    assert.equal(check1.allowed, false);
    assert.match(check1.error, /Authentication required/);

    const check2 = checkToolScope({}, 'knowledge:read');
    assert.equal(check2.allowed, false);
    assert.match(check2.error, /Authentication required/);
  });

  await t.test('checkToolScope blocks calls when required scope is missing from token', () => {
    const extraWithLimitedScopes = {
      authInfo: {
        token: 'test',
        clientId: 'client-1',
        scopes: ['github:read'] // missing 'knowledge:read'
      }
    };

    const check = checkToolScope(extraWithLimitedScopes, 'knowledge:read');
    assert.equal(check.allowed, false);
    assert.match(check.error, /Forbidden: Token lacks required scope \[knowledge:read\]/);
  });

  await t.test('checkToolScope permits calls when required scope is present', () => {
    const extraWithValidScopes = {
      authInfo: {
        token: 'test',
        clientId: 'client-1',
        scopes: ['github:read', 'knowledge:read']
      }
    };

    const check = checkToolScope(extraWithValidScopes, 'knowledge:read');
    assert.equal(check.allowed, true);
    assert.equal(check.error, undefined);
  });
});
