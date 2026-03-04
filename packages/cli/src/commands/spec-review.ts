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
    console.log('');
    console.log('⚠  INDEPENDENT REVIEW REQUIRED');
    console.log('Paste the contents of that file into a fresh session with a different model.');
    console.log('The reviewer must not be the same agent that created this spec.');
  } else {
    console.log('=== NIMAI SPEC REVIEW PROMPT ===');
    console.log('');
    console.log('⚠  INDEPENDENT REVIEW REQUIRED');
    console.log('The agent that built this spec must NOT be its own reviewer.');
    console.log('');
    console.log('Steps:');
    console.log('1. Copy the prompt below.');
    console.log('2. Open a fresh session with a different model or agent.');
    console.log('3. Paste the prompt — the reviewer will evaluate and end with:');
    console.log('   {"passed": true/false, "schema_version": "2", "issues": [...]}');
    console.log('4. Bring the verdict back to this session.');
    console.log('');
    console.log('--- PROMPT (copy everything below this line) ---');
    console.log('');
    console.log(specReviewerPrompt);
    console.log('');
    console.log('--- END PROMPT ---');
    console.log('');
    console.log('Tip: use --out <file> to save this prompt to a file instead.');
  }
}
