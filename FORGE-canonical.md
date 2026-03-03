# FORGE: Framework for Orchestrating Reliable Generative Execution
> **You are here:** This is the Canonical Framework — the deep reference doc. It explains every concept in full.
>
> **The other docs in this system:**
> - **Quick Reference** (`FORGE-quickref.md`) — the operational tool. Use this during active agent work. If you're an agent trying to decide what to do with a request, start there, not here.
> - **Spec Template** (`FORGE-spec-template.md`) — fill-in-the-blank form for specifying a project. Go there when you have a direction and need to build the full brief.
>
> **When to be in this doc:** When you need to understand a concept deeply, design a new system, train someone on the framework, or reference the full detail behind a quickref entry. For active task execution, the Quick Reference is faster and more appropriate.

---

> **Core Insight:** Agent output quality is almost entirely determined by the completeness of the initial specification, not by the capability of the model. A mediocre spec defeats a great model. A great spec elevates any model.
>
> **The deeper thesis:** Agents fail not from lack of intelligence but from underspecified control surfaces. The quality of an autonomous AI system is determined by how well you engineer its four control surfaces — specification, intent, context, and prompt.

---

## Mental Model: The Paradigm Shift

| Old Paradigm | New Paradigm |
|---|---|
| Prompt engineering (craft the perfect sentence) | Process engineering (build a complete specification system) |
| Synchronous chat (you iterate in real time) | Asynchronous deployment (agent runs unattended for hours/days) |
| AI as a tool you operate | AI as a workforce you manage |
| Output quality = prompt cleverness | Output quality = specification completeness |

The bottleneck is no longer what the model can do. It is what you give it to work with.

---

## The 4 Engineering Disciplines

Most people collapse everything into prompting. That is a category error. There are four distinct disciplines — four control surfaces — and you need all four. Weakness in any one cascades into the others.

| Discipline | Control Surface | The Failure If You Skip It |
|---|---|---|
| **Prompt Craft** | The individual instruction that triggers a sub-task | The agent doesn't know what to do right now |
| **Context Engineering** | The curated information environment | The agent works from incomplete or noisy information |
| **Intent Engineering** | The agent's values, trade-offs, and self-awareness of its role | The agent resolves ambiguity in ways you didn't want |
| **Specification Engineering** | The complete, agent-readable blueprint for the whole project | The agent can't define "done" and never stops or stops too early |

Each discipline maps to a layer in the stack below.

---

## The 4-Layer Specification Stack

Think of this as the difference between handing a contractor a napkin sketch vs. a full architectural blueprint. Agents need blueprints.

### Layer 1 — Specification (The Blueprint)
**Engineering discipline:** Specification Engineering

**What it is:** The master document defining what "done" looks like.

**What it must contain:**
- The final deliverable described precisely — not "a good analysis" but "a 3-section report with quantitative conclusions and a single recommendation"
- Modular breakdown of the project into independently completable components
- Explicit scope boundaries: what is *in* and what is *out*

**Domain examples:**
- *Coding:* Feature spec with input/output contracts, edge cases, performance targets
- *Science:* Hypothesis, methodology, data sources, expected output format, statistical threshold for success
- *Writing:* Audience, length, tone, structure, mandatory inclusions
- *Business:* Decision to be made, options to evaluate, criteria for recommendation

**Anti-pattern:** Vague goals like "research this topic" or "improve the code." An agent cannot complete what it cannot define as complete.

---

### Layer 2 — Intent (The Compass)
**Engineering discipline:** Intent Engineering

**What it is:** The values, priorities, decision rules, and deployment purpose that guide autonomous behavior when the agent encounters ambiguity — which it always will.

Intent operates on two levels that must both be explicit:

**Level A — Deployment Awareness (Why this agent exists):**
Every agent must understand the specific purpose for which it has been deployed. This is not the same as the task description. It is the agent's self-model: *I am a research agent whose job is to synthesize literature, not to draw conclusions. My output feeds a human decision-maker, not another agent.* Agents with clear deployment awareness make better local decisions because they understand their role in the larger system.

**Level B — Organizational Trade-offs (How to resolve ambiguity):**
When the agent hits a fork in the road, what does it optimize for? This must be stated as a ranked hierarchy, not left to inference.

**What it must contain:**
- Agent's explicit deployment purpose: what role it plays, who or what consumes its output, what it is *not* responsible for
- A ranked trade-off hierarchy (e.g., "Accuracy > Speed > Cost" or "Safety > Novelty > Elegance")
- Escalation triggers: explicit conditions under which the agent must stop and surface a decision to a human rather than guess
- Persona or role framing if relevant
- Forbidden approaches — not just what to do, but what to avoid and why

**Domain examples:**
- *Coding:* "You are a refactoring agent. You improve existing code structure. You do not add features. Escalate if a change touches auth or payments."
- *Science:* "You are a literature synthesis agent. You summarize and connect findings. You do not run analysis or draw original conclusions. Flag if p-value > 0.05 before citing a study as confirmatory."
- *Legal/Business:* "You are a research agent preparing options for a human decision-maker. You do not make commitments or recommendations. Flag all regulatory mentions for human review."

**Anti-pattern:** Leaving judgment calls implicit, or failing to tell the agent what role it plays. An agent that doesn't know why it exists will optimize for the wrong things.

---

### Layer 3 — Context (The Environment)
**Engineering discipline:** Context Engineering

**What it is:** The curated information environment the agent operates within. More context is not always better — irrelevant context degrades performance.

**What it must contain:**
- Relevant background documents, standards, or prior work
- Current state of the problem: what has been tried, what failed, known constraints
- Terminology or domain conventions the agent needs to match
- Memory artifacts from prior runs if this is a continuation
- Explicit signals about what context to distrust or treat as potentially stale

**Key principle — Context Hygiene:** Only include tokens that are *load-bearing* for the task. Noise dilutes signal. A well-curated 2,000-token context outperforms a bloated 20,000-token one.

**When to fetch new data:** If the task involves time-sensitive information, external systems, or any domain where assumptions may have shifted, specify this explicitly. Tell the agent when to treat its context as a starting point for verification rather than ground truth.

**MCP Integration:** Use Model Context Protocol (MCP) servers to link live, structured context sources — codebases, databases, documentation — rather than copy-pasting stale snapshots. MCP connections give the agent current state; static dumps give it a photograph of past state.

**Domain examples:**
- *Coding:* Codebase conventions, relevant modules, known bugs, architecture diagrams
- *Science:* Literature summary, dataset schema, lab protocols, prior negative results
- *Writing:* Style guide, audience research, competitive examples, brand voice doc

**Anti-pattern:** Dumping everything you have. Curate deliberately.

---

### Layer 4 — Prompt (The Trigger)
**Engineering discipline:** Prompt Craft

**What it is:** The individual instruction that fires a specific sub-task. This is what most people think of as "prompt engineering." It is now table stakes, not the main event.

**What it must contain:**
- Clear, unambiguous instruction for this specific task
- Reference to which part of the specification this fulfills
- Expected output format
- The cognitive mode appropriate for this task (see Cognitive Mode Selection below)

**Note:** If Layers 1–3 are solid, this layer becomes almost formulaic. Your leverage is upstream.

---

## The 5 Primitives of Agent-Ready Input

Every sub-task handed to an agent must satisfy all five. Missing even one creates a failure point.

### 1. Self-Contained Problem Statement
The agent must be able to begin and complete the task with zero additional human input. Describe the problem so exhaustively that a smart person who knew nothing about your project could execute it correctly.

**Test:** Read your spec cold. Are there any points where you would have to ask a clarifying question? Those are holes.

### 2. Constraint Architecture (Must / Must-Not / Prefer / Escalate)
Define the boundaries explicitly:
- **Must:** Non-negotiable requirements
- **Must-Not:** Hard prohibitions
- **Prefer:** Soft preferences when trade-offs arise
- **Escalate:** Conditions that require human judgment before proceeding

**Why it matters:** Agents are highly capable of doing exactly what you did not want if you did not say not to.

### 3. Modular Decomposition — The 2-Hour Rule
Break the project into sub-tasks that can each be completed and *verified* in under 2 hours of compute. Longer tasks compound error rates and make failure harder to diagnose.

**Why it matters:** A failed 8-hour run is a catastrophe. A failed 90-minute sub-task is a recoverable data point. Shorter tasks also allow checkpointing — the ability to resume from a known-good state.

**For science/research:** Each sub-task should produce a falsifiable intermediate output (e.g., "cleaned dataset," "literature summary with citations," "statistical test results").

### 4. Acceptance Criteria — Binary Definition of Done
Establish measurable, unambiguous conditions that prove the task is complete. Avoid subjective criteria ("good quality") in favor of testable ones.

**Examples:**
- *Coding:* "All unit tests pass. No linting errors. Function handles null input without throwing."
- *Science:* "Dataset has zero null values in columns A–F. Summary statistics match expected range."
- *Writing:* "Under 800 words. Includes three specific examples. No jargon undefined on first use."

**Anti-pattern:** "The output looks right." This is not a criterion.

### 5. Evaluation Design — Built-In Validation
Build a test or check that programmatically (or procedurally) verifies the output before delivery. This is the agent's internal QA step. For complex tasks, include a reflection pass: the agent re-reads its own output against the acceptance criteria before reporting completion.

**Examples:**
- Automated tests / linters for code
- Schema validation for data outputs
- A second agent pass that checks against the acceptance criteria
- A rubric-based self-evaluation prompt appended to the task

---

## Resource Governance

> **Assign resource governance parameters before decomposition begins — not retrofitted after planning is underway.**

Autonomous systems must operate within explicit resource constraints. Unbounded reasoning degrades output quality and explodes cost. Constraint improves clarity.

| Parameter | What to Specify |
|---|---|
| **Model tier** | Planner-class (high capability) vs. Worker-class (fast, cheap) per role |
| **Max runtime per sub-task** | Hard ceiling; triggers re-queue or escalation if exceeded |
| **Total compute budget** | Token or cost ceiling for the full run |
| **Retry limit** | Maximum attempts before escalating to human |
| **Parallelism level** | How many workers can run simultaneously |
| **Cost escalation trigger** | Threshold at which the agent must stop and report before continuing |

**Why it matters:** The most common silent failure in long-running agents is not wrong output — it is runaway cost and infinite refinement loops. Governance prevents both.

**Anti-pattern:** "Let it think as long as it needs." That is not a strategy. It is an unclosed loop.

---

## Risk Classification

> **Assign the risk tier before decomposition begins — not after.**

Not all tasks deserve the same validation rigor. If you are uncertain about the tier, go one level higher.

| Risk Tier | Characteristics | Validation Required |
|---|---|---|
| **Low** | Reversible, internal, low-stakes (draft post, exploratory analysis) | Self-check against acceptance criteria only |
| **Medium** | Consequential but recoverable (internal refactor, client-facing report) | Validator pass + acceptance criteria check |
| **High** | Irreversible, external, or high-impact (production deploy, financial analysis, published research) | Validator + Adversarial Reflection + Human escalation gate |

**Risk and cognitive mode interaction:** Exploratory mode and High risk validation are usually incoherent as a final-delivery combination. Exploratory mode belongs in divergence phases — generating options before commitments are made. By the time an output reaches High risk validation, the agent should be in Deterministic or Audit mode. If your workflow has an agent in Exploratory mode producing a High risk final deliverable, that is a design error to fix before execution, not after.

---

## Execution Architecture: Planner → Worker → Validator

This three-role structure maintains fidelity to original intent across long, complex runs.

```
[Human Specification]
        ↓
   ┌─────────────────────────────────────────────┐
   │              PLANNER MODEL                  │
   │  High-capability. Ingests full spec.         │
   │  Assigns risk tier (must be pre-execution). │
   │  Sets resource caps per sub-task.           │
   │  Selects cognitive mode per sub-task.       │
   │  Decomposes using 5 Primitives.             │
   │  Writes intent brief for each worker.       │
   │  Saves execution plan as artifact.          │
   └──────────────────┬──────────────────────────┘
                      ↓
   ┌──────────────────────────────────────────────────┐
   │                WORKER MODELS                     │
   │  Faster / specialized. Each receives:            │
   │    - Sub-task spec                               │
   │    - Intent brief (deployment purpose + role)    │
   │    - Cognitive mode instruction                  │
   │    - Resource cap                                │
   │  Executes against acceptance criteria.           │
   └──────────────────┬───────────────────────────────┘
                      ↓
   ┌──────────────────────────────────────────────────────┐
   │                 VALIDATOR / EVAL                     │
   │  Routes by risk tier:                               │
   │    Low  → acceptance criteria check only           │
   │    Med  → validator pass                           │
   │    High → validator + adversarial reflection       │
   │  PASS → deliver  │  FAIL → re-queue               │
   │  (up to retry limit, then escalate)                │
   └──────────────────┬───────────────────────────────────┘
                      ↓
   ┌──────────────────────────────────────────────────────┐
   │            HUMAN REVIEW (Escalation Gate)            │
   │  Triggered by: Escalate conditions, cost ceiling,   │
   │  retry limit exceeded, High risk output,            │
   │  or explicit spec flag.                             │
   └──────────────────────────────────────────────────────┘
```

**Key principle:** The Planner's output — the execution plan plus intent briefs — is itself a specification artifact. Save it. It becomes context for future runs and a diagnostic tool if something goes wrong.

---

## The Failure Mode Taxonomy

Red-team your spec against all six failure types before deployment. If a failure you encounter does not fit any of these categories, that is a signal to extend the taxonomy — log the new type, identify its root cause, add its prevention, and update this list.

| Failure Type | Root Cause | Prevention |
|---|---|---|
| **Scope Creep** | Ambiguous or absent boundaries | Explicit Must-Not list + scope limits |
| **Hallucinated Completion** | No ground-truth check | Binary acceptance criteria + eval step |
| **Intent Drift** | Trade-offs resolved incorrectly; agent unaware of its role | Ranked priorities + explicit deployment purpose |
| **Context Collapse** | Irrelevant tokens diluting signal | Context hygiene — curate aggressively |
| **Runaway Cost** | No resource ceiling | Hard caps in Resource Governance |
| **Overconfident Output** | No uncertainty surfacing | Uncertainty reporting for high-stakes tasks |

---

## Extended Patterns

### The Living Specification Pattern
For long-running or multi-session projects, treat the specification as a version-controlled document. After each major run:
- Append what was completed and verified
- Update "known state" in the Context Layer
- Log any escalations, their triggers, and their resolutions
- Log failure types encountered and the spec patches applied
- Revise acceptance criteria if the definition of done evolved

This transforms a one-shot spec into an episodic memory system that improves with each run. The failure log is particularly important — patterns across failures reveal structural weaknesses in your specification methodology, not just individual task errors.

---

### Adversarial Reflection Pattern
For medium and high-risk tasks, require the agent to challenge its own output before delivery.

The sequence:
1. Produce primary output
2. Generate the strongest possible critique of that output — steelman the opposing view
3. Evaluate whether the critique holds
4. Revise if the critique reveals a genuine gap
5. Re-run acceptance criteria against the revised output

**Why it matters:** This pattern attacks the two most dangerous failure modes — hallucinated completion and overconfident reasoning. It is especially valuable for strategy, analysis, forecasting, and any task where the cost of being confidently wrong is high.

**Domain examples:**
- *Coding:* "After implementing, argue why this approach is wrong. Would a different architecture handle edge cases better?"
- *Science:* "What is the strongest methodological objection to this analysis? Does it hold? If yes, revise."
- *Business:* "What would the most skeptical stakeholder say about this recommendation? Is that objection fatal?"

---

### Uncertainty Quantification
For non-deterministic domains — science, forecasting, strategy, legal analysis — require the agent to surface what it doesn't know alongside what it does.

Require agents to report:
- **Confidence estimate** (0–100%) with brief justification
- **Primary uncertainty drivers:** what assumptions most affect the conclusion
- **Information that would most reduce uncertainty:** what data, if available, would change the answer
- **Alternative plausible interpretations:** what else could this data or situation mean

**Why it matters:** Most agent outputs present conclusions with uniform confidence. This is almost always wrong. Uncertainty quantification upgrades the output from a deterministic answer to an epistemic map — the decision-maker knows not just the conclusion but how much to trust it and where to probe further.

**Anti-pattern:** A research summary that presents five findings with equal confidence when three rest on weak evidence and two on strong. The decision-maker cannot tell which is which.

---

### Cognitive Mode Selection
Different tasks require fundamentally different reasoning styles. Assigning the wrong mode causes overthinking (wasted compute, circular reasoning) or underthinking (shallow execution of a task that needed depth).

**Important:** Cognitive modes are reasoning postures, not personas. They change how the agent thinks, not who it is.

Select the mode explicitly in the Prompt Layer. The Planner assigns a mode to each sub-task as part of the execution plan; Workers receive it as part of their intent brief.

| Mode | Use When | Reasoning Posture |
|---|---|---|
| **Deterministic** | Clear implementation; answer is knowable | Execute against spec; minimize divergence; no exploration |
| **Exploratory** | Research, hypothesis generation, brainstorming | Range widely; surface options; defer judgment |
| **Adversarial** | Security, risk assessment, stress-testing | Assume hostile conditions; find breaks; argue against the spec itself |
| **Synthesis** | Integrating outputs from multiple agents or sources | Resolve contradictions; find the through-line; produce a unified view |
| **Audit** | Validation only; checking work already done | Do not produce; only evaluate against criteria |

A single project will typically use multiple modes across its sub-tasks. Example: Exploratory for research → Deterministic for implementation → Adversarial for security review → Audit for final validation.

**Mode and risk interaction:** Exploratory mode is a pre-commitment mode — it belongs in divergence phases before high-stakes decisions are locked in. High risk tasks should be in Deterministic or Audit by the time final validation occurs. Running Exploratory mode as the final-delivery mode on a High risk task is a coherence error: you are ranging freely at the moment you should be converging precisely.

**Anti-pattern:** Running a brainstorm in Deterministic mode (you get a narrow list instead of a rich option space) or a code implementation in Exploratory mode (you get architectural musings instead of working code).

**Over-specification warning:** This framework guards heavily against under-specification — and rightly so. But in Exploratory phases, over-constraining is equally damaging. Constrain evaluation, not divergence. When the goal is to generate a wide option space, tight constraints on the generation phase defeat the purpose. Reserve hard constraints for the Adversarial and Deterministic phases that follow.

---

### Divergence → Convergence Loop (Brainstorming Protocol)
For any task where the goal is idea generation, option exploration, or creative problem-solving across any domain, use this four-phase mode sequence:

```
Phase 1 — DIVERGE     (Exploratory Mode)
  Generate the widest possible option space.
  No filtering. No judgment. Volume over precision.
  ↓
Phase 2 — CLUSTER     (Synthesis Mode)
  Organize, categorize, and find the through-lines.
  Identify clusters of related ideas. Surface patterns.
  ↓
Phase 3 — STRESS-TEST (Adversarial Mode)
  Attack the top candidates.
  Find the weaknesses, edge cases, and failure modes of each.
  ↓
Phase 4 — FORMALIZE   (Deterministic Mode)
  Execute the selected direction with precision.
  No more exploration. Spec it, build it, or write it.
```

**Why it matters:** Most brainstorming fails because it collapses too early into judgment (skipping Phase 1) or never converges (looping Phase 1 indefinitely). The explicit mode transitions force the right cognitive posture at each stage.

**Applies to:** Feature ideation, research direction selection, business strategy options, experimental design, creative writing concepts, architecture decisions — any domain where you need to generate before you evaluate.

---

### Multi-Agent Specialization
For complex projects, assign distinct agents to distinct roles rather than one generalist doing everything:
- A **Research Agent** that only synthesizes information (Exploratory mode)
- A **Critic Agent** that only finds flaws in outputs (Adversarial mode)
- An **Integrator Agent** that assembles sub-outputs into a coherent whole (Synthesis mode)
- A **Builder Agent** that implements the decided direction (Deterministic mode)
- A **QA Agent** that validates only (Audit mode)

The Planner coordinates; the Workers specialize. Each worker receives an intent brief that makes its specific deployment purpose explicit — it knows what it is, what it isn't, and who consumes its output.

---

### The Escalation Contract
Define escalation as a *feature*, not a failure. Good agents surface genuine uncertainty rather than guess. Your Intent Layer should specify:
- **When** to stop: specific ambiguity types, cost thresholds, risk conditions
- **What** to report: the decision point, the options the agent sees, its tentative recommendation, confidence estimate
- **Who** reviews: not just a generic "human" — which human, with what response SLA
- **What happens if no response arrives:** does the agent hold, attempt an alternative path, or abort?

**Solo operator adaptation:** If you are working alone, you are the reviewer. Replace the named human + SLA with a mandatory time delay — do not proceed on high-stakes decisions for at least 24 hours. Distance and time create the same circuit-break that a second person would.

---

### When To Use This Framework

The overhead of the framework should be proportional to the cost of failure. This is the core principle: **use as much or as little as the stakes demand.** The philosophy — four control surfaces, five primitives, defined intent, curated context — applies universally to any project in any domain. The process overhead scales with stakes.

| Situation | What to use |
|---|---|
| Reversible, low-stakes, under 1 hour | Routing table in quickref + start immediately |
| Consequential or over 1 hour | Quickref checklist minimum; Self-Spec if direction is unclear |
| High-risk, irreversible, or affects others | Full Spec Template + Adversarial Reflection + Validator |
| Unsure | Ask: "What is the cost if this goes wrong?" Scale accordingly. |

The framework was built to absorb any project — coding, science, research, writing, business strategy, anything — and give it the structure needed to proceed without fail. It is not a bureaucratic checklist. It is a philosophy with an operational interface.

---

### Self-Spec Agent + Reviewer Pipeline

This pattern enables a solo operator to replace team infrastructure with two sequential agent prompts. It also works for teams who want to reduce spec-writing friction.

**The pipeline:**

```
Loose request
    ↓
Self-Spec Agent → draft spec with [NEEDS HUMAN INPUT] flags
    ↓
Human reviews + resolves all flags
    ↓
Approved spec → Reviewer Prompt Generator → validator prompt
    ↓
Deploy executing agent with approved spec
    ↓
Validator agent checks output against reviewer prompt
    ↓
PASS → done  |  FAIL → revise or escalate
```

**Why this matters:** The spec template is complete and powerful but filling it from scratch for every project creates friction. The Self-Spec Agent inverts the process — instead of the human filling the form, an agent fills it and the human reviews and approves. The human's judgment is fully in the loop at the approval gate; the mechanical work of structuring the spec is offloaded.

The Reviewer Prompt Generator closes the loop — once a spec is approved, the validation criteria are fully determined by the spec itself. The reviewer prompt is derived, not written from scratch.

**See the Quick Reference for the actual prompts** (`FORGE-quickref.md` — Self-Spec Agent + Reviewer Pipeline section).

---

## Domain-Specific Specification Checklists

### Coding Projects — also specify:
- [ ] Language, framework, version constraints locked
- [ ] Performance targets defined (latency, memory, throughput)
- [ ] Interface / API contracts with other systems specified
- [ ] Security requirements and forbidden patterns listed
- [ ] Test coverage expectation set (unit / integration / e2e)
- [ ] Cognitive mode: Deterministic for implementation; Adversarial for security review
- [ ] Risk tier assigned (production deployment = High)

### Scientific / Research Projects — also specify:
- [ ] Null hypothesis and falsification criteria defined
- [ ] Acceptable data sources listed; forbidden sources excluded
- [ ] Statistical standards set (significance threshold, correction method)
- [ ] Required output formats specified (table, chart, raw data, narrative)
- [ ] Replication or reproducibility requirements stated
- [ ] Uncertainty reporting required (confidence estimate + uncertainty drivers)
- [ ] Cognitive mode: Exploratory for hypothesis generation; Audit for validation
- [ ] Context freshness: specify when agent must re-fetch vs. trust provided context

### Writing / Content Projects — also specify:
- [ ] Audience defined (demographics, prior knowledge level)
- [ ] Purpose defined (inform, persuade, instruct, entertain)
- [ ] Structural requirements stated (sections, word count, headings)
- [ ] Style reference documents or examples provided
- [ ] Mandatory inclusions and exclusions listed
- [ ] Cognitive mode: Exploratory for ideation; Deterministic for final draft

### Business / Strategy Projects — also specify:
- [ ] Decision-maker and their known priors / constraints identified
- [ ] Data sources designated as authoritative vs. illustrative
- [ ] Recommendation format specified (options + pros/cons vs. single recommendation + rationale)
- [ ] Regulatory / compliance Must-Nots included
- [ ] Stakeholder sensitivities flagged
- [ ] Uncertainty reporting required (what would change this recommendation?)
- [ ] Adversarial Reflection required before delivery
- [ ] Risk tier assigned (external or irreversible decisions = High)

---

## Master Pre-Deployment Checklist

Before handing any project to an agent, verify all of the following. If a checklist item cannot be completed, that is a signal the spec is not ready — not a signal to proceed anyway.

**Specification**
- [ ] The final deliverable is described with precision, not vague intent
- [ ] The project is decomposed into sub-tasks that each satisfy the 5 Primitives
- [ ] Scope boundaries are explicit — what is in and what is out

**Intent**
- [ ] Each agent has been given an explicit deployment purpose (what it is, what it isn't, who consumes its output)
- [ ] Trade-off hierarchy is ranked explicitly
- [ ] Escalation triggers are defined and routed to a named human with an SLA
- [ ] Escalation no-response behavior is specified (hold / alternate / abort)

**Context**
- [ ] The Context Layer has been curated — irrelevant material removed
- [ ] MCP connections used for live sources where applicable
- [ ] Context freshness strategy specified (when to re-fetch vs. trust provided context)

**Execution**
- [ ] Risk tier assigned *before* decomposition
- [ ] Resource Governance parameters set *before* decomposition (model tier, runtime cap, cost ceiling, retry limit)
- [ ] Cognitive mode assigned to each sub-task
- [ ] Every sub-task has binary, measurable acceptance criteria
- [ ] Validation step routes correctly by risk tier
- [ ] Adversarial Reflection scheduled for medium/high-risk outputs
- [ ] Uncertainty reporting required for non-deterministic domains

**Meta**
- [ ] The spec has been red-teamed against the full Failure Mode Taxonomy
- [ ] The Planner's execution plan will be saved as a specification artifact
- [ ] Living Specification log is set up for multi-session projects

---

*FORGE v1.0 — FORGE — Framework for Orchestrating Reliable Generative Execution. Applicable to coding, science, research, writing, business strategy, and any other domain.*
*System docs: Quick Reference · Canonical Framework (this doc) · Spec Template*
