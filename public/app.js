const path = location.pathname.replace(/\/$/, '');
const offer = path === '/checkout/59940' ? '59940' : '39770';
const amount = Number(offer);
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount / 100);
document.querySelectorAll('.price').forEach(el => { el.textContent = money; });
const form = document.querySelector('#checkout-form');
const dialog = document.querySelector('#pix-dialog');
const generate = document.querySelector('#generate');
const openPix = document.querySelector('#open-pix');
const errorBox = document.querySelector('#error');
const email = document.querySelector('#email');
const confirmEmail = document.querySelector('#email-confirm');
let payment = null;
let busy = false;
function validateEmail() {
  confirmEmail.setCustomValidity(email.value.trim().toLowerCase() === confirmEmail.value.trim().toLowerCase() ? '' : 'Os emails precisam ser iguais.');
}
email.addEventListener('input', validateEmail);
confirmEmail.addEventListener('input', validateEmail);
function showPayment() {
  document.querySelector('#pix-code').value = payment.code;
  const qr = document.querySelector('#qr');
  qr.hidden = !payment.qrImage;
  if (payment.qrImage) qr.src = payment.qrImage;
  document.querySelector('#copy-status').textContent = '';
  if (!dialog.open) dialog.showModal();
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  if (payment) { showPayment(); return; }
  validateEmail();
  if (!form.reportValidity()) return;
  busy = true;
  generate.disabled = openPix.disabled = true;
  generate.textContent = 'Gerando seu Pix…';
  errorBox.textContent = '';
  const body = Object.fromEntries(new FormData(form));
  body.offer = offer;
  const params = new URLSearchParams(location.search);
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) if (params.has(key)) body[key] = params.get(key);
  try {
    const response = await fetch('/api/pix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let result;
    try { result = await response.json(); } catch { throw new Error('Não foi possível confirmar a geração do Pix. Confira com o suporte antes de tentar novamente.'); }
    if (!response.ok) throw new Error((result.error || 'Não foi possível gerar o Pix.') + (result.reference ? ` Referência: ${result.reference}` : ''));
    if (!result.code || result.amount !== amount) throw new Error('A resposta de pagamento é inválida. Entre em contato com o suporte.');
    payment = result;
    // Keep only in page memory; there is no database, localStorage or sessionStorage.
    form.querySelectorAll('input').forEach(input => { input.readOnly = true; });
    showPayment();
  } catch (error) {
    errorBox.textContent = error instanceof TypeError ? 'A conexão foi interrompida. Confira com o suporte se o Pix foi criado antes de tentar novamente.' : error.message;
  } finally {
    busy = false;
    generate.disabled = openPix.disabled = false;
    generate.textContent = payment ? 'Ver código QR' : '▦  Gerar código QR';
  }
});
openPix.addEventListener('click', () => { if (payment) showPayment(); else form.requestSubmit(); });
document.querySelector('#close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
document.querySelector('#copy').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText(payment.code); status.textContent = 'Código Pix copiado!'; }
  catch { const field = document.querySelector('#pix-code'); field.focus(); field.select(); status.textContent = 'Selecione e copie o código acima.'; }
});
