'use strict';
const CACHE='voraleaf-20261024-pack-pair-r13';
const SHELL=['/source-viewer.js?rev=roots-r10','/source-viewer.css?rev=roots-r10','/','/styles.css?rev=pack-pair-r13','/studio.css?rev=roots-r10','/data.js?rev=roots-r10','/studio.js?rev=roots-r10','/app.js?rev=pack-pair-r13','/manifest.webmanifest','/assets/icon-192.png','/assets/icon-512.png','/assets/coffee-hero.webp','/fitness/','/fitness.css?rev=tutorial-r11','/fitness-data.js?rev=roots-r10','/fitness-api.js?rev=roots-r10','/fitness.js?rev=tutorial-r11','/studio-audio.js?rev=roots-r10','/studio-audio.css?rev=roots-r10','/creator-hub.js?rev=roots-r10','/creator-hub.css?rev=roots-r10'];
const SHELL_URLS=new Set(SHELL.map(path=>new URL(path,self.location.origin).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('voraleaf-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,u=new URL(req.url);
 if(u.pathname.startsWith('/api/'))return;
 if(req.method!=='GET'||u.origin!==self.location.origin||u.pathname.endsWith('.mp4')||req.headers.has('range'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(async response=>{if(response.ok&&response.type==='basic'&&new URL(response.url).origin===u.origin){try{const c=await caches.open(CACHE);await c.put(req,response.clone())}catch{}}return response}).catch(async()=>{try{return await caches.match(req)||await caches.match('/')||new Response('Offline. Please reconnect to load this page.',{status:503,headers:{'Content-Type':'text/plain'}})}catch{return new Response('Offline. Please reconnect to load this page.',{status:503,headers:{'Content-Type':'text/plain'}})}}));
 }else if(u.pathname.startsWith('/assets/')||/\.(css|js|webmanifest)$/.test(u.pathname)){
  event.respondWith(caches.match(req).catch(()=>null).then(cached=>cached||fetch(req).then(async response=>{if(response.ok&&response.type==='basic'){try{const cache=await caches.open(CACHE);await cache.put(req,response.clone());const keys=await cache.keys();if(keys.length>65){const removable=keys.filter(k=>!SHELL_URLS.has(k.url));if(removable.length)await cache.delete(removable[0])}}catch{}}return response})));
 }
});
