/* Validate and cache online icons before exposing them as selectable artwork. */
const onlineIcons=new Map();
const onlineSvgBodies=new Map();
const onlineStreams=new Map(),catalogIds=[];
let onlinePageSize=32,onlineTypingTimer=null,onlineResizeTimer=null;
let catalogSets=null,catalogSetIndex=0,onlinePage=0,onlineHasNext=false,onlineBusy=false;
let onlineRequest=0,onlineAbort=null,onlineQuery='';
function updateOnlinePager(){
 $('onlinePagination').hidden=$('gallerySource').value!=='online';
 $('onlinePageLabel').textContent=`Page ${onlinePage+1}`;
 $('previousOnline').disabled=onlineBusy||onlinePage===0;
 $('moreOnline').hidden=false;$('moreOnline').disabled=onlineBusy||!onlineHasNext;
}
function cancelOnlineSearch(){clearTimeout(onlineTypingTimer);onlineRequest++;onlineAbort?.abort();onlineBusy=false;$('onlineSearch').disabled=false;$('galleryGrid').setAttribute('aria-busy','false');updateOnlinePager();}
function onlineCapacity(){
 const grid=$('galleryGrid'),css=getComputedStyle(grid);
 const columns=css.gridTemplateColumns.split(' ').filter(v=>parseFloat(v)>0).length||1;
 const gap=parseFloat(css.rowGap)||12,rowHeight=parseFloat(css.getPropertyValue('--online-card-height'))||164;
 const height=grid.clientHeight-(parseFloat(css.paddingTop)||0)-(parseFloat(css.paddingBottom)||0);
 return Math.max(1,columns)*Math.max(1,Math.floor((height+gap)/(rowHeight+gap)));
}
async function catalogCandidates(offset,count,signal){
 if(!catalogSets){let data=await (await iconifyFetch('/collections',signal)).json();onlineMeta={...onlineMeta,...data};catalogSets=Object.keys(data).filter(p=>/^[a-z0-9-]+$/.test(p)).sort((a,b)=>(data[a].name||a).localeCompare(data[b].name||b));}
 const end=offset+count;
 while(catalogIds.length<=end&&catalogSetIndex<catalogSets.length){
  const prefix=catalogSets[catalogSetIndex];let data;
  try{data=await (await iconifyFetch(`/collection?prefix=${encodeURIComponent(prefix)}&info=true`,signal)).json();}
  catch(error){if(error.missing){catalogSetIndex++;continue;}throw error;}
  if(signal.aborted)throw new DOMException('Aborted','AbortError');
  const hidden=new Set(data.hidden||[]),names=[...new Set([...(data.uncategorized||[]),...Object.values(data.categories||{}).flat()])];
  if(data.info)onlineMeta[prefix]=data.info;
  catalogIds.push(...names.filter(n=>/^[a-z0-9-]+$/.test(n)&&!hidden.has(n)).sort().map(n=>`${prefix}:${n}`));catalogSetIndex++;
 }
 return {ids:catalogIds.slice(offset,end),hasNext:catalogIds.length>end||catalogSetIndex<catalogSets.length};
}
function matchesIconQuery(id,query){
 const normalized=query.toLowerCase().trim();if(normalized.includes(':'))return id.includes(normalized);
 const name=id.split(':')[1],terms=normalized.split(/\s+/).filter(Boolean);
 return terms.every(term=>name.includes(term.replaceAll('_','-')));
}
async function iconifyFetch(path,signal){
 let lastError;
 for(let host of ['https://api.iconify.design','https://api.simplesvg.com','https://api.unisvg.com']){
  try{let res=await fetch(host+path,{signal:AbortSignal.any([signal,AbortSignal.timeout(7000)])});if(res.ok)return res;if(res.status===404)throw Object.assign(Error('Unavailable icon'),{missing:true});throw Error('Icon service unavailable');}
  catch(error){if(signal.aborted||error.missing)throw error;lastError=error;}
 }
 throw lastError;
}
async function verifiedIcon(id,signal){
 if(onlineIcons.has(id))return onlineIcons.get(id);
 let supplied=onlineSvgBodies.get(id);if(!supplied)throw Error('Icon unavailable');
 let svg=serialize(sanitize(supplied)),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{
  let img=new Image();img.src=url;await img.decode();
  // A decodable SVG may still be empty, transparent, or unsupported after import.
  let canvas=document.createElement('canvas');canvas.width=canvas.height=64;let context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0,64,64);
  let pixels=context.getImageData(0,0,64,64).data,visible=false;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>8){visible=true;break;}
  if(!visible)throw Error('Empty icon');
  let icon={svg,preview:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)};
  onlineIcons.set(id,icon);return icon;
 }finally{URL.revokeObjectURL(url);}
}
function iconDataSVG(data,name,seen=new Set()){
 function resolve(key){if(seen.has(key))return null;seen.add(key);if(data.icons?.[key])return {...data,...data.icons[key]};let alias=data.aliases?.[key];if(!alias)return null;let parent=resolve(alias.parent);if(!parent)return null;return {...parent,...alias,rotate:((parent.rotate||0)+(alias.rotate||0))%4,hFlip:!!parent.hFlip!==!!alias.hFlip,vFlip:!!parent.vFlip!==!!alias.vFlip};}
 const icon=resolve(name);if(!icon?.body)return null;
 let w=icon.width||16,h=icon.height||16,body=icon.body;
 if(icon.left||icon.top)body=`<g transform="translate(${-icon.left||0} ${-icon.top||0})">${body}</g>`;
 if(icon.hFlip)body=`<g transform="translate(${w} 0) scale(-1 1)">${body}</g>`;
 if(icon.vFlip)body=`<g transform="translate(0 ${h}) scale(1 -1)">${body}</g>`;
 const rotate=((icon.rotate||0)%4+4)%4;
 if(rotate===1){body=`<g transform="translate(${h} 0) rotate(90)">${body}</g>`;[w,h]=[h,w];}
 else if(rotate===2)body=`<g transform="translate(${w} ${h}) rotate(180)">${body}</g>`;
 else if(rotate===3){body=`<g transform="translate(0 ${w}) rotate(-90)">${body}</g>`;[w,h]=[h,w];}
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" style="color:#b986f4">${body}</svg>`;
}
async function preloadIconBatches(ids,signal){
 const sets=new Map();for(const id of ids){if(onlineIcons.has(id)||onlineSvgBodies.has(id))continue;let [prefix,name]=id.split(':');if(!sets.has(prefix))sets.set(prefix,[]);sets.get(prefix).push(name);}
 const entries=[...sets];let cursor=0,failures=0;
 await Promise.all(Array.from({length:Math.min(3,entries.length)},async()=>{while(cursor<entries.length&&!signal.aborted){const [prefix,names]=entries[cursor++];try{const data=await(await iconifyFetch(`/${prefix}.json?icons=${encodeURIComponent(names.join(','))}`,signal)).json();for(const name of names){const svg=iconDataSVG(data,name);if(svg)onlineSvgBodies.set(`${prefix}:${name}`,svg);}}catch{failures++;}}}));
 return failures;
}
function onlineCard(id){
 const icon=onlineIcons.get(id),[prefix,name]=id.split(':'),card=document.createElement('button'),img=new Image();
 card.className='asset';card.dataset.iconId=id;card.title=`${name} · ${onlineMeta[prefix]?.name||prefix}`;img.alt='';img.src=icon.preview;
 card.append(img,Object.assign(document.createElement('span'),{textContent:name}),Object.assign(document.createElement('small'),{textContent:onlineMeta[prefix]?.name||prefix}));
 card.onclick=()=>loadOnline(id);return card;
}
async function fillOnlineResults(stream,query,needed,signal,current){
 while(stream.ids.length<needed&&(!stream.exhausted||stream.pending.length)){
  if(!current())return;
  if(!stream.pending.length){
   let data;
   if(!query)data=await catalogCandidates(stream.offset,128,signal);
   else{
    const colon=query.indexOf(':'),term=colon<0?query:query.slice(colon+1),prefix=colon<0?'':query.slice(0,colon);
    const response=await(await iconifyFetch(`/search?query=${encodeURIComponent(term)}&limit=128&start=${stream.offset}${prefix?'&prefix='+encodeURIComponent(prefix):''}`,signal)).json();
    if(!current())return;onlineMeta={...onlineMeta,...response.collections};
    const raw=Array.isArray(response.icons)?response.icons:[];data={ids:raw,hasNext:raw.length>=128};
   }
   if(!current())return;
   stream.offset+=data.ids.length;stream.exhausted=!data.hasNext||!data.ids.length;
   stream.pending=[...new Set(data.ids)].filter(id=>/^[a-z0-9-]+:[a-z0-9-]+$/.test(id)&&!stream.seen.has(id)&&(!query||matchesIconQuery(id,query)));
   // Exclude already visited names even if an API page overlaps the previous one.
   data.ids.forEach(id=>stream.seen.add(id));
   if(!stream.pending.length)continue;
  }
  const batch=stream.pending.slice(0,Math.min(96,Math.max(16,needed-stream.ids.length)));
  const failures=await preloadIconBatches(batch,signal);if(!current())return;
  if(failures)throw Error('Some icon sets could not be loaded. Retry.');
  let cursor=0,valid=new Array(batch.length).fill(false);
  await Promise.all(Array.from({length:Math.min(6,batch.length)},async()=>{
   while(cursor<batch.length&&current()){const i=cursor++;try{await verifiedIcon(batch[i],signal);valid[i]=true;}catch{}}
  }));
  if(!current())return;
  stream.pending.splice(0,batch.length);stream.ids.push(...batch.filter((id,i)=>valid[i]));
  $('galleryStatus').textContent=`Checking matches · ${stream.ids.length} icons ready…`;
 }
}
async function fetchOnline(page=0){
 if(typeof page!=='number')page=page?onlinePage+1:0;
 const query=$('gallerySearch').value.trim().toLowerCase();if(query!==onlineQuery)page=0;
 cancelOnlineSearch();const request=onlineRequest,controller=new AbortController();onlineAbort=controller;onlineQuery=query;
 const current=()=>request===onlineRequest&&$('gallerySource').value==='online'&&$('libraryDialog').open;
 onlinePageSize=onlineCapacity();onlineBusy=true;onlinePage=Math.max(0,page);onlineHasNext=false;
 $('onlineSearch').disabled=true;updateOnlinePager();$('galleryGrid').setAttribute('aria-busy','true');
 $('galleryStatus').textContent=query?`Searching “${query}”…`:'Loading the Iconify catalog…';
 let stream=onlineStreams.get(query);if(!stream){stream={ids:[],seen:new Set(),pending:[],offset:0,exhausted:false};onlineStreams.set(query,stream);}
 try{
  const end=(onlinePage+1)*onlinePageSize;
  // Verify one extra visible icon before enabling Next, and fill holes from failures.
  await fillOnlineResults(stream,query,end+1,controller.signal,current);if(!current())return;
  onlinePage=Math.min(onlinePage,Math.max(0,Math.ceil(stream.ids.length/onlinePageSize)-1));
  const start=onlinePage*onlinePageSize;onlineResults=stream.ids.slice(start,start+onlinePageSize);
  onlineHasNext=stream.ids.length>start+onlinePageSize;
  $('galleryGrid').replaceChildren(...onlineResults.map(onlineCard));$('galleryGrid').scrollTop=0;
  const complete=stream.exhausted&&!stream.pending.length;
  $('galleryStatus').textContent=onlineResults.length?`${start+1}–${start+onlineResults.length}${complete?' of '+stream.ids.length:''} · ${query?'matches “'+query+'”':'all collections'}`:'No displayable icons match this search.';
 }catch(error){if(current()){$('galleryStatus').textContent='Could not finish loading icons. Search again to retry.';notifyError($('galleryStatus').textContent);}}
 finally{if(current()){onlineBusy=false;$('onlineSearch').disabled=false;$('galleryGrid').setAttribute('aria-busy','false');updateOnlinePager();}}
};
async function loadOnline(id){
 let icon=onlineIcons.get(id);if(!icon)return;
 let [prefix,name]=id.split(':'),info=onlineMeta[prefix],source={id,collection:info?.name||prefix,license:info?.license||null,url:`https://iconify.design/icon-sets/${prefix}/${name}/`};
 try{checkpoint();if(qs('[name=galleryMode]:checked').value==='add'){insertSVG(icon.svg,name);state.source=state.source?[state.source,source]:source;}else{selectedAsset=id;importSVG(icon.svg,name,source);}$('libraryDialog').close();toast(`${name} loaded`);}
 catch{notifyError('This icon could not be imported.');}
};
$('gallerySource').onchange=()=>{cancelOnlineSearch();renderGallery();if($('gallerySource').value==='online')fetchOnline(0);};
$('onlineSearch').onclick=()=>fetchOnline(0);
$('previousOnline').onclick=()=>fetchOnline(onlinePage-1);
$('moreOnline').onclick=()=>fetchOnline(onlinePage+1);
$('gallerySearch').addEventListener('input',()=>{if($('gallerySource').value==='online'){cancelOnlineSearch();onlineHasNext=false;onlinePage=0;updateOnlinePager();$('galleryStatus').textContent='Updating matches…';onlineTypingTimer=setTimeout(()=>fetchOnline(0),250);}});
new ResizeObserver(()=>{clearTimeout(onlineResizeTimer);onlineResizeTimer=setTimeout(()=>{if($('libraryDialog').open&&$('gallerySource').value==='online'&&onlineCapacity()!==onlinePageSize){const first=onlinePage*onlinePageSize;fetchOnline(Math.floor(first/onlineCapacity()));}},250);}).observe($('galleryGrid'));

// A custom source menu stays beneath its trigger on macOS as well as other platforms.
function closeSourceMenu(focus=false){$('gallerySourceMenu').hidden=true;$('gallerySourceButton').setAttribute('aria-expanded','false');if(focus)$('gallerySourceButton').focus();}
function syncSourceMenu(){const value=$('gallerySource').value;$('galleryGrid').classList.toggle('online-grid',value==='online');$('gallerySourceLabel').textContent=value==='online'?'Online · Iconify':'Built-in collection';qsa('[data-gallery-source]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.gallerySource===value)));closeSourceMenu();updateOnlinePager();}
$('gallerySourceButton').onclick=()=>{const open=$('gallerySourceMenu').hidden;$('gallerySourceMenu').hidden=!open;$('gallerySourceButton').setAttribute('aria-expanded',String(open));if(open)qs(`[data-gallery-source="${$('gallerySource').value}"]`).focus();};
qsa('[data-gallery-source]').forEach(b=>b.onclick=()=>{$('gallerySource').value=b.dataset.gallerySource;closeSourceMenu(true);$('gallerySource').onchange();});
$('gallerySourcePicker').addEventListener('keydown',e=>{const buttons=qsa('[data-gallery-source]');if(e.key==='Escape'&&!$('gallerySourceMenu').hidden){e.preventDefault();e.stopPropagation();closeSourceMenu(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();$('gallerySourceMenu').hidden=false;$('gallerySourceButton').setAttribute('aria-expanded','true');let i=buttons.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[i].focus();}else if(e.key==='Tab')closeSourceMenu();});
document.addEventListener('pointerdown',e=>{if(!$('gallerySourcePicker').contains(e.target))closeSourceMenu();});
const renderGalleryWithSource=renderGallery;
renderGallery=function(){renderGalleryWithSource();syncSourceMenu();};
$('libraryDialog').addEventListener('close',()=>{cancelOnlineSearch();closeSourceMenu();});
syncSourceMenu();
