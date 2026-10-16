# Entrega local 1.4.1 — correções 29 a 31

Implementação local em 16/10/2026, sem publicação, contas reais ou mensagens. Foram corrigidos o isolamento de rascunhos por conversa do WhatsApp QR, as transições de recibos e a detecção de reordenação de fotos. O ícone local do WhatsApp ganhou cobertura funcional, visual e acessível.

A infraestrutura fixa Playwright e Axe no lockfile, separa unidade, contratos, integração, E2E, acessibilidade, visual, MySQL e smoke de pacote, bloqueia rede externa e gera evidências vinculadas ao conteúdo do código. Consulte `TESTES-AUTOMATIZADOS.md` e `PROGRESSO-29-31.md`.

O aceite MySQL local permanece pendente porque o mecanismo Docker Desktop não iniciou nesta máquina. Por isso, o gate de release segue bloqueado e nenhum ZIP final foi gerado. Também permanecem externos os testes com WhatsApp, SMTP Hostinger, Meta, hospedagem, aparelhos e leitor de tela reais.
