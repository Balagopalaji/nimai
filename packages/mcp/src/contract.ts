/**
 * FORGE MCP Tool Contract — v1
 *
 * All tool schemas are defined and locked here before server implementation.
 * Do NOT change tool names or output shapes without a contract version bump.
 *
 * Adversarial review notes (stress-tested before locking):
 * - Tool names prefixed with "nimai_" to avoid collisions with host tool namespaces
 * - All inputs validated with zod to prevent runtime shape errors
 * - Outputs are plain serialisable objects (no class instances, no Buffers)
 * - No LLM calls inside any tool — tools return context/structure only
 * - specPath / repoPath are absolute or relative to cwd; server does NOT resolve ~
 * - outputPath for nimai_new: parent directory is created if missing; write errors surface as tool errors
 */

import { z } from 'zod';
import type { LintIssue, ContextItem } from 'nimai-core';

// ─── Input Schemas ────────────────────────────────────────────────────────────

export const ForgeSpecInput = z.object({
  repoPath: z.string().describe('Absolute path to the repository root'),
  request: z.string().min(1).describe('The loose request to turn into a spec prompt'),
});

export const ForgeReviewInput = z.object({
  specPath: z.string().describe('Path to the approved spec markdown file'),
});

export const ForgeValidateInput = z.object({
  specPath: z.string().describe('Path to the spec markdown file to lint'),
});

export const ForgeNewInput = z.object({
  outputPath: z.string().min(1).describe('Path where the new spec file should be written'),
});

export const ForgeSpecReviewInput = z.object({
  specPath: z.string().describe('Path to the draft spec markdown file to evaluate'),
});

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface ForgeSpecOutput {
  /** The populated FORGE Prompt 1 (Self-Spec Agent), ready to pass to a model */
  prompt: string;
  /** Repo context items extracted for the request */
  context: ContextItem[];
  /**
   * Concrete follow-up questions when request ambiguity blocks reliable spec drafting.
   * Triggered when request is under 10 words OR zero repo files matched.
   * Optional — absent when no clarification is needed.
   */
  clarifications_needed?: string[];
}

export interface ForgeReviewOutput {
  /** The populated FORGE Prompt 2 (Reviewer/Validator), derived from the spec */
  reviewerPrompt: string;
}

export interface ForgeValidateOutput {
  issues: LintIssue[];
  /** true if zero hard (non-advisory) issues found */
  passed: boolean;
}

export interface ForgeNewOutput {
  /** Absolute path where the spec file was written */
  path: string;
  /** Content written to the file */
  content: string;
}

export interface ForgeSpecReviewOutput {
  /**
   * FORGE Prompt 1.5 — Spec-Quality Reviewer prompt.
   * Pass this to a reviewing LLM. The LLM will respond with a JSON verdict block
   * containing {passed: boolean, issues: string[]}.
   */
  specReviewerPrompt: string;
}

// ─── Tool Descriptors (used to register tools in the MCP server) ──────────────

export const TOOL_DESCRIPTORS = {
  nimai_spec: {
    name: 'nimai_spec',
    description:
      'Returns a populated FORGE Self-Spec Agent prompt (Prompt 1) plus extracted repo context. ' +
      'The host model uses this bundle to fill a draft spec — no LLM call is made inside this tool. ' +
      'FULL LOOP: (1) call nimai_new to scaffold the spec file, (2) call this tool to get the prompt bundle, ' +
      '(3) fill the scaffolded spec using the returned prompt, (4) call nimai_validate, ' +
      '(5) call nimai_spec_review. Do not skip nimai_new — without it there is no spec file to fill.',
    inputSchema: ForgeSpecInput,
  },
  nimai_review: {
    name: 'nimai_review',
    description:
      'USE THIS AFTER BUILDING: returns a Reviewer/Validator prompt (Prompt 2) to check whether an ' +
      'implementation satisfies an approved spec. ' +
      'For checking spec quality BEFORE building, use nimai_spec_review instead.',
    inputSchema: ForgeReviewInput,
  },
  nimai_validate: {
    name: 'nimai_validate',
    description:
      'Lints a spec file for unresolved placeholder fields (___), [NEEDS HUMAN INPUT] flags, ' +
      'missing required sections, and pre-checked acceptance criteria. Returns structured issues and a pass/fail result. ' +
      'Run this after filling a spec and again after every fix — before calling nimai_spec_review.',
    inputSchema: ForgeValidateInput,
  },
  nimai_new: {
    name: 'nimai_new',
    description:
      'Scaffolds a new FORGE spec file from the canonical template at the specified output path.',
    inputSchema: ForgeNewInput,
  },
  nimai_spec_review: {
    name: 'nimai_spec_review',
    description:
      'USE THIS BEFORE BUILDING: evaluates whether a draft spec is ready to hand to a builder. ' +
      'Returns a Prompt 1.5 (spec-quality reviewer) — pass it to an LLM to get a {passed, issues} verdict. ' +
      'Only call this after nimai_validate passes. ' +
      'If passed=false, fix the spec directly using the issues list, re-run nimai_validate, then call this again — do NOT re-call nimai_spec. ' +
      'For reviewing an implementation against an approved spec, use nimai_review instead.',
    inputSchema: ForgeSpecReviewInput,
  },
} as const;
