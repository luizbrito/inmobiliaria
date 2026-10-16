# Plano de melhorias — Confianza Imobiliária

Data: 15/10/2026. Base analisada: versão 1.0.3.

## Execução local — versão 1.4.0

Seções 20 a 28 implementadas localmente, incluindo conversas QR do complemento 26.1. Estados de implementação, testes simulados e pendências externas estão separados em [ENTREGA-1.4.0.md](ENTREGA-1.4.0.md). Nenhuma publicação, conexão de conta ou mensagem real.

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

Página dedicada, navegação, filtros, fonte ampliada, fotos e conflitos validados no Chrome/viewport móvel. Ver [entrega 1.4.0](ENTREGA-1.4.0.md).

- [x] Abrir o cadastro e a edição de imóveis em uma página dedicada que ocupe toda a área disponível da tela, substituindo o popup atual, sem exigir o modo fullscreen do navegador.
- [x] Organizar os campos em seções claras: dados gerais, localização, descrição e traduções, fotos, publicação e informações internas.
- [x] Manter ações de salvar, cancelar e voltar à lista facilmente acessíveis em computador e celular.
- [x] Preservar prévias, seleção da imagem principal, reordenação das fotos e permissões existentes.
- [x] Avisar antes de sair com alterações não salvas; em caso de erro ao salvar, manter os dados preenchidos.
- [x] Permitir acesso direto à edição pela URL, com autenticação e autorização, e preservar filtros da listagem ao retornar.
- [x] Validar navegação, teclado, responsividade, uploads e proteção contra edição concorrente.

## 21. Acessibilidade para a equipe

Preferências por conta, teclado, foco, rótulos, modo simplificado e fonte 140% conferidos. Leitor de tela real e aparelhos físicos continuam pendentes; a árvore de acessibilidade não os substitui.

- [x] Oferecer ajuste de tamanho da fonte e controles com áreas de toque maiores, persistindo a preferência por usuário.
- [x] Disponibilizar uma apresentação simplificada dos formulários, com campos agrupados e explicações claras, sem retirar funcionalidades necessárias.
- [x] Garantir contraste, foco visível, rótulos, navegação por teclado e mensagens de erro compreensíveis.
- [ ] Validar os fluxos principais em computador e celular, incluindo uso com fonte ampliada e leitor de tela.

## 22. Recuperação de senha por e-mail

Implementação SMTP e segurança validadas com transportes simulados e API local. Configurar Hostinger Email e autorizar destinatário de teste antes do recebimento real; nenhum e-mail foi enviado.

- [x] Implementar solicitação e redefinição de senha por e-mail usando o SMTP da Hostinger já previsto no projeto.
- [x] Usar links de uso único com validade curta, armazenando somente o hash do token e aplicando limite de tentativas.
- [x] Mostrar resposta uniforme para e-mails cadastrados e não cadastrados, evitando expor contas existentes.
- [x] Invalidar sessões e tokens anteriores após a troca da senha, preservar a exigência individual de MFA e registrar auditoria sem segredos.
- [x] Validar expiração, reutilização, falha de envio e recuperação para contas com e sem MFA.

## 23. Histórico e recuperação de versões dos imóveis

Histórico, comparação, recuperação concorrente, permissões e backup/restauração SQLite validados. Retenção de 100 versões; fotos não são apagadas automaticamente. Recuperação conserva comissões/pagamentos atuais. MySQL permanece pendente.

- [x] Registrar quem alterou o imóvel, quando e quais campos foram modificados, incluindo preço, descrição, fotos, ordem e status.
- [x] Exibir comparação entre versões com acesso limitado às permissões de cada usuário, protegendo informações internas.
- [x] Permitir recuperar uma versão anterior como nova alteração, mantendo o histórico e verificando conflitos com edições recentes.
- [x] Preservar as fotos necessárias à recuperação das versões e definir política de retenção e armazenamento.
- [x] Validar restauração de dados e fotos, auditoria, permissões e compatibilidade com backups.

## 24. Avisos de cadastro incompleto

Rascunho incompleto e requisitos de publicação validados no servidor e navegador. Fotos, descrição, localização e traduções são recomendações; Sob consulta e fallback sem fotos preservados.

- [x] Indicar campos ausentes no cadastro e na listagem, incluindo fotos, localização e descrição, com links para corrigir cada pendência.
- [x] Diferenciar requisitos obrigatórios para publicação de recomendações de qualidade.
- [x] Respeitar imóveis com preço sob consulta e as regras existentes para cadastros sem fotos.
- [x] Verificar traduções e imagem principal; validar requisitos também no servidor antes da publicação.
- [x] Permitir salvar rascunhos incompletos e apresentar mensagens claras ao tentar publicar.

## 25. Organização e acompanhamento de contatos

Unificação transacional, histórico, consentimentos, visitas, interações manuais, filtros e ausência de retorno validados localmente. A origem fica arquivada; lembretes da origem deixam de ser válidos.

- [x] Identificar possíveis interessados duplicados por e-mail e telefone normalizados e permitir revisão antes de unificar registros.
- [x] Preservar histórico, responsáveis, consentimentos e vínculos com imóveis e visitas ao unificar contatos.
- [x] Registrar conversas e interações, distinguindo anotações manuais de mensagens efetivamente enviadas por integração.
- [x] Mostrar último atendimento, próxima ação e contatos sem retorno há um prazo configurável.
- [x] Criar filtros e lembretes para contatos pendentes, evitando alertas repetidos e respeitando permissões.

## 26. Notificações por WhatsApp

Adaptador oficial Meta implementado, com simulação, consentimento, modelos nos cinco idiomas, webhook assinado e testes de falhas/duplicação. Credenciais, modelos aprovados, teste real e conferência de custos continuam pendentes. Nenhum envio real foi realizado.

- [ ] Ampliar a etapa de notificações por e-mail com envio pelo WhatsApp por integração oficial, escolhendo provedor e configurando credenciais fora do código.
- [x] Registrar consentimento e preferência de canal, com opção de deixar de receber mensagens.
- [ ] Enviar lembretes de visitas e retornos com modelos aprovados quando exigidos pelo provedor, nos idiomas disponíveis.
- [x] Respeitar horários, limites, cancelamentos e reagendamentos, impedindo envios duplicados.
- [x] Registrar estados de envio e entrega conforme os retornos do provedor, com tentativas controladas e tratamento de falhas.
- [ ] Validar primeiro em modo de teste com destinatários autorizados e documentar configuração e custos antes da ativação em produção.

### 26.1. Complemento imediato: conversas por WhatsApp com conexão por QR Code

Implementação local com adaptador opcional Baileys 7.0.0-rc14, baseado em WhatsApp Web e não oficial. Sessão cifrada, conversas, respostas manuais, controle de acesso, revogação, reconexão e interface validados com adaptador/HTTP simulados. Nenhuma conta foi conectada. Aceite com conta de teste e hospedagem permanecem pendentes; ver [configuração](CONFIGURACAO-1.4.0.md).

Prioridade solicitada: implementar este complemento na próxima etapa, para o volume inicial baixo de mensagens, mantendo a integração oficial prevista na seção 26 como caminho futuro. A leitura do QR Code deve conectar a conta usada no atendimento e permitir conversar diretamente no painel; não se trata apenas de gerar um link para abrir o WhatsApp.

- [x] Criar configuração para ativar ou desativar o atendimento por WhatsApp conectado por QR Code, com gerenciamento da conexão restrito a administradores.
- [x] Exibir o QR Code para leitura pelo celular, atualizar códigos expirados e mostrar estados de conexão: aguardando leitura, conectado, desconectado e reconectando.
- [x] Permitir desconectar e revogar a sessão; guardar dados de autenticação de forma protegida no servidor, sem expô-los no frontend, logs ou pacote de distribuição.
- [x] Criar uma tela de conversas com lista de contatos, mensagens recebidas e enviadas, horários e indicação de mensagens não lidas.
- [x] Permitir receber mensagens e enviar respostas de texto pelo painel, associando a conversa ao interessado pelo telefone normalizado, com opção de vinculação manual quando houver ambiguidade.
- [x] Registrar o usuário da equipe responsável por cada resposta e permitir atribuir ou transferir o atendimento, respeitando as permissões de acesso às conversas.
- [x] Preservar o histórico após reiniciar a aplicação e impedir duplicação de mensagens recebidas ou enviadas. Exibir estados confirmados pela integração e não reenviar automaticamente mensagens cujo resultado seja incerto.
- [x] Oferecer atualização das conversas sem recarregar a página, reconexão controlada e mensagens claras quando o serviço estiver indisponível.
- [x] Começar com atendimento manual de baixo volume; respeitar consentimentos, recusas de contato e limites configurados, sem disparos em massa. Notificações automáticas continuam seguindo as regras da seção 26.
- [x] Avaliar e documentar a tecnologia de conexão antes da implementação, verificando se é oficial ou baseada em automação do WhatsApp Web, suas limitações, requisitos de hospedagem e riscos de desconexão ou restrição da conta. Não apresentar conexão por QR Code como garantia de integração oficial.
- [x] Isolar a integração em um adaptador para permitir futura troca pelo provedor oficial sem perder os vínculos e o histórico de atendimento.
- [ ] Validar conexão, expiração do QR Code, recebimento, resposta, reinicialização, revogação, reconexão, duplicação e permissões usando conta de teste e destinatários autorizados.
- [ ] Documentar a instalação e conferir se a hospedagem suporta o processo persistente e, quando necessário, navegador e armazenamento de sessão; definir serviço separado caso o ambiente atual não suporte esses requisitos.

## 27. Painel de desempenho

Cálculos com dados conhecidos, filtros, período anterior e CSV validados. Consultas dependem de ANALYTICS_HASH_KEY, excluem equipe/robôs conhecidos e não são reconstruídas retroativamente. Venda exige registro explícito.

- [x] Medir consultas a imóveis e contatos recebidos por imóvel, definindo tratamento de visitas repetidas, equipe e tráfego automatizado.
- [x] Exibir visitas agendadas e realizadas e conversão de interessados em vendas, com critérios explícitos para cada indicador.
- [x] Oferecer filtros por período, imóvel e responsável, conforme as permissões do usuário.
- [x] Permitir comparação entre períodos e exportação dos resultados, protegendo dados pessoais e comissões.
- [x] Mostrar ausência de dados sem inventar métricas e validar os cálculos com registros conhecidos.

## 28. Verificação automática de backups

Rotina periódica implementada e desativada por padrão. Backup e restauração completos em SQLite isolado, integridade, retenção, falhas e alertas validados. MySQL, armazenamento da hospedagem, ativação do agendamento e teste real de alertas aguardam validação/autorização.

- [x] Programar backups criptografados e verificações periódicas de restauração em banco e armazenamento isolados da produção.
- [x] Conferir integridade dos registros e das fotos e registrar data, duração e resultado da última verificação.
- [x] Exibir ao administrador o último backup criado e o último backup cuja restauração foi validada.
- [x] Alertar sobre falha, atraso ou ausência de backup válido, utilizando os canais de notificação configurados.
- [x] Definir retenção, espaço disponível e recuperação operacional, preservando as chaves de criptografia fora dos arquivos de backup.
- [x] Garantir que testes de restauração nunca sobrescrevam dados de produção e validar recuperação completa antes de considerar o backup utilizável.

### Ordem sugerida para as próximas entregas

Próxima etapa: liberar ambiente MySQL de teste, conferir leitor de tela/aparelhos físicos e hospedagem, configurar provedores e autorizar destinatários e conta de teste. Somente depois validar recebimento/conexão/envio reais e autorizar ativação/publicação. Consulte [a entrega](ENTREGA-1.4.0.md) e [a configuração](CONFIGURACAO-1.4.0.md). As implementações locais das seções 20 a 28 e do complemento 26.1 constam da entrega 1.4.0. Permanecem pendentes as validações externas expressamente indicadas e a publicação; nenhum envio ou conexão real foi realizado.

## 29. Correções identificadas na revisão técnica da versão 1.4.0

A análise reproduziu as falhas em cenários isolados e a versão local 1.4.1 implementa as correções abaixo. Os testes novos demonstraram as regressões antes das correções e passaram depois. Nenhum provedor real foi conectado.

### 29.1. Alta prioridade: isolar rascunhos por conversa do WhatsApp

**Arquivos:** `public/portal/whatsapp-qr-ui.js`; teste de navegador em `scripts/verify-team-ui.mjs` ou futura suíte E2E dedicada.

**Reprodução e causa:** selecionar A, escrever uma resposta sem enviar e selecionar B. A ação `qr-select` troca `selected` e chama `conversation(true)`. A função lê `oldText` do textarea ainda pertencente a A e o coloca no formulário de B. O envio usa o novo `selected`, permitindo enviar o rascunho ao destinatário errado.

- [x] Vincular rascunhos explicitamente ao identificador da conversa. Ao trocar, salvar o texto de A em memória e carregar apenas o de B, ou limpar com confirmação de descarte. Nunca transferir texto entre destinatários.
- [x] Capturar o identificador solicitado antes de cada chamada assíncrona e ignorar respostas atrasadas se outra conversa tiver sido selecionada. Aplicar o mesmo cuidado ao polling e à paginação.
- [x] Vincular o formulário de envio e sua chave de idempotência à conversa e à tentativa correspondente. Um retorno atrasado de A não pode limpar o texto, o identificador de tentativa ou os erros de B.
- [x] Preservar rascunhos durante atualização da mesma conversa; limpar o de uma mensagem somente após o resultado previsto pelo fluxo de envio. Em resultado incerto, não reenviar automaticamente.
- [x] Ao sair da conta ou perder permissão de acesso, descartar os rascunhos protegidos. Não gravar conteúdo de conversas em armazenamento compartilhado entre usuários.

**Aceite automatizado:** A → B sem texto em B; B → A restaura somente A caso a opção de preservar seja adotada; rascunhos diferentes em A/B; polling sem perda; respostas HTTP fora de ordem; troca durante envio; erro de rede; resultado incerto; revogação de acesso; logout e entrada com outro usuário. Interceptar a requisição de envio e conferir `threadId`, texto e `clientId`, garantindo zero envio para o destinatário errado.

### 29.2. Prioridade média: registrar confirmação de falha do provedor

**Arquivos:** `core/whatsapp-qr.mjs`, função `receipt`; `core/whatsapp-qr-adapter.mjs`; `whatsapp-qr.test.mjs` e interface de conversas.

**Reprodução e causa:** criar mensagem `submitted` e chamar `receipt({providerId, state:'failed'})`. Ela permanece `submitted`: a comparação numérica atribui o mesmo nível a `failed` e `submitted` e descarta a transição. A classificação linear mistura progresso de entrega com falha.

- [x] Definir uma tabela explícita de transições, separando falha confirmada de resultado incerto e de progresso de entrega.
- [x] Aceitar falha confirmada para mensagens ainda sem confirmação de entrega; preservar evidências de entrega/leitura diante de eventos antigos ou contraditórios, conforme o contrato documentado do adaptador.
- [x] Tornar eventos repetidos idempotentes e preservar identidade da mensagem e autor. Usar comparação atômica com retentativas limitadas para não perder atualizações concorrentes.
- [x] Documentar o tratamento de recibos que chegam antes da persistência do resultado de envio e de mensagens `sending` interrompidas por reinício. Não transformar ausência de confirmação em sucesso nem repetir envio incerto.
- [x] Mostrar falha confirmada no painel sem acionar reenvio automático.

**Aceite automatizado:** `submitted → failed`; `sending → failed`; `uncertain → failed`; `submitted → sent → delivered → read`; duplicação; eventos atrasados; identificador desconhecido; corrida entre recibo e retorno do envio; leitura seguida de falha antiga; reinício durante envio. Conferir o estado persistido e o texto exibido, com uma única chamada ao transporte por tentativa.

### 29.3. Prioridade média: detectar reordenação de fotos como alteração não salva

**Arquivos:** `public/portal/property-page.js` (`installDirtyGuard`), `public/portal/photo-editor.js`, `public/portal/app.js`; verificadores de fotos e editor.

**Reprodução e causa:** abrir imóvel, reordenar apenas por arrastar e sair. O drop altera o modelo e renderiza, emitindo `photo-editor-update`; a proteção escuta `input`, `change` e determinados cliques, sem acompanhar essa mutação. A navegação prossegue sem aviso.

- [x] Emitir evento específico para mudanças reais do modelo de fotos, ou incluir metadados de mutação no evento existente. Não marcar como alteração a renderização inicial, progresso de upload ou abertura de prévia.
- [x] Integrar o evento à proteção de saída, com remoção dos listeners ao desmontar o editor. Cobrir ordenação por arrastar, botões e demais formas suportadas.
- [x] Manter o aviso em Voltar, Cancelar, menu, recarregar e fechar a aba; após salvar com sucesso, limpar o estado. Falha de gravação deve manter a alteração protegida.
- [x] Definir e testar o comportamento após desfazer todas as alterações, sem descartar silenciosamente modificações ainda existentes em outros campos.

**Aceite automatizado:** abrir sem alterar não pede confirmação; apenas reordenar pede; cancelar a saída mantém a ordem local; confirmar descarta; salvar e reabrir preserva a ordem; erro 409 preserva o formulário e a proteção; prévia e progresso não produzem falsos positivos. Para `beforeunload`, verificar o evento no teste unitário e o comportamento permitido pelo navegador no E2E.

## 30. Identidade visual do WhatsApp no menu

- [x] Substituir o envelope do item Conversas por WhatsApp pelo símbolo do WhatsApp em SVG local, sem dependência de imagens remotas.
- [x] Preservar tamanho, alinhamento e cores herdadas dos estados ativo e inativo do menu, além do nome acessível existente. O SVG decorativo usa `aria-hidden="true"`.
- [x] Atualizar a referência de cache do arquivo principal para disponibilizar a mudança após a publicação.
- [x] Incluir na regressão visual os estados ativo/inativo, os cinco idiomas, fonte ampliada e viewport móvel.

Alteração local; não equivale à publicação nem à correção das falhas da seção 29. Validação desta alteração: build com 39 arquivos JavaScript verificados, detector visual sem apontamentos e cenários existentes de `scripts/verify-team-ui.mjs` concluídos sem erros. A captura desktop com fonte ampliada foi inspecionada e mostra o novo símbolo no menu. Isso não implementa a matriz futura de regressão visual.

## 31. Automação de testes para todas as funcionalidades e builds futuros

### 31.1. Objetivo, estado atual e organização

Implementação local concluída para a infraestrutura e a matriz simulada. A evidência MySQL depende do Docker e os aceites com provedores, aparelhos e hospedagem continuam externos. Consulte `TESTES-AUTOMATIZADOS.md`.

- [x] Inventariar cada comportamento das seções 1 a 30 e relacioná-lo a caso de teste, arquivo, camada, banco e evidência. Registrar cobertura existente, ausente, simulada e externa separadamente.
- [x] Organizar testes em unidades puras, integração HTTP/persistência, contratos de adaptadores, E2E de navegador, regressão visual e verificações operacionais. Evitar testes que apenas repetem a implementação sem conferir comportamento observável.
- [x] Instalar e fixar ferramentas de navegador como dependências de desenvolvimento reproduzíveis. Todos os scripts usam o Playwright do manifesto, sem `data/qa-tools`.
- [x] Criar comandos dedicados `test:unit`, `test:integration`, `test:contracts`, `test:e2e`, `test:a11y`, `test:visual` e `test:release`, preservando `npm test` e `test:mysql`.
- [x] Usar controles estáveis e seletores por função/nome acessível nos E2E adicionados.

### 31.2. Infraestrutura determinística e isolamento

- [x] Gerar usuários de cada perfil, contas com/sem MFA, imóveis rascunhos/publicados/vendidos, fotos, contatos, visitas, comissões e conversas em fixtures sem dados reais. Cada execução usa banco, diretório temporário e portas próprios.
- [x] Controlar relógio, fuso, geradores de identificadores e respostas externas pelos pontos de injeção; cobrir virada de dia, expiração e horário de verão onde aplicável, sem depender da hora da execução.
- [x] Criar MySQL descartável em CI, aguardar saúde, executar a matriz funcional persistida em schemas isolados e remover somente recursos identificados como pertencentes ao teste. A configuração foi criada; a execução local desta entrega segue pendente porque o Docker não iniciou.
- [x] Simular SMTP, Meta e adaptador QR, com bloqueio de saída de rede não autorizada. Testes comuns não abrem conexão WhatsApp, enviam mensagens ou consultam produção.
- [x] Testar latência, timeout, interrupção, duplicação, eventos fora de ordem, concorrência e reinício com fixtures de falha controlada.
- [x] Fazer limpeza em `finally`, validar o caminho antes de exclusão recursiva e conferir que nenhum teste modifica o banco, fotos ou variáveis reais do projeto.

### 31.3. Matriz funcional mínima

Cada linha abaixo representa cenários a implementar ou conferir na cobertura existente. Validar sucesso, entrada inválida, ausência de permissão, falha de persistência e concorrência quando pertinentes.

Matriz local implementada e relacionada aos arquivos/evidências em `TESTES-AUTOMATIZADOS.md`. A execução em SQLite e com transportes simulados não substitui MySQL, provedores, aparelhos ou leitor de tela reais.

| Área / referência | Cenários obrigatórios | Camadas e evidências |
| --- | --- | --- |
| Catálogo e navegação pública | Busca, filtros combinados, ordenação, favoritos, comparação, imóveis relacionados, preço sob consulta, valores zero, anúncio indisponível e acesso direto por URL. Rascunhos não aparecem em API, HTML, metadados ou sitemap públicos. | Unidade, API, E2E; respostas e navegação verificadas. |
| Identidade, idiomas e conteúdo | Cinco idiomas, fallback de conteúdo sem tradução, rótulos, números, moedas, unidades, datas e parágrafos; escape de conteúdo malicioso e ausência de informações internas na página pública. | Unidade e E2E parametrizados por idioma; acessibilidade e capturas representativas. |
| Apresentações, PDF e compartilhamento — 3 a 9 e 12 | Capa, marca em todas as páginas, galeria e principal sem duplicação, ficha técnica, seleção de fotos, perfil público do corretor, QR decodificado com URL correta, múltiplas páginas, fotos verticais e ausência de fotos. Download, impressão e compartilhamento disponível/indisponível/cancelado. | Unidade, contratos, E2E e inspeção/renderização de artefato quando aplicável. Não confundir abrir compartilhamento com entrega ao destinatário. |
| Login, equipe e permissões — 1 e 19 | Login/logout, cookies, origem/CSRF, limitação de tentativas, sessões expiradas/revogadas, perfis admin/editor/corretor, alteração da própria conta, política individual de MFA, cadastro TOTP, replay, desvio de relógio e desafios pendentes. Conferir proteção no servidor, sem depender do menu. | Segurança, unidade, API e persistência nos dois bancos; segredos ausentes de respostas e logs. |
| Recuperação de senha — 22 | E-mail conhecido/desconhecido com resposta uniforme, conta inativa, link expirado, adulterado, usado e substituído; falha SMTP; chamadas concorrentes; senha inválida; revogação de sessões e preservação do MFA. | Unidade com transporte falso e integração HTTP; token somente em envio simulado controlado, nunca em logs. |
| Cadastro e edição em página — 20 e 24 | Novo e edição por URL, retorno com filtros, salvar/cancelar/voltar, seções do formulário, rascunho incompleto, requisitos e recomendações, conflito 409, duplo clique, falha de rede, tradução em edição e proteção de saída. | API e E2E; conferir conteúdo persistido e preservação do formulário em erro. |
| Fotos — 18 e 29.3 | Prévia, upload válido/inválido/truncado/grande, limite, progresso, cancelamento, falha e retentativa; escolha/remoção da principal, reordenação por mouse/teclado/toque suportado, desfazer, referências legadas, arquivo compartilhado e editor reaberto. | Unidade do modelo, API/upload e E2E; mesma sequência em editor, anúncio, apresentação e backup restaurado. |
| Histórico — 23 | Autor/data/campos, legado, comparação, retenção, foto preservada, permissão de comissões, recuperação como nova revisão, manutenção de pagamentos atuais e recuperação concorrente. | Unidade, API e backup/restauração; não recuperar dados financeiros por efeito colateral. |
| Contatos e pendências — 10, 12 e 25 | Consentimento, criação, etapas, responsáveis, retorno, registro manual e origem da interação, busca, filtros, duplicados por telefone/e-mail/aliases, unificação concorrente, conflitos de responsáveis e vínculos preservados com visitas/conversas. | Unidade, API e E2E; origem arquivada, histórico íntegro e lembretes antigos invalidados. |
| Visitas e agenda — 11 | Solicitação, confirmação do proprietário, antecedência, disponibilidade, duração, bloqueios, intervalo entre visitas, cancelamento, transferência, reagendamento e duas reservas concorrentes do mesmo horário. Conferir fusos e virada de dia. | Unidade do domínio e API nos dois bancos; somente uma reserva conflitante aceita. |
| Comissões e relatórios — 13 | Percentual/fixo, moedas sem soma indevida, base prevista/realizada, aprovação, pagamentos parciais, limites, arredondamento, histórico e revisão concorrente. Perfis sem permissão não recebem valores nas APIs, versões ou exportações. | Unidade, API e E2E; conferir total e regras financeiras com fixtures conhecidas. |
| Notificações no navegador e por e-mail — 14 | Preferência, teste autorizado, horários, limite diário, fila idempotente, lease, pausa, eventos cancelados, retentativas, lease expirado e resultado ambíguo. SMTP aceito não significa entregue. | Contratos falsos e integração da fila; zero conexões reais em CI. |
| WhatsApp oficial — 26 | Payload/modelos por idioma, destinatários autorizados, consentimento/STOP, assinatura do webhook inválida/válida, duplicação, eventos antes da resposta HTTP, recibos fora de ordem, 429, 5xx, timeout e falha definitiva. | Contrato Meta simulado e API; validar estados sem reenviar envio incerto. |
| WhatsApp QR — 26.1 e 29.1/29.2 | QR restrito ao admin, expiração, conexão, conflito de instância, sessão cifrada, reconexão limitada, logout/revogação, recebimento/echo deduplicado, vínculo ambíguo, transferência, acesso por responsável, consentimento, limite, paginação e persistência após reinício. Incluir isolamento de rascunhos e falhas de recibos da seção 29. | Unidade, contrato do adaptador, API e E2E com HTTP interceptado. Uma chamada ao transporte por tentativa; nenhuma conexão real. |
| Desempenho — 27 | Deduplicação por imóvel/dia, exclusão de equipe/robôs, coleta desativada, retenção, período anterior, filtros, conversão com venda explícita, contato unificado, dias sem dados, CSV seguro e ausência de dados pessoais/comissões. | Unidade com relógio fixo, API e exportação com valores conhecidos. |
| Acessibilidade — 21 | Teclado, foco visível e após erros, rótulos, regiões de status, contraste, zoom/fonte 100/120/140%, preferência por conta, modo simplificado, textos longos e celular. Ícone WhatsApp não duplica o nome acessível do botão. | E2E com análise automatizada de acessibilidade e regressão visual; leitor de tela real permanece aceite separado. |
| Backups e recuperação — 28 | Arquivo cifrado, chave errada, adulteração, destino não vazio, banco isolado, registros/fotos idênticos, exclusão de sessões/tokens/autenticação QR, histórico e conversas preservados, agendamento, espaço, retenção, lock concorrente, falha/timeout/limpeza e alertas. | Integração em processos separados para SQLite/MySQL; comparar origem antes/depois e garantir que restauração nunca a sobrescreve. |
| Empacotamento e operação — 16 | Instalação limpa, build, início e saúde, variáveis obrigatórias, dependência QR opcional ausente, preflight, cache do frontend, manifesto/lock coerentes, ZIP/SHA-256 e ausência de `.env`, chaves, bancos, dados privados ou ferramentas locais no pacote. | Smoke test isolado do pacote extraído; teste de conteúdo e integridade do artefato. |

### 31.4. Pipeline proposta para CI e builds

- [x] **Em toda alteração:** instalar por lockfile com `npm ci`, executar build, unidade, contratos e integração SQLite.
- [x] **Em todo PR:** executar integração MySQL e E2E dos fluxos críticos com perfis diferentes, desktop e viewport móvel; conferir as três regressões da seção 29 e acessibilidade automatizada.
- [x] **Execução periódica:** ampliar navegadores, idiomas, fontes, concorrência, recuperação e falhas, com backup em infraestrutura descartável.
- [x] **Antes de gerar release:** exigir resultados, validar pacote extraído, iniciar isoladamente, conferir checksum e vincular relatório ao código.
- [x] Bloquear release diante de dependência indisponível, suíte ignorada ou execução interrompida.
- [x] Fixar Node, Playwright, Axe e imagem MySQL na CI.

### 31.5. Evidências, cobertura e critérios de conclusão

- [x] Produzir JUnit, cobertura e evidências E2E com capturas/trace apenas em falhas e dados fictícios.
- [x] Criar baselines visuais por viewport, idioma, fonte e estado, atualizados somente por comando explícito.
- [x] Associar casos aos requisitos e demonstrar as três regressões da seção 29 antes/depois.
- [x] Definir limites críticos de cobertura e manter cenários de risco independentes do percentual global.
- [x] Isolar casos, estado e diretórios e impedir retentativas automáticas que ocultem defeitos.
- [x] Documentar reprodução, pré-requisitos, dados, evidências e limpeza em `TESTES-AUTOMATIZADOS.md`, sem arquivos privados de `data/`.
- [x] Manter aceite externo separado; CI com simulações não marca provedores, infraestrutura, aparelhos ou leitor de tela como aprovados.

**Critério final:** cada funcionalidade tem cenários rastreáveis de sucesso, falha e permissão; SQLite e MySQL passam nas verificações exigidas; testes E2E críticos e regressões passam; pacote é verificável e livre de segredos; pendências externas ficam explícitas. A implementação da estratégia e das novas suítes permanece pendente até existir código executável e evidência correspondente.
