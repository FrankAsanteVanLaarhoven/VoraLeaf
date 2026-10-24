(() => {
'use strict';
const {products,articles,scenes}=window.VORALEAF;
const packagingPhotos={
 bold:[['bold-opening.webp?rev=roots-r10','Open the illustrated envelope to reveal the sealed gold inner pouch.'],['sachets-triptych.webp?rev=roots-r10','The collection: separate paper envelopes and individually sealed inner pouches.'],['water-pouring.webp?rev=roots-r10','BOLD preparation concept: an opened inner pouch beside the cup as water is poured.']],
 ember:[['ember-in-hand.webp?rev=roots-r10','EMBER: an oxblood paper envelope and a separate sealed gold inner pouch.'],['sachets-triptych.webp?rev=roots-r10','BOLD and EMBER have gold inner pouches; BLOOM has a rose-gold inner pouch.']],
 bloom:[['bloom-in-hand.webp?rev=roots-r10','BLOOM: an open illustrated paper envelope and a separate rose-gold inner pouch.'],['sachets-triptych.webp?rev=roots-r10','The three editions, each with its own paper envelope and sealed inner pouch.']]
};
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const storedBag=read('voraleaf-bag',[]),storedSaved=read('voraleaf-saved',[]);
const main=$('#main'); let bag=(Array.isArray(storedBag)?storedBag:[]).filter(i=>i&&products.some(p=>p.id===i.id)&&['6x15g','10x10g'].includes(i.format)&&Number.isFinite(Number(i.qty))).map(i=>({id:i.id,format:i.format,qty:Math.max(1,Math.min(99,Math.floor(Number(i.qty))))})), saved=[...new Set((Array.isArray(storedSaved)?storedSaved:[]).filter(id=>articles.some(a=>a.id===id)))], format='6x15g', filter='All', query='', timerId=null, remaining=120, deferredInstall=null;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('Device storage is unavailable. Your changes will last for this visit.');return false}}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>t.classList.remove('visible'),3500)}
function updateBag(){ $('#bag-count').textContent=bag.reduce((n,i)=>n+i.qty,0);write('voraleaf-bag',bag)}
const arrow='<span aria-hidden="true">↗</span>';
function crumb(label){return `<div class="breadcrumb"><a href="/" data-link>Home</a><span>/</span><span>${label}</span></div>`}
function intro(eye,title,desc){return `<section class="page-intro">${crumb(title)}<span class="eyebrow">${eye}</span><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</section>`}
function pack(p,fmt='6x15g'){const quantity=fmt==='10x10g'?'10 × 10 g':'6 × 15 g';return `<div class="product-art pack-pair-art ${p.id}"><span class="edition-tag">${p.edition.toUpperCase()}</span><div class="pack-pair"><figure class="pack-view pack-view-closed"><div class="pack-view-stage"><div class="pack-box pack-box-closed"><img src="/assets/${p.id}-${fmt}.svg?rev=roots-r11" alt="${p.name} ${p.number} closed concept carton, ${quantity}" loading="lazy" width="110" height="150"></div></div><figcaption>Closed box</figcaption></figure><figure class="pack-view pack-view-open"><div class="pack-view-stage"><div class="pack-box pack-box-open"><img src="/assets/packaging/roots-${p.id}-${fmt}.webp?rev=roots-r11" alt="${p.name} ${p.number} open concept carton, ${quantity}, with individual paper envelopes and a separate ${p.pouch.toLowerCase()} inner pouch" loading="lazy" width="1254" height="1254"></div></div><figcaption>Inside the box</figcaption></figure></div><span class="pack-format-caption">${quantity} · Individually sealed servings</span><span class="art-num">${p.number}</span></div>`}
function galleryPhotos(p){const quantity=format==='10x10g'?'10 × 10 g':'6 × 15 g';return [[`/assets/${p.id}-${format}.svg?rev=roots-r11`,`${p.name}: proposed ${quantity} closed carton.`],[`/assets/packaging/roots-${p.id}-${format}.webp?rev=roots-r11`,`${p.name}: proposed ${quantity} open carton, individual paper envelopes and a separate ${p.pouch.toLowerCase()} inner pouch.`],...packagingPhotos[p.id].map(([file,caption])=>[`/assets/packaging/${file}`,caption])]}
function productGallery(p){const photos=galleryPhotos(p);return `<div class="product-photo-gallery" data-gallery="${p.id}"><span class="eyebrow">THE BOX & EVERY LITTLE DETAIL</span><a class="gallery-full" href="${photos[0][0]}" target="_blank" rel="noopener noreferrer"><img class="gallery-main" src="${photos[0][0]}" alt="${photos[0][1]}" width="1536" height="1024" loading="lazy"></a><p class="gallery-caption">${photos[0][1]}</p><div class="gallery-thumbs" role="group" aria-label="Choose ${p.name} product photographs">${photos.map(([file,caption],index)=>`<button class="gallery-thumb ${index===0?'active':''}" type="button" data-photo="${index}" aria-label="${caption}" aria-pressed="${index===0}"><img src="${file}" alt="" width="180" height="120" loading="lazy"></button>`).join('')}</div><p class="status-note">Closed-box and open-box artwork match the selected format. Other close-ups show 15 g servings. Final packaging and preparation directions are subject to supplier confirmation.</p></div>`}
function productCard(p){return `<article class="product-card"><a data-link href="/products/${p.id}" aria-label="Explore ${p.name} ${p.number}">${pack(p)}</a><div class="product-meta"><div><a data-link href="/products/${p.id}"><h3>${p.name}<span>${p.number}</span></h3></a><p>${p.edition} · Roots herbal coffee</p></div><a class="round-link" data-link href="/products/${p.id}" aria-label="Explore ${p.name}">↗</a></div></article>`}
function articleCard(a){return `<article class="story"><a data-link href="/journal/${a.id}" tabindex="-1" aria-hidden="true"><div class="story-image"><img src="/assets/${a.image}?rev=roots-r10" alt="${a.image==='move.webp'?'Woman relaxing after gentle movement in a sunlit studio':a.image==='together.webp'?'A couple sharing coffee on a sunlit terrace':a.image==='collection.webp'?'The three VORALEAF concept coffee editions':a.image==='focus.webp'?'A man taking a coffee pause at a home desk':a.image==='strength.webp'?'A man in a bright gym between sets':'Coffee pouring into a forest-green ceramic cup'}" loading="lazy" width="600" height="400"></div></a><p class="category">${a.category} · ${a.minutes} MIN READ</p><h3><a data-link href="/journal/${a.id}">${a.title}</a></h3><p class="story-summary">${a.summary}</p><div class="readline"><a data-link href="/journal/${a.id}">Read the story ↗</a><button class="text-button save-story ${saved.includes(a.id)?'saved-indicator':''}" data-id="${a.id}" aria-label="${saved.includes(a.id)?'Unsave':'Save'} ${a.title}">${saved.includes(a.id)?'Saved ✓':'Save +'}</button></div></article>`}
function home(){return `<section class="hero"><div class="hero-media"><video id="hero-video" class="hero-bg-video" playsinline muted loop autoplay preload="metadata" poster="/assets/coffee-hero.webp" aria-label="VORALEAF coffee ritual video scenes in morning light"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video><img class="hero-bg" src="/assets/coffee-hero.webp" alt="A stream of coffee pouring into a forest-green ceramic cup in warm morning light" width="1672" height="941" fetchpriority="high"></div><div class="hero-copy"><span class="eyebrow">ROOTS HERBAL COFFEE · A NEW DAILY RITUAL</span><h1>Make room<br>for <em>your</em><br>moment.</h1><p class="hero-description">Three distinctive coffee editions.<br>A world of little rituals. A moment that’s yours.</p><div class="hero-actions"><a class="button" href="/collection" data-link>Explore the collection ${arrow}</a><button class="watch-button" id="play-film"><span class="play-disc">▶</span>Watch the ritual</button></div></div><div class="hero-scene-bar" role="toolbar" aria-label="Coffee ritual video scenes"><div class="hero-scene-info"><span class="hero-scene-tag" id="hero-scene-tag">SCENE 01 / 07</span><span class="hero-scene-name" id="hero-scene-name">${scenes[0].title}</span><span class="hero-scene-time" id="hero-scene-time">00:00 / 00:24</span></div><div class="hero-scene-pills" role="tablist" aria-label="Jump to coffee ritual scene">${scenes.map((s,i)=>`<button type="button" class="hero-scene-pill ${i===0?'active':''}" data-scene-idx="${i}" aria-label="Jump to ${s.num} ${s.title}" aria-pressed="${i===0}"><span class="scene-num">${s.num}</span><span class="scene-label">${s.title}</span></button>`).join('')}</div><div class="hero-scene-actions"><button type="button" class="hero-ctrl-btn" id="hero-video-toggle" aria-label="Pause background video" aria-pressed="false"><span aria-hidden="true">⏸</span> <span>Pause</span></button><button type="button" class="hero-ctrl-btn" id="hero-sound-toggle" aria-label="Toggle ambient ritual soundtrack" aria-pressed="false"><span aria-hidden="true">♪</span> <span>Soundtrack</span></button></div></div><div class="hero-caption"><span>INSTANT COFFEE WITH BOTANICALS</span><span>AN ORIGINAL VORALEAF VISUAL STORY · 01 / 07 SCENES</span></div></section>
<div class="feature-strip"><span><i>✧</i> Individually sealed servings</span><span><i>❧</i> Botanical-inspired design</span><span><i>◇</i> Three distinctive editions</span><span><i>↗</i> Rituals for wherever life takes you</span></div>
<section class="section-shell"><div class="section-head"><div><span class="eyebrow">THE COLLECTION</span><h2>Find your kind of coffee.</h2></div><a class="text-link" href="/collection" data-link>Meet the editions ↗</a></div><div class="collection-grid">${products.map(productCard).join('')}</div><p class="collection-note">Meet the proposed VORALEAF collection. Final ingredients, certifications, prices and availability will be confirmed before orders open.</p></section>
<section class="section-shell pack-story"><div class="pack-story-stage"><div class="pack-story-media"><video id="pack-scene-video" class="pack-scene-video" playsinline muted loop preload="none" poster="/assets/packaging/sachets-triptych.webp?rev=roots-r10"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video><img id="pack-scene-img" src="/assets/packaging/sachets-triptych.webp?rev=roots-r10" alt="Three VORALEAF paper envelopes with separate gold and rose-gold inner sachets" width="1536" height="1024" loading="lazy"><div class="pack-scene-overlay"><span class="pack-scene-badge" id="pack-scene-badge">SCENE 02 · 00:03 - 00:06</span><button type="button" class="pack-scene-play-btn" id="pack-scene-toggle" aria-label="Play sachet reveal scene"><span class="play-disc" aria-hidden="true">▶</span><span class="pack-play-label">Watch the reveal</span></button></div></div><div class="pack-scene-selector" role="tablist" aria-label="Select packaging ritual scene"><button type="button" class="pack-tab active" data-pack-tab="still" aria-pressed="true">Still Photography</button><button type="button" class="pack-tab" data-pack-tab="sachet" data-seek="3" aria-pressed="false">Scene 02 · Sachet Reveal</button><button type="button" class="pack-tab" data-pack-tab="pour" data-seek="9" aria-pressed="false">Scene 04 · Water Pour</button></div></div><div><span class="eyebrow">THE TWO-PART SERVING PACK</span><h2>A little reveal.<br>A moment to savour.</h2><p>Open the illustrated paper envelope to find your individually sealed inner pouch. Gold for BOLD and EMBER. Rose gold for BLOOM.</p><p>Explore close-ups, packaging specifications and the tactile motion study of the ritual unfolding.</p><a class="text-link" href="/collection" data-link>Take a closer look ↗</a><p class="status-note" style="margin-top:20px">15 g packaging concepts shown. Final pack and preparation details to be confirmed.</p></div></section>
<section class="editorial-split"><div class="editorial-photo"><img src="/assets/together.webp" alt="A relaxed couple enjoying coffee and a conversation on a coastal terrace" loading="lazy" width="768" height="650"></div><div class="editorial-copy"><span class="eyebrow">MORE THAN A COFFEE MOMENT</span><h2>A little pause.<br>A little presence.<br>A little <em>you.</em></h2><p>For quiet mornings, conversations that linger and the moments between everything else. Make your everyday ritual feel a little more yours.</p><a class="text-link" href="/journal/time-together" data-link>Find inspiration in the journal ↗</a><div class="ritual-line"><span>01</span> Open. Pour. Make it yours.</div></div></section>
<section class="section-shell"><div class="section-head"><div><span class="eyebrow">THE VORALEAF JOURNAL</span><h2>Stories to come back to.</h2></div><a class="text-link" href="/journal" data-link>Explore the journal ↗</a></div><div class="journal-grid">${[articles[0],articles[1],articles[2]].map(articleCard).join('')}</div></section>
<div class="marquee">ROOTED IN RITUAL. <span>Made for your moment.</span> VORALEAF.</div>
<section class="section-shell movement-feature"><img src="/assets/move.webp" alt="A woman enjoying a relaxed moment in a light-filled movement studio" loading="lazy" width="600" height="600"><div><span class="eyebrow">MOVE & UNWIND</span><h2>Life moves.<br>Find your rhythm.</h2><p>A little movement. A change of scene. A moment to enjoy being here. Explore ideas for your own everyday, at your own pace.</p><a class="button outline" href="/fitness" data-link>Explore gym & exercises ${arrow}</a></div></section>
<section class="creator-banner"><div><span class="eyebrow">THE CREATOR STUDIO</span><h2>Your ritual.<br>Your story.</h2><p>Record your next coffee story, find its soundtrack or rehearse your words. Verified customers can also share with members and go live when publishing services are available.</p><a class="text-link" href="/studio" data-link>Step into the studio ↗</a></div><div class="creator-visual" aria-hidden="true"><div class="phone-mock"></div><span class="studio-caption">OPEN.<br>CREATE.<br>MAKE IT YOURS.</span></div></section>
<section class="newsletter"><div><span class="eyebrow">A MOMENT THAT FITS YOU</span><h2>Where will your ritual take you?</h2><p>Find an edition by its visual character and the moments you love.</p></div><button class="button" id="open-finder">Find my ritual ${arrow}</button></section>`}
function collection(){return `${intro('ROOTS HERBAL COFFEE','The collection.','Three visual characters. Two serving formats. Find the presentation that feels like you, then explore the details.')}<section class="section-shell collection-page"><div class="filters" aria-label="Filter editions">${['All','Men’s edition','Women’s edition'].map(x=>`<button class="filter product-filter ${filter===x?'active':''}" data-filter="${x}" aria-pressed="${filter===x}">${x==='All'?'All editions':x}</button>`).join('')}</div><div class="collection-grid">${products.filter(p=>filter==='All'||p.edition===filter).map(productCard).join('')}</div><p class="collection-note">Proposed formats: 6 × 15 g (90 g) or 10 × 10 g (100 g). Collection preview; final product and supply details will be confirmed before orders open.</p></section><section class="newsletter"><div><h2>Need a little direction?</h2><p>Let your favourite colours and occasions lead the way.</p></div><button class="button" id="open-finder">Find my ritual ${arrow}</button></section>`}
function product(id){const p=products.find(x=>x.id===id);if(!p)return notFound();return `<section class="page-intro">${crumb(`<a data-link href="/collection">Collection</a> / ${p.name} ${p.number}`)}</section><section class="section-shell product-detail"><div class="product-visuals">${pack(p,format)}${productGallery(p)}</div><div class="product-copy"><span class="eyebrow">${p.edition.toUpperCase()} · ROOTS HERBAL COFFEE</span><h1>${p.name} <span>${p.number}</span></h1><p class="lead">${p.mood}</p><p class="description">${p.description}</p><span class="field-label">Choose your proposed pack format</span><div class="format-picker">${[['6x15g','6 × 15 g','90 g · six servings'],['10x10g','10 × 10 g','100 g · ten servings']].map(([v,l,s])=>`<button class="format-option ${format===v?'active':''}" data-format="${v}" aria-pressed="${format===v}">${l}<small>${s}</small></button>`).join('')}</div><button class="button add-to-bag" data-id="${p.id}">Add to enquiry bag ${arrow}</button><p class="status-note">Collection preview · pricing and launch date to follow.<br>Your bag requests information. No payment is taken.</p><div class="benefits-row"><span>◇ Individually sealed</span><span>❧ Illustrated envelope</span><span>✧ ${p.pouch} inner pouch</span></div><div class="details-list"><details open><summary>The two-part serving pack</summary><p>Each proposed serving has a sealed metallic-coloured food-contact inner pouch inside a separate printed paper envelope. ${p.pouch} inner sachets complement ${p.colour.toLowerCase()} presentation.</p></details><details><summary>Product information & preparation</summary><p>Final ingredients, allergens, nutrition, caffeine, sugar and serving directions are being confirmed. The edition name describes the presentation; it does not establish a sex-specific health effect. Read the final label before use.</p></details><details><summary>Certification & materials</summary><p>Product-specific Halal documents and permission for the approved certification mark are required before release. Organic status and component-specific disposal instructions remain unconfirmed. The quality badge is a brand design element.</p></details><details><summary>Availability & delivery</summary><p>VORALEAF is developing this collection. Retail prices, stock and UK delivery terms have not been set. Send an enquiry for updates or wholesale discussions: hello@voraleaf.com.</p></details></div><div class="product-ritual-scene" data-product="${p.id}"><div class="scene-header"><div><span class="eyebrow">${p.name} RITUAL · VIDEO SCENE PREVIEW</span><h3>The ${p.name} Serving Moment</h3></div><span class="edition-pouch-badge">${p.pouch} inner pouch</span></div><div class="product-video-card"><video class="product-video" playsinline muted loop preload="none" poster="/assets/packaging/roots-${p.id}-${format}.webp"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video><div class="product-video-controls"><button type="button" class="button small product-video-toggle" aria-label="Play ${p.name} ritual scene"><span aria-hidden="true">▶</span> Play ritual scene</button><div class="product-scene-cues"><button type="button" class="scene-cue-chip active" data-cue="3" aria-label="Step 1: Reveal sachet">1. Reveal sachet (03s)</button><button type="button" class="scene-cue-chip" data-cue="6" aria-label="Step 2: Dispense granules">2. Dispense (06s)</button><button type="button" class="scene-cue-chip" data-cue="9" aria-label="Step 3: Pour water">3. Water pour (09s)</button><button type="button" class="scene-cue-chip" data-cue="14" aria-label="Step 4: Slow stir">4. Slow stir (14s)</button></div></div><p class="scene-caption">${p.id==='bloom'?'BLOOM 03 pairs an ivory paper envelope with a distinctive ROSE GOLD metallic inner pouch. Watch the slow reveal, pour and stir.':p.name+' '+p.number+' pairs its botanical paper envelope with a sealed yellow-gold inner pouch. Watch the slow reveal, pour and stir.'}</p></div></div></div></section><section class="section-shell"><div class="section-head"><div><span class="eyebrow">EXPLORE THE REST OF THE COLLECTION</span><h2>A different kind of moment.</h2></div></div><div class="collection-grid">${products.filter(x=>x.id!==id).map(productCard).join('')}</div></section>`}
function journal(){const categories=['All','Rituals','Movement','Together','Design','Create','Saved'];let filtered=articles.filter(a=>(filter==='All'||(filter==='Saved'?saved.includes(a.id):a.category===filter))&&(`${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(query.toLowerCase())));return `${intro('THE JOURNAL','A world of little rituals.','Read, explore and save what speaks to you. Coffee stories, design details and everyday inspiration — at your own pace.')}<section class="section-shell journal-library"><label class="field-label" for="journal-search">Search stories</label><input class="search-field" id="journal-search" type="search" placeholder="Find a story, a ritual, a moment…" value="${safe(query)}"><div class="filters" aria-label="Filter stories">${categories.map(x=>`<button class="filter journal-filter ${filter===x?'active':''}" data-filter="${x}" aria-pressed="${filter===x}">${x}${x==='Saved'?` (${saved.length})`:''}</button>`).join('')}</div><div class="journal-grid" id="journal-results">${filtered.length?filtered.map(articleCard).join(''):'<p class="empty-state">No stories here yet. Try another search or save a story to read later.</p>'}</div></section>`}
function articleVideo(id){
 if(id==='inside-the-envelope'){
  return `<figure class="editorial-video-figure"><div class="video-container"><video class="editorial-video" playsinline muted loop preload="none" poster="/assets/packaging/bold-opening.webp"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video><button type="button" class="editorial-video-play" aria-label="Play packaging reveal video scene"><span class="play-disc" aria-hidden="true">▶</span> Watch scene 02: The Reveal</button></div><figcaption><strong>SCENE 02 · THE TWO-PART SERVING PACK (00:03 – 00:06)</strong><p>Adult hands lifting the illustrated paper flap to draw out the individually sealed metallic pouch. Gold for BOLD and EMBER; rose gold for BLOOM.</p></figcaption></figure>`;
 }
 if(id==='a-desk-side-pause'){
  return `<figure class="editorial-video-figure"><div class="video-container"><video class="editorial-video" playsinline muted loop preload="none" poster="/assets/coffee-hero.webp"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video><button type="button" class="editorial-video-play" aria-label="Play water pour and stir video scene"><span class="play-disc" aria-hidden="true">▶</span> Watch scene 04 &amp; 05: The Pour</button></div><figcaption><strong>SCENE 04 &amp; 05 · THE WATER POUR &amp; STIR (00:09 – 00:18)</strong><p>A continuous stream of hot water from a brass kettle into the ceramic cup, blooming the coffee with gentle swirling steam, followed by a slow, thoughtful stir.</p></figcaption></figure>`;
 }
 return '';
}
function article(id){const a=articles.find(x=>x.id===id);if(!a)return notFound();return `<article class="article-shell">${crumb(`<a href="/journal" data-link>Journal</a> / ${a.category}`)}<span class="eyebrow">${a.category} · ${a.minutes} MIN READ · VORALEAF EDITORIAL</span><h1>${a.title}</h1><p class="article-lead">${a.lead}</p><img class="article-image" src="/assets/${a.image}?rev=roots-r10" alt="${safe(a.summary)}" width="900" height="560"><div class="article-body">${a.body.map(([h,p])=>`<h2>${h}</h2><p>${p}</p>`).join('')}${articleVideo(id)}</div><div class="article-actions"><button class="save-story text-button" data-id="${id}">${saved.includes(id)?'Saved ✓':'Save this story +'}</button><button class="share-story text-button" data-id="${id}">Share story ↗</button><a href="/journal" data-link class="text-link">Back to the journal</a></div></article><section class="section-shell"><div class="section-head"><h2>Stay a little longer.</h2></div><div class="journal-grid">${articles.filter(x=>x.id!==id).slice(0,3).map(articleCard).join('')}</div></section>`}
function movement(){return `${intro('MOVE & UNWIND','Find your own rhythm.','Ideas for a change of scene, a little movement and time to enjoy the everyday. This is lifestyle inspiration, separate from product benefits.')}<section class="section-shell movement-feature" style="padding-top:10px"><img src="/assets/strength.webp" alt="A man taking a comfortable pause between sets in a sunlit gym" width="600" height="550"><div><span class="eyebrow">A LITTLE SPACE FOR YOU</span><h2>Start with<br>what you enjoy.</h2><p>A walk. Your favourite class. A quiet corner. There are many ways to make space in your day. Let your interests lead, and choose activities that suit your circumstances.</p><a class="button outline" href="/journal/move-at-your-pace" data-link>Read the movement story ${arrow}</a></div></section><section class="section-shell" style="padding-top:0"><div class="movement-cards">${[['01','A change of scene','Take your moment somewhere new: a nearby garden, a light-filled room or a familiar path.','/journal/a-desk-side-pause'],['02','Movement you enjoy','Explore your own pace. Plan a routine with qualified guidance if you need a programme suited to you.','/journal/move-at-your-pace'],['03','A shared moment','Set a table for two, make time for a conversation and leave the to-do list for a little later.','/journal/time-together']].map(([n,h,p,url])=>`<article class="movement-card"><span class="number">${n}</span><h3>${h}</h3><p>${p}</p><a data-link class="text-link" href="${url}">Explore the story ↗</a></article>`).join('')}</div><p><a class="button outline" href="/fitness" data-link>Explore the interactive exercise library ${arrow}</a></p><div class="timer" id="movement-timer"><div class="timer-video-backdrop" aria-hidden="true"><video id="timer-bg-video" playsinline muted loop preload="none" poster="/assets/coffee-hero.webp"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video></div><div class="timer-content" style="position:relative;z-index:2"><span class="eyebrow">THE QUIET CORNER · MINDFUL PAUSE</span><h3>Two minutes. Just for you.</h3><p>A simple pause timer accompanied by calming coffee ritual visuals. Make it yours.</p><div class="timer-modes"><label class="timer-mode-check"><input type="checkbox" id="timer-visual-toggle"> Soothing ritual video</label><label class="timer-mode-check"><input type="checkbox" id="timer-audio-toggle"> Ambient track (Meadow)</label></div></div><span class="timer-clock" id="timer-clock" role="timer" style="position:relative;z-index:2">02:00</span><div style="position:relative;z-index:2"><button class="button light" id="timer-toggle">Start my pause</button><button class="text-button" id="timer-reset" style="color:var(--cream);display:block;margin-top:15px">Reset</button></div></div><p class="collection-note">Persistent tiredness or unusual breathlessness deserves appropriate medical advice. Coffee is not a treatment for these symptoms.</p></section>`}
function bagPage(){return `${intro('YOUR COLLECTION','Your enquiry bag.','Bring your favourite editions together. Send a question or request launch and wholesale information.')}<section class="section-shell bag-layout">${bag.length?`<div>${bag.map(i=>{const p=products.find(p=>p.id===i.id);return `<div class="bag-item"><img src="/assets/${p.id}-${i.format}.svg?rev=roots-r10" alt="${p.name} concept carton"><div><h3>${p.name} ${p.number}</h3><p>${p.edition} · ${i.format==='6x15g'?'6 × 15 g / 90 g':'10 × 10 g / 100 g'}</p><div class="quantity"><button class="qty" data-key="${i.id}-${i.format}" data-delta="-1" aria-label="Decrease ${p.name} quantity">−</button><span>${i.qty}</span><button class="qty" data-key="${i.id}-${i.format}" data-delta="1" aria-label="Increase ${p.name} quantity">+</button></div><button class="remove-item" data-key="${i.id}-${i.format}">Remove</button></div><span class="status-note">Price TBC</span></div>`}).join('')}</div><aside class="bag-summary"><span class="eyebrow">LET’S START A CONVERSATION</span><h2>A little more information.</h2><p>We’ll help with your selected editions, availability and wholesale questions. This is an enquiry, not an order.</p><label for="enquiry-note" class="field-label">Anything you’d like us to know?</label><textarea id="enquiry-note" rows="4" style="width:100%;padding:12px;border:1px solid #aab69b;background:var(--cream)" placeholder="I’m interested in…"></textarea><button class="button" id="email-enquiry">Prepare email enquiry ${arrow}</button><button class="button outline" id="download-enquiry">Download enquiry</button><p style="margin:20px 0 0;font-size:10px">Review your draft inside VORALEAF, then copy it or choose your email app. Nothing is sent automatically and no payment is taken.</p></aside>`:`<div class="empty-state"><h2>A little room for your favourites.</h2><p>Explore the editions and add one to begin your enquiry.</p><a class="button" href="/collection" data-link>Explore the collection ${arrow}</a></div>`}</section>`}
function contact(){return `${intro('SAY HELLO','Let’s make a connection.','For collection updates, wholesale conversations, creator enquiries or a simple hello.')}<section class="section-shell contact-grid"><div><h2>A little conversation<br>starts here.</h2><p>VORALEAF<br>294 Coldharbour Lane<br>London, SW9 8SE<br>United Kingdom</p><a class="button" href="mailto:hello@voraleaf.com">hello@voraleaf.com ${arrow}</a><p style="margin-top:25px">Telephone / WhatsApp Business<br><a href="tel:+447463326519">+44 7463 326519</a><br><a class="text-link" href="https://wa.me/447463326519" target="_blank" rel="noopener noreferrer">Start a WhatsApp conversation ↗</a></p></div><div><span class="eyebrow">THE RIGHT PLACE FOR YOUR QUESTION</span><dl class="contact-list"><dt>General & company</dt><dd><a href="mailto:hello@voraleaf.com">hello@voraleaf.com</a></dd><dt>Business & wholesale</dt><dd><a href="mailto:info@voraleaf.com">info@voraleaf.com</a></dd><dt>Customer care</dt><dd><a href="mailto:support@voraleaf.com">support@voraleaf.com</a></dd><dt>Men’s editions</dt><dd><a href="mailto:men@voraleaf.com">men@voraleaf.com</a></dd><dt>Women’s edition</dt><dd><a href="mailto:women@voraleaf.com">women@voraleaf.com</a></dd></dl><p>For product questions, include the edition and proposed format. We’ll confirm the details relevant to your enquiry.</p></div></section>`}
function about(){return `${intro('OUR WORLD','Rooted in ritual.','VORALEAF brings botanical-inspired presentation to an instant coffee ritual, with illustrated paper envelopes and distinctive metallic inner sachets.')}<img src="/assets/collection.webp" class="full-image" alt="BOLD and EMBER with gold inner sachets; BLOOM with rose-gold inner sachets" width="1600" height="1067"><section class="prose"><h2>Objects with a little presence.</h2><p>We believe everyday moments deserve thoughtful presentation. The collection explores three different visual characters: obsidian-black BOLD, oxblood EMBER and ivory-and-mulberry BLOOM. Each one starts a story before the cup reaches the table.</p><h2>A collection in development.</h2><p>The products shown are packaging and collection concepts. Final formulas, ingredients, allergens, nutrition, caffeine, directions, safety information, certification, prices and delivery terms will be confirmed before orders open. Product images are concept visualisations.</p><h2>Clear information matters.</h2><p>Men’s and women’s edition names describe our proposed positioning. They do not demonstrate sex-specific effects. We make no treatment, sexual-performance, weight-loss or hormone claims for these concepts. Halal and organic wording will require appropriate product-specific evidence and permissions.</p><h2>An original visual world.</h2><p>The editorial lifestyle images and coffee imagery on this preview were created with AI for VORALEAF. They depict illustrative scenes and are not customer testimonials, clinical evidence or filmed footage. The short motion study animates original stills. A future live-action film will follow a separate production plan.</p><h2>Make your moment yours.</h2><p>Explore the journal, save a story or try the private creator studio. When you’re ready to ask about the collection, <a data-link href="/contact">say hello</a>.</p></section>`}
function privacy(){return `${intro('GOOD TO KNOW','Your privacy. Your device.','A clear guide to how this collection preview works.')}<section class="prose"><h2>What stays on this device</h2><p>Your enquiry bag, saved story IDs, exercise-session selections, creator drafts, teleprompter text and preferences use browser storage on this device. Local drafts are not cloud-synced. Member-owned videos, social connection credentials and purchase entitlements use private server storage only when those services are configured. Social tokens are encrypted at rest and are never stored in browser preferences. The app cache stores site pages and imagery so previously visited content can work offline. Clearing your browser data removes local preferences and cached content; it does not delete server-stored member media or account connections.</p><h2>Camera and microphone</h2><p>The creator studio asks for camera and microphone access only when you press the camera button. Recording happens locally in your browser. Local recording stays on your device until you choose a sharing or publishing action. Member publishing and livestreams require server-verified purchase eligibility and configured services. You can download a clip to your device. Camera tracks stop when the studio closes or the tab is hidden.</p><h2>Contact links</h2><p>Email, telephone and WhatsApp links first open an in-app contact panel. You can copy the details or explicitly continue to the relevant service; no message is sent automatically. Those providers handle data under their own policies. The site has no newsletter database or analytics integration. The creator backend can verify qualifying payments through signed merchant webhooks once merchant credentials, product mappings and checkout identity binding are configured. Original instrumental tracks or your permission-confirmed local audio can accompany recordings. Supported music-service links load official players inside the VORALEAF source viewer after you choose to open them. Provider audio is separate personal listening and is not recorded or rebroadcast. Other external pages are requested inside the viewer; some providers block embedding. Required provider branding remains visible. Account consent uses the provider’s secure sign-in flow. In the exercise library, choosing a YouTube play control loads a third-party player. Live exercise or video search, when configured, sends your search and filter selections through our server to ExerciseDB or YouTube. These providers process those requests under their own policies. ExerciseDB data and media are excluded from the app cache.</p><h2>Hosting</h2><p>The hosting platform may process technical request information needed to serve the site. This preview is intended for owner review. A launch privacy notice will need to name the final business controller, processors, retention periods and rights process before additional services are connected.</p><h2>Clear local site data</h2><p>Use the button below to remove this app’s bag, saved stories and creator drafts from browser storage and clear the app cache. Files you already downloaded remain on your device.</p><button class="button outline" id="clear-data">Clear VORALEAF device data</button></section>`}
function notFound(){return `<div class="not-found"><span class="eyebrow">A LITTLE DETOUR</span><h1>This moment<br>is elsewhere.</h1><p>That page could not be found.</p><a class="button" href="/" data-link>Return home ${arrow}</a></div>`}
let heroAudio=null, timerAudio=null;
function cleanupMedia(){
 if(heroAudio){heroAudio.pause();heroAudio=null}
 if(timerAudio){timerAudio.pause();timerAudio=null}
 const fv=$('#ritual-film');if(fv)fv.pause();
 const fa=$('#cinema-audio');if(fa)fa.pause();
}
function render({keepScroll=false}={}){cleanupMedia();window.VoraleafCreator?.cleanup();window.VoraleafFitness?.cleanup();window.VoraleafStudio?.cleanup();window.VoraleafAudio?.cleanup();if(timerId){clearInterval(timerId);timerId=null}remaining=120;const path=location.pathname.replace(/\/$/,'')||'/';let html,title;
 if(path==='/'){html=home();title='Make room for your moment'}
 else if(path==='/collection'){html=collection();title='The collection'}
 else if(path.startsWith('/products/')){const id=path.split('/')[2];html=product(id);title=products.find(p=>p.id===id)?.name||'Edition'}
 else if(path==='/journal'){html=journal();title='The journal'}
 else if(path.startsWith('/journal/')){const id=path.split('/')[2];html=article(id);title=articles.find(a=>a.id===id)?.title||'Story'}
 else if(path==='/movement'){html=movement();title='Move & unwind'}
 else if(path==='/fitness'||path.startsWith('/fitness/')){html=window.VoraleafFitness.render(path);title='Gym & exercise library'}
 else if(path==='/studio'){html=window.VoraleafStudio.render();title='Creator studio'}
 else if(path.startsWith('/watch/')){html=window.VoraleafCreator.renderWatch(path);title='Member screening room'}
 else if(path==='/bag'){html=bagPage();title='Your enquiry bag'}
 else if(path==='/contact'){html=contact();title='Say hello'}
 else if(path==='/about'){html=about();title='Our world'}
 else if(path==='/privacy'){html=privacy();title='Your privacy'}
 else{html=notFound();title='Page not found'}
 main.innerHTML=html;document.title=`${title} — VORALEAF`;$('#mobile-nav').hidden=true;$('#menu-toggle').setAttribute('aria-expanded','false');if(!keepScroll)window.scrollTo(0,0);if(path==='/studio'){window.VoraleafStudio.mount(main);window.VoraleafAudio?.mount(main);window.VoraleafCreator?.mount(main)}if(path.startsWith('/watch/'))window.VoraleafCreator?.mountWatch(main);if(path==='/fitness'||path.startsWith('/fitness/'))window.VoraleafFitness.mount(main);bindPage();$$('.desktop-nav a').forEach(a=>{if(a.pathname===path)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}
function navigate(url){filter='All';query='';format='6x15g';history.pushState({},'',url);render();main.focus({preventScroll:true})}
document.addEventListener('click',e=>{if(e.defaultPrevented)return;const a=e.target.closest('a[data-link]');if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();$$('dialog[open]:not([data-voraleaf-viewer])').forEach(d=>d.close());navigate(a.getAttribute('href'))}});
window.addEventListener('popstate',()=>{filter='All';query='';render()});
function bindPage(){
 $$('.gallery-thumb').forEach(button=>button.onclick=()=>{const gallery=button.closest('[data-gallery]');const photos=galleryPhotos(products.find(p=>p.id===gallery.dataset.gallery));const selected=photos[Number(button.dataset.photo)];if(!selected)return;$('.gallery-main',gallery).src=selected[0];$('.gallery-main',gallery).alt=selected[1];$('.gallery-full',gallery).href=selected[0];$('.gallery-caption',gallery).textContent=selected[1];$$('.gallery-thumb',gallery).forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})});

 $$('#play-film').forEach(b=>b.onclick=()=>{$('#film-dialog').showModal();const f=$('#ritual-film');if(f){f.currentTime=0;f.play().catch(()=>{})}});
 $$('#open-finder').forEach(b=>b.onclick=()=>finder(0));

 // Hero video & scene pill controls
 const heroVid=$('#hero-video');
 const heroPlayBtn=$('#hero-video-toggle');
 const heroSoundBtn=$('#hero-sound-toggle');
 const heroPills=$$('.hero-scene-pill');
 const heroSceneTag=$('#hero-scene-tag');
 const heroSceneName=$('#hero-scene-name');
 const heroSceneTime=$('#hero-scene-time');
 if(heroVid){
  function fmt(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
  heroVid.ontimeupdate=()=>{
   const t=heroVid.currentTime;
   let idx=0;
   for(let i=0;i<scenes.length;i++){
    if(t>=scenes[i].start-0.25&&t<scenes[i].end){idx=i;break}
   }
   const cur=scenes[idx];
   if(heroSceneTag)heroSceneTag.textContent=`SCENE ${cur.num} / 07`;
   if(heroSceneName)heroSceneName.textContent=cur.title;
   if(heroSceneTime)heroSceneTime.textContent=`${fmt(t)} / 00:24`;
   heroPills.forEach((p,i)=>{
    const active=i===idx;
    p.classList.toggle('active',active);
    p.setAttribute('aria-pressed',String(active));
   });
  };
  if(heroPlayBtn){
   heroPlayBtn.onclick=()=>{
    if(heroVid.paused){
     heroVid.play().catch(()=>{});
     heroPlayBtn.innerHTML='<span aria-hidden="true">⏸</span> <span>Pause</span>';
     heroPlayBtn.setAttribute('aria-label','Pause background video');
     heroPlayBtn.setAttribute('aria-pressed','false');
    }else{
     heroVid.pause();
     heroPlayBtn.innerHTML='<span aria-hidden="true">▶</span> <span>Play</span>';
     heroPlayBtn.setAttribute('aria-label','Play background video');
     heroPlayBtn.setAttribute('aria-pressed','true');
    }
   };
  }
  if(heroSoundBtn){
   heroSoundBtn.onclick=()=>{
    if(!heroAudio){heroAudio=new Audio('/assets/audio/quiet-roots.mp3');heroAudio.loop=true}
    if(heroAudio.paused){
     heroAudio.play().then(()=>{
      heroSoundBtn.innerHTML='<span aria-hidden="true">♫</span> <span>Playing</span>';
      heroSoundBtn.setAttribute('aria-label','Mute ambient soundtrack');
      heroSoundBtn.setAttribute('aria-pressed','true');
     }).catch(()=>toast('Tap again to enable ambient sound.'));
    }else{
     heroAudio.pause();
     heroSoundBtn.innerHTML='<span aria-hidden="true">♪</span> <span>Soundtrack</span>';
     heroSoundBtn.setAttribute('aria-label','Toggle ambient ritual soundtrack');
     heroSoundBtn.setAttribute('aria-pressed','false');
    }
   };
  }
  heroPills.forEach(pill=>{
   pill.onclick=()=>{
    const idx=Number(pill.dataset.sceneIdx);
    const s=scenes[idx];
    if(!s)return;
    heroVid.currentTime=s.start;
    if(heroVid.paused)heroVid.play().catch(()=>{});
    heroPills.forEach((p,i)=>{const active=i===idx;p.classList.toggle('active',active);p.setAttribute('aria-pressed',String(active))});
    if(heroSceneTag)heroSceneTag.textContent=`SCENE ${s.num} / 07`;
    if(heroSceneName)heroSceneName.textContent=s.title;
   };
  });
 }

 // Pack story stage video & tab switcher
 const packVid=$('#pack-scene-video');
 const packImg=$('#pack-scene-img');
 const packBadge=$('#pack-scene-badge');
 const packToggle=$('#pack-scene-toggle');
 const packTabs=$$('.pack-tab');
 if(packVid){
  packTabs.forEach(tab=>{
   tab.onclick=()=>{
    const mode=tab.dataset.packTab;
    packTabs.forEach(t=>{const active=t===tab;t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active))});
    if(mode==='still'){
     packVid.style.opacity='0';
     packVid.pause();
     if(packImg)packImg.style.opacity='1';
     if(packBadge)packBadge.textContent='STILL PHOTOGRAPHY';
     if(packToggle)packToggle.style.display='none';
    }else{
     const seek=Number(tab.dataset.seek);
     if(packImg)packImg.style.opacity='0';
     packVid.style.opacity='1';
     packVid.currentTime=seek;
     packVid.play().catch(()=>{});
     if(packToggle){
      packToggle.style.display='inline-flex';
      const lbl=packToggle.querySelector('.pack-play-label');
      if(lbl)lbl.textContent='Pause';
     }
     if(packBadge)packBadge.textContent=seek===3?'SCENE 02 · 00:03 - 00:06':'SCENE 04 · 00:09 - 00:14';
    }
   };
  });
  if(packToggle){
   packToggle.onclick=()=>{
    const lbl=packToggle.querySelector('.pack-play-label');
    if(packVid.paused){
     packVid.play().catch(()=>{});
     if(lbl)lbl.textContent='Pause';
    }else{
     packVid.pause();
     if(lbl)lbl.textContent='Play';
    }
   };
  }
 }

 // Product detail ritual video & cue chips
 $$('.product-ritual-scene').forEach(sceneElem=>{
  const pVid=$('video',sceneElem);
  const pToggle=$('.product-video-toggle',sceneElem);
  const cues=$$('.scene-cue-chip',sceneElem);
  if(!pVid)return;
  if(pToggle){
   pToggle.onclick=()=>{
    if(pVid.paused){
     pVid.play().catch(()=>{});
     pToggle.innerHTML='<span aria-hidden="true">⏸</span> Pause ritual scene';
    }else{
     pVid.pause();
     pToggle.innerHTML='<span aria-hidden="true">▶</span> Play ritual scene';
    }
   };
  }
  cues.forEach(chip=>{
   chip.onclick=()=>{
    const cueTime=Number(chip.dataset.cue);
    pVid.currentTime=cueTime;
    pVid.play().catch(()=>{});
    if(pToggle)pToggle.innerHTML='<span aria-hidden="true">⏸</span> Pause ritual scene';
    cues.forEach(c=>{const active=c===chip;c.classList.toggle('active',active);c.setAttribute('aria-pressed',String(active))});
   };
  });
 });

 $$('.editorial-video-play').forEach(btn=>{
  btn.onclick=()=>{
   const fig=btn.closest('.editorial-video-figure');
   const vid=fig?.querySelector('video');
   if(!vid)return;
   if(vid.paused){
    vid.play().catch(()=>{});
    btn.innerHTML='<span class="play-disc" aria-hidden="true">❚❚</span> Pause scene';
    btn.setAttribute('aria-label','Pause scene');
   }else{
    vid.pause();
    btn.innerHTML='<span class="play-disc" aria-hidden="true">▶</span> Watch scene';
    btn.setAttribute('aria-label','Play scene');
   }
  };
 });

 const timerVid=$('#timer-bg-video');
 const timerVisCheck=$('#timer-visual-toggle');
 const timerAudCheck=$('#timer-audio-toggle');
 if(timerVisCheck&&timerVid){
  timerVisCheck.onchange=()=>{
   if(timerVisCheck.checked)timerVid.play().catch(()=>{});
   else timerVid.pause();
  };
 }
 if(timerAudCheck){
  timerAudCheck.onchange=()=>{
   if(timerAudCheck.checked){
    if(!timerAudio){timerAudio=new Audio('/assets/audio/meadow.mp3');timerAudio.loop=true}
    timerAudio.play().catch(()=>{timerAudCheck.checked=false;toast('Tap again to enable ambient sound.')});
   }else if(timerAudio){
    timerAudio.pause();
   }
  };
 }

 $$('.product-filter,.journal-filter').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;const y=window.scrollY;render({keepScroll:true});window.scrollTo(0,y);$$('.product-filter,.journal-filter').find(n=>n.dataset.filter===filter)?.focus({preventScroll:true})});
 $('#journal-search')?.addEventListener('input',e=>{query=e.target.value;const selected=articles.filter(a=>(filter==='All'||(filter==='Saved'?saved.includes(a.id):a.category===filter))&&(`${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(query.toLowerCase())));$('#journal-results').innerHTML=selected.length?selected.map(articleCard).join(''):'<p class="empty-state">No stories match that search. Try a different word.</p>';bindSaves()});
 $$('.format-option').forEach(b=>b.onclick=()=>{format=b.dataset.format;const y=scrollY;render({keepScroll:true});scrollTo(0,y);$$('.format-option').find(n=>n.dataset.format===format)?.focus({preventScroll:true})});
 $$('.add-to-bag').forEach(b=>b.onclick=()=>{const found=bag.find(i=>i.id===b.dataset.id&&i.format===format);if(found)found.qty=Math.min(found.qty+1,99);else bag.push({id:b.dataset.id,format,qty:1});updateBag();toast('Added to your enquiry bag. Explore more or open Bag.');b.textContent='Added to enquiry bag ✓'});
 $$('.qty').forEach(b=>b.onclick=()=>{const i=bag.find(i=>`${i.id}-${i.format}`===b.dataset.key);i.qty=Math.max(0,Math.min(99,i.qty+Number(b.dataset.delta)));bag=bag.filter(i=>i.qty);updateBag();render({keepScroll:true})});
 $$('.remove-item').forEach(b=>b.onclick=()=>{bag=bag.filter(i=>`${i.id}-${i.format}`!==b.dataset.key);updateBag();render({keepScroll:true})});
 $('#email-enquiry')?.addEventListener('click',()=>{const url='mailto:hello@voraleaf.com?subject='+encodeURIComponent('VORALEAF collection enquiry')+'&body='+encodeURIComponent(enquiryText());if(window.VoraleafViewer)window.VoraleafViewer.open({url,title:'Your collection enquiry'});else toast('The enquiry viewer is unavailable. Download your enquiry instead.');});
 $('#download-enquiry')?.addEventListener('click',()=>download(enquiryText(),'VORALEAF_Collection_Enquiry.txt'));
 $('#timer-toggle')?.addEventListener('click',()=>{
  if(timerId){
   clearInterval(timerId);timerId=null;$('#timer-toggle').textContent='Continue my pause';
  }else{
   if(remaining===0)remaining=120;
   $('#timer-toggle').textContent='Pause';
   if(timerVisCheck?.checked&&timerVid?.paused)timerVid.play().catch(()=>{});
   if(timerAudCheck?.checked&&timerAudio?.paused)timerAudio.play().catch(()=>{});
   timerId=setInterval(()=>{
    remaining--;
    $('#timer-clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
    if(remaining<=0){
     clearInterval(timerId);timerId=null;
     $('#timer-toggle').textContent='Begin another pause';
     toast('Your two minutes are yours. Take your time.');
    }
   },1000);
  }
 });
 $('#timer-reset')?.addEventListener('click',()=>{
  clearInterval(timerId);timerId=null;remaining=120;$('#timer-clock').textContent='02:00';$('#timer-toggle').textContent='Start my pause';
 });
 $('#clear-data')?.addEventListener('click',async()=>{Object.keys(localStorage).filter(k=>k.toLowerCase().includes('voraleaf')).forEach(k=>localStorage.removeItem(k));if('caches'in window)for(const k of await caches.keys())if(k.startsWith('voraleaf'))await caches.delete(k);bag=[];saved=[];$('#bag-count').textContent='0';toast('VORALEAF device data and app cache cleared.')});
 bindSaves();
 $$('.share-story').forEach(b=>b.onclick=async()=>{const a=articles.find(a=>a.id===b.dataset.id);try{if(navigator.share)await navigator.share({title:a.title,url:location.href});else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);toast('Story link copied.')}else toast('Copy the link from your address bar to share.')}catch(e){if(e.name!=='AbortError')toast('Copy the link from your address bar to share.')}});
}
function bindSaves(){ $$('.save-story').forEach(b=>b.onclick=()=>{const id=b.dataset.id;saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];write('voraleaf-saved',saved);$$(`.save-story[data-id="${id}"]`).forEach(btn=>{btn.textContent=saved.includes(id)?'Saved ✓':'Save +';btn.classList.toggle('saved-indicator',saved.includes(id));btn.setAttribute('aria-label',`${saved.includes(id)?'Unsave':'Save'} ${articles.find(a=>a.id===id)?.title}`)});toast(saved.includes(id)?'Story saved on this device. Find it in Journal → Saved.':'Story removed from saved.');if(filter==='Saved'&&location.pathname==='/journal')render({keepScroll:true})})}
function enquiryText(){return `Hello VORALEAF,\n\nI’d like more information about these proposed editions:\n\n${bag.map(i=>`${products.find(p=>p.id===i.id).name.toUpperCase()} ${i.format==='6x15g'?'6 × 15 g (90 g)':'10 × 10 g (100 g)'} — ${i.qty} box${i.qty>1?'es':''}`).join('\n')}\n\n${$('#enquiry-note')?.value||'Please share final product details, prices and availability when confirmed.'}\n\nThis is an enquiry, not an order.\n\nThank you.`}
function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function finder(step,chosen){const d=$('#ritual-dialog');if(!d.open)d.showModal();const c=$('#ritual-content');if(step===0){c.innerHTML='<span class="eyebrow">THE RITUAL FINDER · 01 / 02</span><h2>What does your<br>moment look like?</h2><div class="ritual-choices"><button data-mood="bold">A quiet morning. Deep greens, a little gold.</button><button data-mood="ember">A moment with presence. Rich, warm colours.</button><button data-mood="bloom">A little elegance. Soft tones and rose gold.</button></div><p class="status-note" style="margin-top:20px">A visual preference finder, not health or dietary advice.</p>';$$('[data-mood]',c).forEach(b=>b.onclick=()=>finder(1,b.dataset.mood))}else{const p=products.find(p=>p.id===chosen);c.innerHTML=`<span class="eyebrow">YOUR VISUAL MATCH · 02 / 02</span><h2>Your kind of moment:<br>${p.name} ${p.number}.</h2><p>${p.description}</p><p class="status-note">Your match reflects packaging preferences. Final ingredients and safety information must be reviewed before use.</p><a class="button" data-link href="/products/${p.id}">Explore ${p.name} ${arrow}</a><button class="text-button" id="finder-restart" style="margin:25px">Start again</button>`;$('#finder-restart').onclick=()=>finder(0)}}
$('#menu-toggle').onclick=()=>{const n=$('#mobile-nav');n.hidden=!n.hidden;n.style.top=`${$('.site-header').getBoundingClientRect().bottom}px`;$('#menu-toggle').setAttribute('aria-expanded',String(!n.hidden))};
$$('.search-open').forEach(b=>b.onclick=()=>{$('#search-dialog').showModal();globalResults('');$('#global-search').focus()});
function globalResults(q){const a=articles.filter(a=>(a.title+' '+a.category).toLowerCase().includes(q.toLowerCase())),p=products.filter(p=>(p.name+' '+p.edition+' coffee').toLowerCase().includes(q.toLowerCase()));$('#global-results').innerHTML=p.map(p=>`<a class="search-result" href="/products/${p.id}" data-link><small>The collection</small>${p.name} ${p.number} · ${p.edition}</a>`).join('')+a.map(a=>`<a class="search-result" href="/journal/${a.id}" data-link><small>The journal · ${a.category}</small>${a.title}</a>`).join('')||'<p style="padding-top:20px">No results yet. Try “coffee”, “ritual” or “movement”.</p>'}
$('#global-search').oninput=e=>globalResults(e.target.value);
function setupCinemaModal(){
 const film=$('#ritual-film');
 const playToggle=$('#cinema-play-toggle');
 const playLabel=$('#cinema-play-label');
 const scrubber=$('#cinema-scrubber');
 const timeDisplay=$('#cinema-time');
 const subtitles=$('#cinema-subtitles');
 const speedSelect=$('#cinema-speed');
 const soundtrackSelect=$('#cinema-soundtrack');
 const cinemaAudio=$('#cinema-audio');
 const chapterList=$('#cinema-chapter-list');
 if(!film)return;

 if(chapterList&&!chapterList.children.length){
  chapterList.innerHTML=scenes.map((s,i)=>`
   <button type="button" class="cinema-chapter-btn ${i===0?'active':''}" data-scene="${s.id}" data-start="${s.start}" aria-label="Play Scene ${s.num}: ${safe(s.title)}" aria-pressed="${i===0}">
    <span class="chap-num">${s.num}</span>
    <div class="chap-info">
     <strong>${safe(s.title)}</strong>
     <small>${s.subtitle}</small>
    </div>
   </button>
  `).join('');
 }
 const chapterBtns=$$('.cinema-chapter-btn');

 function fmt(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
 function syncChapter(t){
  let cur=scenes[0];
  for(const s of scenes){if(t>=s.start-0.25&&t<s.end){cur=s;break}}
  if(subtitles)subtitles.textContent=`SCENE ${cur.num} · ${cur.title} — ${cur.words}`;
  chapterBtns.forEach(btn=>{
   const active=btn.dataset.scene===cur.id;
   btn.classList.toggle('active',active);
   btn.setAttribute('aria-pressed',String(active));
  });
 }
 film.onloadedmetadata=()=>{if(scrubber)scrubber.max=String(Math.floor(film.duration||24))};
 film.ontimeupdate=()=>{
  if(scrubber&&!scrubber.matches(':active'))scrubber.value=String(film.currentTime);
  if(timeDisplay)timeDisplay.textContent=`${fmt(film.currentTime)} / ${fmt(film.duration||24)}`;
  syncChapter(film.currentTime);
 };
 film.onplay=()=>{
  if(playLabel)playLabel.textContent='Pause';
  if(playToggle){
   const disc=playToggle.querySelector('[aria-hidden]');
   if(disc)disc.textContent='❚❚';
   playToggle.setAttribute('aria-label','Pause ritual film');
  }
  if(soundtrackSelect&&soundtrackSelect.value!=='muted'&&cinemaAudio&&cinemaAudio.paused){
   cinemaAudio.play().catch(()=>{});
  }
 };
 film.onpause=()=>{
  if(playLabel)playLabel.textContent='Play';
  if(playToggle){
   const disc=playToggle.querySelector('[aria-hidden]');
   if(disc)disc.textContent='▶';
   playToggle.setAttribute('aria-label','Play ritual film');
  }
  if(cinemaAudio)cinemaAudio.pause();
 };
 if(playToggle){
  playToggle.onclick=()=>{if(film.paused)film.play().catch(()=>{});else film.pause()};
 }
 if(scrubber){
  scrubber.oninput=()=>{
   film.currentTime=Number(scrubber.value);
   if(timeDisplay)timeDisplay.textContent=`${fmt(film.currentTime)} / ${fmt(film.duration||24)}`;
   syncChapter(film.currentTime);
  };
 }
 if(speedSelect){speedSelect.onchange=()=>{film.playbackRate=Number(speedSelect.value)}}
 if(soundtrackSelect){
  soundtrackSelect.onchange=()=>{
   const val=soundtrackSelect.value;
   if(val==='muted'){if(cinemaAudio)cinemaAudio.pause()}
   else if(cinemaAudio){
    cinemaAudio.src=`/assets/audio/${val}.mp3`;
    cinemaAudio.currentTime=0;
    if(!film.paused)cinemaAudio.play().catch(()=>{});
   }
  };
 }
 chapterBtns.forEach(btn=>{
  btn.onclick=()=>{
   const st=Number(btn.dataset.start);
   film.currentTime=st;
   film.play().catch(()=>{});
   syncChapter(st);
  };
 });
 $('#film-dialog')?.addEventListener('close',()=>{
  film.pause();
  if(cinemaAudio)cinemaAudio.pause();
 });
}
setupCinemaModal();
$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
$('#install-app').onclick=async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null}else toast('Use your browser menu → Install app / Add to Home Screen. Availability depends on your browser.')};
function connection(){ $('#connection-status').textContent=navigator.onLine?'A moment, wherever you are.':'Offline · previously visited content is available.'}
addEventListener('online',connection);addEventListener('offline',connection);connection();
if('serviceWorker'in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}
updateBag();render();
})();
