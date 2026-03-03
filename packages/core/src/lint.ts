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

// Advisory: architecture quality signals (anti-spaghetti rules)
// Each rule looks for at least one keyword/heading indicating the concept is addressed
const ADVISORY_RULES: { type: import('./types').LintIssueType; keywords: string[]; message: string }[] = [
  {
    type: 'missing_module_boundary',
    keywords: ['module boundary', 'package boundary', 'layer boundary', 'separation of concerns', 'packages/core', 'packages/mcp', 'packages/cli'],
    message: 'No module boundary definition found — consider documenting package/layer boundaries',
  },
  {
    type: 'missing_interface_contract',
    keywords: ['interface contract', 'api contract', 'tool schema', 'modeladapter', 'input schema', 'output shape', 'zod'],
    message: 'No interface contract found — consider documenting API/tool schemas or interfaces',
  },
  {
    type: 'missing_non_goals',
    keywords: ['non-goal', 'non-goals', 'must-not', 'scope — out', 'out of scope', 'deferred', 'excluded'],
    message: 'No non-goals or out-of-scope section found — consider documenting what this spec explicitly excludes',
  },
  {
    type: 'missing_change_surface',
    keywords: ['change surface', 'breaking change', 'migration', 'backward compat', 'semver', 'versioning', 'deprecat'],
    message: 'No change surface documentation found — consider documenting compatibility expectations',
  },
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

  for (const rule of ADVISORY_RULES) {
    const found = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (!found) {
      issues.push(advisoryIssue(0, rule.type, rule.message));
    }
  }

  return issues;
}

function issue(line: number, type: LintIssueType, message: string): LintIssue {
  return { line, type, message };
}

function advisoryIssue(line: number, type: LintIssueType, message: string): LintIssue {
  return { line, type, message, advisory: true };
}
