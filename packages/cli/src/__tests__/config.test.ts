import { describe, it, expect, afterEach } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { loadConfig, resolveConfig } from '../config';

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'nimai-config-'));
}

function writeConfig(dir: string, content: string): void {
  const nimaiDir = path.join(dir, '.nimai');
  fs.mkdirSync(nimaiDir, { recursive: true });
  fs.writeFileSync(path.join(nimaiDir, 'config.yaml'), content, 'utf-8');
}

describe('loadConfig', () => {
  it('returns empty object when no config file exists', () => {
    const dir = makeTmpDir();
    expect(loadConfig(dir)).toEqual({});
    fs.rmSync(dir, { recursive: true });
  });

  it('parses valid config file', () => {
    const dir = makeTmpDir();
    writeConfig(dir, 'adapter: openai\nmodel: gpt-4o\n');
    const config = loadConfig(dir);
    expect(config.adapter).toBe('openai');
    expect(config.model).toBe('gpt-4o');
    fs.rmSync(dir, { recursive: true });
  });

  it('parses ollamaUrl and openaiBaseUrl', () => {
    const dir = makeTmpDir();
    writeConfig(dir, [
      'adapter: ollama',
      'ollamaUrl: http://localhost:11434',
      'openaiBaseUrl: https://api.z.ai/v1',
    ].join('\n'));
    const config = loadConfig(dir);
    expect(config.ollamaUrl).toBe('http://localhost:11434');
    expect(config.openaiBaseUrl).toBe('https://api.z.ai/v1');
    fs.rmSync(dir, { recursive: true });
  });

  it('throws on malformed YAML', () => {
    const dir = makeTmpDir();
    writeConfig(dir, 'adapter: [invalid yaml\n');
    expect(() => loadConfig(dir)).toThrow('Failed to parse');
    fs.rmSync(dir, { recursive: true });
  });

  it('throws on invalid adapter value', () => {
    const dir = makeTmpDir();
    writeConfig(dir, 'adapter: unknownprovider\n');
    expect(() => loadConfig(dir)).toThrow('Invalid .nimai/config.yaml');
    fs.rmSync(dir, { recursive: true });
  });
});

describe('resolveConfig — precedence', () => {
  it('uses hardcoded defaults when config and overrides are empty', () => {
    const resolved = resolveConfig({});
    expect(resolved.adapter).toBe('anthropic');
    expect(resolved.model).toBe('claude-sonnet-4-6');
    expect(resolved.ollamaUrl).toBe('http://localhost:11434');
    expect(resolved.openaiBaseUrl).toBe('https://api.openai.com/v1');
  });

  it('file config overrides defaults', () => {
    const resolved = resolveConfig({ adapter: 'ollama', model: 'llama3' });
    expect(resolved.adapter).toBe('ollama');
    expect(resolved.model).toBe('llama3');
  });

  it('CLI flag overrides file config', () => {
    const resolved = resolveConfig(
      { adapter: 'ollama', model: 'llama3' },
      { model: 'claude-opus-4-6' }
    );
    expect(resolved.model).toBe('claude-opus-4-6');
    expect(resolved.adapter).toBe('ollama'); // unchanged
  });

  it('CLI flag overrides all — full precedence chain', () => {
    const resolved = resolveConfig(
      { adapter: 'openai', model: 'gpt-4o', openaiBaseUrl: 'https://api.z.ai/v1' },
      { adapter: 'anthropic', model: 'claude-sonnet-4-6' }
    );
    expect(resolved.adapter).toBe('anthropic');
    expect(resolved.model).toBe('claude-sonnet-4-6');
    expect(resolved.openaiBaseUrl).toBe('https://api.z.ai/v1'); // from file, not overridden
  });
});
