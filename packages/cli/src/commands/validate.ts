import { lintSpec, LintIssue } from '@forge/core';

export function runValidate(specPath: string): void {
  let issues: LintIssue[];
  try {
    issues = lintSpec(specPath);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }

  if (issues.length === 0) {
    console.log('✓ Spec passed — no issues found.');
    return;
  }

  const blanks = issues.filter(i => i.type === 'blank_field');
  const nhfi = issues.filter(i => i.type === 'needs_human_input');
  const missing = issues.filter(i => i.type === 'missing_section');

  console.log(`forge validate: ${issues.length} issue(s) found\n`);

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

  process.exit(1);
}
