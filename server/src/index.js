import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';
import mcpRoutes from './routes/mcpRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();

// Enable CORS for client apps and MCP Inspector
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id', 'last-event-id', 'accept'],
  exposedHeaders: ['mcp-session-id']
}));

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use(mcpRoutes);
app.use(chatRoutes);

// Simple healthcheck endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mcp-learning-server',
    transport: 'Streamable HTTP (protocol 2025-11-25)',
    endpoint: '/mcp',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.error(`[MCP Server] Server listening on http://localhost:${PORT}`);
  console.error(`[MCP Server] Streamable HTTP endpoint ready at: http://localhost:${PORT}/mcp`);
  console.error(`[MCP Server] Health check available at: http://localhost:${PORT}/health`);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.error('[MCP Server] Shutting down...');
  server.close(() => {
    console.error('[MCP Server] Server stopped cleanly.');
    process.exit(0);
  });
});
