# Plano de melhorias — Confianza Imobiliária

Data: 15/10/2026. Base analisada: versão 1.0.3.

Este documento é um roteiro de implementação. As tarefas abaixo são propostas; os itens desmarcados ainda precisam ser executados e validados. A prioridade inicial é a apresentação comercial dos imóveis, seguida do acompanhamento dos clientes e da operação.

## 1. Base existente e cuidados para evoluir

O projeto já possui catálogo, galeria, cinco idiomas, favoritos, comparação rural, apresentação imprimível, contato público, equipe com permissões, MFA administrativo, auditoria, visitas, responsáveis por contatos, lembretes internos, comissões e backup criptografado.

As próximas entregas devem ampliar essas funções, evitando recriar estruturas existentes. O PDF atual é produzido pela impressão do navegador; ainda não é um arquivo gerado diretamente pelo servidor. A repetição do cabeçalho de impressão da versão 1.0.3 precisa de conferência visual em documentos com várias páginas.

- [ ] Conferir a versão publicada na Hostinger e registrar a versão anterior para reversão.
- [ ] Confirmar que o banco usado é o banco de produção esperado.
- [ ] Fazer backup antes de qualquer migração e testar a restauração em ambiente separado.
- [ ] Preservar as chaves de MFA e backup existentes.
- [ ] Remover BOOTSTRAP_ADMIN_PASSWORD do hPanel após o cadastro administrativo inicial.
- [ ] Trocar a senha inicial compartilhada e concluir o cadastro do autenticador.
- [ ] Usar dados fictícios no ambiente de teste.

## 2. Ordem recomendada

| Etapa | Entrega | Prioridade | Dependência |
| --- | --- | --- | --- |
| 1 | PDF com identidade, galeria e ficha técnica | Alta | Cadastro dos imóveis e dados da imobiliária |
| 2 | QR Code e corretor responsável no material | Alta | Perfil público do corretor |
| 3 | Apresentação nos cinco idiomas | Alta | Conteúdo traduzido por imóvel |
| 4 | Central de pendências e visitas próximas | Alta | Lembretes e visitas existentes |
| 5 | Compartilhamento comercial e histórico | Média | Apresentação e contatos |
| 6 | Relatórios de atendimento e comissões | Média | Dados operacionais consistentes |
| 7 | Notificações externas opcionais | Posterior | Escolha e configuração de provedor |

## 3. Apresentação com identidade em todas as páginas

### Objetivo

Entregar um documento legível com logo, nome da imobiliária, título do imóvel e contato em cada página.

### Passo a passo

1. [ ] Conferir os dados públicos em Configurações: nome, subtítulo, telefone, WhatsApp, e-mail e endereço.
2. [ ] Manter inicialmente o logo existente; se houver logo personalizado, definir formato, tamanho e fallback antes de adicionar upload.
3. [ ] Separar a montagem da apresentação de `public/portal/app.js` em um módulo próprio para facilitar manutenção.
4. [ ] Definir papel A4, margens e área reservada para o cabeçalho recorrente.
5. [ ] Exibir logo, nome e título do imóvel no cabeçalho.
6. [ ] Exibir contatos cadastrados sem deixar separadores vazios quando algum campo estiver ausente.
7. [ ] Tratar nomes longos, títulos extensos e e-mails que precisam quebrar linha.
8. [ ] Ocultar botões e controles na impressão.
9. [ ] Aguardar fontes e imagens antes de liberar a impressão, com mensagem para imagens indisponíveis.
10. [ ] Verificar se tabelas e elementos longos fragmentam corretamente sem sobrepor cabeçalho e conteúdo.

### Validação de aceite

- [ ] Gerar materiais de uma, duas e pelo menos cinco páginas.
- [ ] Conferir a repetição de logo, nome, título e contato em todas as páginas.
- [ ] Conferir início e fim de cada página, sem cortes ou sobreposição.
- [ ] Conferir Chrome e Edge no computador e prévia nos navegadores móveis disponíveis.
- [ ] Conferir apresentação com contato incompleto, nome longo e imagem ausente.

## 4. Galeria de fotos no PDF

### Passo a passo

1. [ ] Reutilizar a imagem principal e o campo `gallery` do imóvel.
2. [ ] Remover duplicações entre capa e galeria.
3. [ ] Permitir escolher quais fotos entram na apresentação e sua ordem.
4. [ ] Adicionar legendas opcionais, com validação de tamanho e escape de conteúdo.
5. [ ] Usar capa de destaque e páginas internas com uma ou duas fotos conforme proporção.
6. [ ] Evitar corte de informações importantes; oferecer enquadramento adequado para fotos verticais.
7. [ ] Definir limite de fotos e orientar sobre impacto no tamanho do arquivo.
8. [ ] Carregar imagens em resolução adequada para impressão sem exigir os originais completos.
9. [ ] Mostrar estado de carregamento e permitir tentar novamente em caso de falha.

### Validação de aceite

- [ ] Testar imóvel sem galeria, com uma foto e com a quantidade máxima suportada.
- [ ] Testar imagens verticais, horizontais e URLs externas indisponíveis.
- [ ] Confirmar que legendas permanecem próximas das fotos.
- [ ] Medir tempo de preparação e tamanho do PDF em um exemplo representativo.

## 5. Ficha técnica comercial

### Passo a passo

1. [ ] Listar os campos públicos já disponíveis para imóveis urbanos e rurais.
2. [ ] Separar seções: identificação, localização, preço, áreas, estrutura e características.
3. [ ] Para imóveis urbanos, mostrar quartos, banheiros, vagas e áreas somente quando cadastrados.
4. [ ] Para imóveis rurais, mostrar uso da terra, infraestrutura, solo e clima quando informados.
5. [ ] Preservar moeda e unidade de área; não converter valores implicitamente.
6. [ ] Respeitar a opção Preço sob consulta.
7. [ ] Omitir campos vazios e distinguir informação ausente de valor zero.
8. [ ] Preservar parágrafos da descrição e permitir quebra entre páginas.
9. [ ] Excluir dados internos: comissões, regras privadas de operação, contatos de clientes e auditoria.

### Validação de aceite

- [ ] Comparar a ficha com o anúncio público do mesmo imóvel.
- [ ] Testar uma casa, apartamento, terreno e fazenda com dados diferentes.
- [ ] Confirmar que nenhum campo interno aparece no HTML ou PDF gerado.

## 6. QR Code do anúncio

### Passo a passo

1. [ ] Montar a URL canônica com PUBLIC_ORIGIN e `/imovel/ID`.
2. [ ] Gerar o QR Code com a dependência `qrcode` já utilizada no projeto.
3. [ ] Usar uma rota ou função específica para o QR comercial, separada do QR de MFA.
4. [ ] Inserir QR Code com margem branca, contraste e tamanho que permitam leitura em papel.
5. [ ] Incluir uma URL textual alternativa e uma legenda no idioma escolhido.
6. [ ] Usar apenas URL pública, sem tokens de sessão ou dados pessoais do cliente.
7. [ ] Definir o comportamento para imóvel arquivado: página informativa ou resposta de indisponibilidade, sem revelar rascunhos.

### Validação de aceite

- [ ] Ler o QR na tela e em uma impressão usando Android e iPhone disponíveis.
- [ ] Confirmar que abre exatamente o imóvel correto no domínio de produção.
- [ ] Testar anúncio indisponível e URL com caracteres escapados.

## 7. Corretor responsável na apresentação

### Passo a passo

1. [ ] Definir se o responsável é fixo do imóvel ou escolhido apenas para a apresentação.
2. [ ] Adicionar perfil público com nome comercial, WhatsApp e e-mail profissional.
3. [ ] Separar explicitamente perfil público de dados internos da conta da equipe.
4. [ ] Permitir ao administrador definir quais corretores podem aparecer no material.
5. [ ] Selecionar o corretor na preparação da apresentação.
6. [ ] Usar os contatos gerais da imobiliária quando não houver corretor selecionado.
7. [ ] Mostrar apenas os dados públicos necessários, nunca permissões, senha, MFA ou histórico da conta.
8. [ ] Validar telefone com país e DDD antes de montar links de WhatsApp.
9. [ ] Tratar corretor desativado sem impedir geração com contato geral.

### Validação de aceite

- [ ] Gerar o mesmo imóvel com dois corretores e conferir o contato em todas as páginas.
- [ ] Testar corretor sem telefone e conta desativada.
- [ ] Confirmar autorização no servidor para consultar e alterar os perfis.

## 8. Apresentação nos cinco idiomas

### Passo a passo

1. [ ] Reutilizar português, espanhol, inglês, italiano e alemão já disponíveis no site.
2. [ ] Aplicar o idioma escolhido a botões, legendas, títulos de seção e avisos.
3. [ ] Reutilizar traduções do título, descrição e características do imóvel.
4. [ ] Mostrar aviso claro quando houver conteúdo disponível apenas no idioma original.
5. [ ] Formatar números e datas conforme o idioma, preservando a moeda do anúncio.
6. [ ] Preservar nomes próprios, endereços, telefone e marca.
7. [ ] Definir nome do arquivo com identificação do imóvel e idioma, se houver download direto.

### Validação de aceite

- [ ] Conferir um PDF em cada idioma.
- [ ] Testar conteúdo sem tradução e textos longos em alemão.
- [ ] Confirmar acentos e caracteres especiais no PDF.

## 9. Preparação e download da apresentação

### Passo a passo

1. [ ] Abrir uma tela de preparação ao selecionar Baixar apresentação.
2. [ ] Oferecer idioma, corretor, fotos e inclusão de preço.
3. [ ] Mostrar prévia com os mesmos dados e identidade usados na impressão.
4. [ ] Manter escolhas enquanto a prévia estiver aberta.
5. [ ] Exibir progresso durante o carregamento das imagens.
6. [ ] Diferenciar o fluxo atual “Imprimir / Salvar como PDF” de um futuro download direto.
7. [ ] Caso seja necessário download direto, avaliar um renderizador de PDF compatível com o plano Hostinger antes de adotar uma dependência.
8. [ ] Na opção de servidor, limitar tempo, memória, quantidade de imagens e requisições externas; bloquear acesso a endereços internos e arquivos locais.
9. [ ] Não registrar uma venda ou um envio concluído apenas porque o usuário abriu a impressão.

### Validação de aceite

- [ ] Testar janela bloqueada pelo navegador, cancelamento e nova tentativa.
- [ ] Testar navegação por teclado e nomes acessíveis dos controles.
- [ ] Confirmar que a prévia corresponde ao arquivo salvo.

## 10. Central de pendências do atendimento

### Passo a passo

1. [ ] Reutilizar os campos de responsável e `followUpAt` já presentes nos contatos.
2. [ ] Criar uma visão com retornos vencidos, de hoje, futuros e sem responsável.
3. [ ] Mostrar contagens e filtros por responsável e etapa.
4. [ ] Permitir concluir ou reagendar o retorno usando a API existente.
5. [ ] Registrar autor e data das alterações no histórico.
6. [ ] Destacar vencimento por texto e ícone, além da cor.
7. [ ] Aplicar as permissões da equipe também no servidor.
8. [ ] Definir o fuso utilizado para determinar “hoje” e explicar isso na interface.

### Validação de aceite

- [ ] Testar retorno vencido, futuro, concluído e contato sem responsável.
- [ ] Confirmar que reagendar remove o contato da lista de vencidos.
- [ ] Testar fusos diferentes e mudanças perto da meia-noite.
- [ ] Confirmar atualização concorrente sem sobrescrever alterações de outro usuário.

## 11. Visitas próximas e acompanhamento

### Passo a passo

1. [ ] Reutilizar o calendário e os estados existentes: Solicitada, Confirmada, Realizada e Cancelada.
2. [ ] Adicionar listas de próximas visitas por dia, imóvel e responsável.
3. [ ] Mostrar solicitações aguardando aviso ao proprietário ou confirmação.
4. [ ] Preservar as regras de antecedência, fuso, bloqueios e intervalo entre visitas.
5. [ ] Manter registro do aviso ao proprietário sem tratá-lo como mensagem enviada pelo sistema.
6. [ ] Permitir acesso rápido ao contato associado e ao histórico da visita.
7. [ ] Definir tratamento de visitas passadas ainda abertas, sem concluir automaticamente.

### Validação de aceite

- [ ] Testar conflito de horário e reagendamento concorrente.
- [ ] Confirmar que visita cancelada sai das próximas visitas.
- [ ] Conferir horário da propriedade e horário exibido ao usuário.

## 12. Compartilhamento comercial e histórico

### Passo a passo

1. [ ] Criar mensagem com título, localização, preço público quando permitido e link do anúncio.
2. [ ] Usar o idioma escolhido e o contato do corretor quando cadastrado.
3. [ ] Adicionar Copiar mensagem e Abrir WhatsApp.
4. [ ] Para compartilhar arquivo, detectar suporte ao compartilhamento nativo e manter alternativa de salvar o PDF.
5. [ ] Registrar somente eventos observáveis, como apresentação gerada ou compartilhamento iniciado.
6. [ ] Não marcar “enviado”, “entregue” ou “lido” sem confirmação confiável do provedor.
7. [ ] Quando associado a um contato, incluir autor, imóvel, data e idioma no histórico interno.

### Validação de aceite

- [ ] Testar WhatsApp no computador e no celular.
- [ ] Conferir acentos, quebras de linha e links na mensagem.
- [ ] Confirmar que cancelar o compartilhamento não cria registro de entrega.

## 13. Relatórios operacionais

### Passo a passo

1. [ ] Definir indicadores: contatos por etapa, retornos vencidos, visitas solicitadas, confirmadas e realizadas.
2. [ ] Definir período e critérios de contagem para evitar indicadores ambíguos.
3. [ ] Adicionar filtros por responsável, imóvel e intervalo de datas.
4. [ ] Reutilizar histórico para métricas que dependem de movimentações.
5. [ ] Mostrar limitações quando registros antigos não possuem histórico suficiente.
6. [ ] Separar comissão prevista, aprovada e paga usando os estados existentes.
7. [ ] Respeitar permissões específicas para valores de comissão.
8. [ ] Oferecer exportação CSV com proteção contra fórmulas.

### Validação de aceite

- [ ] Conferir totais contra um conjunto conhecido de registros.
- [ ] Testar período sem dados e filtros combinados.
- [ ] Confirmar que usuários sem permissão não recebem valores restritos pela API.

## 14. Notificações externas — etapa opcional

Esta etapa depende de escolha de provedor, conta, custos e autorização para envio. O sistema atual possui lembretes internos e abre conversas de WhatsApp; não envia mensagens automaticamente.

1. [ ] Definir canal: e-mail, WhatsApp por provedor oficial ou notificação do navegador.
2. [ ] Definir destinatário, consentimento ou preferência e evento que dispara a notificação.
3. [ ] Configurar credenciais somente no ambiente do servidor.
4. [ ] Implementar fila com identificador único para evitar duplicação.
5. [ ] Definir horário permitido, fuso, retentativas e limite de envio.
6. [ ] Tratar cancelamento de visita e alteração de horário antes do disparo.
7. [ ] Registrar estados de processamento e falha sem incluir segredos nos logs.
8. [ ] Oferecer controle administrativo para ativar, pausar e testar.
9. [ ] Validar primeiro com destinatários de teste e confirmar custos antes da ativação real.

## 15. Arquivos e áreas de implementação

| Área | Arquivos atuais | Trabalho previsto |
| --- | --- | --- |
| Apresentação e administração | `public/portal/app.js` | Preparação, prévia e extração do módulo de apresentação |
| Estilos | `public/portal/style.css` | Tela de preparação e consistência visual |
| Idiomas | `public/portal/i18n.js` e módulos de idiomas | Novos textos e avisos |
| Contrato da API | `core/service.mjs` | Perfil público e validações necessárias |
| Visitas e atendimento | `core/operations.mjs`, `core/enhancements.mjs` | Reutilizar regras existentes |
| Interface operacional | `public/portal/operations.js`, `public/portal/enhancements.js` | Pendências e visitas próximas |
| Servidor | `server.mjs` | Rotas, persistência e QR comercial se necessário |
| Backup | `backup.mjs` | Incluir qualquer novo dado persistido |
| Testes | Arquivos `*.test.mjs` e `test.mjs` | Cobertura de comportamento, acesso e migrações |

## 16. Procedimento por entrega

1. [ ] Selecionar uma etapa pequena com critérios de aceite definidos.
2. [ ] Registrar quais dados e permissões serão alterados.
3. [ ] Implementar preservando os contratos existentes sempre que possível.
4. [ ] Criar migração compatível com registros antigos quando houver novos campos.
5. [ ] Incluir novos dados no backup e validar a restauração.
6. [ ] Executar `npm run build` e `npm test`.
7. [ ] Adicionar testes relevantes para permissões, concorrência e regras novas.
8. [ ] Fazer conferência visual da tela e do PDF com dados representativos.
9. [ ] Validar MySQL no ambiente de teste; os testes locais com SQLite não substituem essa verificação.
10. [ ] Atualizar versão, notas e instruções de operação.
11. [ ] Gerar ZIP de código-fonte sem `node_modules`, bancos, uploads privados, arquivos `.env` e credenciais.
12. [ ] Atualizar a referência de cache dos arquivos de interface modificados.
13. [ ] Publicar em ambiente de teste e conferir inicialização e logs.
14. [ ] Executar os critérios de aceite antes de publicar na produção.
15. [ ] Após publicar, conferir conteúdo real do site, login, MFA, fotos, formulário e apresentação.
16. [ ] Em falha, restaurar a versão compatível; qualquer reversão de banco deve seguir o plano testado e preservar alterações recentes.

## 17. Primeira entrega sugerida

Implementar as seções 3 a 6 primeiro: cabeçalho validado em todas as páginas, galeria, ficha técnica e QR Code. Usar inicialmente o contato geral da imobiliária. Depois acrescentar perfil de corretor e seleção de idioma na preparação.

### Checklist final da primeira entrega

- [ ] Logo, nome, título e contato em todas as páginas.
- [ ] Capa e galeria sem fotos duplicadas.
- [ ] Dados públicos e preço sob consulta respeitados.
- [ ] QR Code abrindo o anúncio correto.
- [ ] Imagens carregadas antes de imprimir.
- [ ] Nenhum dado interno no material.
- [ ] PDF conferido visualmente com várias páginas.
- [ ] Build, testes e validação no MySQL concluídos.
- [ ] Pacote e instruções preparados para Hostinger.
