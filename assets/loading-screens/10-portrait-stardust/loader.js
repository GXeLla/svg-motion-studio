/* Self-contained loader registration. Does not start or reselect the boot screen. */
(function (global) {
  "use strict";
  const meta = {"id":"10-portrait-stardust","selection":"10","name":"Portrait in Stardust","background":"#101d38","cycleMs":4000,"minimumDisplayMs":1500,"svg":"loader.svg","description":"Selected XeLa startup artwork: 10. Four-second native SVG loop; a stationary illustration is used for reduced motion."};
  const scriptUrl = document.currentScript.src;
  const sourceUrl = new URL("loader.svg", scriptUrl).href;
  const definitions = global.XeLaLoaderDefinitions || (global.XeLaLoaderDefinitions = Object.create(null));
  definitions[meta.id] = Object.freeze({
    ...meta,
    mount(host) {
      const image = document.createElement("img");
      image.className = "xela-loader-artwork";
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      image.decoding = "async";
      image.draggable = false;
      let disposed = false;
      const ready = new Promise((resolve, reject) => {
        image.onload = () => disposed ? resolve() : Promise.resolve(image.decode?.()).catch(() => {}).then(resolve);
        image.onerror = () => reject(new Error("Loading artwork unavailable: " + meta.id));
      });
      image.src = sourceUrl;
      host.replaceChildren(image);
      return {
        ready,
        destroy() { disposed = true; image.onload = image.onerror = null; image.remove(); }
      };
    }
  });
})(window);
