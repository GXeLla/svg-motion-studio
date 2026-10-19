/* A silent, accessible speaker toggle. There is deliberately no settings modal. */
(() => {
  const button = document.getElementById('soundSettingsBtn');
  function sync() {
    const { enabled } = XeLaSound.preferences, { available, saved } = XeLaSound.status;
    button.classList.toggle('sound-on', enabled); button.classList.toggle('sound-unavailable', !available || !saved);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? 'Mute application sounds' : 'Enable application sounds');
    button.title = `Sounds ${enabled ? 'on · 20%' : 'off'}${!available ? ' · audio unavailable' : ''}${!saved ? ' · preference not saved' : ''}`;
  }
  button.addEventListener('click', () => XeLaSound.setEnabled(!XeLaSound.preferences.enabled));
  window.addEventListener('xela:sound-settings', sync); sync();
  requestAnimationFrame(()=>requestAnimationFrame(()=>button.classList.add('sound-ready')));
})();
