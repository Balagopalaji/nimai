/**
 * Verdict-block parser for FORGE Prompt 1.5 responses.
 *
 * The reviewing LLM must end its response with a fenced JSON block:
 *   ```json
 *   {"passed": true, "issues": []}
 *   ```
 *
 * This module parses that block and normalises the result.
 * Malformed or absent blocks return { passed: false } to ensure the loop
 * escalates rather than silently treating ambiguous output as a pass.
 *
 * Schema versions:
 *   v1: issues is string[]
 *   v2: issues is VerdictIssue[] with dimension/severity/detail fields
 *   Both are accepted; v1 strings are wrapped as VerdictIssue with detail only.
 */

export interface VerdictIssue {
  /** Which review dimension this issue relates to (v2+) */
  dimension?: string;
  /** Severity classification (v2+) */
  severity?: 'HARD_FAIL' | 'SOFT_FAIL' | 'NOTE';
  /** Human-readable description of the issue */
  detail: string;
}

export interface Verdict {
  passed: boolean;
  issues: VerdictIssue[];
  /** Present when schema_version "2" block was parsed */
  schema_version?: string;
}

/** Sentinel returned when the block is absent or malformed */
export const MALFORMED_VERDICT: Verdict = { passed: false, issues: [{ detail: 'Verdict block absent or malformed — treating as failure' }] };

/**
 * Parse the last fenced JSON block from an LLM response.
 * Returns a normalised Verdict, or MALFORMED_VERDICT on any parse error.
 */
export function parseVerdict(llmResponse: string): Verdict {
  const lastBlock = extractLastJsonBlock(llmResponse);
  if (!lastBlock) return MALFORMED_VERDICT;

  let raw: unknown;
  try {
    raw = JSON.parse(lastBlock);
  } catch {
    return MALFORMED_VERDICT;
  }

  if (!isPlainObject(raw)) return MALFORMED_VERDICT;
  if (typeof raw.passed !== 'boolean') return MALFORMED_VERDICT;
  if (!Array.isArray(raw.issues)) return MALFORMED_VERDICT;

  const issues: VerdictIssue[] = [];
  for (const item of raw.issues) {
    if (typeof item === 'string') {
      // v1 format: plain string
      issues.push({ detail: item });
    } else if (isPlainObject(item) && typeof item.detail === 'string') {
      // v2 format: object with at least detail field
      const vi: VerdictIssue = { detail: item.detail };
      if (typeof item.dimension === 'string') vi.dimension = item.dimension;
      if (item.severity === 'HARD_FAIL' || item.severity === 'SOFT_FAIL' || item.severity === 'NOTE') {
        vi.severity = item.severity;
      }
      issues.push(vi);
    } else {
      // Unexpected item shape — treat whole verdict as malformed
      return MALFORMED_VERDICT;
    }
  }

  const verdict: Verdict = { passed: raw.passed, issues };
  if (typeof raw.schema_version === 'string') verdict.schema_version = raw.schema_version;
  return verdict;
}

/** Extract the text of the last ```json ... ``` fenced block in the response */
function extractLastJsonBlock(text: string): string | null {
  // Match all ```json ... ``` fenced blocks (non-greedy)
  const re = /```json\s*([\s\S]*?)```/g;
  let last: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    last = match[1].trim();
  }
  return last;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
