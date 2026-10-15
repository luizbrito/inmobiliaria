# Recuperação administrativa na Hostinger

“Credenciais inválidas” no envio de e-mail e senha ocorre antes do MFA. A inclusão do MFA não altera senhas existentes. ADMIN_PASSWORD só cria o primeiro usuário e não redefine contas existentes.

Pare a aplicação no hPanel antes de recuperar. No SSH:

```bash
cd ~/domains/inmobiliaria.confianzagsa.com/hbuilds/current/nodejs
/opt/alt/alt-nodejs24/root/usr/bin/node --version
```

Use as variáveis do banco da aplicação. Variáveis do hPanel podem não estar disponíveis no SSH. Se usar um arquivo .env privado, mantenha permissões 600 e não inclua esse arquivo no pacote. Não copie .env.example como configuração real. Para MySQL local na Hostinger, use MYSQL_HOST=127.0.0.1, MYSQL_PORT=3306 e os valores reais de MYSQL_DATABASE, MYSQL_USER e MYSQL_PASSWORD. Para SQLite, configure DB_DRIVER=sqlite e DB_PATH apontando para o arquivo existente; não use um banco novo.

Informe a nova senha sem mostrá-la nem gravá-la no histórico:

```bash
read -r -s -p 'Nova senha (12 a 200 caracteres): ' RECOVERY_PASSWORD
printf '\n'
export RECOVERY_PASSWORD
/opt/alt/alt-nodejs24/root/usr/bin/node recover-password.mjs luizbritodarosa@gmail.com
unset RECOVERY_PASSWORD
```

Se as variáveis do banco estiverem em .env, substitua a chamada por:

```bash
/opt/alt/alt-nodejs24/root/usr/bin/node --env-file=.env recover-password.mjs luizbritodarosa@gmail.com
```

O script altera somente um administrador ativo existente, preserva seu MFA, revoga suas sessões e registra a recuperação na auditoria. Não imprime a senha nem cria contas. Reinicie a aplicação e entre com a nova senha. Se não houver MFA cadastrado, o login exibirá o QR Code para cadastrar.

Somente se precisar recuperar também um autenticador perdido, com a aplicação parada e o mesmo ambiente de banco, execute recover-mfa.mjs com esse e-mail. Preserve MFA_ENCRYPTION_KEY existente; substituir a chave impede decifrar fatores já cadastrados.

O pacote não redefine senhas automaticamente ao ser implantado. O operador deve executar a recuperação após atualizar o código. Dados e segredos de produção não são incluídos no ZIP.
