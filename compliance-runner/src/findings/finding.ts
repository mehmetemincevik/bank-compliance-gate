import { relative, resolve, sep } from 'path';

export type ToolName = 'semgrep' | 'gitleaks' | 'checkov' | 'trivy' | 'conftest' | 'agent-pii';

export interface Finding {
  controlId: string;
  tool: ToolName;
  ruleId: string;
  file: string;
  symbol?: string;
  startLine: number;
  endLine: number;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: 'certain' | 'candidate';
  raw: unknown;
}

export const toRepoPath = (root: string, p: string) =>
  relative(root, resolve(root, p)).split(sep).join('/');
