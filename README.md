# MCP Learning Assistant 🎓

An educational, full-stack application built for a university assignment to demonstrate the **Model Context Protocol (MCP)** using pure **JavaScript (ES Modules)**, the official **Streamable HTTP** transport, a custom MCP Client, an explicit Gemini Agent Loop, and a React + Vite chat interface.

---

## 🌟 Architectural Overview

This project avoids "black box" agent frameworks (like LangChain or LlamaIndex) to clearly demonstrate every protocol layer, message format, and security boundary.

```text
[ React + Vite UI ]
       │
       │ 1. POST /api/chat { message, bearerToken }
       ▼
[ Express Backend ]
       │
       │ 2. Custom MCP Client connects to MCP Server via Streamable HTTP
       │ 3. Discovers Tools (search_github_repositories, read_knowledge_base)
       ▼
[ Explicit Agent Loop ]
       │
       │ 4. Translates MCP tool schemas to Gemini functionDeclarations
       │ 5. Sends prompt + tools to Gemini (model: gemini-3.8-flash)
       ▼
[ Gemini 3.8 Flash ]
       │
       │ 6. Decides to call tool -> returns functionCalls: [{ name, args }]
       ▼
[ MCP Server (/mcp) ]
       │
       │ 7. Verifies Bearer token and permission scopes at server boundary
       │ 8. Sanitizes paths (protects against traversal) and executes tool
       │ 9. Returns structured tool output
       ▼
[ Agent Loop (Bounded: max 5 turns) ]
       │
       │ 10. Appends tool response to history & asks Gemini for final synthesis
       ▼
[ React + Vite UI ]
       │
       │ 11. Renders final text + expandable tool execution badge
```

---

## 🔑 Core Features & Security Decisions

1. **Official Streamable HTTP Transport (Protocol 2025-11-25):**
   - Implemented using `StreamableHTTPServerTransport` and `StreamableHTTPClientTransport` from `@modelcontextprotocol/sdk`.
   - Unifies requests, responses, and SSE event streaming on a single endpoint (`/mcp`) using HTTP POST, GET, and DELETE methods.

2. **Server-Side Authorization Boundary:**
   - Token validation is enforced **at the MCP tool execution boundary**, not just inside the AI client.
   - A pre-shared demo Bearer token (`mcp-secret-token-123`) grants scopes (`github:read`, `knowledge:read`).
   - *Educational Note:* This is a pre-shared token system with scope checks, **not full OAuth 2.1** (which requires dynamic client registration, PKCE authorization code exchanges, signed JWTs, and refresh tokens).

3. **Strict Path Traversal File Jail:**
   - The local knowledge base reader strips path climbing prefixes using `path.basename()`, enforces a strict file extension allowlist (`.md`, `.json`), and confirms canonical path resolution stays inside `server/knowledge_base/`.

4. **Bounded Agent Loop:**
   - Guarantees termination after `MAX_AGENT_ITERATIONS` (default 5) to prevent runaway API costs or infinite model looping.

5. **Pure JavaScript Modules:**
   - 100% ESM (`"type": "module"`), `.js` and `.jsx` throughout, zero TypeScript complexity.

---

## 📁 Project Structure

```text
MCP/
├── .env.example                       # Documented environment variables template
├── .gitignore                         # Ignores node_modules, .env, dist
├── README.md                          # Full guide and setup documentation
├── ASSIGNMENT_SUMMARY.md              # University assignment reflection & findings
│
├── client/                            # Frontend (React 19 + Vite)
│   ├── index.html                     # HTML root
│   ├── package.json                   # "type": "module"
│   ├── vite.config.js                 # Dev server & backend proxy (/api)
│   └── src/
│       ├── main.jsx                   # React 19 root
│       ├── App.jsx                    # Chat state & token management
│       ├── components/
│       │   ├── ChatWindow.jsx         # Message feed & prompt starters
│       │   ├── MessageInput.jsx       # Input field & send triggers
│       │   ├── MessageItem.jsx        # User vs. assistant message bubbles
│       │   ├── TokenSettings.jsx      # UI bar for testing Bearer token & scopes
│       │   └── ToolExecutionBadge.jsx # Expandable badge showing tool execution traces
│       └── styles/
│           └── app.css                # Modern, responsive dark UI
│
└── server/                            # Backend (Node.js + Express + MCP SDK)
    ├── package.json                   # "type": "module"
    ├── .env                           # Server configuration & credentials
    ├── knowledge_base/                # Isolated educational knowledge documents
    │   ├── mcp_primer.md              # Primer on MCP architecture & primitives
    │   ├── security_guide.md          # Guide on path traversal and scope checks
    │   └── course_faq.json            # Structured sample course FAQ
    ├── test/                          # Comprehensive native tests (node --test)
    │   ├── pathTraversal.test.js      # Verifies path traversal jail
    │   ├── authScopes.test.js         # Verifies token parsing & scope enforcement
    │   ├── tools.test.js              # Verifies tool execution & errors
    │   ├── mcpServerIntegration.test.js# Verifies registration of tools, resources, prompts
    │   ├── streamableHttpLive.test.js # Verifies live Streamable HTTP client & server
    │   ├── agentLoop.test.js          # Verifies bounded loop & Gemini translation
    │   └── chatApi.test.js            # Verifies POST /api/chat route
    └── src/
        ├── index.js                   # Starts Express server on port 3000
        ├── config.js                  # Loads .env & validates configuration
        ├── mcp/
        │   ├── server.js              # createMcpServer() factory
        │   ├── auth.js                # Token parser & scope verification helpers
        │   ├── resources.js           # MCP Resources (knowledge:// URIs)
        │   ├── prompts.js             # MCP Prompts (guided conversation templates)
        │   └── tools/
        │       ├── githubTools.js     # GitHub public API tool (search_github_repositories)
        │       └── knowledgeTools.js  # Knowledge base reader (read_knowledge_base)
        ├── agent/
        │   ├── mcpClient.js           # Custom MCP client wrapper
        │   ├── gemini.js              # Gemini API client & schema translator
        │   └── agentLoop.js           # Explicit bounded reasoning loop
        └── routes/
            ├── mcpRoutes.js           # Streamable HTTP (/mcp) endpoint & session map
            └── chatRoutes.js          # POST /api/chat endpoint for React UI
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v20+ or v22+ (tested on Node v23 / v24).
- **npm:** Included with Node.js.

### 1. Setup Backend
```powershell
cd "server"

# Install backend dependencies
npm.cmd install

# Start the backend server
npm.cmd start
```
The server will start on `http://localhost:3000`.

### 2. Setup Frontend
In a second terminal:
```powershell
cd "client"

# Install frontend dependencies
npm.cmd install

# Start Vite development server
npm.cmd run dev
```
Open your browser to `http://localhost:5173`.

---

## 🧪 Running Automated Tests

The test suite runs using Node.js's native test runner (`node:test`):

```powershell
cd "server"
npm.cmd test
```

**Results:**
- **37 passing tests**, 0 failures across 7 test suites covering:
  - Path traversal security attacks (`../../`, null bytes, unauthorized extensions).
  - Bearer token authentication and permission scope checks.
  - MCP Server tool, resource, and prompt registration.
  - Live Streamable HTTP client-server communication.
  - Gemini function declaration translation and bounded agent loop termination.
  - Express `/api/chat` route integration.

---

## 🔍 Testing with MCP Inspector

You can connect the official [MCP Inspector](https://github.com/modelcontextprotocol/inspector) directly to our Streamable HTTP endpoint:

1. With the backend running (`http://localhost:3000`), open a new terminal:
   ```powershell
   npx.cmd @modelcontextprotocol/inspector
   ```
2. In the Inspector web interface:
   - **Transport Type:** Select `Streamable HTTP` (or `HTTP`).
   - **URL:** Enter `http://localhost:3000/mcp`.
   - **Custom Headers:** Add Header:
     - Name: `Authorization`
     - Value: `Bearer mcp-secret-token-123`
3. Click **Connect**.
4. Explore and test:
   - **Tools Tab:** Execute `read_knowledge_base` with `{ "filename": "mcp_primer.md" }`.
   - **Resources Tab:** Read `knowledge://mcp-primer` or `knowledge://course-faq`.
   - **Prompts Tab:** Render `explain_mcp_concept` with `{ "concept": "Streamable HTTP" }`.

---

## 💡 Demo Scenarios in the Chat UI

1. **Knowledge Base Query (Authorized):**
   - Prompt: *"What does the MCP primer document explain about transports?"*
   - Observe: The agent calls `list_knowledge_base_files`, then `read_knowledge_base`, and synthesizes an answer. Expand the ⚙️ badge to view the intermediate tool arguments and returned content.

2. **GitHub API Query (Authorized):**
   - Prompt: *"Search GitHub for repositories about model context protocol."*
   - Observe: The agent calls `search_github_repositories` and returns top repositories with star counts and URLs.

3. **Security / Unauthorized Test:**
   - In the top settings bar, click **Clear Token** (leaving the token input blank).
   - Prompt: *"Read course_faq.json from the knowledge base."*
   - Observe: The tool execution is blocked at the MCP server boundary with a 403 Forbidden error (`Authentication required: No valid Bearer token provided`).
