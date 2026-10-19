/* One lifecycle per document. Editor interactions never call start(). */
(() => {
  'use strict';
  if(window.XeLaLoadingScreen)return;
  let phase='idle',overlay=null,mounted=null,coreReady=false,assetReady=false;
  let minimumUntil=0,minimumTimer=null,assetTimer=null,exitTimer=null;
  let startedAt=null,readyAt=null,exitAt=null,endedAt=null,starts=0;
  const blocked=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const choice=window.__xelaStartupChoice;
  function blockEditor(){for(const element of document.body.children){if(element===overlay||element.tagName==='SCRIPT')continue;if(!blocked.has(element))blocked.set(element,element.inert);element.inert=true;}}
  function stopArtwork(){clearTimeout(assetTimer);assetTimer=null;try{mounted?.destroy();}catch{}mounted=null;}
  function clearTimers(){clearTimeout(minimumTimer);clearTimeout(assetTimer);clearTimeout(exitTimer);minimumTimer=assetTimer=exitTimer=null;}
  function unlock(){for(const [element,wasInert]of blocked)if(element.isConnected)element.inert=wasInert;blocked.clear();document.body.setAttribute('aria-busy','false');document.documentElement.classList.remove('booting','boot-revealing');document.documentElement.style.removeProperty('--startup-background');window.__xelaReleaseStartupGuard?.();}
  function complete(){
    if(phase==='done'||!coreReady||phase==='failed')return;
    phase='done';endedAt=performance.now();clearTimers();stopArtwork();overlay?.removeEventListener('transitionend',onExit);overlay?.remove();overlay=null;unlock();
  }
  function onExit(event){if(event.target===overlay&&event.propertyName==='opacity')complete();}
  function maybeExit(){
    if(!coreReady||!assetReady||phase!=='waiting')return;
    const remaining=minimumUntil-performance.now();clearTimeout(minimumTimer);
    if(remaining>0){minimumTimer=setTimeout(maybeExit,remaining);return;}
    phase='exiting';exitAt=performance.now();blockEditor();document.documentElement.classList.add('boot-revealing');
    overlay.addEventListener('transitionend',onExit);overlay.classList.add('loader-exiting');
    exitTimer=setTimeout(complete,reduced.matches?20:380);
  }
  function settled(success){
    if(assetReady||phase!=='waiting')return;
    clearTimeout(assetTimer);assetTimer=null;assetReady=true;
    if(success)minimumUntil=Math.max(minimumUntil,performance.now()+1500);
    else{stopArtwork();document.getElementById('bootArtwork').hidden=true;overlay?.classList.add('loader-fallback');}
    maybeExit();
  }
  function start(){
    if(phase!=='idle'){if(phase==='waiting'||phase==='exiting')blockEditor();return;}
    starts++;phase='waiting';startedAt=performance.now();minimumUntil=startedAt+1500;
    overlay=document.getElementById('bootScreen');if(!overlay)return;
    overlay.dataset.loader=choice.id;overlay.style.backgroundColor=choice.background;blockEditor();
    if(window.__xelaBootError){fail();return;}
    const definition=window.XeLaLoaderDefinitions?.[choice.id];
    try{
      if(!definition)throw Error('Optional loader module unavailable');
      mounted=definition.mount(document.getElementById('bootArtwork'));
      // Attach rejection handling before any subsequent work can yield.
      Promise.resolve(mounted.ready).then(()=>settled(true),()=>settled(false));
      assetTimer=setTimeout(()=>settled(false),3000);
    }catch{settled(false);}
  }
  function finish(){if(phase==='failed'||phase==='done'||coreReady)return;if(phase==='idle')start();coreReady=true;readyAt=performance.now();maybeExit();}
  function fail(){
    if(phase==='failed'||phase==='done')return;
    if(phase==='idle')start();phase='failed';clearTimers();stopArtwork();document.documentElement.classList.remove('boot-revealing');overlay?.classList.remove('loader-exiting');
    document.getElementById('bootArtwork').hidden=true;
    document.getElementById('bootMessage').textContent='The editor could not finish loading. Please reload the page.';
    const retry=document.createElement('button');retry.type='button';retry.textContent='Reload editor';retry.dataset.clickSound='off';retry.onclick=()=>location.reload();overlay.append(retry);
  }
  // A ready document stored during its exit must never return inert from BFCache.
  window.addEventListener('pagehide',()=>{if(coreReady&&phase!=='failed')complete();});
  window.addEventListener('pageshow',event=>{if(event.persisted){if(phase==='done')unlock();else if(coreReady)complete();}});
  window.XeLaLoadingScreen=Object.freeze({start,finish,fail,destroy:complete,
    get status(){return {phase,id:choice.id,starts,startedAt,readyAt,exitAt,endedAt,coreReady,assetReady};}
  });
})();
