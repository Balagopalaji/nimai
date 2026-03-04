import * as fs from 'fs';
import * as path from 'path';

export interface NimaiSpecFile {
  filePath: string;
  date: string | null; // YYYY-MM-DD from marker, or null for undated specs
}

const NIMAI_MARKER_RE = /<!--\s*nimai-spec(?::\s*(\d{4}-\d{2}-\d{2}))?\s*-->/;

/**
 * Walk up from startDir to git root (or fs root) collecting .md files
 * that contain the <!-- nimai-spec --> or <!-- nimai-spec: DATE --> marker.
 * Results are sorted newest-first (dated specs first, then undated).
 */
export function findNimaiSpecs(startDir: string): NimaiSpecFile[] {
  const results: NimaiSpecFile[] = [];
  const root = findGitRoot(startDir) ?? startDir;

  walkForSpecs(root, results);

  return results.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date); // newest first
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}

function walkForSpecs(dir: string, results: NimaiSpecFile[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'tmp', '.tmp']);

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        walkForSpecs(path.join(dir, entry.name), results);
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const filePath = path.join(dir, entry.name);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const match = NIMAI_MARKER_RE.exec(content);
        if (match) {
          results.push({ filePath, date: match[1] ?? null });
        }
      } catch {
        // skip unreadable files
      }
    }
  }
}

function findGitRoot(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}
