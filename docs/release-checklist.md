# FORGE Release Checklist

Follow this checklist before publishing any package to npm.

## Pre-publish (one-time setup)

- [ ] Create `LICENSE` file at repo root (MIT recommended)
- [ ] Update `repository.url` in all three `package.json` files — replace `PLACEHOLDER` with the actual GitHub org/repo
- [ ] Ensure you are logged in to npm: `npm whoami`
- [ ] Confirm package names are available: `npm view forge`, `npm view @forge/core`, `npm view @forge/mcp`

## Per-release

### 1. Tests pass

```bash
pnpm build
pnpm test
# Expected: 92/92 tests pass (28 core + 15 mcp + 49 cli)
```

### 2. Verify pack output

```bash
# Core
cd packages/core && npm pack --dry-run
# Expected: only dist/ files listed

# MCP
cd ../mcp && npm pack --dry-run
# Expected: only dist/ files listed, forge-mcp binary included

# CLI
cd ../cli && npm pack --dry-run
# Expected: only dist/ files listed, forge binary included
```

### 3. Version bump

Bump versions consistently across all packages:

```bash
# In packages/core/package.json, packages/mcp/package.json, packages/cli/package.json
# and root package.json — update "version" field
```

Workspace deps (`"@forge/core": "workspace:*"`) are resolved at publish time by pnpm.
Pin to exact version in published packages: `pnpm publish` handles this automatically
with `--no-git-checks` or via `pnpm -r publish`.

### 4. Publish order

Publish in dependency order:

```bash
# 1. Core first (no workspace deps)
cd packages/core
npm publish --access public

# 2. MCP (depends on @forge/core)
cd ../mcp
npm publish --access public

# 3. CLI (depends on @forge/core + @forge/mcp)
cd ../cli
npm publish --access public
```

Or use pnpm's recursive publish:

```bash
pnpm -r publish --access public
```

### 5. Post-publish smoke test

```bash
# Install fresh in a temp dir
mkdir /tmp/forge-smoke && cd /tmp/forge-smoke
npm install forge @forge/mcp

# Verify CLI works
./node_modules/.bin/forge --help
./node_modules/.bin/forge validate --help

# Verify MCP server starts and lists tools
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0.0.1"}}}' | \
  ./node_modules/.bin/forge-mcp
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
