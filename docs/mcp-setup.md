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
npm install -g nimai-mcp
```

That's it. No path configuration needed — `npx` resolves the package automatically
when your AI host starts the server.

---

## Claude Code

```bash
claude mcp add nimai-mcp -- npx nimai-mcp
```

Or edit `~/.claude/mcp_servers.json` directly:

```json
{
  "nimai-mcp": {
    "command": "npx",
    "args": ["nimai-mcp"]
  }
}
```

---

## Codex (OpenAI)

```bash
codex mcp add nimai-mcp -- npx nimai-mcp
```

Or edit `~/.codex/config.json`:

```json
{
  "mcpServers": {
    "nimai-mcp": {
      "command": "npx",
      "args": ["nimai-mcp"]
    }
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
      "command": "npx",
      "args": ["nimai-mcp"]
    }
  }
}
```

---

## OpenCode

Add to `~/.config/opencode/config.json` or project-level `opencode.json`:

```json
{
  "mcp": {
    "nimai-mcp": {
      "command": "npx",
      "args": ["nimai-mcp"]
    }
  }
}
```

---

## Cursor

Edit `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "nimai-mcp": {
      "command": "npx",
      "args": ["nimai-mcp"]
    }
  }
}
```

Or open Cursor settings → **Features → MCP** and add:
- **Command:** `npx`
- **Args:** `nimai-mcp`

---

## Monorepo (development)

If working from source instead of the published package:

```json
{
  "nimai-mcp": {
    "command": "node",
    "args": ["/absolute/path/to/forge/packages/mcp/dist/index.js"]
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

```bash
npx nimai-mcp --help
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
