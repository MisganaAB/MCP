import { z } from 'zod';
import { GITHUB_TOKEN } from '../../config.js';
import { checkToolScope } from '../auth.js';

export const searchGithubRepositoriesTool = {
  name: 'search_github_repositories',
  config: {
    description: 'Search public repositories on GitHub by keywords or topic. Requires [github:read] scope.',
    inputSchema: {
      query: z.string().min(1).describe('The search query or topic (e.g. "model context protocol", "react vite")'),
      limit: z.number().int().min(1).max(20).default(5).describe('Maximum number of repositories to return (1-20)')
    }
  },
  handler: async ({ query, limit }, extra) => {
    // 1. Enforce authorization boundary
    const scopeCheck = checkToolScope(extra, 'github:read');
    if (!scopeCheck.allowed) {
      return {
        isError: true,
        content: [{ type: 'text', text: scopeCheck.error }]
      };
    }

    // 2. Fetch from GitHub API with safety timeout
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`;
      const headers = {
        'User-Agent': 'MCP-Learning-Assistant/1.0',
        'Accept': 'application/vnd.github.v3+json'
      };

      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 403) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: 'GitHub API rate limit exceeded. If you have a GitHub token, add GITHUB_TOKEN to server/.env to increase your limit to 5000 requests/hour.'
          }]
        };
      }

      if (!response.ok) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `GitHub API request failed with status ${response.status}: ${response.statusText}`
          }]
        };
      }

      const data = await response.json();
      const items = data.items || [];

      if (items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No repositories found matching query: "${query}"`
          }]
        };
      }

      const formatted = items.map((repo, idx) => {
        return `${idx + 1}. **${repo.full_name}**
   - Description: ${repo.description || 'No description provided'}
   - URL: ${repo.html_url}
   - Stars: ${repo.stargazers_count} | Language: ${repo.language || 'Unknown'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${data.total_count} repositories (showing top ${items.length}):\n\n${formatted}`
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Error fetching from GitHub API: ${error.message}`
        }]
      };
    }
  }
};
