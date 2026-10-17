# Release 1.5.0-rc.3 — carregamento e acessibilidade

Data: 17/10/2026. Pacote para homologação e upload em `inmobiliaria.confianzagsa.com`. Inclui as correções de segurança e melhorias de conversão da versão anterior.

- A frase “Preparando novos horizontes…” foi removida. A navegação comum abre sem aviso de carga; “Carregando…” aparece apenas quando a busca inicial de dados ultrapassa 400 ms e desaparece ao concluir ou falhar.
- A busca e o detalhe de imóveis continuam com HTML entregue pelo servidor para indexação e leitura imediata.
- No painel administrativo, as opções de acessibilidade agora ficam em um ícone ao lado do idioma. O menu abre sob demanda, fecha com Esc ou clique fora e preserva as preferências de fonte e formulários.
- O painel aberto foi ajustado para caber na tela de celular. Os arquivos alterados receberam uma nova versão de cache.

Validação local: 110/110 testes de aplicação, 6/6 fluxos funcionais Playwright, 16/16 rotas na auditoria WCAG automatizada, matriz visual e smoke do ZIP extraído com instalação limpa e servidor saudável. A etapa MySQL isolada não rodou porque o Docker local está indisponível; a publicação e a checagem da instalação real ainda são necessárias.
