import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import cors from 'cors';
import { mcpToolToGeminiFunction } from '../src/agent/gemini.js';
import { CustomMcpClient } from '../src/agent/mcpClient.js';
import { runAgentLoop } from '../src/agent/agentLoop.js';
import mcpRoutes from '../src/routes/mcpRoutes.js';
import { MCP_DEMO_TOKEN } from '../src/config.js';

test('Gemini Tool Schema Translation Tests', async (t) => {
  await t.test('translates MCP tool definition to Gemini functionDeclaration format', () => {
    const mcpTool = {
      name: 'read_knowledge_base',
      description: 'Reads a file from the knowledge base',
      inputSchema: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'Name of the file'
          },
          count: {
            type: 'number',
            description: 'Number of lines'
          }
        },
        required: ['filename']
      }
    };

    const geminiDeclaration = mcpToolToGeminiFunction(mcpTool);

    assert.equal(geminiDeclaration.name, 'read_knowledge_base');
    assert.equal(geminiDeclaration.description, 'Reads a file from the knowledge base');
    assert.equal(geminiDeclaration.parameters.type, 'OBJECT');
    assert.equal(geminiDeclaration.parameters.properties.filename.type, 'STRING');
    assert.equal(geminiDeclaration.parameters.properties.count.type, 'NUMBER');
    assert.deepEqual(geminiDeclaration.parameters.required, ['filename']);
  });

  await t.test('throws error if tool missing name', () => {
    assert.throws(() => mcpToolToGeminiFunction({}), /missing name/);
  });
});

test('CustomMcpClient & Bounded Agent Loop Tests', async (t) => {
  // Spin up an ephemeral Express server for isolated client-loop testing
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

  const serverUrl = `http://localhost:${serverPort}/mcp`;

  await t.test('CustomMcpClient connects and lists tools with demo token', async () => {
    const client = new CustomMcpClient({
      serverUrl,
      bearerToken: MCP_DEMO_TOKEN
    });

    await client.connect();
    assert.equal(client.connected, true);

    const tools = await client.listTools();
    assert.ok(tools.length >= 3);
    assert.ok(tools.some(t => t.name === 'read_knowledge_base'));

    await client.disconnect();
    assert.equal(client.connected, false);
  });

  await t.test('runAgentLoop terminates safely at maxIterations when tools keep being called (Bounded Loop)', async () => {
    const client = new CustomMcpClient({
      serverUrl,
      bearerToken: MCP_DEMO_TOKEN
    });
    await client.connect();

    // Mock Gemini client that always returns a function call (simulating an infinite loop)
    let callCount = 0;
    const mockGeminiClient = {
      models: {
        generateContent: async () => {
          callCount++;
          return {
            functionCalls: [
              {
                name: 'list_knowledge_base_files',
                args: {}
              }
            ],
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ functionCall: { name: 'list_knowledge_base_files', args: {} } }]
                }
              }
            ]
          };
        }
      }
    };

    const maxIterations = 3;
    const result = await runAgentLoop({
      userPrompt: 'Loop test prompt',
      mcpClient: client,
      geminiClient: mockGeminiClient,
      maxIterations
    });

    assert.equal(result.bounded, true);
    assert.equal(result.iterations, maxIterations);
    assert.equal(callCount, maxIterations);
    assert.equal(result.toolsUsed.length, maxIterations);
    assert.match(result.reply, /maximum execution limit/);

    await client.disconnect();
  });

  await t.test('runAgentLoop completes successfully when Gemini outputs text after tool call', async () => {
    const client = new CustomMcpClient({
      serverUrl,
      bearerToken: MCP_DEMO_TOKEN
    });
    await client.connect();

    // Mock Gemini client: iteration 1 requests tool, iteration 2 outputs final text
    let turn = 0;
    const mockGeminiClient = {
      models: {
        generateContent: async ({ contents }) => {
          turn++;
          if (turn === 1) {
            return {
              functionCalls: [
                {
                  name: 'read_knowledge_base',
                  args: { filename: 'course_faq.json' }
                }
              ],
              candidates: [
                {
                  content: {
                    role: 'model',
                    parts: [{ functionCall: { name: 'read_knowledge_base', args: { filename: 'course_faq.json' } } }]
                  }
                }
              ]
            };
          } else {
            // Verify that the tool output was fed into contents for turn 2
            const lastMessage = contents[contents.length - 1];
            assert.equal(lastMessage.role, 'user');
            assert.ok(lastMessage.parts[0].functionResponse);

            return {
              text: 'According to the FAQ, MCP tools are executable functions and resources are passive data attachments.',
              functionCalls: undefined
            };
          }
        }
      }
    };

    const result = await runAgentLoop({
      userPrompt: 'What is the difference between tools and resources?',
      mcpClient: client,
      geminiClient: mockGeminiClient,
      maxIterations: 5
    });

    assert.equal(result.bounded, undefined);
    assert.equal(result.iterations, 2);
    assert.equal(result.toolsUsed.length, 1);
    assert.equal(result.toolsUsed[0].name, 'read_knowledge_base');
    assert.match(result.reply, /According to the FAQ/);

    await client.disconnect();
  });

  await t.test('runAgentLoop runs simulated offline fallback when geminiClient is null', async () => {
    const client = new CustomMcpClient({
      serverUrl,
      bearerToken: MCP_DEMO_TOKEN
    });
    await client.connect();

    const result = await runAgentLoop({
      userPrompt: 'Tell me about the MCP primer document in the knowledge base',
      mcpClient: client,
      geminiClient: null // offline test
    });

    assert.ok(result.reply);
    assert.ok(result.toolsUsed.length >= 1);
    assert.match(result.reply, /Simulated Gemini Reply/);

    await client.disconnect();
  });

  // Teardown
  await new Promise((resolve) => serverInstance.close(resolve));
});
