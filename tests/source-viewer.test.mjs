import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../public/source-viewer.js',import.meta.url),'utf8');
const context=vm.createContext({window:{location:{origin:'https://voraleaf.invalid'}},URL});
vm.runInContext(source,context,{timeout:1000});
const resolve=context.window.VoraleafViewer.resolveURL;
const rejected=url=>assert.equal(resolve(url).kind,'unsupported',url);

test('YouTube content links become attributed official players without branding-removal parameters',()=>{
 for(const link of ['https://www.youtube.com/watch?v=KBpoBc98BwM&modestbranding=1','https://youtu.be/KBpoBc98BwM','https://www.youtube.com/shorts/KBpoBc98BwM','https://www.youtube.com/live/KBpoBc98BwM']){
  const result=resolve(link),url=new URL(result.src);assert.equal(result.provider,'YouTube');assert.equal(result.official,true);assert.equal(url.origin,'https://www.youtube-nocookie.com');assert.equal(url.pathname,'/embed/KBpoBc98BwM');assert.equal(url.searchParams.get('controls'),'1');assert.equal(url.searchParams.get('playsinline'),'1');assert.equal(url.searchParams.has('modestbranding'),false);assert.equal(url.searchParams.has('showinfo'),false);
 }
});
test('YouTube playlist support does not disguise unsupported searches as players',()=>{
 const r=resolve('https://www.youtube.com/playlist?list=PL1234567890abc');assert.equal(new URL(r.src).pathname,'/embed/videoseries');assert.equal(new URL(r.src).searchParams.get('list'),'PL1234567890abc');
 rejected('https://www.youtube.com/results?search_query=coffee');rejected('https://youtu.be/invalid');
});
test('Spotify content embeds discard irrelevant link parameters',()=>{
 const r=resolve('https://open.spotify.com/intl-en/track/0Lr4kGOYn9l83EjuK6cZFQ?si=publictracking');assert.equal(r.src,'https://open.spotify.com/embed/track/0Lr4kGOYn9l83EjuK6cZFQ');rejected('https://open.spotify.com/user/somebody');
});
test('Apple Music preserves a validated song selection on the official embed host',()=>{
 const r=resolve('https://music.apple.com/gb/album/example/1234567890?i=1234567891');assert.equal(new URL(r.src).hostname,'embed.music.apple.com');assert.equal(new URL(r.src).searchParams.get('i'),'1234567891');rejected('https://music.apple.com/gb/album/example/123?i=wrong');
});
test('SoundCloud nested sources cannot redirect the widget to other hosts or carry private credentials',()=>{
 const r=resolve('https://soundcloud.com/artist/song');assert.equal(new URL(r.src).hostname,'w.soundcloud.com');assert.equal(new URL(r.src).searchParams.get('url'),'https://soundcloud.com/artist/song');assert.equal(new URL(r.src).searchParams.get('auto_play'),'false');
 for(const nested of ['https://evil.example/artist/song','https://soundcloud.com/artist/song?token=private','https://soundcloud.com/artist/song#access_token=private','https://user:password@soundcloud.com/artist/song'])rejected('https://w.soundcloud.com/player/?url='+encodeURIComponent(nested));
});
test('Bandcamp requires its official numeric player identifiers',()=>{
 assert.equal(resolve('https://bandcamp.com/EmbeddedPlayer/album=123456789/size=large/').official,true);rejected('https://artist.bandcamp.com/album/ordinary-name');
});
test('own imagery and member pages remain in-app while authentication and API routes are excluded',()=>{
 assert.equal(resolve('/assets/packaging/bloom-in-hand.webp').kind,'image');assert.equal(resolve('/assets/ritual-motion-study.mp4').kind,'video');assert.equal(resolve('/watch/member-recording').own,true);
 for(const link of ['/api/studio/oauth/youtube/start','/signin-with-chatgpt?return_to=/studio','/assets/icon.svg?token=private','https://user:password@voraleaf.invalid/assets/icon.svg'])rejected(link);
});
test('contact drafts remain text in an explicit handoff panel',()=>{
 const email=resolve('mailto:hello@voraleaf.com?subject=Collection&body=Hello%0A%3Cscript%3E');assert.equal(email.kind,'contact');assert.equal(email.value,'hello@voraleaf.com');assert.equal(email.body,'Hello\n<script>');assert.equal(resolve('tel:+447463326519').provider,'Telephone');assert.equal(resolve('https://wa.me/447463326519').provider,'WhatsApp');
 rejected('mailto:bad%0Aaddress@example.com');
});
test('unsafe protocols, private hosts and secret-bearing URLs are rejected without network access',()=>{
 for(const link of ['javascript:alert(1)','data:text/html,example','http://example.com/page','https://127.0.0.1/','https://[::1]/','https://router.lan/','https://router.home/','https://device.home.arpa/','https://example.com:8443/','https://example.com/?api_key=private','https://example.com/#token=private','https://example.com/#auth=private','https://accounts.google.com/o/oauth2/auth'])rejected(link);
 const generic=resolve('https://www.nhs.uk/live-well/exercise/strength-exercises/');assert.equal(generic.kind,'iframe');assert.equal(generic.official,false);assert.match(generic.note,/block embedding/);
});
