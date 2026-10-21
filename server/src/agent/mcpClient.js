import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { PORT } from '../config.js';

/**
 * Custom MCP Client wrapper demonstrating explicit protocol interaction.
 * Uses StreamableHTTPClientTransport over http://localhost:PORT/mcp.
 */
export class CustomMcpClient {
  /**
   * @param {object} options
   * @param {string} [options.serverUrl] - The Streamable HTTP server URL
   * @param {string} [options.bearerToken] - Optional Bearer token for protected scopes
   * @param {string} [options.clientName] - Client identification
   */
  constructor({
    serverUrl = `http://localhost:${PORT}/mcp`,
    bearerToken = '',
    clientName = 'mcp-learning-agent-client'
  } = {}) {
    this.serverUrl = serverUrl;
    this.bearerToken = bearerToken;
    this.clientName = clientName;
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  /**
   * Connects to the MCP Server over Streamable HTTP.
   */
  async connect() {
    if (this.connected) return;

    const requestHeaders = {};
    if (this.bearerToken) {
      requestHeaders['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    this.transport = new StreamableHTTPClientTransport(
      new URL(this.serverUrl),
      {
        requestInit: {
          headers: requestHeaders
        }
      }
    );

    this.client = new Client(
      {
        name: this.clientName,
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    await this.client.connect(this.transport);
    this.connected = true;
  }

  /**
   * Queries the server for all registered tools.
   */
  async listTools() {
    this._ensureConnected();
    const result = await this.client.listTools();
    return result.tools || [];
  }

  /**
   * Invokes a specific tool on the MCP server with arguments.
   *
   * @param {string} name - Tool name
   * @param {object} [args] - Tool arguments matching inputSchema
   * @returns {Promise<{ isError?: boolean, content: Array<{ type: string, text: string }> }>}
   */
  async callTool(name, args = {}) {
    this._ensureConnected();
    return await this.client.callTool({
      name,
      arguments: args
    });
  }

  /**
   * Queries the server for all registered resources.
   */
  async listResources() {
    this._ensureConnected();
    const result = await this.client.listResources();
    return result.resources || [];
  }

  /**
   * Reads a specific resource by URI.
   *
   * @param {string} uri - Resource URI (e.g. "knowledge://mcp-primer")
   */
  async readResource(uri) {
    this._ensureConnected();
    return await this.client.readResource({ uri });
  }

  /**
   * Queries the server for all registered prompt templates.
   */
  async listPrompts() {
    this._ensureConnected();
    const result = await this.client.listPrompts();
    return result.prompts || [];
  }

  /**
   * Retrieves a prompt template rendered with specific arguments.
   *
   * @param {string} name - Prompt name
   * @param {object} [args] - Prompt arguments
   */
  async getPrompt(name, args = {}) {
    this._ensureConnected();
    return await this.client.getPrompt({ name, arguments: args });
  }

  /**
   * Disconnects the transport and shuts down the client session.
   */
  async disconnect() {
    if (!this.connected) return;
    try {
      await this.client?.close();
    } catch {
      // Ignore cleanup errors
    } finally {
      this.connected = false;
      this.client = null;
      this.transport = null;
    }
  }

  _ensureConnected() {
    if (!this.connected || !this.client) {
      throw new Error('CustomMcpClient is not connected. Call await client.connect() first.');
    }
  }
}
