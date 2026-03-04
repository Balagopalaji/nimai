/**
 * FORGE prompt builders — pure string functions, no IO, no LLM calls.
 * These live in @nimai/core so any package can import them without
 * depending on @nimai/mcp internals.
 */

/**
 * FORGE Prompt 1 — Self-Spec Agent (from FORGE-quickref.md).
 * Returns the populated prompt ready to hand to a host model.
 */
export function buildPrompt1(request: string, contextSummary: string): string {
  return `You are a Specification Engineering agent operating under the FORGE.

Your job is to take the loose request below and generate a complete draft spec
using the framework's structure. Do not execute the request — only spec it.

For each section, fill in what you can infer and mark anything uncertain
with [NEEDS HUMAN INPUT: reason].

Generate:
1. Final deliverable (precise, format, measurable quality bar)
2. Scope boundaries (in / out)
3. Agent deployment purpose (what it is, is not, who consumes output)
4. Trade-off hierarchy (ranked: accuracy / speed / cost / safety / other)
5. Constraint architecture (Must / Must-Not / Prefer / Escalate)
6. Task decomposition (sub-tasks under 2 hours, with acceptance criteria)
7. Risk tier (Low / Medium / High with reasoning)
8. Cognitive mode per sub-task
9. Context needed (what the executing agent requires)
10. Proposed validator prompt (what a reviewer should check)

--- REPO CONTEXT ---
${contextSummary || '(no repo context extracted)'}
--- END CONTEXT ---

Loose request: ${request}`;
}

/**
 * FORGE Prompt 1.5 — Spec-Quality Reviewer.
 * Returns a prompt for a reviewing LLM to evaluate whether a draft spec is
 * executable by an agent without requiring clarifying questions.
 *
 * The reviewing LLM MUST end its response with a machine-parseable JSON verdict block:
 *   ## Verdict
 *   ```json
 *   {"passed": true, "issues": []}
 *   ```
 * The host agent parses this block to drive the spec-review loop.
 */
export function buildPrompt15(specContent: string): string {
  return `You are a Specification Quality Reviewer operating under the FORGE framework.

Your job is to evaluate the draft spec below for **spec quality only** — not implementation correctness.
Do NOT assess any code, code diffs, or implementation output.

## What to check

Evaluate each dimension with a binary PASS or FAIL:

1. **Binary acceptance criteria** — are all sub-task ACs measurable and unambiguous?
2. **Scope coherence** — are in-scope and out-of-scope boundaries clearly stated and non-contradictory?
3. **Constraint sufficiency** — do Must / Must-Not / Prefer / Escalate constraints cover the key risks?
4. **Decomposition realism** — can each sub-task be completed within the stated 2-hour limit by a skilled agent?
5. **Start-without-clarification viability** — can an agent begin immediately with the context provided, without asking the human for more information?

## Output format

For each check, write: **[PASS]** or **[FAIL]** followed by a one-sentence rationale.

Then write a consolidated summary listing all failing dimensions and their remediation guidance.

Note: implementation correctness is explicitly out of scope for this review.

## Important

Always end your response with the following verdict block as the **final section**, regardless of pass/fail outcome.
The host agent parses this block to drive the loop — if it is absent or malformed, the host will treat the result as ambiguous and escalate to the human.

## Verdict
\`\`\`json
{"passed": true, "issues": []}
\`\`\`

---

## Draft spec to review

${specContent}`;
}

/**
 * FORGE Prompt 2 — Reviewer / Validator Prompt Generator (from FORGE-quickref.md).
 * Returns the populated reviewer prompt derived from an approved spec.
 */
export function buildPrompt2(specContent: string): string {
  return `You are a Specification Engineering agent.

Given the approved spec below, generate a Reviewer Prompt — precise instructions
for a validator agent or solo reviewer to check the executing agent's output.

The Reviewer Prompt must:
- State exactly what is being checked and why
- List binary pass/fail criteria from the spec's acceptance criteria
- Include Adversarial Reflection sequence if risk tier is Medium or High
- Include uncertainty reporting requirements if domain is non-deterministic
- Specify what PASS looks like and what FAIL triggers (revise / escalate / abort)
- Be usable by a solo operator with no additional context

Approved spec:
${specContent}`;
}
