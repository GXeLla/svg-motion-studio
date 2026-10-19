/* Two approved recordings; native media also supports direct file:// opening. */
(() => {
  'use strict';
  const key = 'xela-sounds-v2', paths = { click: 'assets/sounds/hidden-switch.mp3', error: 'assets/sounds/quiet-denied.mp3' };
  let enabled = true, saved = true, available = true, unlocked = false;
  let pending = null, current = null, lastPlay = -Infinity, lastError = '', lastErrorAt = -Infinity;
  const media = new Map(), counts = { click: 0, error: 0 };
  try {
    const value = JSON.parse(localStorage.getItem(key) || localStorage.getItem('xela-click-sound-v1') || 'null');
    if (typeof value?.enabled === 'boolean') enabled = value.enabled;
  } catch { saved = false; }
  const notify = () => window.dispatchEvent(new Event('xela:sound-settings'));
  function stop() { clearTimeout(pending); pending = null; if (current) { current.pause(); current.currentTime = 0; current = null; } }
  function setEnabled(value) {
    enabled = !!value; if (!enabled) stop();
    try { localStorage.setItem(key, JSON.stringify({ enabled })); saved = true; } catch { saved = false; }
    notify();
  }
  function play(role) {
    if (!enabled || !unlocked || document.hidden || !(role in paths)) return;
    if (role === 'click' && performance.now() - lastPlay < 45) return;
    try {
    if (current) { current.pause(); current.currentTime = 0; }
    let audio = media.get(role);
    if (!audio) { audio = new Audio(new URL(paths[role], document.baseURI).href); audio.preload = 'auto'; media.set(role, audio); }
    audio.volume = .2; audio.currentTime = 0; current = audio; lastPlay = performance.now();
    Promise.resolve(audio.play()).then(() => { available = true; counts[role]++; notify(); }).catch(error => { if(error.name!=='AbortError'){available = false; notify();} });
    } catch { available = false; notify(); }
  }
  function interaction(event) {
    if (!event.isTrusted) return;
    unlocked = true;
    const target = event.target.closest?.('button,a[href],input[type=checkbox],input[type=radio]');
    if (!target || target.disabled || target.getAttribute('aria-disabled') === 'true' || target.id === 'soundSettingsBtn' || target.closest('[data-click-sound="off"]')) return;
    clearTimeout(pending);
    // End of this event turn: an immediate notifyError cancels the ordinary click.
    pending = setTimeout(() => { pending = null; play('click'); }, 0);
  }
  function error(message) {
    clearTimeout(pending); pending = null;
    const now = performance.now();
    if (now - lastErrorAt < 350 || (message === lastError && now - lastErrorAt < 1400)) return;
    lastError = message; lastErrorAt = now; play('error');
  }
  document.addEventListener('click', interaction, true);
  // Bubble runs after the action's handler but still inside the trusted gesture.
  // The timer is only a fallback for controls that stop propagation.
  document.addEventListener('click', event => { if(event.isTrusted&&pending!==null){clearTimeout(pending);pending=null;play('click');} });
  // Let the short support-link click finish when its new tab takes focus.
  // Hidden documents cannot initiate new playback (guarded above).
  window.addEventListener('pagehide', stop);
  window.XeLaSound = Object.freeze({ setEnabled, error, stop,
    get preferences() { return { enabled, volume: 20 }; },
    get status() { return { saved, available, initialized: media.size > 0, counts: { ...counts } }; }
  });
})();
