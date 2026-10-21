import test from 'node:test';
import assert from 'node:assert/strict';
import { readKnowledgeBaseTool, listKnowledgeBaseFilesTool } from '../src/mcp/tools/knowledgeTools.js';
import { searchGithubRepositoriesTool } from '../src/mcp/tools/githubTools.js';

const validKnowledgeExtra = {
  authInfo: {
    token: 'test',
    clientId: 'test-client',
    scopes: ['knowledge:read']
  }
};

const validGithubExtra = {
  authInfo: {
    token: 'test',
    clientId: 'test-client',
    scopes: ['github:read']
  }
};

test('Tool Execution and Security Boundary Tests', async (t) => {
  await t.test('read_knowledge_base fails when unauthenticated', async () => {
    const result = await readKnowledgeBaseTool.handler({ filename: 'mcp_primer.md' }, {});
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Authentication required/);
  });

  await t.test('read_knowledge_base succeeds when authorized and reads file', async () => {
    const result = await readKnowledgeBaseTool.handler({ filename: 'mcp_primer.md' }, validKnowledgeExtra);
    assert.equal(result.isError, undefined);
    assert.match(result.content[0].text, /Model Context Protocol/);
  });

  await t.test('read_knowledge_base returns error when file does not exist', async () => {
    const result = await readKnowledgeBaseTool.handler({ filename: 'nonexistent_file.md' }, validKnowledgeExtra);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Error reading document/);
  });

  await t.test('list_knowledge_base_files fails when unauthenticated', async () => {
    const result = await listKnowledgeBaseFilesTool.handler({}, {});
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Authentication required/);
  });

  await t.test('list_knowledge_base_files succeeds when authorized', async () => {
    const result = await listKnowledgeBaseFilesTool.handler({}, validKnowledgeExtra);
    assert.equal(result.isError, undefined);
    assert.match(result.content[0].text, /mcp_primer\.md/);
    assert.match(result.content[0].text, /course_faq\.json/);
  });

  await t.test('search_github_repositories fails without github:read scope', async () => {
    const result = await searchGithubRepositoriesTool.handler({ query: 'express', limit: 3 }, validKnowledgeExtra); // has only knowledge:read
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Forbidden: Token lacks required scope \[github:read\]/);
  });

  await t.test('search_github_repositories executes when authorized', async () => {
    const result = await searchGithubRepositoriesTool.handler({ query: 'modelcontextprotocol', limit: 2 }, validGithubExtra);
    assert.ok(result.content && result.content[0].text);
    // Either found repos or gave a clean message
    assert.ok(result.content[0].text.length > 0);
  });
});
