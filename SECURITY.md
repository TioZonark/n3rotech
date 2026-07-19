# Segurança do site N3rotech

Este é um site estático: não possui login, banco de dados, formulário, cookies próprios ou processamento de pagamentos.

## Proteções incluídas

- Política de Segurança de Conteúdo (CSP) restritiva no HTML e no arquivo `_headers`.
- Links externos abertos com `noopener`; links comerciais também usam `nofollow` e `sponsored`.
- URLs do catálogo aceitam somente HTTPS.
- Caminhos de imagens dinâmicas são limitados à pasta local `assets/`.
- Textos do catálogo são escapados antes de entrar no HTML.
- Câmera, microfone, geolocalização, pagamentos e USB são desabilitados na política de permissões do arquivo `_headers`.
- O site não usa `eval`, `document.write`, armazenamento local ou scripts de terceiros.

## Configuração da hospedagem

O arquivo `_headers` é reconhecido por plataformas como Netlify e Cloudflare Pages. Em outra hospedagem, configure os mesmos cabeçalhos no servidor. Sempre publique por HTTPS.

## Manutenção

Mantenha imagens e scripts dentro do projeto. Ao adicionar integrações externas, ajuste a CSP somente para os domínios estritamente necessários.
