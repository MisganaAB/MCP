import { z } from 'zod';

/**
 * Registers MCP prompts on an McpServer instance.
 * Prompts are reusable conversation templates with typed arguments that guide AI models.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerKnowledgePrompts(server) {
  // Prompt 1: Explain an MCP Concept
  server.registerPrompt(
    'explain_mcp_concept',
    {
      description: 'Generates a guided learning prompt explaining a specific Model Context Protocol concept',
      argsSchema: {
        concept: z.string().describe('The MCP concept to explain (e.g. "tools", "resources", "prompts", "streamable http")')
      }
    },
    async ({ concept }) => {
      return {
        description: `Explanation of ${concept}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are an expert tutor teaching a university course on Model Context Protocol (MCP).
Please explain the concept of "${concept}" in clear, beginner-friendly terms:
1. What problem does it solve?
2. How does it work under the hood?
3. How does it contrast with other MCP primitives?
4. Provide a practical code or JSON-RPC example.`
            }
          }
        ]
      };
    }
  );

  // Prompt 2: Analyze a GitHub Repository
  server.registerPrompt(
    'analyze_github_repository',
    {
      description: 'Generates a structured prompt to research and analyze a GitHub repository using MCP tools',
      argsSchema: {
        repository: z.string().describe('Repository name or keywords to research (e.g. "modelcontextprotocol/sdk")')
      }
    },
    async ({ repository }) => {
      return {
        description: `Analyze GitHub repository: ${repository}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please research the GitHub repository "${repository}".
Use the available "search_github_repositories" tool to locate the project, then summarize:
1. What the project does.
2. Popularity and stars.
3. Primary language and architecture.
4. How developers integrate it into their systems.`
            }
          }
        ]
      };
    }
  );
}
