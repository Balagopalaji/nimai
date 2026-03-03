# FORGE Milestone 3a — Build Spec

> Generated via Self-Spec Agent process. Codex-reviewed scope.
> [NEEDS HUMAN INPUT] flags mark genuine product-level policy decisions only.

---

## Pre-Flight

**Risk tier:** Low–Medium
- Low for adapters (additive, ModelAdapter contract unchanged), docs, E2E test
- Medium for config system (.forge/config.yaml introduces new precedence logic + new lint surface)
- Medium for anti-spaghetti gate (new lint rules affect existing lintContent behavior)

**Primary cognitive mode:** Deterministic

**Resource governance:**
- Escalate if any sub-task exceeds 2 hours of agent work
- Retry limit: 2 before stopping and asking
- Config system and anti-spaghetti gate are the two sub-tasks most likely to surface design decisions — stop and ask rather than guess

---

## 1. Specification Layer

### 1.1 Final Deliverable

Six additions to the FORGE monorepo:

1. **`.forge/config.yaml` support** — project-level defaults with precedence: CLI flags > env vars > `.forge/config.yaml` > hardcoded defaults
2. **OpenAI adapter** — `OpenAIAdapter` implementing `ModelAdapter`
3. **Ollama adapter** — `OllamaAdapter` implementing `ModelAdapter` (local, no API key)
4. **MCP registration docs** — how to register FORGE MCP server in Claude Code, Codex, Cursor
5. **Subprocess E2E test** — one automated test: CLI command → MCP server → tool call path
6. **Anti-spaghetti lint gate** — four new advisory lint rules in `lintContent`; warnings only (exit 0), not hard failures
7. **npm publish readiness** — package.json metadata complete; versioning + release checklist written

### 1.2 Scope Boundaries

**In scope:**
- `packages/cli/src/config.ts` — load + merge `.forge/config.yaml`
- Config precedence: CLI flags > `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` env > `.forge/config.yaml` > defaults
- `packages/cli/src/adapters/openai.ts` — OpenAIAdapter
- `packages/cli/src/adapters/ollama.ts` — OllamaAdapter (local REST, no SDK)
- Anti-spaghetti lint rules added to `packages/core/src/lint.ts` as advisory warnings
- `docs/mcp-setup.md` — MCP registration instructions
- One subprocess E2E test in `packages/cli/src/__tests__/e2e.test.ts`
- npm publish metadata (description, keywords, repository, license, files)
- Release checklist doc

**Out of scope (Must-Not):**
- `forge run` — M3b
- Interactive config setup wizard — M4
- Config encryption / secrets management — never in this tool
- Hard-failing anti-spaghetti rules (advisory only in M3a — graduate to hard failures later)
- Changing any existing MCP tool contracts (locked in M1)
- Changing existing passing tests

### 1.3 Task Decomposition

| # | Sub-task | Mode | Risk | Acceptance Criteria | Eval |
|---|---|---|---|---|---|
| 1 | Config system | Deterministic | Medium | `loadConfig(cwd)` reads `.forge/config.yaml`; merges with correct precedence; returns typed `ForgeConfig`; gracefully handles missing file | Unit tests: precedence order, missing file, malformed YAML |
| 2 | Wire config into runSpec | Deterministic | Low | `forge spec --standalone` uses config model if `--model` not passed; `ANTHROPIC_API_KEY` env overrides config adapter key | CLI test: config file + env var + flag precedence verified |
| 3 | OpenAI adapter | Deterministic | Low | `OpenAIAdapter` implements `ModelAdapter`; reads `OPENAI_API_KEY`; throws `AdapterError` on failure; unit-tested with mocked SDK | Unit tests: mock SDK returns string; auth failure throws AdapterError |
| 4 | Ollama adapter | Deterministic | Low | `OllamaAdapter` implements `ModelAdapter`; calls local REST endpoint; no API key; `ollamaUrl` from config or default `http://localhost:11434` | Unit tests: mock fetch returns content; connection failure throws AdapterError |
| 5 | Anti-spaghetti lint rules | Deterministic | Medium | Four new advisory `LintIssueType` values added; `lintContent` detects missing: module boundary, interface/contract section, non-goals, max change surface; all advisory (exit 0) | Unit tests: fixture with/without each rule; existing lint tests still pass |
| 6 | Subprocess E2E test | Deterministic | Low | One test: spawn MCP server process, send `tools/list` JSON-RPC via stdin, assert 4 tools returned; server exits cleanly | Automated: `pnpm test` runs it; no manual step |
| 7 | MCP registration docs | Deterministic | Low | `docs/mcp-setup.md` covers Claude Code, Codex, Cursor; includes config snippet and forge-mcp binary path | Review: doc is self-contained, runnable instructions |
| 8 | npm publish readiness | Deterministic | Low | All package.json files have description, keywords, repository, license, files; `npm pack --dry-run` produces expected output | Manual: run dry-run and verify |

### 1.4 Acceptance Criteria — Master Definition of Done

Milestone 3a is complete when ALL of the following are true:

- [ ] `pnpm build` zero TS errors
- [ ] `pnpm test` passes all tests (66 existing + new M3a tests)
- [ ] `.forge/config.yaml` with `model: claude-opus-4-6` is respected by `forge spec --standalone` when no `--model` flag
- [ ] `ANTHROPIC_API_KEY` env still overrides config adapter key
- [ ] `OpenAIAdapter` and `OllamaAdapter` unit tests pass (mocked)
- [ ] `forge validate` reports anti-spaghetti advisory warnings but exits 0
- [ ] Subprocess E2E test starts MCP server and asserts `tools/list` returns 4 tools
- [ ] `docs/mcp-setup.md` exists with working setup instructions for all three clients
- [ ] `npm pack --dry-run` on packages/cli and packages/mcp produces expected output

---

## 2. Intent Layer

**Deployment purpose:** Claude Code executes, Radha reviews each sub-task. Supervised build.

**Trade-off hierarchy:**
1. Correctness — config precedence must be exact; adapter errors must be clear
2. Simplicity — config schema minimal; no over-engineering for M3a
3. Non-breaking — all 66 existing tests must still pass
4. Extensibility — adapter pattern must not need changes to add new adapters in M4

**Constraint architecture:**

Must:
- Config file lives at `<cwd>/.forge/config.yaml` (repo root, not home dir)
- `ModelAdapter` interface unchanged — new adapters implement existing contract
- Anti-spaghetti rules are advisory only (exit 0) in M3a
- E2E test must be automated (part of `pnpm test`), not manual-only
- Anthropic SDK stays in `packages/cli` only (no new LLM deps in core or mcp)

Must-Not:
- Add new required fields to existing MCP tool schemas
- Make anti-spaghetti rules hard failures in M3a
- Publish to npm yet (readiness only)
- Add interactive prompts to any command

Prefer:
- `js-yaml` for config parsing (lightweight, no runtime type magic)
- Ollama adapter uses `fetch` (Node 18+ built-in, no extra dep)
- OpenAI adapter uses `openai` npm package (same pattern as Anthropic)

Escalate (stop and ask):
- If config schema needs fields beyond `model`, `adapter`, `ollamaUrl`, `apiKey`
- If anti-spaghetti rules need to be per-section rather than whole-doc checks
- If E2E test requires changes to MCP server startup behavior

---

## 3. Context Layer

Authoritative sources at /forge root:
- `packages/core/src/lint.ts` — extend with new advisory LintIssueTypes
- `packages/core/src/types.ts` — add new LintIssueType values
- `packages/cli/src/adapters/types.ts` — ModelAdapter interface (unchanged)
- `packages/cli/src/adapters/anthropic.ts` — pattern to follow for OpenAI/Ollama
- `packages/cli/src/commands/spec.ts` — wire config into adapter construction
- `packages/mcp/src/index.ts` — entry point for E2E test to spawn

Known state: 66 tests passing, all M1 + M2 acceptance criteria met.

---

## 4. [NEEDS HUMAN INPUT] Flags

- **NHFI-1 — Config schema keys for M3a:** Proposed minimal schema:
  ```yaml
  model: claude-sonnet-4-6      # default model for --standalone
  adapter: anthropic            # adapter: anthropic | openai | ollama
  ollamaUrl: http://localhost:11434
  ```
  Is this sufficient for M3a, or are there other keys needed?
  *Recommendation: keep to these three. Everything else is M4.*

- **NHFI-2 — Anti-spaghetti rule severity:** Advisory (exit 0, labeled `[advisory]`) in M3a,
  hard failures in M3b/M4. Is that the right graduation path?
  *Recommendation: yes — advisory first, graduate after the rules are battle-tested.*

- **NHFI-3 — Ollama in M3a or M3b?** Ollama has a different API shape (local REST, no key).
  It's lower risk than OpenAI but needs a fetch-based implementation rather than an SDK.
  *Recommendation: include in M3a — it's simple (one fetch call) and validates the adapter pattern fully.*

- **NHFI-4 — npm publish scope:** Publish `forge` (CLI) only, or also `@forge/core` and `@forge/mcp`?
  *Recommendation: publish all three — core and mcp are useful independently (MCP server can be used without CLI).*

---

## 5. Governance & Validation

**Escalation:** Stop and ask if config schema needs expansion or if anti-spaghetti rules
need per-section rather than whole-doc detection.

**Adversarial Reflection:** Run on sub-task 5 (anti-spaghetti rules) before shipping —
the new lint rules must not produce false positives on existing valid specs.

**Uncertainty reporting:** Not required (deterministic implementation).

---

## 6. Implementation Notes

### Config loading flow
```
loadConfig(cwd: string): ForgeConfig
  → look for <cwd>/.forge/config.yaml
  → if missing, return defaults
  → parse YAML, validate against schema (zod)
  → return typed ForgeConfig

mergeConfig(config, env, flags): ResolvedConfig
  → precedence: flags > env > config > defaults
```

### Adapter selection from config
```
adapter: anthropic  → AnthropicAdapter(apiKey from env or config)
adapter: openai     → OpenAIAdapter(apiKey from OPENAI_API_KEY env)
adapter: ollama     → OllamaAdapter(url from config.ollamaUrl or default)
```

### Anti-spaghetti lint rule targets
Four new advisory `LintIssueType` values:
- `missing_module_boundary` — spec doesn't state which packages/modules it touches
- `missing_interface_contract` — spec doesn't define the interface/contract being implemented
- `missing_non_goals` — spec has no explicit out-of-scope / Must-Not section
- `missing_change_surface` — no per-task scope boundary (affects all tasks, not just one)

Detection: heading/keyword presence scan (same pattern as existing required-section checks).
All produce `advisory: true` flag on the LintIssue — forge validate exits 0.

### E2E test design
```
packages/cli/src/__tests__/e2e.test.ts
  spawn packages/mcp/dist/index.js as child process
  write JSON-RPC initialize + tools/list to stdin
  assert stdout contains forge_spec, forge_review, forge_validate, forge_new
  send SIGTERM, assert clean exit
```

---

## 7. Spec Validation (Red-Team Checklist)

- [x] Anti-spaghetti rules are advisory only — no false-failure risk on existing specs
- [x] Config precedence order is explicit and testable
- [x] ModelAdapter interface unchanged — no risk to M1/M2 tests
- [x] E2E test is automated, not manual
- [x] forge run explicitly out of scope
- [x] All 66 existing tests must still pass (non-breaking constraint)
- [x] NHFI flags are product decisions, not implementation decisions

---

*FORGE M3a Spec v1.0 — ready for execution after NHFI flags resolved.*
