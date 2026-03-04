import * as fs from 'fs';
import * as path from 'path';
import { buildPrompt15 } from 'nimai-core';
import { ForgeSpecReviewInput, ForgeSpecReviewOutput } from '../contract';
import { z } from 'zod';

export async function toolSpecReview(
  input: z.infer<typeof ForgeSpecReviewInput>
): Promise<ForgeSpecReviewOutput> {
  const specPath = path.resolve(input.specPath);
  let specContent: string;
  try {
    specContent = fs.readFileSync(specPath, 'utf-8');
  } catch (err) {
    throw new Error(
      `Cannot read spec at "${specPath}": ${(err as NodeJS.ErrnoException).message}`
    );
  }

  const specReviewerPrompt = buildPrompt15(specContent);

  const reviewer_instructions = [
    '⚠️  INDEPENDENT REVIEW REQUIRED',
    '',
    'The spec-quality review must be done by an independent reviewer —',
    'NOT the agent that created or edited the spec.',
    '',
    'Steps:',
    '1. Copy the specReviewerPrompt string from this response.',
    '2. Open a FRESH SESSION with a different model or agent (e.g. paste into Claude, a new Codex thread, or any LLM).',
    '3. Paste the prompt and let the independent reviewer evaluate the spec.',
    '4. The reviewer will end their response with a JSON verdict block:',
    '   {"passed": true/false, "schema_version": "2", "issues": [...]}',
    '',
    'Return the verdict here when done:',
    '  • passed: true  → spec is approved, proceed to build',
    '  • passed: false → share the issues list, fix the spec, re-run nimai_validate, then call nimai_spec_review again',
  ].join('\n');

  return { specReviewerPrompt, reviewer_instructions };
}
