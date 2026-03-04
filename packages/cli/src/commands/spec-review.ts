import * as fs from 'fs';
import * as path from 'path';
import { buildPrompt15 } from 'nimai-core';

export interface SpecReviewOptions {
  out?: string;
}

export function runSpecReview(specPath: string, options: SpecReviewOptions): void {
  const resolved = path.resolve(specPath);

  let specContent: string;
  try {
    specContent = fs.readFileSync(resolved, 'utf-8');
  } catch {
    console.error(`Error: Cannot read spec at "${resolved}"`);
    process.exit(1);
  }

  const specReviewerPrompt = buildPrompt15(specContent);

  if (options.out) {
    const outPath = path.resolve(options.out);
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, specReviewerPrompt, 'utf-8');
    console.log(`Spec reviewer prompt written to ${outPath}`);
  } else {
    console.log('=== NIMAI SPEC REVIEW PROMPT ===');
    console.log('');
    console.log('Pass the following prompt to a reviewing LLM.');
    console.log('The LLM response will contain a JSON verdict block with {passed, issues}.');
    console.log('');
    console.log('--- PROMPT ---');
    console.log(specReviewerPrompt);
    console.log('');
    console.log('Tip: use --out <file> to save this prompt for reuse.');
  }
}
