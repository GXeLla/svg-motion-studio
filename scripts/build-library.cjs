/* Rebuild lazy file:// payloads after changing permanent SVG sources. */
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../assets/library');
let changed=0;
for(const file of fs.readdirSync(path.join(base,'xela')).filter(file=>file.endsWith('.svg'))){
 const id=file.slice(0,-4),svg=fs.readFileSync(path.join(base,'xela',file),'utf8');
 const output=`window.XeLaLibrary.receive(${JSON.stringify(id)},${JSON.stringify(svg)});\n`,target=path.join(base,'offline',id+'.js');
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==output){changed++;if(!process.argv.includes('--check'))fs.writeFileSync(target,output);}
}
console.log(changed+(process.argv.includes('--check')?' offline payloads differ':' offline payloads updated'));
if(process.argv.includes('--check')&&changed)process.exitCode=1;
