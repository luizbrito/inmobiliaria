import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {sourceDigest,writeEvidence} from './release-evidence.mjs';
const startedDigest=await sourceDigest();
try{
 for(const suite of ['unit','contracts','integration']){const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/test-runner.mjs',suite],{stdio:'inherit',env:{...process.env,TEST_COVERAGE:'true'}});child.on('error',reject);child.on('exit',code=>resolve(code??1));});if(code!==0)throw Error('Coverage suite failed: '+suite);}
 const files=new Map();
 for(const suite of ['unit','contracts','integration'])for(const record of (await readFile('reports/'+suite+'.lcov','utf8')).split('end_of_record')){
  const name=record.match(/^SF:(.+)$/m)?.[1]?.replaceAll('\\','/');if(!name)continue;const entry=files.get(name)||{lines:new Map(),branches:new Map()};files.set(name,entry);
  for(const match of record.matchAll(/^DA:(\d+),(\d+)/gm))entry.lines.set(match[1],entry.lines.get(match[1])||Number(match[2])>0);
  for(const match of record.matchAll(/^BRDA:([^,]+,[^,]+,[^,]+),([^\r\n]+)/gm))entry.branches.set(match[1],entry.branches.get(match[1])||Number(match[2])>0);
 }
 const percent=map=>map.size?100*[...map.values()].filter(Boolean).length/map.size:100,modules=[...files].map(([name,data])=>({name,lines:percent(data.lines),branches:percent(data.branches),lineTotal:data.lines.size,branchTotal:data.branches.size}));
 if(!modules.length)throw Error('No coverage data was produced');
 for(const suffix of ['core/security.mjs','core/password-reset.mjs','core/qr-delivery.mjs']){const module=modules.find(m=>m.name.endsWith(suffix));if(!module||module.lines<85||module.branches<65)throw Error('Critical coverage gate failed: '+suffix+' '+JSON.stringify(module));}
 const evidence=await writeEvidence('coverage',{code:0,modules,scope:'Node-loaded core and pure browser modules; browser E2E is scenario evidence, not Node LCOV',criticalFloors:{lines:85,branches:65}},startedDigest);console.log(JSON.stringify(evidence));process.exitCode=evidence.code;
}catch(error){await writeEvidence('coverage',{code:1,error:error.message},startedDigest);console.error(error.message);process.exitCode=1;}
