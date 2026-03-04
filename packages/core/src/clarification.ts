/**
 * Rule-based clarification heuristics for nimai_spec.
 *
 * These are pure functions — no IO, no LLM calls.
 * Trigger `clarifications_needed` when any heuristic fires.
 */

// ─── Domain noun / action vocab ───────────────────────────────────────────────

/**
 * Minimum set of technical domain nouns and action verbs that indicate the
 * request describes a real engineering task. If the request contains none of
 * these, it is likely too vague to spec reliably.
 */
const DOMAIN_TOKENS = new Set([
  // Action verbs
  'add', 'build', 'create', 'implement', 'fix', 'refactor', 'update', 'migrate',
  'design', 'integrate', 'deploy', 'remove', 'generate', 'optimize', 'extend',
  'replace', 'extract', 'expose', 'wire', 'scaffold', 'test', 'benchmark',
  // Technical nouns
  'api', 'service', 'component', 'model', 'module', 'database', 'endpoint',
  'interface', 'schema', 'type', 'function', 'class', 'route', 'handler',
  'middleware', 'auth', 'token', 'config', 'cli', 'ui', 'hook', 'store',
  'query', 'mutation', 'event', 'queue', 'cache', 'index', 'migration',
  'server', 'client', 'backend', 'frontend', 'test', 'spec', 'pipeline',
  'workflow', 'adapter', 'plugin', 'sdk', 'contract', 'validator', 'parser',
]);

/**
 * Returns true if the request contains at least one recognizable domain token.
 */
function hasDomainNoun(request: string): boolean {
  const words = request.toLowerCase().match(/\b[a-z]+\b/g) ?? [];
  return words.some(w => DOMAIN_TOKENS.has(w));
}

// ─── Conflicting stack detection ──────────────────────────────────────────────

/** Groups of mutually-competing technology choices. Two items from the same group = conflict. */
const STACK_GROUPS: string[][] = [
  // Programming languages — any two in the same request signals ambiguous stack
  [
    'python', 'ruby', 'java', 'golang', 'rust', 'kotlin', 'swift', 'scala',
    'php', 'elixir', 'csharp', 'typescript', 'javascript',
  ],
  // JS UI frameworks
  ['react', 'vue', 'angular', 'svelte'],
  // CSS frameworks
  ['tailwind', 'bootstrap'],
  // Relational databases
  ['postgresql', 'postgres', 'mysql', 'sqlite'],
  // NoSQL databases
  ['mongodb', 'dynamodb', 'firestore', 'cassandra'],
  // JS test frameworks
  ['jest', 'vitest', 'jasmine'],
];

/**
 * Returns true if the request mentions ≥2 items from the same competing stack group,
 * indicating an ambiguous or conflicting technology choice.
 */
function hasConflictingStack(request: string): boolean {
  const lower = request.toLowerCase();
  for (const group of STACK_GROUPS) {
    const hits = group.filter(tech => {
      // Match as whole word or compound (e.g. "typescript", "vue.js")
      const pattern = new RegExp(`\\b${tech.replace(/[-.]/g, '[-.\\s]?')}\\b`, 'i');
      return pattern.test(lower);
    });
    if (hits.length >= 2) return true;
  }
  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ClarificationResult {
  needed: boolean;
  reasons: string[];
  questions: string[];
}

/**
 * Evaluate whether a spec request needs clarification before drafting.
 *
 * Heuristics (any one firing triggers clarification):
 * 1. Request is under 10 words
 * 2. Zero repo files matched by context extractor
 * 3. No domain nouns or action verbs detected
 * 4. Conflicting stack hints (two competing tech choices in same category)
 */
export function detectClarifications(
  request: string,
  contextFileCount: number
): ClarificationResult {
  const reasons: string[] = [];

  const wordCount = request.trim().split(/\s+/).length;
  if (wordCount < 10) {
    reasons.push(`request is too short (${wordCount} words — add more context)`);
  }

  if (contextFileCount === 0) {
    reasons.push('no relevant repo files matched — is the repo path correct, or is this a new project?');
  }

  if (!hasDomainNoun(request)) {
    reasons.push('no recognizable domain nouns or action verbs found — describe what should be built or changed');
  }

  if (hasConflictingStack(request)) {
    reasons.push('conflicting technology stack hints detected — clarify which stack applies or separate into distinct tasks');
  }

  const needed = reasons.length > 0;

  const questions: string[] = needed
    ? [
        'What is the primary goal or outcome you want to achieve?',
        'Which specific files, components, or systems should be modified?',
        'Are there constraints, dependencies, or requirements we should be aware of?',
      ]
    : [];

  return { needed, reasons, questions };
}
