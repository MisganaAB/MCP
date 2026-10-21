import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = parseInt(process.env.PORT || '3000', 10);
export const MCP_DEMO_TOKEN = process.env.MCP_DEMO_TOKEN || 'mcp-secret-token-123';
export const MCP_ALLOWED_SCOPES = (process.env.MCP_ALLOWED_SCOPES || 'github:read,knowledge:read')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const MAX_AGENT_ITERATIONS = parseInt(process.env.MAX_AGENT_ITERATIONS || '5', 10);
export const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, '../knowledge_base');
