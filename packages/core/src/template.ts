import * as fs from 'fs';
import { ForgeTemplate, ForgeSection } from './types';

const HEADING_RE = /^(#{1,6})\s+(.+)$/;

export function loadTemplate(filePath: string): ForgeTemplate {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read template at "${filePath}": ${(err as NodeJS.ErrnoException).message}`);
  }
  return { raw, sections: parseSections(raw) };
}

export function parseSections(content: string): ForgeSection[] {
  const lines = content.split('\n');
  const sections: ForgeSection[] = [];
  let current: ForgeSection | null = null;
  const contentLines: string[] = [];

  for (const line of lines) {
    const match = HEADING_RE.exec(line);
    if (match) {
      if (current) {
        current.content = contentLines.join('\n').trim();
        sections.push(current);
        contentLines.length = 0;
      }
      current = { heading: match[2].trim(), level: match[1].length, content: '' };
    } else if (current) {
      contentLines.push(line);
    }
  }

  if (current) {
    current.content = contentLines.join('\n').trim();
    sections.push(current);
  }

  return sections;
}
