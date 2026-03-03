import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { extractContext } from '../context';

describe('extractContext', () => {
  it('returns empty array for empty directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
    const results = extractContext(tmpDir, 'anything');
    expect(results).toHaveLength(0);
    fs.rmdirSync(tmpDir);
  });

  it('returns matching files for a known request', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
    fs.writeFileSync(path.join(tmpDir, 'auth.ts'), 'export function login() {}');
    fs.writeFileSync(path.join(tmpDir, 'utils.ts'), 'export function format() {}');

    const results = extractContext(tmpDir, 'add JWT auth to login');
    const files = results.map(r => r.file);
    expect(files).toContain('auth.ts');

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('excludes node_modules directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'pkg.ts'), 'export const x = 1;');

    const results = extractContext(tmpDir, 'pkg');
    const files = results.map(r => r.file);
    expect(files).not.toContain(path.join('node_modules', 'pkg.ts'));

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('respects max 20 file limit', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
    for (let i = 0; i < 30; i++) {
      fs.writeFileSync(path.join(tmpDir, `file${i}.ts`), `export const x${i} = ${i};`);
    }

    const results = extractContext(tmpDir, 'export');
    expect(results.length).toBeLessThanOrEqual(20);

    fs.rmSync(tmpDir, { recursive: true });
  });

  it('includes only allowed file extensions', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-test-'));
    fs.writeFileSync(path.join(tmpDir, 'main.ts'), 'typescript');
    fs.writeFileSync(path.join(tmpDir, 'image.png'), 'binary');
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'text');

    const results = extractContext(tmpDir, 'main typescript image notes');
    const files = results.map(r => r.file);
    expect(files).toContain('main.ts');
    expect(files).not.toContain('image.png');
    expect(files).not.toContain('notes.txt');

    fs.rmSync(tmpDir, { recursive: true });
  });
});
