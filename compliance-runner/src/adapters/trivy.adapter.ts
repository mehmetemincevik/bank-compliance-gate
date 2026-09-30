import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { CatalogService } from '../catalog/catalog.service.js';
import { Finding, toRepoPath } from '../findings/finding.js';
import { ToolAdapter, runTool, tempReport } from './tool-adapter.js';

interface TrivyVuln {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion?: string;
  Title?: string;
}

interface TrivyReport {
  Results?: { Target: string; Vulnerabilities?: TrivyVuln[] }[];
}

@Injectable()
export class TrivyAdapter implements ToolAdapter {
  readonly tool = 'trivy' as const;
  constructor(private readonly catalog: CatalogService) {}

  async run(root: string): Promise<Finding[]> {
    const [control] = this.catalog.byTool(this.tool);
    if (!control) return [];

    const report = await tempReport('trivy');
    await runTool('trivy', [
      'fs', '--scanners', 'vuln', '--severity', 'CRITICAL', '--ignore-unfixed',
      '--quiet', '--format', 'json', '--output', report, root,
    ]);

    const data = JSON.parse(await readFile(report, 'utf8')) as TrivyReport;
    return (data.Results ?? []).flatMap((r) =>
      (r.Vulnerabilities ?? []).map(
        (v): Finding => ({
          controlId: control.id,
          tool: this.tool,
          ruleId: v.VulnerabilityID,
          file: toRepoPath(root, r.Target),
          symbol: `${v.PkgName}@${v.InstalledVersion}`,
          startLine: 0,
          endLine: 0,
          message: `${v.PkgName} ${v.InstalledVersion}: ${v.Title ?? v.VulnerabilityID} (düzeltme: ${v.FixedVersion})`,
          severity: 'critical',
          confidence: 'certain',
          raw: v,
        }),
      ),
    );
  }
}
