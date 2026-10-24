/* VORALEAF creator capture. Recording is local; publishing requires a separate explicit member action. */
(function () {
  'use strict';
  var currentCleanup = null;
  var currentController = null;
  var defaultScript = 'Make room for your coffee moment.\n\nAn illustrated envelope. A metallic inner sachet. A moment that is entirely yours.\n\nMeet VORALEAF Roots Herbal Coffee: BOLD, EMBER and BLOOM.\n\nExplore the collection at VORALEAF.';

  function render() {
    return '<section class="studio-page section-shell" aria-labelledby="studio-heading">' +
      '<div class="studio-intro"><p class="eyebrow">THE CREATOR ROOM</p><h1 id="studio-heading">Your moment.<br><em>Your story.</em></h1>' +
      '<p class="studio-lede">A quiet space to rehearse, record a short coffee story and put your thoughts into words.</p>' +
      '<p class="studio-local"><span aria-hidden="true">◉</span> Local recording · member publishing is a separate action</p></div>' +
      '<div class="studio-workspace"><section class="studio-camera-panel" aria-labelledby="studio-camera-heading">' +
      '<div class="studio-panel-head"><div><p class="eyebrow">01 / RECORD</p><h2 id="studio-camera-heading">Behind the ritual</h2></div><span class="studio-limit">20–120 SECOND TAKES</span></div>' +
      '<div class="studio-camera-frame" data-studio="frame"><video data-studio="camera" autoplay muted playsinline aria-label="Your live camera preview"></video>' +
      '<div class="studio-camera-placeholder" data-studio="placeholder"><svg viewBox="0 0 64 64" width="56" height="56" fill="none" aria-hidden="true"><rect x="10" y="17" width="32" height="30" rx="5" stroke="currentColor" stroke-width="1.5"/><path d="M42 26L55 19V45L42 38" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="26" cy="32" r="7" stroke="currentColor" stroke-width="1.5"/></svg><p>A little room for your story.</p><span>Camera and microphone stay off until you choose.</span></div>' +
      '<div class="studio-record-indicator" data-studio="record-indicator" hidden><span aria-hidden="true"></span> REC <b data-studio="counter">00:00</b></div></div>' +
      '<div class="studio-camera-toolbar"><fieldset class="studio-aspect"><legend>Frame</legend><label><input type="radio" name="studio-aspect" value="landscape" checked>16:9</label><label><input type="radio" name="studio-aspect" value="portrait">9:16</label></fieldset>' +
      '<div class="studio-record-options"><label for="studio-duration">Take length<select id="studio-duration" data-studio="duration"><option value="20">20 seconds</option><option value="60" selected>60 seconds</option><option value="120">120 seconds</option></select></label><label for="studio-output-mode">Recording version<select id="studio-output-mode" data-studio="output-mode"><option value="clean" selected>Clean social export · no ad breaks</option><option value="platform">On-platform version · optional ad breaks</option></select></label></div>' +
      '<p class="studio-output-note">Choose a clean version for social sharing. On-platform breaks are controlled separately and can be switched off.</p>' +
      '<div class="studio-actions"><button class="button studio-button" type="button" data-studio="enable">Enable camera &amp; microphone</button><button class="button studio-button studio-record" type="button" data-studio="record" disabled>Start recording</button><button class="button studio-button studio-button-quiet" type="button" data-studio="stop" disabled>Stop</button><button class="studio-text-button" type="button" data-studio="disable" disabled>Turn camera off</button></div></div>' +
      '<p class="studio-status" data-studio="status" role="status" aria-live="polite">Choose Enable to request access. Nothing is uploaded or broadcast.</p>' +
      '<div class="studio-playback" data-studio="playback-wrap" hidden><h3>Your take</h3><video data-studio="playback" controls playsinline aria-label="Your recorded coffee story"></video><div class="studio-playback-footer"><span data-studio="take-meta">Preview before saving. Your take is temporary until downloaded.</span><div class="studio-actions"><a class="button studio-button" data-studio="download" download>Download your video</a><button class="button studio-button studio-button-quiet" type="button" data-studio="share" hidden>Share clean video</button></div></div></div>' +
      '</section><aside class="studio-prompt-panel" aria-labelledby="studio-prompt-heading"><p class="eyebrow">02 / REHEARSE</p><h2 id="studio-prompt-heading">Words, at your pace.</h2><p>Make this script your own. Talk about the occasion, presentation or your own experience; avoid unverified health promises.</p>' +
      '<label class="studio-label" for="studio-script">Your script</label><textarea id="studio-script" data-studio="script" rows="7" maxlength="6000" spellcheck="true"></textarea>' +
      '<div class="studio-prompt-options"><label for="studio-speed">Scroll speed <output data-studio="speed-label" for="studio-speed">18</output></label><input id="studio-speed" data-studio="speed" type="range" min="8" max="40" value="18" step="1" aria-label="Teleprompter speed, pixels per second"><div class="studio-actions"><button class="button studio-button studio-button-quiet" type="button" data-studio="prompt-start">Start teleprompter</button><button class="studio-text-button" type="button" data-studio="prompt-reset">Reset</button></div></div>' +
      '<div class="studio-teleprompter" data-studio="teleprompter" tabindex="0" aria-label="Scrolling script preview"><div data-studio="prompt-text"></div></div><p class="studio-fine">Camera permission is optional. Rehearsal and writing work without it.</p></aside></div>' +
      (window.VoraleafAudio && typeof window.VoraleafAudio.render === 'function' ? window.VoraleafAudio.render() : '') +
      (window.VoraleafCreator && typeof window.VoraleafCreator.render === 'function' ? window.VoraleafCreator.render() : '') +
      '<section class="studio-draft-panel" aria-labelledby="studio-draft-heading"><div class="studio-draft-heading"><p class="eyebrow">03 / WRITE</p><h2 id="studio-draft-heading">A journal in the making.</h2><p>Keep a local blog draft, then export it when you are ready. It is not published to VORALEAF.</p></div><div class="studio-draft-fields"><label class="studio-label" for="studio-draft-title">Story title</label><input id="studio-draft-title" data-studio="draft-title" type="text" maxlength="180" placeholder="A small ritual, a better moment"><label class="studio-label" for="studio-draft-body">Your story</label><textarea id="studio-draft-body" data-studio="draft-body" rows="8" maxlength="40000" placeholder="Begin with a moment worth remembering…"></textarea><div class="studio-draft-footer"><p data-studio="draft-status" role="status" aria-live="polite">Drafts are stored only in this browser.</p><button class="button studio-button" type="button" data-studio="export">Export draft as text</button></div></div></section>' +
      '<div class="studio-close-note"><span class="eyebrow">THOUGHTFULLY PRIVATE</span><p>Recordings stay on your device until you choose to download, share or publish. Connecting a channel, publishing a recording and starting a live session each require a separate explicit action. Camera access ends when you leave this page or put it in the background.</p><a href="mailto:hello@voraleaf.com">Creator enquiries → hello@voraleaf.com</a></div></section>';
  }

  function mount(root) {
    if (currentCleanup) currentCleanup();
    root = root || document;
    var page = root.matches && root.matches('.studio-page') ? root : root.querySelector('.studio-page');
    if (!page) return function () {};
    var q = function (name) { return page.querySelector('[data-studio="' + name + '"]'); };
    var abort = new AbortController();
    var alive = true, stream = null, recorder = null, chunks = [], recordedURL = null, recordedTake = null;
    var recordTimer = null, counterTimer = null, startedAt = 0, frameRequest = null, lastFrame = 0, prompting = false, enabling = false, preparing = false;
    var recordingOutput = null, liveOutput = null, liveGeneration = 0, totalBytes = 0;
    var MAX_RECORD_BYTES = 64 * 1024 * 1024;
    var video = q('camera'), status = q('status'), record = q('record'), stop = q('stop'), enable = q('enable'), disable = q('disable');
    var script = q('script'), promptText = q('prompt-text'), prompt = q('teleprompter'), speed = q('speed'), promptStart = q('prompt-start');
    var draftTitle = q('draft-title'), draftBody = q('draft-body'), draftStatus = q('draft-status');
    function on(node, event, fn) { if (node) node.addEventListener(event, fn, { signal: abort.signal }); }
    function tell(message) { if (alive) status.textContent = message; }
    function emit(name, detail) { page.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} })); }
    function safeRead(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } }
    function saveScript() { try { localStorage.setItem('voraleaf-studio-script', script.value); } catch (_) {} }
    function saveDraft() {
      try { localStorage.setItem('voraleaf-studio-draft', JSON.stringify({ title: draftTitle.value, body: draftBody.value })); draftStatus.textContent = 'Saved on this device. Not published.'; }
      catch (_) { draftStatus.textContent = 'Browser storage is unavailable. Export your draft to keep it.'; }
    }
    function stopPrompt() { prompting = false; if (frameRequest) cancelAnimationFrame(frameRequest); frameRequest = null; lastFrame = 0; promptStart.textContent = 'Start teleprompter'; }
    function tick(time) {
      if (!alive || !prompting) return;
      if (lastFrame) prompt.scrollTop += Math.min(time - lastFrame, 70) / 1000 * Number(speed.value);
      lastFrame = time;
      if (prompt.scrollTop + prompt.clientHeight >= prompt.scrollHeight - 1) { stopPrompt(); return; }
      frameRequest = requestAnimationFrame(tick);
    }
    function updatePrompt() { promptText.textContent = script.value; saveScript(); }
    function clearRecordTimers() { clearTimeout(recordTimer); clearInterval(counterTimer); recordTimer = null; counterTimer = null; }
    function recordingActive() { return preparing || !!(recorder && recorder.state !== 'inactive'); }
    function syncLocks() {
      var recording = recordingActive();
      page.querySelectorAll('input[name="studio-aspect"]').forEach(function (input) { input.disabled = recording || !!liveOutput; });
      q('duration').disabled = recording; q('output-mode').disabled = recording;
    }
    function destroyOutput(output) {
      if (!output || output.released) return;
      output.released = true;
      if (output.frame !== null) cancelAnimationFrame(output.frame);
      output.frame = null;
      if (output.mixed && window.VoraleafAudio && typeof window.VoraleafAudio.releaseMixedStream === 'function') {
        try { window.VoraleafAudio.releaseMixedStream(output.mixed); } catch (_) {}
      } else if (output.mixed && output.mixed !== output.base) {
        var microphoneTracks = output.camera.getAudioTracks();
        output.mixed.getAudioTracks().forEach(function (track) { if (!microphoneTracks.includes(track)) track.stop(); });
      }
      // A derived canvas belongs to this output. The original camera/microphone do not.
      if (output.canvasStream) output.canvasStream.getVideoTracks().forEach(function (track) { track.stop(); });
      if (output.ownedTracks) output.ownedTracks.forEach(function (track) { track.stop(); });
    }
    function stopOutput() {
      liveGeneration++;
      destroyOutput(liveOutput); liveOutput = null;
      if (alive) syncLocks();
    }
    function readyCamera() {
      if (!alive || !stream || !stream.getVideoTracks().some(function (track) { return track.readyState === 'live'; })) throw new Error('Enable the camera and microphone before preparing a recording or live session.');
      if (video.readyState < 2 || !video.videoWidth || video.paused) throw new Error('Wait for the live camera preview to start before preparing your output.');
    }
    async function makeOutput(clean) {
      readyCamera();
      var camera = stream;
      var output = { camera: camera, base: null, mixed: null, canvasStream: null, frame: null, cropped: false, aspect: 'camera format', clean: !!clean, requestedClean: !!clean, adTouched: false, released: false, ownedTracks: [] };
      function copyTracks(tracks) { return tracks.map(function (track) { if (typeof track.clone !== 'function') throw new Error('This browser cannot prepare an independently controlled media output.'); var clone = track.clone(); output.ownedTracks.push(clone); return clone; }); }
      var audioTracks;
      try { audioTracks = copyTracks(camera.getAudioTracks()); } catch (error) { destroyOutput(output); throw error; }
      function releaseCanvasOnly() { if (output.frame !== null) cancelAnimationFrame(output.frame); output.frame = null; if (output.canvasStream) output.canvasStream.getVideoTracks().forEach(function (track) { track.stop(); }); output.canvasStream = null; output.cropped = false; }
      var canvas = document.createElement('canvas');
      var selected = page.querySelector('input[name="studio-aspect"]:checked');
      var portrait = selected && selected.value === 'portrait';
      canvas.width = portrait ? 720 : 1280; canvas.height = portrait ? 1280 : 720;
      var context = canvas.getContext('2d', { alpha: false });
      if (context && typeof canvas.captureStream === 'function' && typeof MediaStream !== 'undefined') {
        function draw(now) {
          if (output.released || !alive || stream !== camera) return;
          var sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
          if (sourceWidth && sourceHeight) {
            var scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
            var cropWidth = canvas.width / scale, cropHeight = canvas.height / scale;
            context.drawImage(video, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
            if (!output.clean && window.VoraleafCreator && typeof window.VoraleafCreator.drawAdFrame === 'function') {
              try { if (window.VoraleafCreator.drawAdFrame(context, canvas.width, canvas.height, now || performance.now())) output.adTouched = true; } catch (_) {}
            }
          }
          output.frame = requestAnimationFrame(draw);
        }
        try {
          draw(performance.now());
          output.canvasStream = canvas.captureStream(30);
          if (output.canvasStream.getVideoTracks().length) {
            output.base = new MediaStream(output.canvasStream.getVideoTracks().concat(audioTracks));
            output.cropped = true; output.aspect = portrait ? '9:16' : '16:9';
          } else { releaseCanvasOnly(); }
        } catch (_) {
          releaseCanvasOnly();
        }
      }
      // Direct camera capture cannot contain our canvas ad breaks.
      if (!output.cropped) {
        output.clean = true; output.adTouched = false;
        try { output.base = new MediaStream(copyTracks(camera.getVideoTracks()).concat(audioTracks)); } catch (error) { destroyOutput(output); throw error; }
      }
      try {
        output.mixed = window.VoraleafAudio && typeof window.VoraleafAudio.getMixedStream === 'function' ? await window.VoraleafAudio.getMixedStream(output.base) : output.base;
        if (!alive || stream !== camera || document.hidden) throw new Error('The camera output was closed before it was ready.');
        if (!output.mixed || typeof output.mixed.getTracks !== 'function') throw new Error('Audio mixing did not return a media stream.');
        output.stream = output.mixed;
        try { Object.defineProperty(output.stream, 'voraleafOutput', { value: { clean: output.clean, cropped: output.cropped, aspect: output.aspect }, configurable: true }); } catch (_) {}
        return output;
      } catch (error) { destroyOutput(output); throw error; }
    }
    async function getPreparedStream(options) {
      options = options || {};
      readyCamera();
      if (liveOutput && !liveOutput.released && liveOutput.requestedClean === !!options.clean) return liveOutput.stream;
      stopOutput();
      var generation = liveGeneration;
      var output = await makeOutput(!!options.clean);
      if (!alive || generation !== liveGeneration) { destroyOutput(output); throw new Error('The live output was closed while it was being prepared.'); }
      liveOutput = output; syncLocks();
      if (!output.cropped) tell('Live output uses the camera format in this browser. VORALEAF ad breaks cannot be composited into this output.');
      return output.stream;
    }
    function stopRecording() {
      clearRecordTimers();
      if (recorder && recorder.state !== 'inactive') { recorder.stop(); if (alive) { stop.disabled = true; record.disabled = true; tell('Finishing your take…'); } }
      // The onstop event owns final output cleanup, after final chunks arrive.
      else { destroyOutput(recordingOutput); recordingOutput = null; if (alive) syncLocks(); }
    }
    function releaseCamera(reason) {
      stopRecording(); stopOutput();
      if (stream) { stream.getTracks().forEach(function (track) { track.stop(); }); stream = null; }
      video.srcObject = null;
      emit('studio:camera-off', { reason: reason || 'Camera closed' });
      if (alive) { q('placeholder').hidden = false; enable.disabled = false; disable.disabled = true; record.disabled = true; stop.disabled = true; enable.textContent = 'Enable camera & microphone'; if (reason) tell(reason); }
    }
    function supportedMime() {
      if (typeof MediaRecorder === 'undefined') return null;
      var types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) return types[i];
      return '';
    }
    async function requestCamera() {
      if (enabling || stream) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { tell('This browser cannot open the camera here. Use a supported browser on HTTPS; writing and rehearsal still work.'); return; }
      enabling = true; enable.disabled = true; tell('Your browser will ask for camera and microphone access.');
      try {
        var incoming = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
        if (!alive || document.hidden) { incoming.getTracks().forEach(function (track) { track.stop(); }); return; }
        stream = incoming; video.controls = false; video.srcObject = stream;
        incoming.getTracks().forEach(function (track) { if (typeof track.addEventListener === 'function') on(track, 'ended', function () { if (stream === incoming) releaseCamera('A camera or microphone disconnected. Output has been stopped.'); }); });
        var previewBlocked = false;
        try { await video.play(); } catch (_) { previewBlocked = true; video.controls = true; }
        if (!alive || !stream || document.hidden) return;
        q('placeholder').hidden = true; disable.disabled = false;
        record.disabled = supportedMime() === null;
        enable.textContent = 'Camera is on';
        tell(previewBlocked ? 'Camera connected. Use the preview play control, then choose Start recording.' : record.disabled ? 'Live preview is ready. This browser does not support recording; try another browser.' : 'Camera and microphone are ready. Recording stays local until you choose a separate sharing or publishing action.');
        emit('studio:camera-ready', { recordingSupported: !record.disabled });
      } catch (error) {
        var messages = { NotAllowedError: 'Camera or microphone access was declined. You can allow it in browser settings and try again. Writing and rehearsal remain available.', NotFoundError: 'No camera or microphone was found. Connect both devices and try again.', NotReadableError: 'Your camera or microphone is being used elsewhere. Close the other app and try again.', SecurityError: 'The browser blocked camera access. Open the studio securely over HTTPS.' };
        tell(messages[error.name] || 'Camera access could not be opened. Check your device and browser permissions, then try again.');
        if (alive) enable.disabled = false;
      } finally { enabling = false; if (alive && !stream) enable.disabled = false; }
    }
    function durationSeconds() { var seconds = Number(q('duration').value); return [20, 60, 120].includes(seconds) ? seconds : 60; }
    function clock(seconds) { seconds = Math.max(0, Math.floor(seconds)); return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
    async function startRecording() {
      if (!stream || !alive || recordingActive()) return;
      try { readyCamera(); } catch (error) { video.controls = true; video.play().catch(function () {}); tell(error.message); return; }
      var limit = durationSeconds(), clean = q('output-mode').value !== 'platform';
      preparing = true; record.disabled = true; syncLocks(); chunks = []; totalBytes = 0;
      var input;
      try {
        var mime = supportedMime();
        if (mime === null) throw new Error('Recording is unavailable in this browser.');
        input = await makeOutput(clean);
        if (!alive || !stream) { destroyOutput(input); return; }
        recordingOutput = input;
        var options = { videoBitsPerSecond: 1800000, audioBitsPerSecond: 128000 };
        if (mime) options.mimeType = mime;
        recorder = new MediaRecorder(input.stream, options);
        var thisRecorder = recorder;
        thisRecorder.ondataavailable = function (event) {
          if (event.data && event.data.size) { chunks.push(event.data); totalBytes += event.data.size; }
          if (totalBytes > MAX_RECORD_BYTES && thisRecorder.state !== 'inactive') { tell('The local take reached its size limit. Finishing this recording.'); stopRecording(); }
        };
        thisRecorder.onerror = function () { if (alive) tell('Recording was interrupted. Please try a fresh take.'); releaseCamera(); };
        thisRecorder.onstop = function () {
          clearRecordTimers();
          var duration = Math.min(limit, Math.max(0, (Date.now() - startedAt) / 1000));
          var containsAds = input.adTouched;
          destroyOutput(input); if (recordingOutput === input) recordingOutput = null;
          if (!alive) return;
          syncLocks(); q('record-indicator').hidden = true; stop.disabled = true; record.disabled = !stream;
          if (!chunks.length) { tell('No video was captured. Please try again.'); return; }
          var type = thisRecorder.mimeType || (chunks[0] && chunks[0].type) || 'video/webm';
          var filename = 'VORALEAF-' + (input.clean ? 'clean-social' : 'on-platform') + '-' + new Date().toISOString().slice(0, 10) + (type.indexOf('mp4') >= 0 ? '.mp4' : '.webm');
          var file = new File(chunks, filename, { type: type, lastModified: Date.now() });
          if (recordedURL) URL.revokeObjectURL(recordedURL);
          recordedURL = URL.createObjectURL(file);
          recordedTake = Object.freeze({ file: file, clean: input.clean, containsAds: containsAds, duration: duration, aspect: input.aspect, cropped: input.cropped });
          q('playback').src = recordedURL; q('playback-wrap').hidden = false;
          q('download').href = recordedURL; q('download').download = filename;
          q('take-meta').textContent = (input.clean ? 'Clean social export · no VORALEAF ad breaks.' : 'On-platform version · ' + (containsAds ? 'includes a VORALEAF break.' : 'no VORALEAF break was drawn during this take.')) + ' ' + clock(duration) + ' · ' + input.aspect + '. Download to keep it.';
          refreshShareAvailability();
          tell('Your take is ready to preview and download. Nothing has been uploaded or broadcast.');
          emit('studio:recording-ready', { filename: filename, duration: duration, clean: input.clean, containsAds: containsAds, aspect: input.aspect, cropped: input.cropped });
        };
        recorder.start(250); startedAt = Date.now(); preparing = false; syncLocks();
        record.disabled = true; stop.disabled = false; q('record-indicator').hidden = false; q('counter').textContent = '00:00';
        tell(input.cropped ? 'Recording ' + input.aspect + ' · ' + (input.clean ? 'clean social version' : 'on-platform version') + '. This take stops after ' + limit + ' seconds.' : 'Recording in the camera format. This browser cannot composite VORALEAF breaks; the captured version is clean. Limit: ' + limit + ' seconds.');
        counterTimer = setInterval(function () { if (alive) q('counter').textContent = clock(Math.min(limit, (Date.now() - startedAt) / 1000)); }, 250);
        recordTimer = setTimeout(stopRecording, limit * 1000);
      } catch (error) {
        destroyOutput(input); recordingOutput = null; preparing = false; syncLocks();
        tell(error.message || 'This browser could not start a recording. Turn the camera off and try again.'); record.disabled = !stream; stop.disabled = true;
      } finally { preparing = false; if (alive) syncLocks(); }
    }
    function memberEligible() { try { return !!(window.VoraleafCreator && typeof window.VoraleafCreator.isEligible === 'function' && window.VoraleafCreator.isEligible() === true); } catch (_) { return false; } }
    function refreshShareAvailability() {
      var available = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
      q('share').hidden = !available;
      var canShare = false;
      if (available && recordedTake && recordedTake.clean && memberEligible()) { try { canShare = navigator.canShare({ files: [recordedTake.file] }); } catch (_) {} }
      q('share').disabled = !canShare;
      q('share').title = !memberEligible() ? 'Verified VORALEAF purchaser membership is required for this sharing control.' : recordedTake && !recordedTake.clean ? 'Record a clean social version before sharing.' : '';
    }
    async function shareRecording() {
      if (!memberEligible()) { tell('Verify your VORALEAF purchaser membership before using the sharing control. Local download remains available.'); return; }
      if (!recordedTake || !recordedTake.clean) { tell('Record a clean social version before sharing through this control.'); return; }
      var file = recordedTake.file;
      if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function' || !navigator.canShare({ files: [file] })) { tell('File sharing is unavailable here. Download your video, then choose your destination.'); return; }
      try {
        if (window.VoraleafCreator && typeof window.VoraleafCreator.authorizeLocalShare === 'function' && !(await window.VoraleafCreator.authorizeLocalShare(recordedTake))) return;
        await navigator.share({ files: [file], title: 'My VORALEAF coffee story', text: 'A moment, made mine.' });
        tell('Your device sharing sheet was opened. Destination choices and publication stay under your control.');
      } catch (error) { if (error.name !== 'AbortError') tell('Sharing could not be opened. Download your video to share it manually.'); }
    }
    function exportDraft() {
      var title = draftTitle.value.trim() || 'Untitled coffee story';
      var text = title + '\n' + '='.repeat(Math.min(title.length, 60)) + '\n\n' + draftBody.value + '\n\nVORALEAF — private local draft. Not published.\n';
      var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      var link = document.createElement('a'); link.href = url; link.download = 'VORALEAF-journal-draft.txt'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      draftStatus.textContent = 'Text export prepared. Check your browser downloads.';
    }
    script.value = safeRead('voraleaf-studio-script', defaultScript); promptText.textContent = script.value;
    try { var saved = JSON.parse(safeRead('voraleaf-studio-draft', '{}')); draftTitle.value = saved.title || ''; draftBody.value = saved.body || ''; if (saved.title || saved.body) draftStatus.textContent = 'Your local draft has been restored.'; } catch (_) {}
    on(enable, 'click', requestCamera); on(disable, 'click', function () { releaseCamera('Camera and microphone are off. Your recorded take remains available until you leave.'); });
    on(record, 'click', startRecording); on(stop, 'click', stopRecording); on(q('share'), 'click', shareRecording);
    page.querySelectorAll('input[name="studio-aspect"]').forEach(function (input) { on(input, 'change', function () { q('frame').classList.toggle('studio-is-portrait', input.value === 'portrait' && input.checked); }); });
    on(script, 'input', updatePrompt);
    on(speed, 'input', function () { q('speed-label').value = speed.value; q('speed-label').textContent = speed.value; });
    on(promptStart, 'click', function () { if (prompting) { stopPrompt(); return; } if (prompt.scrollTop + prompt.clientHeight >= prompt.scrollHeight - 1) prompt.scrollTop = 0; prompting = true; lastFrame = 0; promptStart.textContent = 'Pause teleprompter'; frameRequest = requestAnimationFrame(tick); });
    on(q('prompt-reset'), 'click', function () { stopPrompt(); prompt.scrollTop = 0; });
    on(page, 'studio:membership-changed', refreshShareAvailability);
    on(document, 'studio:membership-changed', refreshShareAvailability);
    on(draftTitle, 'input', saveDraft); on(draftBody, 'input', saveDraft); on(q('export'), 'click', exportDraft);
    on(document, 'visibilitychange', function () { if (document.hidden) { releaseCamera('Camera and microphone were turned off when the page went into the background.'); stopPrompt(); } });
    on(window, 'pagehide', function () { releaseCamera(); stopPrompt(); });
    currentController = { getPreparedStream: getPreparedStream, stopOutput: stopOutput, refreshShareAvailability: refreshShareAvailability, getRecordedFile: function () { return recordedTake; } };
    currentCleanup = function () {
      if (!alive) return;
      alive = false; liveGeneration++; abort.abort(); stopPrompt(); clearRecordTimers();
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      destroyOutput(recordingOutput); recordingOutput = null; destroyOutput(liveOutput); liveOutput = null;
      if (stream) stream.getTracks().forEach(function (track) { track.stop(); });
      stream = null; video.srcObject = null;
      if (recordedURL) URL.revokeObjectURL(recordedURL); recordedURL = null; recordedTake = null;
      emit('studio:camera-off', { reason: 'Studio closed' });
      currentController = null;
    };
    return currentCleanup;
  }
  window.VoraleafStudio = {
    render: render, mount: mount,
    cleanup: function () { if (currentCleanup) { currentCleanup(); currentCleanup = null; } },
    getPreparedStream: function (options) { return currentController ? currentController.getPreparedStream(options) : Promise.reject(new Error('Open the creator studio and enable your camera first.')); },
    getRecordedFile: function () { return currentController ? currentController.getRecordedFile() : null; },
    stopOutput: function () { if (currentController) currentController.stopOutput(); },
    refreshShareAvailability: function () { if (currentController) currentController.refreshShareAvailability(); }
  };
}());
