# Entrega 1.2.0 — conclusão das pendências locais

Data: 15/10/2026. Complementa a entrega 1.1.0 e atualiza o checklist do plano apenas com evidências verificadas.

## Novas funções

**Compartilhamento de arquivo:** após salvar o PDF pela impressão do navegador, selecione o arquivo na preparação. A aplicação verifica assinatura PDF e limite de 20 MB, detecta `navigator.canShare({files})` e oferece o compartilhamento nativo. O arquivo compartilhado recebe o nome `ID-idioma.pdf`. Quando não há suporte, a interface mantém a orientação para salvar e anexar pelo aplicativo. O PDF selecionado não é enviado ao servidor. Cancelar o compartilhamento não registra envio nem evento comercial.

**Notificações do navegador:** novo menu Notificações para a equipe, com preferência individual e permissão do navegador. Administradores controlam ativação, pausa, destinatários de teste, fuso, faixa de horário, antecedência das visitas, limite diário e tentativas. A configuração inicial é **desativada**, em modo de teste. A escolha inicial deste canal dispensa provedor pago e credenciais externas; e-mail e WhatsApp automático não foram contratados ou ativados.

A fila persistente tem identificador determinístico para cada retorno/visita, comparação atômica e reserva por destinatário. Reagendamento, cancelamento, conclusão, desativação da conta e retirada de preferência invalidam avisos pendentes. Falhas usam códigos conhecidos sem incluir segredos. Há retentativas e limite diário, incluindo tentativas. O registro “Processada” significa que o navegador aceitou a solicitação de exibição; não comprova entrega ou leitura.

Os avisos automáticos são destinados ao responsável pelo retorno ou visita que habilitou a preferência, e contêm texto genérico sem nome ou telefone do cliente. A fila pode ser preparada no servidor; a apresentação do aviso depende de uma sessão do painel aberta. Não há Web Push para aparelhos desconectados. A API do navegador requer suporte e permissão em contexto seguro. [Referência técnica: Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API).

## Dados e backup

A migração é aditiva: tabela `notification_jobs`, criada no início da aplicação. Preferências, configuração e controle diário ficam em registros próprios da tabela `settings`. Usuários, imóveis, sessões e chaves existentes são preservados.

O backup inclui a fila e suas configurações. Também funciona antes da migração, quando `notification_jobs` ainda não existe. Backups antigos podem ser restaurados com a nova tabela vazia. O teste de compatibilidade conferiu a preservação byte a byte do registro do usuário e a descriptografia do MFA com a mesma chave.

Foi preparado `scripts/preflight-production.mjs`: confere explicitamente o nome esperado do banco, valida as chaves contra os segredos MFA existentes, faz backup criptografado e testa a restauração em outro banco vazio. Não altera registros de produção nem suas variáveis de ambiente. Deve ser executado no servidor com **o ambiente existente**, sem inventar ou substituir as chaves:

```powershell
node --env-file=.env scripts/preflight-production.mjs NOME_ESPERADO_DO_BANCO CAMINHO_DO_BACKUP BANCO_SEPARADO_DE_RESTAURACAO
```

Em hospedagem com variáveis injetadas diretamente no processo, omita `--env-file=.env` e use uma sessão que já receba essas variáveis. O banco separado precisa existir e estar vazio; o script não cria bancos nem muda permissões.

## Validação concluída

- Build e **46 testes**: segurança, permissões, concorrência, fila, retentativas, cancelamento, limites, PDF selecionado, backup e compatibilidade com a versão anterior.
- **MySQL Community 8.4.11**, em container isolado: **22 testes da API**, incluindo concorrência e notificações. Os dois testes específicos de SQLite foram substituídos por conferências equivalentes no MySQL: backup/restauração, registros e fotos idênticos, recuperação de MFA e execução completa do preflight. Nenhum dado de produção foi usado.
- **14 cenários de aceite** no Chrome: MFA, pendências, reagendamento entre Honolulu/UTC/São Paulo, visitas com fuso Tóquio, filtros e totais conhecidos, dois corretores, corretor sem telefone/desativado, quatro tipos de imóvel, teclado, janela bloqueada, cancelamento e nova tentativa, seleção de PDF, mensagem WhatsApp, igualdade entre prévia e impressão e aviso de teste pela API do navegador.
- Chrome e Edge: apresentações de uma, duas e **19 páginas**, cinco idiomas, imagens verticais/horizontais e indisponíveis; acentos e descrição alemã extensa; verificação de contato em todas as páginas e ausência de conteúdo excedendo a área da página.
- Capturas desktop e viewport móvel. Fluxos de WhatsApp e compartilhamento nativo foram testados com interceptação do destino, sem enviar mensagens a pessoas. A caixa nativa de compartilhamento e o WhatsApp instalado em aparelhos físicos ainda exigem conferência humana.
- Detector mecânico dos arquivos de interface alterados: nenhum apontamento.

Evidências em `data/acceptance-qa/`, `data/mysql-qa/` e `data/qa-results/`, excluídas do pacote. Comandos reproduzíveis:

```powershell
npm run build
npm test
npm run test:mysql
npm install --prefix data/qa-tools playwright
node scripts/verify-acceptance.mjs
node scripts/verify-browser.mjs
```

O teste MySQL requer Docker Desktop e usa a imagem oficial `mysql:8.4`. O container e os bancos fictícios são encerrados ao final.

## Conferência pública da instalação atual

O arquivo público `/portal/app.js?v=20261014-2` corresponde exatamente à fonte contida em `confianza-hostinger-1.0.3-2026-10-14.zip`. Isso identifica a versão da interface; a versão do backend e o deployment ativo ainda dependem da conta Hostinger.

SHA-256 do pacote de referência para reversão de código:

```text
c6fb8b6557a066783ca1ccd72a2c482a6feddce787bcfc7cef091cc2669833e2
```

As configurações públicas retornaram nome Confianza, subtítulo Imóveis & Terras, WhatsApp `595981361122`, modo demonstrativo ativo e telefone, e-mail e endereço vazios. Há três anúncios públicos. O QR gerado localmente pela 1.2.0 foi decodificado e abriu o anúncio correto no domínio real com HTTP 200; isso não significa que o endpoint novo esteja publicado. Nenhum desses dados foi alterado. A omissão dos contatos vazios no material é deliberada; os dados reais devem ser cadastrados pela imobiliária.

## Pendências que dependem de acesso ou ação humana

1. A consulta do conector Hostinger terminou com `timed out awaiting tools/call after 300s`. Sem os dados da conta, não foi possível confirmar o banco e o deployment de produção, realizar o backup real, publicar em staging/produção, conferir logs ou remover variáveis do hPanel. O novo pacote ainda **não está publicado**.
2. Depois de obter acesso, executar o preflight no banco correto e restaurar em banco separado; remover `BOOTSTRAP_ADMIN_PASSWORD` e a senha inicial pelo hPanel preservando todas as demais variáveis. A API de variáveis substitui o conjunto completo e devolve valores mascarados, portanto esses valores nunca devem ser reutilizados para salvar a configuração.
3. A troca da senha compartilhada e o cadastro do autenticador de produção precisam ser concluídos pelo titular do acesso. Testes locais de recuperação e MFA não substituem esse cadastro.
4. Publicar em staging, conferir inicialização/logs e repetir o aceite com MySQL da hospedagem antes de publicar em produção. Verificar site real, login, MFA, fotos, formulário, material e notificações após publicar.
5. Ler QR impresso em Android e iPhone e testar os aplicativos reais de compartilhamento. O ambiente atual oferece emulação de viewport, sem acesso a aparelhos físicos ou impressora.

As tarefas condicionais de download direto/renderizador no servidor foram resolvidas mantendo o fluxo de impressão, explicitamente permitido pelo plano. Não há renderizador de PDF no servidor nem requisição de imagens externas pelo backend; as restrições específicas desse renderizador não se aplicam a esta implementação.

Para reversão, preservar um backup recente e trocar somente o código primeiro. A 1.0.3 não conhece perfis públicos nem notificações; alterações de usuários por essa versão podem descartar campos novos. A 1.1.0 é uma alternativa de reversão que preserva perfis públicos. Não restaurar backup antigo sobre alterações recentes sem plano e conferência específicos.
