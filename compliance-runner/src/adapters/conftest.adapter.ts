import { Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { CatalogService } from '../catalog/catalog.service.js';
import { Finding, toRepoPath } from '../findings/finding.js';
import { ToolAdapter, runTool, tempReport } from './tool-adapter.js';

interface ConftestFailure {
  msg: string;
  metadata?: { metadata?: { control?: string; symbol?: string }; control?: string; symbol?: string };
}

interface ConftestResult {
  filename: string;
  failures?: ConftestFailure[];
}

@Injectable()
export class ConftestAdapter implements ToolAdapter {
  readonly tool = 'conftest' as const;
  private readonly policyDir = resolve(process.env.RULES_DIR ?? '../rules', 'policy');

  constructor(private readonly catalog: CatalogService) {}

  async run(root: string): Promise<Finding[]> {
    const settings = join(root, '.compliance.yaml');
    if (!existsSync(settings)) {
      throw new Error('.compliance.yaml yok (allowed_regions gerekli)');
    }

    const tfDirs = ['infra', 'terraform', '.'].map((d) => join(root, d)).filter(existsSync);
    const report = await tempReport('conftest');
    // conftest sonucu stdout'a yazıyor
    await runTool(
      'sh',
      [
        '-c',
        'conftest test "$@" > "' + report + '"',
        'conftest',
        '--policy', this.policyDir, '--data', settings,
        '--parser', 'hcl2', '--output', 'json', '--no-color', '--all-namespaces',
        tfDirs[0],
      ],
      [0, 1],
    );

    const results = JSON.parse(await readFile(report, 'utf8')) as ConftestResult[];
    return results.flatMap((r) =>
      (r.failures ?? []).flatMap((f): Finding[] => {
        const meta = f.metadata?.metadata ?? f.metadata ?? {};
        const control = this.catalog.get(meta.control ?? '');
        if (!control) return [];
        return [{
          controlId: control.id,
          tool: this.tool,
          ruleId: 'ctrl006_region',
          file: toRepoPath(root, r.filename),
          symbol: meta.symbol,
          startLine: 0,
          endLine: 0,
          message: f.msg,
          severity: 'critical',
          confidence: 'certain',
          raw: f,
        }];
      }),
    );
  }
}
