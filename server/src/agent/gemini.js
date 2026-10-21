import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '../config.js';

/**
 * Initializes and returns a GoogleGenAI client instance if an API key is configured.
 *
 * @param {string} [apiKey] - Optional explicit API key
 * @returns {GoogleGenAI|null}
 */
export function getGeminiClient(apiKey = GEMINI_API_KEY) {
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Translates an MCP Tool schema (JSON Schema) into Gemini's FunctionDeclaration format.
 *
 * MCP Tool structure:
 * {
 *   name: "read_knowledge_base",
 *   description: "...",
 *   inputSchema: { type: "object", properties: {...}, required: [...] }
 * }
 *
 * Gemini FunctionDeclaration structure:
 * {
 *   name: "read_knowledge_base",
 *   description: "...",
 *   parameters: { type: "OBJECT", properties: {...}, required: [...] }
 * }
 *
 * @param {object} mcpTool - An MCP tool descriptor from client.listTools()
 * @returns {object} Gemini-compatible FunctionDeclaration
 */
export function mcpToolToGeminiFunction(mcpTool) {
  if (!mcpTool || !mcpTool.name) {
    throw new Error('Invalid MCP tool: missing name.');
  }

  const parameters = mcpTool.inputSchema && typeof mcpTool.inputSchema === 'object'
    ? sanitizeSchema(mcpTool.inputSchema)
    : { type: 'OBJECT', properties: {} };

  return {
    name: mcpTool.name,
    description: mcpTool.description || `Tool ${mcpTool.name}`,
    parameters
  };
}

/**
 * Normalizes JSON Schema property types into uppercase types (STRING, NUMBER, etc.)
 * as expected by Gemini's function declaration parser.
 */
function sanitizeSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const result = { ...schema };

  if (typeof result.type === 'string') {
    result.type = result.type.toUpperCase();
  }

  if (result.properties && typeof result.properties === 'object') {
    const newProps = {};
    for (const [key, prop] of Object.entries(result.properties)) {
      newProps[key] = sanitizeSchema(prop);
    }
    result.properties = newProps;
  }

  if (result.items && typeof result.items === 'object') {
    result.items = sanitizeSchema(result.items);
  }

  // Remove JSON Schema metadata keys not supported by Gemini's schema parser
  delete result.$schema;
  delete result.additionalProperties;

  return result;
}
