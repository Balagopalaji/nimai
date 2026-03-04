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

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface ForgeSpecOutput {
  /** The populated FORGE Prompt 1 (Self-Spec Agent), ready to pass to a model */
  prompt: string;
  /** Repo context items extracted for the request */
  context: ContextItem[];
}

export interface ForgeReviewOutput {
  /** The populated FORGE Prompt 2 (Reviewer/Validator), derived from the spec */
  reviewerPrompt: string;
}

export interface ForgeValidateOutput {
  issues: LintIssue[];
  /** true if zero issues found */
  passed: boolean;
}

export interface ForgeNewOutput {
  /** Absolute path where the spec file was written */
  path: string;
  /** Content written to the file */
  content: string;
}

// ─── Tool Descriptors (used to register tools in the MCP server) ──────────────

export const TOOL_DESCRIPTORS = {
  nimai_spec: {
    name: 'nimai_spec',
    description:
      'Returns a populated FORGE Self-Spec Agent prompt (Prompt 1) plus extracted repo context. ' +
      'The host model uses this bundle to generate a draft spec — no LLM call is made inside this tool.',
    inputSchema: ForgeSpecInput,
  },
  nimai_review: {
    name: 'nimai_review',
    description:
      'Returns a populated FORGE Reviewer/Validator prompt (Prompt 2) derived from an approved spec file. ' +
      'The host model uses this to validate agent output against the spec.',
    inputSchema: ForgeReviewInput,
  },
  nimai_validate: {
    name: 'nimai_validate',
    description:
      'Lints a spec file for unresolved placeholder fields (___), [NEEDS HUMAN INPUT] flags, ' +
      'and missing required sections. Returns structured issues and a pass/fail result.',
    inputSchema: ForgeValidateInput,
  },
  nimai_new: {
    name: 'nimai_new',
    description:
      'Scaffolds a new FORGE spec file from the canonical template at the specified output path.',
    inputSchema: ForgeNewInput,
  },
} as const;
