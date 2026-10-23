import { randomUUID } from 'node:crypto';
import QRCode from 'qrcode';
export const prices = Object.freeze({ '29700': 29700, '59940': 59940 });
const digits = value => String(value ?? '').replace(/\D/g, '');
export function validDocument(value) {
  if (!/^\d{11}$|^\d{14}$/.test(value) || /^(\d)\1+$/.test(value)) return false;
  const size = value.length === 11 ? 9 : 12;
  for (let n = size; n < size + 2; n++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(value[i]) * (size === 9 ? n + 1 - i : ((n - 1 - i) % 8) + 2);
    const remainder = sum % 11;
    if (Number(value[n]) !== (remainder < 2 ? 0 : 11 - remainder)) return false;
  }
  return true;
}
export function parsePurchase(body) {
  const amount = Object.hasOwn(prices, body?.offer) ? prices[body.offer] : undefined;
  if (!amount) throw new Error('Oferta inválida. Abra o link original do checkout.');
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = digits(body.phone);
  const document = digits(body.document);
  if (name.length < 3 || name.length > 120 || !name.includes(' ')) throw new Error('Informe seu nome completo.');
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um email válido.');
  if (!/^\d{10,11}$/.test(phone)) throw new Error('Informe um celular com DDD.');
  if (!validDocument(document)) throw new Error('Informe um CPF ou CNPJ válido.');
  const payload = { amount, currency: 'BRL', paymentMethod: 'pix', items: [{ title: 'Formação em Nutrição Funcional Aplicada à FIV', unitPrice: amount, quantity: 1, tangible: false }], customer: { name, email, phone, document: { number: document, type: document.length === 11 ? 'cpf' : 'cnpj' } }, pix: { expiresInDays: 1 }, externalRef: randomUUID() };
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    if (typeof body[key] === 'string') payload[key] = body[key].slice(0, 200);
  }
  return payload;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método não permitido.' }); }
  if (!process.env.BLACKCAT_API_KEY) return res.status(503).json({ error: 'Pagamento indisponível no momento. Entre em contato com a equipe responsável.' });
  let payload;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (JSON.stringify(body ?? {}).length > 10000) throw new Error('Dados inválidos.');
    payload = parsePurchase(body);
  } catch (error) { return res.status(400).json({ error: error instanceof SyntaxError ? 'Dados inválidos.' : error.message }); }
  const uncertain = () => res.status(502).json({ error: 'Não foi possível confirmar a geração do Pix. Confira com o suporte antes de tentar novamente.', reference: payload.externalRef });
  try {
    const response = await fetch('https://api.blackcatoficial.com/api/sales/create-sale', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.BLACKCAT_API_KEY }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000)
    });
    if (response.status >= 500) return uncertain();
    if (!response.ok) return res.status(502).json({ error: response.status === 400 || response.status === 422 ? 'A operadora recusou os dados informados. Confira CPF/CNPJ, email e celular.' : 'A operadora não autorizou a geração do Pix. Entre em contato com o suporte.', reference: payload.externalRef });
    const result = await response.json();
    const data = result.data;
    const code = data?.paymentData?.copyPaste || data?.paymentData?.qrCode;
    if (!result.success || typeof code !== 'string' || !code.startsWith('000201') || code.length > 4096 || !data?.transactionId || data.amount !== payload.amount) return uncertain();
    // Render locally: no payment code is sent to an external QR image service.
    let qrImage = null;
    try { qrImage = await QRCode.toDataURL(code, { width: 300, margin: 2 }); } catch { /* Copy-paste payment remains available. */ }
    return res.status(200).json({ code, qrImage, amount: payload.amount, expiresAt: data.paymentData.expiresAt ?? null, transactionId: data.transactionId });
  } catch { return uncertain(); }
}
