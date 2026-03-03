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
