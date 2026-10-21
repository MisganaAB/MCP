import path from 'node:path';
import fs from 'node:fs/promises';
import { KNOWLEDGE_BASE_DIR } from '../config.js';

/**
 * Registers MCP resources on an McpServer instance.
 * Resources provide read-only contextual documents accessible via URIs.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerKnowledgeResources(server) {
  // Static Resource 1: MCP Primer
  server.registerResource(
    'mcp-primer',
    'knowledge://mcp-primer',
    {
      description: 'Comprehensive educational guide to the Model Context Protocol architecture',
      mimeType: 'text/markdown'
    },
    async (uri) => {
      const filePath = path.join(KNOWLEDGE_BASE_DIR, 'mcp_primer.md');
      const text = await fs.readFile(filePath, 'utf-8');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/markdown',
          text
        }]
      };
    }
  );

  // Static Resource 2: Security Guide
  server.registerResource(
    'security-guide',
    'knowledge://security-guide',
    {
      description: 'Security and hardening guide covering path traversal, scope checks, and bounded execution',
      mimeType: 'text/markdown'
    },
    async (uri) => {
      const filePath = path.join(KNOWLEDGE_BASE_DIR, 'security_guide.md');
      const text = await fs.readFile(filePath, 'utf-8');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/markdown',
          text
        }]
      };
    }
  );

  // Static Resource 3: Course FAQ
  server.registerResource(
    'course-faq',
    'knowledge://course-faq',
    {
      description: 'Frequently asked questions about MCP and assignment requirements',
      mimeType: 'application/json'
    },
    async (uri) => {
      const filePath = path.join(KNOWLEDGE_BASE_DIR, 'course_faq.json');
      const text = await fs.readFile(filePath, 'utf-8');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text
        }]
      };
    }
  );
}
