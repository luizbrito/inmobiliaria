import {access,readdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
await access(new URL('./public/portal/index.html',import.meta.url));
const root=import.meta.dirname,run=promisify(execFile),files=['server.mjs','backup.mjs'];
for(const dir of ['core','public/portal'])for(const name of await readdir(path.join(root,dir)))if(/\.(mjs|js)$/.test(name))files.push(path.join(dir,name));
await Promise.all(files.map(file=>run(process.execPath,['--check',path.join(root,file)])));
console.log(`${files.length} arquivos JavaScript verificados. Interface nativa sem compilação pesada.`);
