# Plano de melhorias — Confianza Imobiliária

Data: 15/10/2026. Base analisada: versão 1.0.3.

## Ajuste de canal — versão 1.2.1

O usuário definiu **e-mail inicialmente, WhatsApp na próxima etapa**, usando **Hostinger Email**. O transporte SMTP e a preferência individual foram implementados sobre a fila, com **52 testes aprovados** e envio real desativado. Modelo ajustado para `smtp.hostinger.com:465` com TLS. Remetente, credenciais do servidor e destinatário de teste ainda precisam ser definidos antes da ativação. Detalhes: [ENTREGA-1.2.1.md](ENTREGA-1.2.1.md). A opção de navegador permanece alternativa; WhatsApp automático ainda não está implementado.

## Execução complementar — versão 1.2.0

Compartilhamento de PDF salvo, notificações opcionais do navegador e os testes de aceite restantes foram concluídos localmente. Build e **46 testes** aprovados; MySQL 8.4.11 validado com **22 testes da API**, backup/restauração, compatibilidade com schema anterior, fotos, recuperação de MFA e preflight. Foram executados **14 cenários de aceite** no navegador. Detalhes e pendências operacionais: [ENTREGA-1.2.0.md](ENTREGA-1.2.0.md).

O JavaScript público foi comparado byte a byte com o pacote 1.0.3, mantido como referência de reversão. Configurações públicas conferidas: telefone, e-mail e endereço vazios; WhatsApp cadastrado; modo demonstrativo ativo. A consulta autenticada à Hostinger expirou após 300 segundos, portanto banco/backup de produção, variáveis do hPanel e publicação permanecem abertos. Testes em aparelhos físicos e impressão também permanecem abertos.

As condições de renderização PDF no servidor foram resolvidas mantendo **Imprimir / Salvar como PDF**: não se aplica renderizador de servidor a esta entrega. O compartilhamento nativo usa o PDF salvo e selecionado pelo usuário, com fallback e nome `ID-idioma.pdf`. Notificações usam consentimento individual, canal de navegador sem provedor pago, configuração inicialmente desativada e modo de teste.

## Histórico: execução em 15/10/2026 — versão 1.1.0

As funções das etapas 1 a 6 da ordem recomendada foram implementadas localmente. A etapa 7 (notificações externas) continua opcional, dependendo do provedor e da autorização de envio. Detalhes, evidências e procedimentos estão em [ENTREGA-1.1.0.md](ENTREGA-1.1.0.md).

Build e 36 testes aprovados, incluindo backup/restauração SQLite, permissões e concorrência. Conferência em Chrome e Edge com apresentações de uma, duas e 19 páginas; os cinco idiomas foram gerados. Teste de viewport móvel realizado; aparelhos físicos e MySQL ainda precisam ser validados. Os itens de produção abaixo permanecem abertos até a conferência real na Hostinger.

Este documento é um roteiro de implementação. As tarefas abaixo são propostas; os itens desmarcados ainda precisam ser executados e validados. A prioridade inicial é a apresentação comercial dos imóveis, seguida do acompanhamento dos clientes e da operação.

## 1. Base existente e cuidados para evoluir

O projeto já possui catálogo, galeria, cinco idiomas, favoritos, comparação rural, apresentação imprimível, contato público, equipe com permissões, MFA administrativo, auditoria, visitas, responsáveis por contatos, lembretes internos, comissões e backup criptografado.

As próximas entregas devem ampliar essas funções, evitando recriar estruturas existentes. O PDF atual é produzido pela impressão do navegador; ainda não é um arquivo gerado diretamente pelo servidor. A repetição do cabeçalho de impressão da versão 1.0.3 precisa de conferência visual em documentos com várias páginas.

- [x] Conferir a versão da interface pública e registrar o pacote anterior para reversão: fonte corresponde byte a byte ao ZIP 1.0.3.
- [ ] Confirmar a versão do backend e o deployment ativo pela conta Hostinger.
- [ ] Confirmar que o banco usado é o banco de produção esperado.
- [ ] Fazer backup antes de qualquer migração e testar a restauração em ambiente separado.
- [x] Preservar as chaves de MFA e backup existentes.
- [ ] Remover BOOTSTRAP_ADMIN_PASSWORD do hPanel após o cadastro administrativo inicial.
- [ ] Trocar a senha inicial compartilhada e concluir o cadastro do autenticador.
- [x] Usar dados fictícios no ambiente de teste.

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

1. [x] Conferir os dados públicos em Configurações: nome, subtítulo, telefone, WhatsApp, e-mail e endereço.
2. [x] Manter inicialmente o logo existente; se houver logo personalizado, definir formato, tamanho e fallback antes de adicionar upload.
3. [x] Separar a montagem da apresentação de `public/portal/app.js` em um módulo próprio para facilitar manutenção.
4. [x] Definir papel A4, margens e área reservada para o cabeçalho recorrente.
5. [x] Exibir logo, nome e título do imóvel no cabeçalho.
6. [x] Exibir contatos cadastrados sem deixar separadores vazios quando algum campo estiver ausente.
7. [x] Tratar nomes longos, títulos extensos e e-mails que precisam quebrar linha.
8. [x] Ocultar botões e controles na impressão.
9. [x] Aguardar fontes e imagens antes de liberar a impressão, com mensagem para imagens indisponíveis.
10. [x] Verificar se tabelas e elementos longos fragmentam corretamente sem sobrepor cabeçalho e conteúdo.

### Validação de aceite

- [x] Gerar materiais de uma, duas e pelo menos cinco páginas.
- [x] Conferir a repetição de logo, nome, título e contato em todas as páginas.
- [x] Conferir início e fim de cada página, sem cortes ou sobreposição.
- [x] Conferir Chrome e Edge no computador e prévia em viewport móvel.
- [ ] Conferir navegadores em aparelhos móveis reais.
- [x] Conferir apresentação com contato incompleto, nome longo e imagem ausente.

## 4. Galeria de fotos no PDF

### Passo a passo

1. [x] Reutilizar a imagem principal e o campo `gallery` do imóvel.
2. [x] Remover duplicações entre capa e galeria.
3. [x] Permitir escolher quais fotos entram na apresentação e sua ordem.
4. [x] Adicionar legendas opcionais, com validação de tamanho e escape de conteúdo.
5. [x] Usar capa de destaque e páginas internas com uma ou duas fotos conforme proporção.
6. [x] Evitar corte de informações importantes; oferecer enquadramento adequado para fotos verticais.
7. [x] Definir limite de fotos e orientar sobre impacto no tamanho do arquivo.
8. [x] Carregar imagens em resolução adequada para impressão sem exigir os originais completos.
9. [x] Mostrar estado de carregamento e permitir tentar novamente em caso de falha.

### Validação de aceite

- [x] Testar imóvel sem galeria, com uma foto e com a quantidade máxima suportada.
- [x] Testar imagens verticais, horizontais e URLs externas indisponíveis.
- [x] Confirmar que legendas permanecem próximas das fotos.
- [x] Medir tempo de preparação e tamanho do PDF em um exemplo representativo.

## 5. Ficha técnica comercial

### Passo a passo

1. [x] Listar os campos públicos já disponíveis para imóveis urbanos e rurais.
2. [x] Separar seções: identificação, localização, preço, áreas, estrutura e características.
3. [x] Para imóveis urbanos, mostrar quartos, banheiros, vagas e áreas somente quando cadastrados.
4. [x] Para imóveis rurais, mostrar uso da terra, infraestrutura, solo e clima quando informados.
5. [x] Preservar moeda e unidade de área; não converter valores implicitamente.
6. [x] Respeitar a opção Preço sob consulta.
7. [x] Omitir campos vazios e distinguir informação ausente de valor zero.
8. [x] Preservar parágrafos da descrição e permitir quebra entre páginas.
9. [x] Excluir dados internos: comissões, regras privadas de operação, contatos de clientes e auditoria.

### Validação de aceite

- [x] Comparar a ficha com o anúncio público do mesmo imóvel.
- [x] Testar uma casa, apartamento, terreno e fazenda com dados diferentes.
- [x] Confirmar que nenhum campo interno aparece no HTML ou PDF gerado.

## 6. QR Code do anúncio

### Passo a passo

1. [x] Montar a URL canônica com PUBLIC_ORIGIN e `/imovel/ID`.
2. [x] Gerar o QR Code com a dependência `qrcode` já utilizada no projeto.
3. [x] Usar uma rota ou função específica para o QR comercial, separada do QR de MFA.
4. [x] Inserir QR Code com margem branca, contraste e tamanho que permitam leitura em papel.
5. [x] Incluir uma URL textual alternativa e uma legenda no idioma escolhido.
6. [x] Usar apenas URL pública, sem tokens de sessão ou dados pessoais do cliente.
7. [x] Definir o comportamento para imóvel arquivado: página informativa ou resposta de indisponibilidade, sem revelar rascunhos.

### Validação de aceite

- [ ] Ler o QR na tela e em uma impressão usando Android e iPhone disponíveis.
- [x] Confirmar que abre exatamente o imóvel correto no domínio de produção.
- [x] Testar anúncio indisponível e URL com caracteres escapados.

## 7. Corretor responsável na apresentação

### Passo a passo

1. [x] Definir se o responsável é fixo do imóvel ou escolhido apenas para a apresentação.
2. [x] Adicionar perfil público com nome comercial, WhatsApp e e-mail profissional.
3. [x] Separar explicitamente perfil público de dados internos da conta da equipe.
4. [x] Permitir ao administrador definir quais corretores podem aparecer no material.
5. [x] Selecionar o corretor na preparação da apresentação.
6. [x] Usar os contatos gerais da imobiliária quando não houver corretor selecionado.
7. [x] Mostrar apenas os dados públicos necessários, nunca permissões, senha, MFA ou histórico da conta.
8. [x] Validar telefone com país e DDD antes de montar links de WhatsApp.
9. [x] Tratar corretor desativado sem impedir geração com contato geral.

### Validação de aceite

- [x] Gerar o mesmo imóvel com dois corretores e conferir o contato em todas as páginas.
- [x] Testar corretor sem telefone e conta desativada.
- [x] Confirmar autorização no servidor para consultar e alterar os perfis.

## 8. Apresentação nos cinco idiomas

### Passo a passo

1. [x] Reutilizar português, espanhol, inglês, italiano e alemão já disponíveis no site.
2. [x] Aplicar o idioma escolhido a botões, legendas, títulos de seção e avisos.
3. [x] Reutilizar traduções do título, descrição e características do imóvel.
4. [x] Mostrar aviso claro quando houver conteúdo disponível apenas no idioma original.
5. [x] Formatar números e datas conforme o idioma, preservando a moeda do anúncio.
6. [x] Preservar nomes próprios, endereços, telefone e marca.
7. [x] Definir nome do arquivo com identificação do imóvel e idioma, se houver download direto.

### Validação de aceite

- [x] Conferir um PDF em cada idioma.
- [x] Testar conteúdo sem tradução e textos longos em alemão.
- [x] Confirmar acentos e caracteres especiais no PDF.

## 9. Preparação e download da apresentação

### Passo a passo

1. [x] Abrir uma tela de preparação ao selecionar Baixar apresentação.
2. [x] Oferecer idioma, corretor, fotos e inclusão de preço.
3. [x] Mostrar prévia com os mesmos dados e identidade usados na impressão.
4. [x] Manter escolhas enquanto a prévia estiver aberta.
5. [x] Exibir progresso durante o carregamento das imagens.
6. [x] Diferenciar o fluxo atual “Imprimir / Salvar como PDF” de um futuro download direto.
7. [x] Caso seja necessário download direto, avaliar um renderizador de PDF compatível com o plano Hostinger antes de adotar uma dependência.
8. [x] Na opção de servidor, limitar tempo, memória, quantidade de imagens e requisições externas; bloquear acesso a endereços internos e arquivos locais.
9. [x] Não registrar uma venda ou um envio concluído apenas porque o usuário abriu a impressão.

### Validação de aceite

- [x] Testar janela bloqueada pelo navegador, cancelamento e nova tentativa.
- [x] Testar navegação por teclado e nomes acessíveis dos controles.
- [x] Confirmar que a prévia corresponde ao arquivo salvo.

## 10. Central de pendências do atendimento

### Passo a passo

1. [x] Reutilizar os campos de responsável e `followUpAt` já presentes nos contatos.
2. [x] Criar uma visão com retornos vencidos, de hoje, futuros e sem responsável.
3. [x] Mostrar contagens e filtros por responsável e etapa.
4. [x] Permitir concluir ou reagendar o retorno usando a API existente.
5. [x] Registrar autor e data das alterações no histórico.
6. [x] Destacar vencimento por texto e ícone, além da cor.
7. [x] Aplicar as permissões da equipe também no servidor.
8. [x] Definir o fuso utilizado para determinar “hoje” e explicar isso na interface.

### Validação de aceite

- [x] Testar retorno vencido, futuro, concluído e contato sem responsável.
- [x] Confirmar que reagendar remove o contato da lista de vencidos.
- [x] Testar fusos diferentes e mudanças perto da meia-noite.
- [x] Confirmar atualização concorrente sem sobrescrever alterações de outro usuário.

## 11. Visitas próximas e acompanhamento

### Passo a passo

1. [x] Reutilizar o calendário e os estados existentes: Solicitada, Confirmada, Realizada e Cancelada.
2. [x] Adicionar listas de próximas visitas por dia, imóvel e responsável.
3. [x] Mostrar solicitações aguardando aviso ao proprietário ou confirmação.
4. [x] Preservar as regras de antecedência, fuso, bloqueios e intervalo entre visitas.
5. [x] Manter registro do aviso ao proprietário sem tratá-lo como mensagem enviada pelo sistema.
6. [x] Permitir acesso rápido ao contato associado e ao histórico da visita.
7. [x] Definir tratamento de visitas passadas ainda abertas, sem concluir automaticamente.

### Validação de aceite

- [x] Testar conflito de horário e reagendamento concorrente.
- [x] Confirmar que visita cancelada sai das próximas visitas.
- [x] Conferir horário da propriedade e horário exibido ao usuário.

## 12. Compartilhamento comercial e histórico

### Passo a passo

1. [x] Criar mensagem com título, localização, preço público quando permitido e link do anúncio.
2. [x] Usar o idioma escolhido e o contato do corretor quando cadastrado.
3. [x] Adicionar Copiar mensagem e Abrir WhatsApp.
4. [x] Para compartilhar arquivo, detectar suporte ao compartilhamento nativo e manter alternativa de salvar o PDF.
5. [x] Registrar somente eventos observáveis, como apresentação gerada ou compartilhamento iniciado.
6. [x] Não marcar “enviado”, “entregue” ou “lido” sem confirmação confiável do provedor.
7. [x] Quando associado a um contato, incluir autor, imóvel, data e idioma no histórico interno.

### Validação de aceite

- [x] Testar a mensagem e a abertura de WhatsApp no fluxo desktop e em viewport móvel, com interceptação do destino sem envio.
- [ ] Conferir WhatsApp e compartilhamento nativo nos aplicativos reais do computador e do celular.
- [x] Conferir acentos, quebras de linha e links na mensagem.
- [x] Confirmar que cancelar o compartilhamento não cria registro de entrega.

## 13. Relatórios operacionais

### Passo a passo

1. [x] Definir indicadores: contatos por etapa, retornos vencidos, visitas solicitadas, confirmadas e realizadas.
2. [x] Definir período e critérios de contagem para evitar indicadores ambíguos.
3. [x] Adicionar filtros por responsável, imóvel e intervalo de datas.
4. [x] Reutilizar histórico para métricas que dependem de movimentações.
5. [x] Mostrar limitações quando registros antigos não possuem histórico suficiente.
6. [x] Separar comissão prevista, aprovada e paga usando os estados existentes.
7. [x] Respeitar permissões específicas para valores de comissão.
8. [x] Oferecer exportação CSV com proteção contra fórmulas.

### Validação de aceite

- [x] Conferir totais contra um conjunto conhecido de registros.
- [x] Testar período sem dados e filtros combinados.
- [x] Confirmar que usuários sem permissão não recebem valores restritos pela API.

## 14. Notificações externas — etapa opcional

Esta etapa depende de escolha de provedor, conta, custos e autorização para envio. O sistema atual possui lembretes internos e abre conversas de WhatsApp; não envia mensagens automaticamente.

1. [x] Definir canal: e-mail, WhatsApp por provedor oficial ou notificação do navegador.
2. [x] Definir destinatário, consentimento ou preferência e evento que dispara a notificação.
3. [ ] Configurar credenciais somente no ambiente do servidor.
4. [x] Implementar fila com identificador único para evitar duplicação.
5. [x] Definir horário permitido, fuso, retentativas e limite de envio.
6. [x] Tratar cancelamento de visita e alteração de horário antes do disparo.
7. [x] Registrar estados de processamento e falha sem incluir segredos nos logs.
8. [x] Oferecer controle administrativo para ativar, pausar e testar.
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

1. [x] Selecionar uma etapa pequena com critérios de aceite definidos.
2. [x] Registrar quais dados e permissões serão alterados.
3. [x] Implementar preservando os contratos existentes sempre que possível.
4. [x] Criar migração compatível com registros antigos quando houver novos campos.
5. [x] Incluir novos dados no backup e validar a restauração.
6. [x] Executar `npm run build` e `npm test`.
7. [x] Adicionar testes relevantes para permissões, concorrência e regras novas.
8. [x] Fazer conferência visual da tela e do PDF com dados representativos.
9. [x] Validar MySQL no ambiente de teste; os testes locais com SQLite não substituem essa verificação.
10. [x] Atualizar versão, notas e instruções de operação.
11. [x] Gerar ZIP de código-fonte sem `node_modules`, bancos, uploads privados, arquivos `.env` e credenciais.
12. [x] Atualizar a referência de cache dos arquivos de interface modificados.
13. [ ] Publicar em ambiente de teste e conferir inicialização e logs.
14. [ ] Executar os critérios de aceite antes de publicar na produção.
15. [ ] Após publicar, conferir conteúdo real do site, login, MFA, fotos, formulário e apresentação.
16. [x] Preparar o procedimento de reversão e preservar pacotes anteriores; backup/restauração e compatibilidade foram testados em bancos isolados. A reversão real só se aplica se houver falha após a publicação.

## 17. Primeira entrega sugerida

Implementar as seções 3 a 6 primeiro: cabeçalho validado em todas as páginas, galeria, ficha técnica e QR Code. Usar inicialmente o contato geral da imobiliária. Depois acrescentar perfil de corretor e seleção de idioma na preparação.

### Checklist final da primeira entrega

- [x] Logo, nome, título e contato em todas as páginas.
- [x] Capa e galeria sem fotos duplicadas.
- [x] Dados públicos e preço sob consulta respeitados.
- [x] QR Code abrindo o anúncio correto.
- [x] Imagens carregadas antes de imprimir.
- [x] Nenhum dado interno no material.
- [x] PDF conferido visualmente com várias páginas.
- [x] Build, testes e validação no MySQL concluídos.
- [x] Pacote e instruções preparados para Hostinger.

## 18. Editor visual de fotos na administração de imóveis

### Objetivo

Melhorar a edição dos imóveis para gerenciar as fotos visualmente, com prévia, adição, remoção, escolha da imagem principal e ordenação da galeria. A imagem principal deve ser escolhida entre as fotos do imóvel, substituindo o campo de URL digitável na interface.

### Passo a passo

1. [x] Exibir miniaturas das fotos já cadastradas ao abrir a edição, reunindo imagem principal e galeria sem duplicações.
2. [x] Permitir ampliar cada foto para conferir sua prévia antes de salvar o imóvel.
3. [x] Adicionar novas fotos pela seleção de arquivos, com prévia local, progresso de upload e indicação de falha com opção de tentar novamente.
4. [x] Permitir remover uma foto do conjunto do imóvel, com opção de desfazer antes de salvar. Remover a associação não deve excluir o arquivo de armazenamento automaticamente, pois ele pode ser usado em outro imóvel.
5. [x] Substituir o campo de URL da imagem principal por uma seleção visual entre as fotos cadastradas ou adicionadas, identificando claramente a foto escolhida como principal.
6. [x] Se a foto principal for removida, solicitar a escolha de outra; permitir salvar sem fotos quando isso for aceito pelas regras do cadastro, usando o fallback existente.
7. [x] Permitir reordenar as fotos por arrastar e soltar e por botões de mover para frente ou para trás, acessíveis por teclado e utilizáveis no celular.
8. [x] Mostrar a posição de cada foto e preservar a ordem escolhida depois de salvar e reabrir a edição.
9. [x] Definir a imagem principal como a primeira foto da visualização pública, seguida das demais na ordem escolhida, sem repetir a capa. Aplicar a mesma ordem inicial à preparação da apresentação, mantendo sua seleção de fotos independente.
10. [x] Manter as alterações de seleção, remoção e ordem no rascunho da edição até salvar; cancelar a edição deve preservar as associações anteriormente cadastradas.
11. [x] Respeitar os formatos, tamanhos e limites de fotos existentes, com mensagens claras antes do upload e validação também no servidor.
12. [x] Reutilizar a API de uploads e os campos `image` e `gallery` para persistência, mantendo compatibilidade com fotos locais, arquivos enviados e URLs já cadastradas. As URLs continuam sendo referências internas dos arquivos, sem exigir sua digitação para escolher a imagem principal.
13. [x] Preservar as permissões de edição no servidor, evitar sobrescrever alterações concorrentes e incluir os novos controles e avisos nos cinco idiomas.

### Validação de aceite

- [x] Abrir imóveis antigos e conferir miniaturas, seleção principal e ausência de duplicações.
- [x] Testar adição, prévia ampliada, remoção, desfazer e cancelamento da edição.
- [x] Testar remoção da imagem principal, troca por outra e imóvel sem fotos.
- [x] Reordenar por mouse, teclado e toque; salvar e confirmar a mesma sequência ao reabrir a edição, no anúncio público e na preparação da apresentação.
- [x] Testar fotos verticais e horizontais, imagem indisponível, upload interrompido, arquivo inválido e limite máximo de fotos.
- [x] Confirmar que falhas de upload não permitem selecionar referências inválidas nem descartam as escolhas já feitas.
- [x] Confirmar que remover uma foto do imóvel não apaga arquivos usados em outros cadastros.
- [ ] Testar permissões, edição concorrente e persistência em SQLite e MySQL; conferir backup e restauração das referências e da ordem das fotos.

### Arquivos previstos

`public/portal/app.js` e módulo `photo-editor.js`, `public/portal/style.css`, arquivos de idiomas, `core/service.mjs` e testes de cadastro, upload e apresentação. Implementação local na versão 1.3.0. Detalhes e evidências: [ENTREGA-1.3.0.md](ENTREGA-1.3.0.md). MySQL e aparelhos físicos permanecem pendentes. Toque validado por evento sintetizado em viewport móvel; quantidade máxima e restauração das referências/ordem também cobertas pelos testes automatizados.

## 19. MFA configurável por usuário

- [x] Adicionar `mfaRequired` booleano por usuário, com controle em Equipe > Editar > Exigir MFA.
- [x] Manter o padrão existente para contas antigas e permitir exceção individual para administradores.
- [x] Revogar sessões ao alterar a exigência, preservar autenticador e registrar auditoria.
- [x] Validar permissões e fluxos de ativação/desativação em SQLite.
- [ ] Validar em MySQL e publicar na hospedagem.

Entrega local: [ENTREGA-1.3.1.md](ENTREGA-1.3.1.md).

## 20. Edição de imóveis em tela inteira

- [ ] Abrir o cadastro e a edição de imóveis em uma página dedicada que ocupe toda a área disponível da tela, substituindo o popup atual, sem exigir o modo fullscreen do navegador.
- [ ] Organizar os campos em seções claras: dados gerais, localização, descrição e traduções, fotos, publicação e informações internas.
- [ ] Manter ações de salvar, cancelar e voltar à lista facilmente acessíveis em computador e celular.
- [ ] Preservar prévias, seleção da imagem principal, reordenação das fotos e permissões existentes.
- [ ] Avisar antes de sair com alterações não salvas; em caso de erro ao salvar, manter os dados preenchidos.
- [ ] Permitir acesso direto à edição pela URL, com autenticação e autorização, e preservar filtros da listagem ao retornar.
- [ ] Validar navegação, teclado, responsividade, uploads e proteção contra edição concorrente.

## 21. Acessibilidade para a equipe

- [ ] Oferecer ajuste de tamanho da fonte e controles com áreas de toque maiores, persistindo a preferência por usuário.
- [ ] Disponibilizar uma apresentação simplificada dos formulários, com campos agrupados e explicações claras, sem retirar funcionalidades necessárias.
- [ ] Garantir contraste, foco visível, rótulos, navegação por teclado e mensagens de erro compreensíveis.
- [ ] Validar os fluxos principais em computador e celular, incluindo uso com fonte ampliada e leitor de tela.

## 22. Recuperação de senha por e-mail

- [ ] Implementar solicitação e redefinição de senha por e-mail usando o SMTP da Hostinger já previsto no projeto.
- [ ] Usar links de uso único com validade curta, armazenando somente o hash do token e aplicando limite de tentativas.
- [ ] Mostrar resposta uniforme para e-mails cadastrados e não cadastrados, evitando expor contas existentes.
- [ ] Invalidar sessões e tokens anteriores após a troca da senha, preservar a exigência individual de MFA e registrar auditoria sem segredos.
- [ ] Validar expiração, reutilização, falha de envio e recuperação para contas com e sem MFA.

## 23. Histórico e recuperação de versões dos imóveis

- [ ] Registrar quem alterou o imóvel, quando e quais campos foram modificados, incluindo preço, descrição, fotos, ordem e status.
- [ ] Exibir comparação entre versões com acesso limitado às permissões de cada usuário, protegendo informações internas.
- [ ] Permitir recuperar uma versão anterior como nova alteração, mantendo o histórico e verificando conflitos com edições recentes.
- [ ] Preservar as fotos necessárias à recuperação das versões e definir política de retenção e armazenamento.
- [ ] Validar restauração de dados e fotos, auditoria, permissões e compatibilidade com backups.

## 24. Avisos de cadastro incompleto

- [ ] Indicar campos ausentes no cadastro e na listagem, incluindo fotos, localização e descrição, com links para corrigir cada pendência.
- [ ] Diferenciar requisitos obrigatórios para publicação de recomendações de qualidade.
- [ ] Respeitar imóveis com preço sob consulta e as regras existentes para cadastros sem fotos.
- [ ] Verificar traduções e imagem principal; validar requisitos também no servidor antes da publicação.
- [ ] Permitir salvar rascunhos incompletos e apresentar mensagens claras ao tentar publicar.

## 25. Organização e acompanhamento de contatos

- [ ] Identificar possíveis interessados duplicados por e-mail e telefone normalizados e permitir revisão antes de unificar registros.
- [ ] Preservar histórico, responsáveis, consentimentos e vínculos com imóveis e visitas ao unificar contatos.
- [ ] Registrar conversas e interações, distinguindo anotações manuais de mensagens efetivamente enviadas por integração.
- [ ] Mostrar último atendimento, próxima ação e contatos sem retorno há um prazo configurável.
- [ ] Criar filtros e lembretes para contatos pendentes, evitando alertas repetidos e respeitando permissões.

## 26. Notificações por WhatsApp

- [ ] Ampliar a etapa de notificações por e-mail com envio pelo WhatsApp por integração oficial, escolhendo provedor e configurando credenciais fora do código.
- [ ] Registrar consentimento e preferência de canal, com opção de deixar de receber mensagens.
- [ ] Enviar lembretes de visitas e retornos com modelos aprovados quando exigidos pelo provedor, nos idiomas disponíveis.
- [ ] Respeitar horários, limites, cancelamentos e reagendamentos, impedindo envios duplicados.
- [ ] Registrar estados de envio e entrega conforme os retornos do provedor, com tentativas controladas e tratamento de falhas.
- [ ] Validar primeiro em modo de teste com destinatários autorizados e documentar configuração e custos antes da ativação em produção.

## 27. Painel de desempenho

- [ ] Medir consultas a imóveis e contatos recebidos por imóvel, definindo tratamento de visitas repetidas, equipe e tráfego automatizado.
- [ ] Exibir visitas agendadas e realizadas e conversão de interessados em vendas, com critérios explícitos para cada indicador.
- [ ] Oferecer filtros por período, imóvel e responsável, conforme as permissões do usuário.
- [ ] Permitir comparação entre períodos e exportação dos resultados, protegendo dados pessoais e comissões.
- [ ] Mostrar ausência de dados sem inventar métricas e validar os cálculos com registros conhecidos.

## 28. Verificação automática de backups

- [ ] Programar backups criptografados e verificações periódicas de restauração em banco e armazenamento isolados da produção.
- [ ] Conferir integridade dos registros e das fotos e registrar data, duração e resultado da última verificação.
- [ ] Exibir ao administrador o último backup criado e o último backup cuja restauração foi validada.
- [ ] Alertar sobre falha, atraso ou ausência de backup válido, utilizando os canais de notificação configurados.
- [ ] Definir retenção, espaço disponível e recuperação operacional, preservando as chaves de criptografia fora dos arquivos de backup.
- [ ] Garantir que testes de restauração nunca sobrescrevam dados de produção e validar recuperação completa antes de considerar o backup utilizável.

### Ordem sugerida para as próximas entregas

Concluir a validação em MySQL e a publicação dos itens já implementados. Depois, priorizar edição em tela inteira, acessibilidade e recuperação de senha; seguir com histórico de imóveis, avisos de cadastro incompleto e organização de contatos. Implementar WhatsApp após configurar o provedor e os consentimentos, e completar o painel de desempenho e a verificação automática de backups. Todos os itens das seções 20 a 28 estão pendentes de implementação.
