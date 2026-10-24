/* Server-only purchase entitlements. Identity is supplied by Sites dispatch. */
const MEM_STRIPE_ORIGIN = 'https://api.stripe.com';
const MEM_ID = /^[A-Za-z0-9_-]{1,200}$/;
const MEM_MAX_BODY = 1024 * 1024;
class MembershipError extends Error { constructor(status,code,message){super(message);this.status=status;this.code=code;} }
function memJSON(body,status=200){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function memFailure(status,code,message){throw new MembershipError(status,code,message);}
function memText(value){return typeof value==='string'?value.trim():'';}
function memId(value){const id=typeof value==='string'?value:value?.id;return typeof id==='string'&&MEM_ID.test(id)?id:null;}
function memPrices(env){return new Set(memText(env.VORALEAF_STRIPE_PRICE_IDS).split(',').map(x=>x.trim()).filter(x=>/^price_[A-Za-z0-9]+$/.test(x)));}
function memConfigured(env){return Boolean(env.DB?.prepare&&env.DB?.batch&&memText(env.STRIPE_SECRET_KEY)&&memText(env.STRIPE_WEBHOOK_SECRET)&&memText(env.STUDIO_MEMBERSHIP_BINDING_SECRET).length>=32&&memPrices(env).size);}
function memUser(request){const id=memText(request.headers.get('oai-authenticated-user-id'));return id&&id.length<=200&&!/[\u0000-\u001f]/.test(id)?id:null;}
function memHex(bytes){return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');}
async function memHmac(value,secret){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return memHex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));}
function memEqual(a,b){if(!/^[a-f0-9]{64}$/i.test(a)||!/^[a-f0-9]{64}$/i.test(b))return false;let difference=0;for(let i=0;i<64;i++)difference|=a.toLowerCase().charCodeAt(i)^b.toLowerCase().charCodeAt(i);return difference===0;}

/** Use only in the trusted server checkout creator, never expose a client mint endpoint. */
export async function createMembershipIdentitySignature(userId,env){
 if(typeof userId!=='string'||!userId||userId.length>200||memText(env.STUDIO_MEMBERSHIP_BINDING_SECRET).length<32)throw new Error('Membership identity binding is not configured.');
 return memHmac('voraleaf-member-v1:'+userId,env.STUDIO_MEMBERSHIP_BINDING_SECRET);
}
async function memBoundUser(resource,env,clientReference){
 const user=memText(resource?.metadata?.voraleaf_user_id),signature=memText(resource?.metadata?.voraleaf_identity_signature);
 if(!user||user.length>200||/[\u0000-\u001f]/.test(user)||(clientReference!==undefined&&clientReference!==user))return null;
 return memEqual(signature,await createMembershipIdentitySignature(user,env))?user:null;
}
async function memBytes(response){
 if(Number(response.headers.get('content-length')||0)>MEM_MAX_BODY)memFailure(413,'BODY_TOO_LARGE','The request is too large.');
 const reader=response.body?.getReader();if(!reader)return new Uint8Array();const chunks=[];let length=0;
 try{while(true){const part=await reader.read();if(part.done)break;length+=part.value.byteLength;if(length>MEM_MAX_BODY){await reader.cancel();memFailure(413,'BODY_TOO_LARGE','The request is too large.');}chunks.push(part.value);}}finally{reader.releaseLock();}
 const output=new Uint8Array(length);let offset=0;for(const part of chunks){output.set(part,offset);offset+=part.byteLength;}return output;
}
async function memStripe(path,env,fetchImpl){
 if(!path.startsWith('/v1/'))throw new Error('Invalid Stripe path.');
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);
 try{const response=await fetchImpl(MEM_STRIPE_ORIGIN+path,{method:'GET',headers:{Authorization:'Bearer '+env.STRIPE_SECRET_KEY,Accept:'application/json'},cache:'no-store',redirect:'error',signal:controller.signal});
  if(!response.ok)memFailure(502,'PAYMENT_PROVIDER_UNAVAILABLE','Purchase verification is temporarily unavailable.');
  let data;try{data=JSON.parse(new TextDecoder().decode(await memBytes(response)));}catch(error){if(error instanceof MembershipError)throw error;memFailure(502,'PAYMENT_PROVIDER_UNAVAILABLE','Purchase verification is temporarily unavailable.');}return data;
 }catch(error){if(error instanceof MembershipError)throw error;memFailure(502,'PAYMENT_PROVIDER_UNAVAILABLE','Purchase verification is temporarily unavailable.');}finally{clearTimeout(timer);}
}

export async function getStudioMember(request,env={}){
 const userId=memUser(request);const base={authenticated:Boolean(userId),eligible:false,tier:null,userId,reason:userId?'no_qualifying_purchase':'sign_in_required',configured:memConfigured(env)};
 if(!userId)return base;if(!base.configured)return {...base,reason:'configuration_required'};
 try{const now=Math.floor(Date.now()/1000);const row=await env.DB.prepare("SELECT kind, period_end FROM membership_grants WHERE user_id = ? AND status = 'active' AND (kind = 'purchaser' OR period_end > ?) ORDER BY CASE kind WHEN 'recurring' THEN 0 ELSE 1 END LIMIT 1").bind(userId,now).first();
  if(!row||!['purchaser','recurring'].includes(row.kind))return base;return {...base,eligible:true,tier:row.kind,reason:'verified_purchase',expiresAt:row.kind==='recurring'?row.period_end:null};
 }catch{return {...base,configured:false,reason:'verification_unavailable'};}
}
async function memSignature(raw,header,env){
 const values=String(header||'').split(',');let timestamp=null;const signatures=[];
 for(const item of values){const index=item.indexOf('=');if(index<0)continue;const name=item.slice(0,index),value=item.slice(index+1);if(name==='t'&&/^\d+$/.test(value))timestamp=Number(value);if(name==='v1')signatures.push(value);}
 if(!Number.isSafeInteger(timestamp)||Math.abs(Math.floor(Date.now()/1000)-timestamp)>300||!signatures.length)memFailure(400,'INVALID_SIGNATURE','Webhook signature verification failed.');
 const expected=await memHmac(timestamp+'.'+raw,env.STRIPE_WEBHOOK_SECRET);if(!signatures.some(signature=>memEqual(signature,expected)))memFailure(400,'INVALID_SIGNATURE','Webhook signature verification failed.');
}
function memLinePrice(lines,allowed){return Array.isArray(lines?.data)?lines.data.find(line=>allowed.has(memId(line.price))&&Number(line.quantity)>0&&Number(line.amount_total??line.amount)>0)?.price?.id:null;}
function memSubscriptionPrice(subscription,allowed){return Array.isArray(subscription?.items?.data)?subscription.items.data.find(item=>allowed.has(memId(item.price))&&Number(item.quantity??1)>0)?.price?.id:null;}
function memPeriod(subscription,invoice){const values=[subscription.current_period_end,invoice?.period_end,...(subscription.items?.data||[]).map(item=>item.current_period_end)];return Math.max(0,...values.filter(Number.isSafeInteger));}
function memUpsert(env,grant,event){return env.DB.prepare(`INSERT INTO membership_grants (provider_ref,user_id,kind,status,price_id,customer_id,payment_intent,invoice_id,subscription_id,event_created,period_end,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(provider_ref) DO UPDATE SET user_id=excluded.user_id,kind=excluded.kind,status=excluded.status,price_id=excluded.price_id,customer_id=excluded.customer_id,payment_intent=excluded.payment_intent,invoice_id=excluded.invoice_id,subscription_id=excluded.subscription_id,event_created=excluded.event_created,period_end=excluded.period_end,updated_at=excluded.updated_at WHERE excluded.event_created > membership_grants.event_created OR (excluded.event_created = membership_grants.event_created AND membership_grants.status='active' AND excluded.status='revoked')`).bind(grant.ref,grant.user,grant.kind,'active',grant.price,grant.customer||null,grant.payment||null,grant.invoice||null,grant.subscription||null,event.created,grant.period||null,Math.floor(Date.now()/1000));}
function memRevoke(env,column,value,event){const columns=new Set(['provider_ref','payment_intent','customer_id','subscription_id']);if(!columns.has(column)||!value)return null;return env.DB.prepare(`UPDATE membership_grants SET status='revoked',event_created=?,updated_at=? WHERE ${column}=? AND event_created <= ?`).bind(event.created,Math.floor(Date.now()/1000),value,event.created);}
async function memChanges(event,env,fetchImpl){
 const object=event.data?.object,allowed=memPrices(env),type=event.type;const now=Math.floor(Date.now()/1000);
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(type)){
  const sessionId=memId(object);if(!sessionId?.startsWith('cs_'))return [];
  const session=await memStripe('/v1/checkout/sessions/'+encodeURIComponent(sessionId),env,fetchImpl);
  if(session.id!==sessionId||session.mode!=='payment'||session.payment_status!=='paid'||Number(session.amount_total)<=0)return [];
  const user=await memBoundUser(session,env,session.client_reference_id);if(!user)return [];
  const lines=await memStripe('/v1/checkout/sessions/'+encodeURIComponent(sessionId)+'/line_items?limit=100',env,fetchImpl);const price=memLinePrice(lines,allowed);if(!price)return [];
  const payment=memId(session.payment_intent);if(!payment?.startsWith('pi_'))return [];
  const intent=await memStripe('/v1/payment_intents/'+encodeURIComponent(payment)+'?expand%5B%5D=latest_charge',env,fetchImpl);
  const charge=intent.latest_charge;
  if(intent.id!==payment||intent.status!=='succeeded'||!charge||typeof charge!=='object'||charge.disputed||Number(charge.amount_refunded)>0||charge.paid!==true)return [];
  return [memUpsert(env,{ref:'stripe:pi:'+payment,user,kind:'purchaser',price,customer:memId(session.customer),payment},event)];
 }
 if(type==='invoice.paid'){
  const invoiceId=memId(object);if(!invoiceId?.startsWith('in_'))return [];
  const invoice=await memStripe('/v1/invoices/'+encodeURIComponent(invoiceId),env,fetchImpl);
  if(invoice.id!==invoiceId||invoice.status!=='paid'||Number(invoice.amount_paid)<=0)return [];
  const subscriptionId=memId(invoice.subscription)||memId(invoice.parent?.subscription_details?.subscription);if(!subscriptionId?.startsWith('sub_'))return [];
  const subscription=await memStripe('/v1/subscriptions/'+encodeURIComponent(subscriptionId),env,fetchImpl);
  if(subscription.id!==subscriptionId||subscription.status!=='active')return [];
  const user=await memBoundUser(subscription,env);const price=memSubscriptionPrice(subscription,allowed),period=memPeriod(subscription,invoice);
  if(!user||!price||period<=now||(memId(invoice.customer)&&memId(subscription.customer)!==memId(invoice.customer)))return [];
  const payment=memId(invoice.payment_intent)||memId(invoice.payments?.data?.find(item=>item.payment?.type==='payment_intent')?.payment?.payment_intent);
  return [memUpsert(env,{ref:'stripe:sub:'+subscriptionId,user,kind:'recurring',price,customer:memId(subscription.customer),payment,invoice:invoiceId,subscription:subscriptionId,period},event)];
 }
 if(['customer.subscription.deleted','customer.subscription.paused','customer.subscription.updated'].includes(type)){
  const id=memId(object);if(!id?.startsWith('sub_'))return [];
  if(type==='customer.subscription.updated'&&object.status==='active')return [];
  return [memRevoke(env,'subscription_id',id,event)].filter(Boolean);
 }
 if(['invoice.payment_failed','invoice.marked_uncollectible','invoice.voided'].includes(type)){
  const id=memId(object?.subscription)||memId(object?.parent?.subscription_details?.subscription);return [memRevoke(env,'subscription_id',id,event)].filter(Boolean);
 }
 if(['charge.refunded','charge.dispute.created','charge.dispute.funds_withdrawn'].includes(type)){
  const chargeId=type==='charge.refunded'?memId(object):memId(object?.charge);if(!chargeId?.startsWith('ch_'))return [];
  const charge=await memStripe('/v1/charges/'+encodeURIComponent(chargeId),env,fetchImpl);
  if(charge.id!==chargeId)return [];
  const payment=memId(charge.payment_intent);if(payment){const existing=await env.DB.prepare('SELECT provider_ref FROM membership_grants WHERE payment_intent = ? LIMIT 1').bind(payment).first();if(existing)return [memRevoke(env,'payment_intent',payment,event)];}
  // If an old invoice cannot be joined precisely, suspend that customer's grants for review.
  const customer=memId(charge.customer);return [memRevoke(env,'customer_id',customer,event)].filter(Boolean);
 }
 return [];
}

export async function handleMembershipRequest(request,env={},fetchImpl=fetch){
 const path=new URL(request.url).pathname.replace(/\/$/,'');if(!['/api/studio/membership','/api/studio/webhooks/stripe'].includes(path))return null;
 try{
  if(path==='/api/studio/membership'){
   if(request.method!=='GET')return memJSON({code:'METHOD_NOT_ALLOWED',message:'Use GET for membership status.'},405);
   const member=await getStudioMember(request,env);const {userId,...publicMember}=member;
   return memJSON(publicMember,!member.authenticated?401:!member.configured?503:200);
  }
  if(request.method!=='POST')return memJSON({code:'METHOD_NOT_ALLOWED',message:'Use POST for payment events.'},405);
  if(!memConfigured(env))return memJSON({code:'CONFIGURATION_REQUIRED',message:'Purchase verification is not configured.'},503);
  const raw=new TextDecoder().decode(await memBytes(request));await memSignature(raw,request.headers.get('Stripe-Signature'),env);
  let event;try{event=JSON.parse(raw);}catch{memFailure(400,'INVALID_EVENT','The payment event is invalid.');}
  if(!event||typeof event.id!=='string'||!/^evt_[A-Za-z0-9]+$/.test(event.id)||!Number.isSafeInteger(event.created)||event.created<=0||typeof event.type!=='string'||!event.data?.object)memFailure(400,'INVALID_EVENT','The payment event is invalid.');
  if(event.created>Math.floor(Date.now()/1000)+300)memFailure(400,'INVALID_EVENT','The payment event timestamp is invalid.');
  const previous=await env.DB.prepare('SELECT id FROM provider_events WHERE id = ?').bind(event.id).first();if(previous)return memJSON({received:true,duplicate:true});
  const changes=await memChanges(event,env,fetchImpl);
  await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO provider_events(id,created,processed) VALUES(?,?,?)').bind(event.id,event.created,Math.floor(Date.now()/1000)),...changes]);
  return memJSON({received:true,handled:changes.length>0});
 }catch(error){if(error instanceof MembershipError)return memJSON({code:error.code,message:error.message},error.status);return memJSON({code:'VERIFICATION_UNAVAILABLE',message:'Purchase verification is temporarily unavailable.'},503);}
}
