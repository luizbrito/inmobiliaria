# Entrega 1.5.0-rc.1 — UX, SEO local e conversão

Data: 16/10/2026. **Candidato para upload e homologação**, sem publicação executada nesta entrega. O aceite completo de release permanece pendente, especialmente a comprovação do gate MySQL. O sufixo `rc.1` identifica uma versão candidata e não certifica aprovação para produção.

Consulte o [plano de UX, SEO e CRO](docs/PLANO-UX-SEO-CRO.md) para textos, dez hipóteses de palavras-chave locais, hierarquia de títulos, referências e evolução planejada. O [guia de upload](UPLOAD-1.5.0-rc.1.md) descreve a atualização da aplicação Node.js na Hostinger.

## Escopo implementado

- **Busca na página inicial:** painel mais proeminente na hero, rótulos visíveis de localização, tipo e preço, sugestões obtidas dos imóveis publicados e filtros rápidos com parâmetros compartilháveis na URL. A faixa numérica filtra BRL e não compara preços em USD com reais.
- **Conversão nos cards:** “Agendar visita” complementa o acesso aos detalhes em todos os cards públicos e reutiliza o formulário de contato existente. A data informada é uma preferência sujeita à confirmação da equipe; o formulário não faz reserva automática da agenda.
- **WhatsApp:** atalho flutuante nas páginas públicas, com foco visível e posição ajustada às áreas seguras do celular. É ocultado na administração e sem número válido configurado. Nos detalhes, a mensagem inclui título e URL do imóvel. O atalho abre uma conversa; não envia mensagem automaticamente nem cria contato no painel.
- **Sobre:** texto focado em planos, família, rotina e decisões bem informadas; resumo na página inicial e chamada para conversar com a equipe. Os novos textos têm versões em português, espanhol, italiano, inglês e alemão.
- **Prova social:** estrutura de depoimentos e parceiros preparada em `public/portal/conversion-content.js`, com listas inicialmente vazias. Relatos exigem publicação e consentimento; marcas exigem publicação e autorização. A interface omite a seção até existir conteúdo real aprovado, inclusive no catálogo demonstrativo.
- **SEO da listagem:** HTML inicial de `/buscar` com títulos contextuais, H1, H2 e H3, metadados e canonical normalizada. Buscas filtradas recebem `noindex,follow`. Os títulos do documento acompanham o contexto das páginas.
- **Imagens:** alternativas textuais factuais com identificação do anúncio, localização e índice quando aplicável; a imagem decorativa da hero tem alternativa vazia. A implementação evita inferir ambientes ou acabamentos ausentes do cadastro.
- **Eventos locais:** `confianza:conversion` em `window`, com `detail` contendo `{name, propertyId}`. Abertura de WhatsApp, busca e solicitação de visita podem ser integradas posteriormente a mensuração. Não há provedor de analytics novo ou coleta persistente adicionada por esses eventos.

## Tecnologias e compatibilidade

O projeto continua com **HTML, CSS e JavaScript nativo, Node.js 24 e Express 5**, MySQL/MariaDB como banco principal e SQLite para desenvolvimento. Esta atualização de UX/SEO/CRO **não acrescenta dependências npm** e utiliza os componentes e fluxos já existentes.

Não é necessário importar um catálogo, recriar usuários, resetar senhas ou gerar novas chaves para aplicar esta atualização. Preserve o ambiente, as credenciais, as chaves, o banco e os arquivos persistentes da instalação. Os fluxos já existentes de SMTP, notificações, WhatsApp QR e backup mantêm sua configuração operacional.

O pacote de código não deve conter `.env`, credenciais, `node_modules`, banco, uploads ou relatórios privados. Instale as dependências pelo lockfile no servidor de destino. O build valida a sintaxe do projeto; não substitui as suítes funcionais nem a homologação da hospedagem.

## Limites e próximos incrementos

Não foram criadas páginas editoriais `/imoveis/cidade/...`, cadastro estruturado de bairros ou campo de descrição editorial individual por foto. As dez palavras-chave do plano são hipóteses a validar com estoque e cobertura reais, sem promessa de volume, posição no Google ou aumento de vendas.

Depoimentos, nomes de clientes, avaliações e logotipos de parceiros não foram inventados. A publicação dessa prova social depende do material real autorizado. A operação continua responsável por confirmar disponibilidade de imóveis e visitas e por revisar os textos com seus dados comerciais.

O catálogo demonstrativo deve permanecer identificado enquanto não for substituído por dados reais. Não importe a demonstração sobre o banco existente e não altere `SEED_DEMO` como parte desta atualização.

## Registro de validação local

Validações locais executadas em ambiente isolado. O candidato continua sem o aceite completo de produção.

| Verificação | Estado a atualizar pela revisão final |
| --- | --- |
| Build e sintaxe | Aprovado: 91 arquivos JavaScript; sintaxe do ajuste final de navegação também conferida |
| Unidade, contratos e integração | Aprovado: `npm test`, 109/109 testes, sem falhas ou pulos; inclui o SEO HTTP |
| Jornadas de navegador, acessibilidade e visual | Aprovado no escopo: 5/5 testes novos Playwright; busca, visitas com falha e sucesso, WhatsApp, 5 idiomas, preservação de token de recuperação, axe sem violações graves/críticas nos fluxos verificados, capturas desktop 1440 px e celular 390 px. Não substitui todas as suítes do gate |
| Instalação limpa e smoke do ZIP extraído | Aprovado: integridade ZIP, SHA-256, npm ci de produção em pasta nova, build extraído, início com SQLite, saúde HTTP e bloqueio administrativo anônimo. Smoke isolado não equivale ao gate completo |
| MySQL e restauração isolada | **Ainda não comprovados para este candidato** |
| Gate completo de release | **Pendente; não considerar aprovado sem MySQL e demais evidências exigidas** |
| Hostinger, domínio, integrações e aparelhos reais | Não homologados nesta entrega local |

Os testes devem usar ambiente isolado. O comando de gate `npm run test:release` exige evidências válidas das suítes previstas; eventual smoke do pacote não remove o requisito MySQL. O [guia de testes automatizados](TESTES-AUTOMATIZADOS.md) detalha a infraestrutura existente.

Digest SHA-256 das fontes verificadas (função `sourceDigest`, escopo de código/testes): `8b45d7ffd2d39369d15d3c7e4acb52794c5ae3763e53e6c4db30b70c32fac36f`. Evidências locais: `reports/all.json` e `reports/release-smoke.json`; relatórios e dados de teste ficam fora do ZIP.

## Entrega e operação

Artefato: `confianza-hostinger-1.5.0-rc.1-2026-10-16.zip`, acompanhado de `.zip.sha256`. O pacote inclui o plano e os guias de operação. As instruções de backup, atualização, smoke e rollback estão em [UPLOAD-1.5.0-rc.1.md](UPLOAD-1.5.0-rc.1.md).

Nenhuma variável da hospedagem, banco, segredo ou serviço externo foi alterado por este documento. Nenhum deploy ou envio de mensagem real foi realizado como parte desta preparação.
