import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as cp from 'child_process';

const CLI = path.join(__dirname, '../../dist/index.js');
const FORGE_ROOT = path.join(__dirname, '../../../../');
const VALID_SPEC = path.join(FORGE_ROOT, 'packages/core/src/__tests__/fixtures/valid-spec.md');
const TEST_SPEC = path.join(FORGE_ROOT, 'packages/core/src/__tests__/fixtures/test-spec.md');

function run(
  args: string[],
  env?: Record<string, string>
): { stdout: string; stderr: string; exitCode: number } {
  const result = cp.spawnSync('node', [CLI, ...args], {
    encoding: 'utf-8',
    env: { ...process.env, ...env },
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
}

// ─── nimai validate ────────────────────────────────────────────────────────────

describe('nimai validate', () => {
  it('exits 0 and reports no issues for a clean spec', () => {
    const { stdout, exitCode } = run(['validate', VALID_SPEC]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('passed');
  });

  it('exits 1 and reports issues for a spec with problems', () => {
    const { stdout, exitCode } = run(['validate', TEST_SPEC]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain('issue(s) found');
  });

  it('exits 1 with error message for missing file', () => {
    const { stderr, exitCode } = run(['validate', '/nonexistent/spec.md']);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });
});

// ─── nimai spec --hosted ───────────────────────────────────────────────────────

describe('nimai spec --hosted', () => {
  it('exits 0 and outputs NIMAI SPEC BUNDLE header', () => {
    const { stdout, exitCode } = run([
      'spec', 'add JWT auth to Express', '--hosted', '--repo', FORGE_ROOT,
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('NIMAI SPEC BUNDLE');
  });

  it('output contains the populated Prompt 1 header', () => {
    const { stdout } = run([
      'spec', 'build a REST API', '--hosted', '--repo', FORGE_ROOT,
    ]);
    expect(stdout).toContain('Specification Engineering agent');
    expect(stdout).toContain('Loose request:');
  });

  it('exits 1 with message when neither --hosted nor --standalone given', () => {
    const { stderr, exitCode } = run(['spec', 'some request']);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('--hosted');
  });
});

// ─── nimai spec --standalone (no API key) ─────────────────────────────────────

describe('nimai spec --standalone (no API key)', () => {
  it('exits 1 with clear message when ANTHROPIC_API_KEY is missing', () => {
    const { stderr, exitCode } = run(
      ['spec', 'build something', '--standalone'],
      { ANTHROPIC_API_KEY: '' }
    );
    expect(exitCode).toBe(1);
    expect(stderr).toContain('ANTHROPIC_API_KEY');
  });
});

// ─── nimai review ─────────────────────────────────────────────────────────────

describe('nimai review', () => {
  it('exits 0 and outputs Reviewer Prompt header', () => {
    const { stdout, exitCode } = run(['review', VALID_SPEC]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('Reviewer Prompt');
  });

  it('outputs the approved spec content in the prompt', () => {
    const { stdout } = run(['review', VALID_SPEC]);
    expect(stdout).toContain('Approved spec');
  });

  it('exits 1 on missing spec file', () => {
    const { stderr, exitCode } = run(['review', '/nonexistent/spec.md']);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('Error');
  });

  it('writes to --out file when specified', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-review-'));
    const outFile = path.join(tmpDir, 'reviewer.md');

    const { exitCode } = run(['review', VALID_SPEC, '--out', outFile]);
    expect(exitCode).toBe(0);
    expect(fs.existsSync(outFile)).toBe(true);
    expect(fs.readFileSync(outFile, 'utf-8')).toContain('Reviewer Prompt');

    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ─── nimai new ────────────────────────────────────────────────────────────────

describe('nimai new', () => {
  it('exits 0 and creates the spec file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-new-'));
    const outFile = path.join(tmpDir, 'my-spec.md');

    const { stdout, exitCode } = run(['new', outFile]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('scaffolded');
    expect(fs.existsSync(outFile)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('exits 1 if file already exists without --force', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-new-'));
    const outFile = path.join(tmpDir, 'spec.md');
    fs.writeFileSync(outFile, 'existing content');

    const { stderr, exitCode } = run(['new', outFile]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain('already exists');

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('exits 0 with --force even if file exists', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-new-'));
    const outFile = path.join(tmpDir, 'spec.md');
    fs.writeFileSync(outFile, 'existing content');

    const { exitCode } = run(['new', outFile, '--force']);
    expect(exitCode).toBe(0);
    // File should now contain the template, not the old content
    expect(fs.readFileSync(outFile, 'utf-8')).not.toBe('existing content');

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('creates parent directories automatically', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-new-'));
    const outFile = path.join(tmpDir, 'nested', 'deep', 'spec.md');

    const { exitCode } = run(['new', outFile]);
    expect(exitCode).toBe(0);
    expect(fs.existsSync(outFile)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true });
  });
});

// ─── nimai --version / --help ─────────────────────────────────────────────────

describe('nimai binary', () => {
  it('--version outputs 0.1.0', () => {
    const { stdout, exitCode } = run(['--version']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe('0.1.0');
  });

  it('--help lists all commands', () => {
    const { stdout, exitCode } = run(['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('spec');
    expect(stdout).toContain('validate');
    expect(stdout).toContain('review');
    expect(stdout).toContain('new');
  });
});
