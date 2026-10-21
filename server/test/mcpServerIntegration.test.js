import test from 'node:test';
import assert from 'node:assert/strict';
import { createMcpServer } from '../src/mcp/server.js';

test('MCP Server Registration Tests', async (t) => {
  await t.test('creates server instance and registers tools, resources, and prompts', () => {
    const server = createMcpServer();
    assert.ok(server);
    assert.ok(server.server);

    // Verify tools registered
    assert.ok(server._registeredTools['search_github_repositories']);
    assert.ok(server._registeredTools['list_knowledge_base_files']);
    assert.ok(server._registeredTools['read_knowledge_base']);

    // Verify resources registered
    assert.ok(server._registeredResources['knowledge://mcp-primer']);
    assert.ok(server._registeredResources['knowledge://security-guide']);
    assert.ok(server._registeredResources['knowledge://course-faq']);

    // Verify prompts registered
    assert.ok(server._registeredPrompts['explain_mcp_concept']);
    assert.ok(server._registeredPrompts['analyze_github_repository']);
  });
});
