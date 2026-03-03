# Nimai

**Spec ops for AI work.** Nimai is a CLI and MCP server that helps you write better specs for AI agents — before you run them.

> *Named on Gaura Purnima 2026, during an eclipse. Nimai was the childhood name of Sri Chaitanya Mahaprabhu, born under the neem tree. nim-AI.*

---

## Why

Agents fail not from lack of intelligence — but from underspecified work. Nimai implements the **FORGE framework** (Framework for Orchestrating Reliable Generative Execution): four engineering disciplines and five primitives that make agent input precise, bounded, and verifiable.

The disciplines:
1. **Specification Engineering** — what does "done" look like?
2. **Intent Engineering** — what values guide autonomous decisions?
3. **Context Engineering** — what does the agent need to know?
4. **Prompt Craft** — the individual instruction that fires the task

The five primitives every agent-ready task must satisfy:
1. Self-contained problem statement
2. Constraint architecture (Must / Must-Not / Prefer / Escalate)
3. Modular decomposition (the 2-hour rule)
4. Acceptance criteria — binary definition of done
5. Cognitive mode instruction

---

## Install

```bash
npm install -g nimai
```

Or add the MCP server to your AI host (Claude Code, Codex, Cursor):

```bash
npm install -g nimai-mcp
```

---

## Commands

```bash
# Scaffold a new spec file
nimai new my-feature.md

# Generate a spec prompt + repo context bundle (no API key needed)
nimai spec "add JWT authentication" --hosted --repo .

# Generate and write a spec directly (requires API key)
nimai spec "add JWT authentication" --standalone --out my-feature.md

# Lint a spec for unresolved fields and missing sections
nimai validate my-feature.md

# Generate a reviewer prompt from an approved spec
nimai review my-feature.md
```

---

## MCP Server

Nimai exposes four tools to any MCP-compatible host:

| Tool | What it does |
|------|-------------|
| `nimai_spec` | Builds a spec prompt + repo context bundle |
| `nimai_review` | Generates a reviewer/validator prompt |
| `nimai_validate` | Lints a spec — returns issues and pass/fail |
| `nimai_new` | Scaffolds a new spec from the canonical template |

The server makes **no internal LLM calls**. Your host model does generation. See [docs/mcp-setup.md](docs/mcp-setup.md) for setup instructions for Claude Code, Codex, and Cursor.

---

## Adapters

| Adapter | Flag / Config | Requires |
|---------|--------------|---------|
| Anthropic (default) | `--standalone` | `ANTHROPIC_API_KEY` |
| OpenAI | `adapter: openai` in `.nimai/config.yaml` | `OPENAI_API_KEY` |
| Ollama | `adapter: ollama` | Ollama running locally |

Project-level config in `.nimai/config.yaml`:

```yaml
adapter: anthropic
model: claude-sonnet-4-6
```

---

## Status

**v0.1.0-beta** — core spec workflow is stable and tested. Feedback welcome.

- [x] `nimai spec` — hosted and standalone modes
- [x] `nimai validate` — lint engine with advisory architecture rules
- [x] `nimai review` — reviewer prompt generation
- [x] `nimai new` — spec scaffolding
- [x] MCP server — all four tools
- [ ] `nimai run` — execute a spec end-to-end (planned, pending usage data)

---

## Packages

| Package | Description |
|---------|-------------|
| [`nimai-core`](packages/core) | Template loader, lint engine, context extractor — no LLM deps |
| [`nimai-mcp`](packages/mcp) | MCP server |
| [`nimai`](packages/cli) | CLI binary |

---

## License

MIT © Balagopalaji 2026
