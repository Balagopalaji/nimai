# Nimai Release Checklist

Follow this checklist before publishing any package to npm.

## Pre-publish (one-time setup)

- [ ] Create `LICENSE` file at repo root (MIT recommended)
- [ ] Update `repository.url` in all three `package.json` files — replace `PLACEHOLDER` with the actual GitHub org/repo
- [ ] Ensure you are logged in to npm: `npm whoami`
- [ ] Confirm package names are available: `npm view nimai`, `npm view nimai-core`, `npm view nimai-mcp`

## Per-release

### 1. Tests pass

```bash
pnpm build
pnpm test
# Expected: 148/148 tests pass (67 core + 27 mcp + 54 cli)
```

### 2. Verify pack output — smoke install gate

Check pack contents, then do a real install smoke test to catch `workspace:*` regressions:

```bash
# Dry-run pack (check file list)
pnpm -r pack --dry-run
# Expected: only dist/ files; no workspace:* in dependencies

# Install smoke test (catches workspace:* publish bugs)
TMP=$(mktemp -d) && cd "$TMP"
npm install nimai-mcp@latest nimai-cli@latest
./node_modules/.bin/nimai --version
./node_modules/.bin/nimai-mcp --help
echo "smoke: OK" && cd - && rm -rf "$TMP"
```

If `npm install` fails with `EUNSUPPORTEDPROTOCOL workspace:*`, you used `npm publish` instead of
`pnpm -r publish`. Bump the patch and republish with `pnpm -r publish --access public --no-git-checks`.

### 3. Version bump

Bump versions consistently across all packages:

```bash
# In packages/core/package.json, packages/mcp/package.json, packages/cli/package.json
# and root package.json — update "version" field
```

Workspace deps (`"nimai-core": "workspace:*"`) are resolved at publish time by pnpm.
Pin to exact version in published packages: `pnpm publish` handles this automatically
with `--no-git-checks` or via `pnpm -r publish`.

### 4. Publish order

**Always use `pnpm publish` or `pnpm -r publish` — never `npm publish` directly.**
`npm publish` does not rewrite `workspace:*` dependency specifiers, which breaks
`npm install -g nimai-cli` with `EUNSUPPORTEDPROTOCOL` errors.

```bash
# From repo root — pnpm handles workspace:* rewriting and dependency order automatically
pnpm -r publish --access public --no-git-checks
```

### 5. Post-publish smoke test

```bash
# Install fresh in a temp dir
mkdir /tmp/nimai-smoke && cd /tmp/nimai-smoke
npm install nimai nimai-mcp

# Verify CLI works
./node_modules/.bin/nimai --help
./node_modules/.bin/nimai validate --help

# Verify MCP server starts and lists tools
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0.0.1"}}}' | \
  ./node_modules/.bin/nimai-mcp
```

### 6. Tag the release

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Semantic versioning policy

| Change type | Version bump |
|-------------|-------------|
| New adapter, new command (backward-compatible) | minor |
| Bug fix, advisory lint rule added | patch |
| Breaking change to CLI flags, MCP tool schemas | major |
| MCP tool renamed or removed | major (tool schema is locked v1) |

> Note: MCP tool contract is **locked at v1**. Any change to tool names or
> input/output shapes is a breaking change requiring a major version bump and
> consultation with users before proceeding.

## Pre-M3b manual verification gate

Before implementing M3b (`nimai run`), manually verify that the spec-review loop
converges in ≤3 iterations on at least two real specs:

- [x] Run `nimai spec-review <spec.md>` on a real project spec
- [x] Pass the resulting `specReviewerPrompt` to your host model
- [x] If the verdict is `passed: false`, refine the spec using the issues list and re-review
- [x] Confirm that **convergence happens within 3 iterations** (i.e., the spec passes by iteration 3)
- [ ] Repeat with a second spec from a different domain

**Benchmark 1 — ChatMasala data model spec (2026-03-04):**
- Iteration 1: `nimai_spec_review` returned FAIL — scope coherence: conceptual lifecycle states
  (open/agent_assigned/handed_off) not mapped to persisted enum (active|pending_handoff|closed)
- Fix: builder added lifecycle mapping table (conceptual → persisted status + side effects) and module
  boundary definition
- Iteration 2: `nimai_spec_review` returned PASS — all 5 dimensions clean; `nimai_validate` passed: true
- Result: converged in **2 iterations** ✅

This is a manual smoke test — no automated benchmark is required. Record any issues
in the project log before proceeding.

---

## Deferred features (do not implement without a FORGE spec)

### M3b: `nimai run`

`nimai run` would execute a spec end-to-end — spinning up agents, wiring
Planner→Worker→Validator, managing retries and failure handling.

**Why deferred:** The execution contract is a different risk class from spec/validate/review.
Host agents (Claude Code, Codex) already do this well when given a good spec. The FORGE
methodology's job is to make the *input* to those agents better. Shipping `nimai run`
prematurely risks duplicating what the host already does — and doing it worse.

**Pre-conditions before speccing M3b:**
- [ ] At least 2–4 weeks of v0.1.0 usage data
- [ ] Confirmed user demand for orchestration (not just spec/validate)
- [ ] Clear answer to: what does "done" look like for a running agent? (output contract)
- [ ] Clear answer to: how does nimai run differ from just calling `nimai spec` then pasting into Claude?

**When ready:** write a FORGE spec for M3b (dogfooding), lock the execution contract,
then implement. Do not start coding before the spec is reviewed.

**To reload the Codex agent that has full context for this project:**
```
codex resume 019cb163-b42e-7d82-a20a-8eed9da6456f
```
