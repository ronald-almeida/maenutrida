import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { parsePurchase, validDocument } from '../api/pix.js';
const purchase = { offer: '29700', name: 'Cliente Teste', email: 'teste@example.com', document: '52998224725', phone: '11999999999' };
test('prices are fixed server-side for all offers', () => {
  for (const offer of ['29700', '59940', '39700']) {
    const data = parsePurchase({ ...purchase, offer, amount: 1 });
    assert.equal(data.amount, Number(offer));
    assert.equal(data.items[0].unitPrice, Number(offer));
    assert.equal(data.items[0].tangible, false);
    if (offer === '39700') assert.equal(data.items[0].title, 'Combo Refrigerista Completo - Black Friday 2026');
  }
  for (const offer of ['1', '__proto__', 'toString']) assert.throws(() => parsePurchase({ ...purchase, offer }));
});
test('validates identity and required contact fields', () => {
  assert.equal(validDocument('52998224725'), true);
  assert.equal(validDocument('11222333000181'), true);
  for (const value of ['11111111111', '52998224724', '123']) assert.equal(validDocument(value), false);
  for (const patch of [{ name: 'A' }, { email: 'x' }, { phone: '12' }, { document: '123' }]) assert.throws(() => parsePurchase({ ...purchase, ...patch }));
});
function response() { return { statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } }; }
test('API handles success, invalid input, missing key and uncertain upstream without retries', async () => {
  const oldKey = process.env.BLACKCAT_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    delete process.env.BLACKCAT_API_KEY;
    let res = response(); await handler({ method: 'POST', body: purchase }, res); assert.equal(res.statusCode, 503);
    process.env.BLACKCAT_API_KEY = 'test-key';
    let calls = 0;
    globalThis.fetch = async (_url, options) => { calls++; const body = JSON.parse(options.body); assert.equal(options.headers['X-API-Key'], 'test-key'); return { ok: true, status: 201, json: async () => ({ success: true, data: { amount: body.amount, transactionId: 'TEST', paymentData: { copyPaste: '000201TEST-CODE' } } }) }; };
    for (const offer of ['29700', '59940', '39700']) { res = response(); await handler({ method: 'POST', body: { ...purchase, offer } }, res); assert.equal(res.statusCode, 200); assert.equal(res.data.amount, Number(offer)); assert.match(res.data.qrImage, /^data:image\/png;base64,/); assert.equal(res.headers['Cache-Control'], 'no-store'); }
    assert.equal(calls, 3);
    res = response(); await handler({ method: 'POST', body: { ...purchase, offer: '2' } }, res); assert.equal(res.statusCode, 400); assert.equal(calls, 3);
    globalThis.fetch = async () => { calls++; throw new Error('timeout'); };
    res = response(); await handler({ method: 'POST', body: purchase }, res); assert.equal(res.statusCode, 502); assert.ok(res.data.reference); assert.equal(calls, 4);
    globalThis.fetch = async () => ({ ok: true, status: 201, json: async () => ({ success: true, data: { amount: 1, transactionId: 'TEST', paymentData: { copyPaste: '000201TEST' } } }) });
    res = response(); await handler({ method: 'POST', body: purchase }, res); assert.equal(res.statusCode, 502);
    res = response(); await handler({ method: 'GET' }, res); assert.equal(res.statusCode, 405);
  } finally { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.BLACKCAT_API_KEY; else process.env.BLACKCAT_API_KEY = oldKey; }
});
