import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { CatalogService } from '../catalog/catalog.service.js';
import { Finding, toRepoPath } from '../findings/finding.js';
import { ToolAdapter, runTool, tempReport } from './tool-adapter.js';

interface SemgrepResult {
  check_id: string;
  path: string;
  start: { line: number };
  end: { line: number };
  extra: {
    message: string;
    metadata?: { control?: string; confidence?: 'certain' | 'candidate' };
  };
}

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
type Severity = (typeof SEVERITIES)[number];

@Injectable()
export class SemgrepAdapter implements ToolAdapter {
  readonly tool = 'semgrep' as const;
  private readonly rulesDir = resolve(process.env.RULES_DIR ?? '../rules', 'semgrep');

  constructor(private readonly catalog: CatalogService) {}

  async run(root: string): Promise<Finding[]> {
    const report = await tempReport('semgrep');
    await runTool(
      'semgrep',
      [
        'scan', '--config', this.rulesDir, '--json', '--output', report,
        '--metrics=off', '--disable-version-check', '--quiet', root,
      ],
      [0, 1],
      600_000,
    );

    const data = JSON.parse(await readFile(report, 'utf8')) as {
      results: SemgrepResult[];
      errors: { message?: string }[];
    };
    if (data.errors?.length) {
      throw new Error('semgrep rule error: ' + (data.errors[0].message ?? '').slice(0, 300));
    }

    return data.results.flatMap((r): Finding[] => {
      const controlId = r.extra.metadata?.control;
      const control = controlId ? this.catalog.get(controlId) : undefined;
      if (!control) return [];

      const sev = control.severity as Severity;
      return [{
        controlId: control.id,
        tool: this.tool,
        ruleId: r.check_id.split('.').pop() ?? r.check_id,
        file: toRepoPath(root, r.path),
        startLine: r.start.line,
        endLine: r.end.line,
        message: r.extra.message,
        severity: SEVERITIES.includes(sev) ? sev : 'medium',
        confidence: r.extra.metadata?.confidence ?? 'candidate',
        raw: { check_id: r.check_id, start: r.start, end: r.end },
      }];
    });
  }
}
