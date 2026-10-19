const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url'),path=require('node:path'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});let server;try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.waitForFunction(()=>!document.documentElement.classList.contains('booting'));
 for(const id of ['closeLayersBtn','selectAllBtn','addShapeBtn','undoBtn','redoBtn']){
  const geometry=await page.locator('#'+id).evaluate(button=>{const svg=button.querySelector('svg'),b=button.getBoundingClientRect(),s=svg.getBoundingClientRect(),ink=svg.getBBox(),view=svg.viewBox.baseVal;return {boxX:(s.x+s.width/2)-(b.x+b.width/2),boxY:(s.y+s.height/2)-(b.y+b.height/2),inkX:ink.x+ink.width/2-view.x-view.width/2,inkY:ink.y+ink.height/2-view.y-view.height/2};});
  for(const [key,value]of Object.entries(geometry))assert(Math.abs(value)<.6,id+' '+key+' is off-center: '+value);
 }
 await page.locator('#layersSection .section-title').screenshot({path:'/private/tmp/xela-centered-controls.png'});
 const artwork=await page.evaluate(async()=>{
  const results=[];
  for(const asset of SVG_LIBRARY.filter(a=>a.category==='Studio Artwork')){
   const svg=await XeLaLibrary.load(asset);const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');
   if(parsed.querySelector('parsererror,image'))throw Error('Invalid or rasterized SVG: '+asset.id);
   importSVG(svg,asset.name);pause();const before=Object.keys(state.objects).length;if(!before)throw Error('No editable shapes: '+asset.id);restore(snapshot());
   if(Object.keys(state.objects).length!==before)throw Error('Lost layers: '+asset.id);
   const standalone=exportSVG('static'),output=new DOMParser().parseFromString(standalone,'image/svg+xml');if(output.querySelector('parsererror'))throw Error('Export error: '+asset.id);
   results.push(asset.id);
  }
  const burst=await XeLaLibrary.load(SVG_LIBRARY.find(a=>a.id==='S25_153_comic_burst_sticker'));const cloud=await XeLaLibrary.load(SVG_LIBRARY.find(a=>a.id==='S25_154_comic_wind_cloud'));
  if(burst.indexOf('Yellow burst')<burst.indexOf('Black outline'))throw Error('Yellow fill is underneath black');if(!cloud.includes('White cloud body'))throw Error('Cloud has no white body');
  return results.length;
 });assert.equal(artwork,81);
 await page.evaluate(()=>{clearTimeout(autosave.timer);localStorage.clear();});await page.reload();await page.waitForFunction(()=>!document.documentElement.classList.contains('booting'));await page.waitForTimeout(2400);await page.screenshot({path:'/private/tmp/xela-startup-ready.png'});
 // A deliberately slow app script must never expose placeholder toolbar icons.
 server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}const type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.html')?'text/html':'application/octet-stream';res.setHeader('Content-Type',type);res.end(data);});});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const slow=await browser.newPage();let release;const gate=new Promise(resolve=>release=resolve);
 await slow.route('**/scripts/app.js',async route=>{await gate;await route.continue();});
 const loading=slow.goto('http://127.0.0.1:'+server.address().port+'/index.html');await slow.waitForSelector('#bootScreen');
 assert(await slow.locator('.topbar').evaluate(el=>getComputedStyle(el).visibility==='hidden'));
 const initial=await slow.locator('#selectAllBtn').innerHTML();assert(initial.includes('<svg'));assert((await slow.locator('#undoBtn').innerHTML()).includes('<svg'));release();await loading;await slow.waitForFunction(()=>!document.documentElement.classList.contains('booting'));assert.equal(await slow.locator('#selectAllBtn').innerHTML(),initial);
 await slow.emulateMedia({reducedMotion:'reduce'});assert.equal(await slow.locator('#bootScreen').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS centered SVG boxes/ink, final icons present before JS, throttled startup hides intermediate UI, all 81 vector imports/restores/exports, comic fill ordering.');
 }finally{server?.close();await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
