import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import mcpRoutes from '../src/routes/mcpRoutes.js';
import { MCP_DEMO_TOKEN } from '../src/config.js';

test('Streamable HTTP End-to-End Live Integration Tests', async (t) => {
  // 1. Spin up an isolated Express server on random port
  const app = express();
  app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id', 'last-event-id', 'accept'],
    exposedHeaders: ['mcp-session-id']
  }));
  app.use(express.json());
  app.use(mcpRoutes);

  let serverInstance;
  let serverPort;

  await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      serverPort = serverInstance.address().port;
      resolve();
    });
  });

  const baseUrl = `http://localhost:${serverPort}/mcp`;

  await t.test('unauthenticated client fails on protected tool execution', async () => {
    const unauthTransport = new StreamableHTTPClientTransport(new URL(baseUrl));
    const unauthClient = new Client({ name: 'unauth-test', version: '1.0.0' }, { capabilities: {} });

    await unauthClient.connect(unauthTransport);
    assert.ok(unauthTransport.sessionId);

    const result = await unauthClient.callTool({
      name: 'read_knowledge_base',
      arguments: { filename: 'mcp_primer.md' }
    });

    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Authentication required/);

    await unauthClient.close();
  });

  await t.test('authenticated client connects, discovers tools/resources/prompts, and executes tools', async () => {
    const authTransport = new StreamableHTTPClientTransport(
      new URL(baseUrl),
      {
        requestInit: {
          headers: {
            'Authorization': `Bearer ${MCP_DEMO_TOKEN}`
          }
        }
      }
    );
    const authClient = new Client({ name: 'auth-test', version: '1.0.0' }, { capabilities: {} });

    await authClient.connect(authTransport);
    assert.ok(authTransport.sessionId);

    // Verify tools listing
    const tools = await authClient.listTools();
    const toolNames = tools.tools.map(t => t.name);
    assert.ok(toolNames.includes('read_knowledge_base'));
    assert.ok(toolNames.includes('list_knowledge_base_files'));
    assert.ok(toolNames.includes('search_github_repositories'));

    // Verify resources listing
    const resources = await authClient.listResources();
    const resourceUris = resources.resources.map(r => r.uri);
    assert.ok(resourceUris.includes('knowledge://mcp-primer'));
    assert.ok(resourceUris.includes('knowledge://course-faq'));

    // Verify resource reading
    const resourceContent = await authClient.readResource({ uri: 'knowledge://mcp-primer' });
    assert.match(resourceContent.contents[0].text, /Model Context Protocol/);

    // Verify prompts listing
    const prompts = await authClient.listPrompts();
    const promptNames = prompts.prompts.map(p => p.name);
    assert.ok(promptNames.includes('explain_mcp_concept'));

    // Verify prompt rendering
    const prompt = await authClient.getPrompt({
      name: 'explain_mcp_concept',
      arguments: { concept: 'tools' }
    });
    assert.ok(prompt.messages.length > 0);
    assert.match(prompt.messages[0].content.text, /explain the concept of "tools"/);

    // Verify tool execution
    const readResult = await authClient.callTool({
      name: 'read_knowledge_base',
      arguments: { filename: 'course_faq.json' }
    });
    assert.equal(readResult.isError, undefined);
    assert.match(readResult.content[0].text, /faq/);

    await authClient.close();
  });

  // Teardown test server
  await new Promise((resolve) => serverInstance.close(resolve));
});
