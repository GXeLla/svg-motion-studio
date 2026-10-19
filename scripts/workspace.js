/* Panel behavior, accessible controls, and timeline-only selection. */
const controlIcon=body=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const eyeIcon=controlIcon('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>');
const hiddenEyeIcon=controlIcon('<path d="m3 3 18 18M9.8 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a19 19 0 0 1-3 3.8M6.1 6.1A22 22 0 0 0 2 12s3.5 7 10 7a12 12 0 0 0 5.7-1.5M10 10a3 3 0 0 0 4 4"/>');
$('selectAllBtn').setAttribute('aria-label','Select all top-level layers');
$('addShapeBtn').setAttribute('aria-label','Add SVG to canvas');
studioHooks.layersRendered=function(){const all=allTopLayersSelected();$('selectAllBtn').setAttribute('aria-pressed',String(all));$('selectAllBtn').title=all?'Deselect all layers':'Select all top-level layers';$('selectAllBtn').setAttribute('aria-label',$('selectAllBtn').title);qsa('.layer-row', $('layersList')).forEach(row=>{const hidden=row.classList.contains('hidden-layer'),button=qs('.visibility',row);if(button.dataset.eyeState!==String(hidden)){button.innerHTML=hidden?hiddenEyeIcon:eyeIcon;button.dataset.eyeState=String(hidden);}button.classList.toggle('is-hidden',hidden);button.title=hidden?'Show layer':'Hide layer';button.setAttribute('aria-label',button.title);button.setAttribute('aria-pressed',String(!hidden));});};

function hideInspector(){qs('.inspector').hidden=true;qs('.inspector').classList.remove('mobile-open');qs('.workspace').classList.add('inspector-hidden');syncNavigation();fitSize();}
function toggleInspector(tab){if(!qs('.inspector').hidden&&qs('[data-tab].active')?.dataset.tab===tab)hideInspector();else showTab(tab);}
qs('.brand').addEventListener('click',event=>{
 event.preventDefault();
 showLayers(true);
 if(gallery.open)gallery.close();
 syncNavigation();fitSize();
});

// The expanded library behaves as a workspace page, leaving the tool rail usable.
const gallery=$('libraryDialog'),nativeGalleryClose=gallery.close.bind(gallery);
let galleryCloseTimer=null,galleryOpener=null;
function showLibraryDialog(){clearTimeout(galleryCloseTimer);gallery.classList.remove('gallery-closing');galleryOpener=document.activeElement;if(!gallery.open)gallery.show();gallery.setAttribute('aria-modal','false');gallery.classList.add('gallery-opening');setTimeout(()=>gallery.classList.remove('gallery-opening'),200);}
gallery.close=function(){if(!gallery.open||gallery.classList.contains('gallery-closing'))return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;gallery.classList.add('gallery-closing');syncNavigation();galleryCloseTimer=setTimeout(()=>{nativeGalleryClose();gallery.classList.remove('gallery-closing');if(galleryOpener?.isConnected&&(gallery.contains(document.activeElement)||document.activeElement===document.body))galleryOpener.focus();},reduced?0:160);};
function navigateRail(name){
 if(name==='library'){openGallery();return;}
 const fromLibrary=gallery.open&&!gallery.classList.contains('gallery-closing');
 if(name==='layers')showLayers(fromLibrary||foregroundTool!=='layers'||qs('.sidebar').hidden);
 else if(fromLibrary||foregroundTool!==name)showTab(name);
 else toggleInspector(name);
 if(gallery.open)gallery.close();syncNavigation();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&gallery.open&&!e.target.closest('#gallerySourcePicker')){e.preventDefault();e.stopImmediatePropagation();gallery.close();}},true);

// A clip selected in the timeline owns Backspace/Delete until another panel is clicked.
let selectedTimelineClip=null;
function selectTimelineClip(selection){selectedTimelineClip=selection;qsa('#timelineTracks .clip').forEach(el=>{const selected=selection?.kind==='editor'?el.dataset.clip===selection.id:el.dataset.importedClip===selection?.id;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected));});$('removeTimelineClip').disabled=!selection;}
function deleteTimelineClip(){
 const selection=selectedTimelineClip;if(!selection)return;pause();
 if(selection.kind==='editor'){
  const owner=object(selection.layer),clip=owner?.clips.find(c=>c.id===selection.id);if(!clip){selectTimelineClip(null);return;}
  checkpoint();owner.clips=owner.clips.filter(c=>c.id!==selection.id);state.activeClip=null;
 }else{
  const {node,animation,target,slot,name}=importedClipTarget(selection.id);if(!node&&!target){selectTimelineClip(null);return;}
  checkpoint();if(node){if(node.dataset.morph&&object(node.dataset.morph))object(node.dataset.morph).morph=null;node.remove();}else{
   // Keep other CSS animations on the same element intact.
   const names=cssList(getComputedStyle(target).animationName);
   const index=slot;if(index>=0&&names[index]===name){names[index]='none';target.style.setProperty('animation-name',names.join(', '),'important');}animation?.cancel();
  }
 }
 selectTimelineClip(null);state.importedAnimations=[];applyAll();renderAll();autosave();toast('Animation removed. Artwork kept.');
}
const timelineHeader=qs('.timeline-header>div:last-child'),removeButton=document.createElement('button');removeButton.id='removeTimelineClip';removeButton.textContent='Remove clip';removeButton.title='Remove selected animation (Delete / Backspace)';removeButton.disabled=true;removeButton.onclick=deleteTimelineClip;timelineHeader.prepend(removeButton);
studioHooks.timelineRendered=function(){qsa('#timelineTracks .clip[data-clip]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',el.title);el.addEventListener('pointerdown',()=>{el.focus({preventScroll:true});let owner=Object.values(state.objects).find(o=>o.clips.some(c=>c.id===el.dataset.clip));selectTimelineClip({kind:'editor',id:el.dataset.clip,layer:owner.id});renderInspector();renderLayers();});el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();const owner=Object.values(state.objects).find(o=>o.clips.some(c=>c.id===el.dataset.clip));selectObject(owner.id);state.activeClip=el.dataset.clip;selectTimelineClip({kind:'editor',id:el.dataset.clip,layer:owner.id});renderInspector();}};});const imported=qsa('#timelineTracks .clip:not([data-clip])');imported.forEach((el,i)=>{el.classList.add('imported-clip');el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',el.title);const choose=()=>{pause();el.focus({preventScroll:true});selectTimelineClip({kind:'imported',id:el.dataset.importedClip});};el.onpointerdown=choose;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();choose();}};});if(selectedTimelineClip){const valid=selectedTimelineClip.kind==='editor'?Object.values(state.objects).some(o=>o.clips.some(c=>c.id===selectedTimelineClip.id)):importedAnimations().some(a=>a.id===selectedTimelineClip.id);selectTimelineClip(valid?selectedTimelineClip:null);}};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.timeline-panel'))selectTimelineClip(null);},true);
document.addEventListener('focusin',e=>{if(!e.target.closest('.timeline-panel'))selectTimelineClip(null);});
document.addEventListener('keydown',e=>{if(!['Backspace','Delete'].includes(e.key)||e.target.closest('input,textarea,select,[contenteditable=true]')||qsa('dialog').some(d=>d.open)||!selectedTimelineClip)return;e.preventDefault();e.stopImmediatePropagation();deleteTimelineClip();},true);

function allTopLayersSelected(){const ids=Object.values(state.objects).filter(o=>!o.parent).map(o=>o.id);return ids.length>0&&ids.every(id=>state.selected.includes(id));}
function clearArtworkSelection(){if(routeDrawing)cancelCurveDrawing();state.selected=[];state.activeClip=null;selectTimelineClip(null);renderLayers();renderInspector();renderTimeline();refreshSelection();}
function toggleAllSelection(){if(allTopLayersSelected())return clearArtworkSelection();state.selected=Object.values(state.objects).filter(o=>!o.parent).map(o=>o.id);state.activeClip=null;selectTimelineClip(null);renderLayers();renderInspector();renderTimeline();refreshSelection();}
$('stage').addEventListener('pointerdown',event=>{if(event.button!==0||cropMode||routeDrawing||event.target.closest('#canvasFrame,button,input,select,a,[role=button]'))return;clearArtworkSelection();});
function toggleSuggestedEffect(effect){
 if(activeClip()?.effect!==effect){addEffect(effect);if(state.selected.length){seek(0);if(!playing)togglePlay();}return;}
 checkpoint();pause();for(const id of state.selected){const layer=object(id),clip=layer.clips.find(c=>c.id===state.activeClip)||layer.clips[0];if(clip?.effect===effect)layer.clips=layer.clips.filter(c=>c!==clip);}
 state.activeClip=null;selectTimelineClip(null);applyAll();renderInspector();commit();
}

// Vertical splitter; keyboard arrows offer the same adjustment as dragging.
const timeline=qs('.timeline-panel'),splitter=document.createElement('div');splitter.id='timelineResize';splitter.tabIndex=0;splitter.setAttribute('role','separator');splitter.setAttribute('aria-orientation','horizontal');splitter.setAttribute('aria-label','Resize timeline height');splitter.title='Drag up/down to resize timeline; arrow keys also work';timeline.prepend(splitter);
function timelineBounds(){return {min:150,max:Math.max(150,Math.floor(qs('.stage-column').clientHeight*.7))};}
function setTimelineHeight(value){const {min,max}=timelineBounds(),height=clamp(value,min,max);timeline.style.height=height+'px';splitter.setAttribute('aria-valuemin',min);splitter.setAttribute('aria-valuemax',max);splitter.setAttribute('aria-valuenow',Math.round(height));try{localStorage.setItem('xela-timeline-height',height);}catch{}fitSize();}
splitter.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();const start=e.clientY,height=timeline.getBoundingClientRect().height;splitter.setPointerCapture(e.pointerId);splitter.classList.add('dragging');const move=ev=>setTimelineHeight(height+start-ev.clientY),end=()=>{splitter.removeEventListener('pointermove',move);splitter.removeEventListener('pointerup',end);splitter.removeEventListener('pointercancel',end);splitter.classList.remove('dragging');};splitter.addEventListener('pointermove',move);splitter.addEventListener('pointerup',end);splitter.addEventListener('pointercancel',end);};
splitter.onkeydown=e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();const b=timelineBounds(),height=timeline.getBoundingClientRect().height;setTimelineHeight(e.key==='Home'?b.min:e.key==='End'?b.max:height+(e.key==='ArrowUp'?20:-20));}};
try{const saved=Number(localStorage.getItem('xela-timeline-height'));if(saved)setTimelineHeight(saved);}catch{}
new ResizeObserver(()=>{if(timeline.style.height)setTimelineHeight(parseFloat(timeline.style.height));}).observe(qs('.stage-column'));
renderLayers();renderTimeline();
