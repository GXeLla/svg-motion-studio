const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await page.evaluate(()=>XeLaSound.setEnabled(false));
 assert(await page.locator('#soundSettingsBtn').evaluate(b=>b.parentElement.classList.contains('header-tools')&&b.previousElementSibling.classList.contains('separator')&&b.nextElementSibling.classList.contains('separator')&&b.previousElementSibling.previousElementSibling.id==='openProjectBtn'&&b.nextElementSibling.nextElementSibling.id==='undoBtn'));
 assert.equal(await page.locator('.support-link span').textContent(),'Buy me Ko-fi');assert.equal(await page.locator('.support-link').getAttribute('title'),'Support the project on Ko-fi');
 const nav=()=>page.locator('[data-nav].active').evaluateAll(a=>a.map(b=>b.dataset.nav));
 for(const keyboard of [false,true]){
  await page.evaluate(()=>showLayers(false));await page.locator('[data-nav=library]').click();
  const before=await page.evaluate(()=>snapshot());
  if(keyboard){await page.locator('.brand').focus();await page.keyboard.press('Enter');}else await page.locator('.brand').click();
  await page.waitForTimeout(180);assert(!(await page.locator('#libraryDialog').isVisible()));assert(await page.locator('#layersSidebar').isVisible());assert.deepEqual(await nav(),['layers']);assert.equal(await page.evaluate(()=>snapshot()),before);
  await page.locator('.brand').click();assert(await page.locator('#layersSidebar').isVisible());assert.deepEqual(await nav(),['layers']);
 }
 for(let i=0;i<8;i++){
  await page.locator('[data-nav=library]').click();assert.deepEqual(await nav(),['library']);
  await page.locator('[data-nav=layers]').click();assert.deepEqual(await nav(),['layers']);assert(await page.locator('#layersSidebar').isVisible());
 }
 await page.waitForTimeout(180);assert(!(await page.locator('#libraryDialog').isVisible()));
 await page.locator('[data-nav=layers]').click();assert(!(await page.locator('#layersSidebar').isVisible()));
 await page.locator('[data-nav=library]').click();await page.locator('[data-nav=layers]').click();await page.waitForTimeout(180);assert(await page.locator('#layersSidebar').isVisible());assert.deepEqual(await nav(),['layers']);
 const layersColor=await page.locator('[data-nav=layers]').evaluate(b=>getComputedStyle(b).color);
 for(const tab of ['animate','colors','canvas']){
  await page.locator(`[data-nav=${tab}]`).click();assert.deepEqual(await nav(),[tab]);assert.notEqual(await page.locator(`[data-nav=${tab}]`).evaluate(b=>getComputedStyle(b).color),layersColor);
  await page.locator(`[data-nav=${tab}]`).click();assert(!(await page.locator('.inspector').isVisible()));
 }
 await page.evaluate(()=>{importSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M10 20H90" stroke="white"/><circle cx="50" cy="60" r="15"/></svg>','Selection');showLayers(true);showTab('animate');});
 await page.locator('#selectAllBtn').click();assert.equal(await page.evaluate(()=>state.selected.length),2);assert.equal(await page.locator('#selectAllBtn').getAttribute('aria-pressed'),'true');
 await page.locator('#selectAllBtn').click();assert.equal(await page.evaluate(()=>state.selected.length),0);assert.equal(await page.locator('#selectAllBtn').getAttribute('aria-pressed'),'false');
 await page.evaluate(()=>selectObject(Object.keys(state.objects)[0]));const stage=await page.locator('#stage').boundingBox(),frame=await page.locator('#canvasFrame').boundingBox();
 assert(stage.x+2<frame.x||stage.y+2<frame.y,'Need a stage margin point');await page.mouse.click(stage.x+2,stage.y+2);assert.equal(await page.evaluate(()=>state.selected.length),0);assert.equal(await page.locator('#overlay [data-layer-id]').count(),0);
 await page.evaluate(()=>selectObject(Object.keys(state.objects)[0]));const effect=await page.locator('#suggestions button').first().getAttribute('data-effect'),button=page.locator(`#suggestions button[data-effect="${effect}"]`);
 await button.click();assert.equal(await page.evaluate(()=>object().clips.length),1);assert(await page.evaluate(()=>playing));await button.click();assert.equal(await page.evaluate(()=>object().clips.length),0);assert.equal(await page.evaluate(()=>Object.keys(state.objects).length),2);
 await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>object().clips.length),1);
 await page.locator('[data-nav=library]').click();await page.locator('#galleryCategories button[title="Studio Artwork"]').click();assert.equal(await page.locator('#galleryCategories button[title="Studio Artwork"]').textContent(),'Studio Artwork');assert.equal(await page.locator('#xelaGroups button[title="Collection 02"]').textContent(),'Dreamscapes');assert.equal(await page.locator('#galleryGrid .asset small').count(),0);assert.match(await page.locator('#galleryGrid .asset').first().getAttribute('title'),/Custom Effects|Collection|Additional Effects/);
 await page.keyboard.press('Escape');await page.waitForTimeout(180);
 for(const width of [1440,1000,760,390]){await page.setViewportSize({width,height:1000});const box=await page.locator('#exportBtn').boundingBox();assert(box.x+box.width<=width+1,'Header overflow at '+width);for(const separator of await page.locator('.sound-separator').all())assert(await separator.isVisible());}
 assert.deepEqual(errors,[]);await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{clearTimeout(autosave.timer);localStorage.clear();});await page.reload();await page.waitForTimeout(2400);await page.screenshot({path:'/private/tmp/xela-ui-refined.png'});
 console.log('PASS toolbar/separators, Ko-fi copy, descriptive labels/tooltips, stage deselection, select-all toggle, effect toggle/undo, rapid Library/Layers switching, independent tool colors, responsive header.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
