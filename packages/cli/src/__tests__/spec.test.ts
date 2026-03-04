/**
 * Unit tests for runSpec using injected adapter.
 * These cover --validate and --allow-invalid exit behavior without
 * needing a subprocess or real API key.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ModelAdapter } from '../adapters/types';

// Track process.exit calls without actually exiting
const exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number) => {
  throw new Error(`process.exit(${_code})`);
});

// Suppress stderr noise in tests
const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

afterEach(() => {
  vi.clearAllMocks();
});

const { runSpec } = await import('../commands/spec');

const FORGE_ROOT = new URL('../../../../', import.meta.url).pathname;

/** A spec with no lint issues — all required sections present, no blanks */
const CLEAN_SPEC = [
  '## Pre-Flight',
  '## Specification Layer',
  '## Intent Layer',
  '## Context Layer',
  '## Prompt Layer',
  '## Governance & Validation',
].join('\n');

/** A spec with known lint issues — blank fields present */
const DIRTY_SPEC = '## Pre-Flight\nField: _______________\n';

function makeAdapter(response: string): ModelAdapter {
  return { generate: vi.fn().mockResolvedValue(response) };
}

const BASE_OPTIONS = {
  hosted: false,
  standalone: true,
  repoPath: FORGE_ROOT,
  validate: false,
  allowInvalid: false,
  model: 'claude-sonnet-4-6',
};

describe('runSpec flag validation', () => {
  it('exits 1 when --hosted and --validate are combined', async () => {
    await expect(
      runSpec('request', { ...BASE_OPTIONS, hosted: true, standalone: false, validate: true, adapter: makeAdapter('x') })
    ).rejects.toThrow('process.exit(1)');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('lint is only supported with --standalone'));
  });

  it('exits 1 when --allow-invalid is set without --validate', async () => {
    await expect(
      runSpec('request', { ...BASE_OPTIONS, validate: false, allowInvalid: true, adapter: makeAdapter('x') })
    ).rejects.toThrow('process.exit(1)');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('--allow-invalid only applies when lint is enabled'));
  });
});

describe('runSpec --standalone --validate', () => {
  it('exits 0 when generated spec passes validation', async () => {
    const adapter = makeAdapter(CLEAN_SPEC);
    await runSpec('request', { ...BASE_OPTIONS, validate: true, adapter });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits 1 when generated spec has lint issues (default)', async () => {
    const adapter = makeAdapter(DIRTY_SPEC);
    await expect(
      runSpec('request', { ...BASE_OPTIONS, validate: true, adapter })
    ).rejects.toThrow('process.exit(1)');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('issue(s) found'));
  });

  it('exits 0 with --allow-invalid even when spec has lint issues', async () => {
    const adapter = makeAdapter(DIRTY_SPEC);
    await runSpec('request', { ...BASE_OPTIONS, validate: true, allowInvalid: true, adapter });
    expect(exitSpy).not.toHaveBeenCalledWith(1);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('issue(s) found'));
  });
});
