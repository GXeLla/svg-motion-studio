const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url'),path=require('node:path'),assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const delay=()=>page.waitForTimeout(180),counts=()=>page.evaluate(()=>XeLaSound.status.counts);
  assert.deepEqual(await page.evaluate(()=>XeLaSound.preferences),{enabled:true,volume:20});
  assert.equal(await page.evaluate(()=>XeLaSound.status.initialized),false);
  await page.locator('#soundSettingsBtn').click();assert.equal(await page.evaluate(()=>XeLaSound.preferences.enabled),false);assert.equal(await page.locator('#soundDialog').count(),0);
  await page.reload();await page.waitForFunction(()=>!document.documentElement.classList.contains('booting'));assert.equal(await page.evaluate(()=>XeLaSound.preferences.enabled),false);
  await page.locator('#soundSettingsBtn').focus();await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>XeLaSound.preferences.enabled),true);assert.deepEqual(await counts(),{click:0,error:0});
  await page.locator('#helpBtn').click();await page.waitForFunction(()=>XeLaSound.status.counts.click===1,null,{timeout:3000});await page.keyboard.press('Escape');
  await page.locator('.brand').click();await delay();assert.equal((await counts()).click,2);
  assert(await page.locator('#layersSidebar').isVisible());assert(!(await page.locator('#libraryDialog').isVisible()));
  await page.locator('[data-nav=library]').click();
  const active=()=>page.locator('[data-nav].active').evaluateAll(nodes=>nodes.map(n=>n.dataset.nav));
  assert.deepEqual(await active(),['library']);
  await page.locator('#galleryCategories button[title="Studio Artwork"]').click();
  assert.equal(await page.locator('#galleryGrid .asset').count(),81);
  await page.locator('#xelaGroups button[title="Collection 03"]').click();assert.equal(await page.locator('#galleryGrid .asset').count(),5);
  await page.locator('#xelaGroups').getByRole('button',{name:'All',exact:true}).click();
  await page.locator('#gallerySearch').fill('botanical lady');assert.equal(await page.locator('#galleryGrid .asset').count(),1);
  await page.locator('#galleryGrid .asset').click();await delay();assert.equal(await page.evaluate(()=>state.name),'Botanical Lady');
  assert.equal(await page.evaluate(()=>root.querySelectorAll('image').length),0);
  for(let i=0;i<2;i++){
   await page.locator('[data-nav=library]').click();assert.deepEqual(await active(),['library']);
   await page.locator('#libraryFullscreen').click();assert.deepEqual(await active(),['library']);
   await page.keyboard.press('Escape');await delay();assert.equal((await active()).length,1);assert.notDeepEqual(await active(),['library']);
  }
  await page.locator('[data-nav=layers]').click();await page.locator('[data-nav=library]').click();assert.deepEqual(await active(),['library']);
  await page.locator('[data-nav=colors]').click();await delay();assert.deepEqual(await active(),['colors']);
  await page.locator('[data-nav=library]').click();await page.locator('[data-close=libraryDialog]').click();await delay();assert.deepEqual(await active(),['colors']);
  await page.evaluate(()=>{importSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M5 50H95" stroke="white"/></svg>','test');addEffect('draw');showLayers(true);showTab('animate');});
  await page.locator('#loop').check();await page.locator('#reverse').check();await page.locator('#revealFromEnd').check();
  assert(await page.evaluate(()=>{const c=activeClip();return c.loop&&c.reverse&&c.revealFromEnd;}));
  await page.locator('.motion-toggles').screenshot({path:'/private/tmp/xela-toggles-after.png'});
  for(const width of [1440,1000,760,390]){
   await page.setViewportSize({width,height:1000});
   assert(await page.locator('.motion-toggles').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
   const exportBox=await page.locator('#exportBtn').boundingBox();assert(exportBox.x+exportBox.width<=width+1,'Header overflow '+width);
  }
  await page.setViewportSize({width:1440,height:1000});
  await delay();const before=await counts();await page.locator('#groupBtn').click();await delay();
  const after=await counts();assert.equal(after.error,before.error+1);assert.equal(after.click,before.click,'Immediate error also played click');
  await page.locator('#groupBtn').click();await delay();assert.deepEqual(await counts(),after,'Repeated identical error made sound');
  await page.evaluate(()=>toast('Informational notice'));await delay();assert.deepEqual(await counts(),after);
  await page.locator('#soundSettingsBtn').click();await page.locator('#helpBtn').click();await delay();assert.deepEqual(await counts(),after);await page.keyboard.press('Escape');
  const support=page.locator('.support-link');assert.equal(await support.getAttribute('href'),'https://ko-fi.com/x_e_l_a');assert.equal(await support.getAttribute('rel'),'noopener noreferrer');
  assert(fs.readFileSync(path.resolve(__dirname,'../README.md'),'utf8').includes('](https://ko-fi.com/x_e_l_a)'),'README support destination differs');
  await page.context().route('https://ko-fi.com/**',route=>route.fulfill({status:200,body:'Test destination'}));
  await page.locator('#soundSettingsBtn').click();const supportBefore=await counts();
  await support.focus();const popup=page.waitForEvent('popup');await page.keyboard.press('Enter');const external=await popup;await external.waitForLoadState();assert.equal(external.url(),'https://ko-fi.com/x_e_l_a');await page.waitForTimeout(300);assert.equal((await counts()).click,supportBefore.click+1);await external.close();
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await support.evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const cssResults=await page.evaluate(()=>{
   const assert=(value,message)=>{if(!value)throw Error(message);};
   const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g"><stop stop-color="red"/></linearGradient><clipPath id="clip"><circle cx="50" cy="50" r="40"/></clipPath><mask id="mask"><rect width="100" height="100" fill="white"/></mask><symbol id="symbol"><path d="M0 0h10v10Z"/></symbol></defs><style>@keyframes a{to{opacity:.6}}@keyframes b{to{transform:translateX(3px)}}#target{animation:a 2s,b 3s}</style><g><circle id="target" cx="50" cy="50" r="30" fill="url(#g)" clip-path="url(#clip)" mask="url(#mask)"/><use href="#symbol"/></g></svg>';
   for(const index of [0,1]){importSVG(svg,'CSS edge cases');pause();const entries=collectImportedAnimations().filter(a=>a.kind==='css');assert(entries.length===2,'Initial CSS rows');selectTimelineClip({kind:'imported',id:entries[index].id});deleteTimelineClip();assert(importedAnimations().length===1,'Delete one CSS');$('undoBtn').click();assert(importedAnimations().length===2,'Undo CSS');$('redoBtn').click();assert(importedAnimations().length===1,'Redo CSS');restore(snapshot());assert(importedAnimations().length===1,'Reload CSS');const target=root.querySelector('#target');target.style.setProperty('animation-name','a, b','important');renderAll();assert(importedAnimations().length===2,'Re-enable CSS');const handle=target.getAnimations()[0];handle.cancel();collectImportedAnimations();assert(importedAnimations().length===1,'Cancelled entry remains');target.style.animationName='none';renderAll();assert(importedAnimations().length===0,'Disabled stale rows');target.style.animationName='a, b';renderAll();assert(importedAnimations().length===2,'Second re-enable');selectObject(target.dataset.visual);addEffect('fade');pause();seek(1);assert(importedAnimations().length===2,'Editor/native mixed');const out=exportSVG('animated');assert(out.includes('@keyframes a')&&out.includes('@keyframes b'),'Export lost CSS');duplicateSelected();paint('fill','#42d9d0');restore(snapshot());assert(root.querySelector('symbol'),'Symbol lost');assert(root.querySelector('mask'),'Mask lost');assert(!exportSVG('static').includes('@keyframes'),'Static animation');}
   return 'CSS deletion first/second, undo/redo, save/reload, cancel/disable/re-enable, editor clips, duplicate/edit/export, gradients/masks/clips/symbols';
  });
  console.log('PASS '+cssResults);assert.deepEqual(errors,[]);
  await page.evaluate(()=>{importSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle r="10"/><path d="M20 20h20v20Z"/></svg>','Grouping');state.selected=Object.keys(state.objects);groupSelected();ungroupSelected();restore(snapshot());if(Object.keys(state.objects).length!==2)throw Error('Ungroup lost editable paths');});
  for(const failure of ['NotAllowedError','NotSupportedError','Corrupt file']){
   const isolated=await browser.newContext();const test=await isolated.newPage();
   await test.addInitScript(name=>{if(name==='Corrupt file'){const Native=window.Audio;window.Audio=function(){return new Native('data:audio/mpeg;base64,AAAA');};}else HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Test audio failure',name));};},failure);
   await test.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await test.locator('#helpBtn').click();await test.waitForFunction(()=>!XeLaSound.status.available);
   assert.equal(await test.evaluate(()=>XeLaSound.status.available),false);assert(await test.locator('#helpDialog').isVisible());await isolated.close();
  }
  const migration=await browser.newContext();const migrated=await migration.newPage();await migrated.addInitScript(()=>localStorage.setItem('xela-click-sound-v1',JSON.stringify({enabled:false,sound:'silk',volume:91})));
  await migrated.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);assert.deepEqual(await migrated.evaluate(()=>XeLaSound.preferences),{enabled:false,volume:20});await migration.close();
  await page.evaluate(()=>{localStorage.clear();clearTimeout(autosave.timer);});await page.reload();await page.waitForFunction(()=>!document.documentElement.classList.contains('booting'));await page.waitForTimeout(500);await page.screenshot({path:'/private/tmp/xela-task-editor.png'});
  console.log('PASS default sound/gesture gate, silent persisted toggle, pointer/keyboard/brand, click-error priority and debounce, 81 lazy vectors/search/groups, Library exclusivity, toggles/responsive header, secure support link/reduced motion.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
