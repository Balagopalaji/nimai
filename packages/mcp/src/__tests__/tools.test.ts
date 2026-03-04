import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { toolValidate } from '../tools/validate';
import { toolSpec } from '../tools/spec';
import { toolNew } from '../tools/new';
import { toolReview } from '../tools/review';
import { toolSpecReview } from '../tools/spec-review';
import { TOOL_DESCRIPTORS } from '../contract';

const FORGE_ROOT = path.join(__dirname, '../../../../');
const VALID_SPEC = path.join(FORGE_ROOT, 'packages/core/src/__tests__/fixtures/valid-spec.md');
const TEST_SPEC = path.join(FORGE_ROOT, 'packages/core/src/__tests__/fixtures/test-spec.md');

describe('MCP contract — tool descriptors', () => {
  it('exposes exactly 5 tools', () => {
    expect(Object.keys(TOOL_DESCRIPTORS)).toHaveLength(5);
  });

  it('all tools have name, description, and inputSchema', () => {
    for (const descriptor of Object.values(TOOL_DESCRIPTORS)) {
      expect(descriptor.name).toBeTruthy();
      expect(descriptor.description).toBeTruthy();
      expect(descriptor.inputSchema).toBeTruthy();
    }
  });

  it('tool names include nimai_spec, nimai_review, nimai_validate, nimai_new, nimai_spec_review', () => {
    const names = Object.values(TOOL_DESCRIPTORS).map(d => d.name);
    expect(names).toContain('nimai_spec');
    expect(names).toContain('nimai_review');
    expect(names).toContain('nimai_validate');
    expect(names).toContain('nimai_new');
    expect(names).toContain('nimai_spec_review');
  });
});

describe('nimai_validate tool', () => {
  it('passes a clean spec', async () => {
    const result = await toolValidate({ specPath: VALID_SPEC });
    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('fails a spec with issues and returns structured LintIssues', async () => {
    const result = await toolValidate({ specPath: TEST_SPEC });
    expect(result.passed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    // verify output shape — each issue has line, type, message
    for (const issue of result.issues) {
      expect(typeof issue.line).toBe('number');
      expect(typeof issue.type).toBe('string');
      expect(typeof issue.message).toBe('string');
    }
  });

  it('throws on missing file', async () => {
    await expect(toolValidate({ specPath: '/nonexistent/spec.md' })).rejects.toThrow();
  });
});

describe('nimai_spec tool', () => {
  it('returns a prompt string and context array', async () => {
    const result = await toolSpec({ repoPath: FORGE_ROOT, request: 'add JWT auth' });
    expect(typeof result.prompt).toBe('string');
    expect(result.prompt.length).toBeGreaterThan(100);
    expect(Array.isArray(result.context)).toBe(true);
  });

  it('prompt contains FORGE Self-Spec Agent header', async () => {
    const result = await toolSpec({ repoPath: FORGE_ROOT, request: 'test request' });
    expect(result.prompt).toContain('Specification Engineering agent');
    expect(result.prompt).toContain('Loose request: test request');
  });

  it('makes zero LLM calls — result is deterministic for same input', async () => {
    const r1 = await toolSpec({ repoPath: FORGE_ROOT, request: 'build a CLI' });
    const r2 = await toolSpec({ repoPath: FORGE_ROOT, request: 'build a CLI' });
    expect(r1.prompt).toBe(r2.prompt);
  });

  it('returns clarifications_needed for short request (under 10 words)', async () => {
    const result = await toolSpec({ repoPath: FORGE_ROOT, request: 'add auth' });
    expect(Array.isArray(result.clarifications_needed)).toBe(true);
    expect(result.clarifications_needed!.length).toBeGreaterThan(0);
  });

  it('returns clarifications_needed when no domain nouns are present', async () => {
    const result = await toolSpec({
      repoPath: FORGE_ROOT,
      request: 'the thing we discussed previously with the other team please handle',
    });
    expect(Array.isArray(result.clarifications_needed)).toBe(true);
    expect(result.clarifications_needed!.length).toBeGreaterThan(0);
  });

  it('returns clarifications_needed when conflicting stack hints are detected', async () => {
    const result = await toolSpec({
      repoPath: FORGE_ROOT,
      request: 'add a data pipeline that processes events using Python and TypeScript services together somehow',
    });
    expect(Array.isArray(result.clarifications_needed)).toBe(true);
    expect(result.clarifications_needed!.length).toBeGreaterThan(0);
  });

  it('does not return clarifications_needed for a well-formed request with context', async () => {
    const request = 'add JWT authentication middleware to the Express router with role-based access control support';
    const result = await toolSpec({ repoPath: FORGE_ROOT, request });
    // Well-formed: >10 words, has domain nouns, no stack conflict, repo has files
    expect(result.clarifications_needed).toBeUndefined();
  });
});

describe('nimai_new tool', () => {
  it('creates a spec file from the FORGE template', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-new-test-'));
    const outputPath = path.join(tmpDir, 'my-spec.md');

    const result = await toolNew({ outputPath });

    expect(result.path).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(result.content.length).toBeGreaterThan(100);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('creates parent directories if they do not exist', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-new-test-'));
    const outputPath = path.join(tmpDir, 'nested', 'dir', 'spec.md');

    await toolNew({ outputPath });
    expect(fs.existsSync(outputPath)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('nimai_spec_review tool', () => {
  it('returns a specReviewerPrompt string', async () => {
    const result = await toolSpecReview({ specPath: VALID_SPEC });
    expect(typeof result.specReviewerPrompt).toBe('string');
    expect(result.specReviewerPrompt.length).toBeGreaterThan(100);
  });

  it('prompt contains Spec-Quality Reviewer header', async () => {
    const result = await toolSpecReview({ specPath: VALID_SPEC });
    expect(result.specReviewerPrompt).toContain('Specification Quality Reviewer');
    expect(result.specReviewerPrompt).toContain('Verdict');
  });

  it('prompt instructs LLM to emit JSON verdict block', async () => {
    const result = await toolSpecReview({ specPath: VALID_SPEC });
    expect(result.specReviewerPrompt).toContain('"passed"');
    expect(result.specReviewerPrompt).toContain('"issues"');
  });

  it('prompt embeds the spec content', async () => {
    const result = await toolSpecReview({ specPath: VALID_SPEC });
    // The spec content should appear in the prompt
    const specContent = fs.readFileSync(VALID_SPEC, 'utf-8');
    // At least some portion of the spec should be in the prompt
    expect(result.specReviewerPrompt).toContain(specContent.substring(0, 50));
  });

  it('makes zero LLM calls — result is deterministic for same input', async () => {
    const r1 = await toolSpecReview({ specPath: VALID_SPEC });
    const r2 = await toolSpecReview({ specPath: VALID_SPEC });
    expect(r1.specReviewerPrompt).toBe(r2.specReviewerPrompt);
  });

  it('throws on missing spec file', async () => {
    await expect(toolSpecReview({ specPath: '/nonexistent/spec.md' })).rejects.toThrow();
  });
});

describe('nimai_review tool', () => {
  it('returns a reviewer prompt string', async () => {
    const result = await toolReview({ specPath: VALID_SPEC });
    expect(typeof result.reviewerPrompt).toBe('string');
    expect(result.reviewerPrompt.length).toBeGreaterThan(100);
  });

  it('reviewer prompt contains FORGE Prompt 2 header', async () => {
    const result = await toolReview({ specPath: VALID_SPEC });
    expect(result.reviewerPrompt).toContain('Reviewer Prompt');
    expect(result.reviewerPrompt).toContain('Approved spec');
  });

  it('throws on missing spec file', async () => {
    await expect(toolReview({ specPath: '/nonexistent/spec.md' })).rejects.toThrow();
  });
});

describe('doc mirror sync', () => {
  const DATA_DIR = path.join(__dirname, '../../data');

  it('FORGE-spec-template.md matches repo root copy', () => {
    const root = fs.readFileSync(path.join(FORGE_ROOT, 'FORGE-spec-template.md'), 'utf-8');
    const bundled = fs.readFileSync(path.join(DATA_DIR, 'FORGE-spec-template.md'), 'utf-8');
    expect(bundled).toBe(root);
  });

  it('FORGE-quickref.md matches repo root copy', () => {
    const root = fs.readFileSync(path.join(FORGE_ROOT, 'FORGE-quickref.md'), 'utf-8');
    const bundled = fs.readFileSync(path.join(DATA_DIR, 'FORGE-quickref.md'), 'utf-8');
    expect(bundled).toBe(root);
  });
});
