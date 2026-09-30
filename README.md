# bank-compliance-gate

Bankacılık uygulamalarında BDDK, KVKK ve PCI DSS gereksinimlerini CI aşamasında kontrol eden tarayıcı.

Mevzuat maddeleri `controls.yaml` içinde teknik kontrollere çevrildi. Her kontrol ya bir statik analiz aracıyla (Semgrep, gitleaks, Checkov, Trivy, Conftest) ya da LLM tabanlı bir ajanla kontrol ediliyor. Ajanın verdiği kararlar pipeline'ı tek başına durdurmuyor, onaya düşüyor.

## Klasörler

```
controls.yaml        kontrol kataloğu
rules/               semgrep kuralları, rego politikası, checkov eşleşmeleri
compliance-runner/   NestJS CLI
demo-bank-api/       test için bilerek açıklı yazılmış uygulama
demo-bank-eval/      demo için beklenen bulgular
scripts/             CI'da araç kurulumu
```

## Çalıştırma

```bash
bash scripts/install-scanners.sh
cd compliance-runner && npm ci && npm run build
node dist/cli.js ../demo-bank-api ../controls.yaml
node dist/eval.js
```

Çıktılar `compliance-runner/out/` altına yazılır: `findings.json`, `results.sarif`, `summary.md`.

Engelleyici bulgu varsa çıkış kodu 1, bir araç çalışmazsa 2.

LLM ajanı için `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` ve gerekirse `LLM_BASE_URL` tanımlanmalı. Tanımlı değilse `AGENTS=off` ile ajan kapatılabilir. Ajan modele sadece entity alan adlarını ve tiplerini gönderiyor.

## Demo sonuçları

| | recall | precision |
|---|---|---|
| sadece araçlar | 16/19 | 16/16 |
| araçlar + PII ajanı | 18/19 | 18/19 |

Yakalanamayan: TypeORM config içindeki parola (gitleaks varsayılan kurallarıyla bulmuyor).

## Eksikler

- BDDK madde numaraları henüz doğrulanmadı (`verified: false`)
- onay bekleyen bulgular için onay akışı yok, şimdilik PR yorumu olarak görünüyor
