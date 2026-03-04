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
    '── STEP 1: Send to independent reviewer ──────────────────────────',
    '1. Copy the specReviewerPrompt string from this response.',
    '2. Open a FRESH SESSION with a different model or agent',
    '   (e.g. paste into Claude, a new Codex thread, or any LLM).',
    '3. Paste the prompt and let the reviewer evaluate the spec.',
    '4. The reviewer will end their response with a JSON verdict block:',
    '   {"passed": true/false, "schema_version": "2", "issues": [...]}',
    '',
    '── STEP 2: Return the verdict ────────────────────────────────────',
    'Bring the full verdict back to THIS session.',
    '',
    '  If passed: true',
    '  → The spec is approved. Proceed to implementation.',
    '',
    '  If passed: false',
    '  → Do NOT re-run nimai_spec (that would discard all spec work).',
    `  → Give the builder this message (fill in the verdict):`,
    '',
    `  ┌─ BUILDER FIX BRIEF ──────────────────────────────────────────`,
    `  │ The independent spec review found issues in: ${specPath}`,
    `  │`,
    `  │ Fix each HARD_FAIL and SOFT_FAIL in the verdict below by`,
    `  │ editing the spec directly. Do not regenerate from scratch.`,
    `  │`,
    `  │ [PASTE VERDICT HERE]`,
    `  │`,
    `  │ After fixing:`,
    `  │ 1. Run nimai_validate — must return passed: true`,
    `  │ 2. Run nimai_spec_review — get new reviewer_instructions`,
    `  │ 3. Send to an independent reviewer again (do not self-review)`,
    `  └──────────────────────────────────────────────────────────────`,
  ].join('\n');

  return { specReviewerPrompt, reviewer_instructions };
}
