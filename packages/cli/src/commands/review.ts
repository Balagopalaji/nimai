import * as fs from 'fs';
import * as path from 'path';
import { buildPrompt2 } from 'nimai-core';

export interface ReviewOptions {
  out?: string;
}

export function runReview(specPath: string, options: ReviewOptions): void {
  const resolved = path.resolve(specPath);

  let specContent: string;
  try {
    specContent = fs.readFileSync(resolved, 'utf-8');
  } catch {
    console.error(`Error: Cannot read spec at "${resolved}"`);
    process.exit(1);
  }

  const reviewerPrompt = buildPrompt2(specContent);

  if (options.out) {
    const outPath = path.resolve(options.out);
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, reviewerPrompt, 'utf-8');
    console.log(`Reviewer prompt written to ${outPath}`);
  } else {
    console.log(reviewerPrompt);
  }
}
