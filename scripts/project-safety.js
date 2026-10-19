/* Project boundaries and SVG reference handling. No editor state is changed here. */
function validateProject(data, svg) {
  const fail = message => { throw Error(`Invalid project: ${message}`); };
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!record(data) || data.format !== 'svg-motion-studio' || data.version !== 1 || !record(data.state)) fail('unsupported project format.');
  const candidate = JSON.parse(JSON.stringify(data.state));
  const number = (value, fallback, min = -1e7, max = 1e7) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('expected a finite number.');
    return Math.min(max, Math.max(min, value));
  };
  const bounds = value => {
    if (!Array.isArray(value) || value.length !== 4 || !value.every(v => typeof v === 'number' && Number.isFinite(v)) || value[2] <= 0 || value[3] <= 0) fail('invalid canvas bounds.');
    return value;
  };
  const boolean = (value, fallback) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'boolean') fail('expected a boolean.');
    return value;
  };
  if (candidate.name !== undefined && typeof candidate.name !== 'string') fail('invalid project name.');
  candidate.name = candidate.name || 'Untitled';
  candidate.view = bounds(candidate.view);
  candidate.originalView = bounds(candidate.originalView ?? [...candidate.view]);
  candidate.width = number(candidate.width, 600, 1, 16000);
  candidate.height = number(candidate.height, 600, 1, 16000);
  if(candidate.originalSize!==undefined&&(!Array.isArray(candidate.originalSize)||candidate.originalSize.length!==2||!candidate.originalSize.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=1&&v<=16000)))fail('invalid original canvas size.');
  candidate.originalSize=candidate.originalSize||candidate.originalView.slice(2).map(v=>Math.min(16000,Math.max(1,v)));
  if(candidate.customAspectRatio!=null){
    const ratio=candidate.customAspectRatio;
    if(!Array.isArray(ratio)||ratio.length!==2||!ratio.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=.001&&v<=16000)||ratio[0]/ratio[1]<1/16000||ratio[0]/ratio[1]>16000)fail('invalid custom aspect ratio.');
  }else candidate.customAspectRatio=null;
  candidate.artScale = number(candidate.artScale, 100, 1, 1000);
  candidate.counter = Math.floor(number(candidate.counter, 0, 0));
  candidate.exportBackground = boolean(candidate.exportBackground, false);
  candidate.background = typeof candidate.background === 'string' && validColor(candidate.background) ? candidate.background : '#160f20';
  candidate.palette = Array.isArray(candidate.palette) ? candidate.palette.filter(c => typeof c === 'string' && validColor(c)).slice(0, 12) : ['#b986f4'];
  candidate.importedAnimations = [];
  if (!record(candidate.objects)) fail('layers must be an object.');
  const artwork = svg.querySelector('[data-artwork]');
  if (!artwork || svg.querySelectorAll('[data-artwork]').length !== 1) fail('project artwork is missing or duplicated.');
  const wrappers = new Map(), clips = new Set();
  for (const node of svg.querySelectorAll('[data-layer-id]')) {
    const id = node.dataset.layerId;
    if (wrappers.has(id) || !artwork.contains(node)) fail('invalid layer structure.');
    wrappers.set(id, node);
  }
  if (wrappers.size !== Object.keys(candidate.objects).length) fail('layer data does not match the SVG.');
  for (const [id, layer] of Object.entries(candidate.objects)) {
    if (!/^o\d+$/.test(id) || !record(layer) || !wrappers.has(id)) fail('invalid layer.');
    const wrapper = wrappers.get(id), base = wrapper.querySelector(`[data-base="${id}"]`), visual = wrapper.querySelector(`[data-visual="${id}"]`);
    if (!base || !visual || !base.contains(visual) || base.closest('[data-layer-id]') !== wrapper || visual.closest('[data-layer-id]') !== wrapper) fail('invalid layer contents.');
    const parent = wrapper.parentElement.closest('[data-layer-id]')?.dataset.layerId || null;
    if ((layer.parent ?? null) !== parent) fail('invalid layer parent.');
    layer.id = id; layer.parent = parent; layer.tag = visual.localName;
    if (typeof layer.name !== 'string') fail('invalid layer name.');
    candidate.counter = Math.max(candidate.counter, Number(id.slice(1)));
    for (const key of ['x', 'y', 'sx', 'sy', 'rotation', 'opacity']) layer[key] = number(layer[key], defaults()[key]);
    layer.opacity = Math.min(100, Math.max(0, layer.opacity));
    layer.visible = boolean(layer.visible, true); layer.expanded = boolean(layer.expanded, false);
    if (layer.morph != null && (!record(layer.morph) || typeof layer.morph.from !== 'string' || typeof layer.morph.to !== 'string')) fail('invalid morph paths.');
    if (layer.clips === undefined) layer.clips = [];
    if (!Array.isArray(layer.clips) || layer.clips.length > 30) fail('invalid animation list.');
    for (const clip of layer.clips) {
      if (!record(clip) || typeof clip.id !== 'string' || !/^c\d+$/.test(clip.id) || clips.has(clip.id)) fail('invalid or duplicate animation identifier.');
      clips.add(clip.id); candidate.counter = Math.max(candidate.counter, Number(clip.id.slice(1)));
      if (!Object.hasOwn(EFFECTS, clip.effect)) fail('unknown animation effect.');
      clip.duration = number(clip.duration, 1, .1, 120); clip.delay = number(clip.delay, 0, 0, 120); clip.repeat = number(clip.repeat, 1, 1, 100);
      for (const key of ['loop', 'reverse', 'alternate', 'revealFromEnd']) clip[key] = boolean(clip[key], false);
      if (clip.easing === undefined) clip.easing = 'ease-out';
      if (!['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'custom', 'elastic'].includes(clip.easing)) fail('invalid easing.');
      clip.curve ??= [0, 0, .58, 1];
      if (!Array.isArray(clip.curve) || clip.curve.length !== 4) fail('invalid easing curve.');
      clip.curve = clip.curve.map((v, i) => number(v, 0, i % 2 ? -2 : 0, i % 2 ? 3 : 1));
      if (clip.revealDirection !== undefined && !['up', 'down', 'left', 'right', 'centerX', 'centerY', 'radial', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(clip.revealDirection)) fail('invalid reveal direction.');
      if (clip.routeMode !== undefined && !['custom', 'auto'].includes(clip.routeMode)) fail('invalid route mode.');
      if (clip.routePoints !== undefined && (!Array.isArray(clip.routePoints) || clip.routePoints.length > 200 || !clip.routePoints.every(p => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && Number.isFinite(v))))) fail('invalid route points.');
      if (clip.routeMode === 'custom' && (!clip.routePoints || clip.routePoints.length < 2)) fail('custom route needs at least two points.');
      if (clip.routeWidth !== undefined) clip.routeWidth = number(clip.routeWidth, 24, .5, 2000);
      delete clip.routes; // Geometry is rebuilt from the validated SVG, never trusted from JSON.
    }
  }
  if (!Number.isSafeInteger(candidate.counter) || candidate.counter > 1e9) fail('identifier is out of range.');
  if (!Array.isArray(candidate.selected)) fail('invalid layer selection.');
  candidate.selected = [...new Set(candidate.selected.filter(id => typeof id === 'string' && wrappers.has(id)))];
  candidate.activeClip = typeof candidate.activeClip === 'string' && clips.has(candidate.activeClip) ? candidate.activeClip : null;
  return candidate;
}

function stripSVGAnimations(svg) {
  svg.querySelectorAll('animate,animateTransform,animateMotion,animateColor,set,mpath').forEach(node => node.remove());
  const cleanDeclaration = style => {
    for (const property of Array.from(style)) if (/^(?:-webkit-)?(?:animation|transition)(?:-|$)/i.test(property)) style.removeProperty(property);
  };
  for (const node of [svg, ...svg.querySelectorAll('[style]')]) cleanDeclaration(node.style);
  for (const node of svg.querySelectorAll('style')) {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(node.textContent);
    const cleanRules = parent => {
      for (let i = parent.cssRules.length - 1; i >= 0; i--) {
        const rule = parent.cssRules[i];
        if (rule.type === CSSRule.KEYFRAMES_RULE || /^@(?:-webkit-)?keyframes\b/i.test(rule.cssText)) parent.deleteRule(i);
        else { if (rule.style) cleanDeclaration(rule.style); if (rule.cssRules) cleanRules(rule); }
      }
    };
    cleanRules(sheet); node.textContent = Array.from(sheet.cssRules, rule => rule.cssText).join('\n');
  }
}

function remapClonedSVGIds(copies) {
  if (!copies.length) return;
  const elements = copies.flatMap(copy => [copy, ...copy.querySelectorAll('*')]), ids = new Map();
  const scope = `copy-scope-${crypto.randomUUID()}`, keyframes = new Map(), rules = [];
  copies.forEach(copy => copy.classList.add(scope));
  const collectRules = list => { for (const rule of list) {
    if (rule.selectorText) rules.push(rule);
    if (rule.cssRules && rule.type !== CSSRule.KEYFRAMES_RULE) collectRules(rule.cssRules);
  }};
  for (const style of copies[0].ownerSVGElement.querySelectorAll('style')) {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(style.textContent); collectRules(sheet.cssRules);
  }
  for (const style of elements.filter(node => node.localName === 'style')) {
    const sheet = new CSSStyleSheet(); sheet.replaceSync(style.textContent);
    const find = list => { for (const rule of list) {
      if (rule.type === CSSRule.KEYFRAMES_RULE) keyframes.set(rule.name, `copy-animation-${crypto.randomUUID()}`);
      else if (rule.cssRules) find(rule.cssRules);
    }}; find(sheet.cssRules);
  }
  const animationNames = names => names.split(',').map(name => keyframes.get(name.trim()) || name.trim()).join(', ');
  // Imported stylesheets are shared outside the duplicated subtree. Capture their
  // resolved paint references too, before changing any definition identifiers.
  const paint = new Map(elements.map(node => {
    const computed = getComputedStyle(node);
    const values = ['fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-mid', 'marker-end', 'animation-name'].map(key => {
      const important = node.style?.getPropertyPriority(key) || rules.some(rule => {
        try { return rule.style.getPropertyPriority(key) && node.matches(rule.selectorText); } catch { return false; }
      });
      return [key, computed.getPropertyValue(key), important ? 'important' : ''];
    });
    return [node, values];
  }));
  for (const node of elements) {
    node.removeAttribute('data-imported-animation-id');
    if (!node.id) continue;
    const old = node.id, next = `copy-${crypto.randomUUID()}`;
    ids.set(old, next); node.id = next;
  }
  const urls = text => text.replace(/url\(\s*(['"]?)#([^)'"\s]+)\1\s*\)/g, (match, quote, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
  for (const node of elements) {
    for (const attr of Array.from(node.attributes)) {
      let value = urls(attr.value);
      if (attr.localName === 'href' && value.startsWith('#') && ids.has(value.slice(1))) value = '#' + ids.get(value.slice(1));
      if (['aria-labelledby', 'aria-describedby'].includes(attr.name)) value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
      if (['begin', 'end'].includes(attr.name)) value = value.split(';').map(part => {
        for (const [id, next] of ids) if (part.trimStart().startsWith(id + '.')) return part.replace(id + '.', next + '.');
        return part;
      }).join(';');
      if (value !== attr.value) node.setAttributeNS(attr.namespaceURI, attr.name, value);
    }
    for (const [property, value, priority] of paint.get(node)) {
      const mapped = property === 'animation-name' ? animationNames(value) : value.replace(/url\(["']?[^)"']*#([^)'"\s]+)["']?\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
      if (mapped !== value) node.style.setProperty(property, mapped, priority);
    }
    if (node.localName === 'style') {
      const sheet = new CSSStyleSheet(); sheet.replaceSync(urls(node.textContent));
      const rewrite = rules => { for (const rule of rules) {
        if (rule.type === CSSRule.KEYFRAMES_RULE) { rule.name = keyframes.get(rule.name) || rule.name; continue; }
        if (rule.selectorText) for (const [id, next] of ids) {
          const selector = '#' + CSS.escape(id);
          rule.selectorText = rule.selectorText.split(selector).map((part, i) => i && !/^[\w-]/.test(part) ? '#' + next + part : (i ? selector : '') + part).join('');
        }
        // A copied stylesheet must never restyle the original artwork.
        if (rule.selectorText) rule.selectorText = `:is(${rule.selectorText}):where(.${scope}, .${scope} *)`;
        if (rule.style?.animationName) rule.style.setProperty('animation-name', animationNames(rule.style.animationName), rule.style.getPropertyPriority('animation-name'));
        if (rule.cssRules && rule.type !== CSSRule.KEYFRAMES_RULE) rewrite(rule.cssRules);
      }};
      rewrite(sheet.cssRules); node.textContent = Array.from(sheet.cssRules, rule => rule.cssText).join('\n');
    }
  }
}
