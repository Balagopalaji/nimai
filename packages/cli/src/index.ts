#!/usr/bin/env node
import { Command } from 'commander';
import { runSpec } from './commands/spec';
import { runValidate } from './commands/validate';
import { runReview } from './commands/review';
import { runNew } from './commands/new';
import { runSpecReview } from './commands/spec-review';
import { resolveSpecPath } from './commands/resolve-spec';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('nimai')
  .description('Nimai — spec ops CLI for AI work\n\nCommands: spec, validate, review, spec-review, new\nPlanned (M3b): nimai run — execute a spec end-to-end (deferred pending usage data)')
  .version(version, '-v, --version');

program
  .command('spec <request>')
  .description('Generate a FORGE spec from a loose request')
  .option('--hosted', 'Output a deterministic prompt+context bundle (no API key needed)')
  .option('--standalone', 'Call the model directly to generate the draft spec')
  .option('--repo <path>', 'Path to the repository root for context extraction', process.cwd())
  .option('--out <file>', 'Write output to file instead of stdout')
  .option('--validate', 'Run lint on the generated spec after --standalone generation (not valid with --hosted)')
  .option('--allow-invalid', 'Exit 0 even when --validate finds issues (requires --validate)')
  .option('--model <id>', 'Model ID for --standalone mode (overrides .nimai/config.yaml)')
  .action((request: string, options: {
    hosted?: boolean;
    standalone?: boolean;
    repo: string;
    out?: string;
    validate?: boolean;
    allowInvalid?: boolean;
    model: string;
  }) => {
    runSpec(request, {
      hosted: !!options.hosted,
      standalone: !!options.standalone,
      repoPath: options.repo,
      out: options.out,
      validate: !!options.validate,
      allowInvalid: !!options.allowInvalid,
      model: options.model,
    }).catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
  });

program
  .command('validate [specPath]')
  .description('Lint a spec file for unresolved fields, NHFI flags, and missing sections')
  .option('--strict-architecture', 'Treat advisory architecture warnings as errors (exits 1)')
  .action(async (specPath: string | undefined, options: { strictArchitecture?: boolean }) => {
    const resolved = await resolveSpecPath(specPath);
    runValidate(resolved, { strictArchitecture: !!options.strictArchitecture });
  });

program
  .command('review [specPath]')
  .description('Generate a FORGE reviewer/validator prompt from an approved spec')
  .option('--out <file>', 'Write reviewer prompt to file instead of stdout')
  .action(async (specPath: string | undefined, options: { out?: string }) => {
    const resolved = await resolveSpecPath(specPath);
    runReview(resolved, { out: options.out });
  });

program
  .command('spec-review [specPath]')
  .description('Generate a FORGE Prompt 1.5 (Spec-Quality Reviewer) for a draft spec')
  .option('--out <file>', 'Write reviewer prompt to file instead of stdout')
  .action(async (specPath: string | undefined, options: { out?: string }) => {
    const resolved = await resolveSpecPath(specPath);
    runSpecReview(resolved, { out: options.out });
  });

program
  .command('new <outputPath>')
  .description('Scaffold a new FORGE spec file from the canonical template')
  .option('--force', 'Overwrite if file already exists')
  .action((outputPath: string, options: { force?: boolean }) => {
    runNew(outputPath, { force: !!options.force });
  });

program.parse(process.argv);
