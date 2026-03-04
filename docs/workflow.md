# Nimai Workflow Rules

## Role Separation: Reviewer vs Executor

The most important process rule in a Nimai-governed workflow:

**The entity that reviews a spec must not edit the artifacts produced by the entity that executes it.**

### What this means in practice

| Role | Owns | Must NOT |
|------|------|---------|
| Spec author (nimai_spec) | Draft spec file | Execute the spec |
| Executor / Builder | Implementation artifacts, tests | Edit the spec after approval |
| Reviewer (nimai_review / nimai_spec_review) | Review prompts, verdict | Edit builder artifacts directly |
| Validator (nimai_validate) | Pass/fail signal | Make editorial decisions |

### Why this matters

When a reviewer edits builder artifacts directly, the feedback loop collapses. The spec loses its authority as the contract. Errors get papered over rather than surfaced and fixed properly.

When a builder edits its own spec after approval, the spec stops being a contract and becomes a post-hoc justification.

### The correct flow when issues are found

```
nimai_spec_review → FAIL
       ↓
Reviewer reports issues (does NOT edit spec)
       ↓
Spec author (or original nimai_spec run) revises spec
       ↓
nimai_validate confirms structural completeness
       ↓
nimai_spec_review → PASS
       ↓
Builder executes
       ↓
nimai_review evaluates implementation
```

### Enforcement — Required Gate Checklist

Before merging any PR or closing a build task, answer these questions. **Any "yes" is a blocker.**

| # | Question | Block if |
|---|----------|---------|
| 1 | Did the reviewing agent (nimai_spec_review / nimai_review) edit any files in the builder's repo? | Yes |
| 2 | Did the builder edit the spec after it was approved (not during the fix loop)? | Yes |
| 3 | Did the reviewer patch a bug directly instead of reporting it? | Yes |
| 4 | Is the same agent acting as both builder and final reviewer for the same artifact? | Yes |
| 5 | Does the spec contain any pre-checked ACs (`- [x]`) that were not verified by the validator? | Yes |

If any gate fails:
1. Revert the violating change
2. Re-route through the correct role
3. Re-run `nimai_validate` and `nimai_spec_review` from scratch

In agent instructions: explicitly state which role the agent is playing **before it starts**.
When in doubt: flag, don't fix. A reviewer who finds a bug should report it, not patch it.

---

## Cross-Repo Artifact Rule

A reviewer operating in repo A must not edit files in repo B (the executor's repo), even to "help."

*Example:* During the ChatMasala benchmark, the spec review role (running from the nimai repo) identified issues in `chatmasala-data-model.md`. The correct action was to report the issues. Directly editing the ChatMasala file was a role violation — even though it was later reverted.

---

## AC Hygiene Rules

- ACs must not reference external project paths (e.g. no `ChatMasala/` paths in a forge spec)
- ACs that require real LLM execution must be marked **manual benchmark gates**, not unit test gates
- Pre-checked `[x]` ACs in a spec are invalid — ACs are unchecked until the work is verified complete

---

## Legacy Spec Migration

Specs written before v0.3.0 will be missing the `<!-- nimai-spec: YYYY-MM-DD -->` marker.
`nimai validate` will report this as an advisory warning. To stamp existing specs:

```bash
# Stamp a specific spec (replace with actual date)
echo '\n<!-- nimai-spec: 2026-03-05 -->' >> path/to/your-spec.md

# Find all unmarked .md files in a repo (advisory only — safe to ignore if not nimai specs)
nimai validate path/to/spec.md
```

Specs created with `nimai new` are stamped automatically with today's date.
