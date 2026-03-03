import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

// ─── Schema ───────────────────────────────────────────────────────────────────

const ForgeConfigSchema = z.object({
  adapter: z.enum(['anthropic', 'openai', 'ollama']).optional(),
  model: z.string().optional(),
  ollamaUrl: z.string().url().optional(),
  openaiBaseUrl: z.string().url().optional(),
});

export type ForgeConfig = z.infer<typeof ForgeConfigSchema>;

export interface ResolvedConfig {
  adapter: 'anthropic' | 'openai' | 'ollama';
  model: string;
  ollamaUrl: string;
  openaiBaseUrl: string;
}

const DEFAULTS: ResolvedConfig = {
  adapter: 'anthropic',
  model: 'claude-sonnet-4-6',
  ollamaUrl: 'http://localhost:11434',
  openaiBaseUrl: 'https://api.openai.com/v1',
};

// ─── Loader ───────────────────────────────────────────────────────────────────

export function loadConfig(cwd: string): ForgeConfig {
  const configPath = path.join(cwd, '.forge', 'config.yaml');
  if (!fs.existsSync(configPath)) return {};

  let raw: unknown;
  try {
    raw = yaml.load(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    throw new Error(
      `Failed to parse .forge/config.yaml: ${(err as Error).message}`
    );
  }

  const result = ForgeConfigSchema.safeParse(raw ?? {});
  if (!result.success) {
    const issues = result.error.issues.map((i: z.ZodIssue) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid .forge/config.yaml:\n${issues}`);
  }
  return result.data;
}

// ─── Merger (precedence: flags > env > config > defaults) ────────────────────

export interface ConfigOverrides {
  adapter?: string;
  model?: string;
  ollamaUrl?: string;
  openaiBaseUrl?: string;
}

export function resolveConfig(
  fileConfig: ForgeConfig,
  overrides: ConfigOverrides = {}
): ResolvedConfig {
  return {
    adapter: (overrides.adapter as ResolvedConfig['adapter']) ??
             fileConfig.adapter ??
             DEFAULTS.adapter,
    model:   overrides.model ??
             fileConfig.model ??
             DEFAULTS.model,
    ollamaUrl: overrides.ollamaUrl ??
               fileConfig.ollamaUrl ??
               DEFAULTS.ollamaUrl,
    openaiBaseUrl: overrides.openaiBaseUrl ??
                   fileConfig.openaiBaseUrl ??
                   DEFAULTS.openaiBaseUrl,
  };
}
