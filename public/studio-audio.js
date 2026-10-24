/* Original VORALEAF instrumental playback and an opt-in local recording mixer. */
(function () {
  'use strict';
  var active = null;
  var pendingDuck = false;
  var tracks = [
    { id: 'golden-hour', title: 'Golden Hour', mood: 'Warm plucked strings · unhurried country feel', src: '/assets/audio/golden-hour.mp3' },
    { id: 'meadow', title: 'Meadow', mood: 'A light acoustic moment · soft instrumental texture', src: '/assets/audio/meadow.mp3' },
    { id: 'quiet-roots', title: 'Quiet Roots', mood: 'Gentle strings and space · a slower studio mood', src: '/assets/audio/quiet-roots.mp3' }
  ];
  var prefKey = 'voraleaf-audio-preferences';
  function preferences() {
    var p = {};
    try { p = JSON.parse(localStorage.getItem(prefKey) || '{}') || {}; } catch (_) {}
    return { track: tracks.some(function (t) { return t.id === p.track; }) ? p.track : tracks[0].id, volume: Number.isFinite(Number(p.volume)) ? Math.min(1, Math.max(0, Number(p.volume))) : 0.3, include: p.include !== false, loop: p.loop !== false };
  }
  function render() {
    return '<section class="studio-audio" data-voraleaf-audio aria-labelledby="studio-audio-heading">' +
      '<div class="studio-audio-heading"><div><p class="eyebrow">THE SOUND OF YOUR MOMENT</p><h2 id="studio-audio-heading">Set a softer tone.</h2><p>Original country-inspired instrumentals for your studio. Choose a little atmosphere, or bring audio you have permission to use.</p></div><span class="studio-audio-original">ORIGINAL VORALEAF COMPOSITIONS</span></div>' +
      '<div class="studio-audio-tracks" role="group" aria-label="Choose an original instrumental">' + tracks.map(function (t, i) { return '<button type="button" class="studio-audio-track" data-audio-track="' + t.id + '" aria-pressed="false"><span class="studio-audio-track-number">0' + (i + 1) + '</span><span><strong>' + t.title + '</strong><small>' + t.mood + '</small></span><span class="studio-audio-track-symbol" aria-hidden="true">♪</span></button>'; }).join('') + '</div>' +
      '<div class="studio-audio-player"><audio data-audio="player" preload="none" crossorigin="anonymous" loop></audio><button type="button" class="button studio-audio-play" data-audio="play" aria-label="Play selected instrumental"><span aria-hidden="true">▶</span> Play instrumental</button><div class="studio-audio-now"><span class="eyebrow">NOW SELECTED</span><strong data-audio="title">Golden Hour</strong><span data-audio="elapsed">00:00 / —</span></div><label class="studio-audio-volume">Music level <output data-audio="volume-label">30%</output><input data-audio="volume" type="range" min="0" max="100" step="1" value="30" aria-label="Instrumental music level"></label><label class="studio-audio-check"><input data-audio="loop" type="checkbox" checked> Loop</label></div>' +
      '<div class="studio-audio-options"><label class="studio-audio-check"><input data-audio="include" type="checkbox" checked> Include this music in my recorded take</label><span data-audio="mix-state">Play a track when you want it in your take.</span></div>' +
      '<p class="studio-audio-status" data-audio="status" role="status" aria-live="polite">Playback starts only when you choose. These instrumentals create atmosphere; no therapeutic effect is claimed.</p>' +
      '<div class="studio-audio-sources"><section><p class="eyebrow">BRING YOUR OWN AUDIO</p><h3>A sound that belongs to you.</h3><label class="studio-audio-check studio-audio-rights"><input data-audio="rights" type="checkbox"> I own or have permission to use this audio in my recording or livestream.</label><label class="studio-audio-file-label" for="studio-audio-file">Choose an audio file <span>MP3, WAV, M4A, AAC, OGG or FLAC · up to 25 MB</span></label><input id="studio-audio-file" data-audio="file" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" disabled><p>Your file stays on this device. It is not uploaded by this mixer.</p></section><section><p class="eyebrow">LISTEN ALONG</p><h3>Listen inside VORALEAF.</h3><label class="studio-audio-field-label" for="studio-audio-link">Spotify, Apple Music, YouTube, SoundCloud or Bandcamp link</label><div class="studio-audio-link-row"><input id="studio-audio-link" data-audio="link" type="url" placeholder="https://…" autocomplete="off"><button type="button" class="button outline small" data-audio="open-source">Open in app ↗</button></div><p>Supported players open inside VORALEAF. Restore the viewer to a smaller window to keep creating. Provider playback is separate personal listening and is never added to recordings, livestreams or advertisements. Use an owned or licensed file for the mix.</p></section></div>' +
      '<p class="studio-audio-fine">Original tracks were composed for VORALEAF with procedural synthesis. Use headphones while recording to keep speaker sound out of your microphone. Ad breaks can temporarily lower the music level.</p></section>';
  }

  function mount(root) {
    cleanup();
    root = root || document;
    var page = root.matches && root.matches('[data-voraleaf-audio]') ? root : root.querySelector('[data-voraleaf-audio]');
    if (!page) return function () {};
    var q = function (name) { return page.querySelector('[data-audio="' + name + '"]'); };
    var events = new AbortController(), alive = true, p = preferences(), ownedURL = null, ownedName = '', selected = p.track;
    var context = null, elementSource = null, musicGain = null, monitorGain = null, recordGain = null;
    var mixes = new Map(), player = q('player'), starting = false, audioError = false, playRequest = 0;
    var state = { page: page, getMixedStream: mix, releaseMixedStream: releaseMix, setDucking: updateDucking, destroy: destroy };
    active = state;
    function on(node, event, handler) { node.addEventListener(event, handler, { signal: events.signal }); }
    function say(message) { if (alive) q('status').textContent = message; }
    function save() { try { localStorage.setItem(prefKey, JSON.stringify({ track: selected === 'owned' ? p.track : selected, volume: p.volume, include: p.include, loop: p.loop })); } catch (_) {} }
    function original() { return tracks.find(function (t) { return t.id === selected; }) || tracks[0]; }
    function title() { return selected === 'owned' ? ownedName || 'Your audio file' : original().title; }
    function drawSelection() {
      page.querySelectorAll('[data-audio-track]').forEach(function (button) { var isSelected = button.dataset.audioTrack === selected; button.setAttribute('aria-pressed', String(isSelected)); button.classList.toggle('is-selected', isSelected); });
      q('title').textContent = title();
      q('volume-label').value = Math.round(p.volume * 100) + '%'; q('volume-label').textContent = Math.round(p.volume * 100) + '%';
      q('volume').value = Math.round(p.volume * 100); q('include').checked = p.include; q('loop').checked = p.loop;
      q('mix-state').textContent = p.include ? 'Music is included when it is playing during your take.' : 'Listen along only; this music is excluded from new recordings.';
    }
    function updatePlay() { q('play').innerHTML = player.paused ? '<span aria-hidden="true">▶</span> Play instrumental' : '<span aria-hidden="true">Ⅱ</span> Pause instrumental'; q('play').setAttribute('aria-label', (player.paused ? 'Play ' : 'Pause ') + title()); }
    function stamp(value) { return Number.isFinite(value) ? String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(Math.floor(value % 60)).padStart(2, '0') : '—'; }
    function updateTime() { q('elapsed').textContent = stamp(player.currentTime) + ' / ' + stamp(player.duration); }
    function ramp(node, value) { if (!node || !context) return; var now = context.currentTime; node.gain.cancelScheduledValues(now); node.gain.setTargetAtTime(value, now, 0.08); }
    function updateDucking(value) {
      pendingDuck = !!value;
      var volume = p.volume * (pendingDuck ? 0.25 : 1);
      if (context && musicGain) ramp(musicGain, volume); else player.volume = volume;
      if (recordGain) ramp(recordGain, p.include && (selected !== 'owned' || q('rights').checked) ? 1 : 0);
    }
    async function graph() {
      if (!alive) return false;
      var Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      if (!context) {
        try {
          context = new Audio();
          elementSource = context.createMediaElementSource(player);
          musicGain = context.createGain(); monitorGain = context.createGain(); recordGain = context.createGain();
          musicGain.gain.value = p.volume * (pendingDuck ? 0.25 : 1); monitorGain.gain.value = 1; recordGain.gain.value = p.include ? 1 : 0;
          elementSource.connect(musicGain); musicGain.connect(monitorGain); monitorGain.connect(context.destination); musicGain.connect(recordGain);
          player.volume = 1;
        } catch (_) {
          try { if (context) await context.close(); } catch (_) {}
          context = null; elementSource = null; musicGain = null; monitorGain = null; recordGain = null;
          say('Playback is available, but this browser could not create a recording mix. Your microphone audio remains separate.');
          return false;
        }
      }
      if (context.state === 'suspended') { try { await context.resume(); } catch (_) { return false; } }
      return alive && context.state === 'running';
    }
    function choose(id) {
      if (!tracks.some(function (t) { return t.id === id; })) return;
      playRequest++; player.pause(); selected = id; p.track = id; audioError = false;
      player.src = original().src; player.loop = p.loop; player.load(); drawSelection(); updatePlay(); updateTime(); save(); updateDucking(pendingDuck);
      say(original().title + ' selected. Press Play to listen.');
    }
    async function playToggle() {
      if (starting || !alive) return;
      if (!player.paused) { player.pause(); return; }
      if (selected === 'owned' && !q('rights').checked) { say('Confirm that you have permission to use this audio before playing or mixing it.'); return; }
      starting = true; var request = ++playRequest; q('play').disabled = true;
      try {
        var graphReady = await graph();
        if (!alive || request !== playRequest) return;
        if (context && !graphReady) { say('Your browser has paused the audio mixer. Choose Play again to resume it.'); return; }
        await player.play(); if (!alive || request !== playRequest) return; audioError = false;
        say(selected === 'owned' ? 'Playing your audio on this device. It is not uploaded.' : 'Playing ' + original().title + '. An original VORALEAF instrumental.');
      } catch (_) { if (request === playRequest) say(audioError ? 'This audio could not be loaded. Choose another track or a supported local audio file.' : 'Your browser could not start audio. Press Play again, or choose another supported file.'); }
      finally { starting = false; if (alive) { q('play').disabled = false; updatePlay(); } }
    }
    async function mix(sourceStream) {
      if (!alive || !sourceStream || typeof sourceStream.getAudioTracks !== 'function' || typeof MediaStream === 'undefined') return sourceStream;
      if (selected === 'owned' && !q('rights').checked) return sourceStream;
      if (!await graph()) { say('This browser is recording your microphone without a music mix. Instrumental playback remains separate.'); return sourceStream; }
      if (!alive) return sourceStream;
      var destination = context.createMediaStreamDestination(), microphone = null;
      try {
        var microphoneTracks = sourceStream.getAudioTracks().filter(function (track) { return track.readyState === 'live'; });
        if (microphoneTracks.length) { microphone = context.createMediaStreamSource(new MediaStream(microphoneTracks)); microphone.connect(destination); }
        recordGain.connect(destination);
        var output = new MediaStream(sourceStream.getVideoTracks().concat(destination.stream.getAudioTracks()));
        mixes.set(output, { destination: destination, microphone: microphone });
        say(!p.include ? 'Your take uses the microphone; music is excluded until you enable it.' : player.paused ? 'Your take is ready for microphone and music. Press Play whenever you want the instrumental to enter.' : 'Your take includes the microphone and the instrumental at the selected level.');
        return output;
      } catch (_) {
        try { if (microphone) microphone.disconnect(); recordGain.disconnect(destination); } catch (_) {}
        destination.stream.getTracks().forEach(function (track) { track.stop(); });
        say('The music mix could not be created. Your take will use the original camera and microphone audio.');
        return sourceStream;
      }
    }
    function releaseMix(output) {
      var entry = mixes.get(output); if (!entry) return;
      try { if (entry.microphone) entry.microphone.disconnect(); } catch (_) {}
      try { if (recordGain) recordGain.disconnect(entry.destination); } catch (_) {}
      entry.destination.stream.getTracks().forEach(function (track) { track.stop(); }); mixes.delete(output);
    }
    function ownedFile() {
      var file = q('file').files && q('file').files[0]; if (!file) return;
      if (!q('rights').checked) { say('Confirm your permission to use the audio first.'); q('file').value = ''; return; }
      var allowed = /^audio\//i.test(file.type) || (!file.type && /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(file.name));
      if (!allowed || file.size > 25 * 1024 * 1024 || !file.size) { say('Choose a supported audio file no larger than 25 MB.'); q('file').value = ''; return; }
      playRequest++; player.pause(); if (ownedURL) URL.revokeObjectURL(ownedURL);
      ownedURL = URL.createObjectURL(file); ownedName = file.name.slice(0, 160); selected = 'owned'; audioError = false;
      player.src = ownedURL; player.loop = p.loop; player.load(); drawSelection(); updatePlay(); updateTime(); updateDucking(pendingDuck);
      say('Your file is ready on this device. Press Play to preview it before recording.');
    }
    function openSource() {
      var value = q('link').value.trim(), url;
      try { url = new URL(value); } catch (_) { say('Enter a complete HTTPS link from a supported music service.'); return; }
      var hosts = ['open.spotify.com', 'music.apple.com', 'embed.music.apple.com', 'www.youtube.com', 'youtube.com', 'youtu.be', 'music.youtube.com', 'www.youtube-nocookie.com', 'soundcloud.com', 'www.soundcloud.com', 'w.soundcloud.com', 'bandcamp.com', 'www.bandcamp.com'];
      var accepted = hosts.includes(url.hostname) || /^[a-z0-9-]+\.bandcamp\.com$/i.test(url.hostname);
      var privateParameter = [...url.searchParams.keys()].some(function (name) { return /token|secret|password|api.?key|access.?key|auth/i.test(name); });
      if (url.protocol !== 'https:' || url.username || url.password || !accepted || privateParameter || url.port) { say('Use a standard HTTPS music-service link without passwords, access tokens or API keys.'); return; }
      if (!window.VoraleafViewer || typeof window.VoraleafViewer.open !== 'function') { say('The in-app source viewer is unavailable. Reload VORALEAF and try again.'); return; }
      try {
        playRequest++; player.pause(); updatePlay();
        var opened = window.VoraleafViewer.open({ url: url.href, title: 'Your music source', context: 'music' });
        say(opened === false ? 'This link could not open in the app. Choose a supported player link.' : 'Your source opens inside VORALEAF for personal listening. Its audio is not included in studio recordings, livestreams or advertisements.');
      } catch (_) { say('This source could not open inside VORALEAF. Check the link or choose another supported player.'); }
    }
    function destroy() {
      if (!alive) return;
      alive = false; playRequest++; events.abort(); mixes.forEach(function (_, stream) { releaseMix(stream); });
      player.pause(); player.removeAttribute('src'); player.load();
      if (ownedURL) URL.revokeObjectURL(ownedURL); ownedURL = null;
      [elementSource, musicGain, monitorGain, recordGain].forEach(function (node) { try { if (node) node.disconnect(); } catch (_) {} });
      if (context && context.state !== 'closed') context.close().catch(function () {}); context = null;
      if (active === state) active = null;
    }
    page.querySelectorAll('[data-audio-track]').forEach(function (button) { on(button, 'click', function () { choose(button.dataset.audioTrack); }); });
    on(q('play'), 'click', playToggle);
    on(q('volume'), 'input', function () { p.volume = Number(q('volume').value) / 100; drawSelection(); updateDucking(pendingDuck); save(); });
    on(q('loop'), 'change', function () { p.loop = q('loop').checked; player.loop = p.loop; save(); });
    on(q('include'), 'change', function () { p.include = q('include').checked; drawSelection(); updateDucking(pendingDuck); save(); });
    on(q('rights'), 'change', function () { q('file').disabled = !q('rights').checked; if (!q('rights').checked && selected === 'owned') { choose(p.track); if (ownedURL) URL.revokeObjectURL(ownedURL); ownedURL = null; ownedName = ''; q('file').value = ''; say('Your file has been released. Choose an original instrumental or confirm permission for another file.'); } });
    on(q('file'), 'change', ownedFile); on(q('open-source'), 'click', openSource);
    on(player, 'play', updatePlay); on(player, 'pause', updatePlay); on(player, 'ended', updatePlay); on(player, 'timeupdate', updateTime); on(player, 'loadedmetadata', updateTime);
    on(player, 'error', function () { audioError = true; say('This audio file could not be loaded or decoded. Try another supported file or original instrumental.'); updatePlay(); });
    on(document, 'visibilitychange', function () { if (document.hidden) player.pause(); });
    player.src = original().src; player.loop = p.loop; drawSelection(); updatePlay(); updateDucking(pendingDuck);
    return destroy;
  }
  function cleanup() { if (active) active.destroy(); }
  window.VoraleafAudio = { render: render, mount: mount, cleanup: cleanup, getMixedStream: function (stream) { return active ? active.getMixedStream(stream) : Promise.resolve(stream); }, releaseMixedStream: function (stream) { if (active) active.releaseMixedStream(stream); }, setDucking: function (value) { pendingDuck = !!value; if (active) active.setDucking(pendingDuck); } };
}());
