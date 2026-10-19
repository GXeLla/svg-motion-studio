/* Uses isolated Chrome profiles and a loopback-only static host with nested paths. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/loading-screens/manifest.json')));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ready=page=>page.waitForFunction(()=>!document.documentElement.classList.contains('booting'));
(async()=>{
 for(const item of manifest.loaders){const source=fs.readFileSync(path.join(root,'assets/loading-screens',item.id,'loader.svg'));assert.equal(hash(source),item.svgSha256);assert(!/<image\b|<script\b|data:|<video\b|(?:href|src)=["']https?:/i.test(source.toString()));}
 const server=http.createServer((req,res)=>{const route=decodeURIComponent(req.url.split('?')[0]);if(route==='/away'){res.end('<!doctype html><title>Away</title>Other document');return;}const file=path.resolve(root,route.replace(/^\/studio\//,''));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/studio/';
 const browser=await chromium.launch({channel:'chrome',headless:true,ignoreDefaultArgs:['--disable-back-forward-cache']});
 try{
  for(const item of manifest.loaders){
   const context=await browser.newContext({viewport:{width:1440,height:900}});await context.addInitScript(id=>window.__XELA_TEST_LOADER_ID=id,item.id);
   const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/loader.svg'))requests.push(r.url());});
   await page.goto(base+'index.html');await page.waitForFunction(()=>XeLaLoadingScreen.status.assetReady);
   assert.equal(await page.locator('#bootScreen').getAttribute('data-loader'),item.id);
   assert.equal(await page.locator('#bootScreen').evaluate(e=>getComputedStyle(e).backgroundColor),await page.evaluate(hex=>{const e=document.createElement('span');e.style.color=hex;document.body.append(e);const color=getComputedStyle(e).color;e.remove();return color;},item.background));
   assert.equal(requests.length,1);assert(requests[0].includes(item.id));
   const beforeKeys=await page.evaluate(()=>snapshot());await page.keyboard.press('Delete');await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>snapshot()),beforeKeys);assert.equal(await page.evaluate(()=>playing),false);
   await page.locator('#bootArtwork').screenshot({path:'/private/tmp/xela-loader-'+item.id+'.png'});
   await page.evaluate(()=>{XeLaLoadingScreen.start();XeLaLoadingScreen.start();});
   await page.waitForFunction(()=>XeLaLoadingScreen.status.phase==='exiting');
   assert(await page.locator('.topbar').evaluate(e=>getComputedStyle(e).visibility==='visible'&&e.inert));
   await ready(page);const status=await page.evaluate(()=>XeLaLoadingScreen.status);
   assert.equal(status.starts,1);assert(status.exitAt-status.startedAt>=1490);assert(status.endedAt-status.exitAt>=240);assert(status.endedAt-status.readyAt<2600);
   assert.equal(await page.locator('#bootScreen').count(),0);assert.equal(await page.locator('[inert]').count(),0);assert.deepEqual(await page.evaluate(()=>XeLaSound.status.counts),{click:0,error:0});assert.deepEqual(errors,[]);
   // Standalone native motion changes pixels; reduced-motion artwork stays still.
   await page.goto(base+'assets/loading-screens/'+item.id+'/loader.svg');await page.waitForTimeout(200);const moving=await page.screenshot();await page.waitForTimeout(450);assert.notEqual(hash(await page.screenshot()),hash(moving),item.id+' has no visible motion');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.locator('.xs-motion').evaluate(e=>getComputedStyle(e).display),'none');assert.equal(await page.locator('.xs-static').evaluate(e=>getComputedStyle(e).display),'inline');assert(await page.locator('.xs-static').evaluate(e=>e.getBBox().width>0));const still=await page.screenshot();await page.waitForTimeout(200);assert.equal(hash(await page.screenshot()),hash(still));
   await context.close();console.log('PASS loader/palette/native motion/static fallback: '+item.id);
  }
  // Delay core setup, then resize the same chosen illustration in-place.
  const context=await browser.newContext();const page=await context.newPage();let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/scripts/workspace.js',async route=>{await gate;await route.continue();});
  const opening=page.goto(base+'index.html');await page.waitForSelector('.xela-loader-artwork');await page.waitForTimeout(1650);assert.equal(await page.evaluate(()=>XeLaLoadingScreen.status.coreReady),false);
  const selected=await page.evaluate(()=>XeLaLoadingScreen.status.id);
  for(const [width,height]of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]){
   await page.setViewportSize({width,height});const layout=await page.evaluate(()=>{const overlay=document.getElementById('bootScreen').getBoundingClientRect(),art=document.getElementById('bootArtwork').getBoundingClientRect();return {overlay:{x:overlay.x,y:overlay.y,w:overlay.width,h:overlay.height},art:{x:art.x,y:art.y,w:art.width,h:art.height},scroll:document.documentElement.scrollWidth};});
   assert.equal(layout.overlay.x,0);assert.equal(layout.overlay.y,0);assert.equal(layout.overlay.w,width);assert.equal(layout.overlay.h,height);assert(Math.abs(layout.art.w-layout.art.h)<1);assert(Math.abs(layout.art.x+layout.art.w/2-width/2)<1);assert(layout.art.y>=0&&layout.art.y+layout.art.h<height);assert(layout.scroll<=width);assert.equal(await page.evaluate(()=>XeLaLoadingScreen.status.id),selected);
  }
  release();await opening;await ready(page);await page.unroute('**/scripts/workspace.js');
  const boot=await page.evaluate(()=>XeLaLoadingScreen.status);
  await page.locator('.brand').click();await page.keyboard.press('Escape');await page.waitForTimeout(180);await page.locator('#helpBtn').click();await page.keyboard.press('Escape');
  await page.evaluate(()=>{importSVG('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle r="25" cx="50" cy="50"/></svg>','Loader restore test');paint('fill','#42d9d0');addEffect('fade');togglePlay();seek(.5);pause();exportSVG('animated');localStorage.setItem('svg-motion-studio-v1',snapshot());});
  assert.deepEqual(await page.evaluate(()=>XeLaLoadingScreen.status),boot);await page.reload();await ready(page);assert.equal(await page.evaluate(()=>state.name),'Loader restore test');
  for(let i=0;i<3;i++){await page.reload();await ready(page);assert.equal(await page.evaluate(()=>XeLaLoadingScreen.status.starts),1);const id=await page.evaluate(()=>XeLaLoadingScreen.status.id);assert(manifest.loaders.some(item=>item.id===id));}
  await context.close();
  // Missing selected SVG/module, throwing optional module, missing controller,
  // missing transitionend, reduced motion and genuine core failure.
  for(const scenario of ['svg','module','throw-module','controller','transition','reduced','core','startup','style']){
   const isolated=await browser.newContext({reducedMotion:scenario==='reduced'?'reduce':'no-preference'});await isolated.addInitScript(()=>window.__XELA_TEST_LOADER_ID='44-eye-liquid-gold');const p=await isolated.newPage();
   if(scenario==='svg')await p.route('**/44-eye-liquid-gold/loader.svg',r=>r.fulfill({status:404,body:''}));
   if(scenario==='module')await p.route('**/44-eye-liquid-gold/loader.js',r=>r.fulfill({status:404,body:''}));
   if(scenario==='throw-module')await p.route('**/44-eye-liquid-gold/loader.js',r=>r.fulfill({contentType:'text/javascript',body:'throw Error("Optional loader failure");'}));
   if(scenario==='controller')await p.route('**/scripts/loading-screen-controller.js',r=>r.fulfill({status:404,body:''}));
   if(scenario==='core')await p.route('**/scripts/app.js',r=>r.fulfill({contentType:'text/javascript',body:'throw Error("Core test failure");'}));
   if(scenario==='startup')await p.route('**/scripts/startup.js',r=>r.fulfill({status:404,body:''}));
   if(scenario==='style')await p.route('**/styles/main.css',r=>r.fulfill({status:404,body:''}));
   await p.goto(base+'index.html');
   if(scenario==='transition')await p.addStyleTag({content:'#bootScreen{transition:none!important}'});
   if(['core','startup','style'].includes(scenario)){await p.waitForFunction(()=>XeLaLoadingScreen.status.phase==='failed');assert(await p.getByRole('button',{name:'Reload editor'}).isVisible());assert.equal(await p.locator('.xela-loader-artwork').count(),0);assert(await p.locator('.topbar').evaluate(e=>getComputedStyle(e).visibility==='hidden'));}
   else{await ready(p);assert.equal(await p.locator('#bootScreen').count(),0);assert.equal(await p.locator('[inert]').count(),0);assert.equal(await p.locator('body').getAttribute('aria-busy'),'false');}
   await isolated.close();console.log('PASS '+scenario);
  }
  // Direct-file opening and a back/forward cache restoration event cannot restart.
  const direct=await browser.newPage();await direct.goto(pathToFileURL(path.join(root,'index.html')).href);await ready(direct);const status=await direct.evaluate(()=>XeLaLoadingScreen.status);await direct.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));XeLaLoadingScreen.start();XeLaLoadingScreen.finish();XeLaLoadingScreen.destroy();});assert.deepEqual(await direct.evaluate(()=>XeLaLoadingScreen.status),status);await direct.close();
  const history=await browser.newPage();await history.goto(base+'index.html');await ready(history);
  const prior=await history.evaluate(()=>{state.name='BFCache marker';window.addEventListener('pageshow',event=>window.__restoredFromCache=event.persisted);return XeLaLoadingScreen.status;});
  await history.goto(base.replace('/studio/','/away'));await history.goBack({waitUntil:'commit'});await ready(history);
  assert.equal(await history.evaluate(()=>window.__restoredFromCache),true,'Browser did not use BFCache');
  assert.equal(await history.evaluate(()=>state.name),'BFCache marker');assert.deepEqual(await history.evaluate(()=>XeLaLoadingScreen.status),prior);assert.equal(await history.locator('[inert]').count(),0);await history.close();
  console.log('PASS dimensions, delayed readiness, restored project, repeat refresh, no editor-action restart, file://, nested hosting and BFCache lifecycle.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
