# compliance-runner

Tarayıcıları çalıştırıp bulguları tek formatta toplayan NestJS CLI.

```bash
npm ci && npm run build
node dist/cli.js <repo> [controls.yaml] [out/findings.json]
node dist/eval.js [out/findings.json] [expected-findings.yaml]
```

Ortam değişkenleri: `RULES_DIR`, `SARIF_PATH_PREFIX`, `FAIL_ON_TOOL_ERROR`, `AGENTS`, `LLM_*`.
