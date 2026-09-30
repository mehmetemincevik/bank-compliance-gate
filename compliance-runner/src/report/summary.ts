import { Control } from '../catalog/catalog.service.js';
import { Decision, GatedFinding } from './gate.js';

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

function table(rows: GatedFinding[], get: (id: string) => Control | undefined) {
  const lines = ['| Kontrol | Konum | Araç | Açıklama |', '|---|---|---|---|'];
  for (const f of rows.slice(0, 50)) {
    const where = `\`${f.file}${f.startLine ? `:${f.startLine}` : ''}\`${f.symbol ? ` ${f.symbol}` : ''}`;
    lines.push(`| ${f.controlId} ${esc(get(f.controlId)?.title ?? '')} | ${where} | ${f.tool} | ${esc(f.message)} |`);
  }
  if (rows.length > 50) lines.push(`\n+${rows.length - 50} bulgu daha, findings.json'a bak.`);
  return lines.join('\n');
}

export function toMarkdown(
  findings: GatedFinding[],
  errors: { tool: string; error: string }[],
  get: (id: string) => Control | undefined,
) {
  const by = (d: Decision) => findings.filter((f) => f.decision === d);
  const block = by('block');
  const review = by('review');
  const advisory = by('advisory');

  const status = block.length
    ? `BAŞARISIZ, ${block.length} engelleyici bulgu`
    : errors.length
      ? 'UYARI, bazı araçlar çalışmadı'
      : review.length
        ? `GEÇTİ, ${review.length} bulgu onay bekliyor`
        : 'GEÇTİ';

  const out = [`## Uyum taraması: ${status}`, ''];
  out.push(`block: ${block.length} | review: ${review.length} | advisory: ${advisory.length}`, '');
  if (block.length) out.push('### Engelleyici', table(block, get), '');
  if (review.length) out.push('### Onay bekleyen', table(review, get), '');
  if (advisory.length) out.push('<details><summary>Bilgi amaçlı</summary>', '', table(advisory, get), '', '</details>', '');
  if (errors.length) {
    out.push('### Çalışmayan araçlar');
    for (const e of errors) out.push(`- **${e.tool}**: ${esc(e.error).slice(0, 200)}`);
    out.push('');
  }
  return out.join('\n');
}
