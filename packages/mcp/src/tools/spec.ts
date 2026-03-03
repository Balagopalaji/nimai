import * as path from 'path';
import { extractContext, buildPrompt1 } from '@forge/core';
import { ForgeSpecInput, ForgeSpecOutput } from '../contract';
import { z } from 'zod';

export async function toolSpec(
  input: z.infer<typeof ForgeSpecInput>
): Promise<ForgeSpecOutput> {
  const repoPath = path.resolve(input.repoPath);
  const context = extractContext(repoPath, input.request);

  const contextSummary = context
    .map(item => `[${item.file}]\n${item.snippet}`)
    .join('\n\n---\n\n');

  const prompt = buildPrompt1(input.request, contextSummary);

  return { prompt, context };
}
