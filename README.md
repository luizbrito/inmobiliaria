# Confianza — portal imobiliário e administração

Versão **1.5.0-rc.3**. [Ajustes de interface](ENTREGA-1.5.0-rc.3-INTERFACE.md) e [upload](UPLOAD-1.5.0-rc.3.md). [Revisão de segurança](ENTREGA-1.5.0-rc.2-SEGURANCA.md), [auditoria](docs/AUDITORIA-SEGURANCA-2026-10-17.md) e [upload da correção](UPLOAD-1.5.0-rc.2.md). [Release para upload e homologação](ENTREGA-1.5.0-rc.1.md). [Instruções de upload](UPLOAD-1.5.0-rc.1.md). [Plano de UX, SEO e conversão](docs/PLANO-UX-SEO-CRO.md). [Editor em página dedicada, acessibilidade, recuperação, histórico, contatos, desempenho, backups e WhatsApp opcional](ENTREGA-1.4.0.md). [Configuração e operação](CONFIGURACAO-1.4.0.md). [MFA configurável por usuário](ENTREGA-1.3.1.md). [Editor visual de fotos e validação local](ENTREGA-1.3.0.md). [E-mail como etapa inicial, WhatsApp como próxima etapa](ENTREGA-1.2.1.md), com envio desativado até configurar o provedor. A [entrega 1.2.0](ENTREGA-1.2.0.md) registra compartilhamento de PDF, alternativa de navegador, validação MySQL e pendências de produção. A entrega [1.1.0](ENTREGA-1.1.0.md) introduziu apresentações com galeria e QR, perfis públicos, pendências, visitas e relatórios. A versão atual ainda depende das verificações e da publicação na hospedagem.

Frontend leve em HTML, CSS e JavaScript nativo. Backend Express em Node.js 24. Banco principal MySQL/MariaDB, com fotos persistidas no próprio banco. Express, mysql2, sharp e qrcode são as dependências de produção. SQLite é uma alternativa para desenvolvimento em Node.js 24.

## Funcionalidades entregues

- Página inicial inspirada nas referências, imóveis urbanos, propriedades rurais e regiões.
- Busca por localização, tipo, finalidade, preço e área; ordenação e favoritos por dispositivo.
- Detalhes, galeria, mapa por localização/coordenadas, características, solo, clima e comparação de fazendas.
- Contato, solicitação de visita e interesse em anunciar, com consentimento e armazenamento no banco.
- Painel com indicadores calculados a partir dos registros, edição de imóveis, fotos e contatos por etapa.
- Usuários por equipe, com administrador, editor de imóveis e corretor.
- Português, espanhol, italiano, inglês e alemão no site e painel. Títulos, descrições e características traduzíveis por imóvel; fallback explícito ao original.
- Exportação CSV de imóveis e contatos; apresentação imprimível com opção de salvar em PDF pelo navegador.
- WhatsApp abre a conversa quando o número real é cadastrado nas configurações.

Os seis imóveis e suas fotos iniciais são demonstrativos. Não foram importados registros nem usuários da instalação atual. O aviso pode ser retirado nas configurações depois da substituição por dados reais.

## Implantação na Hostinger

Este pacote é independente do runtime do Sites. Selecione a modalidade de aplicação Node.js/Express oferecida pelo seu plano; não precisa executar o build Vinext/Next.js.

1. Crie um banco MySQL/MariaDB e um usuário exclusivo, ou use um banco externo acessível à aplicação. Anote o **hostname completo informado pelo painel**: não presuma `localhost`.
2. Envie este pacote completo para uma nova aplicação Node.js, mantendo `package.json`, `package-lock.json`, `server.mjs`, `core/` e `public/` na raiz do projeto.
3. Escolha Node.js **24.x**, gerenciador **npm**, comando de instalação `npm ci`, build `npm run build` e início `npm start`. Se o painel solicitar arquivo de entrada, use `server.mjs`.
4. Configure as variáveis abaixo no painel. Não coloque senhas no código ou no frontend.
5. A aplicação usa `process.env.PORT`; mantenha a porta injetada pela plataforma. O servidor escuta em `0.0.0.0`.
6. No primeiro início, as tabelas são criadas e o administrador inicial é cadastrado. São necessárias permissões de criação e leitura/escrita no banco escolhido.
7. Abra `/admin`, entre com o administrador inicial e cadastre o segundo fator no aplicativo autenticador antes de compartilhar a aplicação. Depois, cadastre a equipe e os contatos reais da imobiliária.
8. Depois de validar o novo aplicativo no endereço temporário, conecte `inmobiliaria.confianzagsa.com` e ajuste `PUBLIC_ORIGIN` para a URL final exata, sem barra no fim. Teste login, fotos, formulário de contato e manutenção do catálogo antes da troca.

Variáveis obrigatórias de produção:

```dotenv
NODE_ENV=production
PUBLIC_ORIGIN=https://inmobiliaria.confianzagsa.com
DB_DRIVER=mysql
MYSQL_HOST=hostname-fornecido-pelo-banco
MYSQL_PORT=3306
MYSQL_DATABASE=nome-do-banco
MYSQL_USER=usuario-exclusivo
MYSQL_PASSWORD=senha-do-banco
ADMIN_EMAIL=email-do-administrador
ADMIN_NAME=Nome do administrador
ADMIN_PASSWORD=senha-unica-com-pelo-menos-12-caracteres
MFA_ENCRYPTION_KEY=chave-aleatoria-de-64-caracteres-hexadecimais
BACKUP_ENCRYPTION_KEY=outra-chave-aleatoria-de-64-caracteres-hexadecimais
SEED_DEMO=true
```

`ADMIN_EMAIL`, `ADMIN_NAME` e `ADMIN_PASSWORD` são usados **apenas quando não existe usuário**. Alterações posteriores de senha e usuários são feitas em Equipe. Remova `ADMIN_PASSWORD` das variáveis depois do primeiro cadastro bem-sucedido. Alterar essa variável não reseta uma senha existente.

`MYSQL_SSL=true` habilita TLS com validação de certificado quando seu banco exige e oferece suporte. Para domínio temporário, use esse domínio em `PUBLIC_ORIGIN`. Em produção, use HTTPS para cookies seguros.

Para iniciar sem imóveis demonstrativos em um banco novo, use `SEED_DEMO=false`; depois desmarque o aviso demonstrativo nas configurações. As fotos enviadas no modo MySQL ficam na tabela `image_files`, portanto não dependem da persistência de uma pasta de uploads durante redeploy. A configuração de MySQL e a conectividade reais precisam ser validadas na sua conta; não há acesso à sua Hostinger neste trabalho.

## Permissões

| Perfil | Imóveis | Contatos | Equipe | Configurações |
| --- | --- | --- | --- | --- |
| Administrador | Consultar, criar, editar, excluir, enviar fotos | Consultar e gerir | Criar, editar, desativar, redefinir senha | Editar |
| Editor de imóveis | Consultar, criar, editar, excluir, enviar fotos | Consultar e gerir | Sem acesso | Sem edição |
| Corretor | Consultar | Consultar e gerir | Sem acesso | Sem edição |

As verificações são feitas na API; ocultar botões não é a única proteção. Usuários desativados perdem acesso. A redefinição de senha invalida suas sessões. O administrador não pode desativar ou rebaixar seu próprio perfil.

## Idiomas e conteúdo

O seletor de idioma funciona no site e no painel e fica salvo neste dispositivo. Os textos de interface estão em `public/portal/i18n.js`, separados do código de navegação.

Na edição de imóvel, use **Idioma do conteúdo** para cadastrar título, descrição e características em cada língua antes de salvar. Português é o conteúdo-base obrigatório; os outros idiomas são opcionais. O catálogo demonstrativo já inclui os cinco idiomas. Conteúdos livres da equipe, nomes de pessoas, localização e nomenclatura técnica de solo não recebem tradução automática.

## Segurança e operação

- Senhas com scrypt e salt individual; nenhuma senha padrão no pacote.
- Sessões opacas persistidas no banco; token armazenado em cookie HttpOnly/SameSite=Strict, Secure com HTTPS, expiração de oito horas.
- Limite de tentativas de login e envio público por IP, verificação de origem em operações de escrita e validação dos campos.
- SQL parametrizado, proteção contra fórmulas em CSV, escape de conteúdo na interface e cabeçalhos de segurança.
- Envio de JPG, PNG e WebP com até 3 MB por foto e até 20 entradas na galeria. Sharp decodifica a imagem inteira, rejeita arquivos inválidos e animações, limita a 24 milhões de pixels e regrava em WebP de até 2400 × 2400, removendo metadados. Fotos em URLs externas não passam por esse processamento; prefira uploads. Não há serviço de antivírus.
- MFA TOTP configurável por usuário em Equipe > Editar > Exigir MFA (`mfaRequired`, booleano). Contas sem essa configuração mantêm o padrão: administradores exigem MFA; editores e corretores usam senha. Apenas administradores alteram a exigência. A alteração revoga todas as sessões da conta, preservando o autenticador cadastrado para futura reativação. A senha correta cria apenas um desafio de cinco minutos, sem permissão administrativa; somente um código válido libera a sessão. Segredos são criptografados com AES-256-GCM e códigos usados não são aceitos novamente, inclusive com requisições concorrentes. Editores e corretores também podem ter MFA ativado individualmente. Não há recuperação automática por e-mail.
- Auditoria persistida de login, MFA, logout, alterações de equipe, escritas da API e bloqueios de origem. Não registra senhas, códigos, segredos ou conteúdo de contatos. Apenas administradores consultam `/api/audit`; a interface permite baixar o registro em JSON. A trilha não é imutável perante operadores com acesso ao banco.
- Escritas exigem o cabeçalho Origin igual a PUBLIC_ORIGIN, inclusive chamadas de scripts. Autenticação e autorização são verificações separadas no servidor.
- Contatos são gravados no painel; **não há envio automático de e-mail**. A equipe deve acompanhar o painel. A conexão WhatsApp abre uma conversa, sem disparos automáticos.

Mantenha backup do banco, incluindo `image_files`. Antes de importar o catálogo real, exporte e proteja os dados existentes. Use primeiro um subdomínio ou aplicativo temporário para não sobrescrever a instalação atual.

O servidor usa pool de cinco conexões. O frontend não exige renderização React/Next.js nem compilação de grandes bibliotecas; as imagens locais são otimizadas e os cards usam carregamento tardio. Isso reduz o volume de JavaScript e o trabalho de interface, mas não garante tempo de resposta sem medir banco, rede e ambiente reais.

## Desenvolvimento local

```bash
npm ci
```

Configure as variáveis no terminal ou em um arquivo `.env` **não versionado**, e inicie com:

```bash
node --env-file=.env server.mjs
```

Exemplo de desenvolvimento com SQLite:

```dotenv
DB_DRIVER=sqlite
DB_PATH=./data/confianza.sqlite
UPLOAD_DIR=./data/uploads
PUBLIC_ORIGIN=http://localhost:3000
PORT=3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=uma-senha-local-unica-com-12-caracteres
MFA_ENCRYPTION_KEY=chave-aleatoria-de-64-caracteres-hexadecimais
BACKUP_ENCRYPTION_KEY=outra-chave-aleatoria-de-64-caracteres-hexadecimais
```

SQLite é adequado para validação local; se optar por ele em produção, o banco e uploads precisam ficar em armazenamento que sobreviva a redeploy, com backups consistentes. Para a Hostinger, o modo principal fornecido é MySQL.

## Validação executada

Os testes de integração verificam: acesso anônimo bloqueado; origem de escrita; login e logout; administração de equipe sem exposição de hashes; permissões de editor e corretor; persistência de conteúdo em cinco idiomas e rascunhos; contatos com consentimento e mudança de etapa; fotos válidas e rejeição de arquivos truncados; MFA e reutilização de códigos; metadados de imóveis e preço sob consulta; restrição da auditoria; backup criptografado com restauração e comparação de registros e fotos.

Os testes usam a implementação de banco SQLite em processo local. O adaptador MySQL/MariaDB deve ser validado com a sua instância real durante implantação. A versão no Sites usa D1/R2 e proteção por conta ChatGPT; ela não substitui o login da equipe na Hostinger. As telas locais de contatos, calendário, cadastro de imóvel e idioma da equipe foram inspecionadas no navegador. Não foram realizados testes em aparelhos físicos.

```bash
npm test
```

## Estrutura

```text
server.mjs              Servidor, login, usuários e adaptadores de persistência
core/service.mjs        Contrato da API e validações de domínio
core/seed.json          Catálogo demonstrativo multilíngue
public/portal/          Interface compartilhada com a versão Sites
package.json            Express, mysql2 e sharp em produção
package-lock.json       Versões resolvidas
.env.example            Referência de variáveis sem credenciais reais
test.mjs                Testes de integração
```

## MFA e recuperação operacional

Gere duas chaves independentes, uma para MFA e outra para backups, usando `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Guarde as chaves fora do pacote e do banco; preserve MFA_ENCRYPTION_KEY junto do plano de recuperação. Trocar ou perder essa chave impede decifrar os fatores existentes. Nunca use os valores ilustrativos de .env.example.

No primeiro login administrativo, leia o QR Code exibido com um aplicativo TOTP compatível e confirme o código. A chave manual continua disponível como alternativa. O QR Code é gerado no servidor, sem enviar o segredo para serviços externos, e só aparece durante o cadastro inicial do fator. Faça esse cadastro no endereço temporário privado antes da abertura pública. Todos os administradores precisam completar o cadastro individualmente. Sessões administrativas anteriores a esta versão deixam de ser aceitas.

Se o autenticador for perdido, um operador com acesso ao banco deve parar a aplicação, conferir a identidade do administrador fora do site e executar:

```bash
node --env-file=.env recover-mfa.mjs admin@example.com
```

Isso revoga as sessões daquele usuário e registra a recuperação na auditoria. Reinicie em acesso restrito e peça ao administrador para entrar com sua senha e cadastrar o fator novamente. A recuperação preserva a configuração individual de exigência de MFA.

## Backups e restauração

```bash
node --env-file=.env backup.mjs backup /caminho-protegido/confianza-2026-10-14.enc
# Em um ambiente isolado, com variáveis apontando para banco e pasta novos:
node --env-file=.env-restauracao backup.mjs restore /caminho-protegido/confianza-2026-10-14.enc
```

O arquivo inclui catálogo, contatos, configurações, equipe com MFA criptografado, auditoria e todas as fotos enviadas. É criptografado e autenticado com AES-256-GCM; sessões não são recuperadas. A restauração recusa banco ou pasta de fotos com dados e compara todos os registros e bytes das fotos antes de confirmar. Use banco de destino exclusivo e aplicação parada durante a restauração; MySQL cria tabelas antes da transação porque DDL implica commit.

Agende a execução no painel da hospedagem ou em um serviço operacional, retenha cópias em outro local protegido e repita o teste periodicamente. O comando usa memória proporcional ao catálogo e às fotos; para volumes grandes, adote backup nativo do banco. A restauração foi testada em SQLite. O teste em MySQL e o agendamento efetivo dependem do ambiente Hostinger.

## Catálogo, URLs e atendimento

Marque **Preço sob consulta** ao cadastrar um anúncio sem preço público. O servidor grava o preço como nulo e os filtros numéricos não incluem esses anúncios. O catálogo permanece demonstrativo até receber os imóveis reais; não remova o aviso antes da substituição.

Anúncios publicados têm URL `/imovel/ID`, HTML com conteúdo e metadados próprios, canonical, Open Graph e Twitter Card. Rascunhos e IDs ausentes retornam 404. `/sitemap.xml` lista anúncios publicados. Links antigos com hash são encaminhados pelo navegador para o novo caminho. A indexação depende também do domínio público e das configurações da hospedagem.

O atendimento inicial usa **+595 981 361122**. O administrador pode alterar esse número em **Administração → Configurações → WhatsApp (apenas dígitos)** e salvar; use país e DDD, por exemplo `595981361122`. Deixar o campo vazio oculta o botão. Instalações existentes com o número vazio recebem o valor inicial uma única vez ao iniciar esta versão; números já cadastrados são preservados. O botão abre uma conversa sobre o imóvel, incluindo sua URL. Conversas ainda não são sincronizadas com os contatos do painel. Chatwoot, Crisp ou HubSpot podem ser integrados em uma etapa futura com a conta e credenciais da imobiliária.

Teste busca, fotos e formulários em Android e iPhone reais e meça carregamento na rede móvel após implantação. Esta execução não substitui testes em aparelhos físicos ou medição da instalação Hostinger.

## Idioma da equipe, atendimento e visitas

Em **Equipe → Novo usuário / Editar usuário**, selecione o **Idioma padrão**. A preferência é armazenada por conta e aplicada ao entrar e ao abrir o painel em qualquer dispositivo. Alterar o seletor de idioma enquanto conectado também salva a preferência da própria conta. Usuários antigos começam em português.

Em **Contatos**, mover para **Em atendimento** atribui o usuário conectado como responsável e registra data, identidade e etapa anterior/nova no histórico. O botão **Histórico** mostra as movimentações. Contatos anteriores mantêm os dados existentes; não é possível reconstruir retroativamente quem mudou etapas antes desta atualização.

A tela **Visitas agendadas** possui calendário mensal, seleção do dia, criação, reagendamento, cancelamento e conclusão. Agende pelo calendário ou pelo cartão do contato. Mover um contato para **Visita agendada** abre o cadastro da visita; salvar associa o contato e muda a etapa na mesma transação. Reservas sobrepostas na mesma propriedade são rejeitadas, inclusive quando chegam ao mesmo tempo.

Em **Imóveis → Editar → Visitas e comissões internas**, configure visita imediata ou agendamento prévio e a antecedência em dias (por exemplo, 10). A antecedência representa dias corridos de 24 horas e é verificada no servidor; não há aviso automático ao proprietário. Datas e horários aparecem no fuso do dispositivo; são armazenados como instantes UTC. Uma propriedade que exige antecedência não aceita visitas imediatas.

Na mesma seção, informe a **Base de venda para comissões** e adicione participantes. Cada pessoa pode receber percentual sobre essa base ou valor fixo, na moeda do imóvel. A consulta interna de comissões mostra a previsão individual. Valores percentuais sem base de venda ainda não têm previsão calculável; não representam pagamentos realizados.

As comissões e regras operacionais ficam em `property_internal`, separadas do catálogo. Administradores e editores alteram regras de visita. Comissões exigem permissões específicas de visualização ou alteração, exceto administradores, que têm acesso integral. Visitantes, URLs de anúncio, exportações CSV e apresentações não recebem esses campos. As reservas ficam em `visits`; ambos os conjuntos são incluídos no backup. A atualização cria as novas tabelas no início da aplicação. Imóveis com histórico de visitas devem ser arquivados por situação, em vez de excluídos, para preservar os registros.

## Confirmação, disponibilidade e controle interno

Visitas começam como Solicitada. Registre o aviso ao proprietário (canal, observação, usuário e data do servidor) antes de confirmar. Apenas confirmadas podem ser marcadas Realizada. Canceladas e realizadas não reabrem; reagendamento de uma visita ativa exige nova confirmação. Registros antigos Agendada aparecem como Solicitada. O registro de aviso não envia mensagens.

Em Imóveis, configure dias, faixa de horários no fuso IANA da propriedade, antecedência, intervalo entre visitas e períodos bloqueados. Bloqueios e calendário usam o fuso do dispositivo ao informar/exibir datas; o servidor valida a faixa no fuso da propriedade e impede concorrência sobre a agenda.

Em Contato → Responsável e lembrete, transfira para um usuário ativo e agende o retorno. Datas vencidas aparecem como Retorno pendente no cartão. São lembretes internos, sem envio automático por WhatsApp. Transferências, lembretes e movimentações ficam no histórico.

Em Equipe, permissões Visualizar comissões e Alterar comissões são independentes do perfil editorial; alterar também concede visualização. Administradores têm ambas. Demais contas começam sem acesso. As respostas públicas nunca incluem comissões, e o servidor filtra também as respostas da equipe sem permissão.

Comissões têm base prevista, preço efetivo, etapa Previsão/Aprovada/Paga e pagamentos acumulados por participante. Aprovação usa o preço efetivo; o pagamento integral é necessário para marcar Paga. Alterações registram autor, data e valores anteriores/novos.

Validação desta versão: testes automatizados locais com SQLite e restauração criptografada. Ainda é necessário validar MySQL, restauração na Hostinger e celulares físicos antes de publicar.
