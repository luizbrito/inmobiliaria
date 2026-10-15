# Preparação do administrador sem SSH — versão 1.0.2

1. Publique o pacote 1.0.2 na aplicação Node.js existente.
2. No hPanel, adicione BOOTSTRAP_ADMIN_PASSWORD com a senha administrativa escolhida (12 a 200 caracteres). Preserve as variáveis existentes do banco e MFA_ENCRYPTION_KEY.
3. Reinicie a aplicação. Na primeira inicialização com essa variável, a conta luizbritodarosa@gmail.com é criada ou, se já for administradora, tem a senha redefinida, é reativada e tem o MFA anterior removido. As sessões dessa conta são revogadas e a operação é auditada. Uma conta existente de outro perfil não é promovida automaticamente.
4. Remova BOOTSTRAP_ADMIN_PASSWORD do painel após a inicialização bem-sucedida. Entre em /admin com o e-mail acima e a senha escolhida. Cadastre o autenticador pelo QR Code e confirme com o código de seis dígitos.

Um marcador transacional no banco impede repetir a preparação nos próximos reinícios, mesmo se a variável não tiver sido removida. Não apague o marcador bootstrap-luiz-admin-v1 da tabela settings. Outros usuários e seus fatores são preservados. Não há senha embutida no código ou no ZIP. Em caso de recuperação futura, utilize os scripts operacionais documentados em RECUPERACAO-SSH.md.

Validação: build e 28 testes passaram localmente, incluindo criação, recuperação, revogação de sessões e preservação do MFA após reinício. Integração com o MySQL real depende da implantação na Hostinger.
