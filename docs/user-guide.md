# User guide

[Back to the project overview](../README.md)

## Library

**Studio Artwork** contains Nature & Myth (10), Dreamscapes (10), Celestial Emblems (5), Elemental Motion (31), and Creative Accents (25). Original collection names remain in hover tooltips. Filter within the category or search readable names, original filenames, and subgroup names. Previews retain their aspect ratio and load lazily; full vector data loads only when chosen. Every path stays editable. Both direct-file opening and local/static hosting work offline for these assets.

- **Library** in the left rail, or **Browse SVGs** above the canvas, opens the gallery.
- The expanded gallery occupies the workspace to the right of the tool rail. You can still click a tool to return to editing. **Exit full screen** switches to a compact gallery.
- Search and category filters browse 57 original SVGs and the supplied two-stroke Brush frame. Triangle, Hexagon, Orbit, Pentagon, and Pill are not included.
- Choose **Open as new artwork** or **Add to current canvas**.
- Choose **Online · Iconify** to automatically browse its collections with Previous/Next pages. A blank query browses the catalog. Search updates after a short typing pause, with partial-name matching (`htm` includes `html`); Search or Enter runs it immediately. A prefix such as `mdi:heart` narrows results to that collection. Page capacity follows the gallery's available rows and columns. Batched downloads omit unavailable or invisible icons and fill their places with further matches; Next is enabled only after another displayable result is found. Previous results are cached. This needs internet access; availability depends on Iconify. Search sends the search term to its public API, never your artwork.
- Online artwork retains its collection/license information in the project and exported SVG metadata. Each collection has its own license; check it before redistribution. Icons are supplied by https://api.iconify.design; API documentation: https://iconify.design/docs/api/ .

## Select and edit

Click an object in the canvas or a layer. Expand groups to reach their paths. Shift-click to select multiple objects. Drag a selected object to move it. The bottom-right handle scales it proportionally.

**Layers** toggles the left panel; its periwinkle highlight is independent from the blue inspector tools. Click an already-active **Animate**, **Colors**, or **Canvas** tool in the rail to close the inspector; click again to reopen it. The Layers header includes Close, Select all (framed check icon), and Add shape. Blue eyes mean visible; amber crossed eyes mean hidden.

From Library, clicking Layers opens the layer panel instead of toggling the hidden background state. Select all toggles back to deselect all on a second click. Clicking the stage margin outside the canvas frame clears selection. Suggested animation buttons toggle their active effect off on a second click without deleting artwork or other clips; Add animation still adds a separate clip.

**Size & position** provides X/Y, exact width/height in SVG coordinate units, independent scale percentages, rotation and opacity. Group, Duplicate and Delete work with selected objects. Grouping requires siblings in the same parent. Use Undo/Redo to recover earlier changes.

**Colors** provides fill and stroke controls, no-fill/no-stroke options, stroke width, extracted color palettes and a two-color gradient creator. Edit existing gradient stops and offsets. Applying fill/stroke to a group changes its drawable children. Shared gradient edits affect all shapes using that gradient.

Created gradients are stored separately from temporary animation masks, so animation/transform edits, save/reopen and exports preserve them. Older projects with gradients still present inside a temporary mask container are repaired on opening; gradients already deleted from a saved file cannot be recovered automatically.

## Animate

Select an object and choose an effect: Reveal, Curved reveal, Fade in, Bloom, Slide up, Rotate, Sway, Pulse, Float, Draw stroke or Bounce. Suggestions use the selected layer's name, strokes, curves, and silhouette for both local and online SVGs.

Set duration, delay, easing, a draggable custom easing curve, finite repetition, infinite loop, reverse and alternate direction. Elastic easing uses an overshooting cubic-bezier approximation.

**Add animation** adds another clip to the selected object. Clips use nested transform groups, so independent effects can combine. Drag a clip to change its delay; drag its right edge to change its duration. Selected clips are edited in the inspector. Different objects have independent clips/tracks.

Click a clip in the bottom timeline and press **Delete/Backspace**, or use **Remove clip**, to delete only that animation while keeping the artwork. This also works for imported native SVG/CSS animation tracks. Click the canvas or Layers panel to return the keyboard's delete action to artwork selection. Undo restores removed clips.

Drag the small divider at the top of the timeline to change its height. The height is remembered locally. Focus the divider and use Up/Down for 20-pixel steps, or Home/End for its minimum/maximum size.

**Stagger selection** starts selected objects at 0.12-second intervals. With a single group selected, it staggers the group's immediate children.

Play/Pause runs the preview; the scrubber previews exact moments. **Loop preview** repeats the whole editor timeline and is separate from an individual exported effect's Loop setting. The preview duration includes one cycle of an infinite effect.

**Draw stroke** animates path length; if the shape has no stroke, it adds one, and reveals the fill at the end. Set No fill for a pure outline drawing.

## Curved reveals and directions

Select **Curved reveal** to reveal artwork along a curve using an animated SVG stroke mask. The artwork retains its colors and fill; the white mask controls which parts become visible.

### Stroked curves, such as rainbow arcs

Select a band and choose Curved reveal. The editor copies its actual path geometry into the mask and calculates its length. SVG arc and Bezier paths are supported. **Use shape curve** restores this automatic route. For a group, the mask can use its stroked children. Choose **Reverse along route** to reveal from the opposite endpoint.

### Filled curved bands and custom shapes

A filled shape does not necessarily contain a centerline. The editor offers a suggested curved route, but does not claim to infer arbitrary geometry perfectly.

1. Select the filled band and choose Curved reveal.
2. Click **Draw route**.
3. Drag through the center of the band from the intended start to finish. The editor makes a smooth curve from your stroke.
4. Adjust **Reveal brush width** until the route covers the entire band.
5. Drag the visible route points to refine the curve. The blue start point marks the forward direction.
6. Scrub the timeline to check the reveal. Toggle **Show route & editable points** to hide the editing overlay.

Routes, widths and mask animations persist in editable projects and animated SVG exports. The route overlay is not exported. Static exports remove editor reveal masks so the original artwork is fully visible. You still need separate paths to animate separate colored regions; these controls do not split a gradient into independent shapes.

### Coordinate several curves

Select several objects, or their parent group, and open **Coordinate curve timings**:

- **Same start & finish** gives every selected curve the same delay, duration and easing. Each route covers its own complete length in that time.
- **Draw in sequence** places one curve after another, using the layer order and their existing durations. It disables individual looping for those clips.
- **Match speed to path length** calculates duration from each route's length and the chosen drawing speed in SVG units/second. It uses linear easing and the same start time; longer curves finish later. Affine transforms are accounted for by sampling the transformed path.

For the clearest result, select each colored band separately. Multiple transforms or animated child objects inside a masked group may require a custom route or separate per-band masks.

### Directional reveals

The standard **Reveal** effect has a direction menu: bottom-to-top, top-to-bottom, left-to-right, right-to-left, four corner directions, horizontal or vertical center-out, and radial center-out. These are geometric clip reveals. **Curved reveal** has forward/reverse route direction instead.

## Morph and path nodes

Expand a group and select an actual path. Paste a target `d` path string under **Morph a path**. The target must have exactly the same command types, command case, numeric coordinate count and order as the source. This version does not automatically normalize arbitrary shapes into compatible paths. Morph timing uses the first clip on that object. Morph is exported as native SVG `<animate>` markup. Overshooting curves are clamped to native SVG's supported range for morphing.

**Editable path nodes** shows draggable coordinate handles for uppercase/absolute M, L, C, Q, S, T, H and V paths. It includes curve control points. Arc commands and lowercase/relative paths are selectable but do not have an editable node overlay. Editing a morphed path's nodes clears its morph target.

## Canvas, crop and size

- **Width/Height px** change export dimensions, within 1–16,000 pixels per side. Lock aspect ratio scales both sides together (rounded to whole pixels). If either side would exceed these limits, resizing stops at the nearest valid proportional size and the fields display the actual dimensions.
- **Custom aspect ratio** lets you enter width:height proportions such as 16:9 or 4:5. **Apply ratio** enables the lock and adjusts the height while keeping the width where limits allow. The ratio stays with the saved project and is used when resizing either side; unchecking Lock allows independent resizing without forgetting it. **Reset** clears the custom ratio and restores the artwork's original imported width and height, including after ordinary resizing. Undo restores the previous size. Older projects that did not store original dimensions use their original viewBox size as a fallback. Dimensions round to whole pixels when applying a ratio. These controls change export size, not artwork geometry or the viewBox crop.
- **Whole artwork scale** changes the drawing inside the canvas.
- **Crop** lets you drag a crop rectangle. It changes the SVG viewBox; it preserves vector artwork outside the visible bounds.
- Numeric viewBox bounds give exact crop control.
- **Trim empty space** crops to the current artwork bounds with a small margin. Use the final/static pose when trimming; moving animations may extend beyond those bounds.
- **Reset crop** restores the imported viewBox and its dimensions.
- **Fit to view** adjusts preview zoom only.
- The preview background stays out of exports unless **Include background in exports** is enabled.
- Grid, guides, safe margin, selection outlines and node handles are editor overlays and never appear in exports.

## Export

1. **Animated SVG**: standalone vector file with embedded CSS and native SVG morph animation. Use directly as a browser image or inline SVG. Some non-browser viewers, design tools, email clients and upload services render SVG animations as a static image or remove animation markup.
2. **Static SVG**: vector artwork without editor or imported CSS animations, transitions, or SMIL animation markup. Non-animation styles are retained. This uses the source path geometry, not a flattened capture of the current animated pose.
3. **Animation CSS** + **SVG for external CSS**: download both, embed the prepared SVG inline in HTML and include the stylesheet. The classes and wrapper groups must match. A separately loaded `<img>` cannot be styled internally by the parent page's stylesheet. Original import IDs are preserved inside wrappers; CSS-only export is not a universal stylesheet for untouched SVG markup. Morph data remains inside the prepared SVG.
4. **HTML example**: ready-to-open page with the animated SVG embedded.
5. **Editable project**: portable `.svgmotion` JSON file storing layers, animation settings and artwork. Open it using Open project.
6. **Export another size**: one animated SVG at a custom pixel size, preserving the current viewBox.

Browser autosave is best-effort and can vary for `file://` pages. A persistent warning appears if browser storage is full or unavailable; download an editable project to keep your work. The warning clears after a successful autosave. Damaged project files are validated before replacing the current canvas. Undo history is kept in memory for the current session.

## Keyboard shortcuts

- Space: play/pause.
- Ctrl/Command Z: undo.
- Ctrl/Command Shift Z: redo.
- Ctrl/Command S: save project.
- Ctrl/Command Shift G, or Shift-click **Group**: ungroup selected groups. Remove parent-group animation first; child animations and inherited artwork transforms are retained.
- Delete/Backspace: remove the selected timeline animation, or delete the artwork selection when working on the canvas/Layers (outside text inputs).
- Up/Down on the timeline divider: adjust its height; Home/End: minimum/maximum.
- Escape: close a dialog or cancel crop mode.
