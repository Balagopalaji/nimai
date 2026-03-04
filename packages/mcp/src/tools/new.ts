import * as fs from 'fs';
import * as path from 'path';
import { loadTemplate } from 'nimai-core';
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

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const content = template.raw.replace('<!-- nimai-spec -->', `<!-- nimai-spec: ${date} -->`);
  fs.writeFileSync(outputPath, content, 'utf-8');
  return { path: outputPath, content };
}
