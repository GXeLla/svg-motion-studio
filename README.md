# SVG Motion Studio

A local-first SVG animation editor built with HTML, CSS and vanilla JavaScript. Animate editable vector layers with a visual timeline, custom reveals and portable SVG exports. No build step, framework, account, API key or backend.

The interface uses layered slate/navy surfaces, cool white text, blue editing controls and distinct periwinkle Layers/Library highlights. Project artwork, branding and loading illustrations retain their own palettes. Existing saved canvas backgrounds are preserved.

![Current SVG Motion Studio editor, with layers, timeline, and animation controls](assets/previews/editor.webp)

## Features at a glance

- 139 offline SVG assets: the original 58 plus 81 detailed artworks in **Studio Artwork**, and a paginated online icon catalog.
- Expandable library with the left tool rail kept accessible and smooth open/close transitions.
- Independently collapsible Layers and inspector panels; vertically resizable timeline.
- Individual object selection, grouping, duplication and transforms.
- Eleven animation effects, multiple clips, a visual timeline, reveal directions and custom easing.
- Fill/stroke palettes, gradient stop editing and SVG color extraction.
- Canvas dimensions, artwork scale, draggable cropping and exact viewBox bounds.
- Compatible path morphs and draggable nodes on supported absolute paths.
- Animated/static SVG, external CSS, HTML demos and portable editable projects.
- Local autosave, undo/redo and keyboard shortcuts.
- Two approved, quiet interaction recordings and a persistent speaker toggle.

## Sounds and support

The speaker between Open project and Undo immediately toggles all sounds; it never opens a settings dialog or makes its own sound. New users start with sounds enabled at 20%. Nothing plays on page load: a real user interaction is required. Previously muted preferences remain muted after migration.

**Hidden Switch** accompanies buttons, the clickable studio logo (returns to the editor with Layers open and closes the library), and the support link. **Quiet Denied** accompanies actual errors. For example, select just one path and click **Group**: the editor explains the invalid selection and plays only the error recording. Informational messages are silent. An amber dot on the speaker indicates unavailable audio or a preference that could not be saved. There are no presets or audio-processing effects.

Enjoying SVG Motion Studio? You can support its continued development on [Ko-fi](https://ko-fi.com/x_e_l_a). The optional **Buy me Ko-fi** header link opens that same page in a new tab. On narrow screens, look for the coffee-cup icon.

## Publishing on GitHub

Use `svg-motion-studio` as the repository name. Put this project's contents at the repository root—not the parent directory or its other projects. Keep the relative folder structure intact. The editor can be served by a static host without compilation; online icons still require internet access. Before making the repository public, review the asset licensing notes below.

## Start

1. Clone the repository or download and extract its ZIP.
2. Open `index.html` in a modern desktop browser (Chrome, Edge, Firefox or Safari).
3. Click Play to preview the default purple flower, or import/drop your SVG.

You can also paste SVG code or HTML containing one inline SVG into the editor (outside text fields and dialogs). Pasting adds editable artwork to the current project. External links are removed while linked shapes and local gradient, mask, and symbol references are preserved. Iconify's script/web-component HTML embeds do not include the geometry: choose **Copy SVG** instead. Online-library source/license metadata is retained for attribution; it is not a runtime dependency.

Keep `index.html` alongside the `scripts/`, `styles/`, and `assets/` folders. Everything except the online catalog works offline. A local server is optional: run `python3 -m http.server 8000` in this folder and open `http://localhost:8000`. Use a free port if another project is already running there.

## User guide

See the [complete user guide](docs/user-guide.md) for library browsing, selection, animations, curved reveals, morphing, colors, canvas controls, exports and keyboard shortcuts.

## Scope and implementation

The purple flower is original vector artwork inspired by the chosen visual direction, not the raster flower pasted into an SVG. Each petal, stamen and main group is separately editable. This is a working desktop-oriented editor, not a full Illustrator replacement. It does not implement freehand artwork drawing, automatic path normalization for arbitrary morphs, text-to-outline font conversion, boolean path operations or video/GIF export.

Import removes scripts, event handlers, foreignObject, and external image/font references. Safe native SVG animations and CSS keyframes are retained, inspected in the timeline, and played automatically on import. CSS selectors are bound to their original targets before editor wrappers are added. Local gradient/clip references are retained. Very complex filters, unusual transforms, nested viewports, symbol/use structures, script-driven animation, and external dependencies may need simplification. Avoid using this local importer as a production security boundary without a dedicated audited sanitizer.

No external runtime libraries are required.

## Known issues and browser coverage

- Automated verification uses Chrome. Firefox and Safari/WebKit have not been verified by these tests.
- Online search depends on third-party availability. Complex SVG filters, external dependencies and incompatible morph paths may require simplification.

## License and asset permissions

Application code is MIT licensed. Only the original artwork in `scripts/library.js` carries the project's CC0 dedication. Supplied supplied artwork, the Brush frame, branding, loading-screen artwork, recordings, reference images and the coffee-cup illustration are not automatically covered by MIT or CC0. Verify ownership or redistribution permission before publishing those assets. Online icons retain their individual collection licenses. See [LICENSE.txt](LICENSE.txt) and the [Brush frame provenance](assets/artwork/README.md).

## Files

- `index.html` — interface and dialogs.
- `styles/main.css` — theme, responsive layout, and transitions.
- `scripts/app.js` — editing, animation, timeline, imports, and exports.
- `scripts/project-safety.js` — project validation, static animation removal, and duplicated SVG reference remapping.
- `scripts/imported-css.js` — declaration-based imported animation identities and stale-handle handling.
- `scripts/sound-engine.js`, `scripts/sound-settings.js`, `styles/sounds.css` — approved recordings, error priority, and the speaker toggle.
- Library modules under `scripts/` — collection metadata and on-demand vector loading.
- `scripts/group-controls.js`, `styles/task-pack.css` — ungrouping, export error handling, support link and targeted layout refinements.
- `scripts/workspace.js` — panel toggles, timeline resizing, clip-only deletion, and layer controls.
- `scripts/clipboard-import.js` — inline SVG/HTML clipboard import without external embed dependencies.
- `scripts/loading-screen-controller.js`, `scripts/startup.js`, `styles/loading-screen.css` — startup artwork lifecycle, readiness and error handling.
- `scripts/online-gallery.js` — batched Iconify downloads, live partial search, responsive pagination, and source menu.
- `scripts/library.js` — 57 original SVG assets.
- `scripts/custom-library.js` — supplied Brush frame and provenance metadata.
- `scripts/suggestions.js` — geometry-aware effect suggestions.
- `assets/branding/` — vector studio logo and dark favicon. The wordmark stays still; the underline reveals, the subtitle appears, then its gradient flows back and forth. Reduced motion is supported.
- `assets/artwork/brush-frame.svg` — standalone editable two-stroke artwork, also bundled in the custom library.
- `assets/previews/editor.webp` — current editor screenshot, losslessly compressed from PNG for the README.
- `assets/library/` — vector sources retaining the 81 original supplied SVG filenames; `assets/library/offline/` contains generated lazy JavaScript payloads for direct-file browser compatibility. After editing SVG sources, run `node scripts/build-library.cjs`; `--check` verifies parity.
- `assets/sounds/`, `assets/icons/` — two approved MP3 recordings and the supplied custom coffee-cup SVG (not an official Ko-fi logo).
- `references/` — preserved PNG artwork references, original WAV masters, and the before-layout screenshot; never loaded by the editor.
- `examples/` — sample exported SVG and HTML.
- `tests/browser-regressions.cjs` — targeted browser checks for restoration, export, duplication, animation selection, and storage failures.

## Regression tests

See [development and verification](docs/development.md) for setup, the complete test commands and library maintenance. Implementation history and artwork limitations are kept under `docs/`; source references are not required by the running editor.

With Node.js, Playwright and Google Chrome installed, run `node tests/browser-regressions.cjs`. If Playwright is installed elsewhere, set `PLAYWRIGHT_MODULE` to its package path. These are development-only dependencies; the editor itself still needs no installation or build step. Tests use an isolated browser session, not your regular browser profile.

Run `node tests/task-pack-regressions.cjs` for audio/navigation/CSS edge cases and `node tests/import-benchmark.cjs` for local timing measurements. See [the implementation report](docs/task-pack-report.md) for results and browser coverage.

Run `node tests/controls-import-audit.cjs` for animation, canvas, color and clipboard-import checks. Regressions fail the run, including lost gradients and invalid canvas dimensions. Coverage includes gradient stop edits, animation/transform rebuilds, old-project gradient migration, undo/redo, save/reopen, exports and extreme aspect-locked resizing.

Startup uses final inline SVG icons and one randomly selected native SVG loading screen from seven approved designs. It stays for at least 1.5 seconds and until the restored editor is ready, then fades out over about 300 ms. Reduced motion shows a still illustration. Normal editor interactions never restart it. See [loading-screen lifecycle and tests](docs/loading-screens.md); run `node tests/loading-screens.cjs` for focused coverage. Run `node tests/startup-artwork.cjs` to check icon centering and the complete custom vector library. See the [artwork and startup audit](docs/artwork-startup-audit.md) for repairs and remaining trace-fidelity limits. Original vector sources are preserved under `references/original-vector-sources/`.

Verification covered browser startup, library search/fullscreen, object animation, multiple clips, timeline seek, colors/gradients, dimensions/crop, compatible morph, save/reopen, undo, drag/resize, group/duplicate/delete, node editing, standalone HTML animation playback and the CSS/prepared-SVG pair. Curved stroke masks, visual filled-band routes, route-point editing, length-based timing, sequencing, reveal directions, masked project reopening and animated SVG image playback were also verified. Online API interaction was verified with deterministic test responses; third-party service uptime is not guaranteed.
