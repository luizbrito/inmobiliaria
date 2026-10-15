# Entrega 1.1.0 — plano de melhorias

Implementação local em 15/10/2026. Base anterior: 1.0.3. A versão instalada em produção ainda precisa ser conferida antes da publicação.

## Funções implementadas

- Apresentação extraída de `app.js` para módulos próprios. Preparação com idioma, corretor, preço público, escolha e ordem das fotos e legendas de até 180 caracteres. Até 21 fotos distintas, incluindo a capa.
- Prévia e impressão usam o mesmo documento. Páginas A4 com identidade, título e contato em cada página; paginação de descrições extensas; fotos sem corte, com tratamento vertical; carregamento antes de habilitar impressão; aviso e tentativa adicional para imagens indisponíveis. O fluxo continua sendo **Imprimir / Salvar como PDF**.
- Ficha comercial com identificação, localização, áreas, estrutura, solo, chuva, descrição e características. Campos vazios são omitidos, zero é preservado e preço sob consulta é respeitado. Moedas e unidades não são convertidas.
- QR comercial separado do MFA. O servidor monta a URL com `PUBLIC_ORIGIN`. Rascunhos e anúncios vendidos não têm material público nem QR disponível.
- Perfil público escolhido por apresentação. Administradores habilitam nome comercial, WhatsApp e e-mail profissional em **Equipe → Perfil público**. Dados de login permanecem separados. Corretor desativado deixa de aparecer na API e a nova impressão usa o contato geral.
- Português, espanhol, inglês, italiano e alemão para a preparação e o material. Traduções do imóvel são reutilizadas, com aviso quando falta conteúdo traduzido.
- Copiar mensagem, abrir WhatsApp e compartilhar mensagem pelo recurso nativo, quando disponível. O arquivo PDF salvo pode ser compartilhado pelo aplicativo do usuário. Não existe confirmação automática de envio, entrega ou leitura.
- Associação opcional a um contato, com autor, imóvel, idioma e data no histórico: **Apresentação preparada** ou **Compartilhamento iniciado**.
- Central de pendências, filtros por responsável e etapa, contagens e ações para concluir ou reagendar. Contatos encerrados são excluídos. Datas da central usam `America/Sao_Paulo`; a entrada de reagendamento usa o fuso do dispositivo e é convertida para UTC.
- Visitas próximas, aguardando aviso/confirmação e passadas ainda abertas, com filtros por imóvel e responsável e acesso ao histórico. Exibição de horário da central e da propriedade, preservando disponibilidade, conflitos e antecedência existentes.
- Relatórios por período inclusivo, imóvel e responsável, com contatos por etapa, retornos vencidos, visitas, movimentações e limitações do histórico. Comissões previstas, aprovadas e pagas separadas por moeda e protegidas no servidor. CSV com proteção contra fórmulas.

## Persistência e compatibilidade

Não há nova tabela nem migração destrutiva. `users.publicProfile` é opcional; usuários antigos começam sem perfil público. Contatos e visitas ganham `revision` quando alterados; registros antigos começam em zero. A interface envia a revisão lida e recebe conflito HTTP 409 se outro usuário já alterou o registro. Os contratos existentes continuam aceitando clientes antigos sem revisão, mantendo a comparação atômica durante a operação.

O backup já inclui integralmente `users`, `leads` e `visits`. O teste de backup/restauração comparou os registros, incluindo um perfil público cadastrado e as revisões novas, e as fotos byte a byte. Sessões continuam excluídas da restauração. As chaves de MFA e backup existentes não foram alteradas.

## Validação realizada

- `npm run build` concluído; `npm test`: **36 testes aprovados**.
- QR decodificado automaticamente para o anúncio correto; permissões administrativas e comerciais testadas; dados internos ausentes do material; anúncio indisponível, preço sob consulta, ausência e zero testados.
- Fluxos reais no Chrome: preparar, editar legenda, escolher idioma, abrir impressão, login com MFA, editar perfil público, concluir retorno e gerar relatório.
- Capturas de desktop e viewport móvel de 390 px. Documentos gerados nos cinco idiomas; exemplos de uma e duas páginas; exemplo de **19 páginas**, com 21 fotos e descrição extensa, no Chrome e Edge.
- Conferência visual de páginas renderizadas e verificação automática da presença de marca, título e contato em todas as 19 páginas; ausência de conteúdo excedendo a área das páginas.
- No exemplo de 19 páginas: preparação local em aproximadamente **0,5 segundo**, PDF de aproximadamente **0,88 MB**. Imagens locais já otimizadas; rede externa e dispositivo podem alterar estes resultados.
- Dados fictícios em bancos de teste isolados. Evidências locais em `data/qa-results/`; não entram no ZIP.

Para repetir a conferência do navegador: `npm install --prefix data/qa-tools playwright`, seguido de `node scripts/verify-browser.mjs`. O script usa Chrome/Edge instalados no Windows, inicia servidor e banco isolados e encerra o servidor no final. A instalação de QA não altera as dependências de produção.

## Pendências antes da produção

1. Conferir deployment ativo, versão anterior e banco MySQL esperado na Hostinger.
2. Fazer backup criptografado de produção e testar restauração em banco separado, preservando as chaves existentes. O teste local SQLite não substitui o MySQL.
3. Validar em ambiente de teste com MySQL e dados fictícios; conferir logs, uploads, login/MFA, formulário e apresentação.
4. Publicar o ZIP de fonte `releases/confianza-hostinger-1.1.0-2026-10-15.zip` somente depois dos critérios anteriores e conferir o conteúdo real do site.
5. Manter a fonte 1.0.3 como candidata a reversão de código, verificando sua compatibilidade com o banco real. Não restaurar backup antigo sobre dados recentes sem plano específico.
6. Remover `BOOTSTRAP_ADMIN_PASSWORD` e a senha administrativa inicial do hPanel após o cadastro, trocar qualquer senha compartilhada e concluir o autenticador. Essas ações dependem do acesso operacional à conta.
7. Conferir impressão física e leitura de QR em Android/iPhone reais. A emulação de viewport móvel não valida os navegadores desses aparelhos.

Notificações externas são a etapa opcional do plano. Permanecem pendentes da escolha de canal/provedor, conta, consentimento, custos e autorização para envio. Nenhuma mensagem é enviada automaticamente.
