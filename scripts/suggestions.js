/* Deterministic suggestions from layer meaning and actual rendered geometry. */
function suggestedEffectsFor(id){
 const layer=object(id),element=nodes.has(id)?visual(id):null;
 if(!layer||!element)return [];
 const names=[];let ancestor=layer;
 while(ancestor){names.push(ancestor.name);ancestor=object(ancestor.parent);}
 // Generic names from imported icon paths need the asset's searchable name.
 const generic=/^(?:group|path|svg|rect|circle|ellipse|polygon|polyline|line|shape|object|g)(?:\s*\d+)?$/i;
 if(names.every(name=>generic.test(name)))names.push(state.name);
 const words=names.join(' ').toLowerCase().replace(/[_:–-]/g,' ');
 let shapes=element.matches('path,line,polyline,polygon,circle,ellipse,rect,text,use')?[element]:qsa('path,line,polyline,polygon,circle,ellipse,rect,text,use',element);
 shapes=shapes.filter(el=>!el.closest('defs,mask,clipPath'));
 const stroked=shapes.filter(el=>{let s=getComputedStyle(el);return s.stroke!=='none'&&parseFloat(s.strokeWidth)>0;});
 const linework=shapes.length>0&&stroked.length/shapes.length>=.6;
 const curved=stroked.some(el=>el.matches('circle,ellipse')||/[cqsa]/i.test(el.getAttribute('d')||''));
 const scores=new Map();
 const offer=(effect,score,reason)=>{if(!scores.has(effect)||scores.get(effect).score<score)scores.set(effect,{effect,score,reason});};
 const set=(effects,reason)=>effects.forEach((effect,i)=>offer(effect,100-i*10,reason));
 if(/\b(logo|wordmark|brand|text|letter|mail|bookmark|shield|home|house)\b/.test(words)||shapes.some(el=>el.localName==='text'))set(['fade','reveal','slide'],'A restrained entrance keeps the mark readable.');
 else if(/\b(petal|petals|bloom|flower|lotus|rosette)\b/.test(words))set(['bloom','fade','pulse'],'Radial petals suit an opening or breathing motion.');
 else if(/\b(leaf|leaves|branch|branches|stem|fern|ginkgo|olive|tree|frond|fronds)\b/.test(words))set(['sway','fade',linework?'draw':'reveal'],'Botanical forms suit gentle sway and gradual entrances.');
 else if(/\b(gear|cog|spinner|orbit|compass|sun|rays)\b/.test(words))set(['rotate','pulse','fade'],'Circular or mechanical forms suit rotation.');
 else if(/\b(heart|pulse|beat|sparkle|star)\b/.test(words))set(['pulse','bloom','fade'],'A subtle pulse emphasizes this symbol.');
 else if(/\b(bell|music|note|flag|ribbon)\b/.test(words))set(['sway',linework?'draw':'reveal','fade'],'A hanging or flexible form suits a small swing.');
 else if(/\b(cloud|moon|butterfly|wing|wings|droplet|rocket)\b/.test(words))set(['float','slide','fade'],'An airborne or lightweight form suits vertical motion.');
 else if(/\b(check|arrow|bolt|bars|chart)\b/.test(words))set([linework?'draw':'reveal','slide','fade'],'Directional geometry suits a progressive entrance.');
 else if(/\b(wave|rainbow|spiral|contour|contours|arch|arches|frame|stroke)\b/.test(words)&&linework)set([curved?'curve':'draw',curved?'draw':'reveal','fade'],'Follow the existing linework to reveal its contours.');
 else if(linework)set([curved?'curve':'draw',curved?'draw':'reveal','fade'],'Visible strokes can be traced without inventing a reveal route.');
 else if(element.matches('circle,ellipse')||/\b(circle|dots|disc)\b/.test(words))set(['pulse','bloom','fade'],'Rounded geometry suits a centered scale animation.');
 else{let box;try{box=element.getBBox();}catch{}if(box&&box.width>box.height*2.5)set(['reveal','slide','fade'],'This wide silhouette suits a directional reveal.');else set(['fade','reveal','bloom'],'A filled silhouette suits a clean opacity, clip, or scale entrance.');}
 // Stroke effects are useful only when the selected geometry has visible strokes.
 if(!linework){scores.delete('draw');scores.delete('curve');}
 offer('fade',10,'A simple entrance works with this artwork.');offer('reveal',9,'Reveal the silhouette without changing its geometry.');offer('pulse',8,'Add a subtle breathing motion.');
 return [...scores.values()].sort((a,b)=>b.score-a.score).slice(0,3);
}
function renderSuggestedEffects(){
 const selections=state.selected.map(suggestedEffectsFor).filter(list=>list.length),clip=activeClip();
 let suggestions=[];
 if(selections.length===1)suggestions=selections[0];
 else if(selections.length){let common=selections[0].filter(s=>selections.every(list=>list.some(x=>x.effect===s.effect)));suggestions=common;for(let effect of ['fade','reveal','pulse'])if(!suggestions.some(s=>s.effect===effect))suggestions.push({effect,reason:'A shared effect that works across the selected layers.'});suggestions=suggestions.slice(0,3);}
 $('suggestions').replaceChildren(...suggestions.map(({effect,reason})=>{let button=document.createElement('button');button.innerHTML=`<span>${EFFECTS[effect][1]}</span>${EFFECTS[effect][0]}`;button.title=reason;button.dataset.effect=effect;button.classList.toggle('active',clip?.effect===effect);button.setAttribute('aria-pressed',String(clip?.effect===effect));button.onclick=()=>toggleSuggestedEffect(effect);return button;}));
 $('suggestionReason').textContent=suggestions.length?(selections.length>1?'Suggestions shared by your selected layers.':suggestions[0].reason):'Select a layer to see effects suited to its shape.';
}
