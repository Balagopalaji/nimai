# Valid Spec Fixture

> A spec with all required sections present and no unresolved fields.

## Pre-Flight

Risk tier: Low

## Specification Layer

Deliverable: A working CLI tool.

Module boundary: packages/core handles pure logic; packages/cli handles I/O.

Non-goals: No web UI, no multi-user support.

## Intent Layer

Agent purpose: Build and validate specs.

Interface contract: ModelAdapter interface defines generate(prompt): Promise<string>.

## Context Layer

Sources: FORGE docs.

Change surface: semver versioning; no breaking changes in patch releases.

## Prompt Layer

Opening instruction: You are a spec engineering agent.

## Governance & Validation

Escalation: Stop if cost exceeds budget.
