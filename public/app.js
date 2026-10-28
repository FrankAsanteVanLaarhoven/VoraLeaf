(() => {
'use strict';
const {products,bundles,trustPillars,aboutBlend,benefits,ingredients,certifications,reviews,commerce,articles,scenes,heroPlaylist}=window.VORALEAF;
const packagingPhotos={
 bold:[['bold-opening.webp','Open the illustrated envelope to reveal the sealed gold inner pouch.'],['sachets-triptych.webp','The collection: separate paper envelopes and individually sealed inner pouches.'],['water-pouring.webp','BOLD preparation concept: an opened inner pouch beside the cup as water is poured.']],
 ember:[['ember-in-hand.webp','EMBER: an oxblood paper envelope and a separate sealed gold inner pouch.'],['sachets-triptych.webp','BOLD and EMBER have gold inner pouches; BLOOM has a rose-gold inner pouch.']],
 bloom:[['bloom-in-hand.webp','BLOOM: an open illustrated paper envelope and a separate rose-gold inner pouch.'],['sachets-triptych.webp','The three editions, each with its own paper envelope and sealed inner pouch.']]
};
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const storedBag=read('voraleaf-bag',[]),storedSaved=read('voraleaf-saved',[]);
const main=$('#main');
let bag=(Array.isArray(storedBag)?storedBag:[]).filter(i=>i&&products.some(p=>p.id===i.id)&&['6x15g','10x10g'].includes(i.format)&&Number.isFinite(Number(i.qty))).map(i=>({id:i.id,format:i.format,qty:Math.max(1,Math.min(99,Math.floor(Number(i.qty))))}));
let saved=[...new Set((Array.isArray(storedSaved)?storedSaved:[]).filter(id=>articles.some(a=>a.id===id)))];
let format='6x15g', selectedBundleBoxes=1, featuredEdition='bold', heroVideoIdx=0, heroMuted=true, filter='All', query='', timerId=null, remaining=120, deferredInstall=null, checkoutNoticeState=null;
const SPEAKER_MUTED_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6m0-6 6 6"/></svg>';
const SPEAKER_UNMUTED_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
function soundBtnHtml(extraClass='',muted=true){
 return `<button type="button" class="video-sound-btn ${extraClass} ${muted?'':'is-unmuted'}" data-video-mute aria-label="${muted?'Unmute video audio':'Mute video audio'}" aria-pressed="${!muted}" title="${muted?'Unmute audio':'Mute audio'}">${muted?SPEAKER_MUTED_SVG:SPEAKER_UNMUTED_SVG}</button>`;
}

const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('Device storage is unavailable. Your changes will last for this visit.');return false}}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>t.classList.remove('visible'),3500)}
function updateBag(){ $('#bag-count').textContent=bag.reduce((n,i)=>n+i.qty,0);write('voraleaf-bag',bag)}
const arrow='<span aria-hidden="true">↗</span>';

const BUNDLE_TIERS=[
 {boxes:20,label:'20 Boxes'},
 {boxes:12,label:'12 Boxes'},
 {boxes:4,label:'4 Boxes'},
 {boxes:1,label:'1 Box'}
];

function calcLineBreakdown(qty,fmt='6x15g'){
 const totalBoxes=Math.max(1,Math.min(99,Math.floor(Number(qty)||1)));
 let rem=totalBoxes;
 const sachetsPerBox=fmt==='10x10g'?10:6;
 const totalSachets=totalBoxes*sachetsPerBox;
 const parts=[];
 for(const tier of BUNDLE_TIERS){
  if(rem>=tier.boxes){
   const count=Math.floor(rem/tier.boxes);
   rem=rem%tier.boxes;
   parts.push({count,tier});
  }
 }
 return {
  totalBoxes,
  totalSachets,
  parts,
  summary:parts.map(p=>p.count>1?`${p.count} × ${p.tier.label}`:p.tier.label).join(' + ')
 };
}

function calcCartTotals(){
 let totalBoxes=0, totalSachets=0;
 bag.forEach(item=>{
  const br=calcLineBreakdown(item.qty,item.format);
  totalBoxes+=br.totalBoxes;
  totalSachets+=br.totalSachets;
 });
 return {
  totalBoxes,
  totalSachets
 };
}

function crumb(label){return `<div class="breadcrumb"><a href="/" data-link>Home</a><span>/</span><span>${label}</span></div>`}
function intro(eye,title,desc){return `<section class="page-intro">${crumb(title)}<span class="eyebrow">${eye}</span><h1>${title}</h1>${desc?`<p>${desc}</p>`:''}</section>`}

function pack(p,fmt='6x15g'){
 const quantity=fmt==='10x10g'?'10 × 10 g':'6 × 15 g';
 return `<div class="product-art pack-pair-art ${p.id}"><span class="edition-tag">${p.edition.toUpperCase()}</span><div class="pack-pair"><figure class="pack-view pack-view-closed"><div class="pack-view-stage"><div class="pack-box pack-box-closed"><img src="/assets/${p.id}-${fmt}.svg" alt="${p.name} ${p.number} closed carton, ${quantity}" width="110" height="150"></div></div><figcaption>Closed box</figcaption></figure><figure class="pack-view pack-view-open"><div class="pack-view-stage"><div class="pack-box pack-box-open"><img src="/assets/packaging/roots-${p.id}-${fmt}.webp" alt="${p.name} ${p.number} open carton, ${quantity}, with individual paper envelopes and a separate ${p.pouch.toLowerCase()} inner pouch" width="1254" height="1254"></div></div><figcaption>Inside the box</figcaption></figure></div><span class="pack-format-caption">${quantity} · Individually sealed servings</span><span class="art-num">${p.number}</span></div>`;
}

function galleryPhotos(p){
 const quantity=format==='10x10g'?'10 × 10 g':'6 × 15 g';
 return [
  [`/assets/${p.id}-${format}.svg`,`${p.name}: ${quantity} closed carton.`],
  [`/assets/packaging/roots-${p.id}-${format}.webp`,`${p.name}: ${quantity} open carton, individual paper envelopes and a separate ${p.pouch.toLowerCase()} inner pouch.`],
  ...packagingPhotos[p.id].map(([file,caption])=>[`/assets/packaging/${file}`,caption])
 ];
}

function productGallery(p){
 const photos=galleryPhotos(p);
 return `<div class="product-photo-gallery" data-gallery="${p.id}"><span class="eyebrow">THE BOX & EVERY LITTLE DETAIL</span><a class="gallery-full" href="${photos[0][0]}" target="_blank" rel="noopener noreferrer"><img class="gallery-main" src="${photos[0][0]}" alt="${photos[0][1]}" width="1536" height="1024"></a><p class="gallery-caption">${photos[0][1]}</p><div class="gallery-thumbs" role="group" aria-label="Choose ${p.name} product photographs">${photos.map(([file,caption],index)=>`<button class="gallery-thumb ${index===0?'active':''}" type="button" data-photo="${index}" aria-label="${caption}" aria-pressed="${index===0}"><img src="${file}" alt="" width="180" height="120"></button>`).join('')}</div><p class="status-note">Closed-box and open-box artwork match the selected format. Standard white-label pack: 15 g × 6 sachets per box (90 g).</p></div>`;
}

function productCard(p){
 return `<article class="product-card"><a data-link href="/products/${p.id}" aria-label="Explore ${p.name} ${p.number}">${pack(p)}</a><div class="product-meta"><div><a data-link href="/products/${p.id}"><h3>${p.name}<span>${p.number}</span></h3></a><p>${p.edition} · Roots herbal coffee · 6 × 15 g or 10 × 10 g sachets</p></div><a class="round-link" data-link href="/products/${p.id}" aria-label="Explore ${p.name}">↗</a></div></article>`;
}

function articleCard(a){
 return `<article class="story"><a data-link href="/journal/${a.id}" tabindex="-1" aria-hidden="true"><div class="story-image"><img src="/assets/${a.image}" alt="${a.image==='move.webp'?'Woman relaxing after gentle movement in a sunlit studio':a.image==='together.webp'?'A couple sharing coffee on a sunlit terrace':a.image==='collection.webp'?'The three VORALEAF coffee editions':a.image==='focus.webp'?'A man taking a coffee pause at a home desk':a.image==='strength.webp'?'A man in a bright gym between sets':'Coffee pouring into a forest-green ceramic cup'}" width="600" height="400"></div></a><p class="category">${a.category} · ${a.minutes} MIN READ</p><h3><a data-link href="/journal/${a.id}">${a.title}</a></h3><p class="story-summary">${a.summary}</p><div class="readline"><a data-link href="/journal/${a.id}">Read the story ↗</a><button class="text-button save-story ${saved.includes(a.id)?'saved-indicator':''}" data-id="${a.id}" aria-label="${saved.includes(a.id)?'Unsave':'Save'} ${a.title}">${saved.includes(a.id)?'Saved ✓':'Save +'}</button></div></article>`;
}

function trustStripSection(){
 return `<section class="trust-pillars-bar" aria-label="Storefront guarantees">${trustPillars.map(t=>`<div class="trust-pillar"><span class="trust-icon" aria-hidden="true">${t.icon}</span><div><strong>${safe(t.title)}</strong><span>${safe(t.sub)}</span></div></div>`).join('')}</section>`;
}

function featuredBundlesSection(){
 const activeProd=products.find(p=>p.id===featuredEdition)||products[0];
 return `<section class="section-shell bundles-section" id="bundles"><div class="section-head"><div><span class="eyebrow">FEATURED MULTIPACKS & BUNDLE OPTIONS · UK & INTERNATIONAL</span><h2>Choose your box bundle.</h2><p class="section-intro">Fuel the long-term bond: Get reliable stamina and desire that lasts up to 48 hours, starting with your morning cup.</p></div><div class="bundle-edition-picker" role="group" aria-label="Select edition for bundle selection"><span class="bundle-picker-label">Edition:</span>${products.map(p=>`<button type="button" class="filter bundle-edition-btn ${p.id===activeProd.id?'active':''}" data-edition="${p.id}" aria-pressed="${p.id===activeProd.id}">${p.name} ${p.number}</button>`).join('')}</div></div><div class="bundles-grid">${bundles.map(b=>`<article class="bundle-card ${b.id==='12-boxes'?'bundle-card-featured':''}"><div class="bundle-card-top"><span class="bundle-badge">${safe(b.badge)}</span><span class="bundle-savings">${safe(b.tag)}</span></div><div class="bundle-art-preview">${pack(activeProd,'6x15g')}</div><div class="bundle-card-body"><h3>VORALEAF ${activeProd.name} ${activeProd.number} (${safe(b.label)})</h3><p class="bundle-pack-meta">${safe(b.sub)} · ${activeProd.edition}</p><div class="bundle-actions"><button type="button" class="button buy-bundle-now" data-edition="${activeProd.id}" data-boxes="${b.boxes}">Select &amp; Order ${arrow}</button><button type="button" class="button outline add-bundle-bag" data-edition="${activeProd.id}" data-boxes="${b.boxes}">Add to Bag</button></div></div></article>`).join('')}</div></section>`;
}

function aboutVitalitySection(){
 return `<section class="section-shell vitality-about-section" id="about-vitality"><div class="vitality-about-grid"><div class="vitality-about-copy"><span class="eyebrow">${safe(aboutBlend.eyebrow)}</span><h2>${safe(aboutBlend.title)}</h2><p class="vitality-lead">${safe(aboutBlend.tagline)}</p><p class="vitality-subhead">${safe(aboutBlend.subhead)}</p><p>${safe(aboutBlend.summary)}</p><div class="vitality-cta-row"><a class="button" href="/collection" data-link>${safe(aboutBlend.ctaText)} ${arrow}</a></div></div><div class="vitality-highlights-card"><span class="eyebrow">KEY PERFORMANCE PILLARS</span><ul class="vitality-highlights-list">${aboutBlend.highlights.map(h=>`<li><strong>${safe(h.title)}</strong><span>${safe(h.text)}</span></li>`).join('')}</ul></div></div></section>`;
}

function benefitsSection(){
 return `<section class="section-shell benefits-section" id="benefits"><div class="section-head"><div><span class="eyebrow">BENEFITS OF VORALEAF BIO HERBS COFFEE</span><h2>Sustained vitality for long-term partners.</h2><p class="section-intro">Herbal instant coffee for husbands and partners in long-term relationships.</p></div></div><div class="benefits-grid">${benefits.map(b=>`<article class="benefit-card"><span class="benefit-num">${safe(b.num)}</span><h3>${safe(b.title)}</h3><p>${safe(b.text)}</p></article>`).join('')}</div><div class="benefits-footnotes">${certifications.footnotes.map(f=>`<p>${safe(f)}</p>`).join('')}</div></section>`;
}

function ingredientsSection(){
 return `<section class="section-shell ingredients-section" id="ingredients"><div class="section-head"><div><span class="eyebrow">${safe(ingredients.eyebrow)}</span><h2>${safe(ingredients.title)}</h2><p class="section-intro">${safe(ingredients.subtitle)}</p></div></div><div class="extract-spotlight"><div class="extract-spotlight-copy"><span class="eyebrow">${safe(ingredients.featuredExtract.badge)}</span><h3>${safe(ingredients.featuredExtract.title)}</h3><p>${safe(ingredients.featuredExtract.text)}</p></div><div class="extract-spotlight-meta"><span>100% Water-Soluble</span><span>Freeze-Dried Botanicals</span><span>Consistent Sachet Dosing</span></div></div><div class="ingredients-grid">${ingredients.items.map((ing,idx)=>`<article class="ingredient-card ${ing.name.includes('African')?'ingredient-card-highlight':''}"><div class="ingredient-card-head"><span class="ingredient-idx">0${idx+1}</span><div><h3>${safe(ing.name)}</h3><p class="ingredient-latin">${safe(ing.latin)}</p></div></div><ul class="ingredient-points">${ing.points.map(pt=>`<li>${safe(pt)}</li>`).join('')}</ul></article>`).join('')}</div><div class="specs-strip" aria-label="Format, pack, preparation and storage specifications">${ingredients.specs.map(s=>`<div class="spec-item"><span class="spec-label">${safe(s.label)}</span><strong class="spec-value">${safe(s.value)}</strong></div>`).join('')}</div></section>`;
}

function certificationsSection(){
 return `<section class="section-shell certifications-section" id="certifications"><div class="certifications-box"><div class="certifications-head"><div><span class="eyebrow">MANUFACTURER & CERTIFICATIONS</span><h2>Quality & white-label assurance.</h2><p>${safe(certifications.manufacturer)}</p></div><div class="cert-badges-grid">${certifications.items.map(c=>`<div class="cert-badge"><strong>${safe(c.code)}</strong><span>${safe(c.name)}</span></div>`).join('')}</div></div><p class="cert-disclaimer">${safe(certifications.disclaimer)}</p></div></section>`;
}

function reviewsSection(){
 return `<section class="section-shell reviews-section" id="reviews"><div class="section-head"><div><span class="eyebrow">VERIFIED CUSTOMER REVIEWS</span><h2>Trusted by couples worldwide.</h2></div></div><div class="reviews-layout"><div class="reviews-summary-card"><div class="reviews-score-big"><strong>${safe(reviews.average)}</strong><div><span class="stars-gold" aria-label="4.6 out of 5 stars">★★★★★</span><p>Based on ${reviews.total} reviews</p></div></div><div class="reviews-bars">${reviews.distribution.map(r=>`<div class="review-bar-row"><span class="bar-star">${r.stars} ★</span><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${r.pct}%"></div></div><span class="bar-pct">${r.pct}% (${r.count})</span></div>`).join('')}</div></div><div class="reviews-list">${reviews.items.map(item=>`<article class="review-card"><div class="review-card-top"><div><strong>${safe(item.author)}</strong><span class="review-verified">Verified Buyer</span></div><time>${safe(item.date)}</time></div><div class="stars-gold" aria-label="${item.stars} out of 5 stars">${'★'.repeat(item.stars)}</div><p>${safe(item.text)}</p></article>`).join('')}</div></div></section>`;
}

function mensAndWomensVideoSection(editionFilter='All'){
 const showMens=editionFilter==='All'||editionFilter==='Men’s edition';
 const showWomens=editionFilter==='All'||editionFilter==='Women’s edition';
 return `<section class="section-shell editions-video-section" id="editions-films" aria-label="Men’s and Women’s Editions">
  <div class="section-head">
   <div>
    <span class="eyebrow">FOR HIM &amp; FOR HER · BOLD 01 &amp; BLOOM 03</span>
    <h2>Two worlds of vitality.<br>Crafted for him &amp; for her.</h2>
    <p class="section-intro">Experience the obsidian-and-gold presence of BOLD 01 and the rose-gold elegance of BLOOM 03.</p>
   </div>
  </div>
  <div class="editions-video-grid ${showMens&&showWomens?'two-col':'one-col'}">
   ${showMens?`<article class="edition-video-card mens-edition-card" id="mens-section">
    <div class="edition-video-stage">
     <img class="showcase-poster-fallback" src="/assets/bold-mens-poster.webp" alt="Hands opening the sealed gold inner sachet of VORALEAF BOLD 01 Men’s Edition" width="1280" height="720">
     <video class="showcase-video" src="/assets/bold-mens.mp4" playsinline muted loop autoplay preload="metadata" poster="/assets/bold-mens-poster.webp" aria-label="BOLD 01 Men’s Edition"></video>
     ${soundBtnHtml()}
    </div>
    <div class="edition-video-body">
     <span class="eyebrow">MEN’S EDITION · SEALED GOLD SACHET</span>
     <h3>BOLD 01 &amp; EMBER 02</h3>
     <p>Obsidian black and champagne gold meet freeze-dried Tongkat Ali, Panax Ginseng and Mixed African Roots Bitter Herbs. Designed to support stamina, circulation and 48-hour confidence from the first morning cup.</p>
     <div class="edition-video-actions">
      <a class="button" href="/products/bold" data-link>Explore BOLD 01 ${arrow}</a>
      <a class="button outline" href="/products/ember" data-link>Explore EMBER 02 ${arrow}</a>
     </div>
    </div>
   </article>`:''}
   ${showWomens?`<article class="edition-video-card womens-edition-card" id="womens-section">
    <div class="edition-video-stage">
     <img class="showcase-poster-fallback" src="/assets/bloom-womens-poster.webp" alt="Opening the rose-gold inner sachet of VORALEAF BLOOM 03 Women’s Edition" width="1280" height="720">
     <video class="showcase-video" src="/assets/bloom-womens.mp4" playsinline muted loop autoplay preload="metadata" poster="/assets/bloom-womens-poster.webp" aria-label="BLOOM 03 Women’s Edition"></video>
     ${soundBtnHtml()}
    </div>
    <div class="edition-video-body">
     <span class="eyebrow">WOMEN’S EDITION · ROSE-GOLD SACHET</span>
     <h3>BLOOM 03</h3>
     <p>Presented in soft ivory and mulberry with a signature rose-gold metallic inner pouch. Formulated with our signature botanical and African bitter roots complex to uplift mood, energy and shared connection.</p>
     <div class="edition-video-actions">
      <a class="button" href="/products/bloom" data-link>Explore BLOOM 03 ${arrow}</a>
      <a class="button outline" href="/collection" data-link>View Multipack Bundles ${arrow}</a>
     </div>
    </div>
   </article>`:''}
  </div>
 </section>`;
}

function intimateSection(){
 return `<section class="section-shell intimate-campaign-section" id="intimate" aria-label="Shared Presence and Connection">
  <div class="intimate-campaign-shell">
   <div class="intimate-campaign-copy">
    <span class="eyebrow">SHARED PRESENCE &amp; CONNECTION</span>
    <h2>Confidence that carries into every <em>moment</em> together.</h2>
    <p class="intimate-lead">From lively evenings out to quiet moments for two—VORALEAF is crafted for lasting presence, desire and 48-hour confidence.</p>
    <p>Celebrated across modern relationships, social lounges and shared rituals, BOLD 01, EMBER 02 and BLOOM 03 bring smooth coffee and traditional botanicals together in every single-serve sachet.</p>
    <div class="intimate-pillars">
     <div class="intimate-pillar">
      <strong>01 · Lasting Bond &amp; 48-Hour Stamina</strong>
      <span>Supports healthy circulation, desire and energy so couples stay connected and confident for up to two days.</span>
     </div>
     <div class="intimate-pillar">
      <strong>02 · Unmistakable Presentation</strong>
      <span>A conversation-starting ritual in obsidian black, oxblood and rose gold—crafted to be shared and savoured.</span>
     </div>
     <div class="intimate-pillar">
      <strong>03 · Multipacks &amp; Partnerships</strong>
      <span>Available in 1, 4, 12 and 20-box bundles for your daily routine or UK &amp; international retail partnerships.</span>
     </div>
    </div>
    <div class="intimate-cta-row">
     <a class="button light" href="/collection" data-link>Shop the Collection ${arrow}</a>
     <a class="button outline light-outline" href="/studio" data-link>Creator Studio ${arrow}</a>
    </div>
   </div>
   <div class="intimate-campaign-media">
    <div class="intimate-video-frame">
     <img class="showcase-poster-fallback" src="/assets/intimate-poster.webp" alt="VORALEAF shared connection and lifestyle showcase" width="1280" height="720">
     <video class="showcase-video" src="/assets/intimate.mp4" playsinline muted loop autoplay preload="metadata" poster="/assets/intimate-poster.webp" aria-label="VORALEAF shared connection"></video>
     ${soundBtnHtml()}
    </div>
   </div>
  </div>
 </section>`;
}

function workoutFeatureSection(){
 return `<section class="section-shell movement-feature workout-video-feature" id="workout-area">
  <div class="workout-video-stage">
   <img class="showcase-poster-fallback" src="/assets/hero-workout-poster.webp" alt="A couple preparing VORALEAF BOLD 01 and BLOOM 03 in a sunlit studio" width="1280" height="720">
   <video class="showcase-video" src="/assets/hero-workout.mp4" playsinline muted loop autoplay preload="metadata" poster="/assets/hero-workout-poster.webp" aria-label="VORALEAF active movement ritual"></video>
   ${soundBtnHtml()}
  </div>
  <div>
   <span class="eyebrow">MOVE &amp; UNWIND</span>
   <h2>Life moves.<br>Fuel your rhythm.</h2>
   <p>From morning studio sessions to active recovery together—experience how BOLD 01 and BLOOM 03 fit naturally into your movement and gym routine.</p>
   <div class="edition-video-actions">
    <a class="button" href="/fitness" data-link>Explore gym &amp; exercises ${arrow}</a>
    <a class="button outline" href="/movement" data-link>Mindful movement timer ${arrow}</a>
   </div>
  </div>
 </section>`;
}

function home(){
 const curFilm=heroPlaylist[heroVideoIdx]||heroPlaylist[0];
 return `<section class="hero"><div class="hero-media"><img class="hero-bg" src="/assets/coffee-hero.webp" alt="Hands opening the VORALEAF BOLD 01 box to reveal a sealed gold sachet in warm morning light" width="1280" height="720" fetchpriority="high"><video id="hero-video" class="hero-bg-video" src="${curFilm.src}" playsinline ${heroMuted?'muted':''} autoplay preload="auto" poster="${curFilm.poster||'/assets/coffee-hero.webp'}" aria-label="VORALEAF Roots Herbal Coffee"></video></div><div class="hero-copy"><span class="eyebrow">ROOTS HERBAL COFFEE · 48-HOUR VITALITY &amp; INTIMACY</span><h1>Make room<br>for <em>your</em><br>moment.</h1><p class="hero-description">Men’s &amp; partners’ vitality coffee to support energy, desire and intimacy in long-term love. Fuel the long-term bond with reliable stamina that lasts up to 48 hours, starting with your morning cup.</p><div class="hero-actions"><a class="button" href="/collection" data-link>Shop the collection ${arrow}</a><a class="button outline light-outline" href="/about" data-link>Ingredients &amp; benefits ${arrow}</a></div></div>${soundBtnHtml('hero-sound-btn',heroMuted)}<div class="hero-caption"><span>BOLD 01 · EMBER 02 · BLOOM 03</span><span>VORALEAF ROOTS HERBAL COFFEE · UK EDITION</span></div></section>
${trustStripSection()}
<section class="section-shell"><div class="section-head"><div><span class="eyebrow">THE COLLECTION</span><h2>Three editions. One signature vitality formula.</h2></div><a class="text-link" href="/collection" data-link>Explore all editions ↗</a></div><div class="collection-grid">${products.map(productCard).join('')}</div></section>
${mensAndWomensVideoSection('All')}
${featuredBundlesSection()}
${intimateSection()}
${aboutVitalitySection()}
${benefitsSection()}
${ingredientsSection()}
${certificationsSection()}
${reviewsSection()}
<section class="section-shell pack-story"><div class="pack-story-stage"><div class="pack-story-media"><video id="pack-scene-video" class="pack-scene-video" playsinline muted loop autoplay preload="metadata" poster="/assets/packaging/sachets-triptych.webp" style="opacity:1"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video><img id="pack-scene-img" src="/assets/packaging/sachets-triptych.webp" alt="Three VORALEAF paper envelopes with separate gold and rose-gold inner sachets" width="1536" height="1024" style="opacity:0"></div></div><div><span class="eyebrow">THE TWO-PART SERVING PACK</span><h2>A little reveal.<br>A moment to savour.</h2><p>Open the illustrated paper envelope to find your individually sealed inner pouch. Gold for BOLD and EMBER. Rose gold for BLOOM.</p><p>Each 15 g sachet blends smooth coffee with freeze-dried Tongkat Ali, Panax Ginseng, Dong Quai, Jujube and Mixed African Roots Bitter Herbs—ready in seconds with 150–180 ml hot water.</p><a class="text-link" href="/collection" data-link>Shop the collection ↗</a></div></section>
<section class="editorial-split"><div class="editorial-photo"><img src="/assets/together.webp" alt="A relaxed couple enjoying coffee and a conversation on a coastal terrace" width="768" height="650"></div><div class="editorial-copy"><span class="eyebrow">MORE THAN A COFFEE MOMENT</span><h2>A little pause.<br>A little presence.<br>A little <em>you.</em></h2><p>For quiet mornings, conversations that linger and the moments between everything else. Rejuvenate passion, energy and intimacy in long-term love.</p><a class="text-link" href="/journal/time-together" data-link>Find inspiration in the journal ↗</a><div class="ritual-line"><span>01</span> Open. Pour. Make it yours.</div></div></section>
<section class="section-shell"><div class="section-head"><div><span class="eyebrow">THE VORALEAF JOURNAL</span><h2>Stories to come back to.</h2></div><a class="text-link" href="/journal" data-link>Explore the journal ↗</a></div><div class="journal-grid">${[articles[0],articles[1],articles[2]].map(articleCard).join('')}</div></section>
<div class="marquee">ROOTED IN RITUAL. <span>48-Hour Vitality &amp; Confidence.</span> VORALEAF.</div>
${workoutFeatureSection()}
<section class="creator-banner"><div><span class="eyebrow">THE CREATOR STUDIO</span><h2>Your ritual.<br>Your story.</h2><p>Record your next coffee story, find its soundtrack or rehearse your words. Verified customers can also share with members and go live when publishing services are available.</p><a class="text-link" href="/studio" data-link>Step into the studio ↗</a></div><div class="creator-visual" aria-hidden="true"><div class="phone-mock"></div><span class="studio-caption">OPEN.<br>CREATE.<br>MAKE IT YOURS.</span></div></section>
<section class="newsletter"><div><span class="eyebrow">A MOMENT THAT FITS YOU</span><h2>Where will your ritual take you?</h2><p>Find an edition by its visual character and the moments you love.</p></div><button class="button" id="open-finder">Find my ritual ${arrow}</button></section>`;
}

function collection(){
 return `${intro('ROOTS HERBAL COFFEE · BIO HERBS VITALITY BLEND','The collection.','Three distinctive presentations sharing our white-label botanical coffee formula—featuring water-soluble freeze-dried Tongkat Ali, Ginseng, Dong Quai, Jujube and Mixed African Roots Bitter Herbs.')}
${trustStripSection()}
<section class="section-shell collection-page"><div class="filters" aria-label="Filter editions">${['All','Men’s edition','Women’s edition'].map(x=>`<button class="filter product-filter ${filter===x?'active':''}" data-filter="${x}" aria-pressed="${filter===x}">${x==='All'?'All editions':x}</button>`).join('')}</div><div class="collection-grid">${products.filter(p=>filter==='All'||p.edition===filter).map(productCard).join('')}</div><p class="collection-note">Available in 6 × 15 g (90 g) standard boxes or 10 × 10 g (100 g) format. Multipack bundles (1, 4, 12 or 20 boxes) ship across the UK with secure PayPal and Stripe checkout.</p></section>
${mensAndWomensVideoSection(filter)}
${featuredBundlesSection()}
${intimateSection()}
${benefitsSection()}
${ingredientsSection()}
${certificationsSection()}
<section class="newsletter"><div><h2>Need a little direction?</h2><p>Let your favourite colours and occasions lead the way.</p></div><button class="button" id="open-finder">Find my ritual ${arrow}</button></section>`;
}

function product(id){
 const p=products.find(x=>x.id===id);
 if(!p)return notFound();
 const activeBundle=bundles.find(b=>b.boxes===selectedBundleBoxes)||bundles[0];
 return `<section class="page-intro">${crumb(`<a data-link href="/collection">Collection</a> / ${p.name} ${p.number}`)}</section>
<section class="section-shell product-detail">
 <div class="product-visuals">${pack(p,format)}${productGallery(p)}</div>
 <div class="product-copy">
  <span class="eyebrow">${p.edition.toUpperCase()} · ROOTS HERBAL COFFEE</span>
  <h1>${p.name} <span>${p.number}</span></h1>
  <p class="lead">${p.mood}</p>
  <div class="product-price-banner">
   <div>
    <strong class="product-price-gbp">${safe(activeBundle.label)}</strong>
    <span class="product-price-usd">${safe(activeBundle.sub)}</span>
   </div>
   <span class="product-bundle-pill">${safe(activeBundle.badge)} · ${safe(activeBundle.tag)}</span>
  </div>
  <p class="description">${p.description}</p>
  <span class="field-label">1. Choose your sachet pack format</span>
  <div class="format-picker">${[['6x15g','6 × 15 g','90 g · six 15 g sachets'],['10x10g','10 × 10 g','100 g · ten 10 g sachets']].map(([v,l,s])=>`<button class="format-option ${format===v?'active':''}" data-format="${v}" aria-pressed="${format===v}">${l}<small>${s}</small></button>`).join('')}</div>
  <span class="field-label">2. Choose your box bundle size</span>
  <div class="bundle-picker-grid" role="group" aria-label="Choose bundle size">${bundles.map(b=>`<button type="button" class="bundle-option ${selectedBundleBoxes===b.boxes?'active':''}" data-boxes="${b.boxes}" aria-pressed="${selectedBundleBoxes===b.boxes}"><strong>${safe(b.label)}</strong><span>${safe(b.sub)}</span><em class="bundle-opt-save">${safe(b.tag)}</em></button>`).join('')}</div>
  <div class="product-cta-stack">
   <button class="button buy-now-product" data-id="${p.id}" data-boxes="${activeBundle.boxes}">Proceed to Checkout (${safe(activeBundle.label)}) ${arrow}</button>
   <button class="button outline add-to-bag" data-id="${p.id}" data-boxes="${activeBundle.boxes}">Add ${safe(activeBundle.label)} to Bag</button>
  </div>
  <p class="status-note">100% Original · Free UK delivery on qualifying orders · SSL encrypted checkout with PayPal &amp; Stripe.</p>
  <div class="benefits-row"><span>◇ 48-Hour Vigor</span><span>❧ 6 Botanical Extracts</span><span>✧ ${p.pouch} inner pouch</span><span>🔒 GMP · HACCP · HALAL</span></div>
  <div class="details-list">
   <details open><summary>Ingredients &amp; African Bitter Roots Formula</summary><p>Contains Water-Soluble Freeze-Dried <strong>Tongkat Ali</strong> (<em>Eurycoma longifolia</em> root extract), <strong>Panax Ginseng</strong> root, <strong>Radix Angelicae Sinensis</strong> (Dong quai root), <strong>Jujube</strong> (<em>Ziziphus jujuba</em>), <strong>Mixed African Roots Bitter Herbs</strong>, and smooth instant <strong>Coffee, Sugar &amp; Non-Dairy Creamer</strong>.</p></details>
   <details><summary>Preparation, Pack &amp; Storage</summary><p><strong>Format:</strong> Instant coffee sachets in sealed metallic inner pouches.<br><strong>Pack:</strong> 15 g × 6 sachets per box (90 g) or 10 g × 10 sachets per box (100 g).<br><strong>Prep:</strong> Empty 1 sachet into a cup, add 150–180 ml hot water, and stir well.<br><strong>Storage:</strong> Store in a cool, dry place; close opened box tightly.</p></details>
   <details><summary>Manufacturer &amp; Certifications</summary><p>${safe(certifications.manufacturer)} Certified under <strong>GMP</strong> (Good Manufacturing Practice), <strong>HACCP</strong> (Hazard Analysis &amp; Critical Control Points), <strong>HALAL</strong>, and <strong>ISO 9001:2000</strong> Quality Management.</p></details>
   <details><summary>Safety &amp; Responsible Use</summary><p>${safe(certifications.disclaimer)} Ginseng may influence blood sugar and clotting; Dong quai can interact with blood-thinning medicines (such as warfarin). Consult a doctor before use if pregnant, nursing, or managing heart or blood-pressure conditions.</p></details>
  </div>
  <div class="product-ritual-scene" data-product="${p.id}"><div class="scene-header"><div><span class="eyebrow">${p.edition.toUpperCase()} · ${p.name} ${p.number}</span><h3>The ${p.name} Serving Moment</h3></div><span class="edition-pouch-badge">${p.pouch} inner pouch</span></div><div class="product-video-card"><video class="product-video" playsinline muted loop autoplay preload="metadata" poster="${p.id==='bloom'?'/assets/bloom-womens-poster.webp':'/assets/bold-mens-poster.webp'}"><source src="${p.id==='bloom'?'/assets/bloom-womens.mp4':'/assets/bold-mens.mp4'}" type="video/mp4"></video><p class="scene-caption">${p.id==='bloom'?'BLOOM 03 pairs an ivory paper envelope with a distinctive rose-gold metallic inner pouch.':p.name+' '+p.number+' pairs its botanical paper envelope with a sealed gold inner pouch.'}</p></div></div>
 </div>
</section>
${mensAndWomensVideoSection(p.edition)}
${intimateSection()}
${benefitsSection()}
${ingredientsSection()}
${certificationsSection()}
${reviewsSection()}
<section class="section-shell"><div class="section-head"><div><span class="eyebrow">EXPLORE THE REST OF THE COLLECTION</span><h2>A different kind of moment.</h2></div></div><div class="collection-grid">${products.filter(x=>x.id!==id).map(productCard).join('')}</div></section>`;
}

function journal(){
 const categories=['All','Rituals','Movement','Together','Design','Create','Saved'];
 let filtered=articles.filter(a=>(filter==='All'||(filter==='Saved'?saved.includes(a.id):a.category===filter))&&(`${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(query.toLowerCase())));
 return `${intro('THE JOURNAL','A world of little rituals.','Read, explore and save what speaks to you. Coffee stories, botanical heritage and everyday inspiration — at your own pace.')}<section class="section-shell journal-library"><label class="field-label" for="journal-search">Search stories</label><input class="search-field" id="journal-search" type="search" placeholder="Find a story, a ritual, a moment…" value="${safe(query)}"><div class="filters" aria-label="Filter stories">${categories.map(x=>`<button class="filter journal-filter ${filter===x?'active':''}" data-filter="${x}" aria-pressed="${filter===x}">${x}${x==='Saved'?` (${saved.length})`:''}</button>`).join('')}</div><div class="journal-grid" id="journal-results">${filtered.length?filtered.map(articleCard).join(''):'<p class="empty-state">No stories here yet. Try another search or save a story to read later.</p>'}</div></section>`;
}

function articleVideo(id){
 if(id==='inside-the-envelope'){
  return `<figure class="editorial-video-figure"><div class="video-container"><video class="editorial-video" playsinline muted loop autoplay preload="metadata" poster="/assets/packaging/bold-opening.webp"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video></div><figcaption><strong>THE TWO-PART SERVING PACK</strong><p>Adult hands lifting the illustrated paper flap to draw out the individually sealed metallic pouch. Gold for BOLD and EMBER; rose gold for BLOOM.</p></figcaption></figure>`;
 }
 if(id==='a-desk-side-pause'){
  return `<figure class="editorial-video-figure"><div class="video-container"><video class="editorial-video" playsinline muted loop autoplay preload="metadata" poster="/assets/coffee-hero.webp"><source src="/assets/ritual-motion-study.mp4" type="video/mp4"></video></div><figcaption><strong>THE WATER POUR &amp; STIR</strong><p>A continuous stream of hot water from a brass kettle into the ceramic cup, blooming the coffee with gentle swirling steam, followed by a slow, thoughtful stir.</p></figcaption></figure>`;
 }
 return '';
}

function article(id){
 const a=articles.find(x=>x.id===id);
 if(!a)return notFound();
 return `<article class="article-shell">${crumb(`<a href="/journal" data-link>Journal</a> / ${a.category}`)}<span class="eyebrow">${a.category} · ${a.minutes} MIN READ · VORALEAF EDITORIAL</span><h1>${a.title}</h1><p class="article-lead">${a.lead}</p><img class="article-image" src="/assets/${a.image}" alt="${safe(a.summary)}" width="900" height="560"><div class="article-body">${a.body.map(([h,p])=>`<h2>${h}</h2><p>${p}</p>`).join('')}${articleVideo(id)}</div><div class="article-actions"><button class="save-story text-button" data-id="${id}">${saved.includes(id)?'Saved ✓':'Save this story +'}</button><button class="share-story text-button" data-id="${id}">Share story ↗</button><a href="/journal" data-link class="text-link">Back to the journal</a></div></article><section class="section-shell"><div class="section-head"><h2>Stay a little longer.</h2></div><div class="journal-grid">${articles.filter(x=>x.id!==id).slice(0,3).map(articleCard).join('')}</div></section>`;
}

function movement(){
 return `${intro('MOVE & UNWIND','Find your own rhythm.','Ideas for a change of scene, movement preparation and time to enjoy the everyday. This is lifestyle inspiration, separate from product benefits.')}${workoutFeatureSection()}<section class="section-shell" style="padding-top:0"><div class="movement-cards">${[['01','A change of scene','Take your moment somewhere new: a nearby garden, a light-filled room or a familiar path.','/journal/a-desk-side-pause'],['02','Movement you enjoy','Explore your own pace. Plan a routine with qualified guidance if you need a programme suited to you.','/journal/move-at-your-pace'],['03','A shared moment','Set a table for two, make time for a conversation and leave the to-do list for a little later.','/journal/time-together']].map(([n,h,p,url])=>`<article class="movement-card"><span class="number">${n}</span><h3>${h}</h3><p>${p}</p><a data-link class="text-link" href="${url}">Explore the story ↗</a></article>`).join('')}</div><p><a class="button outline" href="/fitness" data-link>Explore the interactive exercise library ${arrow}</a></p><div class="timer" id="movement-timer"><div class="timer-video-backdrop" aria-hidden="true"><video id="timer-bg-video" playsinline muted loop preload="none" poster="/assets/hero-workout-poster.webp"><source src="/assets/hero-workout.mp4" type="video/mp4"></video></div><div class="timer-content" style="position:relative;z-index:2"><span class="eyebrow">THE QUIET CORNER · MINDFUL PAUSE</span><h3>Two minutes. Just for you.</h3><p>A simple pause timer accompanied by calming coffee ritual visuals. Make it yours.</p><div class="timer-modes"><label class="timer-mode-check"><input type="checkbox" id="timer-visual-toggle"> Calming background video</label><label class="timer-mode-check"><input type="checkbox" id="timer-audio-toggle"> Ambient track (Meadow)</label></div></div><span class="timer-clock" id="timer-clock" role="timer" style="position:relative;z-index:2">02:00</span><div style="position:relative;z-index:2"><button class="button light" id="timer-toggle">Start my pause</button><button class="text-button" id="timer-reset" style="color:var(--cream);display:block;margin-top:15px">Reset</button></div></div><p class="collection-note">Persistent tiredness or unusual breathlessness deserves appropriate medical advice. Coffee is not a treatment for these symptoms.</p></section>`;
}

function bagPage(){
 const params=new URLSearchParams(location.search);
 const checkoutStatus=params.get('checkout');
 const checkoutProvider=params.get('provider');
 const totals=calcCartTotals();

 const statusBanner=checkoutStatus==='success'
  ? `<div class="checkout-banner checkout-banner-success" role="status"><strong>Thank you for your order!</strong> Your ${safe(checkoutProvider||'payment')} checkout for VORALEAF UK has been recorded. Need assistance? Contact <a href="mailto:hello@voraleaf.com">hello@voraleaf.com</a>.</div>`
  : checkoutStatus==='cancelled'
  ? `<div class="checkout-banner checkout-banner-warn" role="status"><strong>Checkout paused.</strong> Your bag has been saved so you can complete checkout with PayPal or Stripe whenever you are ready.</div>`
  : '';

 return `${intro('SECURE UK & INTERNATIONAL CHECKOUT','Your bag & checkout.','Select your VORALEAF Roots Herbal Coffee editions and box bundles (1, 4, 12 or 20 boxes). Complete your order via PayPal or Stripe.')}
${trustStripSection()}
<section class="section-shell bag-layout">
 ${statusBanner}
 ${bag.length?`<div>
  ${bag.map(i=>{
   const p=products.find(p=>p.id===i.id);
   const line=calcLineBreakdown(i.qty,i.format);
   return `<div class="bag-item">
    <img src="/assets/${p.id}-${i.format}.svg" alt="${p.name} carton">
    <div>
     <h3>${p.name} ${p.number}</h3>
     <p>${p.edition} · ${i.format==='6x15g'?'6 × 15 g / 90 g':'10 × 10 g / 100 g'} · <strong>${safe(line.summary)}</strong></p>
     <div class="bag-item-controls">
      <div class="quantity"><button class="qty" data-key="${i.id}-${i.format}" data-delta="-1" aria-label="Decrease ${p.name} quantity">−</button><span>${i.qty} box${i.qty>1?'es':''}</span><button class="qty" data-key="${i.id}-${i.format}" data-delta="1" aria-label="Increase ${p.name} quantity">+</button></div>
      <div class="bag-preset-pills" role="group" aria-label="Quick bundle size for ${p.name}">
       ${[1,4,12,20].map(bQty=>`<button type="button" class="bag-preset-btn ${i.qty===bQty?'active':''}" data-key="${i.id}-${i.format}" data-set-qty="${bQty}">${bQty} Box${bQty>1?'es':''}</button>`).join('')}
      </div>
      <button class="remove-item" data-key="${i.id}-${i.format}">Remove</button>
     </div>
    </div>
    <div class="bag-item-price">
     <strong>${i.qty} Box${i.qty>1?'es':''}</strong>
     <span>${line.totalSachets} sachets</span>
    </div>
   </div>`;
  }).join('')}
 </div>
 <aside class="bag-summary">
  <span class="eyebrow">ORDER SUMMARY · ${totals.totalBoxes} BOX${totals.totalBoxes>1?'ES':''}</span>
  <h2>Secure Checkout</h2>
  <div class="bag-totals-box">
   <div class="bag-total-line"><span>Selected Boxes</span><strong>${totals.totalBoxes} box${totals.totalBoxes>1?'es':''}</strong></div>
   <div class="bag-total-line"><span>Total Servings</span><strong>${totals.totalSachets} sachets</strong></div>
   <div class="bag-total-line"><span>UK Standard Shipping</span><strong>Included on qualifying bundles</strong></div>
  </div>
  <label for="checkout-email" class="field-label">Your email for receipt &amp; tracking</label>
  <input id="checkout-email" type="email" class="checkout-input" placeholder="you@example.co.uk" autocomplete="email">
  <label for="enquiry-note" class="field-label">Delivery instructions or order notes (optional)</label>
  <textarea id="enquiry-note" rows="2" class="checkout-input" placeholder="Delivery notes or questions…"></textarea>

  <button type="button" class="button paypal-checkout-btn" id="paypal-checkout-btn">Continue with PayPal ${arrow}</button>
  <button type="button" class="button stripe-checkout-btn" id="stripe-checkout-btn">Continue with Stripe ${arrow}</button>
  <div id="checkout-status-panel" class="checkout-status-panel" ${checkoutNoticeState?'':'hidden'} aria-live="polite">
   ${checkoutNoticeState?`
    <p class="checkout-status-title"><strong>${safe(checkoutNoticeState.title)}</strong></p>
    <p>${safe(checkoutNoticeState.message)}</p>
    <div class="checkout-fallback-actions">
     <button type="button" class="button small" id="checkout-order-request">Send Order Confirmation Request ${arrow}</button>
    </div>
   `:''}
  </div>

  <div class="bag-secondary-actions">
   <button class="button outline small" id="email-enquiry">Order / Wholesale Enquiry</button>
   <button class="button outline small" id="download-enquiry">Download Order Summary</button>
  </div>
  <p class="merchant-account-note">SSL encrypted checkout · PayPal &amp; Stripe.</p>
 </aside>`:`<div class="empty-state"><h2>Your bag is currently empty.</h2><p>Explore our BOLD 01, EMBER 02 and BLOOM 03 editions or choose a 1, 4, 12 or 20-box bundle.</p><a class="button" href="/collection" data-link>Shop the collection ${arrow}</a></div>`}
</section>`;
}

function contact(){
 return `${intro('SAY HELLO','Let’s make a connection.','For UK & international orders, wholesale partnerships, creator enquiries or customer support.')}<section class="section-shell contact-grid"><div><h2>A little conversation<br>starts here.</h2><p>VORALEAF<br>294 Coldharbour Lane<br>London, SW9 8SE<br>United Kingdom</p><a class="button" href="mailto:hello@voraleaf.com">hello@voraleaf.com ${arrow}</a><p style="margin-top:25px">Telephone / WhatsApp Business<br><a href="tel:+447463326519">+44 7463 326519</a><br><a class="text-link" href="https://wa.me/447463326519" target="_blank" rel="noopener noreferrer">Start a WhatsApp conversation ↗</a></p></div><div><span class="eyebrow">THE RIGHT PLACE FOR YOUR QUESTION</span><dl class="contact-list"><dt>General &amp; company</dt><dd><a href="mailto:hello@voraleaf.com">hello@voraleaf.com</a></dd><dt>Business &amp; wholesale</dt><dd><a href="mailto:info@voraleaf.com">info@voraleaf.com</a></dd><dt>Customer care</dt><dd><a href="mailto:support@voraleaf.com">support@voraleaf.com</a></dd><dt>Men’s editions</dt><dd><a href="mailto:men@voraleaf.com">men@voraleaf.com</a></dd><dt>Women’s edition</dt><dd><a href="mailto:women@voraleaf.com">women@voraleaf.com</a></dd></dl><p>For order questions, include your selected edition and bundle size (1, 4, 12 or 20 boxes).</p></div></section>`;
}

function about(){
 return `${intro('OUR WORLD','Rooted in ritual.','VORALEAF brings botanical-inspired presentation to a proven vitality instant coffee formula, with illustrated paper envelopes and distinctive metallic inner sachets.')}
<img src="/assets/collection.webp" class="full-image" alt="BOLD and EMBER with gold inner sachets; BLOOM with rose-gold inner sachets" width="1600" height="1067">
${mensAndWomensVideoSection('All')}
${intimateSection()}
${aboutVitalitySection()}
${benefitsSection()}
${ingredientsSection()}
${certificationsSection()}
<section class="prose">
 <h2>Objects with a little presence.</h2>
 <p>We believe everyday moments deserve thoughtful presentation. The collection explores three different visual characters: obsidian-black BOLD 01, oxblood EMBER 02 and ivory-and-mulberry BLOOM 03. Each one starts a story before the cup reaches the table.</p>
 <h2>White-label botanical craftsmanship.</h2>
 <p>Our white-label herbal coffee blend is manufactured by DRS Secret Worldwide Manufacturing Sdn Bhd (George Town, Penang, Malaysia) under GMP, HACCP, HALAL and ISO 9001:2000 quality management systems, enhanced with our signature Mixed African Roots Bitter Herbs complex for the UK market.</p>
 <h2>Make your moment yours.</h2>
 <p>Explore the journal, save a story, step into the creator studio or <a data-link href="/collection">shop the collection</a>.</p>
</section>`;
}

function privacy(){
 return `${intro('GOOD TO KNOW','Your privacy. Your device.','A clear guide to how VORALEAF handles device storage, creator media and checkout.')}<section class="prose"><h2>What stays on this device</h2><p>Your shopping bag, saved story IDs, exercise-session selections, creator drafts, teleprompter text and preferences use browser storage on this device. Local drafts are not cloud-synced. Member-owned videos, social connection credentials and purchase entitlements use private server storage only when those services are configured. Social tokens are encrypted at rest and are never stored in browser preferences. The app cache stores site pages and imagery so previously visited content can work offline. Clearing your browser data removes local preferences and cached content; it does not delete server-stored member media or account connections.</p><h2>Payments &amp; Checkout (PayPal and Stripe)</h2><p>Checkout payments are processed server-side through PayPal and Stripe. Card and payment credentials are entered directly on PayPal or Stripe’s SSL-protected pages and are never stored in your browser or on VORALEAF servers.</p><h2>Camera and microphone</h2><p>The creator studio asks for camera and microphone access only when you press the camera button. Recording happens locally in your browser. Local recording stays on your device until you choose a sharing or publishing action. Member publishing and livestreams require server-verified purchase eligibility and configured services. You can download a clip to your device. Camera tracks stop when the studio closes or the tab is hidden.</p><h2>Contact links</h2><p>Email, telephone and WhatsApp links first open an in-app contact panel. You can copy the details or explicitly continue to the relevant service; no message is sent automatically. Those providers handle data under their own policies. Original instrumental tracks or your permission-confirmed local audio can accompany recordings. Supported music-service links load official players inside the VORALEAF source viewer after you choose to open them.</p><h2>Clear local site data</h2><p>Use the button below to remove this app’s bag, saved stories and creator drafts from browser storage and clear the app cache. Files you already downloaded remain on your device.</p><button class="button outline" id="clear-data">Clear VORALEAF device data</button></section>`;
}

function notFound(){return `<div class="not-found"><span class="eyebrow">A LITTLE DETOUR</span><h1>This moment<br>is elsewhere.</h1><p>That page could not be found.</p><a class="button" href="/" data-link>Return home ${arrow}</a></div>`}

let timerAudio=null;
function cleanupMedia(){
 if(timerAudio){timerAudio.pause();timerAudio=null}
}

function render({keepScroll=false}={}){
 cleanupMedia();
 window.VoraleafCreator?.cleanup();
 window.VoraleafFitness?.cleanup();
 window.VoraleafStudio?.cleanup();
 window.VoraleafAudio?.cleanup();
 if(timerId){clearInterval(timerId);timerId=null}
 remaining=120;
 const path=location.pathname.replace(/\/$/,'')||'/';
 let html,title;
 if(path==='/'){html=home();title='Vitality Roots Herbal Coffee · Make room for your moment'}
 else if(path==='/collection'){html=collection();title='The Collection & Multipack Bundles'}
 else if(path==='/intimate'){html=`${intro('SHARED PRESENCE & CONNECTION','Confidence for every moment together.','Celebrating modern love, 48-hour vitality and the shared ritual of BOLD 01, EMBER 02 and BLOOM 03.')}${intimateSection()}${mensAndWomensVideoSection('All')}${featuredBundlesSection()}`;title='Intimate Moments'}
 else if(path.startsWith('/products/')){const id=path.split('/')[2];const prod=products.find(p=>p.id===id);html=product(id);title=prod?`${prod.name} ${prod.number} · Roots Herbal Coffee`:'Edition'}
 else if(path==='/journal'){html=journal();title='The Journal'}
 else if(path.startsWith('/journal/')){const id=path.split('/')[2];html=article(id);title=articles.find(a=>a.id===id)?.title||'Story'}
 else if(path==='/movement'){html=movement();title='Move & unwind'}
 else if(path==='/fitness'||path.startsWith('/fitness/')){html=window.VoraleafFitness.render(path);title='Gym & exercise library'}
 else if(path==='/studio'){html=window.VoraleafStudio.render();title='Creator studio'}
 else if(path.startsWith('/watch/')){html=window.VoraleafCreator.renderWatch(path);title='Member screening room'}
 else if(path==='/bag'){html=bagPage();title='Your Bag & Secure Checkout'}
 else if(path==='/contact'){html=contact();title='Say hello'}
 else if(path==='/about'){html=about();title='Our World, Ingredients & Benefits'}
 else if(path==='/privacy'){html=privacy();title='Your privacy'}
 else{html=notFound();title='Page not found'}
 main.innerHTML=html;
 document.title=`${title} — VORALEAF`;
 $('#mobile-nav').hidden=true;
 $('#menu-toggle').setAttribute('aria-expanded','false');
 if(!keepScroll)window.scrollTo(0,0);
 if(path==='/studio'){window.VoraleafStudio.mount(main);window.VoraleafAudio?.mount(main);window.VoraleafCreator?.mount(main)}
 if(path.startsWith('/watch/'))window.VoraleafCreator?.mountWatch(main);
 if(path==='/fitness'||path.startsWith('/fitness/'))window.VoraleafFitness.mount(main);
 bindPage();
 $$('.desktop-nav a').forEach(a=>{if(a.pathname===path)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}

function navigate(url){filter='All';query='';checkoutNoticeState=null;history.pushState({},'',url);render();main.focus({preventScroll:true})}
document.addEventListener('click',e=>{if(e.defaultPrevented)return;const a=e.target.closest('a[data-link]');if(a&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();$$('dialog[open]:not([data-voraleaf-viewer])').forEach(d=>d.close());navigate(a.getAttribute('href'))}});
window.addEventListener('popstate',()=>{filter='All';query='';checkoutNoticeState=null;render()});

function addBundleToBag(editionId,boxCount,packFmt=format){
 const boxes=Math.max(1,Math.min(99,Number(boxCount)||1));
 const found=bag.find(i=>i.id===editionId&&i.format===packFmt);
 if(found)found.qty=Math.min(99,found.qty+boxes);
 else bag.push({id:editionId,format:packFmt,qty:boxes});
 updateBag();
}

function bindPage(){
 $$('.gallery-thumb').forEach(button=>button.onclick=()=>{const gallery=button.closest('[data-gallery]');const photos=galleryPhotos(products.find(p=>p.id===gallery.dataset.gallery));const selected=photos[Number(button.dataset.photo)];if(!selected)return;$('.gallery-main',gallery).src=selected[0];$('.gallery-main',gallery).alt=selected[1];$('.gallery-full',gallery).href=selected[0];$('.gallery-caption',gallery).textContent=selected[1];$$('.gallery-thumb',gallery).forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})});

 $$('#open-finder').forEach(b=>b.onclick=()=>finder(0));

 // Bundle edition switcher on Home/Collection
 $$('.bundle-edition-btn').forEach(btn=>{
  btn.onclick=()=>{
   featuredEdition=btn.dataset.edition;
   const y=window.scrollY;
   render({keepScroll:true});
   window.scrollTo(0,y);
   $$('.bundle-edition-btn').find(b=>b.dataset.edition===featuredEdition)?.focus({preventScroll:true});
  };
 });

 // Bundle cards Buy Now & Add to Bag
 $$('.buy-bundle-now').forEach(btn=>{
  btn.onclick=()=>{
   const ed=btn.dataset.edition||'bold';
   const boxes=Number(btn.dataset.boxes)||1;
   addBundleToBag(ed,boxes,'6x15g');
   navigate('/bag');
   toast(`Added ${boxes} box${boxes>1?'es':''} of ${ed.toUpperCase()} to your bag.`);
  };
 });
 $$('.add-bundle-bag').forEach(btn=>{
  btn.onclick=()=>{
   const ed=btn.dataset.edition||'bold';
   const boxes=Number(btn.dataset.boxes)||1;
   addBundleToBag(ed,boxes,'6x15g');
   toast(`Added ${boxes} box${boxes>1?'es':''} of ${ed.toUpperCase()} to your bag.`);
   btn.textContent='Added to Bag ✓';
  };
 });

 // Product detail bundle option selector
 $$('.bundle-option').forEach(btn=>{
  btn.onclick=()=>{
   selectedBundleBoxes=Number(btn.dataset.boxes)||1;
   const y=window.scrollY;
   render({keepScroll:true});
   window.scrollTo(0,y);
   $$('.bundle-option').find(b=>Number(b.dataset.boxes)===selectedBundleBoxes)?.focus({preventScroll:true});
  };
 });

 // Product detail Buy Now
 $$('.buy-now-product').forEach(btn=>{
  btn.onclick=()=>{
   const id=btn.dataset.id;
   const boxes=Number(btn.dataset.boxes)||selectedBundleBoxes||1;
   addBundleToBag(id,boxes,format);
   navigate('/bag');
  };
 });

 // Direct 5-video infinite loop in Hero section + speaker mute/unmute controls
 const setSoundBtnState=(btn,isMuted)=>{
  if(!btn)return;
  btn.innerHTML=isMuted?SPEAKER_MUTED_SVG:SPEAKER_UNMUTED_SVG;
  btn.classList.toggle('is-unmuted',!isMuted);
  btn.setAttribute('aria-pressed',String(!isMuted));
  btn.setAttribute('aria-label',isMuted?'Unmute video audio':'Mute video audio');
  btn.title=isMuted?'Unmute audio':'Mute audio';
 };

 const heroVid=$('#hero-video');
 const heroSoundBtn=$('.hero-sound-btn');
 if(heroVid&&heroPlaylist?.length){
  heroVid.muted=heroMuted;
  setSoundBtnState(heroSoundBtn,heroMuted);
  heroVid.play().catch(()=>{
   heroVid.muted=true;
   heroMuted=true;
   setSoundBtnState(heroSoundBtn,true);
   heroVid.play().catch(()=>{});
  });
  const advanceHeroVideo=()=>{
   heroVideoIdx=(heroVideoIdx+1)%heroPlaylist.length;
   const next=heroPlaylist[heroVideoIdx]||heroPlaylist[0];
   if(!next)return;
   heroVid.poster=next.poster||'/assets/coffee-hero.webp';
   heroVid.src=next.src;
   heroVid.muted=heroMuted;
   heroVid.load();
   const p=heroVid.play();
   if(p&&typeof p.catch==='function'){
    p.catch(()=>{
     heroVid.muted=true;
     heroMuted=true;
     setSoundBtnState(heroSoundBtn,true);
     heroVid.play().catch(()=>{});
    });
   }
  };
  heroVid.onended=advanceHeroVideo;
  heroVid.onerror=advanceHeroVideo;
 }

 $$('[data-video-mute]').forEach(btn=>{
  btn.onclick=()=>{
   const container=btn.closest('.hero,.edition-video-stage,.intimate-video-frame,.workout-video-stage,.fitness-hero-photo');
   const vid=container?.querySelector('video');
   if(!vid)return;
   const nextMuted=!vid.muted;
   if(!nextMuted){
    $$('video').forEach(other=>{
     if(other!==vid){
      other.muted=true;
      if(other.id==='hero-video')heroMuted=true;
     }
    });
    $$('[data-video-mute]').forEach(otherBtn=>{
     if(otherBtn!==btn)setSoundBtnState(otherBtn,true);
    });
   }
   vid.muted=nextMuted;
   if(vid.id==='hero-video')heroMuted=nextMuted;
   if(vid.paused)vid.play().catch(()=>{});
   setSoundBtnState(btn,nextMuted);
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
 $$('.add-to-bag').forEach(b=>b.onclick=()=>{const boxes=Number(b.dataset.boxes)||selectedBundleBoxes||1;addBundleToBag(b.dataset.id,boxes,format);toast(`Added ${boxes} box${boxes>1?'es':''} to your bag. Open Bag to checkout.`);b.textContent=`Added ${boxes} Box${boxes>1?'es':''} ✓`});
 $$('.qty').forEach(b=>b.onclick=()=>{const i=bag.find(i=>`${i.id}-${i.format}`===b.dataset.key);i.qty=Math.max(0,Math.min(99,i.qty+Number(b.dataset.delta)));bag=bag.filter(i=>i.qty);updateBag();render({keepScroll:true})});
 $$('.bag-preset-btn').forEach(b=>b.onclick=()=>{const i=bag.find(i=>`${i.id}-${i.format}`===b.dataset.key);if(!i)return;i.qty=Math.max(1,Math.min(99,Number(b.dataset.setQty)||1));updateBag();render({keepScroll:true})});
 $$('.remove-item').forEach(b=>b.onclick=()=>{bag=bag.filter(i=>`${i.id}-${i.format}`!==b.dataset.key);updateBag();render({keepScroll:true})});

 // PayPal & Stripe server-side checkout handlers
 async function startProviderCheckout(provider,btn){
  const emailInput=$('#checkout-email');
  const customerEmail=emailInput?emailInput.value.trim():'';
  if(customerEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)){
   toast('Please enter a valid email address for your order receipt.');
   emailInput.focus();
   return;
  }
  btn.disabled=true;
  btn.setAttribute('aria-busy','true');
  const originalLabel=btn.innerHTML;
  const labelName=provider==='paypal'?'PayPal':'Stripe';
  btn.textContent=`Connecting to ${labelName}…`;
  try{
   const endpoint=provider==='paypal'?commerce.paypal.endpoint:commerce.stripe.endpoint;
   const res=await fetch(endpoint,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({items:bag,customerEmail})
   });
   const data=await res.json().catch(()=>({}));
   if(res.ok&&data.url){
    window.location.assign(data.url);
    return;
   }
   if(res.ok&&data.checkoutUrl&&data.fields){
    const form=document.createElement('form');
    form.method='POST';
    form.action=data.checkoutUrl;
    form.target='_blank';
    Object.entries(data.fields).forEach(([k,v])=>{
     const input=document.createElement('input');
     input.type='hidden';
     input.name=k;
     input.value=String(v);
     form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    form.remove();
    return;
   }
   checkoutNoticeState={
    title:`${labelName} Checkout`,
    message:data.message||`${labelName} checkout is connected. Retail pricing is being finalised—send your order confirmation request below and our team will confirm your bundle.`
   };
   render({keepScroll:true});
   toast(`${labelName} order confirmation ready below.`);
  }catch{
   checkoutNoticeState={
    title:`${labelName} Checkout`,
    message:`${labelName} checkout is connected. Send your order confirmation request below and our team will confirm your bundle.`
   };
   render({keepScroll:true});
  }finally{
   if(btn.isConnected){
    btn.disabled=false;
    btn.removeAttribute('aria-busy');
    btn.innerHTML=originalLabel;
   }
  }
 }

 const paypalBtn=$('#paypal-checkout-btn');
 if(paypalBtn)paypalBtn.onclick=()=>startProviderCheckout('paypal',paypalBtn);

 const stripeBtn=$('#stripe-checkout-btn');
 if(stripeBtn)stripeBtn.onclick=()=>startProviderCheckout('stripe',stripeBtn);

 $('#checkout-order-request')?.addEventListener('click',()=>{
  const url='mailto:hello@voraleaf.com?subject='+encodeURIComponent('VORALEAF UK — Order Confirmation Request')+'&body='+encodeURIComponent(enquiryText('Order Confirmation Request'));
  if(window.VoraleafViewer)window.VoraleafViewer.open({url,title:'VORALEAF Order Confirmation Request'});
 });

 $('#email-enquiry')?.addEventListener('click',()=>{
  const url='mailto:hello@voraleaf.com?subject='+encodeURIComponent('VORALEAF UK Order & Wholesale Enquiry')+'&body='+encodeURIComponent(enquiryText('Order Enquiry'));
  if(window.VoraleafViewer)window.VoraleafViewer.open({url,title:'Your VORALEAF order summary'});
  else toast('The enquiry viewer is unavailable. Download your order summary instead.');
 });
 $('#download-enquiry')?.addEventListener('click',()=>download(enquiryText('Order Summary'),'VORALEAF_UK_Order_Summary.txt'));
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

function enquiryText(kind='Order Summary'){
 const totals=calcCartTotals();
 const email=$('#checkout-email')?.value?.trim();
 return `Hello VORALEAF UK,\n\n${kind}:\n\n${bag.map(i=>{const p=products.find(p=>p.id===i.id);const line=calcLineBreakdown(i.qty,i.format);return `• ${p.name.toUpperCase()} ${p.number} (${i.format==='6x15g'?'6 × 15 g / 90 g':'10 × 10 g / 100 g'}) — ${i.qty} box${i.qty>1?'es':''} [${line.summary}, ${line.totalSachets} sachets]`;}).join('\n')}\n\nTotal Selection: ${totals.totalBoxes} box${totals.totalBoxes>1?'es':''} (${totals.totalSachets} sachets)${email?`\nCustomer Email: ${email}`:''}\n\n${$('#enquiry-note')?.value||'Please confirm dispatch and order details.'}\n\nThank you.`;
}

function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function finder(step,chosen){const d=$('#ritual-dialog');if(!d.open)d.showModal();const c=$('#ritual-content');if(step===0){c.innerHTML='<span class="eyebrow">THE RITUAL FINDER · 01 / 02</span><h2>What does your<br>moment look like?</h2><div class="ritual-choices"><button data-mood="bold">A quiet morning. Obsidian black, champagne gold &amp; 48-hour confidence.</button><button data-mood="ember">A moment with presence. Rich oxblood, warm copper &amp; lasting stamina.</button><button data-mood="bloom">A little elegance. Soft ivory, mulberry &amp; rose gold.</button></div><p class="status-note" style="margin-top:20px">All three editions share our signature white-label botanical &amp; African bitter roots formula.</p>';$$('[data-mood]',c).forEach(b=>b.onclick=()=>finder(1,b.dataset.mood))}else{const p=products.find(p=>p.id===chosen);c.innerHTML=`<span class="eyebrow">YOUR VISUAL MATCH · 02 / 02</span><h2>Your kind of moment:<br>${p.name} ${p.number}.</h2><p>${p.description}</p><p class="status-note">Available in 1, 4, 12 and 20-box bundles. Review full ingredients and directions before use.</p><a class="button" data-link href="/products/${p.id}">Explore ${p.name} ${arrow}</a><button class="text-button" id="finder-restart" style="margin:25px">Start again</button>`;$('#finder-restart').onclick=()=>finder(0)}}
$('#menu-toggle').onclick=()=>{const n=$('#mobile-nav');n.hidden=!n.hidden;n.style.top=`${$('.site-header').getBoundingClientRect().bottom}px`;$('#menu-toggle').setAttribute('aria-expanded',String(!n.hidden))};
$$('.search-open').forEach(b=>b.onclick=()=>{$('#search-dialog').showModal();globalResults('');$('#global-search').focus()});
function globalResults(q){
 const ql=q.toLowerCase();
 const a=articles.filter(a=>(a.title+' '+a.category).toLowerCase().includes(ql));
 const p=products.filter(p=>(p.name+' '+p.edition+' '+p.description+' coffee tongkat ginseng african roots').toLowerCase().includes(ql));
 const ing=ingredients.items.filter(item=>(item.name+' '+item.latin+' '+item.points.join(' ')).toLowerCase().includes(ql));
 $('#global-results').innerHTML=
  p.map(p=>`<a class="search-result" href="/products/${p.id}" data-link><small>The collection · 6 × 15 g or 10 × 10 g</small>${p.name} ${p.number} · ${p.edition}</a>`).join('')+
  ing.map(i=>`<a class="search-result" href="/about" data-link><small>Ingredients &amp; Process · ${safe(i.latin)}</small>${safe(i.name)}</a>`).join('')+
  a.map(a=>`<a class="search-result" href="/journal/${a.id}" data-link><small>The journal · ${a.category}</small>${a.title}</a>`).join('')||
  '<p style="padding-top:20px">No results yet. Try “Tongkat Ali”, “African roots”, “coffee” or “bundle”.</p>';
}
$('#global-search').oninput=e=>globalResults(e.target.value);

$$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
$('#install-app').onclick=async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null}else toast('Use your browser menu → Install app / Add to Home Screen. Availability depends on your browser.')};
function connection(){ $('#connection-status').textContent=navigator.onLine?'A moment, wherever you are.':'Offline · previously visited content is available.'}
addEventListener('online',connection);addEventListener('offline',connection);connection();
if('serviceWorker'in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}
updateBag();render();
})();
