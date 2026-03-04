# Changelog

All notable changes to the Nimai packages are documented here.
Versions follow [Semantic Versioning](https://semver.org/).
Packages: `nimai-core` · `nimai-mcp` · `nimai-cli`

---

## [Unreleased]

### Added
- `nimai_spec_review` MCP tool — returns FORGE Prompt 1.5 (spec-quality reviewer prompt); no LLM calls
- `nimai spec-review <spec.md>` CLI command with `--out` flag
- `buildPrompt15()` in core — evaluates 5 spec-quality dimensions; instructs reviewing LLM to emit machine-parseable JSON verdict block `{passed, issues}`
- `clarification.ts` shared module — 4 rule-based heuristics for detecting ambiguous requests (word count, zero context files, no domain nouns, conflicting stack hints)
- `clarifications_needed?: string[]` optional field on `nimai_spec` / `nimai_spec_review` output — MCP returns field, CLI TTY prompts via readline, hosted prints preflight section
- `<!-- nimai-spec -->` marker appended to all `nimai_new`-scaffolded spec files; context extractor boosts files containing this marker
- `docs/product-positioning.md` — product scope and positioning alignment doc
- `docs/workflow.md` — reviewer/executor separation rules and AC hygiene
- `docs/independent-validation.md` — dark factory convention, E2E oracle requirements
- `specs/nimai-spec-review.md` — dogfood FORGE spec for the spec-review feature

### Fixed
- `nimai_validate`: `passed` was incorrectly `false` for advisory-only issues — now `passed=true` when only advisory issues present
- CLI `validate`: replaced generic "passed" message with explicit `PASS (structural)` advisory noting semantic quality is not guaranteed
- `ForgeValidateOutput.passed` JSDoc: corrected to "true if zero hard (non-advisory) issues found"
- `buildPrompt15` verdict block template: replaced placeholder syntax with real example values
- Context extractor: added `tmp`, `.tmp`, `coverage`, `.cache`, `build`, `out` to excluded directories

### Changed
- E2E test updated to assert exactly 5 tools (added `nimai_spec_review`)
- `FORGE-quickref.md` and MCP data mirror: added Prompt 1.5 template, updated tool table to 5 tools, documented `spec → spec_review → loop` protocol
- `docs/mcp-setup.md`: added loop protocol and clarification mode behavior
- `docs/release-checklist.md`: added manual benchmark gate for spec-review loop convergence (≤3 iterations before M3b)

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
