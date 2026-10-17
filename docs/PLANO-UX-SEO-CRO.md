# Plano de UX, SEO local e conversão — Confianza

Data: 16/10/2026. Este documento reúne proposta editorial, especificação técnica e próximas etapas. Uma primeira implementação local já foi concluída e passa pela validação final; o registro da seção 11 descreve seu escopo. As estimativas são referências para executar o plano do início, não horas restantes nem tempo efetivamente gasto, sem contar espera por conteúdo, contas ou publicação.

## 1. Contexto verificado

O projeto usa HTML, CSS e JavaScript nativo em `public/portal/`, Node.js 24 e Express 5 no servidor, MySQL/MariaDB como banco principal e SQLite para desenvolvimento. Há traduções da interface para português, espanhol, italiano, inglês e alemão. Não é necessário migrar para React, Next.js ou instalar uma biblioteca de componentes para este escopo.

O catálogo inicial em `core/seed.json` tem **seis imóveis demonstrativos**, com fotografias e valores ilustrativos. Ele permite testar jornadas, mas não comprova cobertura comercial, disponibilidade real ou características de bairros:

| Localização do cadastro | Conteúdo demonstrativo | Moeda |
| --- | --- | --- |
| Curitiba, PR | Casa à venda, casa para alugar e apartamento em lançamento | BRL |
| Goiânia, GO | Apartamento à venda | BRL |
| Sorriso, MT | Fazenda à venda | BRL |
| San Pedro, Paraguai | Fazenda à venda | USD |

Não há campo de bairro estruturado nem depoimentos ou parceiros comprovados na configuração inicial. “Jardim das Oliveiras” é parte do título de um anúncio; não foi identificado como bairro. Não há imóvel demonstrativo no Sudeste.

O site já tinha busca, favoritos, formulários de contato e solicitação de visita, comparação rural e URLs `/imovel/ID` com metadados no servidor. O painel já permite gerir visitas. Uma solicitação pública **não equivale a uma visita confirmada**.

## 2. Sequência de implementação

| Ordem | Tarefa e resultado revisável | Referência de esforço desde o início | Situação desta entrega e dependência |
| --- | --- | --- | --- |
| 1 | Conferir regiões, moedas, contato e conteúdo real; definir a referência inicial de métricas | 2–3 h | Catálogo demonstrativo conferido; catálogo comercial e métricas dependem da equipe |
| 2 | Reposicionar a busca dentro da hero; rótulos de localização, tipo e preço; filtros rápidos e estado vazio | 4–6 h | Implementado localmente com sugestões do catálogo e teto em BRL; validação final em andamento |
| 3 | WhatsApp flutuante e CTA de visita em todos os cards públicos | 2–3 h | Implementado localmente; funcionamento real depende do contato configurado |
| 4 | Aplicar texto de Sobre; preparar espaço editorial para depoimentos e parceiros | 3–4 h | Sobre e resumo da home em cinco idiomas; estrutura de prova social sem conteúdo fictício; relatos e marcas reais pendentes |
| 5 | Títulos e H1 contextuais; revisar imagens, miniaturas e navegação por teclado | 3–5 h | SEO da listagem e alt factual implementados; UI e teclado verificados; descrições editoriais por foto ficam para evolução |
| 6 | Criar páginas locais com HTML no servidor, canonical, links internos e sitemap | 8–12 h | Evolução futura; esta entrega renderiza `/buscar` no servidor e não cria as rotas locais propostas |
| 7 | Acrescentar bairro estruturado e descrições por foto no editor e na API | 5–8 h | Evolução futura; exige migração compatível com anúncios existentes |
| 8 | Eventos, teste móvel, acessibilidade e revisão final da jornada | 4–6 h | Eventos locais, UI e build verificados; provedor de analytics não configurado; aparelhos físicos e hospedagem pendentes |

Total indicativo do plano completo se iniciado do zero: **31–47 horas**, aproximadamente **4–6 dias úteis**. Esse total não é um prazo adicional para a primeira implementação já realizada. A expansão de páginas locais (8–12 h) e de bairro/descrições por foto (5–8 h) permanece futura; a integração de analytics precisa de escopo e conta definidos para uma estimativa própria. A coleta de depoimentos e autorizações ocorre em paralelo, sem prazo prometido.

## 3. Busca na hero e filtros rápidos

### Composição e comportamento

Manter a identidade verde escura e tons claros já existentes. Exibir título e proposta de valor sobre a foto, com painel de busca claro logo abaixo, ainda na hero. No computador, usar quatro ou cinco colunas; no celular, campos empilhados e botão com largura total. A busca deve ser reconhecível antes da primeira lista de imóveis.

Campos propostos: finalidade (Comprar, Alugar, Lançamentos), “Bairro ou cidade”, “Tipo de imóvel”, “Faixa de preço” e botão “Buscar imóveis”. Rótulos permanecem visíveis; placeholders dão exemplos. Até existir bairro cadastrado, a localização pesquisa o texto realmente disponível e as sugestões usam cidades do catálogo. Informar “Busque pelas cidades cadastradas; bairros dependem das informações do anúncio” quando necessário.

Para preço, a primeira versão pode usar faixas exclusivas identificadas, como “Até R$ 2 milhões”. A evolução inclui mínimo e máximo com seletor BRL/USD. Nunca comparar valores em dólares com um limite em reais, converter moedas sem taxa informada ou mostrar limite de aluguel como preço total de venda. Imóveis “sob consulta” ficam fora de filtros numéricos; o estado vazio explica essa regra.

Tags úteis ao catálogo de demonstração: “Casas em Curitiba”, “Apartamentos em Goiânia”, “Fazendas no Paraguai”, “Aluguel em Curitiba”. Formar as opções com dados publicados e retirar atalhos que não têm resultados. Cada tag abre a busca com filtros em URL compartilhável. Exibir filtros aplicados, contagem de resultados e “Limpar filtros”. Em controles que alternam o estado na própria tela, usar `aria-pressed`; em atalhos para outra página, usar links.

### Textos prontos

- **H1:** “Encontre um lugar para viver, investir ou produzir.”
- **Apoio:** “Compare imóveis urbanos e propriedades rurais. Escolha a região, encontre opções para o seu momento e converse com a equipe.”
- **Botão:** “Buscar imóveis”
- **Ajuda de localização:** “Comece pela cidade ou região que faz parte dos seus planos.”
- **Estado vazio:** “Não encontramos imóveis com essa combinação. Remova um filtro ou fale com a equipe para contar o que procura.”
- **Aviso demonstrativo:** “Catálogo demonstrativo. Imóveis, fotos e valores ilustrativos; não representam ofertas reais.”

Exemplo estrutural para a busca existente; os valores de `<option>` devem ser preenchidos com dados reais, preservando os parâmetros de filtro suportados:

```html
<form action="/buscar" method="get" role="search" aria-label="Buscar imóveis">
  <label for="localizacao">Bairro ou cidade</label>
  <input id="localizacao" name="q" type="search" placeholder="Ex.: Curitiba">
  <label for="tipo">Tipo de imóvel</label>
  <select id="tipo" name="type">
    <option value="">Todos os tipos</option>
    <option value="Casa">Casa</option>
    <option value="Apartamento">Apartamento</option>
    <option value="Fazenda">Fazenda</option>
  </select>
  <label for="preco">Faixa de preço em reais</label>
  <select id="preco" name="max">
    <option value="">Qualquer valor</option>
    <option value="2000000">Até R$ 2 milhões</option>
    <option value="5000000">Até R$ 5 milhões</option>
  </select>
  <button type="submit">Buscar imóveis</button>
</form>
```

## 4. Copywriting de Sobre

### Texto pronto

**H1: Antes de escolher um imóvel, existe uma história. A sua.**

Talvez sua família precise de mais espaço. Talvez seja hora de começar em outra cidade ou encontrar uma terra para um novo projeto. O endereço muda, mas o desejo costuma ser o mesmo: dar o próximo passo com mais clareza e tranquilidade.

Na Confianza, nosso propósito é aproximar seus planos das possibilidades que fazem sentido para você. Queremos entender o que importa na sua rotina, no seu investimento ou na sua produção antes de apresentar caminhos.

Você pode explorar imóveis urbanos e propriedades rurais, comparar informações e conversar com a equipe sobre suas dúvidas. A visita é uma oportunidade para olhar de perto, entender o contexto e avaliar cada detalhe com tempo.

Uma escolha importante merece informação clara e uma conversa próxima. Conte o que procura. Vamos construir o próximo passo com você.

**CTA: “Conte seus planos à equipe”**

O texto expressa propósito; não cria uma história de fundação, tempo de mercado, quantidade de famílias atendidas ou garantia documental. Antes da publicação definitiva, a equipe deve validar se o atendimento descrito corresponde à operação.

### Resumo para a página inicial

**Título:** “Seu próximo passo começa com uma boa conversa.”

**Texto:** “Por trás de cada busca há uma família, uma mudança ou um projeto. Conte o que importa para você e encontre caminhos para avaliar seu próximo imóvel com mais clareza.”

**Link:** “Conheça a Confianza”

## 5. Depoimentos e parceiros

### Estrutura de prova social

H2 “Histórias de quem encontrou seu caminho”. Apoio “Experiências compartilhadas por clientes, com autorização.” Exibir de dois a três relatos curtos, sem rotação automática. Cada cartão tem relato original aprovado, nome na forma autorizada, cidade e contexto da transação quando consentidos; data e link da avaliação original, quando houver. Retrato é opcional.

Modelo editorial para coleta, **não publicável com campos vazios**:

> [Relato real aprovado pelo cliente, de preferência sobre dúvida inicial, acompanhamento e resultado.]
>
> [Nome autorizado] · [cidade] · [compra, locação ou venda, se autorizado]

Não criar clientes, notas, contagens, estrelas, resultados ou avaliações de exemplo em uma seção apresentada como prova social. Enquanto não houver material aprovado, omitir os cartões e publicar uma seção honesta de processo, como “Como ajudamos na sua escolha”, com “Entendemos seus planos”, “Organizamos as informações” e “Combinamos os próximos passos”.

### Apresentação de parceiros

H2 “Parcerias que fazem parte da jornada”. Usar grade discreta, com logotipos autorizados em caixas de mesma altura, preservando proporção e área de respiro. Cada marca pode trazer uma frase factual explicando sua relação com a imobiliária e link para o site oficial. Não chamar uma plataforma utilizada de “parceiro” sem essa relação existir. Não usar logotipos de bancos ou associações para sugerir certificação, crédito garantido ou vínculo inexistente.

Sem parceiros cadastrados, ocultar a grade. Estrutura futura sugerida: `name`, `logoUrl`, `website`, `relationship`, `approved`, `order`. Para depoimentos: `quote`, `displayName`, `context`, `sourceUrl`, `consentRecorded`, `approved`, `order`. Publicar apenas registros aprovados.

## 6. Dez palavras-chave de intenção local

São **hipóteses editoriais para validação**, derivadas das localidades e tipos do catálogo demonstrativo. Não representam volume pesquisado, concorrência medida nem confirmação de atendimento real. Validar cidade e disponibilidade antes de usar em páginas comerciais; palavras em espanhol podem fazer sentido para o Paraguai após pesquisa específica de idioma.

| Palavra-chave | Página ou intenção proposta |
| --- | --- |
| casas à venda em Curitiba PR | Compra residencial em Curitiba |
| casas para alugar em Curitiba PR | Locação residencial em Curitiba |
| apartamentos em lançamento em Curitiba PR | Lançamentos em Curitiba |
| imóveis à venda em Curitiba PR | Lista de compra da cidade |
| apartamento à venda em Goiânia GO | Compra de apartamento em Goiânia |
| imóveis à venda em Goiânia GO | Lista de compra da cidade |
| fazendas à venda em Sorriso MT | Catálogo rural em Sorriso |
| propriedades rurais à venda em Sorriso MT | Mesma página rural, usada naturalmente no texto |
| fazendas à venda em San Pedro Paraguai | Catálogo rural em San Pedro |
| fazendas à venda no Paraguai | Página de cobertura rural no país |

Não criar dez páginas quase iguais para acomodar dez expressões. Agrupar termos com a mesma intenção e somente criar páginas de bairro quando bairro e cobertura forem comprovados. Páginas locais precisam ajudar a encontrar imóveis e oferecer informação própria da região; séries de páginas similares que apenas levam à mesma busca podem configurar doorway abuse. [Fonte: políticas de spam do Google](https://developers.google.com/search/docs/essentials/spam-policies#doorway-abuse).

## 7. Hierarquia H1–H3, metadados e páginas locais

Usar título principal claro e proeminente; esta proposta adota um H1 por página e H2/H3 de acordo com a organização real do conteúdo. Escrever `<title>` específico, conciso e coerente com a página, sem repetição de palavras-chave. O Google pode escolher outro título para o resultado. [Fonte: títulos nos resultados do Google](https://developers.google.com/search/docs/appearance/title-link).

### URLs propostas para a próxima etapa

Estas rotas são **propostas**, não URLs cuja existência foi verificada nesta análise. Elas exigem implementação no servidor, catálogo real, conteúdo e verificação de retorno HTTP.

| URL sugerida | H1 | Title sugerido |
| --- | --- | --- |
| `/imoveis/curitiba-pr/comprar` | Imóveis à venda em Curitiba, PR | Imóveis à venda em Curitiba, PR \| Confianza |
| `/imoveis/curitiba-pr/alugar` | Casas para alugar em Curitiba, PR | Casas para alugar em Curitiba, PR \| Confianza |
| `/imoveis/curitiba-pr/lancamentos` | Apartamentos em lançamento em Curitiba, PR | Lançamentos em Curitiba, PR \| Confianza |
| `/imoveis/goiania-go/comprar` | Apartamentos à venda em Goiânia, GO | Apartamentos à venda em Goiânia, GO \| Confianza |
| `/imoveis/sorriso-mt/fazendas` | Fazendas à venda em Sorriso, MT | Fazendas à venda em Sorriso, MT \| Confianza |
| `/imoveis/san-pedro-paraguai/fazendas` | Fazendas à venda em San Pedro, Paraguai | Fazendas em San Pedro, Paraguai \| Confianza |

Exemplo de conteúdo para Curitiba:

```text
H1 Imóveis à venda em Curitiba, PR
  [Introdução curta com o estoque real, sem afirmações sobre segurança ou valorização.]
  H2 Explore os imóveis disponíveis em Curitiba
    H3 [Título real de cada imóvel, com link para /imovel/ID]
  H2 Encontre opções para o seu momento
    H3 Casas em Curitiba
    H3 Apartamentos em lançamento em Curitiba
  H2 Como planejar sua visita
    H3 Conte suas preferências à equipe
    H3 Combine disponibilidade e próximos passos
```

Para bairro confirmado: H1 “Apartamentos à venda em [bairro], [cidade]”; H2 “Imóveis disponíveis em [bairro]”; H3 para cada anúncio; H2 “Conheça a região” apenas com fatos locais verificados. Não preencher campos com um bairro deduzido do nome comercial de um imóvel.

Exemplo de descrição para página real: “Explore os imóveis à venda em Curitiba no catálogo da Confianza. Compare informações, confira disponibilidade e solicite uma visita com a equipe.” Enquanto o catálogo for demonstrativo, explicitar essa condição no texto e decidir a indexação do ambiente de demonstração antes da publicação.

### Requisitos técnicos das páginas locais

Entregar conteúdo útil e metadados no HTML inicial, com o mesmo conteúdo para visitantes e robôs. Usar `<a href>` entre região, cidade e anúncios, canonical absoluto e sitemap apenas com páginas canônicas publicáveis. Novas páginas de região não substituem as URLs estáveis dos imóveis. Rotas inválidas precisam de HTTP 404, e o estado sem estoque deve ser tratado conforme a finalidade da página.

Manter a busca parametrizada para a interação e reservar URLs locais editoriais para intenções relevantes. Evitar multiplicar páginas indexáveis para preço, ordenação e combinações sem valor próprio. Definir política de rastreamento antes de bloquear parâmetros: canonical é um sinal de preferência e não deve ser o único controle de um volume ilimitado de filtros. [Fonte: navegação facetada do Google](https://developers.google.com/crawling/docs/faceted-navigation).

## 8. Alt das fotos de imóveis

O `alt` descreve a informação visual relevante no contexto. Fotografias que têm conteúdo precisam de descrição; elementos puramente decorativos usam `alt=""`. O Google recomenda conteúdo útil e contextual, evitando preenchimento de palavras-chave. [Fonte: SEO para imagens do Google](https://developers.google.com/search/docs/appearance/google-images).

Procedimento editorial:

1. Cadastrar descrição por foto após olhar a imagem e confirmar o vínculo com o imóvel. Descrever o que aparece, sem supor cômodo, acabamento, vista, conservação ou localização apenas a partir do nome do arquivo.
2. Manter contexto suficiente para identificar o anúncio. Exemplo **somente se confirmado visualmente**: “Fachada da Casa Jardim das Oliveiras, em Curitiba”. Se a imagem não for específica do imóvel, identificá-la como ilustração em vez de apresentá-la como registro do anúncio.
3. Variar por imagem quando existirem fotos de ambientes distintos. Não repetir a mesma lista de termos em todas as miniaturas. Miniaturas acionáveis precisam de nome acessível no botão, por exemplo “Ver foto 2 de 5”; a imagem pode ter alt vazio se essa informação já estiver coberta pelo controle.
4. Até existir descrição específica, usar uma alternativa factual de identificação, como “Imagem do anúncio Casa Jardim das Oliveiras — Curitiba, PR”, com o aviso demonstrativo visível. Esse fallback não afirma que a foto mostra fachada ou sala e não substitui a revisão por foto.
5. Incluir traduções editoriais das descrições quando disponíveis; não traduzir nomes próprios ou criar conteúdo ausente. Ao substituir a imagem, revisar a descrição correspondente.
6. Manter dimensões, otimização e `loading="lazy"` nas fotos abaixo da primeira tela. A imagem principal da hero precisa de prioridade de carregamento, não de lazy loading.

Exemplo ilustrativo de renderização segura pelo DOM:

```js
const photo = document.createElement('img');
photo.src = validatedImageUrl;
photo.alt = reviewedPhotoDescription ||
  `Imagem do anúncio ${property.title} — ${property.location}`;
photo.loading = 'lazy';
```

A evolução do cadastro pode acrescentar `galleryAlt` ou objetos `{src, alt, translations}` com validação no servidor, compatibilidade com galerias legadas e editor com prévia. A descrição não deve ser inventada automaticamente com base no título do imóvel.

## 9. WhatsApp flutuante e Agendar visita

### WhatsApp

Exibir nas páginas públicas quando há um número internacional válido nas configurações. Posicionar no canto inferior direito, com texto “Falar no WhatsApp”, alvo de pelo menos 48 × 48 px, foco visível, contraste e espaço para áreas seguras do celular. Reservar espaço para o rodapé e impedir sobreposição com ações, diálogos ou avisos. Em um diálogo modal, os controles do fundo ficam fora da interação até fechá-lo. No painel administrativo, manter o fluxo de trabalho da equipe sem sobreposição pública.

Na home e listagem, mensagem: “Olá! Quero ajuda para encontrar um imóvel. Procuro em [localização, se informada].” No anúncio: “Olá! Tenho interesse em [título] ([referência]). Podemos conversar sobre uma visita? [URL do imóvel]”. O clique abre a conversa; não envia mensagem automaticamente, não cria lead no painel e não confirma disponibilidade de horário.

Snippet independente para adaptar ao componente existente; `PUBLIC_WHATSAPP` vem da configuração pública, sem tokens ou credenciais:

```html
<a id="whatsapp-float" class="whatsapp-float" hidden
   target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
```

```css
.whatsapp-float {
  position: fixed;
  inset-inline-end: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 30;
  min-height: 48px;
  padding: 12px 18px;
  border-radius: 999px;
  background: #176641;
  color: white;
  font-weight: 700;
}
.whatsapp-float[hidden] { display: none; }
.whatsapp-float:focus-visible { outline: 3px solid #b8893e; outline-offset: 4px; }
```

```js
const number = String(PUBLIC_WHATSAPP || '').replace(/\D/g, '');
const link = document.querySelector('#whatsapp-float');
if (/^[1-9]\d{7,14}$/.test(number)) {
  const message = 'Olá! Quero ajuda para encontrar um imóvel.';
  link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  link.hidden = false;
}
```

### Cards e formulário de visita

Colocar “Agendar visita” como ação principal abaixo do preço e manter “Ver detalhes” como ação secundária. Preservar favorito e comparação rural. No nome acessível, incluir o imóvel para distinguir botões repetidos. Aproveitar o formulário atual, enviando `propertyId` e tipo de interesse “Visita”; obter nome, canal de retorno e mensagem. Para a versão inicial, a equipe combina os horários depois, sem inventar uma reserva automática.

```html
<!-- Exemplo aplicado a um ID existente do catálogo demonstrativo. -->
<button type="button" data-action="contact" data-kind="Visita"
        data-id="casa-jardim"
        aria-label="Agendar visita à Casa Jardim das Oliveiras">
  Agendar visita
</button>
```

Textos prontos para a jornada:

- **Apoio:** “Gostou deste imóvel? Conte como podemos falar com você para combinar uma visita.”
- **Botão de envio:** “Solicitar agendamento”
- **Sucesso:** “Solicitação recebida. A equipe vai falar com você para confirmar disponibilidade e combinar a visita.”
- **Falha:** “Não foi possível enviar agora. Tente novamente ou fale com a equipe pelo WhatsApp.”

Só mostrar sucesso após resposta positiva da API. Manter validação, consentimento e proteção contra envio repetido já existentes. Uma futura escolha de horário deve reutilizar as regras internas de antecedência, disponibilidade e conflito no servidor.

## 10. Critérios de aceite e mensuração

Verificar em homologação: busca com filtro isolado e combinado; moedas separadas; URLs compartilháveis; estado sem resultados; favorito e comparação; formulário de visita com sucesso e falha; WhatsApp com e sem configuração; foco e leitura por teclado; celular com área segura; idiomas; descrição das imagens; metadados no HTML inicial das páginas SEO.

Medir antes e depois com períodos comparáveis e o mesmo mix de tráfego. Os eventos propostos dependem de instrumentação; não presumir que já existem:

| Evento | Quando registrar | Propriedades sem dados pessoais |
| --- | --- | --- |
| `search_submit` | Busca executada | região, tipo, finalidade, faixa, moeda, origem |
| `search_zero_results` | Busca válida sem resultados | combinação de filtros, sem texto livre |
| `property_view` | Anúncio aberto | ID, tipo, região |
| `visit_request_open` | Formulário de visita aberto | ID, origem card/detalhe |
| `visit_request_success` | API confirmou recebimento | ID, origem |
| `whatsapp_click` | Link acionado | ID opcional, página de origem |

Indicadores: solicitações de visita recebidas por visualização de anúncio; abertura versus envio do formulário; buscas sem resultados; visitas efetivamente confirmadas pela equipe; contatos qualificados por origem; impressões e cliques orgânicos das páginas locais no Search Console. Cliques em WhatsApp são interesse e não comprovam conversa ou venda. Não enviar nome, telefone, mensagem ou localização digitada livremente para analytics.

Ferramentas recomendadas: recursos nativos do projeto, Playwright e axe já instalados para verificações focadas; Search Console e PageSpeed Insights para a publicação real; ferramenta de analytics somente após decidir a conta, o escopo de dados e as preferências aplicáveis. Evitar novas dependências de frontend neste trabalho.

## 11. Registro da entrega

### Implementação local concluída; validação final em andamento

As mudanças abaixo estão no projeto local. A publicação na hospedagem e a substituição do catálogo demonstrativo não fazem parte deste registro de conclusão.

- **Busca e navegação:** painel de busca mais legível na hero, `datalist` formado com localizações de anúncios publicados, tipo e tetos de R$ 500 mil, R$ 1 milhão, R$ 2 milhões e R$ 5 milhões. As tags implementadas cobrem compra de casa, apartamento, fazenda, teto de R$ 5 milhões e aluguel. Os parâmetros `q`, `type`, `max`, `minArea` e `region` permanecem na URL. Não foi criado cadastro estruturado de bairros nem filtro mínimo de preço; valores em USD não entram no teto em BRL.
- **Visitas:** botão “Agendar visita” em todos os cards públicos reaproveita o fluxo de contatos e a API de leads. A data indicada é uma preferência para retorno da equipe, sujeita a confirmação; o envio não reserva um horário automaticamente.
- **WhatsApp:** botão flutuante nas páginas públicas; oculto na administração e quando a configuração está vazia ou inválida. Na página do imóvel, a mensagem inclui título e link do anúncio. O clique abre a conversa e não comprova envio de mensagem ou captura de lead no painel.
- **Conteúdo:** novo texto de Sobre e resumo na home nos cinco idiomas da interface. O módulo de prova social usa listas inicialmente vazias e condiciona a publicação de relatos e marcas a consentimento/autorização; não há depoimentos, clientes ou parcerias fictícios na interface.
- **Imagens:** alternativas factuais com identificação do anúncio, local e índice da foto, sem inferência de cômodos ou acabamentos. A imagem decorativa da hero usa `alt=""`. Não foi acrescentado campo editorial por foto ao cadastro; a estratégia da seção 8 continua como evolução.
- **SEO técnico:** `/buscar` recebe HTML renderizado no servidor com H1, H2, H3, metadados e canonical normalizada. URLs filtradas recebem `noindex,follow`. O título do documento preserva o contexto de anúncio e listagem na navegação. As rotas `/imoveis/cidade/...` da seção 7 não foram criadas nesta entrega.
- **Eventos:** a interface emite `CustomEvent` em `window` com o nome `confianza:conversion` e `detail` no formato `{name, propertyId}`. Os nomes disponíveis são `search_submitted`, `whatsapp_click`, `visit_request_open` e `visit_request_sent`. Nenhum provedor de analytics foi configurado; os eventos não significam coleta persistente. A tabela da seção 10 é uma proposta de mensuração futura, mais ampla que estes eventos locais.

### Validação registrada até este momento

Passaram **26 de 26 testes de servidor em `test.mjs`** e **8 de 8 verificações locais de SEO**, incluídos na suíte final de **109/109**. Os cinco novos testes de navegador e o build também passaram. A conferência em dispositivos físicos, a medição na hospedagem e a validação dos dados comerciais continuam dependentes do ambiente real.

### Evoluções ainda propostas

As páginas locais com URLs editoriais, os bairros estruturados, a descrição editorial individual das fotos, os depoimentos e parceiros reais e a integração de mensuração permanecem como próximos incrementos. Os snippets deste documento são exemplos de referência; o código integrado pode usar a estrutura já existente do projeto.

Validação final adicional: `npm test` passou **109/109**, e a suíte `tests/e2e/conversion.spec.mjs` passou **5/5**, incluindo verificação com axe e navegação em 1440 e 390 px. Build de **91 arquivos JavaScript** aprovado. A release é **1.5.0-rc.1**, para upload e homologação; Smoke do ZIP com instalação limpa, build e início isolado também passou. MySQL e o gate completo permanecem pendentes. Consulte [notas da release](../ENTREGA-1.5.0-rc.1.md) e [instruções de upload](../UPLOAD-1.5.0-rc.1.md).

### Fontes primárias consultadas em 16/10/2026

- [Google Search Central: títulos nos resultados](https://developers.google.com/search/docs/appearance/title-link)
- [Google Search Central: SEO para imagens e texto alternativo](https://developers.google.com/search/docs/appearance/google-images)
- [Google Crawling Infrastructure: navegação facetada](https://developers.google.com/crawling/docs/faceted-navigation)
- [Google Search Central: políticas de spam e doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies#doorway-abuse)

Referências locais: `README.md`, `package.json`, `core/seed.json`, `core/default-settings.json`, `server.mjs` e `public/portal/app.js`. As páginas de documentação consultadas orientam as recomendações técnicas; as estimativas e escolhas de UX são propostas para este projeto, não promessas de aumento de vendas ou de posição no Google.
