import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { loadTemplate, parseSections } from '../template';

const FIXTURES = path.join(__dirname, 'fixtures');

describe('loadTemplate', () => {
  it('throws on missing file', () => {
    expect(() => loadTemplate('/nonexistent/template.md')).toThrow('Cannot read template');
  });

  it('loads the valid spec fixture and returns sections', () => {
    const template = loadTemplate(path.join(FIXTURES, 'valid-spec.md'));
    expect(template.sections.length).toBeGreaterThan(0);
    expect(typeof template.raw).toBe('string');
  });

  it('loads the real FORGE spec template', () => {
    const templatePath = path.join(__dirname, '../../../../', 'FORGE-spec-template.md');
    const template = loadTemplate(templatePath);
    expect(template.sections.length).toBeGreaterThan(5);
  });
});

describe('parseSections', () => {
  it('parses h1 and h2 headings', () => {
    const content = '# Title\ncontent\n## Section A\nbody A\n## Section B\nbody B';
    const sections = parseSections(content);
    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBe('Title');
    expect(sections[0].level).toBe(1);
    expect(sections[1].heading).toBe('Section A');
    expect(sections[2].heading).toBe('Section B');
  });

  it('captures section content correctly', () => {
    const content = '## My Section\nline 1\nline 2';
    const sections = parseSections(content);
    expect(sections[0].content).toBe('line 1\nline 2');
  });

  it('returns empty array for content with no headings', () => {
    const sections = parseSections('just some text\nno headings here');
    expect(sections).toHaveLength(0);
  });

  it('handles empty string', () => {
    expect(parseSections('')).toHaveLength(0);
  });
});
