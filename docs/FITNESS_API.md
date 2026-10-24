# VORALEAF gym and exercise integration

24 October 2026. This supplement updates the fitness implementation described as future work in the original web blueprint.

## What changed

The initial site had a lifestyle page but omitted the tutorial's exercise-discovery flow. The current implementation adds `/fitness`, exercise detail routes, body-area and equipment filters, search, pagination, related movements, a local session notebook and video links. It retains the VORALEAF product pages and visual identity.

There are 12 independently paraphrased NHS-sourced starter movements and six curated YouTube references. Their presence does not mean NHS endorsement of VORALEAF. The body diagrams are original focus-area illustrations, not demonstrations of technique. Coffee is not presented as a treatment for fatigue, breathlessness, weight or sexual concerns.

## Connection status

| Component | Implemented | Requires configuration |
| --- | --- | --- |
| Search, body/equipment filters, pagination | Browser interface and local starter library | None for starter content |
| Details, sources, related starter movements | Browser interface and direct routes | None |
| My session, user counts, export, optional timer | Browser-local notebook | None |
| Known YouTube videos | Click-to-load privacy-enhanced player and external watch links | Embedding remains subject to publisher/browser availability |
| Extended ExerciseDB list/detail and GIFs | Server adapter and same-origin image proxy | Valid original-provider RapidAPI subscription and `RAPIDAPI_KEY` |
| Dynamic related-video search | Official YouTube Data API server adapter | Enabled Google Cloud project and `YOUTUBE_API_KEY` |

No real provider keys were available during the build. The API adapter was tested using controlled fixtures, including failures; those tests do not establish live account, subscription, quota or production-feed availability. Missing credentials return a clear 503 response, and the browser shows its labelled starter content.

## Provider identity and API contract

The tutorial at https://www.youtube.com/watch?v=KBpoBc98BwM uses the original ExerciseDB service at `exercisedb.p.rapidapi.com`. AscendAPI's similarly named free service is a different provider and was not substituted.

| VORALEAF route | Upstream operation |
| --- | --- |
| `GET /api/fitness/exercises?search=&bodyPart=&equipment=&limit=6&offset=0` | Original `/exercises`, `/name/{name}`, `/bodyPart/{part}` or `/equipment/{equipment}` |
| `GET /api/fitness/exercises/{id}` | `/exercises/exercise/{id}` |
| `GET /api/fitness/image/{id}?resolution=180` | `/image?exerciseId={id}&resolution=180` with a server-side key header |
| `GET /api/fitness/videos?query=...` | YouTube v3 `search.list`, video-only, embeddable, syndicated and strict-safe-search parameters |

The adapter limits exercise pages to 1–10 results and bounds offsets at 2,000. It returns `total: null`; a full provider page only suggests that another may exist. Combined filters beyond the upstream primary query apply to the fetched page and are labelled accordingly. It does not invent a database-wide result count. At the bounded pagination window, refine the search rather than inferring the provider's dataset has ended.

All origins are fixed in server code. Client-provided URLs are rejected. Requests have an eight-second budget. JSON is limited to 2 MiB and image responses to 5 MiB, with content-type and signature validation. Authentication failures and upstream errors are redacted. No key is returned to the browser or committed to the repository.

## Run and activate

1. `npm run dev` serves the complete app with the starter library and the API's missing-key responses.
2. Copy `.env.example` to `.env` in your local checkout. Add credentials in that local file or the host's private environment-variable interface.
3. `npm run dev:api` loads the local environment file. Never place keys in `public/`, HTML, URL examples or browser storage.
4. `npm run build:worker` produces `dist/server/index.js`, a self-contained Worker with embedded static assets and the API handler. Configure the two server environment variables on the Worker host. For Sites, keep the original private project identity and remove the old static-directory declaration during the migration.
5. Check an actual successful list, detail, animated image and related-video search against the subscribed plan before describing the extended feed as live.

## Storage, privacy and terms

ExerciseDB's current terms prohibit caching. API responses and provider media have `Cache-Control: no-store`; browser requests use no-store and the service worker excludes `/api/`. Transient display state is cleared on route exit. The session notebook stores chosen identifiers and the user's own counts, not provider instructions, descriptions or media. Live-session export contains references and user counts rather than a provider-data copy.

Known YouTube embeds are created only after the visitor chooses to load them. The player is at least 200 × 200 pixels and keeps a watch-on-YouTube fallback. Dynamic video discovery sends the exercise query through the server. An API key permits search; it does not grant ownership of third-party footage.

This implementation does not subscribe to a paid plan, accept provider terms for the owner, bypass a provider restriction, scrape YouTube, download workout footage or expose keys. Confirm that the chosen account and licence cover the final public product before activating a public feed.

## Validation and next acceptance tests

The working hypothesis is that visitors can find a suitable movement reference and save it to their own notebook without confusing it with a coffee benefit. Validation uses artifact consistency checks, 13 server-adapter tests, Worker route tests and browser interaction checks. The original failure was a missing exercise section; the refinement restores its search-to-detail-to-video progression with honest data provenance.

| Target | Measure | Acceptance window |
| --- | --- | --- |
| Correct filtering | 10 representative seed searches/filters return expected matches and empty states | Before merge/release |
| Private credentials | Zero provider-key occurrences in served assets or browser requests | Each release |
| Safe failure handling | All 13 controlled API cases pass, with no indefinite loading state | CI on each push |
| Real live integration | Four subscribed-plan checks: list, detail, GIF and related-video search | Before live-feed activation |
| Usable discovery | At least 4 of 5 representative users find and save a movement within 60 seconds | Within one week of user testing; target, not an observed result |

Remaining experiments include mobile filter use, assistive-technology navigation, offline starter access, worker upgrades, publisher-blocked video fallback and actual provider quota/authentication behaviour. No sales, health or retention improvement has been established.

## Primary sources reviewed

- https://edb-docs.up.railway.app/docs/exercise-service/exercises
- https://edb-docs.up.railway.app/docs/exercise-service/exercise
- https://edb-docs.up.railway.app/docs/image-service/image
- https://edb-docs.up.railway.app/docs/api-terms-of-use
- https://developers.google.com/youtube/data/reference/rest/v3/search/list
- https://developers.google.com/youtube/iframe_api_reference
- https://www.nhs.uk/live-well/exercise/strength-exercises/
- https://www.nhs.uk/live-well/exercise/sitting-exercises/
- https://www.nhs.uk/live-well/exercise/flexibility-exercises/
- https://www.cuh.nhs.uk/our-services/physiotherapy-outpatients/outpatient-physio-resources/resources/shoulder/seated-stretches/
