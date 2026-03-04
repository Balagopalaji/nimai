import { describe, it, expect } from 'vitest';
import { parseVerdict, MALFORMED_VERDICT } from '../verdict';

describe('parseVerdict', () => {
  describe('happy path — v1 format (string issues)', () => {
    it('parses a passing verdict with no issues', () => {
      const response = 'Some analysis.\n```json\n{"passed": true, "issues": []}\n```';
      const v = parseVerdict(response);
      expect(v.passed).toBe(true);
      expect(v.issues).toHaveLength(0);
    });

    it('parses a failing verdict with string issues', () => {
      const response = '```json\n{"passed": false, "issues": ["scope is unclear", "missing AC"]}\n```';
      const v = parseVerdict(response);
      expect(v.passed).toBe(false);
      expect(v.issues).toHaveLength(2);
      expect(v.issues[0].detail).toBe('scope is unclear');
      expect(v.issues[1].detail).toBe('missing AC');
    });
  });

  describe('happy path — v2 format (object issues with severity)', () => {
    it('parses v2 verdict with HARD_FAIL issue', () => {
      const block = JSON.stringify({
        passed: false,
        schema_version: '2',
        issues: [{ dimension: 'scope_coherence', severity: 'HARD_FAIL', detail: 'states not mapped' }],
      });
      const v = parseVerdict('```json\n' + block + '\n```');
      expect(v.passed).toBe(false);
      expect(v.schema_version).toBe('2');
      expect(v.issues[0].dimension).toBe('scope_coherence');
      expect(v.issues[0].severity).toBe('HARD_FAIL');
      expect(v.issues[0].detail).toBe('states not mapped');
    });

    it('parses v2 NOTE and SOFT_FAIL severities', () => {
      const block = JSON.stringify({
        passed: true,
        schema_version: '2',
        issues: [
          { dimension: 'decomposition_realism', severity: 'NOTE', detail: 'sub-task 3 may exceed 2h' },
          { dimension: 'constraint_sufficiency', severity: 'SOFT_FAIL', detail: 'escalation path not specified' },
        ],
      });
      const v = parseVerdict('Verdict follows.\n```json\n' + block + '\n```\n');
      expect(v.issues[0].severity).toBe('NOTE');
      expect(v.issues[1].severity).toBe('SOFT_FAIL');
    });
  });

  describe('last-block-only rule', () => {
    it('uses the last json block when multiple are present', () => {
      const response = [
        'First block:',
        '```json',
        '{"passed": false, "issues": ["wrong block"]}',
        '```',
        'Second block (the real verdict):',
        '```json',
        '{"passed": true, "issues": []}',
        '```',
      ].join('\n');
      const v = parseVerdict(response);
      expect(v.passed).toBe(true);
    });
  });

  describe('malformed / absent block', () => {
    it('returns MALFORMED_VERDICT when no json block present', () => {
      const v = parseVerdict('Just some text with no code block.');
      expect(v.passed).toBe(false);
      expect(v.issues[0].detail).toMatch(/absent or malformed/);
    });

    it('returns MALFORMED_VERDICT for invalid JSON', () => {
      const v = parseVerdict('```json\nnot valid json\n```');
      expect(v.passed).toBe(false);
    });

    it('returns MALFORMED_VERDICT when passed is missing', () => {
      const v = parseVerdict('```json\n{"issues": []}\n```');
      expect(v.passed).toBe(false);
    });

    it('returns MALFORMED_VERDICT when passed is not boolean', () => {
      const v = parseVerdict('```json\n{"passed": "yes", "issues": []}\n```');
      expect(v.passed).toBe(false);
    });

    it('returns MALFORMED_VERDICT when issues is missing', () => {
      const v = parseVerdict('```json\n{"passed": true}\n```');
      expect(v.passed).toBe(false);
    });

    it('returns MALFORMED_VERDICT for non-array issues', () => {
      const v = parseVerdict('```json\n{"passed": true, "issues": "none"}\n```');
      expect(v.passed).toBe(false);
    });

    it('returns MALFORMED_VERDICT for v2 issue missing detail', () => {
      const v = parseVerdict('```json\n{"passed": false, "issues": [{"dimension": "x", "severity": "HARD_FAIL"}]}\n```');
      expect(v.passed).toBe(false);
    });

    it('MALFORMED_VERDICT constant has passed=false', () => {
      expect(MALFORMED_VERDICT.passed).toBe(false);
    });
  });
});
