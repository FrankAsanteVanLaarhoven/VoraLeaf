import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import {getStudioMember,handleMembershipRequest,createMembershipIdentitySignature} from '../server/membership.mjs';

const schema=readFileSync(new URL('../migrations/0001_creator.sql',import.meta.url),'utf8');
const now=()=>Math.floor(Date.now()/1000);
function database(){const sql=new DatabaseSync(':memory:');sql.exec(schema);return {sql,prepare(query){return {args:[],bind(...args){this.args=args;return this;},async first(){return sql.prepare(query).get(...this.args)||null;},async run(){return sql.prepare(query).run(...this.args);},query};},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};}
const settings=()=>({DB:database(),STRIPE_SECRET_KEY:'stripe-fixture-secret',STRIPE_WEBHOOK_SECRET:'webhook-fixture-secret',STUDIO_MEMBERSHIP_BINDING_SECRET:'binding-fixture-long-enough-32-characters',VORALEAF_STRIPE_PRICE_IDS:'price_VoraBold,price_VoraRecurring'});
const req=(path='/api/studio/membership',options={})=>new Request('https://voraleaf.test'+path,options);
const memberReq=()=>req('/api/studio/membership',{headers:{'oai-authenticated-user-id':'member-one','oai-authenticated-user-email':'private@example.test'}});
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const never=()=>{throw new Error('No network expected');};
let count=0;
function event(type,object,created=now()){return {id:'evt_fixture'+(++count),type,created,data:{object}};}
function signedRequest(value,env,timestamp=now(),raw=JSON.stringify(value)){const signature=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(timestamp+'.'+raw).digest('hex');return req('/api/studio/webhooks/stripe',{method:'POST',body:raw,headers:{'Stripe-Signature':`t=${timestamp},v1=${signature}`}});}
async function purchase(env,overrides={}){return {id:'cs_fixture',mode:'payment',payment_status:'paid',amount_total:2500,client_reference_id:'member-one',metadata:{voraleaf_user_id:'member-one',voraleaf_identity_signature:await createMembershipIdentitySignature('member-one',env)},payment_intent:'pi_fixture',customer:'cus_fixture',...overrides};}
function purchaseFetch(session,extra={}){return async(url,options)=>{assert.equal(new URL(url).origin,'https://api.stripe.com');assert.equal(options.headers.Authorization,'Bearer stripe-fixture-secret');assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');const path=new URL(url).pathname;if(path.endsWith('/line_items'))return response({data:[{price:{id:'price_VoraBold'},quantity:1,amount_total:2500}]});if(path.includes('/payment_intents/'))return response({id:'pi_fixture',status:'succeeded',latest_charge:{id:'ch_fixture',paid:true,disputed:false,amount_refunded:0},...extra});if(path.includes('/charges/'))return response({id:'ch_fixture',customer:'cus_fixture',payment_intent:'pi_fixture'});return response(session);};}
async function grant(env,created=now()){const session=await purchase(env);const r=await handleMembershipRequest(signedRequest(event('checkout.session.completed',{id:session.id},created),env),env,purchaseFetch(session));assert.equal(r.status,200);assert.equal((await r.json()).handled,true);}
async function recurring(env,overrides={},invoiceExtra={}){const subscription={id:'sub_fixture',status:'active',customer:'cus_fixture',current_period_end:now()+86400,metadata:{voraleaf_user_id:'member-one',voraleaf_identity_signature:await createMembershipIdentitySignature('member-one',env)},items:{data:[{price:{id:'price_VoraRecurring'},quantity:1}]},...overrides};const invoice={id:'in_fixture',status:'paid',amount_paid:2500,subscription:'sub_fixture',customer:'cus_fixture',payment_intent:'pi_recurring',period_end:now()+86400,...invoiceExtra};const fetcher=async url=>response(new URL(url).pathname.includes('/subscriptions/')?subscription:invoice);return {subscription,invoice,fetcher};}

test('membership routes enforce identity, methods and configuration; client receipt claims do not grant',async()=>{
 const env=settings();assert.equal(await handleMembershipRequest(req('/unrelated'),env),null);
 assert.equal((await handleMembershipRequest(req(),env)).status,401);
 assert.equal((await handleMembershipRequest(memberReq(),{})).status,503);
 assert.equal((await handleMembershipRequest(req('/api/studio/membership',{method:'POST',headers:{'oai-authenticated-user-id':'member-one'},body:JSON.stringify({purchased:true,tier:'recurring'})}),env)).status,405);
 const member=await getStudioMember(req('/api/studio/membership?purchased=true',{headers:{'oai-authenticated-user-id':'member-one','x-member':'true'}}),env);assert.equal(member.eligible,false);assert.equal(member.reason,'no_qualifying_purchase');
 const publicBody=await (await handleMembershipRequest(memberReq(),env)).json();assert.equal(publicBody.userId,undefined);assert.equal(publicBody.email,undefined);
});
test('signature verification rejects altered, missing and stale signatures before Stripe access',async()=>{
 const env=settings(),value=event('ignored',{id:'anything'});
 for(const request of [req('/api/studio/webhooks/stripe',{method:'POST',body:JSON.stringify(value)}),signedRequest(value,env,now()-301),req('/api/studio/webhooks/stripe',{method:'POST',body:JSON.stringify(value),headers:{'Stripe-Signature':`t=${now()},v1=${'a'.repeat(64)}`}})]){
  const r=await handleMembershipRequest(request,env,never);assert.equal(r.status,400);assert.equal((await r.json()).code,'INVALID_SIGNATURE');
 }
});
test('verified paid matching product grants account-bound purchaser membership',async()=>{
 const env=settings();await grant(env);const member=await getStudioMember(memberReq(),env);assert.equal(member.eligible,true);assert.equal(member.tier,'purchaser');
 const other=await getStudioMember(req('/api/studio/membership',{headers:{'oai-authenticated-user-id':'another-member'}}),env);assert.equal(other.eligible,false);
 const r=await handleMembershipRequest(memberReq(),env);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('unpaid or free checkout does not grant even when signed metadata is present',async()=>{
 for(const overrides of [{payment_status:'unpaid'},{amount_total:0}]){const env=settings(),session=await purchase(env,overrides);const r=await handleMembershipRequest(signedRequest(event('checkout.session.completed',{id:session.id}),env),env,purchaseFetch(session));assert.equal(r.status,200);assert.equal((await r.json()).handled,false);assert.equal((await getStudioMember(memberReq(),env)).eligible,false);}
});
test('user identity binding and client_reference_id must agree with the trusted server signature',async()=>{
 for(const overrides of [{client_reference_id:'attacker'},{metadata:{voraleaf_user_id:'member-one',voraleaf_identity_signature:'f'.repeat(64)}}]){const env=settings(),session=await purchase(env,overrides);const r=await handleMembershipRequest(signedRequest(event('checkout.session.completed',{id:session.id}),env),env,purchaseFetch(session));assert.equal((await r.json()).handled,false);assert.equal((await getStudioMember(memberReq(),env)).eligible,false);}
});
test('wrong product prices, refunded and disputed payments cannot grant',async()=>{
 for(const mode of ['wrong-price','refunded','disputed']){const env=settings(),session=await purchase(env);const normal=purchaseFetch(session,mode==='refunded'?{latest_charge:{paid:true,amount_refunded:1}}:mode==='disputed'?{latest_charge:{paid:true,disputed:true,amount_refunded:0}}:{});const fetcher=async(url,opts)=>mode==='wrong-price'&&new URL(url).pathname.endsWith('/line_items')?response({data:[{price:{id:'price_Unknown'},quantity:1,amount_total:2500}]}):normal(url,opts);const r=await handleMembershipRequest(signedRequest(event('checkout.session.completed',{id:session.id}),env),env,fetcher);assert.equal((await r.json()).handled,false);}
});
test('asynchronous successful payment can grant only after fetching paid state',async()=>{
 const env=settings(),session=await purchase(env);const r=await handleMembershipRequest(signedRequest(event('checkout.session.async_payment_succeeded',{id:session.id}),env),env,purchaseFetch(session));assert.equal((await r.json()).handled,true);
});
test('invoice.paid requires active, current and paid matching recurring subscription',async()=>{
 const env=settings(),data=await recurring(env);const r=await handleMembershipRequest(signedRequest(event('invoice.paid',{id:'in_fixture'}),env),env,data.fetcher);assert.equal((await r.json()).handled,true);assert.equal((await getStudioMember(memberReq(),env)).tier,'recurring');
 for(const overrides of [{status:'incomplete'},{status:'canceled'},{current_period_end:now()-10}]){const other=settings(),d=await recurring(other,overrides,overrides.current_period_end?{period_end:now()-10}:{});const denied=await handleMembershipRequest(signedRequest(event('invoice.paid',{id:'in_fixture'}),other),other,d.fetcher);assert.equal((await denied.json()).handled,false);}
});
test('replayed events are idempotent and older events cannot undo later revocation',async()=>{
 const env=settings(),session=await purchase(env),value=event('checkout.session.completed',{id:session.id},now()-20);const r=await handleMembershipRequest(signedRequest(value,env),env,purchaseFetch(session));assert.equal(r.status,200);
 const replay=await handleMembershipRequest(signedRequest(value,env),env,never);assert.equal((await replay.json()).duplicate,true);
 const revoke=event('charge.refunded',{id:'ch_fixture'},now()-10);await handleMembershipRequest(signedRequest(revoke,env),env,purchaseFetch(session));assert.equal((await getStudioMember(memberReq(),env)).eligible,false);
 const stale=event('checkout.session.completed',{id:session.id},now()-15);await handleMembershipRequest(signedRequest(stale,env),env,purchaseFetch(session));assert.equal((await getStudioMember(memberReq(),env)).eligible,false);
});
test('subscription cancellation and payment failure revoke recurring access',async()=>{
 for(const type of ['customer.subscription.deleted','invoice.payment_failed']){const env=settings(),data=await recurring(env);await handleMembershipRequest(signedRequest(event('invoice.paid',{id:'in_fixture'},now()-20),env),env,data.fetcher);const object=type.startsWith('invoice')?{id:'in_fixture',subscription:'sub_fixture'}:{id:'sub_fixture',status:'canceled'};await handleMembershipRequest(signedRequest(event(type,object,now()-10),env),env,never);assert.equal((await getStudioMember(memberReq(),env)).eligible,false);}
});
test('refund and dispute events revoke the matching purchaser payment',async()=>{
 for(const type of ['charge.refunded','charge.dispute.created']){const env=settings();await grant(env,now()-10);const session=await purchase(env);const object=type==='charge.refunded'?{id:'ch_fixture'}:{id:'dp_fixture',charge:'ch_fixture'};await handleMembershipRequest(signedRequest(event(type,object),env),env,purchaseFetch(session));assert.equal((await getStudioMember(memberReq(),env)).eligible,false);}
});
test('expired recurring grants fail closed without trusting browser tier flags',async()=>{
 const env=settings();env.DB.sql.prepare('INSERT INTO membership_grants(provider_ref,user_id,kind,status,price_id,event_created,period_end,updated_at) VALUES(?,?,?,?,?,?,?,?)').run('stripe:sub:expired','member-one','recurring','active','price_VoraRecurring',now()-50,now()-1,now());assert.equal((await getStudioMember(memberReq(),env)).eligible,false);
});
test('unconfigured or failed database/provider returns generic errors without secrets',async()=>{
 const env=settings();env.DB.prepare=()=>{throw new Error('database secret');};const member=await getStudioMember(memberReq(),env);assert.equal(member.eligible,false);assert.equal(member.reason,'verification_unavailable');
 const next=settings(),value=event('checkout.session.completed',{id:'cs_fixture'});const failure=await handleMembershipRequest(signedRequest(value,next),next,async()=>{throw new Error(next.STRIPE_SECRET_KEY);});assert.equal(failure.status,502);assert.equal((await failure.text()).includes(next.STRIPE_SECRET_KEY),false);
 const missing=await handleMembershipRequest(signedRequest(value,next),{},never);assert.equal(missing.status,503);
});
