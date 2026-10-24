import test from 'node:test';
import assert from 'node:assert/strict';
import {handleCreatorRequest,creatorSeal,creatorUnseal} from '../server/creator-services.mjs';

const origin='https://voraleaf.test';
const eligible={authenticated:true,eligible:true,userId:'member-a',tier:'purchaser'};
const noMember={authenticated:true,eligible:false,userId:'member-a'};
const lookup=async()=>eligible;
const never=async()=>{throw new Error('Unexpected external request');};
const encKey=Buffer.alloc(32,7).toString('base64');
function req(path,method='GET',body,headers={}){return new Request(origin+path,{method,headers:{...(method==='POST'?{Origin:origin,'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)}:{})});}
class DB {
 constructor(){this.states=new Map();this.connections=new Map();this.assets=new Map();this.live=new Map();}
 prepare(sql){const db=this;return{bind(...v){return{
  async first(){
   if(sql.startsWith('SELECT token_ciphertext'))return db.connections.get(v[0]+'|'+v[1])||null;
   if(sql.startsWith('DELETE FROM oauth_states')){const row=db.states.get(v[0]);if(!row||row.user_id!==v[1]||row.provider!==v[2]||row.expires_at<=v[3])return null;db.states.delete(v[0]);return{verifier_ciphertext:row.verifier_ciphertext};}
   if(sql.startsWith('SELECT * FROM creator_assets'))return db.assets.get(v[0])||null;
   if(sql.startsWith('SELECT * FROM live_sessions'))return db.live.get(v[0])||null;
   if(sql.startsWith('SELECT id FROM live_sessions'))return db.live.has(v[0])?{id:v[0]}:null;
   return null;
  },async all(){return{results:[...db.assets.values()].filter(a=>a.user_id===v[0])};},
  async run(){
   if(sql.startsWith('INSERT INTO oauth_states'))db.states.set(v[0],{state:v[0],user_id:v[1],provider:v[2],verifier_ciphertext:v[3],expires_at:v[4]});
   else if(sql.startsWith('INSERT INTO social_connections'))db.connections.set(v[0]+'|'+v[1],{token_ciphertext:v[2]});
   else if(sql.startsWith('UPDATE social_connections'))db.connections.set(v[1]+'|'+v[2],{token_ciphertext:v[0]});
   else if(sql.startsWith('DELETE FROM social_connections'))db.connections.delete(v[0]+'|'+v[1]);
   else if(sql.startsWith('INSERT INTO creator_assets'))db.assets.set(v[0],{id:v[0],user_id:v[1],object_key:v[2],title:v[3],content_type:v[4],byte_size:v[5],clean_attested:v[6],status:v[7],moderation_status:v[8],created_at:v[9]});
   else if(sql.startsWith('UPDATE creator_assets SET status')){const a=db.assets.get(v[1]);if(a?.user_id===v[2])a.status=v[0];}
   else if(sql.startsWith('UPDATE creator_assets SET youtube_id')){const a=db.assets.get(v[1]);if(a?.user_id===v[2])a.youtube_id=v[0];}
   else if(sql.startsWith('INSERT INTO live_sessions'))db.live.set(v[0],{id:v[0],user_id:v[1],provider_uid:v[2],title:v[3],publish_ciphertext:v[4],playback_url:v[5],status:v[6],ads_enabled:v[7],break_minutes:v[8],break_seconds:v[9],created_at:v[10]});
   else if(sql.startsWith('UPDATE live_sessions')){const row=db.live.get(v[2]);if(row?.user_id===v[3]){row.status=v[0];row.ended_at=v[1];}}
   return{success:true};
  }
 };}};}
}
function env(){return{DB:new DB(),STUDIO_TOKEN_ENCRYPTION_KEY:encKey,GOOGLE_CLIENT_ID:'fixture-client',GOOGLE_CLIENT_SECRET:'fixture-secret'};}

test('configuration exposes no tokens, reports unavailable providers honestly',async()=>{
 const response=await handleCreatorRequest(req('/api/studio/config'),{},never,async()=>noMember);assert.equal(response.status,200);const b=await response.json();assert.equal(b.providers.youtube.configured,false);assert.equal(b.providers.instagram.configured,false);assert.equal(b.live.configured,false);assert.equal(response.headers.get('cache-control'),'no-store');
});
test('unrelated routes pass through and publishing requires verified membership',async()=>{
 assert.equal(await handleCreatorRequest(req('/unrelated'),{},never),null);
 for(const route of ['/uploads','/youtube/upload','/live/create'])assert.equal((await handleCreatorRequest(req('/api/studio'+route,'POST',{}),{},never,async()=>noMember)).status,403);
});
test('all creator POST mutations reject a foreign origin',async()=>{
 for(const route of ['/uploads','/youtube/upload','/live/create','/oauth/youtube/disconnect'])assert.equal((await handleCreatorRequest(req('/api/studio'+route,'POST',{}, {Origin:'https://attacker.invalid'}),env(),never,lookup)).status,403);
});
test('AES-GCM seals tokens and binds ciphertext to user and provider',async()=>{
 const e=env(),token={access_token:'private-access-fixture',refresh_token:'private-refresh-fixture'};const sealed=await creatorSeal(token,'member-a','youtube',e);assert.ok(!sealed.includes('private-access'));assert.deepEqual(await creatorUnseal(sealed,'member-a','youtube',e),token);await assert.rejects(creatorUnseal(sealed,'other-member','youtube',e));await assert.rejects(creatorUnseal(sealed,'member-a','live',e));await assert.rejects(creatorUnseal(sealed+'x','member-a','youtube',e));
});
test('OAuth start creates one-use user-bound encrypted PKCE state',async()=>{
 const e=env();const response=await handleCreatorRequest(req('/api/studio/oauth/youtube/start'),e,never,lookup);assert.equal(response.status,302);const auth=new URL(response.headers.get('location'));assert.equal(auth.hostname,'accounts.google.com');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert.equal(auth.searchParams.get('redirect_uri'),origin+'/api/studio/oauth/youtube/callback');const state=auth.searchParams.get('state');assert.match(state,/^[\w-]{43}$/);const row=e.DB.states.get(state);assert.equal(row.user_id,'member-a');assert.ok(row.verifier_ciphertext.startsWith('v1.'));assert.ok(!row.verifier_ciphertext.includes('verifier'));
});
test('OAuth callback rejects bad state and replay, stores encrypted tokens',async()=>{
 const e=env();const start=await handleCreatorRequest(req('/api/studio/oauth/youtube/start'),e,never,lookup);const state=new URL(start.headers.get('location')).searchParams.get('state');assert.equal((await handleCreatorRequest(req('/api/studio/oauth/youtube/callback?state=bad&code=x'),e,never,lookup)).status,400);let calls=0;const provider=async(url,options)=>{calls++;assert.equal(url,'https://oauth2.googleapis.com/token');assert.equal(new URLSearchParams(options.body).get('grant_type'),'authorization_code');return Response.json({access_token:'hidden-token',refresh_token:'hidden-refresh',expires_in:3600});};
 const cb=()=>handleCreatorRequest(req('/api/studio/oauth/youtube/callback?state='+state+'&code=fixture-code'),e,provider,lookup);assert.equal((await cb()).status,303);assert.equal((await cb()).status,400);assert.equal(calls,1);const stored=e.DB.connections.get('member-a|youtube');assert.ok(!stored.token_ciphertext.includes('hidden-token'));assert.equal((await creatorUnseal(stored.token_ciphertext,'member-a','youtube',e)).access_token,'hidden-token');
});
test('uploads enforce 20MiB limit and file signature before storage',async()=>{
 const e=env();e.BUCKET={put:never};const over=await handleCreatorRequest(req('/api/studio/uploads','POST',new Uint8Array([1]),{'Content-Type':'video/webm','Content-Length':String(20*1024*1024+1)}),e,never,lookup);assert.equal(over.status,413);const bad=await handleCreatorRequest(req('/api/studio/uploads','POST',new Uint8Array([1,2,3,4]),{'Content-Type':'video/webm','Content-Length':'4'}),e,never,lookup);assert.equal(bad.status,415);
});
test('valid upload stays private; owner can publish to members only',async()=>{
 const e=env();const objects=new Map();e.BUCKET={put:async(k,b)=>objects.set(k,b),delete:async(k)=>objects.delete(k)};const bytes=new Uint8Array([26,69,223,163]);const r=await handleCreatorRequest(req('/api/studio/uploads','POST',bytes,{'Content-Type':'video/webm','Content-Length':'4','X-Video-Title':encodeURIComponent('A café moment'),'X-Video-Clean':'true'}),e,never,lookup);assert.equal(r.status,201);const b=await r.json();assert.equal(b.status,'private');assert.equal(e.DB.assets.get(b.id).title,'A café moment');
 const publish=await handleCreatorRequest(req('/api/studio/assets/'+b.id+'/publish','POST',{visibility:'members',confirm:true}),e,never,lookup);assert.equal(publish.status,200);assert.equal(e.DB.assets.get(b.id).status,'members');const watch=await handleCreatorRequest(req('/api/studio/watch/'+b.id),e,never,async()=>({...eligible,userId:'member-b'}));assert.equal(watch.status,200);assert.equal((await watch.json()).type,'recording');
});
test('private assets never leak to another member and members cannot publish others assets',async()=>{
 const e=env();e.DB.assets.set('clip',{id:'clip',user_id:'member-a',title:'Private',status:'private',moderation_status:'pending_review'});const other=async()=>({...eligible,userId:'member-b'});assert.equal((await handleCreatorRequest(req('/api/studio/watch/clip'),e,never,other)).status,404);assert.equal((await handleCreatorRequest(req('/api/studio/assets/clip/publish','POST',{visibility:'members',confirm:true}),e,never,other)).status,404);
});
test('YouTube posting needs explicit confirmation and a clean recording',async()=>{
 const e=env();e.DB.assets.set('clip',{id:'clip',user_id:'member-a',title:'Private',status:'private',clean_attested:0});assert.equal((await handleCreatorRequest(req('/api/studio/youtube/upload','POST',{assetId:'clip'}),e,never,lookup)).status,400);const r=await handleCreatorRequest(req('/api/studio/youtube/upload','POST',{assetId:'clip',privacy:'private',confirm:true}),e,never,lookup);assert.equal(r.status,409);assert.equal((await r.json()).code,'CLEAN_EXPORT_REQUIRED');
});
test('live setup fails closed without private signing keys',async()=>{
 const e=env();e.CLOUDFLARE_ACCOUNT_ID='a'.repeat(32);e.STREAM_API_TOKEN='fixture';assert.equal((await handleCreatorRequest(req('/api/studio/live/create','POST',{title:'Test'}),e,never,lookup)).status,503);
});
test('expired member can stop their own input, other member cannot',async()=>{
 const e=env();e.CLOUDFLARE_ACCOUNT_ID='a'.repeat(32);e.STREAM_API_TOKEN='fixture';e.DB.live.set('room',{id:'room',user_id:'member-a',provider_uid:'b'.repeat(32),status:'created'});const r=await handleCreatorRequest(req('/api/studio/live/room/stop','POST',{}),e,async(url,options)=>{assert.equal(options.method,'DELETE');assert.ok(url.endsWith('/'+'b'.repeat(32)));return new Response(null,{status:204});},async()=>noMember);assert.equal(r.status,200);assert.equal(e.DB.live.get('room').status,'ended');assert.equal((await handleCreatorRequest(req('/api/studio/live/room/stop','POST',{}),e,never,async()=>({...eligible,userId:'member-b'}))).status,404);
});
test('live input keeps publish credentials owner-only and signs member playback',async()=>{
 const e=env();e.CLOUDFLARE_ACCOUNT_ID='a'.repeat(32);e.STREAM_API_TOKEN='fixture';e.STREAM_SIGNING_KEY_ID='fixture-signing-key';const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);e.STREAM_SIGNING_KEY_JWK=JSON.stringify(await crypto.subtle.exportKey('jwk',keys.privateKey));const providerUid='b'.repeat(32);const secret='fixture-publish-secret';let calls=0;
 const provider=async(url,options)=>{calls++;assert.equal(options.method,'POST');const body=JSON.parse(options.body);assert.equal(body.recording.requireSignedURLs,true);assert.equal(body.recording.mode,'off');return Response.json({success:true,result:{uid:providerUid,webRTC:{url:'https://customer-fixture.cloudflarestream.com/'+secret+'/webRTC/publish'},webRTCPlayback:{url:'https://customer-fixture.cloudflarestream.com/'+providerUid+'/webRTC/play'}}});};
 const created=await handleCreatorRequest(req('/api/studio/live/create','POST',{title:'Our coffee ritual',adsEnabled:true,breakMinutes:10,breakSeconds:15}),e,provider,lookup);assert.equal(created.status,201);const b=await created.json();assert.ok(b.whipUrl.includes(secret));const row=e.DB.live.get(b.id);assert.ok(!row.publish_ciphertext.includes(secret));assert.ok(!(await handleCreatorRequest(req('/api/studio/config'),e,never,lookup)).headers.has('location'));
 const playback=await handleCreatorRequest(req('/api/studio/watch/'+b.id),e,never,async()=>({...eligible,userId:'member-b'}));assert.equal(playback.status,200);const view=await playback.json();assert.equal(view.type,'live');assert.equal(view.whipUrl,undefined);assert.ok(!view.whepUrl.includes(secret));const jwt=new URL(view.whepUrl).pathname.split('/')[1],parts=jwt.split('.');assert.equal(parts.length,3);const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());assert.equal(payload.sub,providerUid);assert.ok(payload.exp*1000>Date.now());assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',keys.publicKey,Buffer.from(parts[2],'base64url'),new TextEncoder().encode(parts[0]+'.'+parts[1])));assert.equal(calls,1);
 assert.equal((await handleCreatorRequest(req('/api/studio/watch/'+b.id),e,never,async()=>noMember)).status,403);
});
