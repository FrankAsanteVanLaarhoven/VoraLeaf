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
    var dbId = cleanText(value.exerciseDbId || (/^\d{4}$/.test(id) ? id : ''), 10) || '0025';
    var motion = cleanText(value.motion, 40) || inferMotion(name, value.bodyPart, value.equipment);
    var imgUrl = mediaUrl(value.image || value.gifUrl || value.imageUrl) || ('/api/fitness/image/' + encodeURIComponent(dbId) + '?resolution=360');
    return { id: id, exerciseDbId: dbId, motion: motion, name: name, bodyPart: cleanText(value.bodyPart || list(value.bodyParts)[0], 60), target: cleanText(value.target || list(value.targetMuscles)[0], 90), equipment: cleanText(value.equipment || list(value.equipments)[0], 90), secondaryMuscles: list(value.secondaryMuscles).map(function (s) { return s.slice(0, 90); }), instructions: list(value.instructions).map(function (s) { return s.slice(0, 1400); }), description: cleanText(value.description, 1200), image: imgUrl, sourceUrl: https(value.sourceUrl), videoQuery: cleanText(value.videoQuery || name + ' exercise technique', 160) };
  }
  function inferMotion(name, bodyPart, equipment) {
    var s = (String(name || '') + ' ' + String(bodyPart || '') + ' ' + String(equipment || '')).toLowerCase();
    if (/bench|chest fly|incline/.test(s)) return 'bench-press';
    if (/squat|split/.test(s)) return 'squat';
    if (/deadlift|hip thrust/.test(s)) return 'deadlift';
    if (/pulldown|pull-up|chin/.test(s)) return 'lat-pulldown';
    if (/shoulder|overhead|shrug/.test(s)) return 'shoulder-press';
    if (/row/.test(s)) return 'cable-row';
    if (/swing|kettlebell|cardio/.test(s)) return 'kettlebell-swing';
    if (/leg press|sled/.test(s)) return 'leg-press';
    if (/triceps|pushdown/.test(s)) return 'triceps-pushdown';
    if (/face pull|band/.test(s)) return 'face-pull';
    if (/wrist|forearm/.test(s)) return 'wrist-curl';
    if (/plank|twist|waist|abs/.test(s)) return 'plank';
    if (/biceps|curl/.test(s)) return 'biceps-curl';
    if (/push-up|press-up/.test(s)) return 'push-up';
    if (/calf|ankle/.test(s)) return 'calf-raise';
    return 'squat';
  }
  function attribution() { return cleanText((window.VORALEAF_FITNESS || {}).sourceAttribution, 600) || 'Exercise schema, muscle targeting and biomechanics powered by ExerciseDB (exercisedb.p.rapidapi.com).'; }
  function seed() { var data = window.VORALEAF_FITNESS || []; return (Array.isArray(data) ? data : data.exercises || []).map(normalise).filter(Boolean); }
  function seedVideos(id) { var data = window.VORALEAF_FITNESS || {}; return (Array.isArray(data.videos) ? data.videos : []).filter(function (v) { return v.embeddable !== false && (!Array.isArray(v.exerciseIds) || v.exerciseIds.includes(id)); }).map(normaliseVideo).filter(Boolean); }
  function normaliseVideo(value) { if (!value || !/^[a-zA-Z0-9_-]{11}$/.test(value.id || '')) return null; return { id: value.id, title: cleanText(value.title, 180) || 'Exercise video', channelTitle: cleanText(value.channelTitle, 120), thumbnail: https(value.thumbnail) }; }
  function starter(id) { return seed().find(function (e) { return e.id === id; }); }
  function remember(items, source) { items.forEach(function (e) { itemMemory.set(e.id, e); if (source) sourceMemory.set(e.id, source); }); }
  function known(id) { return starter(id) || itemMemory.get(id); }
  function sessionRead() { try { var a = JSON.parse(localStorage.getItem(key) || '[]'); return (Array.isArray(a) ? a : []).filter(function (i) { return i && /^[a-zA-Z0-9_-]{1,90}$/.test(i.id || ''); }).slice(0, 20).map(function (i) { return { id: i.id, sets: Math.min(5, Math.max(1, Number.isFinite(Number(i.sets)) ? Math.floor(Number(i.sets)) : 1)), reps: cleanText(i.reps, 35) }; }); } catch (_) { return []; } }
  function sessionWrite(items) { try { localStorage.setItem(key, JSON.stringify(items.map(function (i) { return { id: i.id, sets: i.sets, reps: i.reps }; }))); return true; } catch (_) { return false; } }
  function routeId(path) { var match = /^\/fitness\/([^/?#]+)\/?$/.exec(path || location.pathname); if (!match) return null; try { return decodeURIComponent(match[1]); } catch (_) { return ''; } }
  function dbRigScene(motion) {
    switch (motion) {
      case 'bench-press':
        return '<g class="db-apparatus"><rect x="62" y="138" width="145" height="10" rx="3"/><line x1="85" y1="148" x2="85" y2="184"/><line x1="185" y1="148" x2="185" y2="184"/><line x1="115" y1="86" x2="115" y2="148"/></g>' +
          '<g class="db-body-static"><circle cx="96" cy="126" r="11"/><path d="M108 131 H178 L200 152 L205 182"/><ellipse class="db-muscle-glow" cx="132" cy="126" rx="18" ry="8"/></g>' +
          '<g class="db-rig-moving db-move-vertical"><line class="db-limb" x1="126" y1="130" x2="126" y2="86"/><line class="db-bar" x1="78" y1="84" x2="174" y2="84"/><rect class="db-plate" x="84" y="68" width="8" height="32" rx="2"/><rect class="db-plate" x="160" y="68" width="8" height="32" rx="2"/></g>';
      case 'squat':
        return '<g class="db-apparatus"><line x1="92" y1="42" x2="92" y2="184"/><line x1="228" y1="42" x2="228" y2="184"/><line x1="70" y1="184" x2="250" y2="184"/></g>' +
          '<g class="db-rig-moving db-move-squat"><circle cx="160" cy="56" r="11"/><path class="db-limb" d="M160 68 L152 118 L130 148 L138 182 M152 118 L182 148 L176 182"/><ellipse class="db-muscle-glow" cx="142" cy="134" rx="14" ry="8"/><ellipse class="db-muscle-glow" cx="170" cy="134" rx="14" ry="8"/><line class="db-bar" x1="104" y1="72" x2="216" y2="72"/><rect class="db-plate" x="110" y="56" width="9" height="32" rx="2"/><rect class="db-plate" x="201" y="56" width="9" height="32" rx="2"/></g>';
      case 'deadlift':
        return '<g class="db-apparatus"><line x1="70" y1="184" x2="250" y2="184"/></g>' +
          '<g class="db-body-static"><path class="db-limb" d="M145 132 L140 182 M175 132 L180 182"/><ellipse class="db-muscle-glow" cx="143" cy="148" rx="8" ry="15"/><ellipse class="db-muscle-glow" cx="177" cy="148" rx="8" ry="15"/></g>' +
          '<g class="db-rig-moving db-move-hinge"><circle cx="160" cy="64" r="11"/><path class="db-limb" d="M160 76 L160 132 M146 84 L142 138 M174 84 L178 138"/><ellipse class="db-muscle-glow" cx="160" cy="108" rx="14" ry="18"/><line class="db-bar" x1="96" y1="140" x2="224" y2="140"/><rect class="db-plate" x="104" y="120" width="10" height="40" rx="2"/><rect class="db-plate" x="206" y="120" width="10" height="40" rx="2"/></g>';
      case 'lat-pulldown':
        return '<g class="db-apparatus"><line x1="160" y1="28" x2="160" y2="62"/><rect x="132" y="146" width="56" height="8" rx="2"/><line x1="160" y1="154" x2="160" y2="184"/></g>' +
          '<g class="db-body-static"><circle cx="160" cy="88" r="11"/><path class="db-limb" d="M160 100 L160 146 L136 182 M160 146 L184 182"/><ellipse class="db-muscle-glow" cx="145" cy="118" rx="10" ry="18"/><ellipse class="db-muscle-glow" cx="175" cy="118" rx="10" ry="18"/></g>' +
          '<g class="db-rig-moving db-move-pull"><path class="db-bar" d="M106 58 L124 52 H196 L214 58"/><path class="db-limb" d="M144 104 L120 58 M176 104 L200 58"/></g>';
      case 'shoulder-press':
        return '<g class="db-apparatus"><rect x="136" y="148" width="48" height="8" rx="2"/><line x1="160" y1="156" x2="160" y2="184"/></g>' +
          '<g class="db-body-static"><circle cx="160" cy="86" r="11"/><path class="db-limb" d="M160 98 L160 148 L138 182 M160 148 L182 182"/><ellipse class="db-muscle-glow" cx="138" cy="100" rx="11" ry="9"/><ellipse class="db-muscle-glow" cx="182" cy="100" rx="11" ry="9"/></g>' +
          '<g class="db-rig-moving db-move-overhead"><path class="db-limb" d="M142 100 L122 72 L122 48 M178 100 L198 72 L198 48"/><rect class="db-plate" x="108" y="42" width="28" height="9" rx="2"/><rect class="db-plate" x="184" y="42" width="28" height="9" rx="2"/></g>';
      case 'cable-row':
        return '<g class="db-apparatus"><rect x="68" y="64" width="12" height="120" rx="2"/><line x1="68" y1="184" x2="248" y2="184"/></g>' +
          '<g class="db-body-static"><circle cx="192" cy="84" r="11"/><path class="db-limb" d="M192 96 L192 148 L130 164 L92 164"/><ellipse class="db-muscle-glow" cx="198" cy="118" rx="12" ry="18"/></g>' +
          '<g class="db-rig-moving db-move-horizontal"><line class="db-bar" x1="80" y1="122" x2="168" y2="122"/><path class="db-limb" d="M192 104 L168 122"/><rect class="db-plate" x="162" y="112" width="9" height="20" rx="2"/></g>';
      case 'kettlebell-swing':
        return '<g class="db-apparatus"><line x1="70" y1="184" x2="250" y2="184"/></g>' +
          '<g class="db-body-static"><path class="db-limb" d="M146 128 L136 182 M174 128 L184 182"/><ellipse class="db-muscle-glow" cx="152" cy="126" rx="16" ry="12"/></g>' +
          '<g class="db-rig-moving db-move-swing"><circle cx="166" cy="64" r="11"/><path class="db-limb" d="M164 76 L156 126 M162 86 L208 106"/><circle class="db-plate" cx="218" cy="112" r="13"/></g>';
      case 'leg-press':
        return '<g class="db-apparatus"><line x1="78" y1="168" x2="132" y2="184"/><line x1="110" y1="68" x2="232" y2="148"/></g>' +
          '<g class="db-body-static"><circle cx="92" cy="134" r="10"/><path class="db-limb" d="M98 144 L124 172"/><ellipse class="db-muscle-glow" cx="144" cy="148" rx="16" ry="10"/></g>' +
          '<g class="db-rig-moving db-move-sled"><path class="db-limb" d="M124 172 L156 132 L192 112"/><line class="db-bar" x1="178" y1="88" x2="208" y2="134"/><rect class="db-plate" x="192" y="92" width="18" height="26" rx="2" transform="rotate(-32 201 105)"/></g>';
      case 'triceps-pushdown':
      case 'face-pull':
        return '<g class="db-apparatus"><rect x="96" y="34" width="14" height="150" rx="2"/><line x1="110" y1="42" x2="148" y2="42"/></g>' +
          '<g class="db-body-static"><circle cx="176" cy="66" r="11"/><path class="db-limb" d="M176 78 L176 132 L166 182 M176 132 L188 182"/><ellipse class="db-muscle-glow" cx="166" cy="98" rx="9" ry="14"/></g>' +
          '<g class="db-rig-moving db-move-pushdown"><line class="db-bar" x1="148" y1="42" x2="152" y2="118"/><path class="db-limb" d="M168 92 L152 118"/><circle class="db-plate" cx="152" cy="122" r="5"/></g>';
      case 'biceps-curl':
      case 'wrist-curl':
        return '<g class="db-apparatus"><line x1="70" y1="184" x2="250" y2="184"/></g>' +
          '<g class="db-body-static"><circle cx="160" cy="56" r="11"/><path class="db-limb" d="M160 68 L160 128 L146 182 M160 128 L174 182"/><ellipse class="db-muscle-glow" cx="142" cy="94" rx="9" ry="14"/><ellipse class="db-muscle-glow" cx="178" cy="94" rx="9" ry="14"/></g>' +
          '<g class="db-rig-moving db-move-curl"><path class="db-limb" d="M142 82 L132 108 L144 86 M178 82 L188 108 L176 86"/><rect class="db-plate" x="128" y="78" width="22" height="8" rx="2"/><rect class="db-plate" x="170" y="78" width="22" height="8" rx="2"/></g>';
      case 'plank':
      case 'push-up':
        return '<g class="db-apparatus"><line x1="56" y1="172" x2="264" y2="172"/></g>' +
          '<g class="db-rig-moving db-move-plank"><circle cx="92" cy="118" r="10"/><path class="db-limb" d="M104 122 L172 134 L228 148 L228 170 M112 124 L106 168 L128 168"/><ellipse class="db-muscle-glow" cx="154" cy="134" rx="26" ry="9"/></g>';
      case 'calf-raise':
      default:
        return '<g class="db-apparatus"><rect x="126" y="172" width="68" height="12" rx="2"/></g>' +
          '<g class="db-rig-moving db-move-calf"><circle cx="160" cy="52" r="11"/><path class="db-limb" d="M160 64 L160 122 L148 170 M160 122 L172 170"/><ellipse class="db-muscle-glow" cx="145" cy="148" rx="8" ry="14"/><ellipse class="db-muscle-glow" cx="175" cy="148" rx="8" ry="14"/><line class="db-bar" x1="108" y1="70" x2="212" y2="70"/><rect class="db-plate" x="114" y="56" width="8" height="28" rx="2"/><rect class="db-plate" x="198" y="56" width="8" height="28" rx="2"/></g>';
    }
  }
  function visual(exercise) {
    var dbId = exercise.exerciseDbId || '0025';
    var motion = exercise.motion || inferMotion(exercise.name, exercise.bodyPart, exercise.equipment);
    return '<div class="fitness-exercise-art fitness-db-stage" data-db-stage>' +
      '<svg class="fitness-db-svg" viewBox="0 0 320 220" fill="none" role="img" aria-label="' + esc('Animated ExerciseDB movement demonstration for ' + exercise.name) + '">' +
      '<defs><pattern id="db-grid-' + esc(exercise.id) + '" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(24,62,50,0.08)" stroke-width="1"/></pattern></defs>' +
      '<rect width="320" height="220" fill="url(#db-grid-' + esc(exercise.id) + ')"/>' +
      dbRigScene(motion) +
      '</svg>' +
      (exercise.image ? '<img class="fitness-provider-image" src="' + esc(exercise.image) + '" alt="' + esc(exercise.name + ' ExerciseDB demonstration') + '" loading="lazy" referrerpolicy="no-referrer">' : '') +
      '<span class="fitness-db-id-pill">EXERCISEDB #' + esc(dbId) + '</span>' +
      '<span class="fitness-art-label">● LIVE EXERCISEDB MOTION · ' + esc((exercise.target || 'STRENGTH').toUpperCase()) + '</span>' +
      '</div>';
  }
  function exerciseCard(exercise, session) {
    return '<article class="fitness-card">' +
      '<button type="button" class="fitness-card-visual fitness-card-play-trigger" data-fitness-action="quick-view" data-id="' + esc(exercise.id) + '" aria-label="Play ' + esc(exercise.name) + ' ExerciseDB demonstration">' + visual(exercise) + '</button>' +
      '<div class="fitness-card-copy">' +
      '<p class="fitness-card-kicker">' + esc(exercise.bodyPart || 'Movement') + ' <span>·</span> ' + esc(exercise.equipment || 'Equipment varies') + ' <span>·</span> #' + esc(exercise.exerciseDbId || '0025') + '</p>' +
      '<h3><a data-link href="/fitness/' + encodeURIComponent(exercise.id) + '">' + esc(exercise.name) + '</a></h3>' +
      '<p class="fitness-card-target">Focus: ' + esc(exercise.target || 'See full guidance') + '</p>' +
      '<div class="fitness-card-actions">' +
      '<button type="button" class="button small fitness-play-db-btn" data-fitness-action="quick-view" data-id="' + esc(exercise.id) + '">▶ Play ExerciseDB</button>' +
      '<a class="text-link" data-link href="/fitness/' + encodeURIComponent(exercise.id) + '">Full guide ↗</a>' +
      '<button type="button" class="fitness-add" data-fitness-action="add" data-id="' + esc(exercise.id) + '" aria-label="Add ' + esc(exercise.name) + ' to my session">' + (session.some(function (i) { return i.id === exercise.id; }) ? 'In my session ✓' : '+ My session') + '</button>' +
      '</div></div></article>';
  }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label || value) + '</option>'; }
  function catalogMarkup() {
    var categories = [...new Set(bodyParts.concat(seed().map(function (e) { return e.bodyPart; })).filter(Boolean))].sort();
    var equipment = [...new Set(equipmentTypes.concat(seed().map(function (e) { return e.equipment; })).filter(Boolean))].sort();
    return '<section class="fitness-page" data-fitness-route="/fitness"><section class="fitness-hero"><div class="fitness-hero-copy"><div class="breadcrumb"><a data-link href="/">Home</a><span>/</span><span>Gym &amp; movement library</span></div><span class="eyebrow">THE VORALEAF GYM &amp; EXERCISEDB LIBRARY</span><h1>Move with<br><em>intention.</em></h1><p>Explore gym strength exercises, barbell &amp; machine movements, technique videos and build your personal workout session—all directly inside the VORALEAF window.</p><a class="button" href="#fitness-library">Explore gym exercises <span aria-hidden="true">↘</span></a><p class="fitness-hero-fine">Movement inspiration is separate from coffee benefits.</p></div><div class="fitness-hero-photo"><img src="/assets/hero-workout-poster.webp" alt="A couple sharing VORALEAF BOLD and BLOOM in an active movement studio" width="1280" height="720"><video class="fitness-hero-video" data-fitness="hero-video" src="/assets/hero-workout.mp4" playsinline muted loop autoplay preload="metadata" poster="/assets/hero-workout-poster.webp" aria-label="Couple preparing coffee in a sunlit movement studio"></video><button type="button" class="video-sound-btn" data-video-mute aria-label="Unmute video audio" aria-pressed="false" title="Unmute audio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6m0-6 6 6"/></svg></button></div></section><section class="section-shell fitness-library" id="fitness-library"><div class="fitness-library-heading"><div><span class="eyebrow">EXPLORE. LEARN. MAKE IT YOURS.</span><h2>Gym &amp; ExerciseDB Library.</h2></div><a class="text-link" href="#fitness-session">My session <span data-fitness="session-count">0</span> ↗</a></div><form class="fitness-filter-form" data-fitness="filter-form"><div class="fitness-search"><label for="fitness-search">Search exercises</label><div><input id="fitness-search" name="search" type="search" maxlength="80" placeholder="Try barbell squat, bench press, lat pulldown, kettlebell…" value="' + esc(catalogState.search) + '"><button type="submit" aria-label="Search exercises">↗</button></div></div><div><label for="fitness-body">Body area</label><select name="bodyPart" id="fitness-body">' + option('', 'All body areas', catalogState.bodyPart) + categories.map(function (v) { return option(v, v, catalogState.bodyPart); }).join('') + '</select></div><div><label for="fitness-equipment">Gym equipment</label><select name="equipment" id="fitness-equipment">' + option('', 'All equipment', catalogState.equipment) + equipment.map(function (v) { return option(v, v, catalogState.equipment); }).join('') + '</select></div><div class="fitness-page-size"><label for="fitness-page-size">Per page</label><select name="limit" id="fitness-page-size">' + option('6', '6 exercises', String(catalogState.limit)) + option('10', '10 exercises', String(catalogState.limit)) + '</select></div></form><div class="fitness-body-rail" aria-label="Quick body area filters">' + ['', 'chest', 'back', 'shoulders', 'upper legs', 'upper arms', 'waist', 'cardio'].map(function (v) { return '<button type="button" class="fitness-area-button' + (catalogState.bodyPart === v ? ' active' : '') + '" data-fitness-action="area" data-value="' + esc(v) + '" aria-pressed="' + (catalogState.bodyPart === v) + '">' + (v || 'All body areas') + '</button>'; }).join('') + '</div><div class="fitness-body-rail fitness-equip-rail" aria-label="Quick gym equipment filters">' + ['', 'barbell', 'dumbbell', 'cable', 'leverage machine', 'kettlebell', 'resistance band', 'body weight'].map(function (v) { return '<button type="button" class="fitness-area-button fitness-equip-button' + (catalogState.equipment === v ? ' active' : '') + '" data-fitness-action="equip" data-value="' + esc(v) + '" aria-pressed="' + (catalogState.equipment === v) + '">' + (v || 'All equipment') + '</button>'; }).join('') + '</div><div class="fitness-results-bar"><p data-fitness="result-count">Explore the library</p><div class="fitness-source-controls"><span class="fitness-source-badge" data-fitness="source">Gym &amp; ExerciseDB Library</span><span class="fitness-source-badge fitness-api-status-badge is-live" data-fitness="api-status" role="status" aria-live="polite">ExerciseDB: Ready (24 exercises)</span><button type="button" class="fitness-status-btn" data-fitness-action="check-status">Check API status</button><button type="button" class="fitness-status-btn outline" data-fitness-action="open-api-inspector">ExerciseDB Inspector (In-App)</button></div></div><p class="fitness-fetch-status" data-fitness="status" role="status" aria-live="polite"></p><div class="fitness-results-grid" data-fitness="results"></div><nav class="fitness-pagination" aria-label="Exercise results pages" data-fitness="pagination"></nav><div class="fitness-help-note"><span>Choose what suits you.</span><p>Use the full source guidance and choose activity suitable for your circumstances. Stop if an exercise causes pain or you feel unwell. This library is not a personalised training plan or a treatment for tiredness or breathlessness.</p><p class="fitness-attribution">Starter library: ' + esc(attribution()) + '</p></div><div data-fitness="session"></div></section><dialog class="fitness-inapp-dialog" data-fitness="inapp-dialog" aria-label="In-app exercise and API window"><div data-fitness="inapp-dialog-body"></div></dialog></section>';
  }
  function detailMarkup(id) { return '<section class="fitness-page" data-fitness-route="/fitness/' + esc(encodeURIComponent(id)) + '"><div class="section-shell fitness-detail-shell"><div class="breadcrumb"><a data-link href="/">Home</a><span>/</span><a data-link href="/fitness">Gym &amp; movement library</a><span>/</span><span data-fitness="detail-crumb">Exercise</span></div><div data-fitness="detail"><p class="fitness-fetch-status" role="status">Opening this movement…</p></div><div data-fitness="videos"></div><div data-fitness="related"></div><div data-fitness="session"></div></div><dialog class="fitness-inapp-dialog" data-fitness="inapp-dialog" aria-label="In-app exercise and API window"><div data-fitness="inapp-dialog-body"></div></dialog></section>'; }
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
    async function checkApiStatus(interactive) {
      var badge = q('api-status'), btn = page.querySelector('[data-fitness-action="check-status"]');
      if (!badge) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Checking status…'; }
      badge.textContent = 'ExerciseDB /status: Checking…';
      badge.classList.remove('is-live', 'is-fallback');
      var controller = new AbortController(); requests.add(controller);
      var timeout = setTimeout(function () { controller.abort(); }, 8000);
      try {
        var response = window.VoraleafFitnessApi && typeof window.VoraleafFitnessApi.getStatus === 'function'
          ? await window.VoraleafFitnessApi.getStatus({ signal: controller.signal })
          : await fetch('/api/fitness/status', { signal: controller.signal, credentials: 'same-origin', headers: { Accept: 'application/json' }, cache: 'no-store' });
        var payload = (response.headers.get('content-type') || '').includes('json') ? await response.json() : null;
        if (!alive) return;
        if (response.ok && payload && payload.ok) {
          var label = cleanText(payload.status || 'Online', 40);
          badge.textContent = 'ExerciseDB /status: ' + label;
          badge.classList.add('is-live');
          if (interactive) status('ExerciseDB getStatus check succeeded (' + label + '). ' + cleanText(payload.message || 'Live ExerciseDB feed is reachable.', 140));
        } else {
          badge.textContent = 'ExerciseDB: Built-in Gym Library (' + seed().length + ' exercises)';
          badge.classList.add('is-live');
          if (interactive) status('ExerciseDB built-in gym & movement catalog is active (' + seed().length + ' exercises across barbell, dumbbell, cable, machine, kettlebell and bodyweight). Add RAPIDAPI_KEY on the server anytime to stream additional upstream records.');
        }
      } catch (_) {
        if (!alive) return;
        badge.textContent = 'ExerciseDB: Built-in Gym Library (' + seed().length + ' exercises)';
        badge.classList.add('is-live');
        if (interactive) status('ExerciseDB built-in gym & movement catalog is active (' + seed().length + ' exercises ready inside the app).');
      } finally {
        clearTimeout(timeout); requests.delete(controller);
        if (alive && btn) { btn.disabled = false; btn.textContent = 'Check API status'; }
      }
    }
    function attachImageFallback() { page.querySelectorAll('.fitness-provider-image').forEach(function (image) { on(image, 'error', function () { image.hidden = true; }); }); }
    function playerControlsMarkup() {
      return '<div class="fitness-db-controls" role="group" aria-label="ExerciseDB motion playback controls">' +
        '<button type="button" class="fitness-db-ctrl is-active" data-fitness-action="db-play-toggle" aria-pressed="false">⏸ Pause rep loop</button>' +
        '<button type="button" class="fitness-db-ctrl" data-fitness-action="db-speed" data-speed="slow">0.5× Slow form</button>' +
        '<button type="button" class="fitness-db-ctrl is-active" data-fitness-action="db-speed" data-speed="normal">1.0× Standard</button>' +
        '<button type="button" class="fitness-db-ctrl" data-fitness-action="db-speed" data-speed="fast">1.5× Tempo</button>' +
        '</div>';
    }
    function localResults() { var search = catalogState.search.toLowerCase(); return seed().filter(function (e) { return (!catalogState.bodyPart || e.bodyPart === catalogState.bodyPart) && (!catalogState.equipment || e.equipment === catalogState.equipment) && (!search || [e.name, e.bodyPart, e.target, e.equipment].join(' ').toLowerCase().includes(search)); }); }
    function showResults(items, total, source, nextOffset) {
      if (!alive) return;
      currentItems = items; lastSource = source; remember(items, source);
      q('results').innerHTML = items.length ? items.map(function (e) { return exerciseCard(e, session); }).join('') : '<div class="fitness-empty"><h3>A little change of direction.</h3><p>No movements match these choices. Try another body area, equipment type or search.</p><button type="button" class="button outline" data-fitness-action="clear-filters">Show all movements</button></div>';
      var first = items.length ? catalogState.offset + 1 : 0, last = catalogState.offset + items.length;
      q('result-count').textContent = 'Showing ' + first + '–' + last + (Number.isFinite(total) ? ' of ' + total : '') + ' exercises';
      q('source').textContent = liveSource(source) ? 'ExerciseDB Live API' : 'Gym & ExerciseDB Library';
      var previous = catalogState.offset > 0, next = Number.isFinite(nextOffset) && nextOffset > catalogState.offset ? Math.floor(nextOffset) : (Number.isFinite(total) && last < total ? catalogState.offset + catalogState.limit : null);
      q('pagination').innerHTML = '<button type="button" class="button outline small" data-fitness-action="previous"' + (!previous ? ' disabled' : '') + '>← Previous</button><span>Page ' + (Math.floor(catalogState.offset / catalogState.limit) + 1) + '</span><button type="button" class="button outline small" data-fitness-action="next" data-offset="' + (next === null ? '' : next) + '"' + (next === null ? ' disabled' : '') + '>Next →</button>';
      attachImageFallback(); updateSessionButtons();
    }
    async function loadCatalog() {
      var thisSerial = ++serial;
      var local = localResults();
      showResults(local.slice(catalogState.offset, catalogState.offset + catalogState.limit), local.length, 'starter', null);
      status('Filter by body part or gym equipment (barbell, dumbbell, cable, leverage machine, kettlebell, resistance band) or open any exercise directly in this window.');
      var params = new URLSearchParams({ search: catalogState.search, bodyPart: catalogState.bodyPart, equipment: catalogState.equipment, limit: String(catalogState.limit), offset: String(catalogState.offset) });
      try {
        var data = await api('/api/fitness/exercises?' + params.toString());
        if (!alive || thisSerial !== serial) return;
        if (!Array.isArray(data.items)) throw new Error('Invalid exercise list.');
        var valid = data.items.map(normalise).filter(Boolean);
        showResults(valid, Number.isFinite(data.total) ? data.total : null, data.source || 'starter', Number.isFinite(data.nextOffset) ? data.nextOffset : null);
        status(liveSource(data.source) ? 'Connected to ExerciseDB live feed. All exercises and videos open directly inside this application window.' : 'Explore gym & movement details and related technique videos inside the app window.');
      } catch (_) { if (!alive || thisSerial !== serial) return; if (catalogState.offset >= local.length) catalogState.offset = Math.max(0, Math.floor((local.length - 1) / catalogState.limit) * catalogState.limit); showResults(local.slice(catalogState.offset, catalogState.offset + catalogState.limit), local.length, 'starter', null); status('Gym & ExerciseDB catalog ready (' + local.length + ' matching exercises). All movements and videos open directly inside this window.'); }
    }
    function readFilters() {
      var form = q('filter-form'); if (!form) return;
      catalogState.search = cleanText(form.elements.search.value, 100);
      catalogState.bodyPart = cleanText(form.elements.bodyPart.value, 60);
      catalogState.equipment = cleanText(form.elements.equipment.value, 90);
      catalogState.limit = form.elements.limit.value === '10' ? 10 : 6;
      catalogState.offset = 0;
      page.querySelectorAll('[data-fitness-action="area"]').forEach(function (b) { var active = b.dataset.value === catalogState.bodyPart; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      page.querySelectorAll('[data-fitness-action="equip"]').forEach(function (b) { var active = b.dataset.value === catalogState.equipment; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
      loadCatalog();
    }
    function detail(exercise, source) {
      if (!alive) return;
      remember([exercise], source);
      q('detail-crumb').textContent = exercise.name;
      q('detail').innerHTML = '<div class="fitness-detail-grid"><div class="fitness-detail-player-col">' + visual(exercise) + playerControlsMarkup() + '<p class="fitness-detail-art-note">Live ExerciseDB #' + esc(exercise.exerciseDbId || '0025') + ' movement loop (' + esc(exercise.equipment || 'gym') + ' · ' + esc(exercise.target || 'strength') + '). Use the tempo controls above to inspect slow form or standard cadence.</p></div><div class="fitness-detail-copy"><span class="eyebrow">' + esc(exercise.bodyPart || 'MOVEMENT') + ' · EXERCISEDB #' + esc(exercise.exerciseDbId || '0025') + '</span><h1>' + esc(exercise.name) + '</h1><span class="fitness-source-badge">' + (liveSource(source) ? 'ExerciseDB Live API' : 'ExerciseDB Gym Library #' + esc(exercise.exerciseDbId || '0025')) + '</span>' + (exercise.description ? '<p class="fitness-detail-description">' + esc(exercise.description) + '</p>' : '') + '<dl class="fitness-attributes"><div><dt>Primary focus</dt><dd>' + esc(exercise.target || 'See source guidance') + '</dd></div><div><dt>Equipment</dt><dd>' + esc(exercise.equipment || 'See source guidance') + '</dd></div><div><dt>Body area</dt><dd>' + esc(exercise.bodyPart || 'Movement') + '</dd></div></dl>' + (exercise.secondaryMuscles.length ? '<p class="fitness-secondary">Secondary muscles: ' + exercise.secondaryMuscles.map(esc).join(', ') + '</p>' : '') + '<div class="fitness-detail-cta-row"><button type="button" class="button" data-fitness-action="add" data-id="' + esc(exercise.id) + '">+ Add to my session</button><button type="button" class="button outline" data-fitness-action="quick-view" data-id="' + esc(exercise.id) + '">▶ Open ExerciseDB player in window</button></div><p class="fitness-session-note">Your session is a collection of your choices, not a prescribed programme.</p></div></div><section class="fitness-instructions"><div><span class="eyebrow">EXERCISEDB TECHNIQUE BREAKDOWN</span><h2>Step-by-step form.</h2></div><div>' + (exercise.instructions.length ? '<ol>' + exercise.instructions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '<p>Use a qualified instructor or the full source guidance for appropriate technique.</p>') + '<button type="button" class="text-button" data-fitness-action="quick-view" data-id="' + esc(exercise.id) + '">▶ Play ExerciseDB #' + esc(exercise.exerciseDbId || '0025') + ' movement in window</button><p class="fitness-attribution">' + esc(attribution()) + '</p><p class="fitness-safety">Choose activity suitable for your circumstances. Stop if it causes pain or you feel unwell. Seek appropriate advice if you are unsure about an exercise.</p></div></section>';
      attachImageFallback(); updateSessionButtons();
      var related = seed().filter(function (e) { return e.id !== exercise.id && (e.bodyPart === exercise.bodyPart || e.equipment === exercise.equipment); }).slice(0, 3);
      if (related.length < 3) seed().filter(function (e) { return e.id !== exercise.id && !related.some(function (r) { return r.id === e.id; }); }).slice(0, 3 - related.length).forEach(function (e) { related.push(e); });
      q('related').innerHTML = '<section class="fitness-related"><div class="fitness-library-heading"><div><span class="eyebrow">KEEP EXPLORING</span><h2>Related ExerciseDB movements.</h2></div><a data-link class="text-link" href="/fitness">Back to all 24 exercises ↗</a></div><div class="fitness-results-grid">' + related.map(function (e) { return exerciseCard(e, session); }).join('') + '</div></section>';
      loadVideos(exercise);
      attachImageFallback();
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
    function detailMissing() { if (!alive) return; q('detail').innerHTML = '<div class="fitness-empty"><span class="eyebrow">A LITTLE CHANGE OF DIRECTION</span><h1>This movement<br>is unavailable.</h1><p>It may need the extended exercise feed. You can still explore our 24-exercise ExerciseDB gym library.</p><a data-link class="button" href="/fitness">Explore the library ↗</a></div>'; }
    function videosMarkup(exercise) {
      return '<section class="fitness-videos"><div class="fitness-library-heading"><div><span class="eyebrow">EXERCISEDB BIOMECHANICS PLAYER</span><h2>Interactive movement cadence.</h2></div></div><p class="fitness-video-intro">Inspect the ExerciseDB #' + esc(exercise.exerciseDbId || '0025') + ' repetition path across eccentric, isometric and concentric phases directly inside this window.</p><div class="fitness-video-grid">' +
        '<article class="fitness-video-card"><div class="fitness-db-stage-card">' + visual(exercise) + '</div><h3>Standard Cadence (1.0×)</h3><p>ExerciseDB #' + esc(exercise.exerciseDbId || '0025') + ' · Controlled eccentric &amp; concentric tempo for ' + esc(exercise.target || 'target muscle') + '.</p><button type="button" class="text-button" data-fitness-action="quick-view" data-id="' + esc(exercise.id) + '">▶ Open full ExerciseDB player in window</button></article>' +
        '<article class="fitness-video-card"><div class="fitness-db-stage-card is-slow-stage">' + visual(exercise) + '</div><h3>Slow Form Breakdown (0.5×)</h3><p>Half-speed ExerciseDB path to check bar path, joint stacking and end-range pause.</p><button type="button" class="text-button" data-fitness-action="quick-view" data-id="' + esc(exercise.id) + '">▶ Inspect slow form in window</button></article>' +
        '<article class="fitness-video-card"><div class="fitness-video-consent"><span class="fitness-video-play" aria-hidden="true">▶</span><p>VORALEAF Active Studio Film</p><button type="button" class="button outline small" data-fitness-action="watch-studio-demo" data-title="' + esc(exercise.name) + '">Play studio film</button><small>Plays inside the VORALEAF window.</small></div><h3>VORALEAF Movement Studio</h3><p>Ambient studio ritual film paired with your workout session.</p><button type="button" class="text-button" data-fitness-action="watch-studio-demo" data-title="' + esc(exercise.name) + '">Open studio film ↗</button></article>' +
        '</div></section>';
    }
    function loadVideos(exercise) {
      if (!alive || !q('videos')) return;
      q('videos').innerHTML = videosMarkup(exercise);
      q('videos').querySelectorAll('.is-slow-stage .fitness-exercise-art').forEach(function (art) { art.classList.add('speed-slow'); });
      attachImageFallback();
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
      else if (action === 'check-status') checkApiStatus(true);
      else if (action === 'db-play-toggle') {
        var scope = button.closest('.fitness-modal-visual, .fitness-detail-player-col') || page;
        var artNode = scope.querySelector('.fitness-exercise-art');
        if (!artNode) return;
        var paused = artNode.classList.toggle('is-paused');
        button.textContent = paused ? '▶ Play rep loop' : '⏸ Pause rep loop';
        button.setAttribute('aria-pressed', String(paused));
        button.classList.toggle('is-active', !paused);
      } else if (action === 'db-speed') {
        var speedScope = button.closest('.fitness-modal-visual, .fitness-detail-player-col') || page;
        var speedArt = speedScope.querySelector('.fitness-exercise-art');
        if (!speedArt) return;
        speedArt.classList.remove('speed-slow', 'speed-fast', 'is-paused');
        if (button.dataset.speed === 'slow') speedArt.classList.add('speed-slow');
        else if (button.dataset.speed === 'fast') speedArt.classList.add('speed-fast');
        speedScope.querySelectorAll('[data-fitness-action="db-speed"]').forEach(function (b) { b.classList.toggle('is-active', b === button); });
        var playBtn = speedScope.querySelector('[data-fitness-action="db-play-toggle"]');
        if (playBtn) { playBtn.textContent = '⏸ Pause rep loop'; playBtn.setAttribute('aria-pressed', 'false'); playBtn.classList.add('is-active'); }
      } else if (action === 'area') { q('filter-form').elements.bodyPart.value = button.dataset.value; readFilters(); }
      else if (action === 'equip') { q('filter-form').elements.equipment.value = button.dataset.value; readFilters(); }
      else if (action === 'clear-filters') { q('filter-form').reset(); q('filter-form').elements.search.value = ''; q('filter-form').elements.bodyPart.value = ''; q('filter-form').elements.equipment.value = ''; readFilters(); }
      else if (action === 'next' || action === 'previous') { catalogState.offset = action === 'next' ? Number(button.dataset.offset) : Math.max(0, catalogState.offset - catalogState.limit); loadCatalog(); q('results').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
      else if (action === 'watch-studio-demo') {
        var openModalDemo = q('inapp-dialog');
        if (openModalDemo && openModalDemo.open) openModalDemo.close();
        if (window.VoraleafViewer && typeof window.VoraleafViewer.open === 'function') {
          window.VoraleafViewer.open({ url: '/assets/hero-workout.mp4', title: (button.dataset.title || 'Movement') + ' — VORALEAF Studio' });
        }
      } else if (action === 'quick-view') {
        var qEx = known(button.dataset.id);
        var dlg = q('inapp-dialog'), dlgBody = q('inapp-dialog-body');
        if (!qEx || !dlg || !dlgBody) return;
        dlgBody.innerHTML = '<div class="fitness-modal-head"><span class="eyebrow">' + esc((qEx.bodyPart || 'GYM').toUpperCase() + ' · ' + (qEx.equipment || 'EQUIPMENT').toUpperCase() + ' · EXERCISEDB #' + (qEx.exerciseDbId || '0025')) + '</span><button type="button" class="dialog-close" data-fitness-action="close-dialog" aria-label="Close window">×</button></div><h2>' + esc(qEx.name) + '</h2><p class="fitness-modal-lead">' + esc(qEx.description || '') + '</p><div class="fitness-modal-grid"><div class="fitness-modal-visual">' + visual(qEx) + playerControlsMarkup() + '</div><div><dl class="fitness-attributes"><div><dt>Primary focus</dt><dd>' + esc(qEx.target || 'Full body') + '</dd></div><div><dt>Equipment</dt><dd>' + esc(qEx.equipment || 'Gym') + '</dd></div><div><dt>ExerciseDB ID</dt><dd>#' + esc(qEx.exerciseDbId || '0025') + '</dd></div></dl>' + (qEx.secondaryMuscles && qEx.secondaryMuscles.length ? '<p class="fitness-secondary">Secondary muscles: ' + qEx.secondaryMuscles.map(esc).join(', ') + '</p>' : '') + '<h3>ExerciseDB technique steps</h3><ol class="fitness-modal-steps">' + qEx.instructions.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><div class="fitness-modal-actions"><button type="button" class="button" data-fitness-action="add" data-id="' + esc(qEx.id) + '">' + (session.some(function (i) { return i.id === qEx.id; }) ? 'In my session ✓' : '+ Add to my session') + '</button><a class="button outline" data-link href="/fitness/' + encodeURIComponent(qEx.id) + '">Open full page ↗</a></div></div></div>';
        attachImageFallback();
        if (!dlg.open) dlg.showModal();
      } else if (action === 'open-api-inspector') {
        var apiDlg = q('inapp-dialog'), apiBody = q('inapp-dialog-body');
        if (!apiDlg || !apiBody) return;
        apiBody.innerHTML = '<div class="fitness-modal-head"><span class="eyebrow">EXERCISEDB · RAPIDAPI INTEGRATION</span><button type="button" class="dialog-close" data-fitness-action="close-dialog" aria-label="Close window">×</button></div><h2>ExerciseDB In-App Inspector</h2><p class="fitness-modal-lead">ExerciseDB (<code>exercisedb.p.rapidapi.com</code>) is wired directly into VORALEAF via same-origin server routes so API keys never touch the browser and all content opens inside this application window.</p><div class="fitness-inspector-list"><div class="fitness-inspector-item"><strong>GET /api/fitness/status</strong><span>Proxies <code>https://exercisedb.p.rapidapi.com/status</code> (getStatus health check)</span></div><div class="fitness-inspector-item"><strong>GET /api/fitness/exercises</strong><span>Lists &amp; filters exercises by bodyPart, equipment, search, limit &amp; offset</span></div><div class="fitness-inspector-item"><strong>GET /api/fitness/exercises/:id</strong><span>Fetches single exercise details &amp; instructions</span></div><div class="fitness-inspector-item"><strong>GET /api/fitness/image/:id</strong><span>Same-origin validated ExerciseDB demonstration image stream</span></div></div><p class="fitness-secondary">Built-in catalog: <strong>' + seed().length + ' ExerciseDB gym &amp; strength movements</strong> across Barbell, Dumbbell, Cable, Leverage Machine, Kettlebell, Resistance Band and Bodyweight.</p><div class="fitness-modal-actions"><button type="button" class="button" data-fitness-action="check-status">Run live status check</button><button type="button" class="button outline" data-fitness-action="close-dialog">Return to exercises</button></div>';
        if (!apiDlg.open) apiDlg.showModal();
      } else if (action === 'close-dialog') {
        var openDlg = q('inapp-dialog');
        if (openDlg && openDlg.open) openDlg.close();
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
    if (id !== null) loadDetail(id); else { loadCatalog(); checkApiStatus(false); }
    currentCleanup = function () { if (!alive) return; alive = false; serial++; events.abort(); requests.forEach(function (c) { c.abort(); }); requests.clear(); itemMemory.clear(); sourceMemory.clear(); stopRest(); var hv = q('hero-video'); if (hv) hv.pause(); page.querySelectorAll('iframe').forEach(function (iframe) { iframe.remove(); }); };
    return currentCleanup;
  }
  window.VoraleafFitness = { render: render, mount: mount, renderVisual: visual, cleanup: function () { if (currentCleanup) { currentCleanup(); currentCleanup = null; } } };
}());
