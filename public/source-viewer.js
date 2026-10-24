/* VORALEAF source window. Provider players remain attributed and unobscured. */
(function () {
  'use strict';
  var hostWindow = typeof window !== 'undefined' ? window : null;
  var origin = hostWindow && hostWindow.location ? hostWindow.location.origin : 'https://voraleaf.example';
  var dialog = null, body = null, current = null, previousFocus = null, mode = 'full', switchingCloses = 0;
  var secretKey = /token|secret|password|api.?key|access.?key|auth|session|signature|^code$/i;
  function invalid(message) { return { kind: 'unsupported', provider: 'Source', error: message, url: '' }; }
  function plain(value, max) { return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max || 200).trim(); }
  function authPath(path) { return /(?:^|\/)(?:signin-with-chatgpt|oauth|oauth2|authorize|authorization)(?:\/|$)/i.test(path); }
  function isPublicHost(host) { return host.includes('.') && !/^\[|^[\d.]+$/.test(host) && !/(?:^|\.)(?:localhost|local|internal|localdomain|test|invalid|home|lan)$|(?:^|\.)home\.arpa$/.test(host); }
  function privateParts(url) {
    if (Array.from(url.searchParams.keys()).some(function (key) { return secretKey.test(key); })) return true;
    var fragment; try { fragment = decodeURIComponent(url.hash.slice(1)); } catch (_) { return true; }
    if (!fragment) return false;
    var query = fragment.includes('?') ? fragment.slice(fragment.indexOf('?') + 1) : fragment;
    return Array.from(new URL('https://fragment.example/?' + query).searchParams.keys()).some(function (key) { return secretKey.test(key.replace(/^[\/#]+/, '')); });
  }
  function providerFrame(url, src, provider, note) { return { kind: 'iframe', url: url.href, src: src, provider: provider, official: true, note: note || 'Provider playback stays separate from your VORALEAF recording and broadcast.' }; }
  function resolveURL(value) {
    var url;
    try { url = new URL(String(value || ''), origin + '/'); } catch (_) { return invalid('Enter a valid source link.'); }
    if (url.username || url.password) return invalid('Use a source link without account credentials.');
    if (url.href.length > 65536) return invalid('This source link is too long.');
    if (url.protocol === 'mailto:') {
      var recipient; try { recipient = decodeURIComponent(url.pathname); } catch (_) { return invalid('This email link is invalid.'); }
      if (!/^[a-z0-9.!#$%&'*+\/=?^_`{|}~@,; -]+$/i.test(recipient) || !recipient.includes('@') || recipient.length > 300) return invalid('This email address is invalid.');
      return { kind: 'contact', provider: 'Email', url: url.href, value: plain(recipient, 300), subject: plain(url.searchParams.get('subject'), 300), body: String(url.searchParams.get('body') || '').replace(/\u0000/g, '').slice(0, 40000), action: 'Continue to email app' };
    }
    if (url.protocol === 'tel:') {
      var phone; try { phone = decodeURIComponent(url.pathname); } catch (_) { return invalid('This phone link is invalid.'); }
      if (!/^\+?[\d ().-]{3,40}$/.test(phone)) return invalid('This phone number is invalid.');
      return { kind: 'contact', provider: 'Telephone', url: url.href, value: phone, action: 'Continue to phone app' };
    }
    if (privateParts(url)) return invalid('Do not place passwords, access tokens or API keys in a source link.');
    if (url.origin === origin) {
      if (authPath(url.pathname) || url.pathname.startsWith('/api/')) return invalid('Use the secure account connection flow to continue.');
      if (/^\/assets\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|svg)$/i.test(url.pathname)) return { kind: 'image', provider: 'VORALEAF', url: url.href, src: url.href, note: 'Original VORALEAF concept imagery.' };
      if (/^\/assets\/[A-Za-z0-9_./-]+\.mp4$/i.test(url.pathname)) return { kind: 'video', provider: 'VORALEAF', url: url.href, src: url.href, note: 'Original VORALEAF media.' };
      if (/^\/watch\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) && !url.search && !url.hash) return { kind: 'iframe', provider: 'VORALEAF member room', url: url.href, src: url.href, own: true, note: 'Your member watch page stays inside this window.' };
      return invalid('Open this VORALEAF page using the app navigation.');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !isPublicHost(url.hostname)) return invalid('Use a public HTTPS source link without account credentials or a custom port.');
    var h = url.hostname.toLowerCase(), path = url.pathname;
    if (h === 'accounts.google.com' || authPath(path)) return invalid('Account sign-in needs the provider’s secure connection flow and cannot be embedded here.');
    if (['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(h)) {
      var number = h === 'wa.me' ? path.replace(/^\//, '') : url.searchParams.get('phone') || '';
      if (!/^\d{7,15}$/.test(number)) return invalid('Use a WhatsApp contact link containing a valid international phone number.');
      return { kind: 'contact', provider: 'WhatsApp', url: url.href, value: '+' + number, body: plain(url.searchParams.get('text'), 4000), action: 'Continue to WhatsApp' };
    }
    if (['www.youtube.com', 'youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(h)) {
      var id = h === 'youtu.be' ? path.slice(1).split('/')[0] : /^\/(?:embed|shorts|live)\//.test(path) ? path.split('/')[2] : url.searchParams.get('v');
      var list = url.searchParams.get('list');
      if (list && !/^[A-Za-z0-9_-]{10,100}$/.test(list)) return invalid('This YouTube playlist identifier is invalid.');
      if (id === 'videoseries') id = null;
      if (id && !/^[A-Za-z0-9_-]{11}$/.test(id)) return invalid('This YouTube video identifier is invalid.');
      if (!id && !(list && /\/(?:playlist|embed\/videoseries)\/?$/.test(path))) return { kind: 'unsupported', provider: 'YouTube', url: url.href, error: 'Paste a video or playlist link to watch inside VORALEAF. Search and channel pages cannot be embedded as players.' };
      var yt = new URL('https://www.youtube-nocookie.com/embed/' + (id || 'videoseries'));
      yt.searchParams.set('controls', '1'); yt.searchParams.set('playsinline', '1'); yt.searchParams.set('rel', '0');
      if (list) yt.searchParams.set('list', list);
      var start = url.searchParams.get('start') || url.searchParams.get('t');
      if (/^\d{1,6}s?$/.test(start || '')) yt.searchParams.set('start', start.replace(/s$/, ''));
      return providerFrame(url, yt.href, 'YouTube', 'Video provided by YouTube. Its player controls and required attribution remain visible.');
    }
    if (h === 'open.spotify.com') {
      var sp = path.match(/^\/(?:intl-[a-z]{2}\/)?(?:embed\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})\/?$/);
      if (!sp) return invalid('Use a Spotify track, album, playlist, artist, episode or show link.');
      return providerFrame(url, 'https://open.spotify.com/embed/' + sp[1] + '/' + sp[2], 'Spotify');
    }
    if (h === 'music.apple.com' || h === 'embed.music.apple.com') {
      if (!/^\/[a-z]{2}\/(?:album|playlist|song|music-video|station)\/[A-Za-z0-9%._~!$&'()*+,;=:@/-]+$/i.test(path)) return invalid('Use an Apple Music song, album, playlist or station link.');
      var apple = new URL('https://embed.music.apple.com' + path); var track = url.searchParams.get('i');
      if (track && !/^\d+$/.test(track)) return invalid('This Apple Music track identifier is invalid.');
      if (track) apple.searchParams.set('i', track);
      return providerFrame(url, apple.href, 'Apple Music');
    }
    if (['soundcloud.com', 'www.soundcloud.com', 'w.soundcloud.com'].includes(h)) {
      var sc = url;
      if (h === 'w.soundcloud.com') {
        try { sc = new URL(url.searchParams.get('url')); } catch (_) { return invalid('Use a SoundCloud track or playlist link.'); }
        if (!['soundcloud.com', 'www.soundcloud.com'].includes(sc.hostname) || sc.protocol !== 'https:' || sc.username || sc.password || sc.port || privateParts(sc)) return invalid('Use a standard public SoundCloud track or playlist link.');
      }
      if (!/^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_/-]+\/?$/.test(sc.pathname)) return invalid('Use a SoundCloud track or playlist link.');
      sc.search = ''; sc.hash = ''; var widget = new URL('https://w.soundcloud.com/player/'); widget.searchParams.set('url', sc.href); widget.searchParams.set('auto_play', 'false'); widget.searchParams.set('color', '#183e32');
      return providerFrame(url, widget.href, 'SoundCloud');
    }
    if (h === 'bandcamp.com' || h === 'www.bandcamp.com' || /^[a-z0-9-]+\.bandcamp\.com$/.test(h)) {
      if (/^\/EmbeddedPlayer\/(?:[A-Za-z0-9_=.-]+\/)*$/.test(path) && /\/(?:album|track)=\d+(?:\/|$)/.test(path)) { var bc = new URL(url.href); bc.search = ''; bc.hash = ''; return providerFrame(url, bc.href, 'Bandcamp'); }
      return { kind: 'unsupported', provider: 'Bandcamp', url: url.href, error: 'Use the official EmbeddedPlayer link from Bandcamp’s Share / Embed control. Album and track page names do not contain the player’s numeric identifier.' };
    }
    return { kind: 'iframe', provider: h.replace(/^www\./, ''), url: url.href, src: url.href, official: false, note: 'This source may block embedding. If the content is blank or unavailable, copy its link or choose another source.' };
  }
  function q(name) { return dialog.querySelector('[data-viewer="' + name + '"]'); }
  function textNode(tag, text, className) { var node = document.createElement(tag); node.textContent = text; if (className) node.className = className; return node; }
  function releaseContent() { if (!body) return; body.querySelectorAll('video,audio').forEach(function (el) { el.pause(); el.removeAttribute('src'); el.load(); }); body.querySelectorAll('iframe').forEach(function (el) { el.src = 'about:blank'; }); body.replaceChildren(); }
  function closed() {
    if (switchingCloses > 0) { switchingCloses--; return; }
    if (dialog.open) return; // A new source may open before the queued native close event.
    releaseContent(); current = null; dialog.classList.remove('is-windowed'); dialog.style.removeProperty('width'); dialog.style.removeProperty('height');
    if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true }); previousFocus = null;
  }
  function close() { if (dialog && dialog.open) dialog.close(); }
  function copy() {
    if (!current) return;
    var value = current.kind === 'contact' ? (current.provider === 'Email' ? 'To: ' + current.value + (current.subject ? '\nSubject: ' + current.subject : '') + (current.body ? '\n\n' + current.body : '') : current.value + (current.body ? '\n' + current.body : '')) : current.url;
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(function () { q('status').textContent = current && current.kind === 'contact' ? 'Contact details copied.' : 'Source link copied.'; }).catch(function () { q('status').textContent = 'Select the source address or contact details below to copy them.'; });
    else q('status').textContent = 'Select the source address or contact details below to copy them.';
  }
  function draw() {
    releaseContent();
    q('provider').textContent = current.provider; q('address').textContent = current.kind === 'contact' ? current.value : current.url;
    q('note').textContent = current.note || ''; q('status').textContent = current.error || (current.kind === 'iframe' ? 'Source requested. Use the provider’s controls to start playback.' : '');
    q('retry').hidden = current.kind !== 'iframe'; q('copy').textContent = current.kind === 'contact' ? 'Copy details' : 'Copy link'; q('copy').disabled = !current.url;
    if (current.kind === 'contact') {
      var card = document.createElement('section'); card.className = 'source-viewer-contact'; card.appendChild(textNode('span', current.provider.toUpperCase(), 'source-viewer-kicker')); card.appendChild(textNode('h3', current.value));
      if (current.subject) card.appendChild(textNode('p', 'Subject: ' + current.subject, 'source-viewer-subject'));
      if (current.body) card.appendChild(textNode('pre', current.body, 'source-viewer-draft'));
      card.appendChild(textNode('p', 'Review or copy these details here. Continuing uses your chosen contact app; no message has been sent.'));
      var nativeLink = textNode('a', current.action, 'button'); nativeLink.href = current.url; nativeLink.dataset.nativeLink = 'true';
      if (current.provider === 'WhatsApp') { nativeLink.target = '_blank'; nativeLink.rel = 'noopener noreferrer'; }
      card.appendChild(nativeLink); body.appendChild(card); q('note').textContent = 'Email, calls and WhatsApp use their own secure apps after you choose to continue.'; return;
    }
    if (current.kind === 'unsupported') { var note = document.createElement('section'); note.className = 'source-viewer-empty'; note.appendChild(textNode('span', 'A LITTLE CHANGE OF DIRECTION', 'source-viewer-kicker')); note.appendChild(textNode('h3', 'Choose a supported source.')); note.appendChild(textNode('p', current.error)); body.appendChild(note); return; }
    if (current.kind === 'image') { var image = document.createElement('img'); image.src = current.src; image.alt = q('title').textContent; image.className = 'source-viewer-image'; body.appendChild(image); return; }
    if (current.kind === 'video') { var video = document.createElement('video'); video.src = current.src; video.controls = true; video.playsInline = true; video.preload = 'metadata'; body.appendChild(video); return; }
    var iframe = document.createElement('iframe'); iframe.title = q('title').textContent + ' — ' + current.provider; iframe.src = current.src; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; iframe.allowFullscreen = true;
    iframe.allow = 'encrypted-media; fullscreen; picture-in-picture; clipboard-write';
    if (!current.own) iframe.setAttribute('sandbox', current.official ? 'allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox' : 'allow-scripts allow-same-origin allow-forms allow-presentation');
    iframe.addEventListener('load', function () { if (current && body.contains(iframe)) q('status').textContent = 'Source requested. If nothing appears, the provider may block embedding or require its own sign-in.'; });
    body.appendChild(iframe);
  }
  function setMode(next) {
    if (!dialog || !dialog.open || mode === next) return;
    switchingCloses++; dialog.close(); mode = next; dialog.classList.toggle('is-windowed', next === 'window'); dialog.setAttribute('aria-modal', next === 'full' ? 'true' : 'false');
    q('size').textContent = next === 'full' ? 'Restore window' : 'Expand to fill app';
    if (next === 'full') { dialog.style.removeProperty('width'); dialog.style.removeProperty('height'); dialog.showModal(); } else dialog.show();
    q('size').focus({ preventScroll: true });
  }
  function ensureDialog() {
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.className = 'source-viewer'; dialog.setAttribute('data-voraleaf-viewer', ''); dialog.setAttribute('aria-labelledby', 'source-viewer-title'); dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = '<header class="source-viewer-header"><div class="source-viewer-identity"><span class="source-viewer-kicker">VORALEAF · SOURCE WINDOW</span><h2 id="source-viewer-title" data-viewer="title">Your source</h2><p><span data-viewer="provider"></span><span aria-hidden="true"> · </span><span data-viewer="address"></span></p></div><div class="source-viewer-actions"><button type="button" data-viewer="size">Restore window</button><button type="button" data-viewer="close" aria-label="Close source window">Close ×</button></div></header><div class="source-viewer-toolbar"><span data-viewer="status" role="status"></span><div><button type="button" data-viewer="retry">Retry source</button><button type="button" data-viewer="copy">Copy link</button></div></div><div class="source-viewer-content" data-viewer="content"></div><footer class="source-viewer-footer"><p data-viewer="note"></p><span>Provider controls and links remain available. Secure account consent uses the provider’s own sign-in flow.</span></footer>';
    document.body.appendChild(dialog); body = q('content'); q('close').addEventListener('click', close); q('size').addEventListener('click', function () { setMode(mode === 'full' ? 'window' : 'full'); }); q('copy').addEventListener('click', copy); q('retry').addEventListener('click', draw); dialog.addEventListener('close', closed);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
  }
  function sameSource(left, right) {
    return !!left && !!right && left.kind === right.kind &&
      (left.src || left.url) === (right.src || right.url) && left.error === right.error;
  }
  function open(options) {
    options = typeof options === 'string' ? { url: options } : options || {};
    var resolved = resolveURL(options.url); if (typeof document === 'undefined') return false;
    ensureDialog(); var alreadyOpen = dialog.open;
    // Repeated activations (including double clicks) keep the existing player and playback state.
    if (alreadyOpen && sameSource(current, resolved)) return !resolved.error;
    if (!alreadyOpen && !previousFocus) previousFocus = document.activeElement;
    current = resolved; q('title').textContent = plain(options.title, 140) || 'Your source'; draw();
    if (!alreadyOpen) { mode = 'full'; dialog.classList.remove('is-windowed'); dialog.setAttribute('aria-modal', 'true'); q('size').textContent = 'Restore window'; dialog.showModal(); }
    q('close').focus({ preventScroll: true }); return !resolved.error;
  }
  if (hostWindow) hostWindow.VoraleafViewer = { open: open, close: close, resolveURL: resolveURL };
  if (typeof document === 'undefined') return;
  function sourceActivation(event) {
    if (event.defaultPrevented) return;
    // Capture middle-click's separate navigation default as well as left/keyboard activation.
    if (event.type === 'auxclick' ? event.button !== 1 : event.button > 0) return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.hasAttribute('data-native-link') || link.closest('.source-viewer')) return;
    var href = link.getAttribute('href'), url; try { url = new URL(href, origin + '/'); } catch (_) { return; }
    if (authPath(url.pathname) || (url.origin === origin && url.pathname.startsWith('/api/')) || url.hostname === 'accounts.google.com') return;
    var isContact = ['mailto:', 'tel:'].includes(url.protocol);
    var isExternal = ['https:', 'http:'].includes(url.protocol) && url.origin !== origin;
    var ownNewWindow = url.origin === origin && link.target === '_blank' && (/^\/assets\//.test(url.pathname) || /^\/watch\//.test(url.pathname));
    if (!isContact && !isExternal && !ownNewWindow) return;
    event.preventDefault(); event.stopPropagation();
    var linkedImage = link.querySelector('img');
    var title = plain(link.getAttribute('aria-label') || link.textContent, 140) || (linkedImage ? plain(linkedImage.alt, 140) : '') || 'Your source';
    open({ url: url.href, title: title });
  }
  ['click', 'dblclick', 'auxclick'].forEach(function (type) { document.addEventListener(type, sourceActivation, true); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && dialog && dialog.open && mode === 'window') { event.preventDefault(); close(); } });
}());
