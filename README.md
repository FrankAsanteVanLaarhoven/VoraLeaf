# VORALEAF

**Roots herbal coffee. A world of little rituals.**

A responsive coffee collection and editorial PWA with three product editions, individual sachet galleries, searchable stories, an interactive exercise library and a creator studio for recording, original music and member media.

[Private review site](https://voraleaf-ritual.favl.chatgpt.site) · [Creator studio setup](docs/CREATOR_STUDIO.md) · [Seedance 2.5 film brief](docs/SEEDANCE_2_5_BRIEF.md)

The hosted review remains restricted to its owner's ChatGPT account. Publishing source does not change the hosted audience. Commerce and external creator services still require merchant and provider configuration; their controls report unavailable states rather than simulating success.

## Run locally

Use Node.js 22 or later. The starter collection, sourced exercise library, local studio and original instrumentals need no provider credentials.

```bash
npm run check
npm run dev
```

Open `http://localhost:3000`. Use `npm run dev -- --port 8080` for another port. The development server binds to localhost by default. To load local provider configuration, copy `.env.example` to `.env`, set only the needed server values, then run `npm run dev:api`. Never commit credentials.

```bash
npm run build
npm run preview
```

The static build copies `public/` to `dist/`. Deploy it at the **domain root** with an `index.html` fallback for dynamic exercise and watch routes. Static hosting does not run the API, purchase verification, account connection, uploads or live rooms. The app uses root-relative paths and is not configured for GitHub Pages' `/VoraLeaf/` project subpath.

`npm run build:worker` prepares schema migrations and builds the app and API as a standalone Worker. Managed Sites hosting supplies trusted identity, D1 and R2. An alternative host must implement an authenticated identity boundary and suitable storage bindings before enabling member services; simply accepting the `oai-authenticated-user-id` header from the public internet is unsafe. The local Node server is a development preview, not a public identity gateway.

## Included experience

| Area | Included |
| --- | --- |
| Collection | BOLD 01 and EMBER 02 men's editions; BLOOM 03 women's edition |
| Product pages | Proposed 6 × 15 g / 90 g and 10 × 10 g / 100 g formats; interactive sachet and hand-held concept galleries |
| Packaging visuals | Five new photographs showing separate paper envelopes, sealed metallic inner pouches, opening, holding and water pouring; gold men's pouches and rose-gold BLOOM pouches |
| Enquiries | Local bag, quantities, email draft and text export; no checkout or payment |
| Journal | Six complete articles, search, categories, saved reading and sharing |
| Gym & exercises | Twelve NHS-sourced starter movements, filters, search, pagination, detail pages, curated videos, session notes/export and rest timer |
| Fitness API | Server-side original ExerciseDB RapidAPI and YouTube search adapters, protected GIF proxy, timeouts, bounded responses and missing-key fallback |
| Rituals | Visual preference finder and a two-minute pause timer |
| Local studio | User-initiated camera/microphone access; 20, 60 or 120-second takes; 16:9 or 9:16 where supported; preview/download, teleprompter and local writing drafts |
| Music | Three original 36-second country-inspired procedural instrumentals; level, loop and recording-mix controls; rights-confirmed local audio files; official music-service embeds in the in-app source viewer |
| Member services | Server purchase verification, private video storage, explicit sharing to members, YouTube OAuth/upload adapter and on-platform WHIP/WHEP live rooms; provider configuration required |
| Optional advertising | Clearly labelled on-platform VORALEAF breaks, disabled by default, with music ducking; separate clean social exports |
| PWA | Manifest, install guidance, offline app shell and visited content cache; member API/media responses remain outside the service-worker cache |
| Motion | Existing 24-second animated-still study; a separate Seedance 2.5 brief and reference assets, awaiting a connected rendering account |

## Project layout

```text
public/       Website, studio modules and optimised visual/audio assets
server/       Fitness, membership and creator-service handlers
tests/        Controlled API fixture tests
migrations/   Source schema-only SQL migrations
drizzle/      Prepared migrations and deployment journal
scripts/      Preview server, integrity checks, builds and audio generator
docs/         Integration and film supplements
```

The app uses plain HTML, CSS and JavaScript. `public/data.js` holds product/editorial content; `public/app.js` handles routing. `public/studio.js`, `studio-audio.js` and `creator-hub.js` implement recording, mixing and member distribution. `public/source-viewer.js` wraps supported embeds, source pages, own images and contact drafts inside the app. The portable source export excludes account-specific Sites hosting state and secrets.

## Validation and setup

`npm test` exercises fitness adapters, signed payment events, account binding, entitlement revocation, OAuth state/token storage, bounded uploads, media ownership, explicit publishing confirmation and signed live playback with controlled fixtures. `npm run build:worker` additionally checks the compiled Worker and embedded media. These tests do not prove live provider credentials, merchant configuration, hardware capture or account approval.

`npm run check` validates JavaScript syntax, product/content identifiers, route entry consistency, assets, both pack formats, manifest icons, offline paths and the existing video container. Desktop and 390 px layouts and the original local interactions were checked during development. Hardware recording, real-device PWA upgrades, provider account approvals and end-to-end live delivery need acceptance testing with the intended accounts and devices.

For live exercise search, subscribe to `exercisedb.p.rapidapi.com` and set `RAPIDAPI_KEY`. Enable YouTube Data API v3 and set `YOUTUBE_API_KEY` for dynamic related-video search. The latter is separate from OAuth credentials needed to publish to a channel. Without these keys, the sourced starter exercises and curated video links remain available. Provider data/media are fetched afresh and excluded from PWA caches.

For member services, follow [CREATOR_STUDIO.md](docs/CREATOR_STUDIO.md). Set merchant Price IDs and signed identity binding in a trusted checkout, deliver verified Stripe events, apply the D1 migrations, and configure R2, Google OAuth and Cloudflare Stream as needed. The current enquiry bag does not create a checkout session. A private Sites audience also prevents ordinary public Stripe webhook delivery: arrange an authenticated relay/service route before expecting payment events, while preserving the private audience.

## Product and launch status

This is a **collection preview**. Formulas, ingredients, allergens, nutrition, caffeine, sugar, preparation directions, prices, availability and delivery terms are unconfirmed. Edition labels do not establish sex-specific effects. Halal coverage and organic or disposal wording need product-specific evidence before release.

No merchant checkout, social account connection or paid streaming service has been activated. The implemented backend fails closed where configuration or verified membership is missing. Instagram, TikTok and Twitch are presented honestly as device sharing/export or pending provider integrations; a profile link is not an OAuth account connection. The current live path serves eligible viewers inside VORALEAF and does not simulcast to social channels.

The existing hero video is an animated-still concept, not filmed footage or a Seedance output. No Seedance 2.5 video has been rendered. The [new film brief](docs/SEEDANCE_2_5_BRIEF.md) specifies the requested model and reference frames. The creator supplement supersedes earlier blueprint descriptions of creator publishing as wholly future work; the earlier product, merchant and launch evidence gates remain applicable.

## Privacy and media rights

Saved reading, bag contents, teleprompter text and writing drafts use browser storage. Camera and microphone start only on request. Local recordings stay on the device until the creator explicitly uploads, shares or broadcasts. Member uploads are private initially; sharing to eligible members or YouTube requires an explicit action. Leaving the studio closes local media resources. Downloaded files remain on the device.

Original instrumentals use procedural synthesis, without third-party samples. Users can mix a local file only after confirming rights. Supported music-service links open official players in the in-app source viewer. The viewer opens fullscreen and can restore to a smaller resizable window. Provider audio is never extracted, mixed into studio takes or rebroadcast. Bandcamp requires an official embed link for reliable playback; arbitrary provider pages may refuse framing. YouTube and other required player marks stay visible; OAuth consent and explicit email/phone handoffs use their secure/native flows. A streaming subscription does not provide broadcast or synchronisation rights.

Use HTTPS for production permissions and PWA support. Increment the service-worker cache version after changing cached assets. Existing tabs can retain an older worker until closed. `public/robots.txt` disallows indexing during review; change it only for an approved public launch.

Editorial and packaging images are illustrative AI-generated concepts, not customer testimonials, medical evidence or recorded live action. The user-supplied horse badge is brand artwork, not an independent certification. Confirm its rights and production artwork before commercial printing. The JavaScript Mastery fitness tutorial inspired the discovery flow; no tutorial code, media or credentials were copied. No open-source licence has been selected.

## Contact

VORALEAF · **hello@voraleaf.com**  
Telephone / WhatsApp Business: **+44 7463 326519**  
294 Coldharbour Lane, London, SW9 8SE, United Kingdom

## In-app source viewer

The [source-viewer supplement](docs/SOURCE_VIEWER.md) documents supported embed formats, fullscreen/window controls, provider attribution and framing limits. The app does not strip third-party player branding or bypass authentication/frame protections.

The current packaging descriptor is **ROOTS HERBAL COFFEE**. Collection cards and product details show open cartons, individual paper envelopes and their separate gold/rose-gold pouches in both proposed formats. See [packaging update](docs/PACKAGING_UPDATE.md) for current artwork status; this supersedes singular wording in archived proposal PDFs.
