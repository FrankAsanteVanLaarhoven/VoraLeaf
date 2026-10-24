# VORALEAF creator studio integration

Implementation supplement · 24 October 2026

This supplement supersedes earlier blueprint descriptions of creator publishing as entirely future work. Local recording, original music, member-service handlers and distribution controls are implemented. Merchant checkout, account credentials, provider approval and paid live delivery are not activated. No real social post, payment, livestream or connected account was created during development.

## Identity and purchase eligibility

Sites dispatch supplies the trusted `oai-authenticated-user-id` header after authenticating the visitor. This app does not introduce a parallel login stack. A portable deployment must put an authenticated gateway in front of the Worker, remove arbitrary incoming identity headers, and inject only a verified account identity. Do not expose the local Node preview as a public production server or trust a browser-supplied identity header.

Publishing, account connection, member video access and live creation require an authenticated account with either a verified qualifying paid product purchase or a current paid recurring subscription. Recording, preview and local download remain available for rehearsal. A browser toggle, an enquiry bag, a checkout redirect or a claimed email address cannot grant membership.

The following are server-only values; use private runtime environment settings, never public JavaScript or Git:

| Setting/binding | Purpose |
| --- | --- |
| `DB` | D1-compatible database binding with prepared statements and batch support |
| `BUCKET` | Private R2-compatible media bucket binding |
| `STRIPE_SECRET_KEY` | Read current merchant payment/subscription state |
| `STRIPE_WEBHOOK_SECRET` | Verify raw-body Stripe event signatures |
| `STUDIO_MEMBERSHIP_BINDING_SECRET` | Independent high-entropy secret, at least 32 characters, for account/payment binding |
| `VORALEAF_STRIPE_PRICE_IDS` | Comma-separated allowlist of qualifying `price_…` product or recurring Price IDs |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Registered Google OAuth application for channel connection/upload |
| `STUDIO_TOKEN_ENCRYPTION_KEY` | Base64-encoded random 32-byte AES key for stored OAuth and WHIP credentials |
| `CLOUDFLARE_ACCOUNT_ID`, `STREAM_API_TOKEN` | Paid Stream account and suitably scoped server API token |
| `STREAM_SIGNING_KEY_ID`, `STREAM_SIGNING_KEY_JWK` | Stream RSA signing key ID and private JWK, raw JSON or base64 JSON, for member playback tokens |

`YOUTUBE_API_KEY` remains a separate fitness search credential. It cannot authorise posting to a user's channel. `RAPIDAPI_KEY` is used only by the original ExerciseDB adapter.

### Trusted checkout contract

The current storefront creates enquiries, not Stripe checkout sessions. A merchant integration must create sessions server-side for the signed-in account. Use `createMembershipIdentitySignature(userId, env)` from `server/membership.mjs` inside that trusted server; never expose an endpoint that signs a caller-chosen identity.

For a one-time payment, the Stripe Checkout Session must carry:

- `client_reference_id` equal to the verified Sites user ID;
- `metadata.voraleaf_user_id` equal to that same ID;
- `metadata.voraleaf_identity_signature` equal to the server HMAC result;
- qualifying allowlisted line-item Price IDs.

For recurring payments, put the same signed identity metadata on the Stripe Subscription (for example via trusted Checkout `subscription_data.metadata`) and use an allowlisted recurring Price. The invoice must be paid, the subscription active and its paid period current. Do not put identity signatures or these secrets into client-created metadata.

The webhook re-fetches provider objects and validates payment/line-item/account binding rather than trusting an event's claimed success. It checks Stripe HMAC signatures with a five-minute timestamp tolerance, bounds input size, deduplicates event IDs and prevents older grant events from overriding newer revocations. Refunds, disputes, failed invoices and cancelled/paused/non-active subscriptions revoke affected access. If an old refunded invoice cannot be joined precisely, the implementation conservatively suspends that customer's grants for reconciliation.

Endpoint: `POST /api/studio/webhooks/stripe`. Configure the relevant payment, invoice, subscription, refund and dispute event types handled in `server/membership.mjs`. Test signed events using a merchant test environment before live payments.

**Private-host delivery:** the owner-private Sites audience prevents an ordinary unauthenticated Stripe webhook from reaching the application. A supported authenticated relay/service route is required while the site stays private. Preserve the raw request body and `Stripe-Signature` for verification. Do not make the site public or bypass audience protection merely to make a webhook appear successful.

## Schema and storage

`migrations/0001_creator.sql` defines purchase grants/provider event deduplication. `0002_creator_services.sql` defines OAuth states, encrypted social connections, creator assets and live sessions. `npm run db:generate` copies immutable schema-only SQL into `drizzle/` and maintains the deployment journal; managed packaging carries these migrations to deployment. Add a new migration instead of editing a previously journalled SQL file. Schema changes do not run inside normal HTTP requests.

Recordings are initially private R2 objects. Their database rows identify the owner and visibility. Media endpoints check eligible membership and owner/member visibility and return `Cache-Control: no-store`; API/media paths are excluded from the PWA cache. The interface does not imply that a private upload has been shared. Storage retention, creator deletion tools, reporting and operational review processes should be established before a public community launch; they are not claimed as completed features.

## API contracts

All mutation requests originate from the application, carry the expected same-origin checks and remain subject to server membership/ownership checks. The following is a developer overview; source handlers are authoritative.

| Route | Behaviour |
| --- | --- |
| `GET /api/studio/membership` | Authenticated eligibility/tier/configuration status; no public user ID field |
| `GET /api/studio/config` | Membership plus actual provider/storage/live configuration and YouTube connection state |
| `GET /api/studio/oauth/youtube/start` | Starts member-owned OAuth consent with expiring, single-use state and PKCE |
| `GET /api/studio/oauth/youtube/callback` | Validates state/account, exchanges code and encrypts tokens at rest |
| `POST /api/studio/oauth/youtube/disconnect` | Owner disconnect/revocation; requires signed-in identity even if purchase access has expired |
| `POST /api/studio/uploads` | Raw MP4/WebM, encoded `X-Video-Title`, `X-Video-Clean`; maximum 20 MiB, bounded stream and container signature checks; private result |
| `GET /api/studio/assets` | Member's own latest asset metadata |
| `GET /api/studio/assets/:id/media` | Authorised private/member media, byte-range support, no-store |
| `POST /api/studio/assets/:id/publish` | Owner explicitly sends `{visibility:"members",confirm:true}`; rejected media cannot be shared |
| `POST /api/studio/youtube/upload` | Owner sends `{assetId,title,privacy,confirm:true}`; private default, connected account and clean attestation required |
| `POST /api/studio/live/create` | Eligible owner creates an on-platform room with title/optional ad settings; returns owner-only WHIP input and watch path |
| `GET /api/studio/live/:id` | Eligible viewer receives short-lived signed WHEP playback metadata |
| `POST /api/studio/live/:id/stop` | Owner deletes the remote input and ends room; remains allowed after purchase access expires |
| `GET /api/studio/watch/:id` | Eligible viewer receives authorised live or recording metadata |

A `clean_attested` asset records the creator's clean-export declaration; it is not server video inspection or independent verification. Published member recordings are member-created and not automatically approved by VORALEAF. A pending-review row can be shared by its owner unless rejected; there is no invented mandatory approval workflow.

## YouTube and other social destinations

Register the exact HTTPS callback `https://<site-origin>/api/studio/oauth/youtube/callback` in Google Cloud. Enable YouTube Data API v3, configure OAuth consent, and obtain any required app verification, audit or channel eligibility. Scopes are `youtube.upload` and `youtube.readonly`; account tokens are AES-GCM encrypted and bound to the user/provider. Private is the default upload visibility. The creator must confirm the selected destination and privacy before a request is sent. Provider account approval and quotas are not verified by fixture tests.

Instagram and TikTok use device sharing of a clean take where the browser supports it; Twitch offers a clean clip export. They are not represented as connected accounts, automatic posts or live simulcasts. Native provider applications/review would be separate integrations. User permission to open a profile or music link is not OAuth consent.

Social exports exclude automated VORALEAF commercial breaks. YouTube's advertising rules and other destinations' publishing rules differ, so the app does not promise identical commercial insertion across platforms.

## On-platform live and optional breaks

The current live implementation uses Cloudflare Stream WHIP publishing and WHEP playback through browser WebRTC. It requires paid Stream configuration, server-side input creation, AES-encrypted input credentials and locally signed RS256 viewer JWTs lasting five minutes. Viewer responses never expose the WHIP publishing credential. Live inputs require signed playback URLs and allow the application's origin.

This path does not provide HLS/RTMP/SRT simulcasting, cloud recording or viewer counts. A recording is a separate browser take. There is no fabricated audience number. Broadcast state follows peer connection state; the ad timer begins only once connected.

Creators can leave automated breaks off (the default), choose supported intervals/durations and preview a labelled VORALEAF break. The browser composites edition artwork into on-platform video and ducks mixed music to 25% during a break. Direct-camera fallback cannot composite advertisements and is reported as clean. Social exports use the separate clean path.

Active broadcasts recheck membership every 60 seconds and close local output/remote input if verification is lost. Local cleanup releases only that controller's captured output. Failed remote stops retain a retryable room ID rather than claiming success. Returning signed-in owners can retry cleanup even after membership expires. An already-connected viewer is not guaranteed immediate disconnection when membership changes; the five-minute JWT prevents new unauthorised joins after expiry but does not itself end an established WebRTC session. Stronger immediate viewer revocation would need additional provider/session enforcement.

## Audio and recording behaviour

`Golden Hour`, `Meadow` and `Quiet Roots` are original deterministic procedural compositions, each 36 seconds, 44.1 kHz stereo MP3. They use plucked/acoustic-like synthesis with a country-inspired feel, not third-party samples or claimed clinical music therapy. Playback starts from a user gesture. The generator is `scripts/generate-studio-audio.py`; attribution and asset metadata are in `public/assets/audio/audio-manifest.json`.

Users control volume, looping and inclusion in recordings. A supported local audio file up to 25 MiB can be selected after a rights confirmation; the mixer does not upload that source file by itself. Browser Web Audio mixes the selected permitted audio with cloned microphone tracks, without monitoring the microphone through speakers. Use headphones to reduce acoustic pickup. Playback controls cannot establish music licensing.

Supported Spotify, Apple Music, YouTube and SoundCloud links open official players inside the VORALEAF source viewer. Bandcamp needs its official embed link for reliable playback. The viewer can restore from fullscreen to a smaller resizable window while the studio remains in place. Their catalogues are not downloaded, captured, mixed, synchronised to video or rebroadcast by this app. A streaming subscription is not a video/broadcast licence.

Local takes support 20/60/120 seconds and stop at a 64 MiB browser safety limit. The stricter platform upload limit is 20 MiB; longer takes may need a shorter recording or future export compression. MP4/WebM support and 16:9/9:16 canvas capture vary by browser. Camera/microphone hardware permissions and actual device encoder compatibility need real-device testing.

## Validation and activation checklist

The development fixtures cover signed payment/account binding, repeat/out-of-order events, refunds, recurring expiry, OAuth state/PKCE/encryption, missing membership/configuration, bounded uploads including dishonest lengths, ownership, explicit publish confirmation, signed WHEP tokens, secret non-disclosure and owner cleanup after expiry. Browser-controller VM checks also cover remote-stop retry, late callbacks after navigation and membership loss during broadcasting. These are controlled tests, not claims that real merchant/provider integrations are connected.

Before activating members, verify:

1. Trusted identity reaches the Worker and spoofed public identity headers cannot reach it.
2. DB migrations and the private BUCKET binding are active; all secrets remain server-side.
3. A test merchant checkout binds the signed-in ID and a signed event reaches the private deployment through the supported relay.
4. Qualifying purchase/paid recurring access succeeds; unrelated prices, refunds and expired plans fail closed.
5. An eligible test account completes Google consent, uploads privately, disconnects and sees correct provider errors.
6. A paid Stream test room publishes and plays for a second eligible account; nonmembers cannot obtain playback; room stop and retry actually delete the input.
7. Real devices release hardware on navigation, record usable clips, mix only permitted audio and export clean social versions.
8. The intended community retention/reporting operations and commercial product information are ready before a separate public launch.

## Primary provider references

- Cloudflare Stream WebRTC: https://developers.cloudflare.com/stream/webrtc-beta/
- Cloudflare signed playback URLs: https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/
- Google OAuth web-server flow: https://developers.google.com/identity/protocols/oauth2/web-server
- YouTube video upload: https://developers.google.com/youtube/v3/docs/videos/insert
- YouTube paid product placement/advertising guidance: https://support.google.com/youtube/answer/154235
- Stripe webhook signatures: https://docs.stripe.com/webhooks/signature
- Spotify developer policy: https://developer.spotify.com/policy

Provider documentation and account requirements can change; verify the intended live account setup before activation.
