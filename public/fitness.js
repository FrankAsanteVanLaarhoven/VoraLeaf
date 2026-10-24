/* VORALEAF exercise discovery. Provider secrets stay on the server. */
(function () {
  'use strict';
  var currentCleanup = null;
  var catalogState = { search: '', bodyPart: '', equipment: '', offset: 0, limit: 6 };
  var itemMemory = new Map();
  var sourceMemory = new Map();
  var key = 'voraleaf-fitness-session';
  var bodyParts = ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];
  var equipmentTypes = ['body weight', 'chair', 'wall', 'dumbbell', 'barbell', 'cable', 'leverage machine', 'resistance band', 'kettlebell'];
  var esc = function (text) { return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var cleanText = function (value, max) { return typeof value === 'string' ? value.trim().slice(0, max || 200) : ''; };
  function https(value) { try { var u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch (_) { return ''; } }
  function mediaUrl(value) { return typeof value === 'string' && /^\/api\/fitness\/image\/[a-zA-Z0-9_-]+(?:\?resolution=(?:180|360|720|1080))?$/.test(value) ? value : https(value); }
  function list(value) { return Array.isArray(value) ? value.filter(function (v) { return typeof v === 'string'; }).slice(0, 15) : []; }
  function normalise(value) {
    if (!value || typeof value !== 'object') return null;
    var id = cleanText(value.id || value.exerciseId, 90), name = cleanText(value.name, 150);
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || !name) return null;
    return { id: id, name: name, bodyPart: cleanText(value.bodyPart || list(value.bodyParts)[0], 60), target: cleanText(value.target || list(value.targetMuscles)[0], 90), equipment: cleanText(value.equipment || list(value.equipments)[0], 90), secondaryMuscles: list(value.secondaryMuscles).map(function (s) { return s.slice(0, 90); }), instructions: list(value.instructions).map(function (s) { return s.slice(0, 1400); }), description: cleanText(value.description, 1200), image: mediaUrl(value.image || value.gifUrl || value.imageUrl), sourceUrl: https(value.sourceUrl), videoQuery: cleanText(value.videoQuery || name + ' exercise technique', 160) };
  }
  function attribution() { return cleanText((window.VORALEAF_FITNESS || {}).sourceAttribution, 600) || 'Starter movement descriptions are paraphrased from linked NHS guidance. No endorsement of VORALEAF is implied.'; }
  function seed() { var data = window.VORALEAF_FITNESS || []; return (Array.isArray(data) ? data : data.exercises || []).map(normalise).filter(Boolean); }
  function seedVideos(id) { var data = window.VORALEAF_FITNESS || {}; return (Array.isArray(data.videos) ? data.videos : []).filter(function (v) { return v.embeddable !== false && (!Array.isArray(v.exerciseIds) || v.exerciseIds.includes(id)); }).map(normaliseVideo).filter(Boolean); }
  function normaliseVideo(value) { if (!value || !/^[a-zA-Z0-9_-]{11}$/.test(value.id || '')) return null; return { id: value.id, title: cleanText(value.title, 180) || 'Exercise video', channelTitle: cleanText(value.channelTitle, 120), thumbnail: https(value.thumbnail) }; }
  function starter(id) { return seed().find(function (e) { return e.id === id; }); }
  function remember(items, source) { items.forEach(function (e) { itemMemory.set(e.id, e); if (source) sourceMemory.set(e.id, source); }); }
  function known(id) { return starter(id) || itemMemory.get(id); }
  function sessionRead() { try { var a = JSON.parse(localStorage.getItem(key) || '[]'); return (Array.isArray(a) ? a : []).filter(function (i) { return i && /^[a-zA-Z0-9_-]{1,90}$/.test(i.id || ''); }).slice(0, 20).map(function (i) { return { id: i.id, sets: Math.min(5, Math.max(1, Number.isFinite(Number(i.sets)) ? Math.floor(Number(i.sets)) : 1)), reps: cleanText(i.reps, 35) }; }); } catch (_) { return []; } }
  function sessionWrite(items) { try { localStorage.setItem(key, JSON.stringify(items.map(function (i) { return { id: i.id, sets: i.sets, reps: i.reps }; }))); return true; } catch (_) { return false; } }
  function routeId(path) { var match = /^\/fitness\/([^/?#]+)\/?$/.exec(path || location.pathname); if (!match) return null; try { return decodeURIComponent(match[1]); } catch (_) { return ''; } }
  function bodyGraphic(body, name) {
    var region = String(body || '').toLowerCase();
    var head = /neck/.test(region), torso = /back|chest|waist|cardio/.test(region), arms = /arms|shoulders/.test(region), legs = /legs/.test(region);
    return '<svg class="fitness-body-graphic" viewBox="0 0 220 220" role="img" aria-label="' + esc('Illustrative ' + (body || 'movement') + ' focus') + '"><circle class="fitness-graphic-ring" cx="110" cy="110" r="88"/><circle class="fitness-graphic-ring" cx="110" cy="110" r="66"/><path class="fitness-figure-line" d="M110 31a14 14 0 1 1 0 28 14 14 0 0 1 0-28ZM92 66Q110 60 128 66L139 112 129 132 132 186 119 186 110 138 101 186 88 186 91 132 81 112Z"/><path class="fitness-figure-line" d="M92 68 72 80 59 115 67 119 83 91M128 68 148 80 161 115 153 119 137 91M96 92H124M110 67V126"/>' + (head ? '<path class="fitness-focus" d="M104 59h12v12h-12z"/>' : '') + (torso ? '<path class="fitness-focus" d="M95 75Q110 68 125 75L123 116 110 128 97 116Z"/>' : '') + (arms ? '<path class="fitness-focus" d="m88 73-14 12-10 25 7 3 15-23 8-9Zm44 0 14 12 10 25-7 3-15-23-8-9Z"/>' : '') + (legs ? '<path class="fitness-focus" d="m96 129 12 3-8 45h-8Zm16 3 12-3 4 48h-8Z"/>' : '') + (!head && !torso && !arms && !legs ? '<path class="fitness-focus" d="M97 75Q110 69 123 75L121 111 110 123 99 111Z"/>' : '') + '<path class="fitness-graphic-cross" d="M22 110h9m158 0h9M110 22v9m0 158v9"/></svg>';
  }
  function visual(exercise) { return '<div class="fitness-exercise-art">' + bodyGraphic(exercise.bodyPart, exercise.name) + (exercise.image ? '<img class="fitness-provider-image" src="' + esc(exercise.image) + '" alt="' + esc(exercise.name + ' exercise demonstration') + '" loading="lazy" referrerpolicy="no-referrer">' : '') + '<span class="fitness-art-label">' + esc(exercise.image ? 'PROVIDER DEMONSTRATION' : 'ILLUSTRATIVE FOCUS AREA') + '</span></div>'; }
  function exerciseCard(exercise, session) { return '<article class="fitness-card"><a data-link href="/fitness/' + encodeURIComponent(exercise.id) + '" class="fitness-card-visual" tabindex="-1" aria-hidden="true">' + visual(exercise) + '</a><div class="fitness-card-copy"><p class="fitness-card-kicker">' + esc(exercise.bodyPart || 'Movement') + ' <span>·</span> ' + esc(exercise.equipment || 'Equipment varies') + '</p><h3><a data-link href="/fitness/' + encodeURIComponent(exercise.id) + '">' + esc(exercise.name) + '</a></h3><p class="fitness-card-target">Focus: ' + esc(exercise.target || 'See full guidance') + '</p><div class="fitness-card-actions"><a class="text-link" data-link href="/fitness/' + encodeURIComponent(exercise.id) + '">Explore movement ↗</a><button type="button" class="fitness-add" data-fitness-action="add" data-id="' + esc(exercise.id) + '" aria-label="Add ' + esc(exercise.name) + ' to my session">' + (session.some(function (i) { return i.id === exercise.id; }) ? 'Added ✓' : '+ My session') + '</button></div></div></article>'; }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label || value) + '</option>'; }
  function catalogMarkup() {
    var categories = [...new Set(bodyParts.concat(seed().map(function (e) { return e.bodyPart; })).filter(Boolean))].sort();
    var equipment = [...new Set(equipmentTypes.concat(seed().map(function (e) { return e.equipment; })).filter(Boolean))].sort();
    return '<section class="fitness-page" data-fitness-route="/fitness"><section class="fitness-hero"><div class="fitness-hero-copy"><div class="breadcrumb"><a data-link href="/">Home</a><span>/</span><span>The movement library</span></div><span class="eyebrow">THE VORALEAF MOVEMENT LIBRARY</span><h1>Move with<br><em>intention.</em></h1><p>Explore movements, discover technique videos and collect ideas for your own session. Find the pace and approach that suit you.</p><a class="button" href="#fitness-library">Explore the exercises <span aria-hidden="true">↘</span></a><p class="fitness-hero-fine">Movement inspiration is separate from coffee benefits.</p></div><div class="fitness-hero-photo"><img src="/assets/strength.webp" alt="A man taking a relaxed pause in a bright exercise studio" width="760" height="650"><span>YOUR PACE. YOUR PRACTICE.</span></div></section><section class="section-shell fitness-library" id="fitness-library"><div class="fitness-library-heading"><div><span class="eyebrow">EXPLORE. LEARN. MAKE IT YOURS.</span><h2>Find your next movement.</h2></div><a class="text-link" href="#fitness-session">My session <span data-fitness="session-count">0</span> ↗</a></div><form class="fitness-filter-form" data-fitness="filter-form"><div class="fitness-search"><label for="fitness-search">Search exercises</label><div><input id="fitness-search" name="search" type="search" maxlength="80" placeholder="Try squats, shoulders, dumbbell…" value="' + esc(catalogState.search) + '"><button type="submit" aria-label="Search exercises">↗</button></div></div><div><label for="fitness-body">Body area</label><select name="bodyPart" id="fitness-body">' + option('', 'All body areas', catalogState.bodyPart) + categories.map(function (v) { return option(v, v, catalogState.bodyPart); }).join('') + '</select></div><div><label for="fitness-equipment">Equipment</label><select name="equipment" id="fitness-equipment">' + option('', 'All equipment', catalogState.equipment) + equipment.map(function (v) { return option(v, v, catalogState.equipment); }).join('') + '</select></div><div class="fitness-page-size"><label for="fitness-page-size">Per page</label><select name="limit" id="fitness-page-size">' + option('6', '6 exercises', String(catalogState.limit)) + option('10', '10 exercises', String(catalogState.limit)) + '</select></div></form><div class="fitness-body-rail" aria-label="Quick body area filters">' + ['', 'upper legs', 'chest', 'back', 'upper arms', 'waist', 'cardio'].map(function (v) { return '<button type="button" class="fitness-area-button' + (catalogState.bodyPart === v ? ' active' : '') + '" data-fitness-action="area" data-value="' + esc(v) + '" aria-pressed="' + (catalogState.bodyPart === v) + '">' + (v || 'All movements') + '</button>'; }).join('') + '</div><div class="fitness-results-bar"><p data-fitness="result-count">Explore the library</p><span class="fitness-source-badge" data-fitness="source">Curated starter library</span></div><p class="fitness-fetch-status" data-fitness="status" role="status" aria-live="polite"></p><div class="fitness-results-grid" data-fitness="results"></div><nav class="fitness-pagination" aria-label="Exercise results pages" data-fitness="pagination"></nav><div class="fitness-help-note"><span>Choose what suits you.</span><p>Use the full source guidance and choose activity suitable for your circumstances. Stop if an exercise causes pain or you feel unwell. This library is not a personalised training plan or a treatment for tiredness or breathlessness.</p><p class="fitness-attribution">Starter library: ' + esc(attribution()) + '</p></div><div data-fitness="session"></div></section></section>';
  }
  function detailMarkup(id) { return '<section class="fitness-page" data-fitness-route="/fitness/' + esc(encodeURIComponent(id)) + '"><div class="section-shell fitness-detail-shell"><div class="breadcrumb"><a data-link href="/">Home</a><span>/</span><a data-link href="/fitness">Movement library</a><span>/</span><span data-fitness="detail-crumb">Exercise</span></div><div data-fitness="detail"><p class="fitness-fetch-status" role="status">Opening this movement…</p></div><div data-fitness="videos"></div><div data-fitness="related"></div><div data-fitness="session"></div></div></section>'; }
  function render(path) { var id = routeId(path); return id !== null ? detailMarkup(id) : catalogMarkup(); }

  function mount(root) {
    if (currentCleanup) currentCleanup();
    root = root || document;
    var page = root.matches && root.matches('.fitness-page') ? root : root.querySelector('.fitness-page');
    if (!page) return function () {};
    var alive = true, serial = 0, requests = new Set(), events = new AbortController(), session = sessionRead(), currentItems = [], lastSource = 'starter';
    var restTimer = null, restLeft = 60, restDuration = 60;
    var q = function (name) { return page.querySelector('[data-fitness="' + name + '"]'); };
    remember(seed(), 'starter');
    function on(node, name, fn) { if (node) node.addEventListener(name, fn, { signal: events.signal }); }
    function status(text) { if (alive && q('status')) q('status').textContent = text; }
    async function api(path) {
      var controller = new AbortController(); requests.add(controller);
      var timeout = setTimeout(function () { controller.abort(); }, 10000);
      try {
        var response = window.VoraleafFitnessApi && typeof window.VoraleafFitnessApi.request === 'function' ? await window.VoraleafFitnessApi.request(path, { signal: controller.signal }) : await fetch(path, { signal: controller.signal, credentials: 'same-origin', headers: { Accept: 'application/json' } });
        if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) throw new Error('The extended library is unavailable.');
        var data = await response.json();
        if (!data || typeof data !== 'object') throw new Error('The library returned an invalid response.');
        return data;
      } finally { clearTimeout(timeout); requests.delete(controller); }
    }
    function liveSource(source) { return typeof source === 'string' && /exercisedb|rapidapi|live|oss/i.test(source) && !/starter|curated|fallback/i.test(source); }
    function attachImageFallback() { page.querySelectorAll('.fitness-provider-image').forEach(function (image) { on(image, 'error', function () { image.hidden = true; var art = image.closest('.fitness-exercise-art'); if (art) art.querySelector('.fitness-art-label').textContent = 'ILLUSTRATIVE FOCUS AREA'; }); }); }
    function localResults() { var search = catalogState.search.toLowerCase(); return seed().filter(function (e) { return (!catalogState.bodyPart || e.bodyPart === catalogState.bodyPart) && (!catalogState.equipment || e.equipment === catalogState.equipment) && (!search || [e.name, e.bodyPart, e.target, e.equipment].join(' ').toLowerCase().includes(search)); }); }
    function showResults(items, total, source, nextOffset) {
      if (!alive) return;
      currentItems = items; lastSource = source; remember(items, source);
      q('results').innerHTML = items.length ? items.map(function (e) { return exerciseCard(e, session); }).join('') : '<div class="fitness-empty"><h3>A little change of direction.</h3><p>No movements match these choices. Try another body area, equipment type or search.</p><button type="button" class="button outline" data-fitness-action="clear-filters">Show all movements</button></div>';
      var first = items.length ? catalogState.offset + 1 : 0, last = catalogState.offset + items.length;
      q('result-count').textContent = 'Showing ' + first + '–' + last + (Number.isFinite(total) ? ' of ' + total : '') + ' exercises';
      q('source').textContent = liveSource(source) ? 'ExerciseDB live' : 'Curated starter library';
      var previous = catalogState.offset > 0, next = Number.isFinite(nextOffset) && nextOffset > catalogState.offset ? Math.floor(nextOffset) : (Number.isFinite(total) && last < total ? catalogState.offset + catalogState.limit : null);
      q('pagination').innerHTML = '<button type="button" class="button outline small" data-fitness-action="previous"' + (!previous ? ' disabled' : '') + '>← Previous</button><span>Page ' + (Math.floor(catalogState.offset / catalogState.limit) + 1) + '</span><button type="button" class="button outline small" data-fitness-action="next" data-offset="' + (next === null ? '' : next) + '"' + (next === null ? ' disabled' : '') + '>Next →</button>';
      attachImageFallback(); updateSessionButtons();
    }
    async function loadCatalog() {
      var thisSerial = ++serial;
      var local = localResults();
      showResults(local.slice(catalogState.offset, catalogState.offset + catalogState.limit), local.length, 'starter', null);
      status('Looking for movements in the extended library…');
      var params = new URLSearchParams({ search: catalogState.search, bodyPart: catalogState.bodyPart, equipment: catalogState.equipment, limit: String(catalogState.limit), offset: String(catalogState.offset) });
      try {
        var data = await api('/api/fitness/exercises?' + params.toString());
        if (!alive || thisSerial !== serial) return;
        if (!Array.isArray(data.items)) throw new Error('Invalid exercise list.');
        var valid = data.items.map(normalise).filter(Boolean);
        showResults(valid, Number.isFinite(data.total) ? data.total : null, data.source || 'starter', Number.isFinite(data.nextOffset) ? data.nextOffset : null);
        status(liveSource(data.source) ? 'Explore movement details and related technique videos.' + (data.filterScope === 'provider-page' ? ' Filters apply to this page of live results.' : '') : 'Showing the curated starter library. Follow each source for full guidance.');
      } catch (_) { if (!alive || thisSerial !== serial) return; if (catalogState.offset >= local.length) catalogState.offset = Math.max(0, Math.floor((local.length - 1) / catalogState.limit) * catalogState.limit); showResults(local.slice(catalogState.offset, catalogState.offset + catalogState.limit), local.length, 'starter', null); status('Showing the curated starter library. The extended exercise feed is unavailable at the moment.'); }
    }
    function readFilters() {
      var form = q('filter-form'); if (!form) return;
      catalogState.search = cleanText(form.elements.search.value, 100);
      catalogState.bodyPart = cleanText(form.elements.bodyPart.value, 60);
      catalogState.equipment = cleanText(form.elements.equipment.value, 90);
      catalogState.limit = form.elements.limit.value === '10' ? 10 : 6;
      catalogState.offset = 0;
      page.querySelectorAll('.fitness-area-button').forEach(function (b) { var active = b.dataset.value === catalogState.bodyPart; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      loadCatalog();
    }
    function detail(exercise, source) {
      if (!alive) return;
      remember([exercise], source);
      q('detail-crumb').textContent = exercise.name;
      q('detail').innerHTML = '<div class="fitness-detail-grid"><div>' + visual(exercise) + '<p class="fitness-detail-art-note">' + (exercise.image ? 'Demonstration supplied by the exercise provider.' : 'Original illustration of the focus area; it is not a demonstration of technique.') + '</p></div><div class="fitness-detail-copy"><span class="eyebrow">' + esc(exercise.bodyPart || 'MOVEMENT') + ' · THE MOVEMENT LIBRARY</span><h1>' + esc(exercise.name) + '</h1><span class="fitness-source-badge">' + (liveSource(source) ? 'ExerciseDB live' : 'Curated starter library') + '</span>' + (exercise.description ? '<p class="fitness-detail-description">' + esc(exercise.description) + '</p>' : '') + '<dl class="fitness-attributes"><div><dt>Primary focus</dt><dd>' + esc(exercise.target || 'See source guidance') + '</dd></div><div><dt>Equipment</dt><dd>' + esc(exercise.equipment || 'See source guidance') + '</dd></div><div><dt>Body area</dt><dd>' + esc(exercise.bodyPart || 'Movement') + '</dd></div></dl>' + (exercise.secondaryMuscles.length ? '<p class="fitness-secondary">Additional areas: ' + exercise.secondaryMuscles.map(esc).join(', ') + '</p>' : '') + '<button type="button" class="button" data-fitness-action="add" data-id="' + esc(exercise.id) + '">+ Add to my session</button><p class="fitness-session-note">Your session is a collection of your choices, not a prescribed programme.</p></div></div><section class="fitness-instructions"><div><span class="eyebrow">GET TO KNOW THE MOVEMENT</span><h2>Approach it thoughtfully.</h2></div><div>' + (exercise.instructions.length ? '<ol>' + exercise.instructions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '<p>Use a qualified instructor or the full source guidance for appropriate technique.</p>') + (exercise.sourceUrl ? '<a class="text-link" href="' + esc(exercise.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Read the full source guidance ↗</a>' : '') + '<p class="fitness-attribution">' + esc(exercise.id.startsWith('starter-') ? attribution() : 'Exercise details are supplied by ExerciseDB. Follow appropriate full guidance; no endorsement of VORALEAF is implied.') + '</p><p class="fitness-safety">Choose activity suitable for your circumstances. Stop if it causes pain or you feel unwell. Seek appropriate advice if you are unsure about an exercise.</p></div></section>';
      attachImageFallback(); updateSessionButtons();
      var related = seed().filter(function (e) { return e.id !== exercise.id && (e.bodyPart === exercise.bodyPart || e.equipment === exercise.equipment); }).slice(0, 3);
      if (related.length < 3) seed().filter(function (e) { return e.id !== exercise.id && !related.some(function (r) { return r.id === e.id; }); }).slice(0, 3 - related.length).forEach(function (e) { related.push(e); });
      q('related').innerHTML = '<section class="fitness-related"><div class="fitness-library-heading"><div><span class="eyebrow">KEEP EXPLORING</span><h2>A little more inspiration.</h2></div><a data-link class="text-link" href="/fitness">Back to all exercises ↗</a></div><div class="fitness-results-grid">' + related.map(function (e) { return exerciseCard(e, session); }).join('') + '</div></section>';
      loadVideos(exercise);
    }
    async function loadDetail(id) {
      if (!id || !/^[a-zA-Z0-9_-]{1,90}$/.test(id)) { detailMissing(); return; }
      var local = known(id);
      if (local) { detail(local, id.startsWith('starter-') ? 'starter' : sourceMemory.get(id) || 'exercisedb'); if (id.startsWith('starter-')) return; }
      try {
        var data = await api('/api/fitness/exercises/' + encodeURIComponent(id));
        if (!alive) return;
        var exercise = normalise(data.item);
        if (!exercise) throw new Error('Invalid exercise detail.');
        detail(exercise, data.source || 'exercisedb');
      } catch (_) { if (!alive) return; if (!local) detailMissing(); }
    }
    function detailMissing() { if (!alive) return; q('detail').innerHTML = '<div class="fitness-empty"><span class="eyebrow">A LITTLE CHANGE OF DIRECTION</span><h1>This movement<br>is unavailable.</h1><p>It may need the extended exercise feed. You can still explore our curated starter library.</p><a data-link class="button" href="/fitness">Explore the library ↗</a></div>'; }
    function videosMarkup(exercise, videos, message) {
      var url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(exercise.videoQuery || exercise.name + ' exercise technique');
      return '<section class="fitness-videos"><div class="fitness-library-heading"><div><span class="eyebrow">WATCH THE MOVEMENT</span><h2>See technique in practice.</h2></div></div><p class="fitness-video-intro">Videos are published by their respective creators. Choose suitable guidance and check the instructor’s credentials. No endorsement of VORALEAF is implied.</p>' + (videos.length ? '<div class="fitness-video-grid">' + videos.slice(0, 3).map(function (v) { return '<article class="fitness-video-card"><div class="fitness-video-consent" data-video-container="' + esc(v.id) + '"><span class="fitness-video-play" aria-hidden="true">▶</span><p>' + esc(v.title) + '</p><button type="button" class="button outline small" data-fitness-action="load-video" data-video-id="' + esc(v.id) + '" data-video-title="' + esc(v.title) + '">Play movement video</button><small>Plays in the VORALEAF viewer using YouTube.</small></div><h3>' + esc(v.title) + '</h3><p>Video source: YouTube' + (v.channelTitle ? ' · ' + esc(v.channelTitle) : '') + '</p><a class="text-link" href="https://www.youtube.com/watch?v=' + esc(v.id) + '" target="_blank" rel="noopener noreferrer">Open in viewer ↗</a></article>'; }).join('') + '</div>' : '<div class="fitness-video-empty"><p>' + esc(message || 'Related-video search is unavailable. View the source search link; provider search pages may not support embedding.') + '</p><a class="button outline" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">View source search link ↗</a></div>') + '</section>';
    }
    async function loadVideos(exercise) {
      var initial = seedVideos(exercise.id);
      q('videos').innerHTML = videosMarkup(exercise, initial, 'Related-video search is loading. The source search link is available in the viewer; search pages may not support embedding.');
      try {
        var data = await api('/api/fitness/videos?query=' + encodeURIComponent((exercise.videoQuery || exercise.name + ' exercise technique').replace(/[^\p{L}\p{N} '\-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)));
        if (!alive) return;
        var videos = (Array.isArray(data.items) ? data.items : []).map(normaliseVideo).filter(Boolean);
        q('videos').innerHTML = videosMarkup(exercise, videos.length ? videos : initial, 'No matching videos were returned. View the source search link; provider search pages may not support embedding.');
      } catch (_) { if (alive) q('videos').innerHTML = videosMarkup(exercise, initial, 'Integrated video search is unavailable. View the source search link; provider search pages may not support embedding.'); }
    }
    function sessionMarkup() {
      return '<section class="fitness-session" id="fitness-session" aria-labelledby="fitness-session-heading"><div class="fitness-library-heading"><div><span class="eyebrow">YOUR MOVEMENTS. YOUR CHOICES.</span><h2 id="fitness-session-heading">My session.</h2></div><span class="fitness-source-badge">Saved on this device</span></div><p class="fitness-session-intro">Collect movements you want to explore. Choose your own counts with appropriate guidance. This is a planning notebook, not an exercise prescription.</p><div class="fitness-session-items">' + (session.length ? session.map(function (entry) { var e = known(entry.id), name = e ? e.name : 'Saved exercise'; return '<div class="fitness-session-item"><div><a data-link href="/fitness/' + encodeURIComponent(entry.id) + '">' + esc(name) + ' ↗</a><small>' + esc(e ? e.equipment : 'Open to refresh exercise information') + '</small></div><label>Sets<input type="number" min="1" max="5" step="1" value="' + entry.sets + '" data-session-field="sets" data-id="' + esc(entry.id) + '" aria-label="Sets for ' + esc(name) + '"></label><label>Reps / time<input type="text" maxlength="35" placeholder="Your choice" value="' + esc(entry.reps) + '" data-session-field="reps" data-id="' + esc(entry.id) + '" aria-label="Repetitions or time for ' + esc(name) + '"></label><button type="button" class="fitness-remove" data-fitness-action="remove" data-id="' + esc(entry.id) + '" aria-label="Remove ' + esc(name) + '">Remove</button></div>'; }).join('') : '<p class="fitness-session-empty">Your session has room for something new. Explore an exercise and choose “My session” to keep it here.</p>') + '</div><div class="fitness-session-footer"><p data-fitness="session-status" role="status">Only exercise IDs and your own counts are saved. Provider instructions and media are not stored in your session.</p><button type="button" class="button outline small" data-fitness-action="export-session"' + (!session.length ? ' disabled' : '') + '>Export my session ↗</button></div><div class="fitness-rest"><div><span class="eyebrow">A LITTLE ROOM BETWEEN MOVEMENTS</span><h3>Take your time.</h3><p>An optional timer, at the duration you choose.</p></div><div class="fitness-rest-controls"><label for="fitness-rest-duration">Timer duration</label><select id="fitness-rest-duration" data-fitness="rest-duration">' + [30, 60, 90, 120].map(function (n) { return option(String(n), n + ' seconds', String(restDuration)); }).join('') + '</select><span class="fitness-rest-clock" data-fitness="rest-clock" role="timer">' + clock(restLeft) + '</span><button type="button" class="button light small" data-fitness-action="rest-toggle">' + (restTimer ? 'Pause timer' : 'Start timer') + '</button><button type="button" class="fitness-rest-reset" data-fitness-action="rest-reset">Reset</button></div></div></section>';
    }
    function clock(n) { return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0'); }
    function updateSessionButtons() { page.querySelectorAll('[data-fitness-action="add"]').forEach(function (b) { var added = session.some(function (s) { return s.id === b.dataset.id; }); b.textContent = added ? 'In my session ✓' : (b.classList.contains('fitness-add') ? '+ My session' : '+ Add to my session'); b.setAttribute('aria-pressed', String(added)); }); if (q('session-count')) q('session-count').textContent = session.length; }
    function drawSession() { if (!alive || !q('session')) return; q('session').innerHTML = sessionMarkup(); updateSessionButtons(); }
    function saveSession(message) { var ok = sessionWrite(session); if (q('session-status')) q('session-status').textContent = ok ? message || 'Your session choices are saved on this device.' : 'Browser storage is unavailable. Export your session to keep it.'; }
    function exportSession() {
      var text = 'MY VORALEAF MOVEMENT SESSION\n\n' + session.map(function (i, n) { var e = starter(i.id); return (n + 1) + '. ' + (e ? e.name : 'Saved exercise ' + i.id) + '\n   Sets: ' + i.sets + '\n   Reps / time: ' + (i.reps || 'Not selected') + '\n   Exercise: ' + location.origin + '/fitness/' + encodeURIComponent(i.id); }).join('\n\n') + '\n\nPersonal planning notes, not a prescribed exercise programme. Use appropriate full source guidance.\n';
      var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' })); var a = document.createElement('a'); a.href = url; a.download = 'VORALEAF-my-movement-session.txt'; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000); saveSession('Your text export is ready. Check your browser downloads.');
    }
    function stopRest() { if (restTimer) clearInterval(restTimer); restTimer = null; }
    function updateRest() { if (q('rest-clock')) q('rest-clock').textContent = clock(restLeft); var b = page.querySelector('[data-fitness-action="rest-toggle"]'); if (b) b.textContent = restTimer ? 'Pause timer' : (restLeft ? 'Start timer' : 'Start another timer'); }
    on(page, 'click', function (event) {
      var button = event.target.closest('[data-fitness-action]'); if (!button || !page.contains(button) || button.disabled) return;
      var action = button.dataset.fitnessAction;
      if (action === 'add') {
        var id = button.dataset.id;
        if (session.some(function (i) { return i.id === id; })) { if (q('session-status')) q('session-status').textContent = 'This movement is already in your session.'; return; }
        if (session.length >= 20) { if (q('session-status')) q('session-status').textContent = 'Your session holds up to 20 movements. Remove one before adding another.'; return; }
        if (!known(id)) return; session.push({ id: id, sets: 1, reps: '' }); drawSession(); saveSession('Movement added. Choose your own sets and repetitions or time.');
      } else if (action === 'remove') { session = session.filter(function (i) { return i.id !== button.dataset.id; }); drawSession(); saveSession('Movement removed from your session.'); var heading = page.querySelector('#fitness-session-heading'); if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); } }
      else if (action === 'export-session') exportSession();
      else if (action === 'area') { q('filter-form').elements.bodyPart.value = button.dataset.value; readFilters(); }
      else if (action === 'clear-filters') { q('filter-form').reset(); q('filter-form').elements.search.value = ''; q('filter-form').elements.bodyPart.value = ''; q('filter-form').elements.equipment.value = ''; readFilters(); }
      else if (action === 'next' || action === 'previous') { catalogState.offset = action === 'next' ? Number(button.dataset.offset) : Math.max(0, catalogState.offset - catalogState.limit); loadCatalog(); q('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
      else if (action === 'load-video') {
        var videoId = button.dataset.videoId; if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return;
        var target = button.closest('[data-video-container]'); if (!target) return;
        try {
          if (!window.VoraleafViewer || typeof window.VoraleafViewer.open !== 'function') throw new Error('Viewer unavailable');
          window.VoraleafViewer.open({ url: 'https://www.youtube.com/watch?v=' + videoId, title: button.dataset.videoTitle || 'Exercise technique video' });
        } catch (_) {
          var note = target.querySelector('small');
          if (note) note.textContent = 'The source viewer is unavailable. Refresh the app and try again.';
        }
      } else if (action === 'rest-toggle') {
        if (restTimer) stopRest(); else { if (restLeft <= 0) restLeft = restDuration; restTimer = setInterval(function () { restLeft = Math.max(0, restLeft - 1); if (!restLeft) { stopRest(); if (q('session-status')) q('session-status').textContent = 'Your timer has finished. Continue at your own pace.'; } updateRest(); }, 1000); } updateRest();
      } else if (action === 'rest-reset') { stopRest(); restLeft = restDuration; updateRest(); }
    });
    on(page, 'input', function (event) { var field = event.target.closest('[data-session-field]'); if (!field) return; var entry = session.find(function (i) { return i.id === field.dataset.id; }); if (!entry) return; if (field.dataset.sessionField === 'sets') entry.sets = Math.max(1, Math.min(5, Math.floor(Number(field.value) || 1))); else entry.reps = cleanText(field.value, 35); saveSession(); });
    on(page, 'change', function (event) {
      if (event.target.matches('[data-fitness="rest-duration"]')) { stopRest(); restDuration = Number(event.target.value); restLeft = restDuration; updateRest(); }
      else if (event.target.closest('[data-fitness="filter-form"]') && event.target.matches('select')) readFilters();
      else if (event.target.matches('[data-session-field="sets"]')) { var entry = session.find(function (i) { return i.id === event.target.dataset.id; }); if (entry) event.target.value = entry.sets; }
    });
    on(q('filter-form'), 'submit', function (event) { event.preventDefault(); readFilters(); });
    var id = routeId(page.dataset.fitnessRoute);
    drawSession();
    if (id !== null) loadDetail(id); else loadCatalog();
    currentCleanup = function () { if (!alive) return; alive = false; serial++; events.abort(); requests.forEach(function (c) { c.abort(); }); requests.clear(); itemMemory.clear(); sourceMemory.clear(); stopRest(); page.querySelectorAll('iframe').forEach(function (iframe) { iframe.remove(); }); };
    return currentCleanup;
  }
  window.VoraleafFitness = { render: render, mount: mount, cleanup: function () { if (currentCleanup) { currentCleanup(); currentCleanup = null; } } };
}());
