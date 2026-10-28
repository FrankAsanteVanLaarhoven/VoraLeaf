import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleFitnessRequest } from '../server/fitness-api.mjs';
import { handleMembershipRequest } from '../server/membership.mjs';
import { handleCreatorRequest } from '../server/creator-services.mjs';
import { handleCheckoutRequest } from '../server/checkout.mjs';

const directory = process.argv.includes('--dist') ? '../dist/' : '../public/';
const root = await realpath(fileURLToPath(new URL(directory, import.meta.url)));
const hostIndex = process.argv.indexOf('--host');
const host = hostIndex >= 0 ? process.argv[hostIndex + 1] : '127.0.0.1';
if (!['127.0.0.1','localhost','0.0.0.0'].includes(host)) throw new Error('Use localhost, 127.0.0.1 or 0.0.0.0 as host.');
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use a port between 1 and 65535.');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.mp3':'audio/mpeg', '.txt': 'text/plain; charset=utf-8' };
const withinRoot = file => file === root || file.startsWith(root + sep);

http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.startsWith('/api/studio/') || pathname.startsWith('/api/checkout/') || pathname === '/api/fitness' || pathname.startsWith('/api/fitness/')) {
      const hasBody=!['GET','HEAD'].includes(request.method);
      const apiRequest = new Request(`http://localhost:${port}${request.url}`, { method:request.method,headers:request.headers,...(hasBody?{body:request,duplex:'half'}:{}) });
      for(const handler of [handleCheckoutRequest,handleMembershipRequest,handleCreatorRequest,handleFitnessRequest]){
        const apiResponse=await handler(apiRequest,process.env);
        if(apiResponse){response.writeHead(apiResponse.status,Object.fromEntries(apiResponse.headers));response.end(Buffer.from(await apiResponse.arrayBuffer()));return;}
      }
      response.writeHead(404,{'Content-Type':'application/json'});response.end('{"error":"Unknown API route"}');return;
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    let file = resolve(root, '.' + pathname);
    if (!withinRoot(file)) { response.writeHead(403); response.end('Forbidden'); return; }
    try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); }
    catch { file = resolve(root, 'index.html'); }
    file = await realpath(file);
    if (!withinRoot(file)) { response.writeHead(403); response.end('Forbidden'); return; }
    const bytes = await readFile(file);
    const type = mime[extname(file)] || 'application/octet-stream';
    const range = request.headers.range;
    const headers = { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' };
    if (range && ['video/mp4','audio/mpeg'].includes(type)) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(range);
      if (!match) { response.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` }); response.end(); return; }
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
      if (start > end || start >= bytes.length) { response.writeHead(416, { 'Content-Range': `bytes */${bytes.length}` }); response.end(); return; }
      response.writeHead(206, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${bytes.length}`, 'Content-Length': end - start + 1 });
      response.end(request.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1)); return;
    }
    response.writeHead(200, { ...headers, 'Content-Length': bytes.length, ...(['video/mp4','audio/mpeg'].includes(type) ? { 'Accept-Ranges': 'bytes' } : {}) });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page unavailable.');
  }
}).listen(port, host, () => console.log(`VORALEAF: http://localhost:${port} (${directory.includes('dist') ? 'built site' : 'source'})`));
