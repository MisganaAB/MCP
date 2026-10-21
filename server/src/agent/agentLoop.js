import { mcpToolToGeminiFunction } from './gemini.js';

const DEFAULT_SYSTEM_INSTRUCTION = `You are an educational AI learning assistant for a university course on the Model Context Protocol (MCP).
You have access to MCP tools that can search public GitHub repositories and read local educational documents from a knowledge base.
When answering user questions:
1. Always use the available tools when asked about GitHub repositories or when seeking information from the local knowledge base.
2. Explain what tools you are using and why.
3. Be clear, concise, and beginner-friendly in your explanations.`;

/**
 * Executes the explicit, bounded agent reasoning loop.
 *
 * This loop does not hide execution behind abstractions:
 * 1. Discovers tools from the MCP Client.
 * 2. Translates MCP tool schemas into Gemini FunctionDeclarations.
 * 3. Sends prompt + tools to Gemini.
 * 4. If Gemini requests a tool call, executes the tool via MCP Client.
 * 5. Appends the tool result back into history.
 * 6. Repeats until Gemini generates a final text response, or bounds are hit.
 *
 * @param {object} options
 * @param {string} options.userPrompt - User's prompt message
 * @param {import('./mcpClient.js').CustomMcpClient} options.mcpClient - Connected custom MCP client
 * @param {import('@google/genai').GoogleGenAI|null} [options.geminiClient] - Gemini client
 * @param {string} [options.modelName] - Gemini model name (default: "gemini-3.8-flash")
 * @param {number} [options.maxIterations] - Maximum reasoning turns (default: 5)
 * @param {string} [options.systemInstruction] - Custom system instruction
 * @returns {Promise<{ reply: string, toolsUsed: Array<object>, iterations: number, bounded?: boolean }>}
 */
export async function runAgentLoop({
  userPrompt,
  mcpClient,
  geminiClient,
  modelName = 'gemini-3.8-flash',
  maxIterations = 5,
  systemInstruction = DEFAULT_SYSTEM_INSTRUCTION
}) {
  if (!userPrompt || typeof userPrompt !== 'string') {
    throw new Error('userPrompt must be a non-empty string.');
  }

  if (!mcpClient) {
    throw new Error('mcpClient is required.');
  }

  // 1. Ensure MCP client is connected
  if (!mcpClient.connected) {
    await mcpClient.connect();
  }

  // 2. Discover tools from MCP server
  const mcpTools = await mcpClient.listTools();
  const functionDeclarations = mcpTools.map(mcpToolToGeminiFunction);

  // 3. Initialize conversation history
  const contents = [
    {
      role: 'user',
      parts: [{ text: userPrompt }]
    }
  ];

  const toolsUsed = [];

  // Fallback simulator for offline testing or when GEMINI_API_KEY is not set
  if (!geminiClient) {
    return runSimulatedAgentLoop({ userPrompt, mcpClient, mcpTools });
  }

  // 4. Bounded reasoning and tool execution loop
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    // Call Gemini with current conversation history and available MCP tools
    const response = await geminiClient.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined
      }
    });

    const functionCalls = response.functionCalls;

    // Condition A: Gemini generated a final text reply (no more tool calls requested)
    if (!functionCalls || functionCalls.length === 0) {
      return {
        reply: response.text || 'No text output returned by model.',
        toolsUsed,
        iterations: iteration
      };
    }

    // Condition B: Gemini requested one or more tool calls
    // Append the model's functionCall turn to the history
    if (response.candidates?.[0]?.content) {
      contents.push(response.candidates[0].content);
    }

    for (const call of functionCalls) {
      const toolName = call.name;
      const toolArgs = call.args || {};

      let toolOutputText = '';
      let isError = false;

      try {
        const toolResult = await mcpClient.callTool(toolName, toolArgs);
        isError = !!toolResult.isError;
        toolOutputText = toolResult.content?.map(c => c.text).join('\n') || JSON.stringify(toolResult);
      } catch (err) {
        isError = true;
        toolOutputText = `Tool execution error: ${err.message}`;
      }

      toolsUsed.push({
        iteration,
        name: toolName,
        args: toolArgs,
        isError,
        snippet: toolOutputText.slice(0, 200)
      });

      // Append functionResponse to conversation history for Gemini to inspect
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolName,
              response: {
                result: toolOutputText
              }
            }
          }
        ]
      });
    }
  }

  // Condition C: Loop bound reached without final answer
  return {
    reply: `Notice: Reached the maximum execution limit of ${maxIterations} tool iterations without reaching a final response.`,
    toolsUsed,
    iterations: maxIterations,
    bounded: true
  };
}

/**
 * Educational fallback simulator allowing the loop to be tested without an active Gemini API key.
 */
async function runSimulatedAgentLoop({ userPrompt, mcpClient, mcpTools }) {
  const toolsUsed = [];
  const lower = userPrompt.toLowerCase();

  // If user asks for knowledge base or documents
  if (lower.includes('knowledge') || lower.includes('document') || lower.includes('primer') || lower.includes('faq')) {
    const listResult = await mcpClient.callTool('list_knowledge_base_files', {});
    toolsUsed.push({
      iteration: 1,
      name: 'list_knowledge_base_files',
      args: {},
      snippet: listResult.content?.[0]?.text?.slice(0, 150) || ''
    });

    const readResult = await mcpClient.callTool('read_knowledge_base', { filename: 'mcp_primer.md' });
    toolsUsed.push({
      iteration: 2,
      name: 'read_knowledge_base',
      args: { filename: 'mcp_primer.md' },
      snippet: readResult.content?.[0]?.text?.slice(0, 150) || ''
    });

    return {
      reply: `[Simulated Gemini Reply]: Based on the local knowledge base, the Model Context Protocol (MCP) connects AI models to external tools and resources.\n\n${readResult.content?.[0]?.text?.slice(0, 300)}...`,
      toolsUsed,
      iterations: 2
    };
  }

  // If user asks about github
  if (lower.includes('github') || lower.includes('repo')) {
    const ghResult = await mcpClient.callTool('search_github_repositories', { query: 'modelcontextprotocol', limit: 2 });
    toolsUsed.push({
      iteration: 1,
      name: 'search_github_repositories',
      args: { query: 'modelcontextprotocol', limit: 2 },
      snippet: ghResult.content?.[0]?.text?.slice(0, 150) || ''
    });

    return {
      reply: `[Simulated Gemini Reply]: Searched GitHub for repositories matching "modelcontextprotocol".\n\n${ghResult.content?.[0]?.text}`,
      toolsUsed,
      iterations: 1
    };
  }

  return {
    reply: `[Simulated Gemini Reply]: I am an educational MCP Assistant. Available tools on server: ${mcpTools.map(t => t.name).join(', ')}.`,
    toolsUsed: [],
    iterations: 1
  };
}
