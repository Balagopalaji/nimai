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

  it('all advisory issues have advisory=true', () => {
    const issues = lintContent('## Random Section\nsome content');
    const advisory = issues.filter(i => i.advisory);
    expect(advisory.length).toBeGreaterThan(0);
    advisory.forEach(i => expect(i.advisory).toBe(true));
  });

  it('missing_module_boundary detected when no module keywords present', () => {
    const issues = lintContent('some plain content with no architecture terms');
    expect(issues.some(i => i.type === 'missing_module_boundary')).toBe(true);
  });

  it('missing_module_boundary NOT raised when module boundary mentioned', () => {
    const issues = lintContent('module boundary: packages/core handles logic');
    expect(issues.some(i => i.type === 'missing_module_boundary')).toBe(false);
  });

  it('missing_interface_contract NOT raised when zod mentioned', () => {
    const issues = lintContent('zod schema for input validation');
    expect(issues.some(i => i.type === 'missing_interface_contract')).toBe(false);
  });

  it('missing_non_goals NOT raised when non-goals section present', () => {
    const issues = lintContent('## Non-Goals\nno web UI');
    expect(issues.some(i => i.type === 'missing_non_goals')).toBe(false);
  });

  it('missing_change_surface NOT raised when semver mentioned', () => {
    const issues = lintContent('semver versioning applies');
    expect(issues.some(i => i.type === 'missing_change_surface')).toBe(false);
  });

  it('returns no hard issues for content with all required sections', () => {
    const content = [
      '## Pre-Flight',
      '## Specification Layer',
      '## Intent Layer',
      '## Context Layer',
      '## Prompt Layer',
      '## Governance & Validation',
      '<!-- nimai-spec: 2026-01-01 -->',
    ].join('\n');
    const issues = lintContent(content);
    const hard = issues.filter(i => !i.advisory);
    expect(hard).toHaveLength(0);
  });

  describe('pre_checked_ac rule', () => {
    it('flags a pre-checked list item as hard fail', () => {
      const issues = lintContent('- [x] Done already\n- [ ] Still pending');
      const found = issues.filter(i => i.type === 'pre_checked_ac');
      expect(found).toHaveLength(1);
      expect(found[0].advisory).toBeFalsy();
      expect(found[0].line).toBe(1);
    });

    it('flags multiple pre-checked items with correct line numbers', () => {
      const content = '- [ ] ok\n- [x] bad1\n- [ ] ok\n- [x] bad2';
      const found = lintContent(content).filter(i => i.type === 'pre_checked_ac');
      expect(found).toHaveLength(2);
      expect(found[0].line).toBe(2);
      expect(found[1].line).toBe(4);
    });

    it('does not flag inline [x] (risk tier checkboxes)', () => {
      const issues = lintContent('Risk tier: [ ] Low [x] Medium [ ] High');
      expect(issues.some(i => i.type === 'pre_checked_ac')).toBe(false);
    });

    it('does not flag unchecked list items', () => {
      const issues = lintContent('- [ ] Not done yet\n- [ ] Also pending');
      expect(issues.some(i => i.type === 'pre_checked_ac')).toBe(false);
    });
  });

  describe('missing_marker rule', () => {
    it('emits advisory when no nimai-spec marker present', () => {
      const found = lintContent('some spec content').filter(i => i.type === 'missing_marker');
      expect(found).toHaveLength(1);
      expect(found[0].advisory).toBe(true);
    });

    it('does not emit when <!-- nimai-spec --> present (no date)', () => {
      const found = lintContent('some content\n<!-- nimai-spec -->').filter(i => i.type === 'missing_marker');
      expect(found).toHaveLength(0);
    });

    it('does not emit when <!-- nimai-spec: DATE --> present', () => {
      const found = lintContent('content\n<!-- nimai-spec: 2026-03-04 -->').filter(i => i.type === 'missing_marker');
      expect(found).toHaveLength(0);
    });
  });
});
