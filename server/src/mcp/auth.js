import { MCP_DEMO_TOKEN, MCP_ALLOWED_SCOPES } from '../config.js';

/**
 * Validates an incoming HTTP Authorization header against the configured demo token.
 *
 * NOTE: This is an educational pre-shared Bearer token check, NOT full OAuth 2.1.
 *
 * @param {string|undefined} authHeader - The raw Authorization header (e.g. "Bearer mcp-secret-token-123")
 * @returns {object|null} Returns AuthInfo object if valid, null if absent or invalid.
 */
export function parseBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  if (token === MCP_DEMO_TOKEN) {
    return {
      token,
      clientId: 'mcp-learning-client',
      scopes: [...MCP_ALLOWED_SCOPES]
    };
  }

  return null;
}

/**
 * Verifies that the tool execution context (extra.authInfo) contains the required permission scope.
 * This is executed directly at the MCP server/tool execution boundary.
 *
 * @param {object|undefined} extra - The extra object supplied by the MCP SDK to tool callbacks.
 * @param {string} requiredScope - The required permission scope (e.g. "knowledge:read").
 * @returns {{ allowed: boolean, error?: string }}
 */
export function checkToolScope(extra, requiredScope) {
  const authInfo = extra?.authInfo;

  if (!authInfo) {
    return {
      allowed: false,
      error: `Authentication required: No valid Bearer token provided for protected operation requiring scope [${requiredScope}].`
    };
  }

  const scopes = Array.isArray(authInfo.scopes) ? authInfo.scopes : [];
  if (!scopes.includes(requiredScope)) {
    return {
      allowed: false,
      error: `Forbidden: Token lacks required scope [${requiredScope}]. Granted scopes: [${scopes.join(', ')}].`
    };
  }

  return { allowed: true };
}
