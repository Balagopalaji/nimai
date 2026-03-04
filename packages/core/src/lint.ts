import * as fs from 'fs';
import { LintIssue, LintIssueType } from './types';

// Matches unfilled placeholder fields: ___ (3 or more underscores)
const BLANK_FIELD_RE = /_{3,}/;
// Matches [NEEDS HUMAN INPUT...] flags
const NHFI_RE = /\[NEEDS HUMAN INPUT/i;
// Matches pre-checked list items: "- [x] ..." or "* [x] ..."
const PRE_CHECKED_AC_RE = /^[-*]\s+\[x\]/im;
// Matches the nimai-spec marker (with or without date)
const NIMAI_MARKER_RE = /<!--\s*nimai-spec[\s:]/;
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
// Each rule looks for at least one keyword/heading indicating the concept is addressed.
// Rules marked hardFailTiers become hard failures (not advisory) when the spec's risk tier
// matches AND (if codingOnly=true) the spec is a coding/tooling/server spec.
const ADVISORY_RULES: {
  type: import('./types').LintIssueType;
  keywords: string[];
  message: string;
  hardFailTiers?: string[];       // risk tiers that trigger hard fail
  codingOnly?: boolean;           // only hard-fail for coding/tooling/server specs
  skipAdvisoryForTiers?: string[]; // skip even advisory for these risk tiers
}[] = [
  {
    type: 'missing_module_boundary',
    keywords: ['module boundary', 'package boundary', 'layer boundary', 'separation of concerns', 'packages/core', 'packages/mcp', 'packages/cli', 'app/models', 'app/state', 'app/db'],
    message: 'No module boundary definition found — document package/layer boundaries and which layers may not import each other',
    hardFailTiers: ['medium', 'high'],
    codingOnly: true,
  },
  {
    type: 'missing_interface_contract',
    keywords: ['interface contract', 'api contract', 'tool schema', 'modeladapter', 'input schema', 'output shape', 'zod'],
    message: 'No interface contract found — consider documenting API/tool schemas or interfaces',
  },
  {
    type: 'missing_non_goals',
    keywords: ['non-goal', 'non-goals', 'must-not', 'scope — out', 'out of scope', 'deferred', 'excluded'],
    message: 'No non-goals or out-of-scope section found — document what this spec explicitly excludes',
    hardFailTiers: ['medium', 'high'],
  },
  {
    type: 'missing_change_surface',
    keywords: ['change surface', 'breaking change', 'migration', 'backward compat', 'semver', 'versioning', 'deprecat'],
    message: 'No change surface documentation found — document compatibility expectations and what this spec must not break',
    hardFailTiers: ['medium', 'high'],
  },
  {
    type: 'missing_dependency_direction',
    keywords: ['dependency direction', 'may not import', 'must not import', 'import from', 'no cross-layer', 'dependency rule', 'import rule'],
    message: 'No dependency direction rules found — document which modules/layers may import which (prevents circular and cross-layer dependencies)',
    hardFailTiers: ['medium', 'high'],
    codingOnly: true,
    skipAdvisoryForTiers: ['low', 'unknown'],
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

/** Detect risk tier from checked checkbox in spec content */
function detectRiskTier(content: string): 'low' | 'medium' | 'high' | 'unknown' {
  if (/\[x\]\s*high/i.test(content)) return 'high';
  if (/\[x\]\s*medium/i.test(content)) return 'medium';
  if (/\[x\]\s*low/i.test(content)) return 'low';
  return 'unknown';
}

/** Detect if this is a coding/tooling/server spec (vs docs/research/strategy) */
function isCodingSpec(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes('if coding') ||
    lower.includes('language / framework') ||
    lower.includes('language/framework') ||
    lower.includes('test coverage expectation') ||
    lower.includes('performance targets')
  );
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

  // Pre-checked acceptance criteria — hard fail: ACs must be unchecked in a draft spec
  if (PRE_CHECKED_AC_RE.test(content)) {
    const matchLines = lines.reduce<number[]>((acc, l, i) => {
      if (/^[-*]\s+\[x\]/i.test(l)) acc.push(i + 1);
      return acc;
    }, []);
    for (const lineNum of matchLines) {
      issues.push(issue(lineNum, 'pre_checked_ac',
        `Pre-checked list item on line ${lineNum} — acceptance criteria must be unchecked ([ ]) in a draft spec`));
    }
  }

  const lower = content.toLowerCase();
  for (const section of REQUIRED_SECTIONS) {
    if (!lower.includes(section)) {
      issues.push(issue(0, 'missing_section', `Required section missing: "${section}"`));
    }
  }

  // Missing nimai-spec marker — advisory: spec was not created or registered by nimai
  if (!NIMAI_MARKER_RE.test(content)) {
    issues.push(advisoryIssue(0, 'missing_marker',
      'No <!-- nimai-spec --> marker found — add it so nimai can discover this spec automatically (nimai new stamps it)'));
  }

  const riskTier = detectRiskTier(content);
  const coding = isCodingSpec(content);

  for (const rule of ADVISORY_RULES) {
    const found = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));
    if (!found) {
      const shouldHardFail =
        rule.hardFailTiers !== undefined &&
        rule.hardFailTiers.includes(riskTier) &&
        (!rule.codingOnly || coding);

      if (shouldHardFail) {
        issues.push(issue(0, rule.type, `${rule.message} [required for ${riskTier}-risk${rule.codingOnly ? ' coding' : ''} specs]`));
      } else if (!rule.skipAdvisoryForTiers?.includes(riskTier)) {
        issues.push(advisoryIssue(0, rule.type, rule.message));
      }
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
