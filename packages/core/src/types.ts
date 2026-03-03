export type LintIssueType = 'blank_field' | 'needs_human_input' | 'missing_section';

export interface LintIssue {
  line: number;
  type: LintIssueType;
  message: string;
}

export interface ForgeSection {
  heading: string;
  content: string;
  level: number;
}

export interface ForgeTemplate {
  raw: string;
  sections: ForgeSection[];
}

export interface ContextItem {
  file: string;
  snippet: string;
  relevance: number;
}
