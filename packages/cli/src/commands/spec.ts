import * as path from 'path';
import * as fs from 'fs';
import { extractContext, buildPrompt1, lintContent } from '@forge/core';
import type { ModelAdapter } from '../adapters/types';
import { AnthropicAdapter, DEFAULT_MODEL } from '../adapters/anthropic';
import { AdapterError } from '../adapters/errors';

export interface SpecOptions {
  hosted: boolean;
  standalone: boolean;
  repoPath: string;
  out?: string;
  validate: boolean;
  allowInvalid: boolean;
  model: string;
  /** Optional adapter for testing — if provided, skips AnthropicAdapter construction */
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
      'Use --standalone (and optionally --out) or run: forge validate <file>'
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

  // ── --standalone: call the model ─────────────────────────────────────────────
  let adapter: ModelAdapter;
  if (options.adapter) {
    adapter = options.adapter;
  } else {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      console.error(
        'Error: ANTHROPIC_API_KEY environment variable is not set.\n' +
        'Set it and retry, or use --hosted to generate a prompt bundle without an API key.'
      );
      process.exit(1);
    }
    adapter = new AnthropicAdapter(apiKey, options.model);
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
    if (issues.length === 0) {
      console.error('✓ Validation passed — no issues found.');
    } else {
      console.error(`\nValidation: ${issues.length} issue(s) found`);
      issues.forEach(i =>
        console.error(`  ${i.type === 'missing_section' ? '' : `Line ${i.line}: `}${i.message}`)
      );
      if (!options.allowInvalid) {
        process.exit(1);
      }
    }
  }
}

function printBundle(
  prompt: string,
  context: ReturnType<typeof extractContext>
): void {
  console.log('=== FORGE SPEC BUNDLE ===');
  console.log('');
  console.log('--- PROMPT (paste into your AI agent) ---');
  console.log(prompt);
  if (context.length > 0) {
    console.log('');
    console.log(`--- CONTEXT FILES INCLUDED (${context.length}) ---`);
    context.forEach(item => console.log(`  • ${item.file} (relevance: ${item.relevance})`));
  }
}
