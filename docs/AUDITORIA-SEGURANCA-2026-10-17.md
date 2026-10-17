# Auditoria de segurança — inmobiliaria.confianzagsa.com

Data: 17/10/2026. Escopo: código desta aplicação Node.js/Express, seus módulos de autenticação, catálogo, contatos, visitas, mídia, notificações, WhatsApp, backup e interface; observação não invasiva do site publicado e do painel de segurança da Hostinger. Esta revisão não foi um teste de invasão da produção nem incluiu acesso ao banco, às variáveis privadas ou às contas administrativas da aplicação.

## Resultado principal

- **Correção necessária no catálogo (prioridade alta para a próxima implantação):** os campos `tag` e `unit` de um imóvel eram inseridos em HTML no navegador sem escape em cards e detalhes. Um editor autenticado com acesso à API podia gravar marcação nesses campos. A CSP atual restringe scripts inline, mas marcação injetada ainda pode alterar o conteúdo exibido e abre margem para exploração se outra proteção falhar. A revisão `1.5.0-rc.2` aplica escape na saída, inclusive para registros legados, e valida os campos no servidor. Não há evidência de exploração ou de registros maliciosos na produção.
- **Proteção por IP dependente do proxy (prioridade média):** login, MFA, recuperação de senha e leads usam `req.ip`, enquanto Express confia em um salto de proxy. A eficácia contra cabeçalhos `X-Forwarded-For` forjados depende da configuração e da sanitização feita pela borda da Hostinger, que não foi observável nesta revisão. Os limites também residem na memória de cada processo. Confirmar a cadeia de proxy e usar um armazenamento compartilhado caso a aplicação escale para múltiplas instâncias.
- **Controles operacionais a confirmar:** verificar na instalação real quais administradores têm MFA exigido e cadastrado, se o backup da hospedagem é restaurável, e se as chaves e o MySQL persistem corretamente após reimplantação. Os testes locais não comprovam essas condições da produção.

## Evidência da produção

O painel Hostinger mostra a implantação atual do arquivo `confianza-hostinger-1.5.0-rc.1-2026-10-16.zip` concluída em 16/10/2026 às 23:54, com Node 24. O registro de instalação relata 170 pacotes auditados e **zero vulnerabilidades conhecidas**. A página de vulnerabilidades informa **nenhuma vulnerabilidade encontrada**, escaneada em 16/10/2026 às 23:54. O certificado **Lifetime SSL** do subdomínio aparece **ativo**. O detector de malware informa **nenhum malware encontrado nos últimos 30 dias**. O navegador carregou a página inicial, a busca, os cards e os links da aplicação em HTTPS.

Esses scanners não analisam todos os caminhos da lógica de negócio e não provam ausência de falhas. Não foram feitas tentativas de exploração, carga, força bruta, envio de mensagens, alteração de dados nem acesso a conteúdo de clientes na produção.

Na lista de variáveis de ambiente exibida pela Hostinger, `ADMIN_PASSWORD` e `BOOTSTRAP_ADMIN_PASSWORD` ainda estavam configuradas. O código usa essas senhas apenas na preparação de administrador e orienta sua retirada após o cadastro; confirme primeiro que a conta administrativa e o MFA funcionam, então remova as duas do painel. A mesma lista não mostrou `BACKUP_ENCRYPTION_KEY` nem `BACKUP_AUTOMATION_ENABLED`, portanto não há evidência de backup automático **da própria aplicação**. O painel de backups **da hospedagem** indica cópias diárias de arquivos e permite selecionar o banco MySQL desta aplicação no snapshot de 16/10/2026 às 20:33; a restauração não foi testada. O painel de ambiente também mostrou `SMTP_SECURE` com valor em maiúsculas; o validador do módulo aceita somente `true` ou `false` em minúsculas, fazendo a configuração de e-mail falhar de forma segura até ser corrigida. Este relatório não registra valores de senhas, chaves ou outras credenciais.

## Revisão dos módulos

| Área | Evidência e resultado |
| --- | --- |
| Login, sessões e MFA | Senhas derivadas com `scrypt` e salt; cookie `HttpOnly`, `SameSite=Strict` e `Secure` sob HTTPS; tokens de sessão opacos com hash no banco; TOTP com proteção contra reutilização. Testes locais cobrem negação de credenciais, sessão pendente sem acesso, replay e revogação. MFA pode ser desativado por administrador para contas específicas, portanto a política efetiva deve ser conferida em produção. |
| API e permissões | Escritas exigem `Origin` igual a `PUBLIC_ORIGIN`; rotas administrativas verificam sessão e papel no servidor; anúncios não publicados e comissões não saem nas respostas públicas. Os testes locais exercitam acessos anônimos, editor/corretor, alterações concorrentes e bloqueio de origem. |
| Catálogo e frontend | HTML do servidor escapa títulos, descrições, localização e metadados. A auditoria encontrou os dois campos sem escape mencionados acima. A correção cobre dados antigos no renderizador e entradas novas no validador. |
| Fotos | Upload exige editor ou administrador, limita tamanho, verifica o formato por decodificação com Sharp, redimensiona e regrava em WebP; chaves de mídia são UUIDs e o caminho é validado. Testes locais cobrem acesso anônimo, bytes inválidos e imagem truncada. URLs de imagem externas escolhidas por editor não passam pelo processamento local. |
| Contatos e visitas | Leads públicos exigem consentimento e têm limite por IP; consultas e gestão exigem equipe autenticada. A agenda verifica conflitos e revisões no servidor. Os testes locais cobrem isolamento, consentimento e concorrência. |
| E-mail, WhatsApp e QR | Envio depende de configuração, consentimento e modos de teste; webhook da Meta verifica assinatura; QR protege credenciais criptografadas e acesso a conversas. Testes locais cobrem assinatura, destinatários, deduplicação, revogação e resultados incertos. Nenhum envio real foi feito nesta auditoria. |
| Backup e restauração | Arquivos de backup da aplicação são criptografados; a restauração local rejeita destino ocupado e compara registros e fotos. A Hostinger indica backup diário e um snapshot selecionável do MySQL usado pelo aplicativo. A restauração isolada desse snapshot permanece sem verificação. |
| Dependências e hospedagem | O scanner da implantação Hostinger indicou zero vulnerabilidades conhecidas para o pacote Node publicado. O `npm audit` local não concluiu por indisponibilidade do registro npm neste ambiente; o resultado da Hostinger é a evidência externa disponível. |

## Ações para implantação da correção

1. Homologar `1.5.0-rc.2` em uma aplicação isolada, preservando banco e variáveis de produção. O pacote não requer migração de esquema nem nova chave.
2. Conferir a instalação e o backup existente, testar restauração em destino separado e manter a versão `1.5.0-rc.1` para rollback.
3. Publicar a revisão de código; verificar home, detalhe, login/MFA, edição de imóvel, lead de teste autorizado e fotos. Confirmar o escaneamento da Hostinger após a nova implantação.
4. Revisar a cadeia de proxy e a exigência de MFA de todas as contas administrativas. Registrar evidências do backup e da restauração.

## Observação fora do escopo solicitado

O domínio corporativo `confianzagsa.com` usa outra instalação, WordPress. No painel Hostinger, em 17/10/2026, as versões ativas Elementor 3.6.5, WPForms Lite 1.6.7, All in One SEO 4.5.5, Really Simple SSL 7.2.2 e Jetpack 13.0.2 apareceram com **“Problema de vulnerabilidade”**. Essa instalação não é o aplicativo Node do subdomínio auditado e não foi alterada. Ela merece revisão própria e atualização controlada com backup e teste de compatibilidade.
