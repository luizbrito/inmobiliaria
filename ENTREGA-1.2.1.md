# Entrega 1.2.1 — e-mail primeiro, WhatsApp depois

Preferência do usuário: iniciar as notificações por **e-mail** e acrescentar **WhatsApp na próxima etapa**. A entrega 1.2.1 ajusta a opção inicial e mantém o navegador como alternativa.

## Implementação

- Canal e-mail na fila existente de retornos e visitas, com consentimento por conta da equipe e destinatário obtido do e-mail dessa conta.
- Processamento no servidor a cada minuto; não depende de o painel estar aberto. Mantém modo de teste, faixa de horário, fuso, limite diário, reserva atômica, prazo de validade e cancelamento por alteração da origem.
- SMTP com Nodemailer, TLS obrigatório e validação do certificado. Credenciais ficam somente em variáveis do servidor. Configuração e ativação são verificadas sem devolver senhas ou usuário SMTP à interface.
- Verificação da conexão SMTP no painel administrativo, sem enviar mensagem. Isso testa conexão e autenticação; a aceitação do remetente só pode ser confirmada em um envio autorizado. [Referência: transporte SMTP do Nodemailer](https://nodemailer.com/smtp).
- Registro **Aceita pelo SMTP** após o provedor aceitar o destinatário. Isso não comprova entrega nem leitura. Erros seguros de conexão permitem retentativa; autenticação/rejeição interrompem a tentativa. Falha ambígua após o início do envio e reserva expirada ficam em **Resultado incerto**, sem reenvio automático, para evitar duplicação.
- Identificador estável na fila e no cabeçalho Message-ID. SMTP não oferece garantia universal de envio exatamente uma vez; por isso o estado incerto exige conferência com o provedor.
- E-mails com texto genérico e link para o painel, sem nomes ou telefones de clientes. Sem anexos, acesso a arquivos ou download de URLs pelo transporte.
- Configurações antigas de navegador são preservadas; novos cadastros administrativos começam com e-mail selecionado e processamento desativado. WhatsApp aparece como **próxima etapa**, sem envio, contratação ou credenciais.

## Configuração pendente

Provedor confirmado pelo usuário: **Hostinger Email**. O modelo foi ajustado para `smtp.hostinger.com`, porta `465`, com TLS desde a conexão, conforme a [documentação oficial da Hostinger](https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/). Ainda faltam o remetente e o destinatário de teste. A senha não deve ser fornecida pelo chat nem colocada no código. No ambiente do servidor:

```dotenv
EMAIL_NOTIFICATIONS_ENABLED=false
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=endereco-completo-da-conta-hostinger
SMTP_PASSWORD=senha-ou-credencial-configurada-no-servidor
SMTP_FROM=remetente@seu-dominio
``` 


`SMTP_SECURE=false` exige STARTTLS. Para TLS desde a conexão, use o host e porta indicados pelo provedor e `SMTP_SECURE=true` (normalmente 465). Não desative a validação de certificado.

Após confirmar conta/custos e autorizar o teste, libere `EMAIL_NOTIFICATIONS_ENABLED=true` no servidor. Cada destinatário deve habilitar a preferência de e-mail. No painel, selecione E-mail, modo de teste, membros autorizados e horário permitido; verifique a conexão e só então adicione o aviso de teste. O envio real ainda não foi executado.

## Validação

Build e **52 testes aprovados**, **22 testes da API no MySQL 8.4.11** e **15 cenários de aceite no navegador**, incluindo testes do envio com transporte simulado: aceitação SMTP, consentimento, pausa, limite, concorrência, isolamento do navegador, erro de autenticação, retentativa segura, resultado incerto, bloqueio de destinatário inválido e proteção contra vazamento de credenciais.

Os testes não utilizaram uma conta externa nem enviaram e-mails a pessoas. As evidências e limitações de MySQL/produção da [entrega 1.2.0](ENTREGA-1.2.0.md) continuam registradas. O teste MySQL executa também o contrato atualizado das preferências e fila; a aceitação de e-mail pelo provedor real depende da configuração acima.

Pacote: `releases/confianza-hostinger-1.2.1-2026-10-15.zip`. Publicação na Hostinger ainda pendente do acesso operacional e do preflight de produção. Notificações reais permanecem desativadas por padrão.
