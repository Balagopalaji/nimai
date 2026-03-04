import * as fs from 'fs';
import * as path from 'path';
import { ContextItem } from './types';

const MAX_FILES = 20;
const INCLUDE_EXTENSIONS = new Set(['.ts', '.js', '.md', '.json', '.yaml', '.yml']);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', '.next', '__pycache__', 'tmp', '.tmp', 'coverage', '.cache', 'build', 'out']);
const MAX_SNIPPET_CHARS = 2000;

export function extractContext(repoPath: string, request: string): ContextItem[] {
  const keywords = tokenize(request);
  const candidates: ContextItem[] = [];

  walkDir(repoPath, repoPath, candidates, keywords);

  return candidates
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, MAX_FILES);
}

function walkDir(
  rootPath: string,
  currentPath: string,
  results: ContextItem[],
  keywords: string[]
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(currentPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        walkDir(rootPath, fullPath, results, keywords);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!INCLUDE_EXTENSIONS.has(ext)) continue;

      let content: string;
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
      } catch {
        continue;
      }

      const relevance = scoreRelevance(entry.name, content, keywords);
      if (relevance > 0) {
        const relPath = path.relative(rootPath, fullPath);
        results.push({
          file: relPath,
          snippet: content.slice(0, MAX_SNIPPET_CHARS),
          relevance,
        });
      }
    }
  }
}

function scoreRelevance(filename: string, content: string, keywords: string[]): number {
  if (keywords.length === 0) return 1;
  const lower = (filename + ' ' + content).toLowerCase();
  return keywords.filter(k => lower.includes(k)).length;
}

function tokenize(request: string): string[] {
  return request
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}
