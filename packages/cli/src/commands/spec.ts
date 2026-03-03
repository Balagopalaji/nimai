import * as path from 'path';
import * as fs from 'fs';
import { extractContext, buildPrompt1, lintContent } from '@nimai/core';
import type { ModelAdapter } from '../adapters/types';
import { AnthropicAdapter } from '../adapters/anthropic';
import { AdapterError } from '../adapters/errors';
import { loadConfig, resolveConfig } from '../config';

export interface SpecOptions {
  hosted: boolean;
  standalone: boolean;
  repoPath: string;
  out?: string;
  validate: boolean;
  allowInvalid: boolean;
  model?: string;
  /** Optional adapter for testing — if provided, skips adapter construction */
  adapter?: ModelAdapter;
}

export async function runSpec(request: string, options: SpecOptions): Promise<void> {
  // ── Flag validation ──────────────────────────────────────────────────────────
  if (!options.hosted && !options.standalone) {
    console.error('Error: specify --hosted or --standalone');
    process.exit(1);
  }

  if (options.hosted && options.validate) {
    console.error(
      'Error: --validate is only supported with --standalone.\n' +
      'Use --standalone (and optionally --out) or run: nimai validate <file>'
    );
    process.exit(1);
  }

  if (options.allowInvalid && !options.validate) {
    console.error(
      'Error: --allow-invalid requires --validate.\n' +
      'Add --validate to enable validation, then --allow-invalid to override exit behavior.'
    );
    process.exit(1);
  }

  // ── Context + prompt building ─────────────────────────────────────────────────
  const repoPath = path.resolve(options.repoPath);
  const context = extractContext(repoPath, request);
  const contextSummary = context
    .map(item => `[${item.file}]\n${item.snippet}`)
    .join('\n\n---\n\n');
  const prompt = buildPrompt1(request, contextSummary);

  // ── --hosted: return deterministic bundle, no API call ───────────────────────
  if (options.hosted) {
    printBundle(prompt, context);
    return;
  }

  // ── --standalone: resolve config then build adapter ──────────────────────────
  let adapter: ModelAdapter;
  if (options.adapter) {
    adapter = options.adapter;
  } else {
    const fileConfig = loadConfig(process.cwd());
    const config = resolveConfig(fileConfig, { model: options.model });
    adapter = buildAdapter(config.adapter, config.model, config);
    if (!adapter) process.exit(1); // buildAdapter prints error and returns null on failure
  }

  let specContent: string;
  try {
    specContent = await adapter.generate(prompt);
  } catch (err) {
    console.error(`Error: ${err instanceof AdapterError ? err.message : (err as Error).message}`);
    process.exit(1);
  }

  // ── Output ────────────────────────────────────────────────────────────────────
  if (options.out) {
    const outPath = path.resolve(options.out);
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, specContent, 'utf-8');
    console.log(`Spec written to ${outPath}`);
  } else {
    console.log(specContent);
  }

  // ── --validate ────────────────────────────────────────────────────────────────
  if (options.validate) {
    const issues = lintContent(specContent);
    const hard = issues.filter(i => !i.advisory);
    const advisory = issues.filter(i => i.advisory);

    if (hard.length === 0 && advisory.length === 0) {
      console.error('✓ Validation passed — no issues found.');
    } else {
      if (hard.length > 0) {
        console.error(`\nValidation: ${hard.length} issue(s) found`);
        hard.forEach(i =>
          console.error(`  ${i.type === 'missing_section' ? '' : `Line ${i.line}: `}${i.message}`)
        );
      }
      if (advisory.length > 0) {
        console.error(`\nAdvisory warnings: ${advisory.length}`);
        advisory.forEach(i => console.error(`  warn: ${i.message}`));
      }
      if (hard.length > 0 && !options.allowInvalid) {
        process.exit(1);
      }
    }
  }
}

function buildAdapter(
  adapterName: string,
  model: string,
  config: import('../config').ResolvedConfig
): ModelAdapter {
  if (adapterName === 'anthropic') {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      console.error(
        'Error: ANTHROPIC_API_KEY environment variable is not set.\n' +
        'Set it and retry, or use --hosted to generate a prompt bundle without an API key.'
      );
      process.exit(1);
    }
    return new AnthropicAdapter(apiKey, model);
  }
  if (adapterName === 'openai') {
    const { OpenAIAdapter } = require('../adapters/openai') as typeof import('../adapters/openai');
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      console.error('Error: OPENAI_API_KEY environment variable is not set.');
      process.exit(1);
    }
    return new OpenAIAdapter(apiKey, model, config.openaiBaseUrl);
  }
  if (adapterName === 'ollama') {
    const { OllamaAdapter } = require('../adapters/ollama') as typeof import('../adapters/ollama');
    return new OllamaAdapter(config.ollamaUrl, model);
  }
  console.error(`Error: Unknown adapter "${adapterName}". Valid values: anthropic, openai, ollama`);
  process.exit(1);
}

function printBundle(
  prompt: string,
  context: ReturnType<typeof extractContext>
): void {
  console.log('=== NIMAI SPEC BUNDLE ===');
  console.log('');
  console.log('--- PROMPT (paste into your AI agent) ---');
  console.log(prompt);
  if (context.length > 0) {
    console.log('');
    console.log(`--- CONTEXT FILES INCLUDED (${context.length}) ---`);
    context.forEach(item => console.log(`  • ${item.file} (relevance: ${item.relevance})`));
  }
}
