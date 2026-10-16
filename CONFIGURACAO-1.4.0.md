# Configuração e operação — 1.4.0

Nenhuma configuração real foi aplicada. Defina segredos pelo ambiente da hospedagem/serviço, nunca em código, no chat ou no ZIP. A ativação e os testes com contas/destinatários reais precisam de autorização.

## Recuperação SMTP

Reutiliza `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` e `SMTP_FROM`. Para Hostinger Email: `smtp.hostinger.com`, porta `465`, TLS (`SMTP_SECURE=true`), conforme a [configuração oficial](https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/). Verifique o remetente permitido na conta.

- `PASSWORD_RESET_ENABLED`: `false` até autorizar. A recuperação é independente de `EMAIL_NOTIFICATIONS_ENABLED`.
- `PASSWORD_RESET_TEST_MODE`: padrão `true`; mantenha no primeiro teste.
- `PASSWORD_RESET_TEST_EMAILS`: destinatários de teste expressamente autorizados, separados por vírgula. E-mails fora dessa lista não recebem no modo de teste.
- `PUBLIC_ORIGIN`: origem pública exata, HTTPS em produção, sem caminho ou credenciais.

No login, escolha Esqueci minha senha. A resposta não confirma cadastro nem disponibilidade do transporte. O link dura 15 minutos; pedir outro substitui o anterior. Uma falha de envio invalida aquele token. A senha precisa de 12 a 200 caracteres. MFA permanece conforme a conta. Tokens não entram nos backups; a troca revoga sessões existentes.

## Lembretes oficiais por WhatsApp

Provedor implementado: **Meta Cloud API**. Referências: [documentação mantida pela Meta no Postman](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api) e [documentação de mensagens da Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/template-messages).

Variáveis obrigatórias: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` (formato `vNN.N` correspondente à conta), `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TEMPLATE_PT`, `WHATSAPP_TEMPLATE_ES`, `WHATSAPP_TEMPLATE_EN`, `WHATSAPP_TEMPLATE_IT`, `WHATSAPP_TEMPLATE_DE` e `PUBLIC_ORIGIN`.

Modelos devem existir e estar aprovados na Meta, com três parâmetros de corpo: título do aviso, orientação e URL do painel. Idiomas enviados: `pt_BR`, `es`, `en_US`, `it`, `de`. Nomes de modelos não foram inventados nem criados nesta execução.

- `WHATSAPP_ENABLED=false` por padrão: sem chamadas ao provedor.
- `WHATSAPP_DRY_RUN=true` por padrão: mesmo habilitado/configurado, conclui como simulação e não faz requisição de envio.
- `WHATSAPP_TEST_NUMBERS`: números internacionais de teste autorizados, somente dígitos, separados por vírgula. O modo de teste exige também os usuários escolhidos no painel.
- Em Notificações, cada usuário registra seu telefone, preferência e consentimento. Pode desmarcar ou responder STOP para cancelar.
- Administrador escolhe canal, destinatários de teste, fuso, janela diária, antecedência e limites. Não ative operação real antes da validação/autorização.
- Webhook público: `/api/whatsapp/webhook`. GET valida o token configurado; POST exige `X-Hub-Signature-256` com HMAC do corpo original e segredo do aplicativo. Não usa sessão de usuário; sua exceção de Origin é limitada a esta rota assinada.
- Aceitação HTTP pelo provedor, envio, entrega e leitura são estados distintos. Timeout ou falha ambígua não é repetido automaticamente. Eventos fora de ordem são reconciliados; dados temporários de eventos são retidos por até três dias, com limpeza diária.

Custos dependem da conta, país, categoria e política vigente da Meta. Consulte os [preços oficiais](https://developers.facebook.com/docs/whatsapp/pricing) antes de ativar. Não foi estimado preço, contratado provedor ou enviado teste real.

## Atendimento manual com QR Code

Foi escolhido [Baileys](https://github.com/WhiskeySockets/Baileys), que usa WhatsApp Web, sem navegador Chromium. **Não é integração oficial da Meta**, e a conexão pode quebrar ou sofrer restrição. A versão opcional fixada é `7.0.0-rc14`; os testes locais não equivalem a homologação com conta real. Base de implementação da sessão: [documentação de conexão](https://github.com/WhiskeySockets/baileys.wiki-site/blob/main/docs/socket/connecting.md). A implementação não usa arquivos de autenticação em texto aberto.

Instalação normal: `npm ci` com dependências opcionais. Se foram omitidas, instale a versão fixada do manifesto antes de ativar. Node.js 24 já é requisito do aplicativo. A importação do pacote foi conferida neste computador sem abrir conexão.

- `WHATSAPP_QR_ENABLED=false`: padrão; bloqueia conectar/resumir.
- `WHATSAPP_QR_SEND_ENABLED=false`: padrão; bloqueia respostas mesmo que a conexão tenha sido autorizada.
- `WHATSAPP_QR_ENCRYPTION_KEY`: chave própria de 32 bytes, representada por 64 dígitos hexadecimais. Gere no servidor/gerenciador de segredos e conserve protegida; não reutilize chave de MFA ou backup.

Com autorização para teste: configure flags/chave, abra Conversas por WhatsApp como administrador, mantenha modo de teste, cadastre números autorizados e a equipe permitida, salve e escolha Conectar. Só o administrador vê a prévia do QR. Códigos novos substituem os anteriores; a prévia local é descartada em até 60 segundos, sem garantir validade adicional no WhatsApp.

Ao receber uma mensagem, o telefone é comparado aos interessados. Uma correspondência é vinculada automaticamente; múltiplas exigem revisão manual. Conversas não atribuídas são acessíveis à equipe autorizada; atribuídas só ao responsável e administradores. Transfira o atendimento pelo formulário. Consentimento para responder precisa estar registrado. STOP bloqueia respostas; START/VOLTAR/INICIAR recebidos permitem nova autorização. Não há envio em massa ou resposta automática.

Limites: 20 respostas por conta/dia por padrão, de 1 a 50 na configuração; até 2000 caracteres por resposta; 100 mensagens por página, com histórico anterior; somente texto. Conteúdo não textual é identificado, sem baixar anexos. As não lidas são locais ao painel; ler no painel não dispara confirmação externa de leitura.

Cada resposta registra o usuário autenticado. Eventos observados no provedor atualizam estados, sem transformar uma submissão em entrega. Falha ambígua permanece incerta e não é reenviada. Se houver erro de rede, consulte o histórico antes de criar outra resposta. Mensagens recebidas/eco e tentativas do mesmo cliente são deduplicadas.

Sessão é criptografada no banco; há lease para impedir dois processos de abrir a mesma sessão. Reconexão é limitada a cinco tentativas com espera progressiva. Reinício reaproveita a sessão somente quando o serviço já está habilitado e há autenticação válida. Desconectar e revogar apaga autenticação local e tenta logout remoto; se não houver confirmação, remova o dispositivo em Aparelhos conectados no celular. Histórico permanece.

Hospedagem: precisa de processo Node persistente, saída WebSocket, banco/volume persistente e gerenciamento de segredos. Não foi conferido o plano real da Hostinger. Se ele não oferecer esses requisitos, use uma instância Node/VPS separada e faça o proxy da rota `/api/whatsapp-qr/*` para a instância proprietária, no mesmo domínio/origem pública. Ela deve compartilhar MySQL, sessões e chaves necessárias com o aplicativo; mantenha notificações e backups desabilitados nessa réplica. Confirme suporte ao proxy antes de adotar essa arquitetura. A alternativa simples é hospedar todo o backend no serviço persistente autorizado. Nada disso foi provisionado.

O adaptador é separado de registros, responsáveis e vínculos, permitindo futura troca de transporte. O módulo oficial de lembretes permanece independente; QR Code não foi apresentado como substituto oficial da Cloud API.

## Histórico, contatos e desempenho

Histórico mantém até 100 versões por imóvel. Recuperação restaura dados públicos e política de visitas como nova revisão, mantendo comissões/pagamentos atuais. Fotos não são removidas automaticamente. Histórico e conversas entram no backup; não elimine arquivos referenciados sem revisão.

Organizar contatos preserva o original arquivado e transfere visitas e vínculos de conversas atomicamente. O administrador define de 1 a 365 dias para inatividade (padrão sete). Último atendimento usa interações manuais ou início do atendimento, não simples alteração de lembrete. Recados são anotações, sem comprovar envio externo. Venda exige registro explícito no formulário de interação.

Para medir consultas, configure `ANALYTICS_HASH_KEY` com segredo próprio e estável, fora do código. Sem isso, a medição não coleta eventos. Retenção de 90 dias, limpeza diária, deduplicação por imóvel/dia e exclusão da equipe autenticada/robôs conhecidos. Não há contagem retroativa nem garantia contra agentes automatizados que se apresentem como navegadores comuns. Períodos e conversão estão definidos na tela e na entrega. CSV protege contra fórmulas.

## Backups e verificação periódica

Sem ativação real nesta execução. Configuração:

- `BACKUP_AUTOMATION_ENABLED=false` até autorização.
- `BACKUP_DIR`: diretório persistente, privado, fora de `public`/`ASSET_ROOT`.
- `BACKUP_ENCRYPTION_KEY`: preservar a chave já existente, protegida fora dos arquivos de backup.
- `BACKUP_INTERVAL_HOURS`: padrão 24, de 1 a 720.
- `BACKUP_RETENTION_COUNT`: padrão sete, de 2 a 365 arquivos gerados pela rotina.
- `BACKUP_MAX_BYTES`: padrão 1073741824. Preserva pelo menos duas cópias durante a retenção e sinaliza orçamento insuficiente.

O servidor verifica a agenda a cada minuto e usa um lock para evitar execução simultânea. Há checagem de pelo menos 50 MiB livres antes da operação. Mantém estado em `status.json` no diretório privado. A interface administrativa diferencia criação de restauração validada e alerta sobre atraso superior a duas vezes o intervalo, ausência ou falha. Alertas requerem canal habilitado e preferência do administrador; são limitados a um por dia/destinatário.

Para execução operacional autorizada: `node --env-file=.env scripts/verify-backups.mjs --force`. O comando continua respeitando `BACKUP_AUTOMATION_ENABLED`. Também pode ser chamado por um agendador externo, com o mesmo ambiente protegido. Nenhum agendador da hospedagem foi criado.

SQLite restaura em pasta temporária nova, nunca no `DB_PATH`/`UPLOAD_DIR` de origem. MySQL cria um esquema aleatório `confianza_verify_...`, valida o nome, restaura ali e remove apenas o esquema que acabou de criar. O usuário de verificação precisa dessas permissões; sem elas o teste falha e não é declarado válido. Não aponte uma restauração manual ao banco de produção.

O procedimento confere todos os registros previstos e bytes de fotos. Tokens de recuperação e autenticação QR são excluídos; sessões de login não voltam. Uma recuperação de desastre exige entrar novamente e reconectar WhatsApp por QR, conservando o histórico de conversas. Guarde as chaves de MFA, backup e sessão QR separadamente em armazenamento seguro. Falha de limpeza é reportada e requer revisão operacional do destino temporário, sem apagar a origem.

Antes de considerar a operação pronta: validar MySQL, restauração em infraestrutura isolada, alertas com destinatário autorizado, capacidade/retenção, persistência após reinício e procedimento de recuperação completo. Publicação exige autorização separada.
