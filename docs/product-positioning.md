# Nimai — Product Positioning & Scope

_Version: 0.1 · March 2026 · Internal alignment doc_

---

## 1. Positioning

**One-sentence value prop:**
Nimai is the spec contract and validation layer between human intent and AI execution — it makes agent handoffs reliable by enforcing that work is specified, not just described.

**Who it is for:**
- Primary: developers and teams using AI coding agents (Claude Code, Codex, Cursor) across multi-session or multi-agent workflows
- Secondary: solo developers whose vibe-coded projects keep drifting or losing coherence across sessions

**Jobs-to-be-done:**
- Turn a vague feature request into a structured, agent-executable spec
- Validate that a spec is complete before handing it to an agent
- Generate a reviewer prompt to evaluate agent output against the original contract
- Provide a governance checkpoint that reduces drift, scope creep, and rework

**Why now:**
AI coding agents are increasingly capable, but they operate on intent — not contracts. The failure mode is not "agent can't code"; it is "agent built the wrong thing because the spec was ambiguous." Nimai addresses the pre-execution layer that current agent tooling skips.

---

## 2. What Nimai Does (In-Scope, Current)

- **Vague request → structured FORGE spec draft**: `nimai spec "<request>"` returns a populated Prompt 1 bundle (structured spec template + extracted repo context) for the host model to fill
- **Contracted spec shape**: enforces the FORGE structure — intent / specification / context / prompt / acceptance constraints / non-goals / change surface
- **Structural validation**: `nimai validate <spec.md>` catches unfilled placeholders, missing required sections, unresolved `[NEEDS HUMAN INPUT]` flags
- **Advisory lint**: flags missing interface contracts, module boundary violations, missing non-goals — as warnings, not blockers
- **Reviewer prompt generation**: `nimai review <spec.md>` generates Prompt 2 (the validator) for the host model to evaluate agent output against the original spec
- **MCP integration**: all four tools available as MCP server for Claude Code, Codex, Cursor

---

## 3. What Nimai Does NOT Do (Out-of-Scope, Current)

- **Not an autonomous execution runtime**: Nimai does not write code, run tasks, or manage agent sessions end-to-end (M3b — `nimai run` — is deferred)
- **Not a semantic truth engine**: Nimai cannot verify that acceptance criteria are realistic, that scope is internally consistent, or that a spec will produce good code
- **Not a replacement for deep repo context systems**: Nimai's context extractor is keyword-heuristic; tools like RepoPrompt provide richer, semantically-indexed repo context
- **Not a PRD or project management platform**: Nimai operates at the execution-contract layer, not the roadmap or backlog layer
- **Not an agent orchestrator**: Nimai does not route tasks to agents, manage parallelism, or handle retries

---

## 4. Differentiation

**vs. raw Claude / Codex usage:**
A raw prompt to Claude can produce a plan for a small, single-session task. Nimai wins when work spans multiple sessions, multiple agents, or is prone to drift — because it enforces a contract that any agent can pick up and validate against, regardless of conversation history.

**vs. repo context tooling (e.g., RepoPrompt):**
RepoPrompt solves context transport and discovery — getting the right files in front of the model. Nimai solves spec governance — ensuring the work is contracted before any code is written. They are complementary: RepoPrompt feeds richer context into `nimai spec`; Nimai enforces that the spec is complete before the context is used.

**Complementarity principle:**
Nimai is not a substitute for coding agents or context tools. It is the contract layer that makes their output verifiable and their handoffs reliable.

---

## 5. Validation Model Clarity

**Structural validation (today):**
`nimai validate` enforces contract shape:
- All required sections present
- No unfilled `___` placeholders
- No unresolved `[NEEDS HUMAN INPUT]` flags
- Advisory: missing interface contracts, module boundaries, non-goals, change surface

**What structural validation does NOT guarantee:**
- Acceptance criteria are truly testable
- Scope is coherent and non-contradictory
- Constraints match stated intent
- Tasks are realistically ordered
- Specs won't cause downstream agent confusion

**User expectation statement:**
A spec that passes `nimai validate` is structurally complete. It is not guaranteed to be semantically correct or agent-safe. Human review of spec quality remains required before high-stakes execution.

**Semantic validation (future direction):**
LLM-assisted quality checks on spec coherence, testability of acceptance criteria, and scope consistency. Not committed; requires usage data from structural validation phase.

---

## 6. Product Boundaries for Next Phase

**Stay in contract + governance realm:**
All near-term improvements should strengthen the spec contract, validation signal, or handoff quality — not expand into execution or orchestration.

**Must-have improvements before broader scale:**
1. Context extraction regression fixtures (expected top-k files per prompt type — prevent silent quality regressions)
2. Semantic quality checks, even lightweight (e.g., "does each acceptance criterion contain a measurable outcome?")
3. "When to use Nimai / when not to" guide in the README
4. Spec completeness benchmark: run nimai on 3+ real projects, measure pass rate and agent execution success

**What "ready to spec M3b" means (gates):**
- At least one full benchmark project completed end-to-end (ChatMasala loop)
- Structural validation pass rate measured and stable
- Handoff quality evaluated: can an agent execute from the spec without clarification?
- M3b FORGE spec written using nimai itself (dogfood gate — no exceptions)
- Hard boundaries defined: discovery phase, context snapshot lifecycle, agent handoff protocol, retry/escalation rules, deterministic artifacts

---

## 7. Success Metrics (Next 1–2 Releases)

| Metric | Definition | Target |
|--------|-----------|--------|
| Spec completeness pass rate | % of `nimai validate` runs that pass on first attempt | Baseline → improve |
| Handoff success rate | Agent executes from spec without requesting clarification | Measure in ChatMasala loop |
| Scope-drift reduction | Reviewer rejection reasons trend toward "minor" vs "fundamental" | Qualitative, track manually |
| Context extraction precision | Top-3 files match expected files for known prompts | Regression fixture coverage |
| M3b gate | M3b spec written via nimai, validated, reviewed | Binary |

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Overpromising semantic quality | Section 5 above is explicit; README must repeat the structural-only guarantee |
| Context extraction limitations | Keyword heuristics degrade on large or unconventionally structured repos; mitigate with regression fixtures and eventual semantic indexing |
| User confusion with overlap vs other tools | Publish the RepoPrompt complementarity note; link from README and mcp-setup.md |
| M3b scope creep | Dogfood gate enforced: no M3b build without a nimai-validated M3b spec first |
| False confidence from validation pass | "Passed validate" ≠ "spec is good"; make this explicit in CLI output (advisory message on pass) |

---

_This document is the alignment baseline for M3b scoping. Do not begin M3b implementation until the ChatMasala benchmark loop is complete and gates in Section 6 are met._
