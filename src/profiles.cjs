const fs=require('node:fs/promises');const path=require('node:path');const crypto=require('node:crypto');
function replaceMods(text,mods){
 if(!text.startsWith('SiiNunit')||!/^\s*active_mods:\s*\d+\s*$/m.test(text))throw Error('Seuls les profils SII texte avec liste de mods explicite sont pris en charge.');
 if(mods.some(id=>!id||/["\r\n\\]/.test(id)))throw Error('Identifiant de mod invalide');
 const block=[' active_mods: '+mods.length,...[...mods].reverse().map((id,i)=>` active_mods[${i}]: "${id}"`)].join('\n');
 return text.replace(/^\s*active_mods\[\d+\]:[^\r\n]*(?:\r?\n|$)/gm,'').replace(/^\s*active_mods:\s*\d+\s*$/m,block);
}
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
async function writeAtomic(file,content){const tmp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(tmp,content,{flag:'wx'});await fs.rename(tmp,file);}
async function applyProfile(file,mods,backups){
 const before=await fs.readFile(file);const after=replaceMods(before.toString('utf8'),mods);
 await fs.mkdir(backups,{recursive:true});const backup=path.join(backups,Date.now()+'-'+crypto.randomUUID()+'.json');
 const record={file,content:before.toString('base64'),beforeHash:digest(before),afterHash:digest(Buffer.from(after))};
 await fs.writeFile(backup,JSON.stringify(record),{flag:'wx'});
 const verified=JSON.parse(await fs.readFile(backup,'utf8'));if(verified.beforeHash!==digest(Buffer.from(verified.content,'base64')))throw Error('Sauvegarde invalide');
 if(digest(await fs.readFile(file))!==record.beforeHash)throw Error('Le profil a changé. Application annulée.');
 await writeAtomic(file,after);return backup;
}
async function restoreProfile(backup){const r=JSON.parse(await fs.readFile(backup,'utf8'));if(digest(await fs.readFile(r.file))!==r.afterHash)throw Error('Le profil a changé depuis la sauvegarde. Restauration annulée.');const b=Buffer.from(r.content,'base64');if(digest(b)!==r.beforeHash)throw Error('Sauvegarde endommagée');await writeAtomic(r.file,b);}
module.exports={replaceMods,writeAtomic,applyProfile,restoreProfile};
