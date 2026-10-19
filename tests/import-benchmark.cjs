const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {pathToFileURL}=require('node:url'),path=require('node:path'),os=require('node:os');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage();await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 const timingsMs=await page.evaluate(()=>{const times={};for(const count of [500,1000,2000,4000]){
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">'+Array.from({length:count},(_,i)=>`<path d="M${i%100*10} ${Math.floor(i/100)*10}h8v8h-8Z" fill="#b986f4"/>`).join('')+'</svg>';
  const start=performance.now();MotionStudio.importSVG(svg,'benchmark');times[count]=Math.round(performance.now()-start);
  if(MotionStudio.root.querySelectorAll('path').length!==count)throw Error('Paths lost during benchmark');
 }return times;});console.log(JSON.stringify({browser:browser.version(),cpu:os.cpus()[0]?.model,platform:process.platform,arch:process.arch,timingsMs},null,2));
 }finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
