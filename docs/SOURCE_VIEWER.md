# In-app source viewer

Implemented 24 October 2026. This supplement supersedes earlier wording that music/source links automatically open another browser tab.

## Behaviour

User-selected external HTTPS links are requested inside a VORALEAF viewer. It opens to fill the app, with controls outside the provider player to restore a smaller window, expand again, retry, copy the source link and close. Closing unloads the player. The smaller window can be resized on supported desktop browsers, allowing work in the studio while listening. Same-origin pack images and member-watch links open in the viewer too; the current studio is kept in place.

A link click is the network-loading action; the app does not prefetch third-party players. Provider identity remains visible. Player content may depend on region, cookies, account eligibility, a subscription, track rights or the content owner's embed permissions. A cross-origin frame load event cannot prove that content rendered. Blank/blocked content has an explicit retry/copy-link explanation; the app does not claim successful playback from that event.

## Supported sources

| Source | Behaviour |
| --- | --- |
| YouTube | Valid video/playlist URLs use the official privacy-enhanced embed, with standard controls, inline playback and a visible provider attribution. Player logo, links and controls are not covered or cropped. |
| Spotify | Valid supported content links use the official `/embed/` player. |
| Apple Music | Music content links use the official embed host. Availability and preview/full playback depend on the provider. |
| SoundCloud | Public content links use the official widget; nested widget URLs are validated. |
| Bandcamp | Official `/EmbeddedPlayer/` links retain the provider player. Ordinary slugs cannot supply the required numeric embed identifiers; use the provider's Share/Embed link if framing fails. |
| Other HTTPS pages | Requested in a sandboxed frame; frame policies are respected. Arbitrary third-party sites cannot be guaranteed to work. |
| Own images/media | Use native image/video elements with the VORALEAF viewer shell. |
| Email, phone, WhatsApp | Show an in-app contact panel first, including copyable details/drafts. No message or call is made automatically. Any explicit system-app handoff is separate. |

## Boundaries

- No proxy removes `X-Frame-Options`, `frame-ancestors`, authentication or provider branding.
- Google OAuth and Sites sign-in remain their secure provider flows; they are not trapped in an iframe.
- Links and account actions inside a cross-origin official player remain controlled by the provider. The app cannot intercept every action inside that player.
- Provider music is personal listening only. It is not captured by the studio audio mixer, mixed into recordings, synchronised with advertising or rebroadcast.
- Local permitted audio and the original instrumentals retain their own controls and recording inclusion settings. Opening a provider music source pauses local music to avoid two app sources playing together.
- URLs are not added to local storage. Credentials, token-bearing links, unsafe protocols and non-public hosts are rejected. This is client-side display, not an arbitrary server fetch endpoint.
- Rehearsal and recording continue to use the existing explicit permissions and member services retain their server eligibility checks.

## Official references

- YouTube player parameters: https://developers.google.com/youtube/player_parameters
- YouTube required functionality: https://developers.google.com/youtube/terms/required-minimum-functionality
- Google OAuth policies: https://developers.google.com/identity/protocols/oauth2/policies
- Spotify embeds: https://developer.spotify.com/documentation/embeds/tutorials/creating-an-embed
- Apple Music embeds: https://artists.apple.com/support/1117-apple-music-marketing-tools
- SoundCloud widget: https://developers.soundcloud.com/docs/api/html5-widget
- Bandcamp embed guide: https://get.bandcamp.help/en/articles/15263071-how-do-i-create-a-bandcamp-embedded-player
- Frame loading limitations: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe

## Verification

The implementation is checked with URL-resolution/security fixtures and browser interaction checks for viewer opening, restore/expand, close/unload, contact handling and mobile layout. These checks do not establish paid account access, every external site's frame permissions or real-device media compatibility. Third-party playback must be accepted with the final provider accounts and supported devices.

Browser acceptance notes: the Spotify documentation example rendered its official preview player inside the viewer; opening it paused local studio music. YouTube displayed a CUH exercise player and metadata, but the media remained buffering during the bounded browser check, so uninterrupted YouTube playback is unverified. One NHS warm-up link explicitly reported owner-disabled embedding; it is retained as provenance and excluded from the curated in-app player list. Fullscreen/restore/expand, navigation persistence, close/unload, contact panels and mobile geometry were checked separately.

Acceptance targets for this update: (1) ordinary source clicks open zero new browser tabs; (2) fullscreen and restored modes have no horizontal content overflow at the checked 390 px mobile size; (3) all 54 server, resolver and interaction tests pass. Track future browser/provider regressions against these three checks at each embed integration change.

App-owned source anchors now intercept single, double, keyboard, modified-left and middle-click activation before target navigation. Repeated equivalent source opens reuse the current player without reloading it. Browser checks of the YouTube source anchor and movement-play button left the same tab IDs open with one viewer iframe. These controls do not intercept links owned by cross-origin provider players.
