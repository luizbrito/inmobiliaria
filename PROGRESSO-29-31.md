# Execução sequencial — seções 29 a 31

Início: 16/10/2026. Base: 1.4.0. Escopo autorizado: projeto local, testes e documentação; sem publicação ou provedores reais. Sem subagentes ou etapas em paralelo.

## Registro

1. Preparação concluída. Não há AGENTS.md no projeto. Alterações preexistentes preservadas em PLANO-DE-MELHORIAS.md, app.js e index.html. Referência: `npm run build` (39 arquivos) e `npm test` (81 aprovados). Git disponível; nenhuma alteração de produção.
2. Seções 29.1–29.3, ícone e matriz local concluídos. Etapa atual: validação final e gates de release.

## Etapas restantes, na ordem

3. Transições de recibos e reinício durante envio.
4. Alterações reais de fotos e proteção de saída.
5. Regressão do ícone existente.
6. Dependências, comandos e infraestrutura reproduzível.
7. Matriz funcional na ordem do plano.
8. Pipeline, relatórios e documentação de cobertura.
9. Validação final e entrega; gates indisponíveis bloqueiam release.

Este arquivo registra resultados efetivos, não promessas de aprovação. Resultados por etapa serão acrescentados abaixo.

### Etapa 2 — concluída

Rascunhos em memória por conversa e conta; formulário vinculado ao destinatário; identificador de tentativa preservado em erro HTTP; proteção contra resultado atrasado, troca de usuário, perda de acesso e duplo envio. Arquivos: whatsapp-qr-ui.js, app.js, tests/qr-ui.browser.test.mjs. Antes: três regressões falharam; depois: seis testes de navegador aprovados (`node --test --test-concurrency=1 tests/qr-ui.browser.test.mjs`). Nenhum provedor conectado. A dependência temporária do Playwright será normalizada na etapa 6.

Próxima ação: etapa 3, transições explícitas e recuperação de envio interrompido.

### Etapa 3 — concluída

Tabela explícita em core/qr-delivery.mjs; falha confirmada substitui estados não entregues, sem regredir delivered/read. Recibos antecipados retidos por até 24h e reconciliados; escrita atômica com retentativas; lease exclusivo recupera sending como uncertain sem reenviar. Callbacks de instâncias antigas são ignorados. Três testes reproduziram as lacunas antes; 11 testes QR passaram depois, incluindo corrida com resposta do transporte e conflito CAS. Próxima ação: proteção de alterações de fotos.

### Etapa 4 — concluída

photo-editor-change só é emitido quando seleção/associações/ordem mudam. O guard escuta mutações reais e limpa listeners ao desmontar. Estado é conservador: após desfazer permanece protegido até salvar/cancelar, sem apagar modificações de outros campos. Teste unitário falhou antes e passou depois; seis testes de modelo/guard e sete de navegador passaram. verify-photo-editor.mjs concluiu sete grupos sem erros (upload, retentativa, ordem persistida, conflito, máximo, fallback e idiomas). Próxima ação: etapa 5, cobertura do ícone existente.

### Etapa 5 — concluída

verify-team-ui.mjs agora confere geometria, fill herdado, stroke, nome acessível e aria-hidden do ícone ativo/inativo nos cinco idiomas, com fonte ampliada e viewport móvel. Verificador completo aprovado (14 grupos, zero erros), sem redesenhar o menu. Próxima ação: infraestrutura reproduzível.

### Etapa 6 — concluída

Playwright 1.64.1 e axe 4.14.0 fixados no manifesto/lock; imports de data/qa-tools removidos dos verificadores. Runner Node serializado por camada, JUnit, relatórios JSON e bloqueio de rede externa herdado pelos processos Node filhos; navegador permite só origem local. Helpers desativam provedores, usam portas temporárias e limpeza validada. Unitários: 27; integração: 29; navegador de regressão: sete, todos aprovados. Comandos de E2E/acessibilidade/visual serão completados na matriz seguinte. Próxima ação: linha 1 da matriz, catálogo público.

### Etapa 7 — matriz local concluída; aceite externo separado

Linhas conferidas na ordem: M01 catálogo/filtros/favoritos/comparação; M02 cinco idiomas; M03 paginação real de apresentações e campos públicos; M04 papéis e logout; M05 recuperação inválida/inativos; M06 rascunho/conflito; M07 verificador de fotos; M08 retenção de 100 versões; M09 unificação atômica e vínculos QR; M10 fusos/meia-noite/DST; M11 centavos/comissões; M12 fila e SMTP simulados; M13 respostas 429/400/500/timeout e cinco idiomas; M14 QR/paginação/revogação; M15 retenção e ausência de métricas; M16 WCAG e identidade; M17 backups; M18 pacote temporário.

Regressão visual: 60 referências separadas por idioma/fonte/viewport/estado, geradas apenas na criação inicial. Inspecionado símbolo ativo. Axe identificou contrastes legados; corrigidos mantendo paleta, sem desativar regras. 16 telas passaram. Verificador de fotos corrigido para aguardar as miniaturas reais em vez de ler DOM prematuramente. Smoke do ZIP: SHA-256, conteúdo, instalação npm limpa de produção, build extraído, saúde e fronteira anônima aprovados; pacote temporário removido.

Próxima ação: etapa 8, CI sequencial, evidências vinculadas ao código, cobertura e gates. MySQL e provedores reais ainda não aprovados.

### Etapa 8 — implementação concluída; gate externo pendente

CI sequencial criada em `.github/workflows/quality.yml`; comandos por camada, JUnit, cobertura, E2E, Axe, regressão visual, MySQL descartável e smoke do pacote configurados. Evidências são vinculadas ao hash dos fontes, Node 24, validade, execução completa e zero casos ignorados. Playwright/Axe estão fixos no lockfile e nenhum script depende de `data/qa-tools`. Documentação: `TESTES-AUTOMATIZADOS.md`.

O Docker Desktop instalado não iniciou o mecanismo Linux nesta máquina em 16/10/2026. Assim, `reports/mysql.json` não contém aprovação válida e o gate de release permanece bloqueado. Nenhum provedor ou sistema de produção foi acessado.

Próxima ação: executar as verificações finais independentes, tentar o gate MySQL em ambiente com Docker funcional e gerar o pacote somente se todos os gates passarem.

### Etapa 9 — validação local concluída; release bloqueada por MySQL

Versão 1.4.1. Resultado final independente: build de 86 arquivos; 101/101 testes gerais; cobertura crítica aprovada; sete regressões de navegador; verificadores de equipe e fotos sem erros; 5/5 E2E funcionais; 16/16 rotas Axe; 60/60 comparações visuais; smoke do pacote temporário aprovado com checksum, instalação limpa, build, saúde e fronteira anônima. O detector final de interface não apontou ocorrências.

Durante a validação, duas limpezas de SQLite no Windows revelaram bloqueio transitório `EBUSY`; o teardown agora aguarda o processo e usa retentativas limitadas. O pipeline foi reiniciado após cada alteração e os cenários passaram.

MySQL: reprovado por indisponibilidade ambiental. O Docker Desktop encerrou sem criar o pipe `dockerDesktopLinuxEngine`; `docker run mysql:8.4.0` não iniciou. `reports/mysql.json` registra falha, portanto o gate completo permanece bloqueado e nenhum pacote final foi mantido em `releases/`. O ZIP usado no smoke foi temporário e removido. Próxima ação operacional: executar `npm run quality` em máquina com Docker funcional; somente com todas as evidências aprovadas usar `node scripts/quality-sequence.mjs --release 2026-10-16`.
