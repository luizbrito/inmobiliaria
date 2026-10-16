# Entrega 1.4.0 — administração e operação

Execução local, 15/10/2026 (America/Sao_Paulo). Implementação das seções 20 a 28, incluindo o complemento 26.1 acrescentado ao plano durante a execução. Não houve publicação, acesso a produção, conexão com conta WhatsApp, envio real, alteração de senhas/MFA existentes ou contratação de serviço. As configurações reais de ambiente foram preservadas.

Os itens marcados no plano representam implementação e validação local. Leitor de tela real, MySQL, provedores e hospedagem continuam identificados separadamente como pendências; simulações não foram tratadas como envios ou conexões reais.

## Funcionalidades e uso

| Área | Como usar e comportamento |
| --- | --- |
| Imóveis em página dedicada | Em Imóveis, use Novo imóvel ou Editar. URLs `/admin/imoveis/novo` e `/admin/imoveis/ID/editar`, protegidas por sessão e perfil. A página ocupa a área disponível, organiza seis seções e mantém salvar no cabeçalho e nas ações inferiores. |
| Rascunho e navegação | Voltar/Cancelar pede confirmação se houve edição. Sair/recarregar também usa a proteção nativa do navegador. Falhas mantêm os campos preenchidos. A busca administrativa retorna pelo filtro armazenado por usuário nesta sessão do navegador. |
| Fotos | Preservados upload com progresso, retentativa, miniaturas, ampliação, principal, ordenação, remoção/desfazer, referências antigas e comparação da revisão carregada. Regressão conferida também no anúncio e na preparação da apresentação. |
| Acessibilidade | No topo da administração, escolha 100%, 120% ou 140% e Formulários simplificados. Preferência salva na própria conta e mantida ao recarregar. Foram acrescentados atalho para o conteúdo, agrupamentos semânticos, foco em erro e áreas de toque. |
| Recuperação de senha | Link Esqueci minha senha no login, ou `/admin/recuperar`. Resposta uniforme; token de uso único, hash no banco, validade de 15 minutos e limites por IP/e-mail. Troca invalida sessões e tokens anteriores; mantém segredo e exigência individual de MFA. SMTP fica desativado até configuração/autorização. |
| Histórico de imóveis | Botão Histórico de versões na listagem. Exibe autor, data e comparação; informações de comissão seguem a permissão específica. Recuperar cria nova revisão, verifica conflito e preserva as comissões/pagamentos atuais. Retenção de até 100 versões; legado anterior à primeira alteração aparece sem autor/data inventados. |
| Cadastro incompleto | Pendências na listagem e links para campos no editor. Título, área positiva, preço positivo ou Sob consulta e seleção principal quando há galeria são verificados para publicação. Fotos, localização, descrição e traduções são recomendações; publicação sem fotos mantém o fallback existente. Rascunhos podem ficar incompletos; limites de formato e segurança continuam obrigatórios. |
| Organizar contatos | Nova seção com busca, filtros de pendência/inatividade, prazo configurável por administrador, possíveis duplicados, revisão da unificação e registro de interação manual. E-mails são normalizados por caixa/espaços e telefones por dígitos, sem inferir país. Aliases anteriores também entram na revisão. |
| Unificar contatos | A origem é arquivada, preservando o registro original. Históricos, consentimentos, responsáveis, aliases e vínculos são mantidos; visitas e conversas passam a apontar ao destino na mesma transação. Responsáveis conflitantes exigem escolha. Lembretes da origem arquivada deixam de ser válidos. |
| Notificações WhatsApp | Canal oficial Meta Cloud API acrescentado à fila existente: preferência explícita por usuário, modelos nos cinco idiomas, horários, limite diário, cancelamentos, retentativas controladas e estados de provedor. Simulação não envia. Resultado ambíguo fica incerto e não é repetido automaticamente. |
| Conversas por QR Code | Nova seção Conversas por WhatsApp. Administrador controla conexão, equipe autorizada e destinatários de teste. Há lista, histórico, não lidas locais, vínculo manual quando há ambiguidade, responsável, consentimento e respostas de texto. Atualização periódica preserva a resposta em edição. Sessão criptografada e controle de instância única no banco. |
| Desempenho | Filtros de período UTC, imóvel e responsável; consultas registradas, contatos, visitas, vendas explícitas e conversão, com período anterior e CSV. Concluir contato não conta como venda. Sem medição configurada, consultas aparecem ausentes. Não retorna dados pessoais ou comissões. |
| Backups | Administrador consulta última criação, última restauração validada, duração e falhas. Rotina opcional cria backup criptografado e restaura em destino temporário vazio; compara registros e bytes de fotos. Retenção e espaço são controlados; alertas usam a fila e o consentimento já configurados. |

## Integrações e limites operacionais

Instruções completas em [CONFIGURACAO-1.4.0.md](CONFIGURACAO-1.4.0.md).

- Recuperação reutiliza o transporte SMTP existente, sem habilitar automaticamente os lembretes por e-mail. Falhas de envio invalidam o token preparado e são auditadas sem seu conteúdo. Solicitações são atendidas fora do caminho da resposta HTTP uniforme. Não há token em logs ou resposta da API.
- O adaptador oficial WhatsApp utiliza modelos de três parâmetros de corpo, definidos e aprovados na conta Meta. `whatsapp_accepted` não equivale a entrega; somente webhook assinado confirma estados. Eventos antecipados são reconciliados e STOP repetido não desfaz uma nova autorização posterior.
- QR Code usa **Baileys 7.0.0-rc14**, dependência opcional baseada em WhatsApp Web, **não oficial**. O pacote foi instalado e importado, sem abrir socket. Há risco de incompatibilidade, desconexão ou restrição da conta; a versão é candidata a lançamento. Não se apresenta esta alternativa como API oficial ou homologada.
- Conversas QR são apenas atendimento manual individual de baixo volume. Padrão de 20 respostas/dia por conta, configurável de 1 a 50, até 2000 caracteres por resposta. O modo de teste exige telefone autorizado. Não há disparo em massa ou resposta automática. Mensagens não textuais são identificadas, mas anexos não são baixados.
- O histórico QR começa nas mensagens recebidas durante a operação; não importa todo o histórico prévio do celular. Dados permanecem no banco entre reinícios. Autenticação é cifrada com chave própria do servidor; QR temporário só é exibido ao administrador. Revogação remota não confirmada exige remover o dispositivo no celular.
- A camada de conversas depende do contrato de adaptador, não do SDK na interface ou nas associações. Uma futura implementação oficial para conversas pode preservar os registros, responsáveis e vínculos. O canal oficial de lembretes já é independente.
- Fotos não são apagadas automaticamente, inclusive quando versões antigas saem da retenção. Isso evita quebrar referências compartilhadas. Conversas não têm expurgo automático nesta entrega; acesso e capacidade devem ser administrados no banco e nos backups.
- Consultas usam HMAC de IP/agente/dia, sem guardar IP ou agente no registro de medição. Repetição no mesmo imóvel/dia conta uma vez; equipe autenticada e agentes automatizados conhecidos são excluídos. Não equivale a contagem exata de pessoas nem reconstrói períodos anteriores à ativação. Retenção das consultas: 90 dias, com limpeza diária. Por responsável, consultas ficam ausentes porque não há atribuição confiável.
- Conversão é a parcela dos contatos criados no período que também foram explicitamente registrados como venda do imóvel no período. Vendas totais usam a data de registro da venda; podem incluir interessados de períodos anteriores. Visitas agendadas incluem solicitadas, confirmadas e realizadas, excluindo canceladas. Registros unificados usam o contato de destino e preservam a origem para auditoria.
- Backups: por padrão, intervalo de 24 horas, sete arquivos e orçamento de 1 GiB, com verificação de espaço antes de executar. SQLite restaura em diretório temporário novo. MySQL usa esquema aleatório com prefixo restrito; nunca escolhe o banco de origem. Chaves, sessões de login, tokens de recuperação e sessão QR não são restaurados. Conversas e histórico de imóveis são preservados.
- Agendamentos só rodam com as respectivas flags do servidor; nenhum foi ativado no ambiente real. Se o processo estiver parado, a interface indica atraso ao voltar. MySQL requer autorização para criar/remover o esquema temporário de verificação. Falhas preservam o último resultado validado e não apagam dados de origem.

## Validação executada

- Build aprovado: 39 arquivos JavaScript verificados, sem novo framework.
- `npm test`: **81 testes aprovados**, incluindo novos testes de recuperação, histórico, limites MySQL de identificadores, contatos, permissões, métricas, consentimento, WhatsApp e backups.
- `node scripts/verify-team-ui.mjs`: Chrome 1440 × 1000 e viewport móvel 390 × 844. Acesso direto autenticado, saída confirmada/cancelada, falha de gravação, filtros preservados, fonte 140%, modo simplificado, árvore de acessibilidade, restauração de versão, rascunho incompleto, unificação, interação manual, venda explícita, desempenho/CSV, telas de serviço desativado, permissões, assinatura de webhook e cinco idiomas.
- Conversa QR no navegador: respostas HTTP interceptadas, sem provedor. Conferidos escape de texto, resposta incerta, atualização sem recarregar, preservação do texto em edição e ausência de repetição. Não houve conexão ou mensagem real.
- `node scripts/verify-photo-editor.mjs`: miniaturas, teclado, arrastar, toque sintetizado, upload interrompido/retentativa, limites, vertical/horizontal, principal, remoção/desfazer, cancelamento, fallback, sequência persistida no editor/anúncio/apresentação, conflitos e cinco idiomas.
- Testes QR com adaptador simulado: autorização, expiração do QR, cifra da sessão, recebimento duplicado, não lidas, vinculação ambígua, transferência, persistência entre instâncias, consentimento/recusa, envio incerto idempotente, limite diário, confirmações de entrega, revogação e reconexão controlada.
- Backup SQLite real em processos separados: criação criptografada, restauração em destino vazio, comparação de registros/fotos, histórico, conversas, exclusão de tokens e sessão QR, retenção e falha controlada. Fonte permaneceu intacta.
- Instalação npm: 170 pacotes auditados, zero vulnerabilidades reportadas naquela execução. Importação real de Baileys confirmou exports necessários, sem criar socket.
- `npm run test:mysql`: tentado; não iniciou porque `dockerDesktopLinuxEngine` não está disponível. Não foi declarado aprovado.
- Ajustados testes de agenda que dependiam do horário atual e falhavam atravessando a meia-noite. As regras de disponibilidade reais não foram afrouxadas.
- Capturas inspecionadas. Corrigidos transbordamento móvel de botão longo e contraste de rótulos. Evidências locais em `data/team-qa/` e `data/photo-qa/`, excluídas do pacote.

## Pendências externas e aceite

- Executar MySQL, incluindo restauração automatizada e novos dados. O contrato mantém SQLite/MySQL sem novas tabelas, mas isso não substitui a validação real do adaptador.
- Testar leitor de tela real e aparelhos físicos. Árvore de acessibilidade e viewport emulado não substituem esses testes.
- Configurar SMTP no ambiente e autorizar destinatário de teste antes de validar recebimento real da recuperação.
- Configurar conta Meta, credenciais, modelos aprovados, webhook público e destinatários consentidos; conferir preços vigentes e autorizar teste antes de qualquer envio.
- Para QR: autorizar conta de teste, confirmar suporte da hospedagem a processo persistente/WebSocket, escanear QR e testar conexão, respostas, reconexão e revogação reais. Nenhuma conta foi conectada nesta execução.
- Autorizar ativação do agendamento, confirmar volume persistente, capacidade, chaves guardadas fora dos backups e recuperação em infraestrutura real.
- Publicação e verificações de produção permanecem pendentes. Nenhum serviço foi contratado.

## Arquivos e pacote

Principais arquivos novos: `core/password-reset.mjs`, `property-history.mjs`, `team-workflows.mjs`, `performance.mjs`, `backup-verification.mjs`, `notification-copy.mjs`, `whatsapp.mjs`, `whatsapp-qr.mjs`, `whatsapp-qr-adapter.mjs`; `public/portal/property-page.js`, `completeness.js`, `team-ui.js`, `team-i18n.js`, `whatsapp-qr-ui.js`, `whatsapp-qr-i18n.js`; testes `team-workflows.test.mjs`, `whatsapp-qr.test.mjs`; verificadores `scripts/verify-team-ui.mjs` e `verify-backups.mjs`.

Integrações alteradas em `server.mjs`, `core/service.mjs`, `core/notifications.mjs`, `backup.mjs`, `build.mjs`, interface/estilos/idiomas, testes existentes, manifesto/lock e documentação. Cache atualizado para `20261015-7`. Os scripts temporários de alteração não fazem parte da entrega.

Pacote: `releases/confianza-hostinger-1.4.0-2026-10-15.zip`, acompanhado de SHA-256, gerado pelo procedimento existente `python scripts/package-release.py 2026-10-15`. Exclui bancos, dados de conversas, sessões, fotos privadas, `node_modules`, arquivos `.env` e credenciais. Pacotes anteriores preservados. Não há migração obrigatória de tabelas: novos registros utilizam o armazenamento JSON existente; faça backup operacional antes de uma futura publicação.
