import { describe, it, expect, test } from 'vitest';
import { detectClarifications } from '../clarification';

// ─── Table-driven fixtures ────────────────────────────────────────────────────
// Each row: [label, request, contextFileCount, expectNeeded, expectReasonSubstring | null]
// expectReasonSubstring: if provided, that substring must appear in reasons when expectNeeded=true

type Fixture = {
  label: string;
  request: string;
  contextFiles: number;
  expectNeeded: boolean;
  /** Which reason substring must be present (undefined = don't check specific reason) */
  expectReason?: string;
  /** Which reason substring must NOT be present */
  rejectReason?: string;
};

const FIXTURES: Fixture[] = [
  // ── Rule 1: word count < 10 ─────────────────────────────────────────────
  {
    label: 'triggers on 2-word request',
    request: 'add auth',
    contextFiles: 5,
    expectNeeded: true,
    expectReason: 'too short',
  },
  {
    label: 'triggers on 9-word request (boundary)',
    request: 'add JWT auth middleware to the Express API here',
    contextFiles: 5,
    expectNeeded: true,
    expectReason: 'too short',
  },
  {
    label: 'does NOT trigger word-count rule for 10+ word request',
    request: 'add JWT authentication middleware to the Express router with refresh support',
    contextFiles: 5,
    expectNeeded: false,
    rejectReason: 'too short',
  },

  // ── Rule 2: zero context files ───────────────────────────────────────────
  {
    label: 'triggers when zero repo files matched',
    request: 'add authentication middleware to the Express API with JWT token refresh logic',
    contextFiles: 0,
    expectNeeded: true,
    expectReason: 'no relevant repo files',
  },
  {
    label: 'does NOT trigger zero-files rule when 1+ context file present',
    request: 'add JWT authentication middleware to the Express API with token refresh logic',
    contextFiles: 1,
    expectNeeded: false,
    rejectReason: 'no relevant repo files',
  },

  // ── Rule 3: no domain nouns ──────────────────────────────────────────────
  {
    label: 'triggers on vague all-pronoun request',
    request: 'the thing that we talked about before and it does that',
    contextFiles: 5,
    expectNeeded: true,
    expectReason: 'no recognizable domain nouns',
  },
  {
    label: 'does NOT trigger domain-noun rule when action verb present',
    request: 'add authentication middleware to the Express API with JWT token support and refresh logic',
    contextFiles: 5,
    expectNeeded: false,
    rejectReason: 'no recognizable domain nouns',
  },
  {
    label: '"build" counts as domain verb',
    request: 'build a thing here right now with some stuff please do it',
    contextFiles: 5,
    expectNeeded: false,
    rejectReason: 'no recognizable domain nouns',
  },
  {
    label: '"create" counts as domain verb',
    request: 'create the new stuff that we discussed and wire it all up correctly',
    contextFiles: 5,
    expectNeeded: false,
    rejectReason: 'no recognizable domain nouns',
  },

  // ── Rule 4: conflicting stack ────────────────────────────────────────────
  {
    label: 'triggers for Python + TypeScript in same request',
    request: 'add a data pipeline that processes events using Python and TypeScript services together',
    contextFiles: 5,
    expectNeeded: true,
    expectReason: 'conflicting technology stack',
  },
  {
    label: 'triggers for React + Vue in same request',
    request: 'migrate the frontend from React to Vue and update all existing tests accordingly',
    contextFiles: 5,
    expectNeeded: true,
    expectReason: 'conflicting technology stack',
  },
  {
    label: 'triggers for Jest + Vitest in same request',
    request: 'convert all jest tests to vitest and make sure the suite still passes correctly',
    contextFiles: 5,
    expectNeeded: true,
    expectReason: 'conflicting technology stack',
  },
  {
    label: 'does NOT trigger for single stack mention',
    request: 'add a React component that fetches data from the REST API and renders a sortable table',
    contextFiles: 5,
    expectNeeded: false,
    rejectReason: 'conflicting technology stack',
  },
  {
    label: 'does NOT trigger for different stack groups (PostgreSQL + React = no conflict)',
    request: 'add a React component that queries PostgreSQL via the REST API and displays results',
    contextFiles: 5,
    expectNeeded: false,
    rejectReason: 'conflicting technology stack',
  },

  // ── Clean / no triggers ──────────────────────────────────────────────────
  {
    label: 'clean well-formed request → needed=false',
    request: 'add JWT authentication middleware to the Express router with role-based access control',
    contextFiles: 3,
    expectNeeded: false,
  },
  {
    label: 'clean request returns empty questions array',
    request: 'add JWT authentication middleware to the Express router with role-based access control',
    contextFiles: 3,
    expectNeeded: false,
  },
];

describe('detectClarifications — table-driven fixtures', () => {
  test.each(FIXTURES)('$label', ({ request, contextFiles, expectNeeded, expectReason, rejectReason }) => {
    const result = detectClarifications(request, contextFiles);
    expect(result.needed).toBe(expectNeeded);

    if (expectReason) {
      expect(result.reasons.some(r => r.includes(expectReason))).toBe(true);
    }
    if (rejectReason) {
      expect(result.reasons.some(r => r.includes(rejectReason))).toBe(false);
    }
    if (expectNeeded) {
      expect(result.questions.length).toBeGreaterThan(0);
    } else {
      expect(result.questions).toHaveLength(0);
    }
  });
});

// ── Structural invariants ────────────────────────────────────────────────────

describe('detectClarifications — structural invariants', () => {
  it('questions are always strings', () => {
    const result = detectClarifications('add auth', 5);
    result.questions.forEach(q => expect(typeof q).toBe('string'));
  });

  it('reasons are always strings', () => {
    const result = detectClarifications('add auth', 0);
    result.reasons.forEach(r => expect(typeof r).toBe('string'));
  });

  it('needed=true whenever reasons is non-empty', () => {
    const cases = [
      { req: 'add auth', files: 0 },
      { req: 'the thing', files: 5 },
    ];
    for (const { req, files } of cases) {
      const r = detectClarifications(req, files);
      if (r.reasons.length > 0) expect(r.needed).toBe(true);
      if (r.needed) expect(r.reasons.length).toBeGreaterThan(0);
    }
  });
});
