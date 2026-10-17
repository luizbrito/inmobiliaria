# Upload da versão 1.5.0-rc.3

O arquivo `releases/confianza-hostinger-1.5.0-rc.3-2026-10-17.zip` é uma aplicação Node.js 24, não um site estático. Confira o SHA-256 no arquivo `.zip.sha256` antes de enviar.

1. Faça backup do banco MySQL e dos arquivos persistentes, preserve as variáveis e chaves da instalação e guarde o código anterior para retorno. Não substitua `.env`, `data/`, uploads ou banco.
2. Extraia o ZIP na raiz de uma aplicação Node 24 separada para homologação. Confirme `package.json`, `server.mjs`, `core/` e `public/`; execute `npm ci`, `npm run build` e configure `server.mjs` como entrada.
3. Confira `/api/health`, busca, detalhe, fotos, login/MFA e um lead de teste autorizado. No painel, abra o ícone ao lado do idioma, altere a fonte e confira o menu no celular. Verifique que “Preparando novos horizontes…” não aparece na navegação.
4. Após publicar, acompanhe logs, SSL, scanner da hospedagem e persistência. Em caso de regressão, restaure o código anterior com o mesmo banco e as mesmas chaves.

As pendências de segurança operacional e a necessidade de validar MySQL e restauração na instalação real estão em [auditoria de segurança](docs/AUDITORIA-SEGURANCA-2026-10-17.md). O pacote local não comprova esses itens.
