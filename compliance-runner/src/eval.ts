import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { Finding } from './findings/finding.js';

// node dist/eval.js [findings.json] [expected-findings.yaml]
interface Case {
  id: string;
  control: string;
  file: string;
  symbol: string;
  difficulty?: 'easy' | 'hard';
}
interface Expected {
  violations: Case[];
  true_negatives?: Case[];
  ambiguous?: Case[];
}

const [findingsPath = 'out/findings.json', expectedPath = '../demo-bank-eval/expected-findings.yaml'] =
  process.argv.slice(2);

const { findings, errors } = JSON.parse(readFileSync(findingsPath, 'utf8')) as {
  findings: Finding[];
  errors: { tool: string }[];
};
const exp = load(readFileSync(expectedPath, 'utf8')) as Expected;

const key = (c: string, file: string, sym?: string) => `${c}|${file}|${sym ?? ''}`;
const violations = new Map(exp.violations.map((v) => [key(v.control, v.file, v.symbol), v]));
const negatives = new Map((exp.true_negatives ?? []).map((n) => [key(n.control, n.file, n.symbol), n]));
const ambiguous = new Set((exp.ambiguous ?? []).map((a) => key(a.control, a.file, a.symbol)));

const hit = new Map<string, Finding>();
for (const f of findings) hit.set(key(f.controlId, f.file, f.symbol), f);

const tp = [...violations.entries()].filter(([k]) => hit.has(k)).map(([, v]) => v);
const missed = [...violations.entries()].filter(([k]) => !hit.has(k)).map(([, v]) => v);
const fpNegative = [...hit.entries()].filter(([k]) => negatives.has(k));
const fpUnknown = [...hit.entries()].filter(([k]) => !violations.has(k) && !negatives.has(k) && !ambiguous.has(k));
const fpCount = fpNegative.length + fpUnknown.length;

const pct = (a: number, b: number) => (b === 0 ? '-' : `${Math.round((100 * a) / b)}%`);

const controls = [...new Set(exp.violations.map((v) => v.control))].sort();
console.table(
  controls.map((c) => {
    const all = exp.violations.filter((v) => v.control === c);
    const found = tp.filter((v) => v.control === c).length;
    const fp = [...fpNegative, ...fpUnknown].filter(([, f]) => f.controlId === c).length;
    return { control: c, expected: all.length, found, recall: pct(found, all.length), fp };
  }),
);

const byDiff = (d: string) => {
  const all = exp.violations.filter((v) => (v.difficulty ?? 'easy') === d);
  return `${tp.filter((v) => (v.difficulty ?? 'easy') === d).length}/${all.length} (${pct(
    tp.filter((v) => (v.difficulty ?? 'easy') === d).length, all.length)})`;
};

console.log(`\nRecall     : ${tp.length}/${violations.size} (${pct(tp.length, violations.size)})`);
console.log(`  easy     : ${byDiff('easy')}`);
console.log(`  hard     : ${byDiff('hard')}`);
console.log(`Precision  : ${tp.length}/${tp.length + fpCount} (${pct(tp.length, tp.length + fpCount)})`);

if (missed.length) {
  console.log('\nmissed:');
  for (const m of missed) console.log(`  ${m.id}  ${m.control}  ${m.file}  ${m.symbol}  [${m.difficulty ?? 'easy'}]`);
}
if (fpCount) {
  console.log('\nfalse positives:');
  for (const [, f] of fpNegative) console.log(`  [tn]   ${f.controlId}  ${f.file}  ${f.symbol}  (${f.tool})`);
  for (const [, f] of fpUnknown) console.log(`  [new]  ${f.controlId}  ${f.file}  ${f.symbol ?? '?'}:${f.startLine}  (${f.tool})`);
}
if (errors?.length) {
  console.log('\nwarning: failed tools, score may be incomplete:', errors.map((e) => e.tool).join(', '));
}
