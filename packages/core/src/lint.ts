import * as fs from 'fs';
import { LintIssue, LintIssueType } from './types';

// Matches unfilled placeholder fields: ___ (3 or more underscores)
const BLANK_FIELD_RE = /_{3,}/;
// Matches [NEEDS HUMAN INPUT...] flags
const NHFI_RE = /\[NEEDS HUMAN INPUT/i;
// Required top-level sections (by heading text, case-insensitive)
const REQUIRED_SECTIONS = [
  'pre-flight',
  'specification layer',
  'intent layer',
  'context layer',
  'prompt layer',
  'governance & validation',
];

export function lintSpec(filePath: string): LintIssue[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read spec at "${filePath}": ${(err as NodeJS.ErrnoException).message}`);
  }
  return lintContent(content);
}

export function lintContent(content: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (BLANK_FIELD_RE.test(line)) {
      issues.push(issue(lineNum, 'blank_field', `Unfilled placeholder on line ${lineNum}`));
    }
    if (NHFI_RE.test(line)) {
      issues.push(issue(lineNum, 'needs_human_input', `Unresolved [NEEDS HUMAN INPUT] flag on line ${lineNum}`));
    }
  }

  const lower = content.toLowerCase();
  for (const section of REQUIRED_SECTIONS) {
    if (!lower.includes(section)) {
      issues.push(issue(0, 'missing_section', `Required section missing: "${section}"`));
    }
  }

  return issues;
}

function issue(line: number, type: LintIssueType, message: string): LintIssue {
  return { line, type, message };
}
