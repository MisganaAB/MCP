import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveSafeKnowledgePath } from '../src/mcp/tools/knowledgeTools.js';
import { KNOWLEDGE_BASE_DIR } from '../src/config.js';

test('Path Traversal Security Tests', async (t) => {
  await t.test('resolves legitimate markdown files inside knowledge base', async () => {
    const resolved = await resolveSafeKnowledgePath('mcp_primer.md');
    assert.equal(resolved, path.resolve(KNOWLEDGE_BASE_DIR, 'mcp_primer.md'));
  });

  await t.test('resolves legitimate JSON files inside knowledge base', async () => {
    const resolved = await resolveSafeKnowledgePath('course_faq.json');
    assert.equal(resolved, path.resolve(KNOWLEDGE_BASE_DIR, 'course_faq.json'));
  });

  await t.test('blocks parent directory traversal attacks using relative syntax', async () => {
    // path.basename will reduce '../../package.json' to 'package.json',
    // which has an allowed extension (.json) but we check if it stays inside KNOWLEDGE_BASE_DIR
    const resolved = await resolveSafeKnowledgePath('../../package.json');
    // It must resolve inside KNOWLEDGE_BASE_DIR, NOT in server/ or root/
    assert.ok(resolved.startsWith(KNOWLEDGE_BASE_DIR));
    assert.equal(path.basename(resolved), 'package.json');
  });

  await t.test('rejects unauthorized file extensions', async () => {
    await assert.rejects(
      () => resolveSafeKnowledgePath('server.js'),
      /Only \.md and \.json files can be accessed/
    );

    await assert.rejects(
      () => resolveSafeKnowledgePath('../config.js'),
      /Only \.md and \.json files can be accessed/
    );

    await assert.rejects(
      () => resolveSafeKnowledgePath('malicious.exe'),
      /Only \.md and \.json files can be accessed/
    );
  });

  await t.test('rejects null byte injection', async () => {
    await assert.rejects(
      () => resolveSafeKnowledgePath('mcp_primer.md\0.exe'),
      /Invalid null byte in path/
    );
  });

  await t.test('rejects empty or non-string filenames', async () => {
    await assert.rejects(
      () => resolveSafeKnowledgePath(''),
      /Filename must be a non-empty string/
    );
    await assert.rejects(
      () => resolveSafeKnowledgePath(null),
      /Filename must be a non-empty string/
    );
  });
});
