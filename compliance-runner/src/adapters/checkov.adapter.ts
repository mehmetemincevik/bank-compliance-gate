import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { mkdtemp, readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { CatalogService } from '../catalog/catalog.service.js';
import { Finding, toRepoPath } from '../findings/finding.js';
import { ToolAdapter, runTool } from './tool-adapter.js';

interface CheckovFailed {
  check_id: string;
  check_name: string;
  resource: string;
  file_path: string;
  file_line_range: [number, number];
}

type CheckovReport = { results?: { failed_checks?: CheckovFailed[] } };

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
type Severity = (typeof SEVERITIES)[number];

@Injectable()
export class CheckovAdapter implements ToolAdapter {
  readonly tool = 'checkov' as const;
  private readonly mapFile = resolve(process.env.RULES_DIR ?? '../rules', 'checkov-map.yaml');

  constructor(private readonly catalog: CatalogService) {}

  private ruleToControl(): Map<string, string> {
    const raw = load(readFileSync(this.mapFile, 'utf8')) as Record<string, string[]>;
    const map = new Map<string, string>();
    for (const [control, ids] of Object.entries(raw ?? {})) ids.forEach((id) => map.set(id, control));
    return map;
  }

  async run(root: string): Promise<Finding[]> {
    const mapping = this.ruleToControl();
    const outDir = await mkdtemp(join(tmpdir(), 'checkov-'));
    await runTool(
      'checkov',
      ['-d', root, '--framework', 'terraform', '-o', 'json', '--output-file-path', outDir, '--quiet', '--compact'],
      [0, 1],
      600_000,
    );

    const parsed = JSON.parse(await readFile(join(outDir, 'results_json.json'), 'utf8')) as
      | CheckovReport
      | CheckovReport[];
    const reports = Array.isArray(parsed) ? parsed : [parsed];

    const seen = new Set<string>();
    const findings: Finding[] = [];
    for (const c of reports.flatMap((r) => r.results?.failed_checks ?? [])) {
      const control = this.catalog.get(mapping.get(c.check_id) ?? '');
      if (!control) continue;

      const key = `${control.id}|${c.resource}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const sev = control.severity as Severity;
      findings.push({
        controlId: control.id,
        tool: this.tool,
        ruleId: c.check_id,
        file: toRepoPath(root, join(root, c.file_path)),
        symbol: c.resource,
        startLine: c.file_line_range[0],
        endLine: c.file_line_range[1],
        message: c.check_name,
        severity: SEVERITIES.includes(sev) ? sev : 'medium',
        confidence: 'certain',
        raw: c,
      });
    }
    return findings;
  }
}
