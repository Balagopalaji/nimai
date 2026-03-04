# Nimai Independent Validation Convention

## The Dark Factory Principle

A fully reliable agent execution pipeline requires that the entity which builds the code does not also write the final validation tests used for sign-off.

When a builder writes its own E2E tests, it shapes the tests to match what it built — not what the spec required. Tests pass because the builder made them pass. This is **sycophantic validation**.

Independent validation breaks this loop.

---

## What Nimai Governs (Contract Layer)

Nimai owns the **oracle definition** — what must be independently verified, expressed as observable behaviors in the spec before the builder starts.

For every coding spec at Medium or High risk tier, Section 7 (If Coding) must include:

```
- Independent E2E behavior oracle: [observable behaviors an independent test must verify —
  stated as API-visible outcomes, not implementation details]
- Independent validation ownership: [who authors and runs the closure E2E — must not be
  the same agent/role that built the implementation; override requires explicit record]
```

The oracle must describe **what the system does**, not how it does it.

### Good oracle (behavior-based)
> Verify `open → assign → pending_handoff → handed_off` flow via API-visible outcomes; verify illegal transitions are rejected with deterministic errors; verify ownership changes are auditable in timeline views.

### Bad oracle (implementation-based)
> Call `session.transition_to('handed_off')` and assert `session.status == 'handed_off'`.

---

## What ChatMasala / Runtime Governs (Execution Layer)

The runtime (ChatMasala or equivalent) owns **role separation enforcement**:

- Builder agent and test-writer agent are separate roles, potentially separate LLM instances
- Builder does not see the final E2E test implementation before sign-off
- CI enforces that closure E2E is run after implementation, not during
- If the same agent must play both roles (resource constraint), the override is recorded explicitly

---

## Applicability

| Spec risk tier | Spec type | Oracle required? |
|---------------|-----------|-----------------|
| Low | Any | No |
| Medium | Coding / Tool / Server / API | Yes |
| High | Any | Yes |
| Medium | Docs / Research / Strategy | No |

---

## Relationship to Existing Nimai Tools

- `nimai_spec` → generates the oracle as part of the spec bundle
- `nimai_validate` → (future) checks that oracle is present for medium/high coding specs
- `nimai_spec_review` → Prompt 1.5 checks "start-without-clarification viability" — oracle completeness is one dimension
- `nimai_review` → Prompt 2 evaluates implementation against spec including oracle criteria

The execution mechanism (spawning separate test-writer agent, enforcing CI separation) is out of Nimai's scope — that belongs to the orchestration runtime.
