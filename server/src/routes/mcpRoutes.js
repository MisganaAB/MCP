import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from '../mcp/server.js';
import { parseBearerToken } from '../mcp/auth.js';

const router = Router();

// In-memory session store mapping sessionId -> { transport, server, authInfo, open, lastActive }
const sessions = new Map();

/**
 * Tracks in-flight responses so long-lived SSE connections are not prematurely closed as idle.
 */
function trackResponse(session, res) {
  if (!res.socket || res.destroyed) return;
  session.open = (session.open || 0) + 1;
  res.on('close', () => {
    session.open = Math.max(0, (session.open || 1) - 1);
    session.lastActive = Date.now();
  });
}

// Stale session cleanup timer (every 60s, closes sessions idle for > 30 minutes)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - IDLE_TIMEOUT_MS;
  for (const [sid, session] of sessions.entries()) {
    if ((session.open || 0) === 0 && session.lastActive < cutoff) {
      console.error(`[MCP Session] Closing inactive session: ${sid}`);
      session.transport.close().catch(console.error);
      sessions.delete(sid);
    }
  }
}, 60000).unref();

/**
 * Streamable HTTP route handler (Protocol Version 2025-11-25)
 * Handles GET, POST, and DELETE requests at /mcp
 */
router.all('/mcp', async (req, res) => {
  try {
    // 1. Authenticate incoming request at the server gateway
    const authInfo = parseBearerToken(req.headers.authorization);
    if (authInfo) {
      req.auth = authInfo;
    }

    const sessionId = req.headers['mcp-session-id'];
    const session = sessionId ? sessions.get(sessionId) : undefined;

    let transport;

    if (session) {
      // Existing active session
      transport = session.transport;

      // Inherit initial session authInfo if subsequent request omits Authorization header
      if (!req.auth && session.authInfo) {
        req.auth = session.authInfo;
      }

      trackResponse(session, res);
    } else if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
      // Client is initiating a new stateful Streamable HTTP session
      let createdServer;

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          sessions.set(newSessionId, {
            transport,
            server: createdServer,
            authInfo: req.auth,
            open: 0,
            lastActive: Date.now()
          });
        }
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && sessions.has(sid)) {
          sessions.delete(sid);
        }
      };

      createdServer = createMcpServer();
      await createdServer.connect(transport);
    } else if (sessionId) {
      // Session ID was provided but not found in active sessions
      return res.status(404).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Session not found. Please re-initialize.' },
        id: null
      });
    } else {
      // Missing session ID and not an initialize request
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: No valid session ID provided and not an initialize request.' },
        id: null
      });
    }

    // Delegate handling to the official StreamableHTTPServerTransport
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('[MCP Transport Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null
      });
    }
  }
});

export default router;
export { sessions };
