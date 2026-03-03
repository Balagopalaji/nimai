import { lintSpec, LintIssue } from 'nimai-core';

export interface ValidateOptions {
  strictArchitecture?: boolean;
}

export function runValidate(specPath: string, options: ValidateOptions = {}): void {
  let issues: LintIssue[];
  try {
    issues = lintSpec(specPath);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }

  const hard = issues.filter(i => !i.advisory);
  const advisory = issues.filter(i => i.advisory);

  if (hard.length === 0 && advisory.length === 0) {
    console.log('✓ Spec passed — no issues found.');
    return;
  }

  const blanks = hard.filter(i => i.type === 'blank_field');
  const nhfi = hard.filter(i => i.type === 'needs_human_input');
  const missing = hard.filter(i => i.type === 'missing_section');

  if (hard.length > 0) {
    console.log(`nimai validate: ${hard.length} issue(s) found\n`);

    if (blanks.length > 0) {
      console.log(`Blank fields (${blanks.length}):`);
      blanks.forEach(i => console.log(`  Line ${i.line}: ${i.message}`));
      console.log('');
    }

    if (nhfi.length > 0) {
      console.log(`[NEEDS HUMAN INPUT] flags (${nhfi.length}):`);
      nhfi.forEach(i => console.log(`  Line ${i.line}: ${i.message}`));
      console.log('');
    }

    if (missing.length > 0) {
      console.log(`Missing required sections (${missing.length}):`);
      missing.forEach(i => console.log(`  ${i.message}`));
      console.log('');
    }
  }

  if (advisory.length > 0) {
    console.log(`Advisory warnings (${advisory.length})${options.strictArchitecture ? ' [--strict-architecture: treated as errors]' : ''}:`);
    advisory.forEach(i => console.log(`  warn: ${i.message}`));
    console.log('');
  }

  if (hard.length > 0 || options.strictArchitecture) {
    process.exit(1);
  }
}
