import * as fs from 'fs';
import * as path from 'path';
import { loadTemplate } from '@forge/core';
import { ForgeNewInput, ForgeNewOutput } from '../contract';
import { FORGE_ROOT } from '../prompts';
import { z } from 'zod';

export async function toolNew(
  input: z.infer<typeof ForgeNewInput>
): Promise<ForgeNewOutput> {
  const templatePath = path.join(FORGE_ROOT, 'FORGE-spec-template.md');
  const template = loadTemplate(templatePath);
  const outputPath = path.resolve(input.outputPath);

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, template.raw, 'utf-8');
  return { path: outputPath, content: template.raw };
}
