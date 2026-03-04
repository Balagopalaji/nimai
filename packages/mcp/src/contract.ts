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
   * Existing nimai-managed spec files found in the repo (sorted newest-first).
   * Empty array means no spec file exists yet — call nimai_new before filling the spec.
   * Non-empty means spec files already exist — you may fill one of these instead of creating a new one.
   */
  existing_specs: string[];
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
      'Also returns existing_specs: paths of nimai-managed spec files already in the repo. ' +
      'If existing_specs is empty, call nimai_new first to scaffold a spec file, then fill it using the returned prompt. ' +
      'If existing_specs is non-empty, fill one of those files instead. ' +
      'After filling: call nimai_validate, then nimai_spec_review.',
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
      'USE THIS BEFORE BUILDING: returns a Prompt 1.5 spec-quality reviewer. ' +
      'Only call this after nimai_validate passes. ' +
      'IMPORTANT: this tool returns a prompt string — it does NOT perform the review itself. ' +
      'After calling this tool, you MUST use the returned specReviewerPrompt as your next input and evaluate the spec yourself. ' +
      'Read the prompt, apply the 6 dimensions, then end your response with the JSON verdict block: ' +
      '{"passed": true/false, "schema_version": "2", "issues": [...]}. ' +
      'The review is NOT complete until you have produced and the human has seen that verdict block. ' +
      'If passed=false, fix the spec, re-run nimai_validate, then call this again. ' +
      'For reviewing an implementation against an approved spec, use nimai_review instead.',
    inputSchema: ForgeSpecReviewInput,
  },
} as const;
