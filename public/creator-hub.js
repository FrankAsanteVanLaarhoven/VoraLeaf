/* VORALEAF member publishing controls. Entitlements and social tokens stay on the server. */
(function () {
  'use strict';
  var active = null;
  var preferencesKey = 'voraleaf-creator-preferences';
  // Cleanup references are kept only for this page session; no stream credentials are retained.
  var pendingStopRooms = new Map();
  var editions = [
    { id:'bold', name:'BOLD 01', line:'A confident little ritual.', colour:'#163e32' },
    { id:'ember', name:'EMBER 02', line:'Make time for your moment.', colour:'#57231e' },
    { id:'bloom', name:'BLOOM 03', line:'A coffee moment, beautifully yours.', colour:'#6e344a' }
  ];
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  function memberReason(reason){var messages={configuration_required:'Purchase verification is not connected yet. Publishing opens after the shop and member records are configured.',verification_unavailable:'Purchase verification is temporarily unavailable. Please refresh access later.',no_qualifying_purchase:'A verified VORALEAF product purchase or an active, paid recurring plan opens creator publishing.',sign_in_required:'Sign in to check a qualifying VORALEAF purchase or recurring membership.'};return messages[reason]||'Access opens after a verified VORALEAF purchase or an active, paid recurring plan.';}
  function localPreferences() {
    try { var p=JSON.parse(localStorage.getItem(preferencesKey)||'{}'); return { enabled:p.enabled===true, minutes:[5,10,15].includes(Number(p.minutes))?Number(p.minutes):10, seconds:[10,15].includes(Number(p.seconds))?Number(p.seconds):10 }; }
    catch (_) { return {enabled:false,minutes:10,seconds:10}; }
  }
  function savePreferences(p) { try { localStorage.setItem(preferencesKey,JSON.stringify({enabled:p.enabled,minutes:p.minutes,seconds:p.seconds})); } catch (_) {} }
  function safeOwnPath(path, pattern) { return typeof path==='string' && pattern.test(path) ? path : ''; }
  function providerURL(value) {
    try { var u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && (u.hostname==='cloudflarestream.com'||u.hostname.endsWith('.cloudflarestream.com')||u.hostname==='videodelivery.net'||u.hostname.endsWith('.videodelivery.net')) ? u.href : ''; } catch (_) { return ''; }
  }
  function render() {
    var p=localPreferences();
    return '<section class="creator-hub" data-voraleaf-creator aria-labelledby="creator-hub-heading">' +
      '<div class="creator-hub-intro"><div><p class="eyebrow">THE MEMBER CREATOR CLUB</p><h2 id="creator-hub-heading">Create here.<br><em>Share your moment.</em></h2><p>Connect an eligible channel, keep a private recording or welcome an audience into your VORALEAF room.</p></div><span class="creator-hub-stamp">FOR VERIFIED BUYERS<br>&amp; RECURRING CUSTOMERS</span></div>' +
      '<section class="creator-membership" aria-label="Your creator membership"><div><span class="creator-status-dot" aria-hidden="true"></span><p class="eyebrow">YOUR CREATOR ACCESS</p><h3 data-creator="member-heading">Checking membership…</h3><p data-creator="member-copy">Publishing and live access are verified securely against product purchases or an active, paid recurring plan.</p></div><div><span class="creator-member-badge" data-creator="member-badge">Verification pending</span><button type="button" class="creator-text-button" data-creator-action="refresh">Refresh access ↗</button><a href="/signin-with-chatgpt?return_to=%2Fstudio" class="creator-text-button" data-creator="sign-in" hidden>Sign in to check access ↗</a></div></section>' +
      '<section class="creator-connections" aria-labelledby="creator-connections-heading"><div class="creator-section-heading"><div><p class="eyebrow">01 / YOUR CHANNELS</p><h3 id="creator-connections-heading">A little more connected.</h3></div><p>Every connection needs your consent. No passwords are entered here.</p></div><div class="creator-channel-grid">' +
      '<article class="creator-channel"><span class="creator-channel-symbol" aria-hidden="true">▶</span><h4>YouTube</h4><p data-creator="youtube-copy">Connect your channel to publish a clean, reviewed recording.</p><span class="creator-channel-status" data-creator="youtube-status">Checking connection</span><a href="/api/studio/oauth/youtube/start" data-creator="youtube-connect" class="button outline small" hidden>Connect YouTube ↗</a><button type="button" class="button outline small" data-creator="youtube-locked" disabled>Connection needs setup</button><button type="button" class="creator-text-button" data-creator-action="disconnect-youtube" data-creator="youtube-disconnect" hidden>Disconnect channel</button></article>' +
      '<article class="creator-channel"><span class="creator-channel-symbol" aria-hidden="true">◎</span><h4>Instagram</h4><p>Prepare a clean take and use your device’s share menu. Direct account publishing needs platform configuration.</p><span class="creator-channel-status">Device sharing</span><button type="button" class="button outline small" data-creator-action="share" data-member-control disabled>Share a clean take ↗</button></article>' +
      '<article class="creator-channel"><span class="creator-channel-symbol" aria-hidden="true">♪</span><h4>TikTok</h4><p>Choose your destination in the share menu. App-added commercial breaks stay out of social exports.</p><span class="creator-channel-status">Device sharing</span><button type="button" class="button outline small" data-creator-action="share" data-member-control disabled>Share a clean take ↗</button></article>' +
      '<article class="creator-channel"><span class="creator-channel-symbol" aria-hidden="true">▣</span><h4>Twitch</h4><p>Export your clean recording. Live channel distribution is a separate connection from your VORALEAF room.</p><span class="creator-channel-status">Clean clip export</span><button type="button" class="button outline small" data-creator-action="download" data-member-control disabled>Download a clean take ↗</button></article></div><p class="creator-status-line" data-creator="connection-message" role="status">Only verified members can connect or publish. A profile link is not an account connection.</p></section>' +
      '<div class="creator-live-ad-grid"><section class="creator-live-panel" aria-labelledby="creator-live-heading"><p class="eyebrow">02 / ON-PLATFORM LIVE</p><h3 id="creator-live-heading">Your room.<br>Your people.</h3><p>A live room inside VORALEAF, with your camera, chosen audio and optional brand breaks. Your audience uses a member watch link.</p><label class="creator-field" for="creator-live-title">Live-session title</label><input id="creator-live-title" type="text" maxlength="100" value="A VORALEAF moment" data-creator="live-title"><label class="creator-check"><input type="checkbox" data-creator="live-rights">I have permission to broadcast this video and its audio.</label><div class="creator-live-state"><span class="creator-live-dot" aria-hidden="true"></span><span data-creator="live-state">Not broadcasting</span></div><div class="creator-action-row"><button type="button" class="button light" data-creator-action="go-live" data-creator="go-live" disabled>Start my live room ↗</button><button type="button" class="button creator-stop" data-creator-action="stop-live" data-creator="stop-live" hidden>End live session</button></div><p class="creator-live-message" data-creator="live-message" role="status">Membership and the live-video service must be configured before broadcasting opens.</p><a class="creator-watch-link" data-creator="watch-link" hidden target="_blank" rel="noopener noreferrer">Open your member watch page ↗</a><p class="creator-fine">This room is separate from social-platform livestreaming. No audience count or cross-platform simulcast is implied.</p></section>' +
      '<section class="creator-ad-panel" aria-labelledby="creator-ad-heading"><p class="eyebrow">03 / YOUR BRAND BREAKS</p><h3 id="creator-ad-heading">A moment<br>for VORALEAF.</h3><p>Optional, clearly labelled advertisements on your VORALEAF output. Turn them off whenever you choose.</p><label class="creator-ad-toggle"><input type="checkbox" data-creator="ads-enabled"'+(p.enabled?' checked':'')+'><span>Enable automatic VORALEAF breaks</span></label><div class="creator-ad-options"><label for="creator-break-minutes">Every<select id="creator-break-minutes" data-creator="break-minutes">'+[5,10,15].map(function(n){return '<option value="'+n+'"'+(p.minutes===n?' selected':'')+'>'+n+' minutes</option>';}).join('')+'</select></label><label for="creator-break-seconds">Break length<select id="creator-break-seconds" data-creator="break-seconds">'+[10,15].map(function(n){return '<option value="'+n+'"'+(p.seconds===n?' selected':'')+'>'+n+' seconds</option>';}).join('')+'</select></label></div><div class="creator-ad-preview" data-creator="ad-preview"><span class="creator-ad-preview-symbol" aria-hidden="true">✧</span><p>Preview the little interval.</p><small>On-platform only. Clean social recordings contain no inserted commercial breaks.</small></div><div class="creator-action-row"><button type="button" class="button outline small" data-creator-action="preview-ad">Preview a brand break</button><button type="button" class="creator-text-button" data-creator-action="end-ad" data-creator="end-ad" hidden>End preview</button></div><p class="creator-status-line" data-creator="ad-status" role="status">Automatic breaks are '+(p.enabled?'enabled for your next live room.':'off.')+'</p></section></div>' +
      '<section class="creator-publishing" aria-labelledby="creator-publishing-heading"><div class="creator-section-heading"><div><p class="eyebrow">04 / REVIEW. THEN SHARE.</p><h3 id="creator-publishing-heading">Give your story a home.</h3></div><p>Save a private platform copy or send a clean take to your own channel. Every publish action is yours.</p></div><div class="creator-publishing-grid"><div><span class="creator-take-badge" data-creator="take-badge">No recording selected</span><h4 data-creator="take-heading">Record a clean take to begin.</h4><p data-creator="take-copy">Choose the clean social recording mode, record a clip and review it before sharing.</p><label class="creator-field" for="creator-post-title">Recording title</label><input id="creator-post-title" type="text" maxlength="100" value="My VORALEAF moment" data-creator="post-title"><div class="creator-action-row"><button type="button" class="button outline small" data-creator-action="save-recording" data-creator="save-recording" disabled>Save private platform copy ↗</button><button type="button" class="creator-text-button" data-creator-action="share" data-creator="share-recording" disabled>Share through my device ↗</button></div><a class="text-link" data-creator="recording-watch" hidden target="_blank" rel="noopener noreferrer">Open the private recording ↗</a><p class="creator-status-line" data-creator="recording-status" role="status">Recordings up to 20 MB can be saved privately. Only clean versions can be sent to social destinations.</p><div class="creator-member-publish"><label class="creator-check"><input type="checkbox" data-creator="member-publish-confirm">I reviewed this recording and want verified VORALEAF members to be able to watch it.</label><button type="button" class="button outline small" data-creator-action="publish-members" data-creator="publish-members" disabled>Publish to VORALEAF members ↗</button><p class="creator-status-line" data-creator="member-publish-status" role="status">Your platform copy stays private until you choose to publish it.</p></div></div><div class="creator-youtube-publish"><p class="eyebrow">YOUTUBE CHANNEL PUBLISHING</p><h4>Choose the audience<br>before you publish.</h4><label class="creator-field" for="creator-privacy">YouTube visibility</label><select id="creator-privacy" data-creator="post-privacy"><option value="private">Private — only selected people</option><option value="unlisted">Unlisted — people with the link</option><option value="public">Public — anyone can watch</option></select><label class="creator-check"><input type="checkbox" data-creator="publish-confirm">I reviewed this recording and want to upload it with the visibility selected above.</label><button type="button" class="button" data-creator-action="publish-youtube" data-creator="publish-youtube" disabled>Upload to my YouTube channel ↗</button><p class="creator-status-line" data-creator="publish-status" role="status">Requires a verified membership, connected channel and private platform copy of a clean recording.</p></div></div></section>' +
      '<p class="creator-hub-footnote">Purchaser and recurring-customer access is verified on the server. Local music, ad previews and rehearsal do not grant a membership or publish a recording. Third-party destination rules still apply.</p></section>';
  }
  function mount(root) {
    cleanup(); root=root||document;
    var page=root.querySelector('[data-voraleaf-creator]'); if(!page)return function(){};
    var state={page:page,alive:true,member:{authenticated:false,eligible:false},config:{providers:{},live:{}},preferences:localPreferences(),break:null,variant:0,breakTimer:null,peer:null,protocolSession:null,room:null,ownedOutput:null,needsCleanup:false,stopping:false,stopPromise:null,membershipTimer:null,membershipChecking:false,broadcasting:false,busy:false,lastBreakAt:0,uploaded:null,images:{},controllers:new Set(),events:new AbortController(),watch:false};
    active=state;
    var q=function(name){return page.querySelector('[data-creator="'+name+'"]');};
    function on(node,event,fn){if(node)node.addEventListener(event,fn,{signal:state.events.signal});}
    function message(name,text){if(state.alive&&q(name))q(name).textContent=text;}
    function canPublish(){return state.member.authenticated===true&&state.member.eligible===true;}
    function take(){try{return window.VoraleafStudio&&window.VoraleafStudio.getRecordedFile?window.VoraleafStudio.getRecordedFile():null;}catch(_){return null;}}
    function cleanTake(){var t=take();return t&&t.file&&t.clean===true&&t.containsAds!==true?t:null;}
    async function api(path,options,uncancelled){
      var controller=new AbortController();if(!uncancelled)state.controllers.add(controller);
      var timeout=setTimeout(function(){controller.abort();},15000);
      try{var response=await fetch(path,Object.assign({credentials:'same-origin',cache:'no-store',signal:controller.signal},options||{}));var type=response.headers.get('content-type')||'';if(!/json/i.test(type))throw new Error('The publishing service is unavailable.');var data=await response.json();if(!response.ok){var failure=new Error(typeof data.message==='string'?data.message.slice(0,250):'This action is not available yet.');failure.data=data;failure.status=response.status;throw failure;}return data;}
      finally{clearTimeout(timeout);state.controllers.delete(controller);}
    }
    function updateControls(){
      if(!state.alive)return;
      var eligible=canPublish(),youtube=state.config.providers&&state.config.providers.youtube||{},live=state.config.live||{},t=cleanTake(),anyTake=take();
      page.querySelectorAll('[data-member-control]').forEach(function(b){b.disabled=!eligible||!t;});
      q('youtube-connect').hidden=!(eligible&&youtube.configured===true&&youtube.connected!==true);q('youtube-locked').hidden=eligible&&youtube.configured===true;q('youtube-disconnect').hidden=youtube.connected!==true;
      q('youtube-status').textContent=youtube.connected?'Channel connected':youtube.configured?'Ready for your consent':'Developer setup required';
      message('youtube-copy',youtube.connected?'Your channel is connected securely. Review a clean take before choosing to upload.':'Connect your channel with its own consent screen. Your password and channel tokens are not stored in this browser.');
      q('go-live').disabled=!eligible||live.configured!==true||state.busy||!!state.room||!q('live-rights').checked;
      q('stop-live').hidden=!state.room;q('stop-live').disabled=state.stopping;q('stop-live').textContent=state.needsCleanup?'Retry ending live session':'End live session';q('watch-link').hidden=!state.room||state.needsCleanup||!q('watch-link').getAttribute('href');
      q('save-recording').disabled=!eligible||state.config.uploads?.configured!==true||!anyTake||state.busy;q('share-recording').disabled=!eligible||!t||state.busy;
      q('publish-youtube').disabled=!eligible||youtube.connected!==true||!state.uploaded||state.uploaded.clean!==true||!q('publish-confirm').checked||state.busy;
      q('publish-members').disabled=!eligible||!state.uploaded||state.uploaded.status==='published'||!q('member-publish-confirm').checked||state.busy;
      q('sign-in').hidden=state.member.authenticated!==false;
      if(!state.room&&!eligible)message('live-message',state.member.authenticated?'Live publishing opens after a qualifying product purchase or active paid recurring plan is verified.':'Sign in and verify a qualifying VORALEAF purchase to open member publishing.');
      else if(!state.room&&!live.configured)message('live-message','Your access is verified. The live-video service still needs to be configured.');
      if(t){q('take-badge').textContent='Clean social mode';message('take-heading',t.file.name||'Your clean take is ready.');message('take-copy','Clean mode omits app-inserted brand breaks. Review your footage and audio before sharing; its clean status is creator-declared, not independently scanned.');}
      else if(take()){q('take-badge').textContent='On-platform recording';message('take-heading','Make a clean social take to share.');message('take-copy','This take is intended for your VORALEAF output. Choose clean social mode to record a version for other platforms.');}
    }
    async function refresh(){
      message('member-heading','Checking membership…');
      var results=await Promise.allSettled([api('/api/studio/membership'),api('/api/studio/config')]);if(!state.alive)return;
      if(results[0].status==='fulfilled')state.member=results[0].value;
      else state.member={authenticated:results[0].reason?.data?.authenticated===true,eligible:false,reason:results[0].reason?.data?.reason||'Purchase verification is not configured yet.'};
      if(results[1].status==='fulfilled')state.config=results[1].value;else state.config={providers:{},uploads:{configured:false},live:{configured:false}};
      var eligible=canPublish();
      page.classList.toggle('creator-is-member',eligible);
      message('member-heading',eligible?(state.member.tier==='recurring'?'Your recurring membership is active.':'Your purchaser membership is verified.'):'A little club for our customers.');
      message('member-copy',eligible?'Your account can use configured member publishing services. You choose what to connect and when to share.':memberReason(state.member.reason));
      q('member-badge').textContent=eligible?(state.member.tier==='recurring'?'Recurring customer':'Verified purchaser'):'Publishing locked';
      updateControls();notifyMembership();
      if(state.broadcasting&&(!eligible||state.config.live?.configured!==true))stopLive(true,'Creator access or live-service availability could not be verified. Your local broadcast was stopped.');
    }
    function finishBreak(){if(!state.break)return;state.break=null;clearInterval(state.breakTimer);state.breakTimer=null;window.VoraleafAudio?.setDucking(false);if(state.alive){q('end-ad').hidden=true;q('ad-preview').innerHTML='<span class="creator-ad-preview-symbol" aria-hidden="true">✧</span><p>A little interval, complete.</p><small>Your camera output returns after the break.</small>';message('ad-status',state.preferences.enabled?'Automatic breaks are enabled for your next live interval.':'Automatic breaks are off.');}}
    function startBreak(manual){
      finishBreak();var edition=editions[state.variant++%editions.length];state.break={edition:edition,start:performance.now(),end:performance.now()+state.preferences.seconds*1000,manual:manual};state.lastBreakAt=performance.now();
      window.VoraleafAudio?.setDucking(true);q('end-ad').hidden=false;
      q('ad-preview').innerHTML='<div class="creator-ad-creative" style="--creator-ad-colour:'+edition.colour+'"><span class="creator-ad-disclosure">ADVERTISEMENT · VORALEAF</span><img src="/assets/'+edition.id+'-6x15g.svg?rev=roots-r10" alt="'+edition.name+' concept carton"><div><span class="creator-ad-wordmark">VORALEAF</span><strong>'+edition.name+'</strong><p>'+edition.line+'</p><a href="/products/'+edition.id+'" data-link>Explore the collection ↗</a><small>Collection preview · product details to follow</small></div><span class="creator-ad-countdown" data-creator="ad-countdown" aria-hidden="true">'+state.preferences.seconds+'s</span></div>';
      message('ad-status',manual?'Ad preview is running. It is not being published.':'A VORALEAF advertisement is running on your on-platform output.');
      state.breakTimer=setInterval(function(){if(!state.break)return;var left=Math.ceil((state.break.end-performance.now())/1000);if(left<=0){finishBreak();return;}var counter=q('ad-countdown');if(counter)counter.textContent=left+'s';},250);
    }
    state.startBreak=startBreak;state.finishBreak=finishBreak;
    editions.forEach(function(e){var image=new Image();image.src='/assets/'+e.id+'-6x15g.svg?rev=roots-r10';state.images[e.id]=image;});
    async function share(downloadOnly){
      if(!canPublish()){message('connection-message','Verified purchaser or recurring membership is required for member sharing.');return;}
      var t=cleanTake();if(!t){message('recording-status','Record a clean social take first. On-platform commercial versions are not sent to social destinations.');return;}
      try{if(!downloadOnly&&navigator.share&&navigator.canShare&&navigator.canShare({files:[t.file]})){await navigator.share({files:[t.file],title:q('post-title').value.trim()||'My VORALEAF moment'});message('recording-status','The device share menu handled your recording. Destination availability depends on your device.');}
      else{var url=URL.createObjectURL(t.file),a=document.createElement('a');a.href=url;a.download=t.file.name||'VORALEAF-clean-take.webm';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1500);message('recording-status','Clean take prepared for download. Choose your destination from its own app.');}}
      catch(error){if(error.name!=='AbortError')message('recording-status','Sharing was unavailable. You can download the recording instead.');}
    }
    async function saveRecording(){
      var t=take();if(!canPublish()||!t||!t.file||state.busy)return;
      if(t.file.size>20*1024*1024){message('recording-status','Choose a recording smaller than 20 MB.');return;}
      state.busy=true;updateControls();message('recording-status','Saving your private platform copy…');
      try{var data=await api('/api/studio/uploads',{method:'POST',headers:{'Content-Type':t.file.type||'video/webm','X-Video-Title':encodeURIComponent(q('post-title').value.trim()||'My VORALEAF moment'),'X-Video-Clean':String(t.clean===true&&t.containsAds!==true)},body:t.file});if(!state.alive)return;state.uploaded=Object.assign({},data,{clean:t.clean===true&&t.containsAds!==true});q('member-publish-confirm').checked=false;var path=safeOwnPath(data.watchPath,/^\/watch\/[A-Za-z0-9_-]+$/);if(path){q('recording-watch').href=path;q('recording-watch').hidden=false;}message('recording-status',data.moderationStatus==='pending_review'?'Private platform copy saved. This member-created content has not been independently reviewed or posted to a social channel.':'Private platform copy saved. This has not been posted to a social channel.');}
      catch(error){message('recording-status',error.message);}finally{state.busy=false;updateControls();}
    }
    async function publishMembers(){
      if(!canPublish()||!state.uploaded||!q('member-publish-confirm').checked||state.busy)return;
      state.busy=true;updateControls();message('member-publish-status','Publishing to verified VORALEAF members…');
      try{await api('/api/studio/assets/'+encodeURIComponent(state.uploaded.id)+'/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visibility:'members',confirm:true})},true);state.uploaded.status='published';q('recording-watch').textContent='Open the member recording ↗';q('member-publish-confirm').checked=false;message('member-publish-status','Your member-created recording is available through its watch page. It has not been independently reviewed.');}
      catch(error){message('member-publish-status',error.message);}finally{state.busy=false;updateControls();}
    }
    async function publishYoutube(){
      if(!canPublish()||!state.uploaded||!q('publish-confirm').checked||state.busy)return;
      var t=cleanTake();if(!t){message('publish-status','Choose a clean social recording before uploading.');return;}
      state.busy=true;updateControls();message('publish-status','Uploading the reviewed recording to your selected channel…');
      try{var data=await api('/api/studio/youtube/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assetId:state.uploaded.id,title:q('post-title').value.trim()||'My VORALEAF moment',privacy:q('post-privacy').value,confirm:true})},true);message('publish-status',(data.id||data.videoId)?'Upload completed with your selected visibility. Open your YouTube channel to review it.':'The upload request completed. Review the destination channel before sharing its link.');q('publish-confirm').checked=false;}
      catch(error){message('publish-status',error.message);}finally{state.busy=false;updateControls();}
    }
    function notifyMembership(){if(state.alive&&active===state){document.dispatchEvent(new CustomEvent('studio:membership-changed',{detail:{eligible:canPublish()}}));}}
    function releaseOwnedOutput(){
      var owned=state.ownedOutput;state.ownedOutput=null;if(!owned)return;
      // A late response must never dispatch through a newly mounted studio controller.
      if(state.alive&&active===state&&window.VoraleafStudio?.stopOutput){window.VoraleafStudio.stopOutput();}
      else owned.getTracks().forEach(function(track){track.stop();});
    }
    function clearMembershipTimer(){if(state.membershipTimer)clearInterval(state.membershipTimer);state.membershipTimer=null;}
    function adoptPendingCleanup(){
      if(!state.alive||state.room||state.busy||!pendingStopRooms.size)return;
      state.room={id:pendingStopRooms.keys().next().value};state.needsCleanup=true;
      message('live-state','Remote cleanup pending');message('live-message','A previous live room still needs to be ended. Your local camera output is off; retry ending the saved room.');updateControls();
    }
    async function checkBroadcastMembership(){
      if(!state.alive||!state.broadcasting||!state.room||state.membershipChecking)return;
      state.membershipChecking=true;
      try{var member=await api('/api/studio/membership');if(!state.alive)return;state.member=member;notifyMembership();if(!canPublish())await stopLive(true,'Creator membership is no longer eligible. Your local broadcast was stopped.');}
      catch(error){if(state.alive){state.member={authenticated:error.data?.authenticated===true,eligible:false,reason:error.status===401?'sign_in_required':'verification_unavailable'};notifyMembership();await stopLive(true,'Creator access could not be verified. Your local broadcast was stopped.');}}
      finally{state.membershipChecking=false;updateControls();}
    }
    function startMembershipTimer(){if(!state.membershipTimer)state.membershipTimer=setInterval(checkBroadcastMembership,60000);}
    async function stopLive(silent,reason){
      state.broadcasting=false;clearMembershipTimer();
      if(state.protocolController){state.protocolController.abort();state.protocolController=null;}
      if(state.peer){state.peer.close();state.peer=null;}
      if(state.protocolSession){fetch(state.protocolSession,{method:'DELETE',cache:'no-store',keepalive:true}).catch(function(){});state.protocolSession=null;}
      releaseOwnedOutput();finishBreak();
      if(state.alive){page.classList.remove('creator-is-live');message('live-state','Local broadcast stopped');q('watch-link').hidden=true;}
      if(state.stopPromise)return state.stopPromise;
      var room=state.room;if(!room){if(state.alive&&!silent)message('live-message',reason||'Your browser broadcast has ended.');updateControls();return true;}
      state.stopping=true;updateControls();
      state.stopPromise=(async function(){
        var result=await stopRemoteRoom(room.id);
        if(result.ok){pendingStopRooms.delete(room.id);if(state.room?.id===room.id){state.room=null;state.needsCleanup=false;}if(state.alive){message('live-state','Not broadcasting');if(reason||!silent)message('live-message',reason||'Your browser broadcast and remote live input have ended.');}}
        else{pendingStopRooms.set(room.id,{id:room.id});if(state.room?.id===room.id)state.needsCleanup=true;if(state.alive){message('live-state','Local output off · remote cleanup pending');message('live-message',(reason?reason+' ':'')+(result.status===401?'Sign in with the room owner’s account, then retry ending the saved room.':result.status===403?'This account could not end the saved room. Sign in as its owner and retry.':'The remote live input has not been confirmed ended. Retry ending the saved room.'));}document.dispatchEvent(new CustomEvent('studio:cleanup-pending'));}
        return result.ok;
      })();
      try{return await state.stopPromise;}finally{state.stopPromise=null;state.stopping=false;updateControls();adoptPendingCleanup();}
    }
    async function goLive(){
      if(!canPublish()||state.config.live?.configured!==true||!q('live-rights').checked||state.busy||state.room)return;
      if(typeof RTCPeerConnection==='undefined'){message('live-message','This browser does not support the live connection.');return;}
      state.busy=true;q('watch-link').removeAttribute('href');q('watch-link').hidden=true;updateControls();message('live-message','Preparing your camera output…');
      try{
        var output=await window.VoraleafStudio.getPreparedStream({clean:false});
        if(!output||!output.getVideoTracks().length)throw new Error('Enable your camera in the recording panel first.');
        if(!state.alive){output.getTracks().forEach(function(track){track.stop();});return;}
        state.ownedOutput=output;
        var data=await api('/api/studio/live/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:q('live-title').value.trim()||'A VORALEAF moment',adsEnabled:state.preferences.enabled,breakMinutes:state.preferences.minutes,breakSeconds:state.preferences.seconds})},true);
        if(!state.alive){var late=await stopRemoteRoom(data.id);if(!late.ok){pendingStopRooms.set(data.id,{id:data.id});document.dispatchEvent(new CustomEvent('studio:cleanup-pending'));}return;}
        state.room=data;state.needsCleanup=false;state.lastBreakAt=performance.now();updateControls();
        var url=providerURL(data.whipUrl);if(!url)throw new Error('The live provider returned an unsupported publishing address.');
        var peer=new RTCPeerConnection();state.peer=peer;output.getTracks().forEach(function(track){peer.addTrack(track,output);});
        peer.addEventListener('connectionstatechange',function(){if(!state.alive)return;if(peer.connectionState==='connected'){state.broadcasting=true;state.lastBreakAt=performance.now();startMembershipTimer();message('live-state','Broadcasting to your member room');message('live-message','Your live transport is connected. Use the member watch page to check audience playback.');}else if(peer.connectionState==='disconnected'){state.broadcasting=false;message('live-state','Live connection interrupted');}else if(peer.connectionState==='failed'){message('live-message','The live connection was interrupted. Please end the session and try again.');stopLive(true);}});
        await peer.setLocalDescription(await peer.createOffer());await gather(peer);
        var response=await postSDP(url,peer.localDescription.sdp,state);
        if(!response.ok)throw new Error('The live provider could not accept this camera connection.');
        var location=response.headers.get('location');if(location){var session=new URL(location,url);if(session.origin===new URL(url).origin)state.protocolSession=session.href;}
        await peer.setRemoteDescription({type:'answer',sdp:await response.text()});
        if(!state.alive){await stopLive(true);return;}
        var watchPath=safeOwnPath(data.watchPath,/^\/watch\/[A-Za-z0-9_-]+$/);if(watchPath){q('watch-link').href=watchPath;q('watch-link').hidden=false;}
        page.classList.add('creator-is-live');state.lastBreakAt=performance.now();message('live-state','Broadcast connection prepared');message('live-message','Your live connection is ready. Open the member watch page to verify audience playback.');
      }catch(error){var ended=await stopLive(true);if(ended!==false)message('live-message',error.message||'The live session could not be started.');}
      finally{state.busy=false;updateControls();adoptPendingCleanup();}
    }
    on(page,'click',function(event){var button=event.target.closest('[data-creator-action]');if(!button||!page.contains(button))return;var action=button.dataset.creatorAction;if(action==='refresh')refresh();else if(action==='preview-ad')startBreak(true);else if(action==='end-ad')finishBreak();else if(action==='share')share(false);else if(action==='download')share(true);else if(action==='save-recording')saveRecording();else if(action==='publish-members')publishMembers();else if(action==='publish-youtube')publishYoutube();else if(action==='go-live')goLive();else if(action==='stop-live')stopLive(false);else if(action==='disconnect-youtube'){api('/api/studio/oauth/youtube/disconnect',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(function(){message('connection-message','Channel disconnected.');refresh();}).catch(function(error){message('connection-message',error.message);});}});
    on(q('ads-enabled'),'change',function(){state.preferences.enabled=q('ads-enabled').checked;if(!state.preferences.enabled)finishBreak();savePreferences(state.preferences);message('ad-status',state.preferences.enabled?'Automatic breaks are enabled for your on-platform live output.':'Automatic breaks are off.');});
    on(q('break-minutes'),'change',function(){state.preferences.minutes=Number(q('break-minutes').value);savePreferences(state.preferences);});
    on(q('break-seconds'),'change',function(){state.preferences.seconds=Number(q('break-seconds').value);savePreferences(state.preferences);});
    on(q('live-rights'),'change',updateControls);on(q('publish-confirm'),'change',updateControls);on(q('member-publish-confirm'),'change',updateControls);
    on(document,'studio:recording-ready',function(){state.uploaded=null;q('recording-watch').hidden=true;q('publish-confirm').checked=false;q('member-publish-confirm').checked=false;updateControls();});
    on(document,'studio:cleanup-pending',adoptPendingCleanup);
    on(document,'visibilitychange',function(){if(document.hidden&&state.room)stopLive(true);});
    on(window,'pagehide',function(){stopLive(true);});
    state.dispose=function(){if(!state.alive)return;state.alive=false;clearMembershipTimer();state.events.abort();state.controllers.forEach(function(c){c.abort();});state.controllers.clear();stopLive(true);clearInterval(state.breakTimer);state.break=null;window.VoraleafAudio?.setDucking(false);};
    adoptPendingCleanup();refresh();updateControls();return state.dispose;
  }
  async function stopRemoteRoom(id){
    if(typeof id!=='string'||!/^[A-Za-z0-9_-]+$/.test(id))return {ok:false,status:400};
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);
    try{var response=await fetch('/api/studio/live/'+encodeURIComponent(id)+'/stop',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store',keepalive:true,signal:controller.signal});if(!response.ok)return {ok:false,status:response.status};if(!/json/i.test(response.headers.get('content-type')||''))return {ok:false,status:502};var data=await response.json();return {ok:data.stopped===true,status:data.stopped===true?200:502};}catch(_){return {ok:false,status:0};}finally{clearTimeout(timer);}
  }
  async function postSDP(url,sdp,state){var controller=new AbortController();state.protocolController=controller;state.controllers?.add(controller);var timer=setTimeout(function(){controller.abort();},15000);try{return await fetch(url,{method:'POST',headers:{'Content-Type':'application/sdp'},body:sdp,cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);state.controllers?.delete(controller);if(state.protocolController===controller)state.protocolController=null;}}
  function gather(peer) {return new Promise(function(resolve){if(peer.iceGatheringState==='complete'){resolve();return;}var timer=setTimeout(done,4000);function done(){clearTimeout(timer);peer.removeEventListener('icegatheringstatechange',changed);resolve();}function changed(){if(peer.iceGatheringState==='complete')done();}peer.addEventListener('icegatheringstatechange',changed);});}
  function drawAdFrame(context,width,height,now){
    var state=active;if(!state||!state.alive||state.watch)return false;now=Number.isFinite(now)&&now<1e10?now:performance.now();
    if(!state.break&&state.broadcasting&&state.preferences.enabled&&now-state.lastBreakAt>=state.preferences.minutes*60000)state.startBreak(false);
    var ad=state.break;if(!ad)return false;if(now>=ad.end){state.finishBreak();return false;}
    var e=ad.edition,pad=Math.min(width,height)*.055;context.save();context.fillStyle=e.colour;context.fillRect(0,0,width,height);
    var gradient=context.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'rgba(255,245,217,.07)');gradient.addColorStop(1,'rgba(0,0,0,.3)');context.fillStyle=gradient;context.fillRect(0,0,width,height);
    context.strokeStyle='rgba(218,194,148,.55)';context.lineWidth=Math.max(1,width/900);context.strokeRect(pad,pad,width-pad*2,height-pad*2);
    var portrait=height>width;var image=state.images[e.id];var imageH=portrait?height*.35:height*.66,imageW=imageH*110/150,imageX=portrait?(width-imageW)/2:width*.11,imageY=portrait?height*.15:(height-imageH)/2;
    if(image&&image.complete&&image.naturalWidth)context.drawImage(image,imageX,imageY,imageW,imageH);
    var textX=portrait?width/2:width*.47,textY=portrait?height*.57:height*.29;context.textAlign=portrait?'center':'left';context.fillStyle='#e2cda3';context.font=Math.round(width*(portrait?.027:.012))+'px Arial';context.fillText('ADVERTISEMENT · VORALEAF',textX,portrait?height*.10:height*.21);
    context.fillStyle='#fcf5e5';context.font=Math.round(width*(portrait?.075:.048))+'px Georgia';context.fillText('VORALEAF',textX,textY);context.font=Math.round(width*(portrait?.052:.03))+'px Georgia';context.fillText(e.name,textX,textY+height*.085);
    context.font=Math.round(width*(portrait?.029:.016))+'px Arial';context.fillText('ROOTS HERBAL COFFEE',textX,textY+height*.15);context.font=Math.round(width*(portrait?.038:.022))+'px Georgia';context.fillText(portrait?'Make room for your moment.':e.line,textX,textY+height*.235);
    context.font=Math.round(width*(portrait?.027:.014))+'px Arial';context.fillStyle='#e2cda3';context.fillText('Explore the collection at VORALEAF',textX,textY+height*.32);context.font=Math.round(width*(portrait?.02:.009))+'px Arial';context.fillText('Collection preview · final product details to follow',textX,portrait?height*.94:height*.86);context.restore();return true;
  }
  function cleanup(){if(active){active.dispose?.();active=null;}}
  function renderWatch(path){var match=/^\/watch\/([A-Za-z0-9_-]+)\/?$/.exec(path||location.pathname),returnPath=match?'/watch/'+match[1]:'/studio';return '<section class="creator-watch-page section-shell" data-voraleaf-watch="'+esc(match?match[1]:'')+'"><div class="breadcrumb"><a href="/" data-link>Home</a><span>/</span><span>The member room</span></div><p class="eyebrow">A VORALEAF MEMBER MOMENT</p><h1 data-creator-watch="title">A little room<br>to watch.</h1><p data-creator-watch="status" role="status">Checking access to this member session…</p><div class="creator-watch-player"><video controls playsinline data-creator-watch="video" aria-label="VORALEAF member video"></video><div data-creator-watch="placeholder"><span aria-hidden="true">▷</span><p>Your member session appears here.</p></div></div><button class="button" data-creator-watch="join" hidden>Join the live session ↗</button><a class="button" data-creator-watch="sign-in" href="/signin-with-chatgpt?return_to='+encodeURIComponent(returnPath)+'" hidden>Sign in to watch ↗</a><p class="creator-watch-fine">Member access is verified on the server. Video and audio load when you choose to join. Advertisements, where enabled by the creator, are clearly labelled. Member-created recordings are not independently reviewed by VORALEAF. Access changes may not immediately disconnect a viewer who is already connected.</p><a class="text-link" href="/studio" data-link>Back to the creator studio ↗</a></section>';}
  function mountWatch(root){
    cleanup();root=root||document;var page=root.querySelector('[data-voraleaf-watch]');if(!page)return;
    var state={alive:true,watch:true,peer:null,session:null,stream:null,controller:new AbortController()};active=state;var video=page.querySelector('[data-creator-watch="video"]'),status=page.querySelector('[data-creator-watch="status"]'),join=page.querySelector('[data-creator-watch="join"]'),placeholder=page.querySelector('[data-creator-watch="placeholder"]'),signIn=page.querySelector('[data-creator-watch="sign-in"]');
    function tell(text){if(state.alive)status.textContent=text;}
    function accessError(response){var error=new Error(response.status===401?'Sign in to check your member access and watch this session.':'This session is available only to eligible VORALEAF members with access. Sign in with the account linked to your qualifying purchase or active paid plan.');error.status=response.status;return error;}
    function showFailure(error,fallback){if(!state.alive||error.name==='AbortError')return;if(error.status===401||error.status===403){join.hidden=true;signIn.hidden=false;signIn.textContent=error.status===401?'Sign in to watch ↗':'Sign in to check member access ↗';}tell(error.message||fallback);}
    state.dispose=function(){state.alive=false;state.controller.abort();if(state.protocolController)state.protocolController.abort();if(state.peer)state.peer.close();if(state.stream)state.stream.getTracks().forEach(function(t){t.stop();});video.pause();video.srcObject=null;video.removeAttribute('src');if(state.session)fetch(state.session,{method:'DELETE',cache:'no-store',keepalive:true}).catch(function(){});};
    (async function(){try{var id=page.dataset.voraleafWatch;if(!/^[A-Za-z0-9_-]+$/.test(id))throw new Error('This member session could not be found.');var response=await fetch('/api/studio/watch/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store',signal:state.controller.signal});if(response.status===401||response.status===403)throw accessError(response);if(!/json/i.test(response.headers.get('content-type')||''))throw new Error('The member video service is unavailable.');var data=await response.json();if(!response.ok)throw new Error(data.message||'This member session is not available to this account.');if(!state.alive)return;page.querySelector('[data-creator-watch="title"]').textContent=data.title||'A VORALEAF member moment';if(data.type==='recording'){var media=safeOwnPath(data.mediaPath,/^\/api\/studio\/assets\/[A-Za-z0-9_-]+\/media$/);if(!media)throw new Error('This recording is unavailable.');video.src=media;placeholder.hidden=true;tell('Your private member recording is ready. Press play when you are ready.');return;}var url=providerURL(data.whepUrl);if(data.type!=='live'||!url)throw new Error('This live session is not available right now.');join.hidden=false;tell('Your access is verified. Choose Join to load live video and audio.');join.onclick=async function(){join.disabled=true;try{var fresh=await fetch('/api/studio/watch/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store',signal:state.controller.signal});if(fresh.status===401||fresh.status===403)throw accessError(fresh);if(!/json/i.test(fresh.headers.get('content-type')||''))throw new Error('The member video service is unavailable.');var latest=await fresh.json();if(!fresh.ok)throw new Error(latest.message||'This member session is not available.');url=providerURL(latest.whepUrl);if(latest.type!=='live'||!url)throw new Error('This live session is no longer available.');if(!state.alive)return;var peer=new RTCPeerConnection();state.peer=peer;peer.addTransceiver('video',{direction:'recvonly'});peer.addTransceiver('audio',{direction:'recvonly'});var remote=new MediaStream();state.stream=remote;peer.ontrack=function(event){event.streams[0]?.getTracks().forEach(function(track){if(!remote.getTrackById(track.id))remote.addTrack(track);});if(!event.streams.length&&!remote.getTrackById(event.track.id))remote.addTrack(event.track);video.srcObject=remote;placeholder.hidden=true;video.play().catch(function(){tell('Live video is ready. Use the player’s play control to hear audio.');});};await peer.setLocalDescription(await peer.createOffer());await gather(peer);if(!state.alive){peer.close();return;}var answer=await postSDP(url,peer.localDescription.sdp,state);if(!answer.ok)throw new Error('The live player could not connect.');var location=answer.headers.get('location');if(location){var resource=new URL(location,url);if(resource.origin===new URL(url).origin)state.session=resource.href;}await peer.setRemoteDescription({type:'answer',sdp:await answer.text()});if(state.alive){join.hidden=true;tell('Connected to the member room. Playback availability depends on the creator’s live connection.');}}catch(error){if(state.peer)state.peer.close();if(state.stream)state.stream.getTracks().forEach(function(t){t.stop();});if(state.session){fetch(state.session,{method:'DELETE',cache:'no-store',keepalive:true}).catch(function(){});state.session=null;}showFailure(error,'The member live player could not connect.');join.disabled=false;}};}catch(error){showFailure(error,'This member session could not be opened.');}})();
  }
  window.VoraleafCreator={render:render,mount:mount,cleanup:cleanup,drawAdFrame:drawAdFrame,renderWatch:renderWatch,mountWatch:mountWatch,isEligible:function(){return !!(active&&active.alive&&!active.watch&&active.member?.authenticated===true&&active.member?.eligible===true);}};
}());
