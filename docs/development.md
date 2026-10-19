# Development and verification

SVG Motion Studio is a static application. Runtime scripts use ordered classic script tags in `index.html`; there is no bundler or package installation required to use the editor. Preserve that order when adding modules.

## Run locally

Open `index.html` directly, or run `python3 -m http.server 8000` from the project root. The offline library has generated JavaScript payloads for direct-file browsing; ordinary HTTP hosting loads the SVG sources.

## Browser tests

For browser-independent custom aspect ratio checks, run `node tests/aspect-ratio-unit.cjs`. This exercises the resize/control functions and saved-project ratio validation without Playwright.

Development tests require Node.js, Playwright and an installed Google Chrome. Install Playwright locally with `npm install --no-save --package-lock=false playwright`, or set `PLAYWRIGHT_MODULE` to an existing Playwright package path. These dependencies are not shipped to users.

Run from the project root:

```sh
node tests/browser-regressions.cjs
node tests/ui-interactions.cjs
node tests/task-pack-regressions.cjs
node tests/controls-import-audit.cjs
node tests/startup-artwork.cjs
node tests/loading-screens.cjs
node tests/import-benchmark.cjs
```

The controls audit fails on regressions, including gradient persistence and canvas dimension limits. Performance measurements depend on your machine. Tests use isolated browser profiles, and some produce diagnostic images in the system temporary directory. Chrome is the currently tested browser engine.

## Library maintenance

Edit permanent vector sources in the vector-source folder under `assets/library/`, then regenerate and verify direct-file payloads:

```sh
node scripts/build-library.cjs
node scripts/build-library.cjs --check
```

Do not delete `assets/library/offline/` as duplicate data: it supports offline direct-file opening. `references/` contains original artwork, trace backups and audio masters, not runtime dependencies. Preserve these when revising assets. Keep source/license metadata when importing third-party icons.

## Documentation

- [Project overview and known issues](../README.md)
- [User guide](user-guide.md)
- [Loading-screen lifecycle](loading-screens.md)
- [Artwork audit and fidelity limits](artwork-startup-audit.md)
- [Historical task-pack implementation and measurements](task-pack-report.md)

Before release, run the applicable checks, verify documentation links and the README preview, and review redistribution permissions for supplied assets. Do not commit credentials, local dependency folders or test output.
