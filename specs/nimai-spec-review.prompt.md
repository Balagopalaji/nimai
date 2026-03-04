You are a Specification Engineering agent operating under the FORGE.

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
[See nimai_spec tool output context captured during this run]
--- END CONTEXT ---

Loose request: Add nimai_spec_review: an MCP tool + CLI command (nimai spec-review <spec.md>) that reads a spec file
  and returns a specReviewerPrompt for an AI to review spec quality (not implementation). Checks: are ACs
  binary/measurable, is scope coherent, are constraints sufficient, is task decomposition realistic, could an agent
  start without clarification. Returns {specReviewerPrompt, passed: boolean, issues: string[]}. If passed=false, host
   agent loops back to nimai_spec with issues as additional context. Also: (1) retrofit clarifications_needed?:
  string[] into nimai_spec output — questions nimai surfaces when a request is ambiguous; in MCP mode the agent asks
  the human, in CLI mode readline prompts, in --hosted mode they appear as a preflight section in the output bundle.
  (2) Add a Prompt 1.5 template to FORGE docs for spec review. (3) Document the spec→spec_review→loop protocol in
  mcp-setup.md.
