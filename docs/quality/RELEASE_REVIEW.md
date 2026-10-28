# VORALEAF Quality Gate Review Record

- **Delivery / build**: `voraleaf@0.3.1` (`npm run build` & `npm run build:worker`)
- **Environment and URL**: Local verification (`http://localhost:3123`) & owner-restricted preview (`https://voraleaf-ritual.favl.chatgpt.site`)
- **Scope and classification**: UK & international white-label herbal coffee storefront, Ingredients & Process (with Mixed African Roots Bitter Herbs), Benefits, Certifications, Customer Reviews, server-side PayPal/Stripe checkout integration (merchant account kept server-only and retail pricing unset), and ExerciseDB `getStatus` (`GET /api/fitness/status` -> `https://exercisedb.p.rapidapi.com/status`, [RapidAPI Playground](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb/playground/getStatus)) in `/fitness`. Classified as **local development / private preview** awaiting final public domain and live secret injection.
- **Viewports and browser**: Chrome via DevTools MCP at `1280×900` (desktop) and `390×844` (mobile).
- **Commands and evidence**:
  - `npm run check` — 852 assertions passed (including client file scan ensuring internal merchant email is never exposed in `public/`)
  - `npm test` — 59/59 tests passed (including `tests/checkout.test.mjs` and `tests/fitness-api.test.mjs` `getStatus`)
  - `npm run build` & `npm run build:worker` — passed

| ID | Check | Status | Evidence or concrete applicability reason |
|---|---|---|---|
| Q01 | Production domain | BLOCKED/NOT RUN | Current deployment target (`voraleaf-ritual.favl.chatgpt.site`) is an owner-restricted preview host. Public branded domain (`voraleaf.com`) is not yet pointed/activated. |
| Q02 | Page titles | PASS | Distinct, descriptive product titles verified across `/`, `/collection`, `/products/bold`, `/bag`, `/about`, `/journal`, `/fitness`, `/studio`. |
| Q03 | Meta descriptions | PASS | Specific metadata in [index.html](file:///Users/favl/Downloads/VoraLeaf/public/index.html) describing BOLD 01, EMBER 02, BLOOM 03, Tongkat Ali, Ginseng, Dong Quai, Jujube, and Mixed African Roots Bitter Herbs. |
| Q04 | Favicon and icons | PASS | Custom SVG icon (`/assets/icon.svg`) and verified PNG icons (`192x192`, `512x512`) in `manifest.webmanifest`. |
| Q05 | Open Graph image | PASS | `/assets/coffee-hero.webp` (1672×941) configured and verified present. |
| Q06 | Canonical URLs | N/A | Site is currently an owner-restricted preview (`robots.txt` disallows indexing until public domain activation); no fabricated canonical domain added. |
| Q07 | Social previews | PASS | `og:title`, `og:description`, `og:type`, and `og:image` match page identity. |
| Q08 | Custom 404 | PASS | Branded `notFound()` view in `public/app.js` with recovery link to `/` and HTTP 404 for unknown assets/API routes. |
| Q09 | Loading states | PASS | Stripe checkout button (`"Connecting to Stripe…"`) and ExerciseDB `Check API status` button (`"Checking status…"`) disable during requests and recover cleanly. |
| Q10 | Error messages | PASS | `/api/checkout/stripe` and `/api/fitness/status` return structured `503` responses when server secrets (`STRIPE_SECRET_KEY` / `RAPIDAPI_KEY`) are unset, and UI surfaces clear fallback guidance without exposing secrets. |
| Q11 | Heading structure | PASS | Single `<h1>` verified per route (`h1Count: 1`), logical `<h2>`/`<h3>` hierarchy, and `<main>`, `<header>`, `<nav>`, `<footer>` landmarks. |
| Q12 | Alternative text | PASS | All product, gallery, packaging, and editorial images have descriptive `alt` attributes; icon buttons have `aria-label`. |
| Q13 | Sitemap and indexing | N/A | Private preview intentionally disallows indexing via `public/robots.txt` until public domain cutover. |
| Q14 | Console errors | PASS | Zero console errors or warnings across `/`, `/products/bold`, `/bag`, and `/fitness` in Chrome DevTools MCP (`list_console_messages`). |
| Q15 | Debug output | PASS | No leftover `console.log` debug statements in client scripts (`public/*.js`). |
| Q16 | Source maps | PASS | No private `.map` files generated or served in `public/` or `dist/`. |
| Q17 | JavaScript and performance | PASS | Zero external runtime framework dependencies; plain modular JS (`app.js`, `data.js`, `source-viewer.js`, `studio.js`, `fitness.js`) with preloaded hero WebP. |
| Q18 | Mobile layout | PASS | Verified at `390×844` on `/`, `/products/bold`, `/bag`, and `/fitness` with `horizontalOverflow: false` and accessible touch controls. |
| Q19 | Consistent spacing | PASS | Uses VORALEAF CSS custom properties (`--forest`, `--deep`, `--cream`, `--gold`, `--line`, `--serif`, `--sans`) and responsive grid breakpoints. |
| Q20 | Working controls and links | PASS | Verified bundle edition switcher, format & bundle selectors, Select & Order, Add to Bag, server-side PayPal & Stripe checkout flow (no exposed merchant email or unconfirmed pricing), and ExerciseDB `getStatus` check (`/api/fitness/status`). |

## Known gaps and next action
- **Live retail pricing & Stripe secret**: Retail pricing is intentionally unset (`VORALEAF_UNIT_PRICE_MINOR` blank). Once final pricing is set and `STRIPE_SECRET_KEY` is added to the server environment, `/api/checkout/paypal` and `/api/checkout/stripe` activate live payment sessions using the internal server-side merchant account without exposing it to clients.
- **Public domain cutover (Q01, Q06, Q13)**: Remains blocked until the public custom domain is connected and approved for public indexing.
