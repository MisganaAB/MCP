import { Router } from 'express';
import { CustomMcpClient } from '../agent/mcpClient.js';
import { getGeminiClient } from '../agent/gemini.js';
import { runAgentLoop } from '../agent/agentLoop.js';
import { PORT, MAX_AGENT_ITERATIONS } from '../config.js';

const router = Router();

/**
 * POST /api/chat
 * Chat endpoint called by the React UI.
 *
 * Request body:
 * {
 *   message: string,
 *   bearerToken?: string
 * }
 *
 * Response:
 * {
 *   reply: string,
 *   toolsUsed: Array<{ name: string, args: object, iteration: number, isError: boolean, snippet: string }>,
 *   iterations: number,
 *   bounded?: boolean
 * }
 */
router.post('/api/chat', async (req, res) => {
  const { message, bearerToken } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Field "message" must be a non-empty string.' });
  }

  // Dynamically resolve MCP server URL based on the current server's host and port
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol || 'http';
  const serverUrl = `${protocol}://${host}/mcp`;

  // Create an MCP client for this user request using their bearer token
  const mcpClient = new CustomMcpClient({
    serverUrl,
    bearerToken: bearerToken || ''
  });

  try {
    const geminiClient = getGeminiClient();

    const result = await runAgentLoop({
      userPrompt: message.trim(),
      mcpClient,
      geminiClient,
      maxIterations: MAX_AGENT_ITERATIONS
    });

    res.json(result);
  } catch (error) {
    console.error('[API Chat Error]:', error);
    res.status(500).json({
      error: 'Failed to process chat message.',
      details: error.message
    });
  } finally {
    await mcpClient.disconnect();
  }
});

export default router;
