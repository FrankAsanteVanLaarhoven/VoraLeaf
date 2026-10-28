import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCheckoutRequest, calculateCartSummary, resolveMerchantEmail } from '../server/checkout.mjs';

const origin = 'https://voraleaf.test';
const never = async () => { throw new Error('No external network call expected'); };

function req(path, method = 'GET', body, headers = {}) {
 return new Request(origin + path, {
  method,
  headers: {
   ...(method === 'POST' ? { Origin: origin, 'Content-Type': 'application/json' } : {}),
   ...headers
  },
  ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {})
 });
}

test('calculateCartSummary computes box and sachet counts with pricing unconfigured by default and never exposes merchant email', () => {
 assert.equal(resolveMerchantEmail({}), 'frankleroyvan@gmail.com');
 const oneBox = calculateCartSummary([{ id: 'bold', format: '6x15g', qty: 1 }]);
 assert.equal('merchantEmail' in oneBox, false);
 assert.equal(oneBox.pricingConfigured, false);
 assert.equal(oneBox.totalBoxes, 1);
 assert.equal(oneBox.totalSachets, 6);
 assert.equal(oneBox.totalMinor, null);

 const fourBoxes = calculateCartSummary([{ id: 'ember', format: '6x15g', qty: 4 }]);
 assert.equal(fourBoxes.totalBoxes, 4);
 assert.equal(fourBoxes.totalSachets, 24);
 assert.equal(fourBoxes.totalMinor, null);

 const twelveBoxes = calculateCartSummary([{ id: 'bloom', format: '6x15g', qty: 12 }]);
 assert.equal(twelveBoxes.totalBoxes, 12);
 assert.equal(twelveBoxes.totalSachets, 72);

 const twentyBoxes = calculateCartSummary([{ id: 'bold', format: '10x10g', qty: 20 }]);
 assert.equal(twentyBoxes.totalBoxes, 20);
 assert.equal(twentyBoxes.totalSachets, 200);
});

test('checkout config reports pricing_pending and never exposes merchant email to clients', async () => {
 const r = await handleCheckoutRequest(req('/api/checkout/config'), {}, never);
 assert.equal(r.status, 200);
 assert.equal(r.headers.get('cache-control'), 'no-store');
 const body = await r.json();
 assert.equal(body.pricingConfigured, false);
 assert.equal(body.paypal.enabled, false);
 assert.equal(body.paypal.mode, 'pricing_pending');
 assert.equal(body.stripe.enabled, false);
 assert.equal(body.stripe.mode, 'pricing_pending');
 assert.equal(JSON.stringify(body).includes('frankleroyvan@gmail.com'), false);
});

test('PayPal and Stripe checkout return 503 PRICING_NOT_SET without exposing merchant email when price is not yet set', async () => {
 for (const endpoint of ['/api/checkout/paypal', '/api/checkout/stripe']) {
  const r = await handleCheckoutRequest(
   req(endpoint, 'POST', { items: [{ id: 'bold', format: '6x15g', qty: 4 }] }),
   {},
   never
  );
  assert.equal(r.status, 503, endpoint);
  const body = await r.json();
  assert.equal(body.code, 'PRICING_NOT_SET');
  assert.equal(body.summary.totalBoxes, 4);
  assert.equal(body.summary.totalMinor, null);
  assert.equal(JSON.stringify(body).includes('frankleroyvan@gmail.com'), false);
 }
});

test('when server unit pricing is configured, PayPal and Stripe use internal merchant account on the server', async () => {
 const envWithPrice = { VORALEAF_UNIT_PRICE_MINOR: '1500', STRIPE_SECRET_KEY: 'sk_test_fixture_only' };
 const paypalRes = await handleCheckoutRequest(
  req('/api/checkout/paypal', 'POST', { items: [{ id: 'bold', format: '6x15g', qty: 4 }] }),
  envWithPrice,
  never
 );
 assert.equal(paypalRes.status, 200);
 const paypalBody = await paypalRes.json();
 assert.equal(paypalBody.fields.business, 'frankleroyvan@gmail.com');
 assert.equal(paypalBody.fields.quantity_1, '1');

 let stripeCalled = false;
 const stripeRes = await handleCheckoutRequest(
  req('/api/checkout/stripe', 'POST', {
   items: [{ id: 'bold', format: '6x15g', qty: 12 }],
   customerEmail: 'buyer@example.co.uk'
  }),
  envWithPrice,
  async (url, options) => {
   stripeCalled = true;
   assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
   assert.equal(options.headers.Authorization, 'Bearer sk_test_fixture_only');
   const params = new URLSearchParams(options.body);
   assert.equal(params.get('metadata[merchant_account]'), 'frankleroyvan@gmail.com');
   assert.equal(params.get('customer_email'), 'buyer@example.co.uk');
   return Response.json({ id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' });
  }
 );
 assert.equal(stripeCalled, true);
 assert.equal(stripeRes.status, 200);
 const stripeBody = await stripeRes.json();
 assert.equal(stripeBody.url, 'https://checkout.stripe.com/c/pay/cs_test_123');
 assert.equal(JSON.stringify(stripeBody).includes('frankleroyvan@gmail.com'), false);

 const foreign = await handleCheckoutRequest(
  req('/api/checkout/stripe', 'POST', { items: [{ id: 'bold', format: '6x15g', qty: 1 }] }, { Origin: 'https://evil.example' }),
  envWithPrice,
  never
 );
 assert.equal(foreign.status, 403);
});
