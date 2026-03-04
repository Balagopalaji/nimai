import * as fs from 'fs';
import * as path from 'path';
import { extractContext, buildPrompt1, detectClarifications } from 'nimai-core';
import { ForgeSpecInput, ForgeSpecOutput } from '../contract';
import { z } from 'zod';

export async function toolSpec(
  input: z.infer<typeof ForgeSpecInput>
): Promise<ForgeSpecOutput> {
  const repoPath = path.resolve(input.repoPath);
  if (!fs.existsSync(repoPath)) {
    throw new Error(`repoPath does not exist: ${repoPath}`);
  }
  const context = extractContext(repoPath, input.request);

  const contextSummary = context
    .map(item => `[${item.file}]\n${item.snippet}`)
    .join('\n\n---\n\n');

  const prompt = buildPrompt1(input.request, contextSummary);

  const result: ForgeSpecOutput = { prompt, context };

  const clarification = detectClarifications(input.request, context.length);
  if (clarification.needed) {
    result.clarifications_needed = clarification.questions;
  }

  return result;
}
