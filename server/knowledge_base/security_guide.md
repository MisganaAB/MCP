# MCP Security and Hardening Guide

## Key Security Principles for MCP Applications

### 1. File Jail & Path Traversal Prevention
When creating a tool that reads local files:
- Never trust client or model-supplied filenames.
- Strip all directory climbing prefixes (`..`, `/`, `\\`) using `path.basename()`.
- Validate that the target resolved path begins strictly with the allowed base directory.
- Restrict file extensions to a known safe allowlist (e.g., `.md`, `.json`).

### 2. Authorization at the Server Boundary
- Security cannot rely solely on the AI agent loop.
- The MCP Server itself must check authorization headers and permission scopes before executing any tool or serving any protected resource.

### 3. Demo Bearer Token vs OAuth 2.1
- A demo bearer token is a pre-shared string used for classroom and test environments.
- Full OAuth 2.1 requires an Authorization Server, PKCE code exchange, dynamic client registration, signed JWTs, and refresh token rotation. Never claim a pre-shared secret is OAuth 2.1!

### 4. Bounded Agent Loops
- LLMs can get stuck in loops if a tool returns unexpected output.
- Enforce a strict iteration bound (e.g., 5 iterations) to prevent runaway API costs or infinite loops.
