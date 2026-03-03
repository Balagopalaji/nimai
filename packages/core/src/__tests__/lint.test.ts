import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { lintSpec, lintContent } from '../lint';

const FIXTURES = path.join(__dirname, 'fixtures');

describe('lintSpec', () => {
  it('throws on missing file', () => {
    expect(() => lintSpec('/nonexistent/path/spec.md')).toThrow('Cannot read spec');
  });

  it('detects exact blank field count from fixture', () => {
    const issues = lintSpec(path.join(FIXTURES, 'test-spec.md'));
    const blanks = issues.filter(i => i.type === 'blank_field');
    expect(blanks).toHaveLength(3);
  });

  it('detects exact NHFI count from fixture', () => {
    const issues = lintSpec(path.join(FIXTURES, 'test-spec.md'));
    const nhfi = issues.filter(i => i.type === 'needs_human_input');
    expect(nhfi).toHaveLength(2);
  });

  it('detects all missing required sections from fixture', () => {
    const issues = lintSpec(path.join(FIXTURES, 'test-spec.md'));
    const missing = issues.filter(i => i.type === 'missing_section');
    // test-spec.md has none of the 6 required sections
    expect(missing).toHaveLength(6);
  });

  it('returns no issues for a valid spec', () => {
    const issues = lintSpec(path.join(FIXTURES, 'valid-spec.md'));
    expect(issues).toHaveLength(0);
  });
});

describe('lintContent', () => {
  it('detects blank fields inline', () => {
    const content = 'Name: ___\nValue: _______________\nOther: ok';
    const issues = lintContent(content);
    const blanks = issues.filter(i => i.type === 'blank_field');
    expect(blanks).toHaveLength(2);
  });

  it('includes correct line numbers for blank fields', () => {
    const content = 'line 1\nblank: _______________\nline 3';
    const issues = lintContent(content);
    const blank = issues.find(i => i.type === 'blank_field');
    expect(blank?.line).toBe(2);
  });

  it('detects NHFI flags case-insensitively', () => {
    const content = '[NEEDS HUMAN INPUT: something]\n[needs human input: other]';
    const issues = lintContent(content);
    expect(issues.filter(i => i.type === 'needs_human_input')).toHaveLength(2);
  });

  it('detects missing required sections', () => {
    const issues = lintContent('## Random Section\nsome content');
    const missing = issues.filter(i => i.type === 'missing_section');
    expect(missing.length).toBeGreaterThan(0);
  });

  it('returns empty array for fully clean content', () => {
    const content = [
      '## Pre-Flight',
      '## Specification Layer',
      '## Intent Layer',
      '## Context Layer',
      '## Prompt Layer',
      '## Governance & Validation',
    ].join('\n');
    const issues = lintContent(content);
    expect(issues).toHaveLength(0);
  });
});
