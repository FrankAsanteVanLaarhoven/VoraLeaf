const EXERCISE_ORIGIN = 'https://exercisedb.p.rapidapi.com';
const YOUTUBE_SEARCH = 'https://www.googleapis.com/youtube/v3/search';
const SOURCE = 'ExerciseDB · RapidAPI';
const TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const BODY_PARTS = new Set(['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist']);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

class PublicError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const invalid = message => new PublicError(400, 'INVALID_REQUEST', message);
const malformed = () => new PublicError(502, 'INVALID_PROVIDER_RESPONSE', 'The content provider returned an unreadable response. Please try again later.');

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders } });
}
function cleanText(value, maximum = 200) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maximum) : '';
}
function queryText(params, names, required = false) {
  const values = names.map(name => params.get(name)).filter(value => value !== null);
  const normalised = values.map(value => value.trim().replace(/\s+/g, ' '));
  if (new Set(normalised).size > 1) throw invalid(`Use one ${names[0]} value.`);
  const value = normalised[0] || '';
  if ((required && !value) || value.length > 80 || (value && !/^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u.test(value))) {
    throw invalid(`${names[0]} must contain 1–80 letters, numbers, spaces, apostrophes or hyphens.`);
  }
  return value;
}
function integer(params, name, fallback, minimum, maximum) {
  const value = params.get(name);
  if (value === null) return fallback;
  if (!/^\d+$/.test(value.trim())) throw invalid(`${name} must be an integer from ${minimum} to ${maximum}.`);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw invalid(`${name} must be an integer from ${minimum} to ${maximum}.`);
  return number;
}
function validateParams(params, allowed) {
  for (const key of params.keys()) {
    if (!allowed.includes(key)) throw invalid(`Unsupported query parameter: ${key.slice(0, 40)}.`);
    if (params.getAll(key).length !== 1) throw invalid(`Use one ${key.slice(0, 40)} value.`);
  }
}
function apiKey(env, name) {
  const key = typeof env[name] === 'string' ? env[name].trim() : '';
  if (!key) throw new PublicError(503, 'PROVIDER_NOT_CONFIGURED', 'This content feed is not configured. Browse the curated starter movements or try again later.');
  return key;
}
function identifier(value) {
  let id;
  try { id = decodeURIComponent(value); } catch { throw invalid('The exercise identifier is invalid.'); }
  if (!ID_PATTERN.test(id)) throw invalid('The exercise identifier is invalid.');
  return id;
}
function providerStatus(response) {
  if (response.status === 429) throw new PublicError(429, 'PROVIDER_RATE_LIMITED', 'The content feed is temporarily busy. Please try again later.');
  if (response.status === 404) throw new PublicError(404, 'CONTENT_NOT_FOUND', 'This exercise is not currently available from the provider.');
  if (!response.ok) throw new PublicError(502, 'PROVIDER_UNAVAILABLE', 'The content provider is temporarily unavailable. Please try again later.');
}
async function boundedBytes(response, maximum) {
  const length = response.headers.get('content-length');
  if (length && /^\d+$/.test(length) && Number(length) > maximum) throw malformed();
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw malformed(); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
async function withBudget(operation) {
  const controller = new AbortController(); let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new PublicError(504, 'PROVIDER_TIMEOUT', 'The content provider took too long to respond. Please try again later.')); }, TIMEOUT_MS);
  });
  try { return await Promise.race([operation(controller.signal), timeout]); }
  catch (error) {
    if (error instanceof PublicError) throw error;
    if (error?.name === 'AbortError') throw new PublicError(504, 'PROVIDER_TIMEOUT', 'The content provider took too long to respond. Please try again later.');
    throw new PublicError(502, 'PROVIDER_UNAVAILABLE', 'The content provider is temporarily unavailable. Please try again later.');
  } finally { clearTimeout(timer); }
}
function exerciseHeaders(key) {
  return { Accept: 'application/json', 'X-RapidAPI-Key': key, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' };
}
async function providerJson(url, headers, fetchImpl) {
  return withBudget(async signal => {
    const response = await fetchImpl(url, { method: 'GET', headers, signal, redirect: 'error', cache: 'no-store' });
    providerStatus(response);
    const contentType = response.headers.get('content-type');
    if (contentType && !/\bjson\b/i.test(contentType)) throw malformed();
    const bytes = await boundedBytes(response, MAX_JSON_BYTES);
    try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw malformed(); }
  });
}
function exercise(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !ID_PATTERN.test(value.id) || !cleanText(value.name)) return null;
  const list = (input, limit, maximum) => Array.isArray(input) ? input.slice(0, limit).map(value => cleanText(value, maximum)).filter(Boolean) : [];
  return {
    id: value.id, name: cleanText(value.name), bodyPart: cleanText(value.bodyPart, 120), target: cleanText(value.target, 120), equipment: cleanText(value.equipment, 120),
    secondaryMuscles: list(value.secondaryMuscles, 20, 120), instructions: list(value.instructions, 50, 1000), description: cleanText(value.description, 2000),
    difficulty: cleanText(value.difficulty, 80), category: cleanText(value.category, 80), image: `/api/fitness/image/${encodeURIComponent(value.id)}?resolution=180`,
  };
}
function safeThumbnail(value) {
  if (typeof value !== 'string') return null;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'i.ytimg.com' && !url.username && !url.password && (!url.port || url.port === '443') ? url.href : null; } catch { return null; }
}
function imageType(bytes, declaredType) {
  if (declaredType === 'image/png' && bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return declaredType;
  if (declaredType === 'image/jpeg' && bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return declaredType;
  if (declaredType === 'image/gif' && bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(new TextDecoder().decode(bytes.subarray(0, 6)))) return declaredType;
  throw malformed();
}

/** Server-only adapter. It never persists API data/media or returns upstream errors or credentials. */
export async function handleFitnessRequest(request, env = {}, fetchImpl = fetch) {
  const url = new URL(request.url);
  if (!/^\/api\/fitness(?:\/|$)/.test(url.pathname)) return null;
  if (request.method !== 'GET') return json({ code: 'METHOD_NOT_ALLOWED', message: 'Use GET for the fitness content API.' }, 405, { Allow: 'GET' });
  try {
    const pathname = url.pathname.replace(/\/$/, '');
    const params = url.searchParams;
    const imageMatch = pathname.match(/^\/api\/fitness\/image\/([^/]+)$/);
    if (imageMatch) {
      validateParams(params, ['resolution']);
      if (params.has('resolution') && params.get('resolution') !== '180') throw invalid('Only resolution=180 is supported.');
      const id = identifier(imageMatch[1]); const key = apiKey(env, 'RAPIDAPI_KEY');
      const upstream = new URL('/image', EXERCISE_ORIGIN);
      upstream.searchParams.set('exerciseId', id); upstream.searchParams.set('resolution', '180');
      return await withBudget(async signal => {
        const response = await fetchImpl(upstream.href, { method: 'GET', headers: { ...exerciseHeaders(key), Accept: 'image/gif,image/jpeg,image/png' }, signal, redirect: 'error', cache: 'no-store' });
        providerStatus(response);
        const declaredType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        if (!['image/gif', 'image/jpeg', 'image/png'].includes(declaredType)) throw malformed();
        const bytes = await boundedBytes(response, MAX_IMAGE_BYTES);
        return new Response(bytes, { headers: { 'Content-Type': imageType(bytes, declaredType), 'Content-Length': String(bytes.byteLength), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
      });
    }
    if (pathname === '/api/fitness/videos') {
      validateParams(params, ['query', 'q']);
      const query = queryText(params, ['query', 'q'], true);
      const key = apiKey(env, 'YOUTUBE_API_KEY');
      const upstream = new URL(YOUTUBE_SEARCH);
      for (const [name, value] of Object.entries({ part: 'snippet', type: 'video', maxResults: '6', q: query, key, videoEmbeddable: 'true', videoSyndicated: 'true', safeSearch: 'strict' })) upstream.searchParams.set(name, value);
      const payload = await providerJson(upstream.href, { Accept: 'application/json' }, fetchImpl);
      if (!payload || !Array.isArray(payload.items)) throw malformed();
      const items = payload.items.slice(0, 6).map(value => {
        const id = value?.id?.videoId, snippet = value?.snippet;
        if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(id) || !snippet || !cleanText(snippet.title)) return null;
        const thumbs = snippet.thumbnails || {};
        const thumbnail = [thumbs.high?.url, thumbs.medium?.url, thumbs.default?.url].map(safeThumbnail).find(Boolean) || null;
        return { id, title: cleanText(snippet.title), channelTitle: cleanText(snippet.channelTitle), thumbnail };
      }).filter(Boolean);
      if (payload.items.length && !items.length) throw malformed();
      return json({ items, source: 'YouTube Data API' });
    }
    const detailMatch = pathname.match(/^\/api\/fitness\/exercises\/([^/]+)$/);
    if (detailMatch) {
      validateParams(params, []);
      const id = identifier(detailMatch[1]); const key = apiKey(env, 'RAPIDAPI_KEY');
      const payload = await providerJson(`${EXERCISE_ORIGIN}/exercises/exercise/${encodeURIComponent(id)}`, exerciseHeaders(key), fetchImpl);
      const item = exercise(payload);
      if (!item || item.id !== id) throw malformed();
      return json({ item, source: SOURCE });
    }
    if (pathname !== '/api/fitness' && pathname !== '/api/fitness/exercises') return json({ code: 'NOT_FOUND', message: 'This fitness API route does not exist.' }, 404);
    validateParams(params, ['q', 'search', 'bodyPart', 'equipment', 'limit', 'offset']);
    const search = queryText(params, ['search', 'q']);
    const bodyPart = queryText(params, ['bodyPart']).toLowerCase();
    const equipment = queryText(params, ['equipment']).toLowerCase();
    if (bodyPart && !BODY_PARTS.has(bodyPart)) throw invalid('Choose a supported bodyPart category.');
    const limit = integer(params, 'limit', 10, 1, 10), offset = integer(params, 'offset', 0, 0, 2000);
    const key = apiKey(env, 'RAPIDAPI_KEY');
    const primary = search ? 'search' : bodyPart ? 'bodyPart' : equipment ? 'equipment' : null;
    const upstreamPath = primary === 'search' ? `/exercises/name/${encodeURIComponent(search)}` : primary === 'bodyPart' ? `/exercises/bodyPart/${encodeURIComponent(bodyPart)}` : primary === 'equipment' ? `/exercises/equipment/${encodeURIComponent(equipment)}` : '/exercises';
    const upstream = new URL(upstreamPath, EXERCISE_ORIGIN);
    upstream.searchParams.set('limit', String(limit)); upstream.searchParams.set('offset', String(offset));
    const payload = await providerJson(upstream.href, exerciseHeaders(key), fetchImpl);
    if (!Array.isArray(payload)) throw malformed();
    const normalised = payload.slice(0, limit).map(exercise).filter(Boolean);
    if (payload.length && !normalised.length) throw malformed();
    const secondaryFilters = (bodyPart && primary !== 'bodyPart') || (equipment && primary !== 'equipment');
    const items = normalised.filter(item => (!bodyPart || item.bodyPart.toLowerCase() === bodyPart) && (!equipment || item.equipment.toLowerCase() === equipment));
    // A full raw page indicates another page may exist; it is not a verified global total.
    const fullPage = payload.length === limit;
    const paginationLimitReached = fullPage && offset + limit > 2000;
    const hasMore = fullPage && !paginationLimitReached;
    return json({ items, total: null, source: SOURCE, nextOffset: hasMore ? offset + limit : null, hasMore, paginationInferred: true, paginationLimitReached, filterScope: secondaryFilters ? 'provider-page' : 'provider' });
  } catch (error) {
    if (error instanceof PublicError) return json({ code: error.code, message: error.message }, error.status);
    return json({ code: 'PROVIDER_UNAVAILABLE', message: 'The content provider is temporarily unavailable. Please try again later.' }, 502);
  }
}
