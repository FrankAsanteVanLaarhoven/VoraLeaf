import { readFile, writeFile, readdir, mkdir, rm, access } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'public');
const output = resolve(root, 'dist');
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg','.json':'application/json','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8' };
const files = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes:true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (entry.isFile()) {
      const url = '/' + relative(source,file).split(sep).join('/');
      files[url] = { type:types[extname(file)]||'application/octet-stream', data:(await readFile(file)).toString('base64') };
    }
  }
}
await collect(source);
async function bundleModule(file, exports, prelude='') {
 let text=await readFile(resolve(root,file),'utf8');
 if(file.endsWith('creator-services.mjs'))text=text.replace(/^import \{ getStudioMember \} from '\.\/membership\.mjs';\r?\n/,'');
 if(/^\s*import\s/m.test(text))throw new Error('Unexpected external import in '+file);
 text=text.replace(/^export\s+(?=(?:async\s+)?function|class|const|let)/gm,'');
 return `(()=>{${prelude}\n${text}\nreturn {${exports.join(',')}};})()`;
}
const api=`const voraFitness=${await bundleModule('server/fitness-api.mjs',['handleFitnessRequest'])};\nconst voraMembership=${await bundleModule('server/membership.mjs',['getStudioMember','handleMembershipRequest'])};\nconst voraCreator=${await bundleModule('server/creator-services.mjs',['handleCreatorRequest'],'const getStudioMember=voraMembership.getStudioMember;')};`;
const runtime = `
const VORA_STATIC_MAP = ${JSON.stringify(files)};
function voraAssetResponse(request) {
 const url=new URL(request.url); let pathname;
 try { pathname=decodeURIComponent(url.pathname); } catch { return new Response('Invalid URL',{status:400}); }
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
 let item=VORA_STATIC_MAP[pathname]||VORA_STATIC_MAP[pathname.replace(/\\/$/,'')+'/index.html'];
 if(!item){if(pathname.startsWith('/assets/')||/\\.[a-z0-9]+$/i.test(pathname))return new Response('Not found',{status:404});item=VORA_STATIC_MAP['/index.html'];}
 const binary=atob(item.data),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const headers={'Content-Type':item.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
 if(request.headers.has('range')&&['video/mp4','audio/mpeg'].includes(item.type)){
  const match=/^bytes=(\\d+)-(\\d*)$/.exec(request.headers.get('range'));
  if(!match)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+bytes.length}});
  const start=Number(match[1]),end=match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1;
  if(start>end||start>=bytes.length)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+bytes.length}});
  return new Response(request.method==='HEAD'?null:bytes.subarray(start,end+1),{status:206,headers:{...headers,'Accept-Ranges':'bytes','Content-Range':'bytes '+start+'-'+end+'/'+bytes.length,'Content-Length':String(end-start+1)}});
 }
 return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'Content-Length':String(bytes.length),...(['video/mp4','audio/mpeg'].includes(item.type)?{'Accept-Ranges':'bytes'}:{})}});
}
export default { async fetch(request,env={},ctx) {
 for(const handler of [voraMembership.handleMembershipRequest,voraCreator.handleCreatorRequest,voraFitness.handleFitnessRequest]){const response=await handler(request,env);if(response)return response;}
 if(new URL(request.url).pathname.startsWith('/api/'))return new Response(JSON.stringify({error:'Unknown API route'}),{status:404,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 return voraAssetResponse(request);
} };
`;
await rm(output,{recursive:true,force:true});
await mkdir(resolve(output,'server'),{recursive:true});
await writeFile(resolve(output,'server/index.js'),api+'\n'+runtime);
const manifest=resolve(root,'.openai/hosting.json');
try { await access(manifest); await mkdir(resolve(output,'.openai'),{recursive:true}); await writeFile(resolve(output,'.openai/hosting.json'),await readFile(manifest)); } catch(error) { if(error.code!=='ENOENT')throw error; }
console.log(`VORALEAF Worker: ${Object.keys(files).length} embedded assets, fitness APIs and member creator services.`);
