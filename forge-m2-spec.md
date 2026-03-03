# FORGE Milestone 2 — Build Spec

> Generated via Self-Spec Agent process. Decisions resolved from M1 planning + Codex review.
> [NEEDS HUMAN INPUT] flags mark genuine product-level policy decisions only.

---

## Pre-Flight

**Risk tier:** Low–Medium
- Low for `forge review`, `forge new`, global binary (thin wrappers, no new surface)
- Medium for `forge spec --standalone` (real API calls, auth failure paths, ModelAdapter contract exercised for first time)

**Primary cognitive mode:** Deterministic

**Resource governance:**
- Escalate if any sub-task exceeds 2 hours of agent work
- Retry limit: 2 before stopping and asking
- No cost ceiling for build work; standalone integration test uses real API only when ANTHROPIC_API_KEY is present

---

## 1. Specification Layer

### 1.1 Final Deliverable

Four shippable additions to the FORGE CLI/MCP monorepo:

1. **`AnthropicAdapter`** — implements `ModelAdapter` interface; unit-tested with mocked SDK; one optional integration test gated by `ANTHROPIC_API_KEY`
2. **`forge spec --standalone "<request>"`** — calls Anthropic API, streams or returns draft spec to stdout; `--out <file>` writes to disk; `--validate` runs `forge validate` after write
3. **`forge review <specPath>`** — thin CLI wrapper over `toolReview`; prints reviewer prompt to stdout; `--out <file>` supported
4. **`forge new <outputPath>`** — thin CLI wrapper over `toolNew`; scaffolds spec from template; `--force` to overwrite existing file
5. **Global binary** — `pnpm link` installs `forge` globally; `forge --version` and `forge --help` work

### 1.2 Scope Boundaries

**In scope:**
- `AnthropicAdapter` implementing `ModelAdapter` (packages/cli/src/adapters/anthropic.ts)
- `forge spec --standalone` with stdout, `--out`, `--validate` flags
- `forge review` CLI command
- `forge new` CLI command with `--force` flag
- `pnpm link` global binary setup
- Unit tests (mocked adapter) + optional integration test for standalone
- CLI tests for review, new, standalone (mocked)

**Out of scope (Must-Not build in M2):**
- `.forge/config.yaml` — deferred to M3
- npm publish — deferred until M2 stabilizes
- `forge run` — still deferred (needs execution contract design)
- Additional model adapters (Ollama, OpenAI) — M3
- Streaming output for standalone — M3 if needed
- `forge validate` behavior changes

### 1.3 Task Decomposition

| # | Sub-task | Mode | Risk | Acceptance Criteria | Eval |
|---|---|---|---|---|---|
| 1 | `AnthropicAdapter` implementation | Deterministic | Medium | Implements `ModelAdapter`; `generate(prompt)` calls Anthropic API and returns string; throws `AdapterError` on auth/network failure with clear message | Unit test: mocked SDK returns expected string; mocked auth failure throws `AdapterError` |
| 2 | `forge spec --standalone` | Deterministic | Medium | Given `ANTHROPIC_API_KEY`, outputs draft spec to stdout; `--out` writes file; `--validate` runs lint after write and reports issues; exits non-zero on API error | CLI test: mocked adapter returns fixture; output contains spec content; exit codes correct |
| 3 | `forge review` CLI | Deterministic | Low | Reads spec file, prints reviewer prompt to stdout; `--out` writes file; exits 1 on missing file | CLI test: output contains Reviewer Prompt header; missing file exits 1 |
| 4 | `forge new` CLI | Deterministic | Low | Scaffolds spec at path; exits 1 if file exists without `--force`; creates parent dirs | CLI test: file created; exits 1 without `--force` on existing; exits 0 with `--force` |
| 5 | Global binary | Deterministic | Low | `pnpm link` succeeds; `forge --version` outputs `0.1.0`; `forge --help` lists all commands | Manual: run after pnpm link |
| 6 | Tests for all new commands | Deterministic | Low | CLI tests cover review/new/standalone (mocked); MCP tool tests already cover underlying logic | `pnpm test` passes across all packages |

### 1.4 Acceptance Criteria — Master Definition of Done

Milestone 2 is complete when ALL of the following are true:

- [ ] `pnpm build` succeeds with zero TypeScript errors
- [ ] `pnpm test` passes all tests (43 existing + new M2 tests)
- [ ] `forge spec --standalone "add JWT auth"` returns a draft spec to stdout (with real `ANTHROPIC_API_KEY`)
- [ ] `forge spec --standalone "add JWT auth" --out spec.md --validate` writes file and runs validate
- [ ] `forge review <spec.md>` outputs a reviewer prompt to stdout
- [ ] `forge new output.md` creates a scaffolded spec file
- [ ] `forge new output.md` exits 1 if file exists; exits 0 with `--force`
- [ ] Standalone unit tests pass with mocked adapter (no API key needed)
- [ ] Zero new imports of `@forge/mcp/dist/*` anywhere in packages/cli

---

## 2. Intent Layer

**Deployment purpose:**
Claude Code is the executing agent. Radha reviews each sub-task before the next begins.
Supervised iterative development — not autonomous. Claude Code does NOT make product-level decisions unilaterally (see NHFI flags).

**Trade-off hierarchy:**
1. Correctness — adapter must handle API errors cleanly; bad error messages are bugs
2. Simplicity — no extra abstraction; adapter is one file, commands are thin
3. Testability — mocked adapter must be usable in all CLI tests
4. Extensibility — `ModelAdapter` interface must not need changes to add Ollama in M3

**Constraint architecture:**

Must:
- `AnthropicAdapter` imports `@anthropic-ai/sdk` only in `packages/cli` (never in core or mcp)
- `ModelAdapter` interface must remain in `packages/cli/src/adapters/types.ts` (no move)
- `--standalone` reads `ANTHROPIC_API_KEY` from `process.env` only (no config file in M2)
- All new CLI commands have automated tests before marking sub-task complete
- `forge new` must not overwrite existing files without `--force`

Must-Not:
- Add streaming to standalone in M2
- Add config file support in M2
- Change MCP tool contracts (locked in M1)
- Add Anthropic SDK to `packages/core` or `packages/mcp`

Prefer:
- `AdapterError` as a typed error class for adapter failures (not raw `Error`)
- Consistent `--out <file>` flag pattern across all commands that can write files
- Keep `forge review` and `forge new` under 50 lines each

Escalate (stop and ask before proceeding):
- If `ModelAdapter` interface needs a new method to support standalone correctly
- If `--validate` flag on standalone requires changes to how `lintSpec` returns results

---

## 3. Context Layer

Authoritative sources at /forge root:
- `FORGE-quickref.md` — Prompt 1 and Prompt 2 are the canonical prompts for spec/review
- `packages/core/src/adapters/types.ts` — `ModelAdapter` interface (stub from M1)
- `packages/mcp/src/tools/` — existing tool implementations to mirror in CLI wrappers
- `packages/cli/src/commands/spec.ts` — existing --hosted implementation to extend for --standalone

Known state from M1:
- `ModelAdapter` interface is stubbed at `packages/cli/src/adapters/types.ts` — just `generate(prompt): Promise<string>`
- `forge spec --hosted` is working and tested
- MCP tool implementations (toolReview, toolNew) are working and tested — CLI commands wrap the same logic
- `@anthropic-ai/sdk` is NOT yet installed anywhere

Context freshness: all current, no re-fetch needed.

---

## 4. Policy Decisions (Resolved)

Policy: **safe-by-default, explicit-by-default, overridable-by-flag.**

- **NHFI-1 RESOLVED — Model:** `claude-sonnet-4-6` as default. `--model <id>` flag to override.
- **NHFI-2 RESOLVED — `--validate` exit behavior:** Exit 1 when validation finds issues. `--allow-invalid` flag forces exit 0 (for first-draft workflows).
- **NHFI-3 RESOLVED — `forge new` path:** Explicit path required always. No implicit file creation.

---

## 5. Governance & Validation

**Escalation contract:**
- Stop and ask if `ModelAdapter` interface needs new methods
- Stop and ask if `--validate` flag behavior conflicts with NHFI-2 decision
- No SLA; Radha is the reviewer; proceed on next session after review

**Adversarial Reflection:** Not required (Low–Medium risk; supervised build)

**Uncertainty reporting:** Not required (deterministic implementation)

---

## 6. Implementation Notes

### AnthropicAdapter structure
```
packages/cli/src/adapters/
  types.ts          ← ModelAdapter interface (existing stub)
  anthropic.ts      ← AnthropicAdapter class
  errors.ts         ← AdapterError typed class
```

### forge spec --standalone flow
```
1. Check ANTHROPIC_API_KEY present → exit 1 with clear message if missing
2. Call extractContext(repoPath, request) → context items
3. Call buildPrompt1(request, contextSummary) → prompt string
4. Call adapter.generate(prompt) → draft spec string
5. Print to stdout (default) OR write to --out file
6. If --validate and --out: run lintContent(specString) → print issues as warnings
```

### forge review / forge new flow
```
forge review <specPath> [--out <file>]
  → read file → buildPrompt2(content) → stdout or file

forge new <outputPath> [--force]
  → check file exists (exit 1 without --force) → loadTemplate() → write file
```

---

## 7. Spec Validation (Red-Team Checklist)

- [x] Deliverable is precise — each command has exact input/output defined
- [x] All 5 Primitives satisfied per sub-task
- [x] `ModelAdapter` interface change is an explicit escalation trigger
- [x] Anthropic SDK isolated to packages/cli only (no core/mcp contamination)
- [x] CI-safe testing: standalone tests use mocked adapter
- [x] `forge run` explicitly out of scope
- [x] NHFI flags are product decisions, not implementation decisions

---

*FORGE M2 Spec v1.0 — ready for execution after NHFI flags resolved.*
