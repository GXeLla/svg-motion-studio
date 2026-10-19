/* Run with Node and Playwright installed; uses a local Chrome installation.
   PLAYWRIGHT_MODULE can point at an existing Playwright package. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    const example = fs.readFileSync(path.resolve(__dirname, '../examples/purple-bloom.svgmotion'), 'utf8');
    const results = await page.evaluate(async example => {
      const results = [], check = (value, message) => { if (!value) throw Error(message); };
      const svg = content => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${content}</svg>`;
      importSVG(svg('<circle cx="50" cy="50" r="20"/>'), 'Regression fixture');
      addEffect('fade'); pause();
      const original = snapshot(), fixture = JSON.parse(original), first = Object.keys(fixture.state.objects)[0];
      const corruptions = [
        data => { data.state.view = {}; },
        data => { data.state.originalView = 'bad'; },
        data => { data.state.objects[first] = null; },
        data => { data.state.objects[first].clips = {}; },
        data => { data.state.objects[first].clips = [null]; },
        data => { data.state.objects[first].clips[0].curve = {}; },
        data => { data.state.objects[first].clips[0].curve = [0]; },
        data => { data.state.objects[first].clips[0].duration = {}; },
        data => { data.state.objects[first].clips[0].routes = {}; data.state.objects[first].clips[0].routePoints = {}; },
        data => { data.state.objects[first].parent = first; },
        data => { data.state.objects[first].visible = 'false'; },
        data => { data.state.selected = {}; },
        data => { data.svg = svg('<circle/>'); }
      ];
      for (const corrupt of corruptions) {
        const data = JSON.parse(original); corrupt(data); let rejected = false;
        try { restore(data); } catch { rejected = true; }
        check(rejected, 'Malformed project accepted');
        check(snapshot() === original, 'Rejected project changed the current editor');
      }
      restore(original); check(Object.keys(state.objects).length === 1, 'Valid project round trip failed');
      results.push('13 malformed project variants rejected without changing the editor; valid restore succeeds');
      restore(example);
      for (const asset of SVG_LIBRARY) {
        importSVG(asset.svg || await XeLaLibrary.load(asset), asset.name); pause();
        const count = Object.keys(state.objects).length;
        restore(snapshot()); check(Object.keys(state.objects).length === count, 'Library round trip failed: ' + asset.name);
      }
      results.push('Bundled example and all ' + SVG_LIBRARY.length + ' library assets survive project save/restore');

      importSVG(svg('<style>@keyframes a{from{opacity:.2}to{opacity:1}}@media all{circle{animation:a 2s infinite;fill:red;transition:fill 2s}}</style><circle style="animation:a 4s infinite" cx="50" cy="50" r="20"><animate attributeName="r" values="10;20" dur="2s"/></circle>'), 'Static export');
      root.style.animation = 'a 3s infinite';
      const animated = exportSVG('animated'), output = exportSVG('static');
      check(animated.includes('@keyframes'), 'Animated export lost CSS');
      const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
      check(!doc.querySelector('parsererror,animate,animateTransform,animateMotion,set'), 'Static SVG contains SMIL or invalid XML');
      check(!/animation\s*:|transition\s*:|@keyframes/.test(output), 'Static SVG contains CSS animation');
      const frame = document.createElement('iframe'); frame.srcdoc = output.replace(/<\?xml[^>]*>/, '');
      const loaded = new Promise(resolve => frame.onload = resolve); document.body.append(frame); await loaded;
      check(frame.contentDocument.getAnimations().length === 0, 'Static SVG runs browser animations');
      check(frame.contentWindow.getComputedStyle(frame.contentDocument.querySelector('circle')).fill === 'rgb(255, 0, 0)', 'Static export lost non-animation styles');
      frame.remove(); results.push('Static export strips nested CSS, inline/root CSS and SMIL; animated export and paint styles survive');

      importSVG(svg('<g id="group"><defs><linearGradient id="paint"><stop stop-color="red"/></linearGradient><clipPath id="cut"><circle r="40"/></clipPath><mask id="alpha"><rect width="100" height="100" fill="white"/></mask></defs><style>#shape{fill:url(#paint)!important}</style><title id="label">Shape</title><circle id="shape" aria-labelledby="label" mask="url(#alpha)" clip-path="url(#cut)" cx="50" cy="50" r="20"><animate id="first" attributeName="r" values="10;20" dur="2s"/><animate attributeName="cx" values="30;50" begin="first.end" dur="2s"/></circle><use href="#shape"/></g>'), 'Duplication');
      const originalCircle = root.querySelector('circle[id]'), originalFill = getComputedStyle(originalCircle).fill;
      duplicateSelected();
      const copy = nodes.get(state.selected[0]), allIds = [...root.querySelectorAll('[id]')].map(node => node.id);
      check(new Set(allIds).size === allIds.length, 'Duplicated SVG IDs collide');
      check(getComputedStyle(originalCircle).fill === originalFill, 'Copied styles changed original artwork');
      const copiedCircle = copy.querySelector('circle[id]'), gradient = copy.querySelector('linearGradient'), clip = copy.querySelector('clipPath');
      check(getComputedStyle(copiedCircle).fill.includes('#' + gradient.id), 'CSS gradient reference points at original');
      check(copiedCircle.getAttribute('clip-path').includes('#' + clip.id), 'Clip-path reference not remapped');
      check(copiedCircle.getAttribute('mask').includes('#' + copy.querySelector('mask').id), 'Mask reference not remapped');
      check(copy.querySelector('use').getAttribute('href') === '#' + copiedCircle.id, 'Use href not remapped');
      check(copiedCircle.getAttribute('aria-labelledby') === copy.querySelector('title').id, 'Accessible label reference not remapped');
      check(copy.querySelectorAll('animate')[1].getAttribute('begin') === copy.querySelector('animate').id + '.end', 'SMIL event reference not remapped');
      restore(snapshot()); results.push('Duplicated gradients, masks, clip paths, hrefs, labels and SMIL event IDs remapped without restyling original; project restores');

      importSVG(svg('<circle r="20"><animate attributeName="r" dur="2s"/><animate attributeName="cx" dur="3s"/></circle>'), 'Stable SMIL selection');
      const animations = collectImportedAnimations(), selected = animations[1].id;
      root.querySelector('animate').remove(); renderAll();
      check(importedAnimations()[0].id === selected, 'SMIL identity changed when preceding animation was removed');
      selectTimelineClip({ kind: 'imported', id: selected }); deleteTimelineClip();
      check(!root.querySelector('animate') && Object.keys(state.objects).length === 1, 'Wrong SMIL clip removed');
      importSVG(svg('<style>@keyframes a{to{opacity:.5}}@keyframes b{to{fill:red}}circle{animation:a 3s infinite,b 4s infinite}</style><circle r="20"/>'), 'Stable CSS selection');
      const css = collectImportedAnimations(), second = css.find(a => a.type === 'CSS · b').id;
      const target = root.querySelector('circle'); target.style.animationName = 'none, b'; renderAll();
      check(importedAnimations().some(a => a.id === second), 'CSS identity changed when preceding animation was removed');
      selectTimelineClip({ kind: 'imported', id: second }); deleteTimelineClip();
      check(importedAnimations().length === 0 && Object.keys(state.objects).length === 1, 'Wrong CSS animation removed');
      results.push('SMIL and CSS selection survives preceding-animation removal; deletion keeps artwork');

      const setItem = Storage.prototype.setItem;
      try {
        Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
        autosave(); await new Promise(resolve => setTimeout(resolve, 650));
        check($('saveWarning') && !$('saveWarning').hidden, 'Autosave failure is invisible');
        toast('Other action'); check(!$('saveWarning').hidden, 'Transient message hides save failure');
      } finally { Storage.prototype.setItem = setItem; }
      autosave(); await new Promise(resolve => setTimeout(resolve, 650));
      check($('saveWarning').hidden, 'Successful save did not clear warning');
      results.push('Storage quota errors remain visible until autosave succeeds');
      clearTimeout(autosave.timer); localStorage.clear();
      return results;
    }, example);
    await page.evaluate(() => localStorage.setItem('svg-motion-studio-v1', '{damaged'));
    await page.reload(); await page.waitForTimeout(700);
    assert(await page.evaluate(() => localStorage.getItem('svg-motion-studio-v1') === '{damaged' && !$('saveWarning').hidden));
    await page.evaluate(() => { clearTimeout(autosave.timer); localStorage.clear(); });
    results.push('Damaged saved session warns on startup and is not silently overwritten');
    assert.deepEqual(errors, []);
    for (const result of results) console.log('PASS ' + result);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
