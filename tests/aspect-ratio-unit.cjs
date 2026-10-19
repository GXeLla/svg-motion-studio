/* Browser-independent checks of the actual resize and ratio-control functions. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../scripts/app.js'),'utf8');
const controls=new Map(),errors=[];
const context=vm.createContext({
 state:{width:1600,height:900},
 num:(v,f=0)=>Number.isFinite(+v)?+v:f,
 clamp:(v,min,max)=>Math.min(max,Math.max(min,v)),
 $:id=>{if(!controls.has(id))controls.set(id,{});return controls.get(id);},
 checkpoint(){},autosave(){},updateUndo(){},syncCanvas(){},notifyError:message=>errors.push(message)
});
vm.runInContext(app.slice(app.indexOf('function resizeCanvasDimensions('),app.indexOf('function cssHex(')),context);
function ratio(w,h){context.$('aspectRatioWidth').value=String(w);context.$('aspectRatioHeight').value=String(h);context.applyCustomAspectRatio();}
function dimensions(w,h){assert.equal(context.state.width,w);assert.equal(context.state.height,h);}
ratio(4,5);dimensions(1600,2000);assert.equal(context.$('aspectLock').checked,true);
context.resizeCanvasDimensions(1,1000,true);dimensions(800,1000);
context.resizeCanvasDimensions(0,16000,true);dimensions(12800,16000);
context.resizeCanvasDimensions(0,600,false);dimensions(600,16000);
context.resizeCanvasDimensions(0,600,true);dimensions(600,750);
const before=JSON.stringify(context.state);
for(const invalid of [[0,1],[-1,1],[1,0],['',1],['bad',1],[Infinity,1],[16000,.001]]){
 const count=errors.length;ratio(...invalid);assert.equal(errors.length,count+1);assert.equal(JSON.stringify(context.state),before);
}
context.$('clearAspectRatio').onclick();assert.equal(context.state.customAspectRatio,null);dimensions(600,750);
context.resizeCanvasDimensions(0,800,true);dimensions(800,1000);
ratio(16,9);context.resizeCanvasDimensions(0,1600,true);dimensions(1600,900);
for(const proportions of [[16,9],[4,5],[1,1],[16000,1],[1,16000],[2.39,1]]){
 ratio(...proportions);
 for(const axis of [0,1])for(const value of [0,1,2,299,800,16000,999999]){
  context.resizeCanvasDimensions(axis,value,true);
  assert([context.state.width,context.state.height].every(v=>Number.isInteger(v)&&v>=1&&v<=16000));
 }
}
const safety=fs.readFileSync(path.join(__dirname,'../scripts/project-safety.js'),'utf8');
context.validColor=v=>/^#[0-9a-f]{6}$/i.test(v);
vm.runInContext(safety.slice(0,safety.indexOf('function stripSVGAnimations(')),context);
const artwork={},svg={querySelector:()=>artwork,querySelectorAll:selector=>selector==='[data-artwork]'?[artwork]:[]};
const project={format:'svg-motion-studio',version:1,state:{view:[0,0,600,600],objects:{},selected:[],customAspectRatio:[4,5]}};
assert.equal(JSON.stringify(context.validateProject(project,svg).customAspectRatio),'[4,5]');
delete project.state.customAspectRatio;assert.equal(context.validateProject(project,svg).customAspectRatio,null);
for(const invalid of [[1,0],[0,1],['4',5],[Infinity,1],[16000,.001],{},[1],[1,2,3]]){
 project.state.customAspectRatio=invalid;assert.throws(()=>context.validateProject(project,svg),/custom aspect ratio/);
}
console.log('PASS custom/current ratios, both resize axes, bounds, unlock/relock, invalid input, reset and project validation');
