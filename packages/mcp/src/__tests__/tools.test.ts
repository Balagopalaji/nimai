import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { toolValidate } from '../tools/validate';
import { toolSpec } from '../tools/spec';
import { toolNew } from '../tools/new';
import { toolReview } from '../tools/review';
import { TOOL_DESCRIPTORS } from '../contract';

const FORGE_ROOT = path.join(__dirname, '../../../../');
const VALID_SPEC = path.join(FORGE_ROOT, 'packages/core/src/__tests__/fixtures/valid-spec.md');
const TEST_SPEC = path.join(FORGE_ROOT, 'packages/core/src/__tests__/fixtures/test-spec.md');

describe('MCP contract — tool descriptors', () => {
  it('exposes exactly 4 tools', () => {
    expect(Object.keys(TOOL_DESCRIPTORS)).toHaveLength(4);
  });

  it('all tools have name, description, and inputSchema', () => {
    for (const descriptor of Object.values(TOOL_DESCRIPTORS)) {
      expect(descriptor.name).toBeTruthy();
      expect(descriptor.description).toBeTruthy();
      expect(descriptor.inputSchema).toBeTruthy();
    }
  });

  it('tool names are forge_spec, forge_review, forge_validate, forge_new', () => {
    const names = Object.values(TOOL_DESCRIPTORS).map(d => d.name);
    expect(names).toContain('forge_spec');
    expect(names).toContain('forge_review');
    expect(names).toContain('forge_validate');
    expect(names).toContain('forge_new');
  });
});

describe('forge_validate tool', () => {
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

describe('forge_spec tool', () => {
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
});

describe('forge_new tool', () => {
  it('creates a spec file from the FORGE template', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-new-test-'));
    const outputPath = path.join(tmpDir, 'my-spec.md');

    const result = await toolNew({ outputPath });

    expect(result.path).toBe(outputPath);
    expect(fs.existsSync(outputPath)).toBe(true);
    expect(result.content.length).toBeGreaterThan(100);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('creates parent directories if they do not exist', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-new-test-'));
    const outputPath = path.join(tmpDir, 'nested', 'dir', 'spec.md');

    await toolNew({ outputPath });
    expect(fs.existsSync(outputPath)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('forge_review tool', () => {
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
