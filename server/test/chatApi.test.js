import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import mcpRoutes from '../src/routes/mcpRoutes.js';
import chatRoutes from '../src/routes/chatRoutes.js';
import { MCP_DEMO_TOKEN } from '../src/config.js';

test('Chat API Route (/api/chat) Integration Tests', async (t) => {
  const app = express();
  app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id', 'last-event-id', 'accept'],
    exposedHeaders: ['mcp-session-id']
  }));
  app.use(express.json());
  app.use(mcpRoutes);
  app.use(chatRoutes);

  let serverInstance;
  let serverPort;

  await new Promise((resolve) => {
    serverInstance = app.listen(0, () => {
      serverPort = serverInstance.address().port;
      resolve();
    });
  });

  const apiUrl = `http://localhost:${serverPort}/api/chat`;

  await t.test('POST /api/chat rejects missing message with 400 Bad Request', async () => {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /must be a non-empty string/);
  });

  await t.test('POST /api/chat processes message and returns agent reply and tool trace', async () => {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about the documents in the knowledge base',
        bearerToken: MCP_DEMO_TOKEN
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.reply);
    assert.ok(Array.isArray(data.toolsUsed));
    assert.ok(data.iterations >= 1);
  });

  // Teardown
  await new Promise((resolve) => serverInstance.close(resolve));
});
