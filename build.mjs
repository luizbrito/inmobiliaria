import {access,readdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
await access(new URL('./public/portal/index.html',import.meta.url));
const root=import.meta.dirname,run=promisify(execFile),files=[];
async function collect(dir){for(const item of await readdir(path.join(root,dir),{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())await collect(file);else if(/\.(mjs|js)$/.test(item.name))files.push(file);}}
for(const file of await readdir(root))if(file.endsWith('.mjs'))files.push(file);
for(const dir of ['core','public/portal','scripts','tests'])await collect(dir);
for(const file of files)await run(process.execPath,['--check',path.join(root,file)]);
console.log(`${files.length} arquivos JavaScript verificados. Interface nativa sem compilação pesada.`);
