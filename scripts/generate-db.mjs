import {readFile,writeFile,mkdir,readdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const directory=resolve(root,'drizzle'),meta=resolve(directory,'meta/_journal.json');
await mkdir(resolve(directory,'meta'),{recursive:true});
let journal={version:'7',dialect:'sqlite',entries:[]};
try{journal=JSON.parse(await readFile(meta,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
for(const name of (await readdir(resolve(root,'migrations'))).filter(n=>/^\d+_[a-z0-9_]+\.sql$/.test(n)).sort()){
 const tag=name.slice(0,-4),content=await readFile(resolve(root,'migrations',name),'utf8');
 const output=resolve(directory,name),existing=journal.entries.find(e=>e.tag===tag);
 if(existing){if(await readFile(output,'utf8')!==content)throw new Error('Migration is immutable; add a new SQL file instead of editing '+name);continue;}
 try{await access(output);throw new Error('Unjournalled migration already exists: '+name);}catch(error){if(error.code!=='ENOENT')throw error;}
 await writeFile(output,content);
 journal.entries.push({idx:journal.entries.length,version:'6',when:Date.now()+journal.entries.length,tag,breakpoints:false});
}
await writeFile(meta,JSON.stringify(journal,null,2)+'\n');
console.log('Schema migrations prepared:',journal.entries.length);
