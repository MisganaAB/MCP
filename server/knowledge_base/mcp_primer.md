# Model Context Protocol (MCP) Primer

## What is MCP?
The Model Context Protocol (MCP) is an open standard designed to securely connect AI models to external tools, data sources, and contextual environments.

Instead of writing custom integrations for every AI model and API, MCP provides a universal protocol over JSON-RPC 2.0.

## Core Concepts

### 1. Participants
- **MCP Host:** The runtime environment where the AI model lives (e.g., Claude Desktop, Antigravity IDE, or our custom Express backend).
- **MCP Client:** The entity that connects to an MCP Server, discovers its capabilities, and delegates requests.
- **MCP Server:** A lightweight service exposing Tools, Resources, and Prompts to clients.

### 2. The Three Primitives
- **Tools:** Executable functions with input schemas. They allow models to perform actions (e.g., querying GitHub or reading files).
- **Resources:** Read-only data sources identified by URIs (e.g., `knowledge://mcp-primer`). Similar to GET endpoints or static files.
- **Prompts:** Parameterized conversation templates designed to help users interact with the model in structured ways.

### 3. Transports
- **Streamable HTTP (Current Standard):** Operates on a single HTTP endpoint supporting POST (for requests and initialization), GET (for Server-Sent Events / SSE streams), and DELETE (for session termination).
- **Stdio (Process-based):** Communicates via standard input and standard output for local child processes.
- **HTTP+SSE (Legacy):** Uses separate `/sse` and `/messages` endpoints.
