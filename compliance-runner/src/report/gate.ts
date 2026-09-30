import { Control } from '../catalog/catalog.service.js';
import { Finding } from '../findings/finding.js';

export type Decision = 'block' | 'review' | 'advisory';

export interface GatedFinding extends Finding {
  decision: Decision;
}

// agent bulguları tek başına pipeline'ı durdurmaz, review'a düşer
export function decide(f: Finding, control?: Control): Decision {
  const enforcement = control?.enforcement ?? 'advisory';
  if (enforcement === 'block') return f.tool.startsWith('agent') ? 'review' : 'block';
  return enforcement;
}

export function gate(findings: Finding[], get: (id: string) => Control | undefined): GatedFinding[] {
  return findings.map((f) => ({ ...f, decision: decide(f, get(f.controlId)) }));
}
