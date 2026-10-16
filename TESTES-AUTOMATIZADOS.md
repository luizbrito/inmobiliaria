# Testes automatizados — versão 1.4.1

Esta estrutura executa testes locais sem contas, mensagens ou dados reais. Cada servidor usa porta, banco SQLite e diretório temporários. Provedores ficam desativados; conexões externas inesperadas são bloqueadas. O MySQL usa contêiner e schemas `qa_*` descartáveis, somente quando o Docker local está disponível.

## Comandos

| Comando | Escopo | Evidência |
| --- | --- | --- |
| `npm run build` | sintaxe do código JavaScript | saída do comando |
| `npm run test:unit` | domínio, segurança e guardas de interface | `reports/unit.xml`, `.json`, `.lcov` |
| `npm run test:contracts` | e-mail, WhatsApp oficial e QR simulados | `reports/contracts.*` |
| `npm run test:integration` | API, persistência SQLite, recuperação e backup | `reports/integration.*` |
| `npm test` | três camadas anteriores em ordem | `reports/all.*` |
| `npm run test:coverage` | cobertura Node e limites críticos | `reports/coverage.json` |
| `npm run test:e2e` | regressões 29, fluxos M01–M06, equipe e fotos | `reports/e2e.json`, JUnit e capturas de falha |
| `npm run test:a11y` | Axe WCAG nas 16 rotas representativas | `reports/a11y.*` |
| `npm run test:visual` | 60 baselines do ícone, em 5 idiomas, 3 fontes, 2 viewports e 2 estados | `reports/visual.*` |
| `npm run test:mysql` | API, E2E funcional, backup, fotos, MFA e preflight em MySQL isolado | `reports/mysql.json` |
| `npm run test:release -- --smoke-only` | ZIP temporário, checksum, conteúdo, instalação e servidor extraído | `reports/release-smoke.json` |
| `npm run quality` | gates anteriores em sequência | conjunto completo em `reports/` |

Use Node 24 e `npm ci`. Instale o navegador uma vez com `npx playwright install chromium`. A execução periódica da CI instala também Firefox e WebKit. Os baselines visuais só são atualizados deliberadamente com `node scripts/browser-runner.mjs visual --update-snapshots`; uma execução parcial recebe `partial: true` e não libera pacote.

## Matriz e limites da evidência

M01–M06 estão em `tests/e2e/matrix.spec.mjs`; M05, M08–M11 e M15 em `tests/matrix-domain.test.mjs` e `tests/matrix-reset.test.mjs`; M12–M14 em contratos e `tests/matrix-whatsapp.test.mjs`; M16 em `tests/e2e/accessibility.spec.mjs` e `tests/e2e/visual.spec.mjs`; M17 em `tests/matrix-backup.test.mjs`; M18 em `scripts/verify-release.mjs`. As regressões 29.1 e 29.3 usam navegador real em `tests/qr-ui.browser.test.mjs`; 29.2 usa `whatsapp-qr.test.mjs` e `core/qr-delivery.mjs`.

Cobertura percentual é um apoio. O gate exige ao menos 85% de linhas e 65% de ramos nos módulos críticos configurados, além dos cenários de autenticação, autorização, consentimento, idempotência e recuperação. Adaptadores reais continuam com cobertura deliberadamente limitada porque os testes não conectam provedores.

`scripts/release-evidence.mjs` vincula cada relatório ao hash dos fontes, ao Node 24, a zero casos ignorados, à execução completa e a uma validade de 24 horas. Evidência ausente, parcial, futura, vencida ou de outro código bloqueia a release. A CI em `.github/workflows/quality.yml` usa Node 24.16.0, MySQL 8.4.0 e etapas sequenciais; relatórios e traces de falha são artefatos.

## Aceites externos

Não são substituídos por simulação: conta WhatsApp real e leitura do QR, recebimento SMTP Hostinger, modelos Meta aprovados, infraestrutura Hostinger, aparelhos físicos, leitor de tela e publicação. Essas validações exigem ambiente e autorização próprios. Uma indisponibilidade local de Docker também deixa o gate MySQL reprovado; nunca vira aprovação automática.
