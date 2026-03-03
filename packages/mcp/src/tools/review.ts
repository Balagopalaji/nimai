import * as fs from 'fs';
import * as path from 'path';
import { buildPrompt2 } from '@nimai/core';
import { ForgeReviewInput, ForgeReviewOutput } from '../contract';
import { z } from 'zod';

export async function toolReview(
  input: z.infer<typeof ForgeReviewInput>
): Promise<ForgeReviewOutput> {
  const specPath = path.resolve(input.specPath);
  let specContent: string;
  try {
    specContent = fs.readFileSync(specPath, 'utf-8');
  } catch (err) {
    throw new Error(
      `Cannot read spec at "${specPath}": ${(err as NodeJS.ErrnoException).message}`
    );
  }
  return { reviewerPrompt: buildPrompt2(specContent) };
}
