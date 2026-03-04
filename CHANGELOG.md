# Changelog

All notable changes to the Nimai packages are documented here.
Versions follow [Semantic Versioning](https://semver.org/).
Packages: `nimai-core` · `nimai-mcp` · `nimai-cli`

---

## [Unreleased]

---

## [0.3.0] — 2026-03-05 — nimai-core · nimai-mcp · nimai-cli

### Added
- `nimai_spec_review` MCP tool — returns FORGE Prompt 1.5 (spec-quality reviewer prompt); no LLM calls
- `nimai spec-review <spec.md>` CLI command with `--out` flag
- `buildPrompt15()` in core — evaluates 6 spec-quality dimensions with evidence citation requirement; instructs reviewing LLM to emit machine-parseable JSON verdict block `{passed, schema_version, issues}`
- **Prompt 1.5 v2 verdict schema** — `issues` is now `VerdictIssue[]` with `dimension`, `severity` (`HARD_FAIL` | `SOFT_FAIL` | `NOTE`), and `detail`; `schema_version: "2"` field added; 6th dimension: internal consistency / contradiction detection
- `verdict.ts` — `parseVerdict()` utility exported from `nimai-core`; accepts v1 (string[]) and v2 (object[]) formats; returns `MALFORMED_VERDICT` on absent or malformed block
- `clarification.ts` shared module — 4 rule-based heuristics for detecting ambiguous requests (word count, zero context files, no domain nouns, conflicting stack hints)
- `clarifications_needed?: string[]` optional field on `nimai_spec` output
- `<!-- nimai-spec -->` marker appended to all `nimai_new`-scaffolded spec files; context extractor boosts files containing this marker
- Lint rule `pre_checked_ac` (hard fail) — detects `- [x]` list items in draft specs (ACs must be unchecked at spec creation time)
- Lint rule `missing_marker` (advisory) — warns when no `<!-- nimai-spec -->` marker found
- Doc mirror sync test — MCP test suite verifies `FORGE-spec-template.md` and `FORGE-quickref.md` are identical between repo root and `packages/mcp/data/`
- `docs/product-positioning.md`, `docs/workflow.md`, `docs/independent-validation.md`, `docs/contract-policy.md`
- `benchmarks/` folder with Benchmark 1 artifacts (ChatMasala data model, 2026-03-04)
- `specs/nimai-spec-review.md` — dogfood FORGE spec for the spec-review feature

### Fixed
- `nimai_validate`: `passed` was incorrectly `false` for advisory-only issues — now `passed=true` when only advisory issues present
- CLI `validate`: replaced generic "passed" message with explicit `PASS (structural)` advisory
- Context extractor: added `tmp`, `.tmp`, `coverage`, `.cache`, `build`, `out` to excluded directories

### Changed
- Prompt 1.5 upgraded from 5 to 6 dimensions; evidence citation now required for every verdict; graduated severity replaces binary PASS/FAIL for issues
- Clarification heuristic tests rewritten as table-driven `test.each()` fixtures (19 test cases)
- `docs/workflow.md`: added Required Gate Checklist (5 binary yes/no questions) making reviewer/executor separation a hard gate
- `docs/mcp-setup.md`: added loop protocol and clarification mode behavior
- `docs/release-checklist.md`: added manual benchmark gate

### Tests
- 148 total (67 core + 27 mcp + 54 cli) — up from 120

---

## [0.1.2] — nimai-core · nimai-cli

### Added
- Context scoring: filename boost (+2 if filename matches keyword), source dir boost (+1 for `src/`, `lib/`, etc.), docs dir penalty (-1 for `docs/`, `examples/`)
- `nimai_review` guard: rejects blank/unfilled specs before generating reviewer prompt
- `nimai_spec`: validates that `repoPath` exists before attempting context extraction
- `-v, --version` flag support (Commander default was `-V`)
- `nimai_new`: `outputPath` must be non-empty (zod `.min(1)`)

### Fixed
- Context extractor: excluded `tmp`, `coverage`, `build`, `dist`, `.next` directories to prevent artifact noise
- MCP server startup: bundled FORGE docs in `packages/mcp/data/` so published package resolves templates without monorepo fallback
- Published packages: `workspace:*` protocol resolved correctly via `pnpm publish` (not `npm publish`)

---

## [0.1.1] — nimai-mcp · nimai-cli

### Fixed
- `workspace:*` dependency literals left in published package — switched to `pnpm publish` which resolves workspace references
- CLI renamed to `nimai-cli` (unscoped); `@nimai` org unavailable on npm

---

## [0.1.0] — Initial release

### Added
- `nimai-core`: template loader, lint engine (blank fields, NHFI flags, missing sections, 4 advisory architecture rules), context extractor
- `nimai-mcp`: MCP server with 4 tools — `nimai_spec`, `nimai_review`, `nimai_validate`, `nimai_new`
- `nimai-cli`: `nimai spec`, `nimai validate`, `nimai review`, `nimai new` commands
- `nimai spec --hosted`: deterministic prompt+context bundle, no API key required
- `nimai spec --standalone`: direct model call via ModelAdapter (Anthropic, OpenAI, Ollama)
- Config system: `.forge/config.yaml` with CLI flag > env var > config file > default precedence
- E2E test: spawns MCP server, full JSON-RPC handshake, asserts tool list
- `docs/mcp-setup.md`: Claude Code, Codex, Cursor setup via `npx nimai-mcp`
