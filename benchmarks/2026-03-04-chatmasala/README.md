# Benchmark 1 — ChatMasala Data Model Spec
**Date:** 2026-03-04
**Domain:** Conversational AI platform (multi-agent chat routing, state machine)
**Spec reviewed:** ChatMasala data model and lifecycle state machine
**Nimai version used:** nimai-mcp@0.2.2

## Summary

First real-world benchmark of the nimai spec-review loop (Prompt 1.5).
Converged in **2 iterations**. ✅

## Loop Protocol

```
nimai_spec → builder fills spec → nimai_validate (PASS) → nimai_spec_review (LLM reviews)
                                                               ↓
                                                         Iteration 1: FAIL
                                                               ↓
                                                         Builder fixes spec
                                                               ↓
                                                    nimai_spec_review (re-review)
                                                               ↓
                                                         Iteration 2: PASS
```

## Iteration 1 — FAIL

**Reviewer:** Claude Sonnet 4.6 (via `nimai_spec_review` prompt)
**Verdict:** `passed: false`
**File:** `verdict-iteration-1.json`

**Root cause:** Scope coherence failure — conceptual lifecycle states used in descriptions
(`open`, `agent_assigned`, `handed_off`) were not mapped to the persisted enum values
(`active`, `pending_handoff`, `closed`) in the data model section. The two vocabularies were
inconsistent, leaving a builder unable to know which to implement.

**Remediation applied:**
- Builder added a lifecycle mapping table (conceptual → persisted status + side effects)
- Builder added explicit module boundary definition

## Iteration 2 — PASS

**Reviewer:** Claude Sonnet 4.6 (via `nimai_spec_review` prompt)
**Verdict:** `passed: true` on all 5 dimensions
**File:** `verdict-iteration-2.json`

All 5 dimensions clean:
1. ✅ Binary acceptance criteria
2. ✅ Scope coherence (mapping table resolved the conflict)
3. ✅ Constraint sufficiency
4. ✅ Decomposition realism
5. ✅ Start-without-clarification viability

## Notes

- Prompt 1.5 used during this benchmark was **schema v1** (5 dimensions, string[] issues).
- Future benchmarks should use **schema v2** (6 dimensions, object[] issues with severity).
- The input spec lives in the ChatMasala repository (not reproduced here due to cross-repo rule).
- Builder (Claude Sonnet 4.6, nimai run) and reviewer (Codex 5.3) were separate agents — role separation maintained.
