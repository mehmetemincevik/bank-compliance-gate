import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { CatalogService } from '../catalog/catalog.service.js';
import { Finding, toRepoPath } from '../findings/finding.js';
import { ToolAdapter, runTool, tempReport } from './tool-adapter.js';

interface GitleaksLeak {
  RuleID: string;
  File: string;
  StartLine: number;
  EndLine: number;
  Description: string;
}

@Injectable()
export class GitleaksAdapter implements ToolAdapter {
  readonly tool = 'gitleaks' as const;
  constructor(private readonly catalog: CatalogService) {}

  async run(root: string): Promise<Finding[]> {
    const [control] = this.catalog.byTool(this.tool);
    if (!control) return [];

    const report = await tempReport('gitleaks');
    await runTool(
      'gitleaks',
      ['dir', root, '--redact', '--no-banner', '--report-format', 'json', '--report-path', report],
      [0, 1],
    );

    const leaks = JSON.parse(await readFile(report, 'utf8')) as GitleaksLeak[];
    return leaks.map((l) => ({
      controlId: control.id,
      tool: this.tool,
      ruleId: l.RuleID,
      file: toRepoPath(root, l.File),
      startLine: l.StartLine,
      endLine: l.EndLine,
      message: l.Description,
      severity: 'critical',
      confidence: 'certain',
      raw: l,
    }));
  }
}
