# Upload e homologação — 1.5.0-rc.1

Data: 16/10/2026. Este é um **candidato para upload e homologação**. O gate MySQL ainda precisa de comprovação; consulte o estado final dos testes em [ENTREGA-1.5.0-rc.1.md](ENTREGA-1.5.0-rc.1.md). Preparar ou extrair o pacote não equivale a aprovar a publicação em produção.

O projeto é uma aplicação **Node.js 24 / Express**, com frontend nativo. Use a aplicação Node.js existente na Hostinger, ou um ambiente Node compatível para homologação. **Não basta colocar o ZIP em `public_html` como se fosse um site PHP ou somente arquivos estáticos**: o servidor Node atende autenticação, API, banco, mídia e HTML de listagem/imóveis.

## 1. Conferir o candidato

Artefatos esperados: `confianza-hostinger-1.5.0-rc.1-2026-10-16.zip` e `confianza-hostinger-1.5.0-rc.1-2026-10-16.zip.sha256`. Confirme o nome e a versão do pacote entregue e compare o SHA-256 antes de extrair.

Exemplo no Linux, na pasta que contém os dois arquivos:

```bash
sha256sum -c confianza-hostinger-1.5.0-rc.1-2026-10-16.zip.sha256
```

Se o checksum divergir, obtenha novamente o artefato antes da instalação. O ZIP é de código-fonte; não contém o ambiente privado nem substitui os dados da aplicação.

## 2. Preservar a instalação e preparar rollback

Antes de atualizar uma instalação existente:

1. Registre a versão em operação, o diretório/entrada do serviço e os comandos atuais de build e início. Guarde uma cópia do código anterior ou mantenha o diretório da versão anterior disponível para retorno.
2. Faça backup consistente do banco e confira como restaurá-lo em um destino isolado. Em MySQL, inclua `image_files` e todas as tabelas da aplicação. Guarde também uploads/volumes externos que a instalação utilize e os backups privados existentes.
3. Preserve as variáveis do painel e qualquer `.env` privado já utilizado. Não substitua arquivos de configuração pela referência de desenvolvimento e não publique segredos no gerenciador de arquivos público.
4. Preserve as chaves existentes de MFA, backup, WhatsApp QR e demais integrações. Uma chave nova não decifra dados protegidos pela antiga. Não recrie usuários, senhas ou o cadastro do autenticador para atualizar a interface.
5. Preserve `DB_DRIVER`, destino e credenciais do banco, configuração de mídia/volumes e o valor existente de `SEED_DEMO`. Não apague o banco, o marcador de inicialização ou dados de configuração para forçar um primeiro início. Não importe `core/seed.json` sobre os registros reais.

O procedimento operacional de backup já existente está em [README.md](README.md) e [CONFIGURACAO-1.4.0.md](CONFIGURACAO-1.4.0.md). Use as chaves e o ambiente privados da instalação; não há credencial nova a copiar desta entrega.

## 3. Instalar na raiz da aplicação Node

Homologue primeiro em uma aplicação e banco isolados, sem apontar testes de restauração ou formulários para o banco de produção. Integrações com destinatários reais devem seguir os modos de teste e autorizações já configurados. Não conecte uma segunda instância à mesma sessão de WhatsApp QR.

1. Envie e extraia o ZIP em um diretório de versão ou na raiz de projeto definida para a aplicação Node. Evite uma pasta extra acidental envolvendo o projeto.
2. Na raiz selecionada devem estar, no mesmo nível, `package.json`, `package-lock.json`, `server.mjs`, `core/`, `public/`, `scripts/` e os documentos de entrega. Os assets públicos estão em `public/portal/`.
3. Se atualizar no mesmo diretório, substitua apenas os arquivos de código e documentação do pacote. Preserve `.env`, bancos locais, `data/`, uploads, backups e outros volumes persistentes já usados pela instalação.
4. Use **Node.js 24.x** e **npm**. A entrada continua sendo `server.mjs`; a plataforma deve disponibilizar `PORT`. Preserve o roteamento/proxy e o serviço Node existentes.
5. Instale pelo lockfile no ambiente de destino; não copie `node_modules` do Windows para o servidor Linux.

Comandos do projeto, executados na raiz da aplicação:

```bash
npm ci
npm run build
npm start
```

No painel de aplicação Node, os mesmos valores são: instalação `npm ci`, build `npm run build`, início `npm start`; arquivo de entrada `server.mjs` quando solicitado. Use o gerenciador de processo da hospedagem para manter/reiniciar o serviço. Não inicie um processo duplicado se o painel já gerencia a aplicação.

`npm start` lê as variáveis já fornecidas ao processo. Se a instalação carrega `.env` por um comando próprio, mantenha esse mecanismo existente; o comando não carrega `.env` automaticamente. Não coloque senhas na linha de comando nem em arquivos do pacote.

## 4. Conferir ambiente e origem pública

Esta versão não exige novas variáveis para UX/SEO/CRO. Preserve o ambiente configurado, inclusive flags de envio e tarefas automáticas. Em produção, o servidor exige `NODE_ENV=production` e `PUBLIC_ORIGIN` com HTTPS. `PUBLIC_ORIGIN` deve continuar sendo a origem exata do aplicativo, sem caminho ou barra final, compatível com o domínio acessado.

Em homologação com outro domínio, use a origem própria daquele ambiente. Uma origem incorreta pode impedir operações de escrita e login. O valor de produção e os segredos não devem ser trocados apenas para executar smoke local.

Os contatos, WhatsApp e aviso de demonstração continuam nas configurações existentes do painel. Não introduza telefone de exemplo nem remova o aviso demonstrativo enquanto o catálogo ainda for ilustrativo.

## 5. Smoke após iniciar

Execute no endereço de homologação e registre URL, data, versão e resultado. A saúde HTTP confirma que a aplicação respondeu; não substitui a suíte MySQL, o teste de restauração ou as verificações funcionais.

| Conferência | Resultado esperado |
| --- | --- |
| `GET /api/health` | HTTP 200 e JSON `{"ok":true}` |
| Página inicial | Fotos, fontes e módulos carregam; busca proeminente; layout sem rolagem horizontal no celular |
| Busca | Localização, tipo, finalidade e preço mantêm filtros na URL; limpar filtros funciona; resultados e estado vazio coerentes |
| Moeda | Teto em BRL não inclui imóveis em USD nem preço sob consulta por comparação numérica |
| Cards e detalhes | Links abrem o imóvel correto; “Agendar visita” abre formulário associado ao anúncio |
| Solicitação de visita | Em cenário de teste autorizado, envio com consentimento registra a solicitação correta no painel; data preferida não aparece como reserva confirmada |
| WhatsApp público | Aparece com número válido, permanece acessível no celular e abre o destino correto; nos detalhes inclui imóvel e URL. Conferir o link não exige enviar mensagem |
| Sobre e idiomas | Texto novo, navegação e CTAs funcionam nos cinco idiomas; sem depoimentos ou marcas fictícios |
| SEO | Fonte HTML de `/buscar` contém títulos/metadados; filtros recebem `noindex,follow`; canonical usa a origem esperada |
| Administração | Login e MFA existentes funcionam; imóveis, contatos e visitas anteriores permanecem; WhatsApp flutuante não aparece no painel |
| Mídia e persistência | Fotos antigas continuam acessíveis; após reinício do serviço, registros e arquivos persistem |

Para o teste de login, use as credenciais já existentes da equipe. Este pacote não define senha padrão, não reseta MFA e não requer um novo administrador. Não deixe solicitações de teste confundidas com contatos comerciais.

## 6. Aceite e retorno à versão anterior

Antes da produção, atualize o registro de validação da entrega com evidências do mesmo código empacotado, incluindo o gate MySQL e os demais gates exigidos. Um smoke bem-sucedido em SQLite ou na extração do ZIP não comprova o aceite MySQL. A homologação da Hostinger e a conferência do domínio também precisam de registro próprio.

Se surgir regressão após a troca, interrompa a nova instância, restaure o apontamento/código da versão anterior e reinicie com **as mesmas variáveis, chaves e dados persistentes**. Confirme saúde, login, busca e mídia. Não mantenha as duas versões processando filas ou usando a mesma sessão QR ao mesmo tempo.

A atualização de UX/SEO/CRO não depende de importação de dados. Não restaure um backup antigo do banco como primeira ação de rollback: isso pode apagar contatos recebidos após o backup. Se houver problema de integridade de dados, pare escritas, preserve uma cópia do estado atual e execute o procedimento de recuperação já validado pela operação, considerando os registros novos.

O upload, a troca do serviço e a publicação não foram executados nesta preparação. O plano editorial e os incrementos futuros estão em [docs/PLANO-UX-SEO-CRO.md](docs/PLANO-UX-SEO-CRO.md).
