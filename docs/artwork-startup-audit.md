# Startup and custom artwork audit

## Interface

- Close Layers, Select all and Add shape now use equally sized 18×18 SVGs, in centered 30×30 buttons. Their actual path bounds are centered, not just the SVG elements.
- Undo/Redo, rail navigation, expand, fit, crop and layer-header icons are their final SVGs directly in HTML. The startup scripts no longer replace placeholder characters with other icons.
- A loading screen covers the intermediate editor while scripts initialize, the saved project restores, and the logo decodes. The later [seven-loader integration](loading-screens.md) adds the requested 1.5-second minimum and 300 ms exit fade. Reduced-motion users get static artwork; initialization failures show a reload action.

## Artwork review

All 81 custom SVGs were rendered next to their original PNG references on both the editor's dark background and white. All remain standalone vectors, with transparent surroundings and editable SVG elements. Originals are preserved in `references/original-vector-sources/`; PNG references remain in the image-reference folder under `references/`.

### Substantial repairs

- **Comic Burst Sticker:** its supplied black silhouette was painted after—and entirely over—the yellow fill. Rebuilt the paint order, restored the yellow center, and cleaned the pink offset and white sticker edge. Removed disconnected tracing debris.
- **Comic Wind Cloud:** the supplied vector had no solid cloud body; much of the source PNG's white body is also transparent. Restored a white body with a separate outline, blue clipped halftone dots, small puffs and speed trails. The result is a clean vector interpretation, not a claim of pixel-perfect photographic texture.
- **Celestial Sun Moon, Art Nouveau Eye, Phoenix Emblem, Compass Wave Emblem, Butterfly Crest:** their supplied traces contained extensive background speckling or substantially wrong contours. Reconstructed vector color regions from the matching PNG references, removing only edge-connected pale background during tracing. Enclosed pale details remain. These are vector paths, not embedded PNG images.
- Removed visible source-board numbering contours from 37 effects/decorative assets. The number labels in the reference sheets are catalog annotations, not part of the artwork.

### Remaining fidelity limits

The other supplied vector traces remain approximations: some watercolor texture, smooth shading, tiny details and source-crop imperfections differ from the raster references. This audit does not certify pixel-identical reproduction of every PNG, and it does not replace intentionally dark ink or transparent smoke with arbitrary light fills. The backups allow any artistic revision to be compared or reverted.

## Verification

- `tests/startup-artwork.cjs`: centered button/SVG/ink bounds, final icons before JavaScript, throttled-script startup without exposing intermediate UI, all 81 SVG imports/save-restores/static exports, no embedded raster images, repaired comic paint order.
- `tests/ui-interactions.cjs`: selection/effect toggles, repeated Library/Layers switching, toolbar placement and 390–1440px layout.
- `tests/browser-regressions.cjs`: all 139 library entries, malformed-project handling, static/animated exports, ID remapping, clip deletion and autosave errors.
- Offline payloads regenerated from the repaired permanent SVGs with `scripts/build-library.cjs`.

Verified in Chrome. Other browser engines were not available in this environment.
