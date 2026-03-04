import { describe, it, expect } from 'vitest';
import { detectClarifications } from '../clarification';

describe('detectClarifications — short request heuristic', () => {
  it('triggers when request is under 10 words', () => {
    const result = detectClarifications('add auth', 5);
    expect(result.needed).toBe(true);
    expect(result.reasons.some(r => r.includes('too short'))).toBe(true);
  });

  it('does not trigger for word count alone when request is ≥10 words with domain nouns', () => {
    const result = detectClarifications(
      'add JWT authentication middleware to the Express API with token refresh support',
      5
    );
    // May still trigger if conflicting stack or no domain nouns, but word count alone should not
    const wordCountReason = result.reasons.filter(r => r.includes('too short'));
    expect(wordCountReason).toHaveLength(0);
  });
});

describe('detectClarifications — zero context files heuristic', () => {
  it('triggers when zero repo files matched', () => {
    const result = detectClarifications(
      'add authentication middleware to the Express API with JWT token refresh',
      0
    );
    expect(result.needed).toBe(true);
    expect(result.reasons.some(r => r.includes('no relevant repo files'))).toBe(true);
  });

  it('does not trigger the zero-files reason when context files are present', () => {
    const result = detectClarifications(
      'add JWT authentication middleware to the Express API with token refresh',
      3
    );
    const zeroFilesReason = result.reasons.filter(r => r.includes('no relevant repo files'));
    expect(zeroFilesReason).toHaveLength(0);
  });
});

describe('detectClarifications — domain noun heuristic', () => {
  it('triggers when no domain nouns or action verbs are present', () => {
    // A request with no recognizable technical domain tokens
    const result = detectClarifications('the thing that we talked about before', 5);
    expect(result.needed).toBe(true);
    expect(result.reasons.some(r => r.includes('no recognizable domain nouns'))).toBe(true);
  });

  it('does not trigger domain-noun reason when action verbs are present', () => {
    const result = detectClarifications(
      'add authentication middleware to the Express API with JWT token support and refresh logic',
      5
    );
    const domainReason = result.reasons.filter(r => r.includes('no recognizable domain nouns'));
    expect(domainReason).toHaveLength(0);
  });

  it('recognises "build" as a domain action verb', () => {
    // "build a thing" has a domain verb but is short — tests only domain noun check
    const result = detectClarifications('build a thing here now with stuff please do it', 5);
    const domainReason = result.reasons.filter(r => r.includes('no recognizable domain nouns'));
    expect(domainReason).toHaveLength(0);
  });
});

describe('detectClarifications — conflicting stack heuristic', () => {
  it('triggers when Python and TypeScript both appear', () => {
    const result = detectClarifications(
      'add a data pipeline that processes events using Python and TypeScript services working together',
      5
    );
    expect(result.needed).toBe(true);
    expect(result.reasons.some(r => r.includes('conflicting technology stack'))).toBe(true);
  });

  it('triggers when React and Vue both appear', () => {
    const result = detectClarifications(
      'migrate the frontend components from React to Vue and update all the existing tests accordingly',
      5
    );
    expect(result.needed).toBe(true);
    expect(result.reasons.some(r => r.includes('conflicting technology stack'))).toBe(true);
  });

  it('does not trigger when only one stack is mentioned', () => {
    const result = detectClarifications(
      'add a React component that fetches data from the REST API and renders a sortable table',
      5
    );
    const stackReason = result.reasons.filter(r => r.includes('conflicting technology stack'));
    expect(stackReason).toHaveLength(0);
  });

  it('does not trigger when different stack groups appear (not competing)', () => {
    // PostgreSQL + React are in different groups — no conflict
    const result = detectClarifications(
      'add a React component that queries PostgreSQL via the REST API and displays results',
      5
    );
    const stackReason = result.reasons.filter(r => r.includes('conflicting technology stack'));
    expect(stackReason).toHaveLength(0);
  });
});

describe('detectClarifications — clean request (no triggers)', () => {
  it('returns needed=false for a well-formed request with context', () => {
    const result = detectClarifications(
      'add JWT authentication middleware to the Express router with role-based access control',
      3
    );
    // Should have no triggers (>10 words, has domain nouns, no stack conflict, has context)
    expect(result.needed).toBe(false);
    expect(result.questions).toHaveLength(0);
  });

  it('returns questions array when needed=true', () => {
    const result = detectClarifications('add auth', 5);
    expect(result.needed).toBe(true);
    expect(result.questions.length).toBeGreaterThan(0);
    result.questions.forEach(q => expect(typeof q).toBe('string'));
  });
});
