import * as readline from 'readline';
import { findNimaiSpecs } from 'nimai-core';

/**
 * Resolve a spec path: use provided path, or auto-discover from cwd.
 * - 1 spec found → use it automatically (print which file)
 * - Multiple found → prompt user to pick (TTY) or error (non-TTY)
 * - 0 found → error
 */
export async function resolveSpecPath(provided: string | undefined): Promise<string> {
  if (provided) return provided;

  const specs = findNimaiSpecs(process.cwd());

  if (specs.length === 0) {
    console.error(
      'Error: no spec file specified and no nimai specs found in this directory.\n' +
      'Pass a spec path directly, or create one with: nimai new <output.md>'
    );
    process.exit(1);
  }

  if (specs.length === 1) {
    console.error(`Using spec: ${specs[0].filePath}${specs[0].date ? ` (${specs[0].date})` : ''}`);
    return specs[0].filePath;
  }

  // Multiple specs — prompt if TTY, error if not
  if (!process.stdin.isTTY) {
    console.error(
      'Error: multiple nimai specs found — pass a path explicitly:\n' +
      specs.map(s => `  ${s.filePath}${s.date ? ` (${s.date})` : ''}`).join('\n')
    );
    process.exit(1);
  }

  return promptPick(specs.map(s => ({
    label: `${s.filePath}${s.date ? ` (${s.date})` : ''}`,
    value: s.filePath,
  })));
}

async function promptPick(options: { label: string; value: string }[]): Promise<string> {
  console.error('\nMultiple nimai specs found — pick one:\n');
  options.forEach((o, i) => console.error(`  ${i + 1}. ${o.label}`));
  console.error('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question('Enter number: ', answer => {
      rl.close();
      const idx = parseInt(answer.trim(), 10) - 1;
      if (idx >= 0 && idx < options.length) {
        resolve(options[idx].value);
      } else {
        console.error('Invalid selection.');
        process.exit(1);
      }
    });
  });
}
