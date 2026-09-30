import { execFile } from 'child_process';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Finding, ToolName } from '../findings/finding.js';

export interface ToolAdapter {
  readonly tool: ToolName;
  run(root: string): Promise<Finding[]>;
}

export const TOOL_ADAPTERS = Symbol('TOOL_ADAPTERS');

// bazı araçlar bulgu olduğunda 1 döner
export function runTool(cmd: string, args: string[], okCodes = [0], timeoutMs = 300_000) {
  return new Promise<void>((resolve, reject) => {
    execFile(cmd, args, { timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 }, (err, _out, stderr) => {
      if (!err) return resolve();
      if (typeof err.code === 'number' && okCodes.includes(err.code)) return resolve();
      reject(new Error(`${cmd} failed (${err.code}): ${String(stderr).slice(0, 500)}`));
    });
  });
}

export const tempReport = async (prefix: string) =>
  join(await mkdtemp(join(tmpdir(), `${prefix}-`)), 'report.json');
