# Nimai Spec Review Loop — Build Spec

> Generated from `nimai_spec` output prompt bundle on 2026-03-04.

---

## Pre-Flight

**Risk tier:** Medium
- Adds a new MCP tool and CLI command surface
- Introduces a loop protocol that affects host orchestration behavior
- Adds a new optional output field to existing `nimai_spec` output contract

**Primary cognitive mode:** Deterministic

**Resource governance:**
- Max runtime per sub-task: 2 hours
- Retry limit before escalation: 2
- Escalate if MCP contract updates break existing tests for current four tools

---

## 1. Specification Layer

### 1.1 Final Deliverable

Deliver a coherent spec-quality review workflow with these shipped outputs:

1. New MCP tool: `nimai_spec_review`
- Input: `{ specPath: string }`
- Output: `{ specReviewerPrompt: string }` — nimai returns the prompt only; it makes no LLM calls
- Behavior: reads a spec file and returns a Prompt 1.5 for an LLM to evaluate spec quality. The LLM's response must include a structured JSON verdict block (see section 4.1); the host agent parses that block to get `{passed: boolean, issues: string[]}` and drives the loop.

2. New CLI command: `nimai spec-review <spec.md>`
- Calls the same core logic as MCP tool
- Prints `specReviewerPrompt`, pass/fail status, and issue list
- Supports deterministic stdout shape suitable for host-agent parsing

3. `nimai_spec` output extension
- Add optional field `clarifications_needed?: string[]`
- Field contains concrete follow-up questions when request ambiguity blocks reliable spec drafting

4. Clarification handling semantics per mode
- MCP mode: host asks the human each clarification question
- CLI interactive mode: use `readline` to prompt user and capture answers
- CLI hosted mode (`--hosted`): include a preflight clarifications section in output bundle; do not block for input

5. Documentation updates
- Add Prompt 1.5 template for spec-quality review to FORGE docs and MCP data mirrors where applicable
- Document full `spec -> spec_review -> loop` protocol in `docs/mcp-setup.md`

### 1.2 Scope Boundaries

**In scope:**
- MCP contract updates in `packages/mcp/src/contract.ts`
- New tool implementation in MCP package and tool registration
- CLI command wiring in `packages/cli/src/index.ts` and new command handler
- Shared prompt builder updates in `packages/core/src/prompts.ts` for Prompt 1.5 template
- CLI hosted output formatting changes for clarifications preflight section
- Unit tests for MCP tool contract, CLI command behavior, and new `clarifications_needed` shape
- Docs updates in `docs/mcp-setup.md`, root FORGE docs, and mirrored `packages/mcp/data/*` docs as needed

**Out of scope:**
- Executing implementation code review against delivered code changes
- New network/API integrations
- Changes to existing `nimai_validate` lint rules beyond compatibility with new artifacts
- Autonomous loop execution inside MCP server (loop remains host-orchestrated)

### 1.3 Agent Deployment Purpose

- **What it is:** a specification quality gate that evaluates whether a draft spec is executable by an agent without clarifying questions
- **What it is not:** an implementation correctness checker or code review tool
- **Primary consumers:** host AI orchestration flows, CLI users preparing specs, and MCP hosts requiring deterministic pre-execution quality checks

### 1.4 Trade-off Hierarchy

1. Accuracy of spec-quality diagnostics
2. Safety and deterministic behavior
3. Developer ergonomics and clarity of output format
4. Speed of execution
5. Cost (minimal direct cost since no internal LLM calls)

### 1.5 Constraint Architecture

**Must:**
- Preserve no-internal-LLM-call invariant for MCP/CLI tools
- Return exact output keys for `nimai_spec_review`
- Keep `clarifications_needed` optional and backward compatible
- Keep checks focused on spec quality dimensions listed in request

**Must-Not:**
- Must not assess implementation output or code diffs
- Must not change existing tool names or remove existing output keys
- Must not require interactive prompts in `--hosted` mode

**Prefer:**
- Reuse existing prompt-builder and tool wiring patterns
- Keep prompt templates in both canonical docs and MCP data mirrors aligned
- Keep test coverage parallel to existing `nimai_review`/`nimai_spec` patterns

**Escalate:**
- If adding `clarifications_needed` would require a contract version bump due to strict consumers
- If spec-review pass/fail heuristics are ambiguous enough to require product policy decisions

### 1.6 Task Decomposition (2-hour rule)

1. **Contract + type updates**
- Files: MCP contract, shared types
- Acceptance criteria:
  - `nimai_spec_review` input/output schemas compile
  - `clarifications_needed?: string[]` appears in `ForgeSpecOutput`

2. **Prompt 1.5 builder + checks definition**
- Files: `packages/core/src/prompts.ts` (+ optional helper)
- Acceptance criteria:
  - Returns deterministic `specReviewerPrompt`
  - Prompt encodes checks: binary ACs, scope coherence, constraints sufficiency, decomposition realism, start-without-clarification viability

3. **MCP tool implementation + registration**
- Files: `packages/mcp/src/tools/*`, server registry, tests
- Acceptance criteria:
  - Tool reads `specPath`, generates prompt, computes `passed` and `issues`
  - Tool discoverable in `tools/list` and tests assert name/shape

4. **CLI command implementation**
- Files: `packages/cli/src/index.ts`, new command module, tests
- Acceptance criteria:
  - `nimai spec-review <spec.md>` exits `0` when passed, `1` when failed (or documented behavior)
  - Stdout contains prompt and issue summary in deterministic sections

5. **Clarification flow retrofit**
- Files: `packages/mcp/src/tools/spec.ts`, `packages/cli/src/commands/spec.ts`, tests
- Acceptance criteria:
  - MCP output includes `clarifications_needed` when ambiguity detected by rule-based heuristics: (1) request under 10 words, (2) zero repo files matched by context extractor, (3) no domain nouns detected (no entities/actions — tokenizer finds no words matching common entity/verb patterns), (4) conflicting stack hints (e.g. request mentions both "Python" and "TypeScript" without explicit separation)
  - CLI interactive mode prompts via `readline`
  - Hosted output includes preflight clarifications section without prompting

6. **Docs and protocol updates**
- Files: FORGE docs and `docs/mcp-setup.md`
- Acceptance criteria:
  - Prompt 1.5 section exists and is discoverable
  - `spec -> spec_review -> loop` protocol documented with clear host responsibilities

7. **Validation and regression checks**
- Commands: package tests relevant to core/mcp/cli
- Acceptance criteria:
  - Existing tests pass or are updated with explicit reasoning
  - New tests cover success and failure paths for spec-review and clarifications behavior

### 1.7 Risk Reasoning

- **Medium risk** due to cross-package contract changes and multiple surfaces (core, mcp, cli, docs)
- Principal risk is silent contract drift between tool schemas, CLI output, and docs examples

### 1.8 Cognitive Mode by Sub-task

- Contract updates: Deterministic
- Prompt template authoring: Synthesis + Deterministic
- Tool and CLI implementation: Deterministic
- Clarification UX handling: Synthesis
- Docs updates: Deterministic
- Regression testing: Audit

---

## 2. Intent Layer

### 2.1 Mission Intent

Enable reliable spec handoff quality by introducing an explicit pre-execution spec review stage and deterministic remediation loop when quality checks fail.

### 2.2 Success Definition

- A host can call `nimai_spec_review` and reliably decide pass/fail before deployment
- Failing specs return actionable issues and can be looped back into `nimai_spec` with additional context
- Ambiguous requests surface explicit clarifications through channel-appropriate behavior

### 2.3 Non-goals

- No automatic implementation generation
- No autonomous multi-step execution inside server
- No subjective style grading outside defined spec-quality checks

### 2.4 Decision Policy

When uncertainty exists, choose behavior that favors deterministic outputs and explicit escalation over implicit assumptions.

---

## 3. Context Layer

### 3.1 Required Code Context

- `packages/core/src/prompts.ts`
- `packages/mcp/src/contract.ts`
- `packages/mcp/src/tools/spec.ts`
- Existing review tool implementation and descriptors
- `packages/cli/src/index.ts`
- `packages/cli/src/commands/spec.ts`
- Existing CLI test and MCP test suites
- `docs/mcp-setup.md`
- FORGE docs and mirrored files under `packages/mcp/data/`

### 3.2 External Constraints

- Tool contracts are explicitly version-sensitive
- Existing no-LLM-inside-tools architecture remains unchanged
- CLI and MCP should preserve deterministic behavior for automation consumers

### 3.3 Assumptions

- Host agents can orchestrate loop logic externally
- `spec.md` files follow FORGE shape closely enough for rule-based checks
- Optional fields are acceptable for backward compatibility in current consumers

---

## 4. Prompt Layer

### 4.1 Prompt 1.5 Template Requirements

Prompt 1.5 must instruct a reviewer AI to evaluate only spec quality and emit:
- Binary verdict per check category
- Consolidated pass/fail
- Clear issue list mapped to remediation guidance
- Explicit note that implementation correctness is out of scope
- **A machine-parseable JSON verdict block as the final section of the response, exactly:**
  ```
  ## Verdict
  ```json
  {"passed": true, "issues": []}
  ```
  ```
  Strict parsing rules the host agent must enforce:
  - Parse the **last** fenced ```json block in the response only
  - Required keys: `passed` (boolean) and `issues` (array of strings) — no others required
  - Max size: 50 issues, each issue string ≤ 200 chars
  - No trailing prose after the closing fence is required or expected
  - Malformed or absent block → treat verdict as `{passed: false, issues: ["verdict block missing or malformed"]}` and surface to human before retrying; do not silently assume pass

### 4.2 Proposed Validator Prompt (for this spec)

Validate that implementation delivers:
- Exact `nimai_spec_review` output shape and deterministic behavior
- Accurate check coverage for all required quality dimensions
- Backward-compatible `clarifications_needed?: string[]` in `nimai_spec` output
- Correct mode-dependent clarification behavior (MCP ask-human, CLI readline, hosted preflight section)
- Documentation completeness for Prompt 1.5 and loop protocol
- Tests covering contract, CLI, and behavior edge cases

Mark FAIL if any required shape or behavior is missing. Mark PASS WITH NOTES only for non-blocking documentation phrasing issues.

---

## 5. Governance & Validation

### 5.1 Review Gates

1. Contract gate
- MCP descriptors include `nimai_spec_review`
- Tool output schema and runtime output align

2. Behavior gate
- `passed` and `issues` derived from explicit checks
- Loop handoff guidance available when failed

3. Clarification gate
- `clarifications_needed` appears only when needed and in expected channels

4. Documentation gate
- Prompt 1.5 documented in FORGE docs
- Protocol documented in `docs/mcp-setup.md`

### 5.2 Verification Commands

- `pnpm build`
- `pnpm test`
- Targeted suites for MCP and CLI if available

### 5.3 Final Acceptance Criteria

- AC1: New MCP tool exists and returns `{specReviewerPrompt: string}` only; `passed`/`issues` are produced by the reviewing LLM via the Prompt 1.5 verdict block, not by nimai
- AC2: CLI command `nimai spec-review <spec.md>` exists and outputs a deterministic `specReviewerPrompt` (not a pre-evaluated review result)
- AC8: `docs/release-checklist.md` includes a manual benchmark step: verify spec-review loop converges in ≤3 iterations before M3b (no automated test — requires real LLM calls)
- AC3: `nimai_spec` supports optional `clarifications_needed?: string[]`
- AC4: Clarification behavior differs correctly across MCP, CLI interactive, and hosted modes
- AC5: Prompt 1.5 is added to FORGE documentation
- AC6: `docs/mcp-setup.md` documents `spec -> spec_review -> loop` protocol
- AC7: Tests updated to cover all new behavior and pass

