import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchGithubRepositoriesTool } from './tools/githubTools.js';
import { listKnowledgeBaseFilesTool, readKnowledgeBaseTool } from './tools/knowledgeTools.js';
import { registerKnowledgeResources } from './resources.js';
import { registerKnowledgePrompts } from './prompts.js';

/**
 * Creates and configures a new McpServer instance with all registered tools, resources, and prompts.
 *
 * @returns {McpServer} Fully initialized MCP Server
 */
export function createMcpServer() {
  const server = new McpServer(
    {
      name: 'mcp-learning-assistant-server',
      version: '1.0.0'
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  // Register Tools
  server.registerTool(
    searchGithubRepositoriesTool.name,
    searchGithubRepositoriesTool.config,
    searchGithubRepositoriesTool.handler
  );

  server.registerTool(
    listKnowledgeBaseFilesTool.name,
    listKnowledgeBaseFilesTool.config,
    listKnowledgeBaseFilesTool.handler
  );

  server.registerTool(
    readKnowledgeBaseTool.name,
    readKnowledgeBaseTool.config,
    readKnowledgeBaseTool.handler
  );

  // Register Resources (knowledge:// URIs)
  registerKnowledgeResources(server);

  // Register Prompts (reusable guided templates)
  registerKnowledgePrompts(server);

  return server;
}
