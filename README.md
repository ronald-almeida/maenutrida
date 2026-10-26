# Combo Refrigerista — checkout Pix

Checkout principal com a imagem fornecida, layout responsivo e preço definido no servidor:

- `/` e `/checkout/39700` — Combo Refrigerista Completo - Black Friday 2026, **R$ 397,00**.
- Ao gerar o Pix, abre um popup com QR Code, código copia e cola e botão de copiar.
- O formulário inclui celular porque a API Black Cat exige `customer.phone`.

Ofertas anteriores preservadas:

- `/checkout/29700` — R$ 297,00
- `/checkout/59940` — R$ 599,40

## Publicação na Vercel

Importe este repositório como projeto, usando o preset **Other**, build `npm run build` e diretório de saída `public`. Configure `BLACKCAT_API_KEY` nas variáveis de ambiente do servidor e publique novamente após configurá-la. Nunca use prefixo público na chave nem coloque a chave no código.

A função `/api/pix` chama a API documentada em https://docs.blackcatoficial.com/ com `X-API-Key`, valores em centavos e `paymentMethod: pix`. O cliente envia um identificador de oferta; o servidor define o nome do produto e o valor, ignorando qualquer preço enviado pelo navegador.

Sem banco de dados e sem armazenamento local de cobranças. O Pix fica apenas na memória da página e no processador Black Cat. Fechar e reabrir o popup reutiliza o Pix da página. Atualizar a página perde esse estado. Não há retentativa automática após falha de comunicação; `externalRef` é uma referência de atendimento, não uma garantia de idempotência da operadora.

O QR Code é renderizado no servidor a partir do código copia e cola. Não são usados serviços externos para gerar sua imagem. O popup não presume que copiar o código significa pagamento confirmado. A entrega do curso e o acompanhamento de pagamentos devem ser feitos pelo vendedor/operadora; este projeto não automatiza matrícula nem envia emails.

## Fonte e imagens

Imagem do instrutor fornecida pelo usuário em `public/assets/refrigerista.png`. A pilha CSS solicitada começa com `Hotmart Sans`, seguida por Arial e Helvetica; o código Pix usa a pilha monoespaçada. Como o arquivo Hotmart Sans não foi fornecido, usa a fonte local se instalada ou Arial como fallback. A página principal identifica o processamento pela Black Cat e não exibe selo de proteção da Hotmart.

## Verificação

`npm ci`, `npm run build`, `npm test`. Os testes simulam a operadora; não criam cobranças reais. É necessário testar uma cobrança autorizada após configurar a chave na hospedagem.

## Pastas dos checkouts

- `checkout-1/index.html`: R$ 297,00, publicado em `/checkout-1/`.
- `checkout-2/index.html`: R$ 599,40, publicado em `/checkout-2/`.

As páginas compartilham `public/app.js`, `public/style.css`, imagens e a função `api/pix.js`. Publique a raiz do repositório; o build copia as duas pastas para a saída pública. Os links anteriores continuam disponíveis.
