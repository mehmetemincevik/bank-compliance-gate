import { Control } from '../catalog/catalog.service.js';
import { GatedFinding } from './gate.js';

const LEVEL = { block: 'error', review: 'warning', advisory: 'note' } as const;

export function toSarif(findings: GatedFinding[], controls: Control[], pathPrefix = '') {
  const used = new Set(findings.map((f) => f.controlId));
  const prefix = pathPrefix && !pathPrefix.endsWith('/') ? `${pathPrefix}/` : pathPrefix;

  return {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'compliance-runner',
            version: '0.1.0',
            rules: controls
              .filter((c) => used.has(c.id))
              .map((c) => ({
                id: c.id,
                name: c.id.replace('-', ''),
                shortDescription: { text: c.title },
                fullDescription: {
                  text: (c.regulation ?? []).map((r) => `${r.source} ${r.ref}`).join('; ') || c.title,
                },
                properties: { tags: [...new Set(['compliance', ...(c.regulation ?? []).map((r) => r.source)])], method: c.method },
              })),
          },
        },
        results: findings.map((f) => ({
          ruleId: f.controlId,
          level: LEVEL[f.decision],
          message: { text: `${f.message} [${f.tool}/${f.ruleId}]` },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: prefix + f.file },
                region: { startLine: Math.max(1, f.startLine), endLine: Math.max(1, f.endLine, f.startLine) },
              },
              ...(f.symbol ? { logicalLocations: [{ fullyQualifiedName: f.symbol }] } : {}),
            },
          ],
          partialFingerprints: { complianceKey: `${f.controlId}|${f.file}|${f.symbol ?? f.startLine}` },
          properties: { decision: f.decision, confidence: f.confidence, tool: f.tool },
        })),
      },
    ],
  };
}
