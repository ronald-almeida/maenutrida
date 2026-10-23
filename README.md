# Mãe Nutrida — checkout Pix

Dois checkouts com a mesma página e preços definidos no servidor:

- `/checkout/39770` — R$ 397,70 (também disponível na raiz `/`)
- `/checkout/59940` — R$ 599,40

## Publicação na Vercel

Importe este repositório como projeto, usando o preset **Other**, build `npm run build` e diretório de saída `public`. Configure `BLACKCAT_API_KEY` nas variáveis de ambiente do servidor e publique novamente após configurá-la. Nunca use prefixo público na chave nem coloque a chave no código.

A função `/api/pix` chama a API documentada em https://docs.blackcatoficial.com/ com `X-API-Key`, valores em centavos e `paymentMethod: pix`. O cliente escolhe somente uma das duas ofertas; o servidor ignora qualquer valor enviado pelo navegador.

Sem banco de dados e sem armazenamento local de cobranças. O Pix fica apenas na memória da página e no processador Black Cat. Fechar e reabrir o popup reutiliza o Pix da página. Atualizar a página perde esse estado. Não há retentativa automática após falha de comunicação; `externalRef` é uma referência de atendimento, não uma garantia de idempotência da operadora.

O QR Code é renderizado no servidor a partir do código copia e cola. Não são usados serviços externos para gerar sua imagem. O popup não presume que copiar o código significa pagamento confirmado. A entrega do curso e o acompanhamento de pagamentos devem ser feitos pelo vendedor/operadora; este projeto não automatiza matrícula nem envia emails.

## Fonte e imagens

Imagens originais fornecidas pelo usuário, sem recortes. A pilha CSS começa com `Hotmart Sans`, seguida por Arial e Helvetica. Como o arquivo licenciado de Hotmart Sans não foi fornecido, o navegador usa a fonte disponível da pilha. Não há identificação de proteção ou processamento pela Hotmart.

## Verificação

`npm ci`, `npm run build`, `npm test`. Os testes simulam a operadora; não criam cobranças reais. É necessário testar uma cobrança autorizada após configurar a chave na hospedagem.
