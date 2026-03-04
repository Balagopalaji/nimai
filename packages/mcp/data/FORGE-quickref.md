# FORGE Quick Reference
> **You are here:** This is the operational tool — the doc an agent uses during active work.
>
> **The other docs in this system:**
> - **Canonical Framework** (`FORGE-canonical.md`) — deep explanation of every concept. Go there to understand *why* something works, not just *what* to do.
> - **Spec Template** (`FORGE-spec-template.md`) — fill-in-the-blank form for a concrete project. Go there when you have a direction and need to turn it into an agent-ready brief.

---

## Agent Routing: What To Do Based On The Request

*Read the request and match it to a route before doing anything else.*

| If the request is… | Route |
|---|---|
| A new idea or creative problem — no direction yet | Run **Divergence → Convergence Loop** below. Stay in this doc. |
| A loose or vague request that needs structuring | Run **Self-Spec Agent** prompt (see below) to generate a draft spec. |
| A specific project ready to execute | Go to **Spec Template** → fill it out → deploy. |
| How to approach or frame something | Use **4 Layers + 5 Primitives** below. Deeper detail in Canonical doc. |
| Reviewing, validating, or debugging existing work | Run **Failure Mode Taxonomy** red-team below. |
| Something feels wrong mid-project | Check **Failure Mode Taxonomy** first, then check Intent Layer for drift. |
| A concept here that needs deeper explanation | Go to **Canonical Framework** for the full treatment. |
| Building a multi-agent or long-running system | Go to **Canonical Framework** → Execution Architecture + Extended Patterns. |

**Default rule:** Start here. Go to Canonical to understand. Go to Spec Template to execute.

---

## The Deeper Thesis
Agents fail not from lack of intelligence but from **underspecified control surfaces**. The four control surfaces are specification, intent, context, and prompt. Engineer all four.

---

## The 4 Engineering Disciplines / Control Surfaces

| Discipline | Control Surface | Skip It And… |
|---|---|---|
| **Prompt Craft** | Sub-task trigger | Agent doesn't know what to do right now |
| **Context Engineering** | Information environment | Agent works from noise or stale data |
| **Intent Engineering** | Values, trade-offs, deployment purpose | Agent resolves ambiguity the wrong way |
| **Specification Engineering** | Complete blueprint for "done" | Agent can't define done and never stops |

---

## The 4 Layers (in order of leverage)

| Layer | Role | Anti-Pattern |
|---|---|---|
| **1. Specification** | Defines exact "done" state + scope | Vague goals ("improve this") |
| **2. Intent** | Agent's deployment purpose + trade-off hierarchy | Agent doesn't know its own role |
| **3. Context** | Curated information environment | Dumping everything you have |
| **4. Prompt** | Fires sub-task + assigns cognitive mode | Over-engineering this layer |

---

## The 5 Primitives (every sub-task must pass all 5)

1. **Self-Contained** — Zero questions needed to start
2. **Constrained** — Must / Must-Not / Prefer / Escalate defined
3. **Modular** — Under 2 hours; independently verifiable
4. **Acceptance Criteria** — Binary, measurable (not "looks good")
5. **Evaluation** — Built-in check before reporting complete

---

## Pre-Execution Decisions (set BEFORE decomposition)

**Risk Tier:**
| Tier | Validation |
|---|---|
| Low | Self-check only |
| Medium | Validator pass |
| High | Validator + Adversarial Reflection + Human gate |

**Resource Governance:** Model tier · Max runtime · Cost budget · Retry limit · Cost escalation trigger

---

## Cognitive Modes (reasoning postures, not personas)

| Mode | Use When |
|---|---|
| **Deterministic** | Implementation; answer is knowable |
| **Exploratory** | Research, brainstorming, hypothesis generation |
| **Adversarial** | Security, risk, stress-testing |
| **Synthesis** | Integrating multiple outputs |
| **Audit** | Validation only — do not produce |

**Over-specification warning:** Constrain evaluation, not divergence. In Exploratory phases, tight constraints on generation defeat the purpose. Reserve hard constraints for Adversarial and Deterministic phases.

**Mode × Risk compatibility:** Exploratory mode is a pre-commitment mode. High risk tasks should be in Deterministic or Audit by final delivery. Exploratory + High risk as a final-delivery combination is a design error.

---

## Divergence → Convergence Loop (brainstorming)

```
Exploratory  →  Synthesis  →  Adversarial  →  Deterministic
  DIVERGE        CLUSTER      STRESS-TEST      FORMALIZE
```
Generate wide → cluster patterns → attack top candidates → execute selected direction.

---

## Failure Mode Taxonomy (red-team before deployment)

| Failure | Cause | Fix |
|---|---|---|
| Scope Creep | Ambiguous boundaries | Explicit Must-Not list |
| Hallucinated Completion | Subjective criteria | Binary acceptance criteria |
| Intent Drift | Unclear trade-offs or role | Ranked priorities + deployment purpose |
| Context Collapse | Too much noise | Aggressive curation; MCP for live sources |
| Runaway Cost | No resource ceiling | Hard caps before decomposition |
| Overconfident Output | No uncertainty surfacing | Uncertainty reporting for high-stakes tasks |

*If a failure doesn't fit these categories, extend the taxonomy — log it, identify root cause, add prevention.*

---

## Intent = Deployment Purpose + Trade-offs
Every agent must know: **what it is · what it isn't · who consumes its output · what to optimize for when uncertain**

## Adversarial Reflection (Medium/High risk)
Produce → steelman critique → evaluate → revise → re-validate

## Uncertainty Reporting (non-deterministic domains)
Confidence % · uncertainty drivers · what would change the answer · alternative interpretations

## Escalation Contract
WHEN to stop · WHAT to report (include confidence) · WHO decides (named + SLA) · WHAT if no response

## Context Hygiene
2k high-signal tokens > 20k low-signal tokens · MCP for live sources · specify when to re-fetch

---

## When To Use This Framework

The overhead should be proportional to the cost of failure. Use this as your guide:

| Situation | What to use |
|---|---|
| Task is reversible, low-stakes, under 1 hour | Routing table above + nothing else. Just start. |
| Task is consequential or takes more than 1 hour | Quickref checklist minimum. Self-Spec agent if unsure. |
| Task is high-risk, irreversible, or affects others | Full Spec Template + Adversarial Reflection + Validator |
| You're not sure | Ask: "What's the cost if this goes wrong?" Scale accordingly. |

**The philosophy:** This framework exists to absorb any project — coding, science, writing, business, anything — and give it the structure needed to succeed without fail. Use as much or as little as the project demands. The principles apply universally; the overhead scales with stakes.

---

## Solo Operator Mode

If you are working alone without a team, validators, or named escalation contacts, adapt as follows:

**Escalation contract:** You are the reviewer. Set a time delay instead of an SLA — *"I will not proceed on this decision for 24 hours."* Distance and time create the same circuit-break that a second person would.

**Validation:** For Medium risk, run the Adversarial Reflection yourself or have a second agent session do it cold — paste the output into a fresh context with no prior history and ask it to find flaws.

**High risk solo:** Add a mandatory pause before any irreversible action. Write out the decision, the alternatives you considered, and your confidence level before executing. This is your human gate.

**The Self-Spec + Reviewer pipeline replaces team infrastructure** — see below.

---

## Self-Spec Agent + Reviewer Pipeline

This is the solo operator's complete workflow. Two prompts replace an entire team process.

---

### Prompt 1 — Self-Spec Agent
*Use when you have a loose idea or vague request and need it turned into a complete spec.*

Paste this prompt to any capable model along with your loose request:

```
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

Loose request: [PASTE YOUR REQUEST HERE]
```

Review the output. Resolve all [NEEDS HUMAN INPUT] flags. Adjust anything that
doesn't match your intent. Approved spec = your deployment brief.

---

### Prompt 2 — Reviewer / Validator Prompt Generator
*Run this after Self-Spec is approved. Paste along with the approved spec.*

```
You are a Specification Engineering agent.

Given the approved spec below, generate a Reviewer Prompt — precise instructions
for a validator agent or solo reviewer to check the executing agent's output.

The Reviewer Prompt must:
- State exactly what is being checked and why
- List binary pass/fail criteria from the spec's acceptance criteria
- Include Adversarial Reflection sequence if risk tier is Medium or High
- Include uncertainty reporting requirements if domain is non-deterministic
- Specify what PASS looks like and what FAIL triggers (revise / escalate / abort)
- Be usable by a solo operator with no additional context

Approved spec: [PASTE APPROVED SPEC HERE]
```

---

### The Complete Solo Pipeline

```
Loose request
    ↓
Self-Spec Agent → draft spec
    ↓
Human reviews + resolves [NEEDS HUMAN INPUT] flags
    ↓
Approved spec → Reviewer Prompt Generator → validator prompt
    ↓
Deploy executing agent with approved spec
    ↓
Paste output + validator prompt into fresh agent session
    ↓
PASS → done  |  FAIL → revise or escalate
```

---

## Pre-Deployment Checklist

**Specification**
- [ ] Deliverable precise; scope boundaries explicit
- [ ] Sub-tasks satisfy all 5 Primitives

**Intent**
- [ ] Each agent has explicit deployment purpose
- [ ] Trade-off hierarchy ranked; escalation contract complete

**Context**
- [ ] Context curated; MCP for live sources; freshness strategy set

**Execution** *(set before decomposition)*
- [ ] Risk tier assigned
- [ ] Resource Governance parameters set
- [ ] Cognitive mode per sub-task assigned
- [ ] Validation routes by risk tier
- [ ] Adversarial Reflection for medium/high risk
- [ ] Uncertainty reporting for non-deterministic domains

**Meta**
- [ ] Spec red-teamed against Failure Mode Taxonomy
- [ ] Planner execution plan will be saved as artifact
- [ ] Living Specification log set up (multi-session)

---

*FORGE v1.0 — Framework for Orchestrating Reliable Generative Execution*
*System docs: Quick Reference (this doc) · Canonical Framework · Spec Template*
