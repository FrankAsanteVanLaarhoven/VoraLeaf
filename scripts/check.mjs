#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const origin = 'https://voraleaf.invalid';
let checks = 0;

function verify(condition, message) {
  assert.ok(condition, message);
  checks += 1;
}

function publicPath(url) {
  const resolved = new URL(url, origin);
  verify(resolved.origin === origin, `Expected a local URL: ${url}`);
  const pathname = decodeURIComponent(resolved.pathname);
  const candidate = path.resolve(publicRoot, `.${pathname}`);
  verify(candidate === publicRoot || candidate.startsWith(`${publicRoot}${path.sep}`), `Path escapes public/: ${url}`);
  return candidate;
}

function existingTarget(url) {
  const candidate = publicPath(url);
  verify(existsSync(candidate), `Missing local target: ${url}`);
  if (statSync(candidate).isDirectory()) {
    const index = path.join(candidate, 'index.html');
    verify(existsSync(index) && statSync(index).isFile(), `Route has no index.html: ${url}`);
    return index;
  }
  verify(statSync(candidate).isFile(), `Local target is not a regular file: ${url}`);
  return candidate;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') return [];
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filename) : entry.isFile() ? [filename] : [];
  });
}

try {
  verify(existsSync(publicRoot), 'Missing public/ snapshot.');
  const scripts = ['source-viewer.js', 'app.js', 'data.js', 'studio.js', 'sw.js', 'fitness-data.js', 'fitness-api.js', 'fitness.js', 'studio-audio.js', 'creator-hub.js'];
  for (const filename of scripts) {
    execFileSync(process.execPath, ['--check', path.join(publicRoot, filename)], { stdio: 'pipe' });
    checks += 1;
  }
  console.log(`PASS JavaScript syntax: ${scripts.length} files`);

  // Only the repository-controlled data declaration is evaluated. No DOM or API calls run.
  const context = vm.createContext({ window: Object.create(null) });
  new vm.Script(readFileSync(path.join(publicRoot, 'data.js'), 'utf8'), { filename: 'public/data.js' })
    .runInContext(context, { timeout: 1000 });
  const data = context.window.VORALEAF;
  verify(data && Array.isArray(data.products) && Array.isArray(data.articles), 'data.js must declare product and article arrays.');
  verify(data.products.length === 3, 'The collection must contain three editions.');
  verify(data.articles.length === 6, 'The journal snapshot must contain six articles.');
  const productIds = data.products.map(product => product.id);
  const articleIds = data.articles.map(article => article.id);
  verify(new Set(productIds).size === productIds.length, 'Duplicate product ID.');
  verify(new Set(articleIds).size === articleIds.length, 'Duplicate article ID.');
  for (const id of [...productIds, ...articleIds]) verify(typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id), `Invalid content ID: ${String(id)}`);
  verify(['bold', 'ember', 'bloom'].every(id => productIds.includes(id)), 'The BOLD, EMBER and BLOOM editions are required.');
  verify(Array.isArray(data.bundles) && data.bundles.length === 4, 'Four bundle tiers (1, 4, 12, 20 boxes) are required.');
  verify(data.bundles.every(b => !('priceGBP' in b) && !('priceUSD' in b)), 'Bundle definitions must not expose prices while pricing is unset.');
  verify(Array.isArray(data.benefits) && data.benefits.length === 4, 'Four vitality benefit pillars are required.');
  verify(Array.isArray(data.ingredients?.items) && data.ingredients.items.length === 6, 'Six core botanical/coffee ingredients (including Mixed African Roots Bitter Herbs) are required.');
  verify(data.ingredients.items.some(i => i.name === 'Mixed African Roots Bitter Herbs'), 'Mixed African Roots Bitter Herbs must be present in ingredients.');
  verify(Array.isArray(data.heroPlaylist) && data.heroPlaylist.length === 5, 'Five hero/campaign films are required in heroPlaylist.');
  verify(data.commerce?.paypal?.endpoint === '/api/checkout/paypal' && data.commerce?.stripe?.endpoint === '/api/checkout/stripe' && !JSON.stringify(data.commerce).includes('frankleroyvan@gmail.com'), 'Client commerce config must use server endpoints without exposing internal merchant email.');

  let svgCount = 0;
  for (const id of productIds) {
    for (const format of ['6x15g', '10x10g']) {
      const filename = existingTarget(`/assets/${id}-${format}.svg`);
      const svg = readFileSync(filename, 'utf8');
      verify(/^\s*(?:<\?xml[\s\S]*?\?>\s*)?<svg\b[^>]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(svg), `Missing SVG root/namespace: ${path.basename(filename)}`);
      verify(/<\/svg>\s*$/i.test(svg), `Incomplete SVG document: ${path.basename(filename)}`);
      const openPack = readFileSync(existingTarget(`/assets/packaging/roots-${id}-${format}.webp`));
      verify(openPack.subarray(0,4).toString() === 'RIFF' && openPack.subarray(8,12).toString() === 'WEBP', `Invalid open-box product image: ${id} ${format}`);
      verify(svg.includes('ROOTS HERBAL COFFEE') && !svg.includes('ROOT HERBAL COFFEE'), `Incorrect printed descriptor: ${id} ${format}`);
      svgCount += 1;
    }
  }
  for (const article of data.articles) {
    verify(typeof article.image === 'string' && /^[a-z0-9-]+\.(webp|png|jpg|jpeg)$/i.test(article.image), `Invalid image name for article ${article.id}`);
    existingTarget(`/assets/${article.image}`);
  }
  console.log(`PASS Content/assets: ${productIds.length} unique editions, ${articleIds.length} unique stories, ${svgCount} format SVGs, ${data.articles.length} article images`);

  new vm.Script(readFileSync(path.join(publicRoot, 'fitness-data.js'), 'utf8')).runInContext(context, {timeout:1000});
  const fitness = context.window.VORALEAF_FITNESS;
  verify(Array.isArray(fitness?.exercises) && fitness.exercises.length >= 12, 'Missing curated movement library.');
  const fitnessIds = fitness.exercises.map(e=>e.id);
  verify(new Set(fitnessIds).size === fitnessIds.length, 'Duplicate exercise ID.');
  for(const e of fitness.exercises){verify(/^starter-[a-z0-9-]+$/.test(e.id), 'Invalid starter ID.');verify(typeof e.exerciseDbId==='string'&&/^\d{4}$/.test(e.exerciseDbId),'Missing 4-digit ExerciseDB ID.');verify(Array.isArray(e.instructions)&&e.instructions.length>0,'Missing movement guidance.');verify(['rapidapi.com','exercisedb.p.rapidapi.com','www.nhs.uk'].includes(new URL(e.sourceUrl).hostname),'Invalid exercise source hostname.');}
  for(const v of (fitness.videos||[])){verify(/^[A-Za-z0-9_-]{11}$/.test(v.id),'Invalid curated YouTube ID.');verify(v.exerciseIds.every(id=>fitnessIds.includes(id)),'Invalid video/exercise mapping.');}
  const baseRoutes = ['fitness', 'collection', 'intimate', 'journal', 'movement', 'studio', 'bag', 'contact', 'about', 'privacy'];
  const routes = [...baseRoutes, ...productIds.map(id => `products/${id}`), ...articleIds.map(id => `journal/${id}`), ...fitnessIds.map(id=>`fitness/${id}`)];
  verify(routes.length === 19 + fitnessIds.length, 'Unexpected route inventory.');
  const shell = readFileSync(path.join(publicRoot, 'index.html'));
  for (const route of routes) {
    const filename = existingTarget(`/${route}/`);
    verify(readFileSync(filename).equals(shell), `Stale route shell: ${route}/index.html`);
  }
  const htmlFiles = walk(publicRoot).filter(filename => filename.endsWith('.html'));
  const references = new Set();
  for (const filename of htmlFiles) {
    const html = readFileSync(filename, 'utf8');
    for (const [, , value] of html.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) {
      if (value.startsWith('/') && !value.startsWith('//')) references.add(value);
    }
  }
  for (const reference of references) existingTarget(reference);
  console.log(`PASS Routes/HTML: ${routes.length + 1} matching entry shells, ${references.size} local references`);

  const manifest = JSON.parse(readFileSync(path.join(publicRoot, 'manifest.webmanifest'), 'utf8'));
  verify(manifest.start_url === '/' && manifest.scope === '/', 'PWA start URL and scope must match origin-root deployment.');
  verify(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'PWA manifest must declare app icons.');
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  for (const icon of manifest.icons) {
    verify(icon.type === 'image/png', `Unsupported icon type: ${icon.type}`);
    const bytes = readFileSync(existingTarget(icon.src));
    verify(bytes.length >= 24 && bytes.subarray(0, 8).equals(pngMagic), `Invalid PNG icon: ${icon.src}`);
    const dimensions = `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
    verify(String(icon.sizes).split(/\s+/).includes(dimensions), `Icon dimensions differ from manifest: ${icon.src}`);
  }
  for (const shortcut of manifest.shortcuts || []) existingTarget(shortcut.url);
  const sw = readFileSync(path.join(publicRoot, 'sw.js'), 'utf8');
  const shellDeclaration = sw.match(/const\s+SHELL\s*=\s*(\[[\s\S]*?\]);/);
  verify(shellDeclaration, 'Cannot find the service worker shell asset declaration.');
  const cachedPaths = new vm.Script(shellDeclaration[1]).runInNewContext(Object.create(null), { timeout: 1000 });
  verify(Array.isArray(cachedPaths) && cachedPaths.length > 0, 'Service worker shell list is empty.');
  for (const cachedPath of cachedPaths) {
    verify(typeof cachedPath === 'string' && cachedPath.startsWith('/') && !cachedPath.startsWith('//'), 'Service worker shell must contain only local root paths.');
    existingTarget(cachedPath);
  }
  for (const match of String(shell).matchAll(/(?:href|src)="([^"]+\.(?:css|js)(?:\?[^"]*)?)"/g)) verify(cachedPaths.includes(match[1]), `Versioned page asset missing from offline shell: ${match[1]}`);
  console.log(`PASS PWA: ${manifest.icons.length} PNG icons, ${cachedPaths.length} existing shell assets`);

  const requiredVideos = [
    '/assets/ritual-motion-study.mp4',
    '/assets/hero.mp4',
    '/assets/bold-mens.mp4',
    '/assets/bloom-womens.mp4',
    '/assets/hero-workout.mp4',
    '/assets/intimate.mp4',
  ];
  let totalVideoBytes = 0;
  for (const videoPath of requiredVideos) {
    const video = readFileSync(existingTarget(videoPath));
    verify(video.length > 1024 && video.subarray(4, 8).toString('ascii') === 'ftyp', `Video is missing or is not an MP4 container: ${videoPath}`);
    totalVideoBytes += video.length;
  }
  console.log(`PASS Media: ${requiredVideos.length} MP4 containers present (${totalVideoBytes.toLocaleString('en-GB')} bytes total)`);

  for (const forbidden of ['.openai', 'tmp', 'upload', 'generated_images', 'library_helpers']) {
    if(forbidden === '.openai' && process.env.VORALEAF_SITES_BUILD === '1') continue;
    verify(!existsSync(path.join(root, forbidden)), `Internal state must not be exported: ${forbidden}/`);
    verify(!existsSync(path.join(publicRoot, forbidden)), `Internal state must not be served: public/${forbidden}/`);
  }
  const sourceFiles = walk(root).filter(filename => /\.(?:m?js|html|css|json|ya?ml|md|txt|webmanifest)$/i.test(filename));
  const credentialPatterns = [
    /github_pat_[A-Za-z0-9_]{20,}/,
    /gh[pousr]_[A-Za-z0-9]{30,}/,
    /sk-(?:proj-)?[A-Za-z0-9_-]{30,}/,
    /AKIA[A-Z0-9]{16}/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  ];
  for (const filename of sourceFiles) {
    const relative = path.relative(root, filename);
    verify(!/(^|[/\\])\.env(?:$|\.(?!example$|sample$))/.test(relative), `Environment file must not be exported: ${relative}`);
    const text = readFileSync(filename, 'utf8');
    verify(!credentialPatterns.some(pattern => pattern.test(text)), `Potential embedded credential in ${relative}; remove it before export.`);
    if (relative.startsWith(`public${path.sep}`)) {
      verify(!text.includes('frankleroyvan@gmail.com'), `Internal merchant email must not be exposed in client file: ${relative}`);
    }
  }
  console.log(`PASS Export hygiene: ${sourceFiles.length} source/config text files scanned`);
  console.log(`VORALEAF integrity checks passed (${checks} assertions). Browser/device, payment, certification and live-service tests are separate.`);
} catch (error) {
  console.error(`VORALEAF integrity check FAILED: ${error.message}`);
  if (error.stderr) console.error(String(error.stderr));
  process.exitCode = 1;
}
