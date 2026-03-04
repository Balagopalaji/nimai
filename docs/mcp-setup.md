# Nimai MCP Server — Setup Guide

The Nimai MCP server exposes five tools to any MCP-compatible AI host:

| Tool | What it does |
|------|-------------|
| `nimai_spec` | Builds a FORGE spec prompt + repo context bundle |
| `nimai_review` | Generates a reviewer/validator prompt from an approved spec |
| `nimai_validate` | Lints a spec file — returns issues and pass/fail |
| `nimai_new` | Scaffolds a new spec file from the canonical template |
| `nimai_spec_review` | Returns a Prompt 1.5 (Spec-Quality Reviewer) for a draft spec |

The server makes **no internal LLM calls**. Your host model (Claude, Codex, etc.)
does all generation. The tools return structured context and prompts.

> **Naming convention:** MCP tool names use underscores (`nimai_spec_review`); the equivalent CLI commands use hyphens (`nimai spec-review`). These are the same capability — different naming follows each interface's convention.

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

Expected: 5 tools listed (`nimai_spec`, `nimai_review`, `nimai_validate`, `nimai_new`, `nimai_spec_review`).

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

---

## Spec → Validate → Spec-Review → Loop protocol

This is the recommended pre-execution quality gate for ensuring a draft spec is
agent-ready before handing it off for implementation.

```
nimai_spec → fill spec → nimai_validate → nimai_spec_review → verdict
                              ↑                                    |
                              └──────── fix spec ──────────────────┘
                                        (on FAIL)
```

**Every iteration of the loop runs validate before spec-review** — including re-runs after a fix.
Validate is instant (no LLM call). Never call spec-review on a spec that hasn't just passed validate.

### Step 1 — Generate a draft spec

```
nimai_spec({ repoPath: "/path/to/repo", request: "your request" })
  → { prompt, context[], clarifications_needed? }
```

If `clarifications_needed` is present, answer each question and re-call `nimai_spec`
with an enriched request before proceeding.

Fill in the returned prompt to produce a spec file, then save it.

### Step 2 — Structural lint (every iteration)

```
nimai_validate({ specPath: "/path/to/draft-spec.md" })
  → { issues[], passed }
```

- If `passed: false` → fix structural issues (blank fields, missing sections, pre-checked ACs) first.
- If `passed: true` → proceed to Step 3.

Run this **on every loop iteration**, including after fixing a spec-review FAIL. A fix can
accidentally introduce new structural problems; validate catches them for free before you spend
an LLM call on spec-review.

### Step 3 — Semantic review (Prompt 1.5)

```
nimai_spec_review({ specPath: "/path/to/draft-spec.md" })
  → { specReviewerPrompt }
```

Pass `specReviewerPrompt` to a reviewing LLM (your host model). The reviewing LLM
evaluates the spec against six quality dimensions and ends its response with:

```
## Verdict
\`\`\`json
{"passed": true, "schema_version": "2", "issues": []}
\`\`\`
```

### Step 4 — Parse the verdict and loop

- If `passed: true` → proceed to implementation.
- If `passed: false` → use the `issues` list to refine the spec, then **return to Step 2** (validate first).
- If the verdict block is absent or malformed → escalate to the human.

The loop is **host-orchestrated**. Nimai makes no LLM calls and has no internal loop logic.

### Host responsibilities

| Step | Host action |
|------|------------|
| Step 1 | Call `nimai_spec`, surface `clarifications_needed` to the human if present |
| Step 2 | Call `nimai_validate` — fix structural issues before proceeding |
| Step 3 | Call `nimai_spec_review`, pass the prompt to the reviewing LLM |
| Step 4 | Parse `## Verdict` JSON block; if FAIL, loop back to Step 2 (not Step 3) |

### Prompt 1.5 — Spec-Quality Review dimensions (v2, 6 dimensions)

The reviewing LLM checks six dimensions. Each issue is classified as `HARD_FAIL`, `SOFT_FAIL`, or `NOTE`.
`passed: true` requires zero `HARD_FAIL` issues.

1. **Binary acceptance criteria** — are all sub-task ACs measurable and unambiguous? Any pre-checked `- [x]` ACs are a hard fail.
2. **Scope coherence** — are in-scope/out-of-scope boundaries clear and non-contradictory? Mismatches between conceptual terms and persisted models are a hard fail.
3. **Constraint sufficiency** — do Must/Must-Not/Prefer/Escalate constraints cover key risks?
4. **Decomposition realism** — can each sub-task be done within 2 hours by a skilled agent? Sub-task dependencies must be stated explicitly.
5. **Start-without-clarification viability** — can an agent begin without asking for more info?
6. **Internal consistency** — are terms, names, and concepts used consistently throughout the spec?
