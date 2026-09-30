import { Inject, Injectable } from '@nestjs/common';
import { resolve } from 'path';
import { Finding } from '../findings/finding.js';
import { SymbolResolver } from '../findings/symbols.js';
import { TOOL_ADAPTERS, ToolAdapter } from '../adapters/tool-adapter.js';

export interface RunResult {
  findings: Finding[];
  errors: { tool: string; error: string }[];
}

@Injectable()
export class RunnerService {
  constructor(@Inject(TOOL_ADAPTERS) private readonly adapters: ToolAdapter[]) {}

  async run(repo: string): Promise<RunResult> {
    const root = resolve(repo);
    const settled = await Promise.allSettled(this.adapters.map((a) => a.run(root)));

    const result: RunResult = { findings: [], errors: [] };
    settled.forEach((s, i) => {
      if (s.status === 'fulfilled') {
        result.findings.push(...s.value);
      } else {
        const reason = s.reason as Error | undefined;
        result.errors.push({ tool: this.adapters[i].tool, error: String(reason?.message ?? reason) });
      }
    });

    const symbols = new SymbolResolver(root);
    for (const f of result.findings) {
      f.symbol ??= symbols.resolve(f.file, f.startLine);
    }
    return result;
  }
}
