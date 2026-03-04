# Nimai Contract & Version Policy

This document defines compatibility guarantees for the Nimai public contracts:
MCP tool schemas, CLI flag interfaces, verdict block format, and core library exports.

---

## MCP Tool Contract (v1 — locked)

The 5 MCP tools and their input/output schemas are **locked at v1**:

| Tool | Input | Output |
|------|-------|--------|
| `nimai_spec` | `{repoPath, request}` | `{prompt, context[], clarifications_needed?}` |
| `nimai_validate` | `{specPath}` | `{issues[], passed}` |
| `nimai_review` | `{specPath}` | `{reviewerPrompt}` |
| `nimai_new` | `{outputPath}` | `{path, content}` |
| `nimai_spec_review` | `{specPath}` | `{specReviewerPrompt}` |

**Locked means:** tool names, required input keys, and output shape may not change without a major version bump.

### What constitutes a breaking change

- Renaming a tool (e.g. `nimai_spec` → `nimai_generate`) — **major**
- Removing a required input field — **major**
- Removing an output field that consumers may depend on — **major**
- Changing the type of an existing field — **major**

### What is backward-compatible (minor or patch)

- Adding an optional output field (e.g. `clarifications_needed?`) — **minor**
- Adding an optional input field — **minor**
- Strengthening LLM prompt text inside a tool (changes model output, not tool schema) — **patch**
- Adding a new tool — **minor**

---

## Verdict Block Format (Prompt 1.5 output)

The JSON verdict block emitted by the reviewing LLM is **not** part of the MCP tool schema
(the tool returns a `specReviewerPrompt` string). It is the LLM's response format — a convention
between the Prompt 1.5 instructions and the host agent's parser.

### Schema v1 (nimai ≤ 0.2.x)

```json
{"passed": true, "issues": []}
```

- `issues` is `string[]` — plain text issue descriptions
- No `schema_version` field

### Schema v2 (nimai ≥ 0.3.0)

```json
{
  "passed": false,
  "schema_version": "2",
  "issues": [
    {"dimension": "scope_coherence", "severity": "HARD_FAIL", "detail": "..."},
    {"dimension": "decomposition_realism", "severity": "NOTE", "detail": "..."}
  ]
}
```

- `issues` is `VerdictIssue[]` with `dimension`, `severity` (`HARD_FAIL` | `SOFT_FAIL` | `NOTE`), and `detail`
- `schema_version: "2"` field present

### Parser compatibility

`parseVerdict()` (exported from `nimai-core`) accepts **both v1 and v2** formats:
- v1 string items are wrapped as `{detail: string}`
- v2 object items are used as-is
- Malformed or absent blocks return `MALFORMED_VERDICT` (`passed: false`)

**Future versions:** if a v3 schema is needed, update `parseVerdict()` to accept v3 while keeping v1+v2 support, and bump the minor version.

---

## CLI Flag Interface

CLI flags are considered **stable** once shipped in a minor release.

- Removing or renaming a flag — **major**
- Adding a new flag — **minor**
- Changing a flag's default behavior — **minor** (document in CHANGELOG)

---

## Core Library Exports (`nimai-core`)

Exported types and functions are **stable** once in a minor release.

- Removing an exported symbol — **major**
- Renaming a type — **major**
- Adding a new export — **minor**
- Changing a function's internal logic without changing its signature — **patch**

### LintIssueType enum additions

New `LintIssueType` values are **additive** (minor, not major). Consumers that switch exhaustively
on `LintIssueType` should have a default/fallback case for forward compatibility.

---

## Version Bump Decision Guide

| Change | Bump |
|--------|------|
| Bug fix, advisory lint rule added | patch |
| New optional output field, new CLI flag, new export | minor |
| New tool, new MCP input field (optional) | minor |
| Breaking change to tool names or input/output shapes | **major** |
| MCP tool renamed or removed | **major** |
| CLI flag renamed or removed | **major** |
| Exported type removed or renamed | **major** |

> Rule of thumb: if a consumer using the previous version would break after upgrading without code changes, it's **major**.

---

## Pre-release Policy

- Alpha/beta releases use `0.x.y` semver — breaking changes are allowed between minor versions
- Once `1.0.0` is released, strict semver applies
- M3b (`nimai run`) trigger a `1.0.0` release only if the execution contract is locked and tested

---

## Changelog Requirement

Every version bump must have a CHANGELOG entry. No silent releases.
