import * as fs from 'fs';
import * as path from 'path';

/**
 * Locate the FORGE docs root by walking up from __dirname until we find
 * FORGE-quickref.md. Works regardless of where the package is installed.
 */
function findForgeRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'FORGE-quickref.md'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    'Cannot locate FORGE-quickref.md. Ensure the FORGE docs are present at the repo root.'
  );
}

export const FORGE_ROOT = findForgeRoot();
