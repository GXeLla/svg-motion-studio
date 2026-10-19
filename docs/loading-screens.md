# Selected startup loading screens

SVG Motion Studio selects **one of seven designs with equal probability for each new document**. Refreshing makes a fresh choice; a repeat is valid. There is no cycling preference, saved selection, or product-facing picker. The artwork is a dedicated overlay, never editor content.

| Loader ID | Appearance | Background |
| --- | --- | --- |
| `44-eye-liquid-gold` | Peacock green/gold, refraction, travelling shine and stars | `#10282b` |
| `42-celestial-origami` | Bordeaux/gold celestial sectors | `#290f1b` |
| `33-cabin-snowglobe` | Bordeaux/gold cabin landscape and falling light | `#290f1b` |
| `20-watercolor-koi` | Midnight cherry, pink/ice radial reveal | `#1c1126` |
| `10-portrait-stardust` | Lapis/amber botanical portrait and particles | `#101d38` |
| `26-j01-midnight-opal` | Midnight Opal background, ice/blue Opal Refraction | `#0c1023` |
| `phoenix-p07-colors-p10-motion` | P07 warm-left/cool-right artwork and background, P10 timefold/echo/shine motion | `#071b25` |

## Lifecycle

- The early head script chooses only once and paints the matching fallback background before the body appears. Seven independent classic registration scripts register metadata and mount/destroy functions without fetching their illustrations.
- The shared controller mounts only the chosen SVG as a decorative `<img>`. This supports `file://` and nested static hosting without fetching JSON or introducing module/CORS requirements.
- Minimum display is **1,500 ms**. For successfully decoded artwork the deadline includes 1,500 ms from that readiness point. Each unchanged supplied SVG loops natively every **4,000 ms**; it is not necessary to finish a whole loop.
- Exit also waits for the real editor initialization, saved-session restoration, required UI scripts, brand image decode, and two paint frames. A ready editor becomes visible beneath the overlay for the **300 ms fade**, but stays inert until the overlay is removed. A bounded 380 ms fallback covers a missing transition-end event.
- Startup is silent. The loader has no interaction sounds or editor handlers. Logo/library actions, modals, imports, color changes, timeline playback, saves/exports and resizes cannot restart it. Repeated start/finish/destroy calls are harmless. BFCache restoration does not create another overlay.
- Reduced motion uses the supplied SVG's static illustration and an immediate/short application exit. A temporary capture guard also blocks global editing shortcuts and file drops while the editor is hidden; it leaves Reload accessible on a core failure. Normal scrolling, interaction and `aria-busy` are restored after exit, and the guard is removed.

## Failure handling

Missing or throwing registration modules, missing SVGs, and failed decoding fall back to the same chosen background and one loading message. A three-second artwork readiness bound prevents optional imagery from trapping a working editor. The source SVG is not replaced with another random design or a spinner.

Core script/style failures retain the blocked startup surface, stop/remove animated artwork and show a Reload action. The error watcher distinguishes optional loading-screen resources from required editor resources. If the optional shared loader controller is unavailable, the final startup gate still reveals a successfully initialized editor after the minimum display time.

## Files and maintenance

Each design retains its own folder under `assets/loading-screens/`, containing the supplied `loader.svg`, `loader.js`, and `config.json`. `manifest.json` is the reference index and SHA-256 record; its folder fields are adjusted to the permanent layout. All seven SVGs, configuration files and per-loader modules were installed unchanged; all animation remains inside the SVGs.

`scripts/loading-screen-controller.js` owns selection lifecycle, readiness/exit gates, inert state and cleanup. `scripts/startup.js` signals actual editor readiness. Critical first-paint styles/selection are in `index.html`; responsive artwork sizing and fade styling are in `styles/loading-screen.css`.

To add another independent design later: create its folder with a vector-only animated SVG (including static reduced-motion content), a classic registration module with `mount(host) → {ready, destroy}`, and config; update the permanent manifest/hash; add its classic script tag and its ID/background to the early selection list in `index.html`. Do not put SVG strings or animation frame code in the shared controller. Adding a design is a deliberate product change; the installed selection contains exactly the seven approved designs.

## Verification

Run `node tests/loading-screens.cjs` with Playwright and Chrome installed, or set `PLAYWRIGHT_MODULE` to an existing installation. Tests inject a test-only loader override before navigation to force individual designs; normal users never see a picker, and editor randomness is not stubbed.

Coverage includes each SVG's original hash/vector-only content; one chosen artwork request; selected palette; actual moving screenshots; standalone reduced-motion still frames; minimum timing, visible-under-overlay exit and inert cleanup; delayed core initialization; saved-project restoration; repeated refresh; ordinary editor actions without restart; 1440×900, 768×1024, 390×844, 320×568, and 844×390 layouts; image/module/controller failures; core script/style failures; missing transition events; direct-file opening; nested HTTP hosting; and both simulated lifecycle events and an actual confirmed Back/Forward Cache restoration. The history test enables Chrome's normal BFCache behavior and waits for navigation commit, since a cached document does not emit a fresh load event.

Existing interaction, startup/artwork, project restoration/export, and audio/navigation regression suites are also retained. Verification uses Chromium/Chrome in this environment; Firefox and WebKit automation installations are unavailable.

## Handoff cleanup

Removed the exact temporary loader handoff directory after successful browser verification. Before deletion, the original package marker and canonical path were checked; all 21 installed per-loader files matched their source copies, and all seven SVGs matched the original manifest hashes. Installed-file tests also ran with the source path temporarily unavailable. The permanent manifest's folder fields were intentionally adjusted for the installed layout. No runtime file or documentation link depends on the removed package. No project/library artwork was removed, and nothing was committed or published.
