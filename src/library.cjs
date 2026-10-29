const fs=require('node:fs/promises');const path=require('node:path');const {readMod}=require('./packages.cjs');
const entries=dir=>fs.readdir(dir,{withFileTypes:true}).catch(()=>[]);
async function detect(documents){
 const home=path.join(documents,'Euro Truck Simulator 2');
 const log=await fs.readFile(path.join(home,'game.log.txt'),'utf8').catch(()=> '');
 const version=log.match(/Loaded pack set version ([\d.]+)/)?.[1]||'';
 const game=log.match(/device (.+?)\/(?:base|def)\.scs mounted/)?.[1]?.replace(/\//g,path.sep)||'';
 const steamRoots=['C:\\Program Files (x86)\\Steam','C:\\Program Files\\Steam'];
 const libraries=new Set(steamRoots);
 for(const root of steamRoots){const vdf=await fs.readFile(path.join(root,'steamapps','libraryfolders.vdf'),'utf8').catch(()=> '');for(const m of vdf.matchAll(/"path"\s*"([^"]+)"/g))libraries.add(m[1].replace(/\\\\/g,'\\'));}
 if(game)libraries.add(path.resolve(game,'..','..','..'));
 const workshop=[];for(const root of libraries){const d=path.join(root,'steamapps','workshop','content','227300');if(await fs.stat(d).catch(()=>null))workshop.push(d);}
 return {home,game,mod:path.join(home,'mod'),workshop,target:version};
}
async function scan(settings,onProgress=()=>{},cancel=()=>false){
 const mods=[],warnings=[];const jobs=[];
 try{for(const e of await fs.readdir(settings.mod,{withFileTypes:true}))if(e.isDirectory()||/\.(scs|zip)$/i.test(e.name))jobs.push([path.join(settings.mod,e.name),'Local']);}catch(e){warnings.push('Dossier des mods inaccessible : '+e.message);}
 for(const root of settings.workshop||[])for(const e of await entries(root))if(e.isDirectory())jobs.push([path.join(root,e.name),'Workshop']);
 for(const [file,source]of jobs){if(cancel())break;mods.push(await readMod(file,source,settings.target));onProgress({done:mods.length,total:jobs.length});await new Promise(r=>setImmediate(r));}
 const dlcs=(await entries(settings.game)).filter(e=>/^dlc_.+\.scs$/.test(e.name)).map(e=>e.name.slice(0,-4));
 return {mods,dlcs,warnings,cancelled:cancel()};
}
module.exports={detect,scan};
