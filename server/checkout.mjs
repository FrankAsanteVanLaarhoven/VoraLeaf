/* VORALEAF UK server-side checkout handler for PayPal and Stripe.
   Internal merchant account configuration remains server-side only and is never exposed in client responses. */
const CHK_STRIPE_ORIGIN = 'https://api.stripe.com';
const CHK_PAYPAL_URL = 'https://www.paypal.com/cgi-bin/webscr';
const CHK_MERCHANT_EMAIL = 'frankleroyvan@gmail.com';
const CHK_MAX_BODY = 64 * 1024;

const CHK_EDITIONS = {
 bold: { name: 'BOLD 01', edition: 'Men’s edition' },
 ember: { name: 'EMBER 02', edition: 'Men’s edition' },
 bloom: { name: 'BLOOM 03', edition: 'Women’s edition' }
};

const CHK_BUNDLES = [
 { boxes: 20, label: '20 Boxes Multipack' },
 { boxes: 12, label: '12 Boxes Bundle' },
 { boxes: 4, label: '4 Boxes Bundle' },
 { boxes: 1, label: '1 Box' }
];

class CheckoutError extends Error {
 constructor(status, code, message) {
  super(message);
  this.status = status;
  this.code = code;
 }
}

function chkJSON(body, status = 200, extraHeaders = {}) {
 return new Response(JSON.stringify(body), {
  status,
  headers: {
   'Content-Type': 'application/json; charset=utf-8',
   'Cache-Control': 'no-store',
   'X-Content-Type-Options': 'nosniff',
   ...extraHeaders
  }
 });
}

function chkText(value) {
 return typeof value === 'string' ? value.trim() : '';
}

function chkSameOrigin(request) {
 const origin = chkText(request.headers.get('Origin'));
 const target = new URL(request.url).origin;
 if (!origin || origin !== target) {
  throw new CheckoutError(403, 'FORBIDDEN_ORIGIN', 'Checkout requests must originate from VORALEAF.');
 }
}

async function chkReadJSON(request) {
 if (Number(request.headers.get('content-length') || 0) > CHK_MAX_BODY) {
  throw new CheckoutError(413, 'BODY_TOO_LARGE', 'The checkout request is too large.');
 }
 const reader = request.body?.getReader();
 if (!reader) return {};
 const chunks = [];
 let length = 0;
 try {
  while (true) {
   const part = await reader.read();
   if (part.done) break;
   length += part.value.byteLength;
   if (length > CHK_MAX_BODY) {
    await reader.cancel();
    throw new CheckoutError(413, 'BODY_TOO_LARGE', 'The checkout request is too large.');
   }
   chunks.push(part.value);
  }
 } finally {
  reader.releaseLock();
 }
 const bytes = new Uint8Array(length);
 let offset = 0;
 for (const part of chunks) {
  bytes.set(part, offset);
  offset += part.byteLength;
 }
 try {
  return JSON.parse(new TextDecoder().decode(bytes));
 } catch {
  throw new CheckoutError(400, 'INVALID_JSON', 'Invalid checkout payload.');
 }
}

export function resolveMerchantEmail(env = {}) {
 return chkText(env.VORALEAF_MERCHANT_EMAIL) || CHK_MERCHANT_EMAIL;
}

export function calculateCartSummary(rawItems, env = {}) {
 if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 20) {
  throw new CheckoutError(400, 'INVALID_CART', 'Please add at least one VORALEAF box to your bag before checkout.');
 }
 const unitPriceMinorRaw = Number(env.VORALEAF_UNIT_PRICE_MINOR);
 const pricingConfigured = Number.isInteger(unitPriceMinorRaw) && unitPriceMinorRaw > 0;
 const lineItems = [];
 let totalBoxes = 0;
 let totalSachets = 0;
 let totalMinor = pricingConfigured ? 0 : null;

 for (const entry of rawItems) {
  const id = chkText(entry?.id).toLowerCase();
  const format = chkText(entry?.format) || '6x15g';
  const qty = Number(entry?.qty);
  if (!CHK_EDITIONS[id] || !['6x15g', '10x10g'].includes(format) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
   throw new CheckoutError(400, 'INVALID_ITEM', 'One or more bag items have an invalid edition, pack format or quantity.');
  }
  const editionInfo = CHK_EDITIONS[id];
  const formatLabel = format === '10x10g' ? '10 × 10 g (100 g)' : '6 × 15 g (90 g)';
  const sachetsPerBox = format === '10x10g' ? 10 : 6;
  let remaining = qty;
  totalBoxes += qty;
  totalSachets += qty * sachetsPerBox;

  for (const tier of CHK_BUNDLES) {
   if (remaining >= tier.boxes) {
    const count = Math.floor(remaining / tier.boxes);
    remaining = remaining % tier.boxes;
    const bundleSachets = tier.boxes * sachetsPerBox;
    const unitMinor = pricingConfigured ? tier.boxes * unitPriceMinorRaw : null;
    const subtotalMinor = pricingConfigured ? count * unitMinor : null;
    if (pricingConfigured) totalMinor += subtotalMinor;
    lineItems.push({
     editionId: id,
     editionName: editionInfo.name,
     format,
     formatLabel,
     bundleBoxes: tier.boxes,
     bundleLabel: tier.label,
     quantity: count,
     sachets: count * bundleSachets,
     unitMinor,
     subtotalMinor,
     title: `VORALEAF ${editionInfo.name} — ${tier.label} (${formatLabel})`,
     description: `VORALEAF Roots Herbal Coffee (${editionInfo.edition}) · ${bundleSachets} sachets per bundle`
    });
   }
  }
 }

 return {
  pricingConfigured,
  currency: 'GBP',
  totalBoxes,
  totalSachets,
  totalMinor,
  lineItems
 };
}

export async function handleCheckoutRequest(request, env = {}, fetchImpl = fetch) {
 const url = new URL(request.url);
 const path = url.pathname.replace(/\/$/, '');
 if (!['/api/checkout/config', '/api/checkout/stripe', '/api/checkout/paypal'].includes(path)) {
  return null;
 }

 try {
  const merchantEmail = resolveMerchantEmail(env);
  const stripeKey = chkText(env.STRIPE_SECRET_KEY);
  const stripeLink = chkText(env.STRIPE_PAYMENT_LINK_URL);
  const unitPriceMinorRaw = Number(env.VORALEAF_UNIT_PRICE_MINOR);
  const pricingConfigured = Number.isInteger(unitPriceMinorRaw) && unitPriceMinorRaw > 0;

  if (path === '/api/checkout/config') {
   if (request.method !== 'GET') {
    return chkJSON({ code: 'METHOD_NOT_ALLOWED', message: 'Use GET for checkout configuration.' }, 405, { Allow: 'GET' });
   }
   return chkJSON({
    pricingConfigured,
    currency: 'GBP',
    paypal: {
     enabled: pricingConfigured,
     mode: pricingConfigured ? 'standard_cart' : 'pricing_pending'
    },
    stripe: {
     enabled: Boolean(pricingConfigured && (stripeKey || stripeLink)),
     mode: !pricingConfigured ? 'pricing_pending' : stripeKey ? 'checkout_session' : stripeLink ? 'payment_link' : 'configuration_required'
    }
   });
  }

  if (request.method !== 'POST') {
   return chkJSON({ code: 'METHOD_NOT_ALLOWED', message: 'Use POST to start checkout.' }, 405, { Allow: 'POST' });
  }
  chkSameOrigin(request);
  const body = await chkReadJSON(request);
  const summary = calculateCartSummary(body.items, env);
  const customerEmail = chkText(body.customerEmail);
  if (customerEmail && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || customerEmail.length > 254)) {
   throw new CheckoutError(400, 'INVALID_EMAIL', 'Please enter a valid email address for your order receipt.');
  }

  if (path === '/api/checkout/paypal') {
   if (!summary.pricingConfigured) {
    return chkJSON({
     code: 'PRICING_NOT_SET',
     provider: 'paypal',
     mode: 'pricing_pending',
     summary,
     message: 'PayPal checkout is connected on the server. Retail pricing has not been set yet—submit your order confirmation request below to reserve your selected boxes.'
    }, 503);
   }
   const fields = {
    cmd: '_cart',
    upload: '1',
    business: merchantEmail,
    currency_code: summary.currency,
    no_shipping: '0',
    return: `${url.origin}/bag?checkout=success&provider=paypal`,
    cancel_return: `${url.origin}/bag?checkout=cancelled&provider=paypal`,
    custom: `voraleaf-uk-${Date.now()}`
   };
   summary.lineItems.forEach((item, index) => {
    const n = index + 1;
    fields[`item_name_${n}`] = item.title;
    fields[`item_number_${n}`] = `${item.editionId}-${item.format}-${item.bundleBoxes}box`;
    fields[`amount_${n}`] = (item.unitMinor / 100).toFixed(2);
    fields[`quantity_${n}`] = String(item.quantity);
   });
   return chkJSON({
    provider: 'paypal',
    mode: 'standard_cart',
    checkoutUrl: CHK_PAYPAL_URL,
    fields,
    summary
   });
  }

  if (path === '/api/checkout/stripe') {
   if (stripeLink && /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_-]+/.test(stripeLink)) {
    return chkJSON({
     provider: 'stripe',
     mode: 'payment_link',
     url: stripeLink,
     summary
    });
   }

   if (!summary.pricingConfigured) {
    return chkJSON({
     code: 'PRICING_NOT_SET',
     provider: 'stripe',
     mode: 'pricing_pending',
     summary,
     message: 'Stripe checkout is connected on the server. Retail pricing has not been set yet—submit your order confirmation request below to reserve your selected boxes.'
    }, 503);
   }

   if (stripeKey) {
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', `${url.origin}/bag?checkout=success&provider=stripe`);
    params.set('cancel_url', `${url.origin}/bag?checkout=cancelled&provider=stripe`);
    params.set('billing_address_collection', 'required');
    ['GB', 'IE', 'US', 'CA', 'FR', 'DE', 'NL', 'AU'].forEach((country, idx) => {
     params.set(`shipping_address_collection[allowed_countries][${idx}]`, country);
    });
    params.set('metadata[merchant_account]', merchantEmail);
    params.set('metadata[brand]', 'VORALEAF UK');
    params.set('metadata[total_boxes]', String(summary.totalBoxes));
    if (customerEmail) params.set('customer_email', customerEmail);

    summary.lineItems.forEach((item, idx) => {
     params.set(`line_items[${idx}][price_data][currency]`, summary.currency.toLowerCase());
     params.set(`line_items[${idx}][price_data][unit_amount]`, String(item.unitMinor));
     params.set(`line_items[${idx}][price_data][product_data][name]`, item.title);
     params.set(`line_items[${idx}][price_data][product_data][description]`, item.description);
     params.set(`line_items[${idx}][quantity]`, String(item.quantity));
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
     const response = await fetchImpl(`${CHK_STRIPE_ORIGIN}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
       Authorization: `Bearer ${stripeKey}`,
       'Content-Type': 'application/x-www-form-urlencoded',
       Accept: 'application/json'
      },
      body: params.toString(),
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal
     });
     if (!response.ok) {
      throw new CheckoutError(502, 'STRIPE_UPSTREAM_ERROR', 'Stripe Checkout could not be created right now. Please try PayPal or retry shortly.');
     }
     const session = await response.json();
     if (!session?.url || typeof session.url !== 'string') {
      throw new CheckoutError(502, 'STRIPE_INVALID_SESSION', 'Stripe Checkout returned an incomplete session.');
     }
     return chkJSON({
      provider: 'stripe',
      mode: 'checkout_session',
      id: session.id,
      url: session.url,
      summary
     });
    } catch (error) {
     if (error instanceof CheckoutError) throw error;
     throw new CheckoutError(502, 'STRIPE_UNAVAILABLE', 'Stripe Checkout is temporarily unreachable. Please use PayPal or try again.');
    } finally {
     clearTimeout(timer);
    }
   }

   return chkJSON({
    code: 'STRIPE_CONFIGURATION_REQUIRED',
    provider: 'stripe',
    mode: 'configuration_required',
    summary,
    message: 'Stripe Checkout is registered on the server. Add STRIPE_SECRET_KEY in the server environment to activate direct card redirect.'
   }, 503);
  }

  return null;
 } catch (error) {
  if (error instanceof CheckoutError) {
   return chkJSON({ code: error.code, message: error.message }, error.status);
  }
  return chkJSON({ code: 'CHECKOUT_ERROR', message: 'Checkout service is temporarily unavailable.' }, 503);
 }
}
