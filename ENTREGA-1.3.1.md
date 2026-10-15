# Entrega 1.3.1 — MFA por usuário

O campo booleano `mfaRequired` permite exigir ou dispensar MFA individualmente. Em **Equipe > Editar usuário**, desmarque **Exigir MFA** para permitir acesso com e-mail e senha. Apenas administradores podem alterar essa opção.

Contas existentes sem o campo mantêm o comportamento anterior: MFA obrigatório para administradores, opcional para editores e corretores. Novos administradores recebem a exigência por padrão; o administrador pode definir uma exceção. O bootstrap operacional exige novo cadastro de MFA.

Alterar a exigência invalida as sessões da conta, incluindo desafios pendentes, e registra a mudança na auditoria. O segredo criptografado do autenticador é preservado para reativação futura. Ao alterar a própria exigência, o administrador precisa entrar novamente. Não é necessária migração de tabelas: o campo integra o registro JSON existente e os backups.

Nenhuma conta de produção foi alterada. A opção ficará disponível após publicar esta versão na hospedagem.

Validação local: 60 testes passaram, incluindo login sem MFA para conta dispensada, exigência para corretor, revogação de sessões autenticadas e desafios pendentes, alteração da própria conta, validação do campo booleano, controle de permissões e preservação do autenticador. Integração com SQLite; MySQL e publicação permanecem pendentes.
