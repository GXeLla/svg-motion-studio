/* Lazy vector loading, including file:// without an unsafe browser flag/server. */
(() => {
  const pending = new Map();
  function receive(id, svg) {
    const asset = SVG_LIBRARY.find(item => item.id === id);
    if (asset) asset.svg = svg;
    pending.get(id)?.resolve(svg); pending.delete(id);
  }
  async function load(asset) {
    if (asset.svg) return asset.svg;
    if (pending.has(asset.id)) return pending.get(asset.id).promise;
    if (location.protocol !== 'file:') {
      const response = await fetch(asset.url);
      if (!response.ok) throw Error('This artwork could not be loaded.');
      asset.svg = await response.text(); return asset.svg;
    }
    let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    pending.set(asset.id, { promise, resolve, reject });
    const script = document.createElement('script'); script.src = `assets/library/offline/${asset.id}.js`;
    const timer = setTimeout(() => { pending.delete(asset.id); script.remove(); reject(Error('Artwork loading timed out.')); }, 12000);
    script.onload = () => { clearTimeout(timer); script.remove(); };
    script.onerror = () => { clearTimeout(timer); script.remove(); pending.delete(asset.id); reject(Error('This artwork could not be loaded.')); };
    document.head.append(script); return promise;
  }
  window.XeLaLibrary = { load, receive };
})();
