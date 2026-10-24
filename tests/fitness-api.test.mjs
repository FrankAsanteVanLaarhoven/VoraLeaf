import test from 'node:test';
import assert from 'node:assert/strict';
import { handleFitnessRequest } from '../server/fitness-api.mjs';

const request = (route, options) => new Request(`https://voraleaf.example${route}`, options);
const env = { RAPIDAPI_KEY: 'private-exercise-fixture', YOUTUBE_API_KEY: 'private-video-fixture' };
const item = (id = '0001', extra = {}) => ({ id, name: 'bench press', bodyPart: 'chest', target: 'pectorals', equipment: 'barbell', secondaryMuscles: ['triceps'], instructions: ['Use qualified instruction.'], ...extra });
const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const noNetwork = () => { throw new Error('A rejected request must not reach the provider.'); };

test('unrelated routes return null and owned routes require GET', async () => {
  assert.equal(await handleFitnessRequest(request('/collection'), env, noNetwork), null);
  assert.equal(await handleFitnessRequest(request('/api/fitness-other'), env, noNetwork), null);
  const response = await handleFitnessRequest(request('/api/fitness/exercises', { method: 'POST' }), env, noNetwork);
  assert.equal(response.status, 405); assert.equal(response.headers.get('allow'), 'GET'); assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('missing provider keys produce actionable 503 without network access', async () => {
  for (const route of ['/api/fitness/exercises', '/api/fitness/exercises/0001', '/api/fitness/image/0001', '/api/fitness/videos?query=bench%20press']) {
    const response = await handleFitnessRequest(request(route), {}, noNetwork);
    assert.equal(response.status, 503, route); assert.equal((await response.json()).code, 'PROVIDER_NOT_CONFIGURED');
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('list uses fixed provider, server-only headers and honest unknown totals', async () => {
  let calls = 0;
  const response = await handleFitnessRequest(request('/api/fitness/exercises?limit=2&offset=4'), env, async (url, options) => {
    calls++; const upstream = new URL(url);
    assert.equal(upstream.origin, 'https://exercisedb.p.rapidapi.com'); assert.equal(upstream.pathname, '/exercises');
    assert.equal(upstream.searchParams.get('limit'), '2'); assert.equal(upstream.searchParams.get('offset'), '4');
    assert.equal(options.headers['X-RapidAPI-Key'], env.RAPIDAPI_KEY); assert.equal(options.headers['X-RapidAPI-Host'], 'exercisedb.p.rapidapi.com');
    assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error'); assert.ok(options.signal instanceof AbortSignal);
    return jsonResponse([item('0001'), item('0002')]);
  });
  const body = await response.json();
  assert.equal(response.status, 200); assert.equal(calls, 1); assert.equal(body.total, null); assert.equal(body.source, 'ExerciseDB · RapidAPI');
  assert.equal(body.nextOffset, 6); assert.equal(body.hasMore, true); assert.equal(body.items[0].image, '/api/fitness/image/0001?resolution=180');
  assert.equal(body.items[0].gifUrl, undefined); assert.equal(JSON.stringify(body).includes(env.RAPIDAPI_KEY), false);
});

test('search aliases are encoded as one path segment; combined filters apply to the fetched page', async () => {
  const response = await handleFitnessRequest(request('/api/fitness/exercises?search=bench%20press&bodyPart=chest&equipment=barbell&limit=2'), env, async url => {
    assert.equal(new URL(url).pathname, '/exercises/name/bench%20press');
    return jsonResponse([item('0001'), item('0002', { equipment: 'dumbbell' })]);
  });
  const body = await response.json(); assert.equal(body.items.length, 1); assert.equal(body.filterScope, 'provider-page');
  assert.equal(body.hasMore, true); assert.equal(body.nextOffset, 2); assert.equal(body.total, null);
  const alias = await handleFitnessRequest(request('/api/fitness?q=bench%20press'), env, async url => { assert.equal(new URL(url).pathname, '/exercises/name/bench%20press'); return jsonResponse([]); });
  assert.equal(alias.status, 200); assert.equal((await alias.json()).nextOffset, null);
});

test('body-part and equipment endpoints and detail preserve supplied fields', async () => {
  for (const [query, pathname] of [['bodyPart=upper%20legs', '/exercises/bodyPart/upper%20legs'], ['equipment=body%20weight', '/exercises/equipment/body%20weight']]) {
    const response = await handleFitnessRequest(request(`/api/fitness/exercises?${query}`), env, async url => { assert.equal(new URL(url).pathname, pathname); return jsonResponse([]); });
    assert.equal(response.status, 200);
  }
  const response = await handleFitnessRequest(request('/api/fitness/exercises/0001'), env, async url => {
    assert.equal(new URL(url).pathname, '/exercises/exercise/0001'); return jsonResponse(item('0001', { description: 'Provider description', difficulty: 'beginner', category: 'strength' }));
  });
  const body = await response.json(); assert.equal(body.item.id, '0001'); assert.equal(body.item.description, 'Provider description'); assert.equal(body.item.difficulty, 'beginner'); assert.equal(body.item.category, 'strength');
});

test('invalid pagination, identifiers, filters and client URLs are rejected before fetch', async () => {
  for (const route of ['/api/fitness/exercises?limit=0', '/api/fitness/exercises?limit=11', '/api/fitness/exercises?limit=1.5', '/api/fitness/exercises?offset=-1', '/api/fitness/exercises?offset=2001', '/api/fitness/exercises?offset=NaN', '/api/fitness/exercises?limit=2&limit=3', '/api/fitness/exercises?bodyPart=anything', '/api/fitness/exercises?search='+ 'a'.repeat(81), '/api/fitness/exercises?search=foo&q=bar', '/api/fitness/exercises?url=https://evil.example', '/api/fitness/exercises/%2Fsecret', '/api/fitness/image/0001?resolution=720']) {
    const response = await handleFitnessRequest(request(route), env, noNetwork);
    assert.equal(response.status, 400, route); assert.equal((await response.json()).code, 'INVALID_REQUEST');
  }
});

test('pagination never advertises an offset outside its bounded API window', async () => {
  const response = await handleFitnessRequest(request('/api/fitness/exercises?limit=1&offset=2000'), env, async () => jsonResponse([item()]));
  const body = await response.json();
  assert.equal(body.nextOffset, null); assert.equal(body.hasMore, false); assert.equal(body.paginationLimitReached, true); assert.equal(body.total, null);
});

test('provider authentication, rate limits and network errors are redacted', async () => {
  for (const [status, expected] of [[401, 502], [403, 502], [429, 429], [500, 502]]) {
    const response = await handleFitnessRequest(request('/api/fitness/exercises'), env, async () => new Response(`secret ${env.RAPIDAPI_KEY}`, { status }));
    assert.equal(response.status, expected); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal((await response.text()).includes(env.RAPIDAPI_KEY), false);
  }
  const response = await handleFitnessRequest(request('/api/fitness/exercises'), env, async () => { throw new Error(`network failure with ${env.RAPIDAPI_KEY}`); });
  assert.equal(response.status, 502); assert.equal((await response.text()).includes(env.RAPIDAPI_KEY), false);
});

test('budget timeout aborts the provider and returns a redacted 504', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  let signal;
  const pending = handleFitnessRequest(request('/api/fitness/exercises'), env, async (_url, options) => {
    signal = options.signal;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Fixture abort', 'AbortError')), { once: true }));
  });
  assert.equal(signal.aborted, false); context.mock.timers.tick(8000);
  const response = await pending; assert.equal(signal.aborted, true); assert.equal(response.status, 504); assert.equal((await response.json()).code, 'PROVIDER_TIMEOUT');
});

test('malformed or oversized upstream JSON cannot become exercise content', async () => {
  for (const payload of [{ unexpected: [] }, [null], [{ name: 'no id' }]]) {
    const response = await handleFitnessRequest(request('/api/fitness/exercises'), env, async () => jsonResponse(payload));
    assert.equal(response.status, 502); assert.equal((await response.json()).code, 'INVALID_PROVIDER_RESPONSE');
  }
  const text = await handleFitnessRequest(request('/api/fitness/exercises'), env, async () => new Response('not json', { headers: { 'Content-Type': 'application/json' } }));
  assert.equal(text.status, 502);
  const huge = await handleFitnessRequest(request('/api/fitness/exercises'), env, async () => new Response('[]', { headers: { 'Content-Type': 'application/json', 'Content-Length': '9999999' } }));
  assert.equal(huge.status, 502);
});

test('image proxy fixes origin and resolution, validates image bytes and never caches', async () => {
  const gif = new TextEncoder().encode('GIF89a' + 'fixture-body');
  const response = await handleFitnessRequest(request('/api/fitness/image/0001'), env, async (url, options) => {
    const upstream = new URL(url); assert.equal(upstream.origin, 'https://exercisedb.p.rapidapi.com'); assert.equal(upstream.pathname, '/image');
    assert.equal(upstream.searchParams.get('exerciseId'), '0001'); assert.equal(upstream.searchParams.get('resolution'), '180');
    assert.equal(options.headers['X-RapidAPI-Key'], env.RAPIDAPI_KEY); return new Response(gif, { headers: { 'Content-Type': 'image/gif' } });
  });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('content-type'), 'image/gif');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), gif);
  for (const source of [new Response('secret', { headers: { 'Content-Type': 'image/gif' } }), new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } }), new Response(gif, { headers: { 'Content-Type': 'image/gif', 'Content-Length': String(6 * 1024 * 1024) } })]) {
    const invalid = await handleFitnessRequest(request('/api/fitness/image/0001'), env, async () => source); assert.equal(invalid.status, 502);
  }
});

test('YouTube uses fixed official API filters and safe thumbnail hosts', async () => {
  const response = await handleFitnessRequest(request('/api/fitness/videos?query=bench%20press'), env, async url => {
    const upstream = new URL(url); assert.equal(upstream.origin, 'https://www.googleapis.com'); assert.equal(upstream.pathname, '/youtube/v3/search');
    for (const [key, value] of Object.entries({ part: 'snippet', type: 'video', maxResults: '6', q: 'bench press', key: env.YOUTUBE_API_KEY, safeSearch: 'strict', videoEmbeddable: 'true', videoSyndicated: 'true' })) assert.equal(upstream.searchParams.get(key), value);
    return jsonResponse({ items: [{ id: { videoId: 'abcdefghijk' }, snippet: { title: 'Provider title', channelTitle: 'Provider channel', thumbnails: { high: { url: 'https://evil.example/image.jpg' }, medium: { url: 'https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg' } } } }] });
  });
  const body = await response.json(); assert.equal(body.items[0].id, 'abcdefghijk'); assert.equal(body.items[0].thumbnail, 'https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg');
  assert.equal(body.items[0].channelTitle, 'Provider channel'); assert.equal(JSON.stringify(body).includes(env.YOUTUBE_API_KEY), false); assert.equal(response.headers.get('cache-control'), 'no-store');
  const malformed = await handleFitnessRequest(request('/api/fitness/videos?q=bench'), env, async () => jsonResponse({ items: 'invalid' })); assert.equal(malformed.status, 502);
});

test('image byte limit also applies when Content-Length is missing', async () => {
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(3 * 1024 * 1024)); controller.enqueue(new Uint8Array(3 * 1024 * 1024)); },
    cancel() { cancelled = true; },
  });
  const response = await handleFitnessRequest(request('/api/fitness/image/0001'), env, async () => new Response(body, { headers: { 'Content-Type': 'image/png' } }));
  assert.equal(response.status, 502); assert.equal(cancelled, true); assert.equal(response.headers.get('cache-control'), 'no-store');
});
