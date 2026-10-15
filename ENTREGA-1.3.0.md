# Entrega 1.3.0 — editor visual de fotos

Execução local em 15/10/2026. Nenhuma publicação ou acesso a dados de produção. Configurações de e-mail, WhatsApp, senhas e MFA preservadas; os testes usam contas e bancos fictícios isolados.

## Comportamento

Em Administração → Imóveis → Editar, as fotos existentes aparecem sem duplicação. O editor permite ampliar, adicionar arquivos com prévia local, acompanhar progresso, repetir uploads com falha, escolher a principal, remover associações e desfazer. A principal permanece primeiro; as outras fotos podem ser ordenadas por arrastar e soltar ou botões operáveis por teclado e toque. Os controles e avisos estão nos cinco idiomas.

Escolhas permanecem no rascunho até Salvar imóvel. Cancelar, fechar ou sair aborta requisições pendentes e preserva as associações salvas. Uploads já concluídos permanecem armazenados mesmo após cancelar. Remover uma associação não exclui o arquivo. Não foi introduzido mecanismo de limpeza de arquivos órfãos.

Persistência usa `image` e `gallery`, sem migração de banco. A principal fica em `image`; as demais referências, em ordem, ficam em `gallery`. Fotos locais, uploads e URLs HTTPS legadas continuam aceitos. O anúncio público e a preparação da apresentação começam pela principal e eliminam duplicações. A preparação mantém suas escolhas independentes.

Mantidos JPG, PNG e WebP, 3 MB por arquivo, principal mais 20 fotos, validação real no servidor, limite de pixels e conversão WebP. Fotos pendentes ou com falha impedem salvar até concluir ou remover. Sem fotos, o anúncio usa o fallback existente. Ao remover a principal mantendo outras fotos, é necessário escolher outra.

O formulário envia `expectedUpdatedAt`; versões antigas carregadas recebem HTTP 409 quando há nova gravação. A comparação e a escrita continuam atômicas. O timestamp avança mesmo em gravações no mesmo milissegundo. Clientes antigos da API sem esse campo continuam compatíveis; devem enviar a revisão para obter a mesma proteção contra formulários antigos.

## Arquivos desta entrega

- `public/portal/photo-editor.js`: módulo de rascunho, interface e textos nos cinco idiomas.
- `public/portal/app.js`, `style.css`, `i18n.js`: integração, galeria pública, estilos e aviso de conflito.
- `core/service.mjs`: revisão esperada e proteção contra colisão de IDs na criação.
- `server.mjs`: `blob:` permitido somente em `img-src`, necessário às prévias locais.
- `photo-editor.test.mjs`, `test.mjs`, `scripts/verify-photo-editor.mjs`: testes de domínio, API e navegador.
- `package.json`, `package-lock.json`: versão 1.3.0 e inclusão dos testes.
- `public/portal/index.html` e importações dos módulos de interface: cache `20261015-5`.
- `README.md`, `PLANO-DE-MELHORIAS.md`, este documento: operação e estado real da entrega.

O diretório já continha alterações de entregas anteriores; elas foram preservadas.

## Validação

- `npm run build`: aprovado.
- `npm test`: 58 testes aprovados. Incluem seleção, ordenação/reabertura, remoção/desfazer, cancelamento, bloqueio de referências pendentes, upload inválido, limites, permissões, gravações simultâneas, formulário obsoleto e preservação de arquivo compartilhado.
- Backup/restauração SQLite: aprovado na suíte, comparando todos os registros de propriedades (incluindo referências e ordem) e bytes das fotos.
- `node scripts/verify-photo-editor.mjs`: Chrome em desktop 1440 × 1000 e viewport móvel 390 × 844. Verificados imóveis antigos, miniaturas sem duplicação, prévia, teclado, remoção/desfazer, cancelamento, falha de rede e retentativa, fotos verticais/horizontais, imagem indisponível na miniatura/prévia, imóvel sem fotos, limites, ordenação, reabertura, anúncio, apresentação, conflito e abertura do editor nos cinco idiomas. Capturas e resultados em `data/photo-qa/`, excluídos do ZIP. Toque sintetizado pelo Playwright; não equivale a aparelho físico.
- Inspeção visual das capturas desktop/móvel realizada. O bloqueio inicial das imagens blob pela CSP foi corrigido e o carregamento das miniaturas foi confirmado no navegador.
- Detector Impeccable executado: apontou apenas a imagem inicialmente sem `src` da prévia oculta; corrigida.
- `npm run test:mysql`: tentado, mas não iniciou: serviço Docker Desktop Linux indisponível (`dockerDesktopLinuxEngine`). MySQL desta entrega permanece pendente.

Limitações restantes: MySQL/backup MySQL e aparelhos móveis físicos. Não houve publicação.

## Pacote e reversão

Procedimento existente: `python scripts/package-release.py 2026-10-15`.

Pacote: `releases/confianza-hostinger-1.3.0-2026-10-15.zip`, acompanhado de `.zip.sha256`. O empacotador verifica a integridade e exclui bancos, uploads privados, `node_modules`, arquivos `.env` e credenciais de ambiente. Evidências e bancos de QA ficam fora do pacote. Preservados os ZIPs anteriores; eventual reversão deve usar a versão anterior e backup operacional compatível. Nenhuma migração de dados é necessária para esta entrega.
