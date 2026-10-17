# Release de segurança 1.5.0-rc.2

Data: 17/10/2026. Revisão para upload da aplicação Node.js em `inmobiliaria.confianzagsa.com`.

Esta versão corrige a inserção de HTML dos campos `tag` e `unit` em cards e detalhes de imóveis. O renderizador agora escapa esses valores mesmo em cadastros antigos; a API limita `unit` a `m²` ou `ha` quando informada e rejeita destaques que não sejam texto ou excedam 80 caracteres. Não há migração de banco nem mudança de credenciais, chaves ou variáveis de ambiente.

Consulte [a auditoria de segurança](docs/AUDITORIA-SEGURANCA-2026-10-17.md) para o escopo, os resultados da produção e as pendências operacionais. A implantação em produção ainda requer backup, homologação e validação da instalação real. O ZIP e seu SHA-256 são gerados em `releases/`.

Validação local desta revisão: `npm test` **110/110** sem pulos, Playwright de conversão e regressão de HTML **6/6**, build de 91 arquivos JavaScript e smoke do ZIP extraído com instalação limpa, integridade, saúde HTTP e negação de acesso anônimo. O scanner da Hostinger se refere à versão `1.5.0-rc.1` já publicada; `1.5.0-rc.2` precisa de novo escaneamento após upload.
