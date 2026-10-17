# Upload da revisão de segurança 1.5.0-rc.2

Data: 17/10/2026. A versão `1.5.0-rc.1` está publicada no subdomínio; `1.5.0-rc.2` é o pacote corrigido para homologação e substituição após as verificações da instalação.

1. Use `releases/confianza-hostinger-1.5.0-rc.2-2026-10-17.zip` e confira o arquivo `.zip.sha256` correspondente. O ZIP contém código-fonte Node.js, não um site estático.
2. Antes do upload, preserve a versão anterior e faça backup do banco MySQL, incluindo `image_files`. Valide a restauração em um banco isolado. Mantenha todas as variáveis e chaves da instalação; não substitua `.env`, `data/`, uploads nem bancos persistentes.
3. Homologue em uma aplicação Node 24 separada. Na raiz do projeto extraído, confirme `package.json`, `server.mjs`, `core/` e `public/`. Instale pelo lockfile (`npm ci`), valide (`npm run build`) e use `server.mjs` como entrada da aplicação. Não execute uma segunda instância de WhatsApp QR sobre a mesma sessão.
4. Verifique `/api/health`, login e MFA existentes, listagem, cards, detalhe, fotos e envio de lead autorizado. No painel de imóveis, edite um cadastro de teste com `m²` e outro com `ha`; textos do destaque devem aparecer apenas como texto. Revise as permissões da equipe.
5. Depois da troca em produção, confira novamente o scanner da Hostinger, SSL, logs e persistência dos dados. Se houver regressão, retorne o código à versão anterior mantendo o banco e as mesmas chaves; não restaure um backup antigo como primeira ação, pois isso perderia leads novos.

O gate MySQL/restauração de produção e a checagem da configuração do proxy e MFA exigem acesso operacional à instalação. O pacote local não atesta esses pontos. Veja [o relatório de segurança](docs/AUDITORIA-SEGURANCA-2026-10-17.md) e [a entrega](ENTREGA-1.5.0-rc.2-SEGURANCA.md).
