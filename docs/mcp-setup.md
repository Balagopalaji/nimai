# Nimai MCP Server — Setup Guide

The Nimai MCP server exposes four tools to any MCP-compatible AI host:

| Tool | What it does |
|------|-------------|
| `nimai_spec` | Builds a FORGE spec prompt + repo context bundle |
| `nimai_review` | Generates a reviewer/validator prompt from an approved spec |
| `nimai_validate` | Lints a spec file — returns issues and pass/fail |
| `nimai_new` | Scaffolds a new spec file from the canonical template |

The server makes **no internal LLM calls**. Your host model (Claude, Codex, etc.)
does all generation. The tools return structured context and prompts.

---

## Installation

```bash
# Install the MCP server globally
npm install -g nimai-mcp

# Or run from the monorepo (development)
pnpm build
```

---

## Claude Code

Add the server to your Claude Code MCP configuration:

```bash
claude mcp add nimai-mcp -- node /path/to/node_modules/nimai-mcp/dist/index.js
```

Or edit `~/.claude/mcp-servers.json` directly:

```json
{
  "nimai-mcp": {
    "command": "node",
    "args": ["/path/to/node_modules/nimai-mcp/dist/index.js"]
  }
}
```

If you installed globally via npm:

```json
{
  "nimai-mcp": {
    "command": "nimai-mcp"
  }
}
```

If working from the monorepo:

```json
{
  "nimai-mcp": {
    "command": "node",
    "args": ["/absolute/path/to/forge/packages/mcp/dist/index.js"]
  }
}
```

---

## Gemini CLI

Add to `~/.gemini/settings.json` (global) or `.gemini/settings.json` (project-level):

```json
{
  "mcpServers": {
    "nimai-mcp": {
      "command": "node",
      "args": ["/path/to/node_modules/nimai-mcp/dist/index.js"]
    }
  }
}
```

Or use the CLI to add it interactively:

```bash
gemini mcp add
```

---

## OpenCode

Add to your OpenCode config file (`~/.config/opencode/config.json` or project-level `opencode.json`):

```json
{
  "mcp": {
    "nimai-mcp": {
      "command": "node",
      "args": ["/path/to/node_modules/nimai-mcp/dist/index.js"]
    }
  }
}
```

Or use the CLI:

```bash
opencode mcp add
```

---

## Codex (OpenAI)

Add to your Codex MCP server configuration. In `~/.codex/config.json` (or
wherever your Codex config lives):

```json
{
  "mcpServers": {
    "nimai-mcp": {
      "command": "node",
      "args": ["/path/to/node_modules/nimai-mcp/dist/index.js"]
    }
  }
}
```

---

## Cursor

Open Cursor settings and navigate to **Features → MCP**. Add a new server:

- **Name:** `nimai-mcp`
- **Command:** `node`
- **Args:** `/path/to/node_modules/nimai-mcp/dist/index.js`

Or edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "nimai-mcp": {
      "command": "node",
      "args": ["/path/to/node_modules/nimai-mcp/dist/index.js"]
    }
  }
}
```

---

## --hosted pattern: use your host's built-in model auth

If you're using a host that already has API credentials (e.g. Claude Code with
Anthropic auth, or Codex with OpenAI auth), you don't need to configure any API
keys for Nimai. Use `nimai_spec` with `--hosted` semantics:

1. Call `nimai_spec` with your `repoPath` and `request`
2. The tool returns a `prompt` string and `context[]` array
3. Pass that prompt directly to your host model's chat — it already has auth

This is the zero-key, zero-config path. No `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
needed anywhere in the Nimai config.

---

## Verifying the server

Test that the server lists all 4 tools correctly:

```bash
# Start the server and send a tools/list request via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.0.1"}}}' | \
  node /path/to/node_modules/nimai-mcp/dist/index.js
```

Or run the automated E2E test from the monorepo:

```bash
pnpm --filter nimai-mcp test
```

Expected: 4 tools listed (`nimai_spec`, `nimai_review`, `nimai_validate`, `nimai_new`).

---

## Project-level config

Create `.nimai/config.yaml` in your project root to set adapter defaults:

```yaml
# .nimai/config.yaml
adapter: anthropic       # anthropic | openai | ollama
model: claude-sonnet-4-6
# ollamaUrl: http://localhost:11434   # for Ollama adapter
# openaiBaseUrl: https://api.openai.com/v1  # for OpenAI-compatible APIs (e.g. z.ai)
```

Precedence: CLI flags > environment variables (API keys) > `.nimai/config.yaml` > defaults.
