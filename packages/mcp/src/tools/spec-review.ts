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

  return { specReviewerPrompt: buildPrompt15(specContent) };
}
