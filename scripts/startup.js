/* Called once, after core scripts and synchronous saved-session restoration. */
(() => {
  if(window.__xelaReadinessStarted)return;
  window.__xelaReadinessStarted=true;
  const controller=window.XeLaLoadingScreen;
  controller?.start(); // Reconcile inert descendants after the body has parsed.
  function fallback(failed){
    const overlay=document.getElementById('bootScreen');
    document.getElementById('bootArtwork').hidden=true;
    if(failed){
      document.getElementById('bootMessage').textContent='The editor could not finish loading. Please reload the page.';
      const retry=document.createElement('button');retry.textContent='Reload editor';retry.dataset.clickSound='off';retry.onclick=()=>location.reload();overlay.append(retry);return;
    }
    const remaining=Math.max(0,1500-(performance.now()-window.__xelaStartupSurfaceAt));
    setTimeout(()=>{overlay?.remove();document.documentElement.classList.remove('booting','boot-revealing');document.documentElement.style.removeProperty('--startup-background');document.body.setAttribute('aria-busy','false');window.__xelaReleaseStartupGuard?.();},remaining);
  }
  function failed(){controller?controller.fail():fallback(true);}
  if(window.__xelaBootError||!window.MotionStudio?.root){
    window.removeEventListener('error',window.__xelaBootWatch,true);failed();return;
  }
  const brand=document.querySelector('.brand-logo');
  Promise.resolve(brand?.decode?.()).catch(()=>{}).then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
    window.removeEventListener('error',window.__xelaBootWatch,true);
    if(window.__xelaBootError){failed();return;}
    controller?controller.finish():fallback(false);
  })));
})();
