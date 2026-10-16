import {createHash} from 'node:crypto';
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
export async function sourceDigest(){
 const files=['package.json','package-lock.json','server.mjs','backup.mjs','build.mjs','playwright.config.mjs'];
 async function walk(dir){let entries;try{entries=await readdir(path.join(root,dir),{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}for(const item of entries){const name=dir+'/'+item.name;if(item.isDirectory())await walk(name);else files.push(name);}}
 for(const dir of ['core','public','scripts','tests','.github'])await walk(dir);const hash=createHash('sha256');for(const file of files.sort()){hash.update(file+'\0');hash.update(await readFile(path.join(root,file)));}return hash.digest('hex');
}
export async function writeEvidence(suite,result,startedDigest){const digest=await sourceDigest(),changed=startedDigest&&startedDigest!==digest,entry={...result,suite,digest,date:new Date().toISOString(),node:process.version,partial:result.partial||false,skipped:result.skipped||0,code:changed?1:result.code,...(changed?{error:'Source changed during verification'}:{})};await mkdir(path.join(root,'reports'),{recursive:true});await writeFile(path.join(root,'reports',suite+'.json'),JSON.stringify(entry,null,2));return entry;}
export async function requireReleaseEvidence(directory=path.join(root,'reports')){
 const digest=await sourceDigest(),required=['all','e2e','a11y','visual','mysql','coverage','release-smoke'];
 for(const suite of required){let evidence;try{evidence=JSON.parse(await readFile(path.join(directory,suite+'.json'),'utf8'));}catch{throw Error('RELEASE_BLOCKED: missing '+suite+' evidence');}
  const timestamp=Date.parse(evidence.date),age=Date.now()-timestamp;
  if(evidence.suite!==suite||evidence.code!==0||evidence.partial||evidence.skipped||evidence.digest!==digest||!Number.isFinite(timestamp)||age<0||age>86400000||!/^v24\./.test(evidence.node||''))throw Error('RELEASE_BLOCKED: failed, incomplete, stale or mismatched '+suite+' evidence');
 }
 return {digest,required};
}
