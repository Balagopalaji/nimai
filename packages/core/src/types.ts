export type LintIssueType =
  | 'blank_field'
  | 'needs_human_input'
  | 'missing_section'
  | 'missing_module_boundary'
  | 'missing_interface_contract'
  | 'missing_non_goals'
  | 'missing_change_surface';

export interface LintIssue {
  line: number;
  type: LintIssueType;
  message: string;
  /** Advisory issues are warnings only — forge validate exits 0 unless --strict-architecture */
  advisory?: boolean;
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
