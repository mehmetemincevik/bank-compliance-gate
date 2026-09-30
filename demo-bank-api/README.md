# demo-bank-api

Uyum tarayıcısını test etmek için yazılmış örnek NestJS uygulaması. Bilerek
güvenlik açıkları içerir, deploy edilmemeli. İçindeki parola ve anahtarlar sahte.

Beklenen bulgular `../demo-bank-eval/expected-findings.yaml` dosyasında.

## Yapı

```
src/common/        maskPan, encrypted transformer, @Audit, MfaGuard
src/cards/         kart entity ve servisi
src/customers/     müşteri entity
src/transfers/     transfer endpoint'leri
src/admin/         admin endpoint'leri
src/integrations/  fraud score istemcisi
infra/main.tf      terraform
.compliance.yaml   tarayıcı ayarları
```

## Notlar

- Trivy lockfile okur: `npm install --package-lock-only`
- `.compliance.yaml` içindeki `allowed_regions` örnek değer, gerçek bölgelerle değiştir.
