import {sourceDigest,writeEvidence} from './release-evidence.mjs';
import {spawn} from 'node:child_process';
import {writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const layer=process.argv[2]||'functional',guard=new URL('../tests/helpers/network-guard.mjs',import.meta.url).href;
await mkdir('reports',{recursive:true});
const startedDigest=await sourceDigest();
const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--grep','@'+layer,...(process.env.TEST_EXTENDED==='true'?[]:['--project=chromium']),...process.argv.slice(3)],{stdio:'inherit',env:{...process.env,TEST_LAYER:layer,NODE_OPTIONS:[process.env.NODE_OPTIONS,'--import '+guard].filter(Boolean).join(' ')}});child.on('error',reject);child.on('exit',code=>resolve(code??1));});
const xml=await (await import('node:fs/promises')).readFile('reports/'+layer+'.xml','utf8');const evidence=await writeEvidence(layer,{code,partial:process.argv.length>3,skipped:(xml.match(/<skipped/g)||[]).length,externalProviders:false},startedDigest);process.exitCode=evidence.code;
