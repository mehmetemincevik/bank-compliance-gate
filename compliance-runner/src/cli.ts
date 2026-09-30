import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { AppModule } from './app.module.js';
import { CatalogService } from './catalog/catalog.service.js';
import { gate } from './report/gate.js';
import { toSarif } from './report/sarif.js';
import { toMarkdown } from './report/summary.js';
import { RunnerService } from './runner/runner.service.js';

async function main() {
  const [repo, controls = '../controls.yaml', out = 'out/findings.json'] = process.argv.slice(2);
  if (!repo) throw new Error('usage: node dist/cli.js <repo> [controls.yaml] [out.json]');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const catalog = app.get(CatalogService);
  catalog.load(controls);
  const result = await app.get(RunnerService).run(repo);
  await app.close();

  const get = (id: string) => catalog.get(id);
  const findings = gate(result.findings, get);
  const dir = dirname(out);
  await mkdir(dir, { recursive: true });
  await writeFile(out, JSON.stringify({ findings, errors: result.errors }, null, 2));
  await writeFile(
    join(dir, 'results.sarif'),
    JSON.stringify(toSarif(findings, catalog.all(), process.env.SARIF_PATH_PREFIX), null, 2),
  );
  await writeFile(join(dir, 'summary.md'), toMarkdown(findings, result.errors, get));

  console.table(
    findings.map((f) => ({
      control: f.controlId,
      decision: f.decision,
      tool: f.tool,
      file: f.file,
      symbol: f.symbol ?? '',
      line: f.startLine,
    })),
  );
  if (result.errors.length) console.error('failed tools:', result.errors);

  const blocked = findings.filter((f) => f.decision === 'block').length;
  const failOnToolError = process.env.FAIL_ON_TOOL_ERROR !== 'false';
  if (blocked) {
    console.error(`${blocked} blocking finding(s)`);
    process.exitCode = 1;
  } else if (result.errors.length && failOnToolError) {
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 3;
});
