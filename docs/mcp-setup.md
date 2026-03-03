# FORGE MCP Server — Setup Guide

The FORGE MCP server exposes four tools to any MCP-compatible AI host:

| Tool | What it does |
|------|-------------|
| `forge_spec` | Builds a FORGE spec prompt + repo context bundle |
| `forge_review` | Generates a reviewer/validator prompt from an approved spec |
| `forge_validate` | Lints a spec file — returns issues and pass/fail |
| `forge_new` | Scaffolds a new spec file from the canonical template |

The server makes **no internal LLM calls**. Your host model (Claude, Codex, etc.)
does all generation. The tools return structured context and prompts.

---

## Installation

```bash
# Install the MCP server globally
npm install -g @forge/mcp

# Or run from the monorepo (development)
pnpm build
```

---

## Claude Code

Add the server to your Claude Code MCP configuration:

```bash
claude mcp add forge-mcp -- node /path/to/node_modules/@forge/mcp/dist/index.js
```

Or edit `~/.claude/mcp-servers.json` directly:

```json
{
  "forge-mcp": {
    "command": "node",
    "args": ["/path/to/node_modules/@forge/mcp/dist/index.js"]
  }
}
```

If you installed globally via npm:

```json
{
  "forge-mcp": {
    "command": "forge-mcp"
  }
}
```

If working from the monorepo:

```json
{
  "forge-mcp": {
    "command": "node",
    "args": ["/absolute/path/to/forge/packages/mcp/dist/index.js"]
  }
}
```

---

## Codex (OpenAI)

Add to your Codex MCP server configuration. In `~/.codex/config.json` (or
wherever your Codex config lives):

```json
{
  "mcpServers": {
    "forge-mcp": {
      "command": "node",
      "args": ["/path/to/node_modules/@forge/mcp/dist/index.js"]
    }
  }
}
```

---

## Cursor

Open Cursor settings and navigate to **Features → MCP**. Add a new server:

- **Name:** `forge-mcp`
- **Command:** `node`
- **Args:** `/path/to/node_modules/@forge/mcp/dist/index.js`

Or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "forge-mcp": {
      "command": "node",
      "args": ["/path/to/node_modules/@forge/mcp/dist/index.js"]
    }
  }
}
```

---

## --hosted pattern: use your host's built-in model auth

If you're using a host that already has API credentials (e.g. Claude Code with
Anthropic auth, or Codex with OpenAI auth), you don't need to configure any API
keys for FORGE. Use `forge_spec` with `--hosted` semantics:

1. Call `forge_spec` with your `repoPath` and `request`
2. The tool returns a `prompt` string and `context[]` array
3. Pass that prompt directly to your host model's chat — it already has auth

This is the zero-key, zero-config path. No `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
needed anywhere in the FORGE config.

---

## Verifying the server

Test that the server lists all 4 tools correctly:

```bash
# Start the server and send a tools/list request via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.0.1"}}}' | \
  node /path/to/node_modules/@forge/mcp/dist/index.js
```

Or run the automated E2E test from the monorepo:

```bash
pnpm --filter @forge/mcp test
```

Expected: 4 tools listed (`forge_spec`, `forge_review`, `forge_validate`, `forge_new`).

---

## Project-level config

Create `.forge/config.yaml` in your project root to set adapter defaults:

```yaml
# .forge/config.yaml
adapter: anthropic       # anthropic | openai | ollama
model: claude-sonnet-4-6
# ollamaUrl: http://localhost:11434   # for Ollama adapter
# openaiBaseUrl: https://api.openai.com/v1  # for OpenAI-compatible APIs (e.g. z.ai)
```

Precedence: CLI flags > environment variables (API keys) > `.forge/config.yaml` > defaults.
