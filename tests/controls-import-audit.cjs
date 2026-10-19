const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.waitForFunction(()=>!document.documentElement.classList.contains('booting'));
  const report=await page.evaluate(()=>{
   const passed=[],check=(v,m)=>{if(!v)throw Error(m);};
   const fixture='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M20 150C50 10 150 10 180 150L180 175L20 175Z" fill="#b986f4" stroke="#42d9d0" stroke-width="3"/></svg>';
   const fresh=()=>{importSVG(fixture,'Audit');pause();};
   const change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new Event('change',{bubbles:true}));};
   for(const effect of Object.keys(EFFECTS)){
    fresh();addEffect(effect);pause();
    for(const t of [0,.3,.9,1.8])seek(t);
    const output=exportSVG('animated');
    check(!new DOMParser().parseFromString(output,'image/svg+xml').querySelector('parsererror'),effect+' invalid export');
    check(root.getAnimations({subtree:true}).length>0,effect+' has no browser animation');
    restore(snapshot());check(activeClip().effect===effect,effect+' restore');
    passed.push(effect+' browser animation, seeking, XML export and restore');
   }
   fresh();addEffect('reveal');pause();
   change('duration','2.5');change('delay','.4');change('repeat','3');
   check(activeClip().duration===2.5&&activeClip().delay===.4&&activeClip().repeat===3,'Timing controls');
   for(const id of ['loop','reverse','alternate','revealFromEnd']){$(id).checked=true;$(id).dispatchEvent(new Event('change'));check(activeClip()[id],id);}
   for(const option of $('easing').options){change('easing',option.value);check(root.getAnimations({subtree:true}).length>0,'Easing '+option.value);}
   for(const option of $('revealDirection').options){change('revealDirection',option.value);seek(.8);check(activeClip().revealDirection===option.value,'Direction '+option.value);}
   passed.push('Timing, repeat, loop, reverse, alternate, opposite reveal, all easing and reveal-direction options');
   fresh();$('morphTarget').value='M30 145C65 25 135 25 170 145L170 180L30 180Z';$('morphApply').click();
   check(object().morph&&root.querySelector('animate[attributeName="d"]'),'Compatible morph');
   restore(snapshot());check(object().morph,'Morph restore');$('morphClear').click();check(!object().morph&&!root.querySelector('animate[attributeName="d"]'),'Clear morph');
   fresh();addEffect('curve');pause();Object.assign(activeClip(),{routeMode:'custom',routePoints:[[20,150],[100,20],[180,150]]});change('curveBrushWidth','17');
   check(root.querySelector('mask path').style.strokeWidth==='17','Curve brush width');restore(snapshot());check(activeClip().routePoints.length===3,'Custom route restore');
   $('autoCurveRoute').click();check(activeClip().routeMode==='auto','Automatic route');
   passed.push('Compatible path morph/apply/clear/restore and custom curved route/brush width/restore/automatic route');
   fresh();change('fillHex','#123456');check(getComputedStyle(visual()).fill==='rgb(18, 52, 86)','Fill');
   change('strokeHex','#abcdef');change('strokeWidth','7');check(getComputedStyle(visual()).stroke==='rgb(171, 205, 239)'&&getComputedStyle(visual()).strokeWidth==='7px','Stroke');
   $('fillNone').click();check(getComputedStyle(visual()).fill==='none','No fill');
   $('strokeNone').click();check(getComputedStyle(visual()).stroke==='none','No stroke');
   $('extractPalette').click();$('shufflePalette').click();check(state.palette.length>0,'Palette');
   passed.push('Fill/stroke colors, no paint, stroke width, palette extraction/shuffle');
   fresh();$('addGradient').click();const gradient=root.querySelector('linearGradient').id;
   const gradientExists=(svg=root)=>check(svg.querySelector('[id="'+gradient+'"] stop'),'Gradient or stops disappeared');
   const stopColor=$('gradientStops').querySelector('input[type=color]');stopColor.value='#123456';stopColor.dispatchEvent(new Event('change'));
   const stopOffset=$('gradientStops').querySelector('input[type=number]');stopOffset.value='25';stopOffset.dispatchEvent(new Event('change'));
   for(const effect of Object.keys(EFFECTS)){addEffect(effect);pause();applyAll();gradientExists();}
   change('posX','12');change('rotation','30');gradientExists();
   $('undoBtn').click();gradientExists();$('redoBtn').click();gradientExists();
   restore(snapshot());gradientExists();
   const stop=root.querySelector('[id="'+gradient+'"] stop');check(stop.getAttribute('offset')==='0.25'&&cssHex(getComputedStyle(stop).stopColor)==='#123456','Gradient stop edits lost');
   check(getComputedStyle(visual()).fill.includes('#'+gradient),'Gradient fill reference lost');
   for(const mode of ['animated','static'])gradientExists(new DOMParser().parseFromString(exportSVG(mode),'image/svg+xml'));
   // Simulate a project saved by the old version before its gradient was deleted.
   root.querySelector('defs[data-curve-generated]').append(root.querySelector('[id="'+gradient+'"]'));
   restore(snapshot());gradientExists();check(!root.querySelector('[id="'+gradient+'"]')?.closest('[data-curve-generated]'),'Legacy gradient not migrated');
   addEffect('curve');pause();for(let i=0;i<3;i++)applyAll();gradientExists();
   check(root.querySelectorAll('defs[data-curve-generated]').length===1,'Generated masks accumulated');
   gradientExists(new DOMParser().parseFromString(exportSVG('static'),'image/svg+xml'));
   $('addGradient').click();check(root.querySelectorAll('linearGradient').length===2,'Second gradient missing');
   $('undoBtn').click();check(root.querySelectorAll('linearGradient').length===1,'Gradient creation undo');$('redoBtn').click();check(root.querySelectorAll('linearGradient').length===2,'Gradient creation redo');
   passed.push('New gradients and edited stops survive every effect, transforms, undo/redo, restore, static/animated export and legacy project migration');
   fresh();$('aspectLock').checked=true;change('canvasWidth','800');check(state.width===800&&state.height===800,'Locked canvas');
   $('aspectLock').checked=false;change('canvasHeight','350');check(state.height===350&&state.width===800,'Unlocked canvas');
   change('backgroundHex','#123456');check(state.background==='#123456','Background');
   for(const [id,cls] of [['gridToggle','grid-on'],['guidesToggle','guides-on'],['safeToggle','safe-on']]){$(id).checked=true;$(id).dispatchEvent(new Event('change'));check($('canvasFrame').classList.contains(cls),id);}
   for(const [id,value] of [['viewX',10],['viewY',20],['viewW',150],['viewH',160]])$(id).value=value;
   $('applyView').click();check(state.view.join(',')==='10,20,150,160','Crop');$('resetCrop').click();check(state.view.join(',')==='0,0,200,200','Reset crop');
   $('zoomIn').click();check(zoom>1,'Zoom in');$('zoomOut').click();$('fitCanvas').click();check(zoom===1,'Fit');
   change('artScale','150');check(state.artScale===150,'Artwork scale');
   passed.push('Normal locked/unlocked canvas sizing, background, grid/guides/safe area, crop/reset, zoom/fit, artwork scale');
   for(const [width,height,id,value,expected] of [
    [16000,1,'canvasWidth',1,[16000,1]], [1,16000,'canvasHeight',1,[1,16000]],
    [16000,1,'canvasHeight',16000,[16000,1]], [1,16000,'canvasWidth',16000,[1,16000]],
    [800,400,'canvasWidth',1,[2,1]], [400,800,'canvasHeight',1,[1,2]],
    [800,400,'canvasHeight',16000,[16000,8000]], [400,800,'canvasWidth',16000,[8000,16000]],
    [800,400,'canvasWidth',600,[600,300]], [400,800,'canvasHeight',600,[300,600]]
   ]){
    state.width=width;state.height=height;syncCanvas();$('aspectLock').checked=true;change(id,value);
    check(state.width===expected[0]&&state.height===expected[1],'Aspect-locked bounds '+[width,height,id,value]);
    check(Number(root.getAttribute('width'))===state.width&&Number(root.getAttribute('height'))===state.height,'SVG dimensions out of sync');
    check(+$('canvasWidth').value===state.width&&+$('canvasHeight').value===state.height,'Canvas controls out of sync');
    $('undoBtn').click();check(state.width===width&&state.height===height,'Resize undo');$('redoBtn').click();
    restore(snapshot());check(state.width===expected[0]&&state.height===expected[1],'Resize redo/restore');
    const exported=new DOMParser().parseFromString(exportSVG('static'),'image/svg+xml').documentElement;
    check(+exported.getAttribute('width')===expected[0]&&+exported.getAttribute('height')===expected[1],'Export dimensions');
   }
   for(const locked of [true,false])for(const value of ['0','-100','999999','', 'invalid']){
    state.width=800;state.height=400;$('aspectLock').checked=locked;change('canvasWidth',value);
    check([state.width,state.height].every(v=>Number.isFinite(v)&&v>=1&&v<=16000),'Invalid size accepted');
   }
   passed.push('Extreme portrait/landscape resizing preserves ratio within 1–16000 px, with synchronized inputs/SVG, undo/redo, restore and exports');
   fresh();state.width=1600;state.height=900;syncCanvas();
   $('aspectRatioWidth').value='4';$('aspectRatioHeight').value='5';$('applyAspectRatio').click();
   check(state.width===1600&&state.height===2000&&$('aspectLock').checked,'Custom ratio apply');
   change('canvasHeight',1000);check(state.width===800&&state.height===1000,'Custom ratio height resize');
   change('canvasWidth',400);check(state.width===400&&state.height===500,'Custom ratio width resize');
   restore(snapshot());check(state.customAspectRatio.join(':')==='4:5','Custom ratio restore');
   change('canvasWidth',16000);check(state.width===12800&&state.height===16000,'Custom ratio bounds');
   $('aspectLock').checked=false;$('aspectLock').dispatchEvent(new Event('change'));change('canvasWidth',600);check(state.height===16000,'Custom ratio unlock');
   $('aspectLock').checked=true;change('canvasWidth',600);check(state.height===750,'Custom ratio relock');
   const original=snapshot();$('aspectRatioWidth').value='0';$('applyAspectRatio').click();check(snapshot()===original,'Invalid custom ratio changed project');
   const invalid=JSON.parse(original);invalid.state.customAspectRatio=[1,0];let badRatio=false;try{restore(invalid);}catch{badRatio=true;}check(badRatio&&snapshot()===original,'Invalid saved custom ratio accepted');
   $('clearAspectRatio').click();check(!state.customAspectRatio&&state.width===200&&state.height===200,'Reset original dimensions');
   $('undoBtn').click();check(state.customAspectRatio.join(':')==='4:5','Custom ratio undo');$('redoBtn').click();check(!state.customAspectRatio,'Custom ratio redo');
   $('aspectRatioWidth').value='16';$('aspectRatioHeight').value='9';$('applyAspectRatio').click();
   change('canvasWidth',1600);check(state.height===900,'16:9 ratio');
   fresh();check(!state.customAspectRatio&&$('clearAspectRatio').disabled,'Custom ratio leaked into new artwork');
   importSVG('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 100 100"><rect width="100" height="100"/></svg>','Original dimensions');
   $('aspectLock').checked=false;change('canvasWidth',1200);change('canvasHeight',600);check(!$('clearAspectRatio').disabled,'Reset disabled after ordinary resize');
   restore(snapshot());$('clearAspectRatio').click();check(state.width===800&&state.height===450&&state.view[2]===100,'Reset used viewBox instead of imported dimensions');
   $('undoBtn').click();check(state.width===1200&&state.height===600,'Reset undo failed');$('redoBtn').click();check(state.width===800&&state.height===450,'Reset redo failed');
   const legacy=JSON.parse(snapshot());delete legacy.state.originalSize;restore(legacy);change('canvasWidth',700);$('clearAspectRatio').click();check(state.width===100&&state.height===100,'Legacy original size fallback');
   passed.push('Custom ratios: apply, resize either side, bounds, unlock/relock, save/reopen, validation, undo/redo, reset and new import');
   const linked='<svg xmlns="http://www.w3.org/2000/svg" href="https://example.com/root"><defs><linearGradient id="paint"><stop stop-color="red"/></linearGradient></defs><a href="https://example.com" transform="translate(2 3)"><path id="shape" d="M0 0h20v20Z" style="fill:url(\'\#paint\')"/></a><use href="#shape"/><image href="https://example.com/a.png"/><style>@import url(https://example.com/a.css);path{stroke:url(https://example.com/b.svg)}</style></svg>';
   const clean=sanitize(linked);check(!serialize(clean).includes('https://'),'External URL retained');check(clean.querySelector('path')&&clean.querySelector('g').getAttribute('transform')==='translate(2 3)','Linked geometry lost');check(clean.querySelector('use').getAttribute('href')==='#shape','Internal use lost');check(clean.querySelector('path').style.fill.includes('#paint'),'Quoted local gradient lost');
   check(clipboardSVG('', '<div><script>throw Error("bad")</script>'+fixture+'</div>').includes('<path'),'HTML extraction');
   let rejected=false;try{clipboardSVG('<iconify-icon icon="mdi:home"></iconify-icon>');}catch{rejected=true;}check(rejected,'External embed accepted');
   fresh();const before=Object.keys(state.objects).length,data=new DataTransfer();data.setData('text/html','<div>'+fixture+'</div>');document.body.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:data}));check(Object.keys(state.objects).length>before,'Paste did not add artwork');
   passed.push('SVG/HTML clipboard import, linked geometry preserved, external links removed, local gradients/use preserved, embed-only markup rejected');
   return {passed};
  });
  for(const result of report.passed)console.log('PASS '+result);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
