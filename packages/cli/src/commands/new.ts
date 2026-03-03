import * as fs from 'fs';
import * as path from 'path';
import { loadTemplate } from 'nimai-core';
import { FORGE_ROOT } from 'nimai-mcp';

export interface NewOptions {
  force: boolean;
}

export function runNew(outputPath: string, options: NewOptions): void {
  const resolved = path.resolve(outputPath);

  if (fs.existsSync(resolved) && !options.force) {
    console.error(
      `Error: "${resolved}" already exists. Use --force to overwrite.`
    );
    process.exit(1);
  }

  const templatePath = path.join(FORGE_ROOT, 'FORGE-spec-template.md');
  const template = loadTemplate(templatePath);

  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(resolved, template.raw, 'utf-8');
  console.log(`Spec scaffolded at ${resolved}`);
}
