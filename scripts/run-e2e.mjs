import {spawn} from 'node:child_process';
import {sourceDigest,writeEvidence} from './release-evidence.mjs';
const startedDigest=await sourceDigest(),commands=[['scripts/test-runner.mjs','browser'],['scripts/verify-team-ui.mjs'],['scripts/verify-photo-editor.mjs'],['scripts/browser-runner.mjs','functional']];let code=0;
for(const args of commands){code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit',env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS,'--import '+new URL('../tests/helpers/network-guard.mjs',import.meta.url).href].filter(Boolean).join(' ')}});child.on('error',reject);child.on('exit',code=>resolve(code??1));});if(code!==0)break;}
const evidence=await writeEvidence('e2e',{code,commands,externalProviders:false},startedDigest);process.exitCode=evidence.code;
