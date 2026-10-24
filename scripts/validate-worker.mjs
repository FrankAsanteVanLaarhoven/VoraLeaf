import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../dist/server/index.js',import.meta.url),'utf8');
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(typeof worker.fetch,'function');
for(const path of ['/','/fitness','/fitness/starter-wall-press','/products/bloom','/studio','/watch/review-demo','/source-viewer.js','/source-viewer.css','/creator-hub.js','/studio-audio.js','/fitness.js','/fitness-data.js','/assets/icon-192.png','/assets/packaging/sachets-triptych.webp','/assets/packaging/bloom-in-hand.webp']){
 const response=await worker.fetch(new Request('https://voraleaf.invalid'+path),{});
 assert.equal(response.status,200,path);
 assert.ok((await response.arrayBuffer()).byteLength>0,path+' empty');
}
const api=await worker.fetch(new Request('https://voraleaf.invalid/api/fitness/exercises'),{});
assert.equal(api.status,503);assert.equal(api.headers.get('Cache-Control'),'no-store');
const body=await api.json();assert.ok(body.code||body.error);
const range=await worker.fetch(new Request('https://voraleaf.invalid/assets/ritual-motion-study.mp4',{headers:{Range:'bytes=0-31'}}),{});
assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,32);
const music=await worker.fetch(new Request('https://voraleaf.invalid/assets/audio/golden-hour.mp3',{headers:{Range:'bytes=0-31'}}),{});
assert.equal(music.status,206);assert.equal(music.headers.get('Content-Type'),'audio/mpeg');assert.equal((await music.arrayBuffer()).byteLength,32);
const member=await worker.fetch(new Request('https://voraleaf.invalid/api/studio/membership'),{});
assert.equal(member.status,401);assert.equal(member.headers.get('Cache-Control'),'no-store');
const memberBody=await member.json();assert.equal(memberBody.eligible,false);assert.equal('userId' in memberBody,false);
const config=await worker.fetch(new Request('https://voraleaf.invalid/api/studio/config'),{});
assert.equal(config.status,200);const cfg=await config.json();assert.equal(cfg.live.configured,false);assert.equal(cfg.providers.youtube.configured,false);assert.equal(cfg.providers.youtube.connected,false);
for(const path of ['/api/studio/uploads','/api/studio/live/create']){
 const denied=await worker.fetch(new Request('https://voraleaf.invalid'+path,{method:'POST',headers:{Origin:'https://voraleaf.invalid','Content-Type':'application/json'},body:'{}'}),{});
 assert.equal(denied.status,401,path);assert.equal(denied.headers.get('Cache-Control'),'no-store');
}
console.log('PASS Worker routes, packaging and music assets, private-member gates, missing-key handling and media byte ranges.');
