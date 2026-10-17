import {sourceDigest,writeEvidence} from './release-evidence.mjs';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {freePort,isolatedEnv,removeFixture} from '../tests/helpers/fixtures.mjs';
const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..'),directory=await mkdtemp(path.join(tmpdir(),'confianza-release-test-'));
const startedDigest=await sourceDigest();let child,result={suite:'release-smoke',code:1,date:new Date().toISOString(),productionUsed:false};
try{
 if(!process.argv.includes('--smoke-only')){
  const {requireReleaseEvidence}=await import('./release-evidence.mjs');await requireReleaseEvidence();
 }
 const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version,date='2026-10-17',archives=path.join(directory,'archives'),extracted=path.join(directory,'package');await mkdir(extracted);
 await run(process.env.PYTHON||'python',['scripts/package-release.py',date,'--output-dir',archives],{cwd:root});
 const archive=path.join(archives,`confianza-hostinger-${version}-${date}.zip`),bytes=await readFile(archive),sum=(await readFile(archive+'.sha256','utf8')).split(' ')[0];assert.equal(createHash('sha256').update(bytes).digest('hex'),sum);
 await run(process.env.PYTHON||'python',['-c',`import zipfile,pathlib,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 names=z.namelist()
 assert {'package.json','package-lock.json','server.mjs','tests/helpers/fixtures.mjs','playwright.config.mjs'}.issubset(names)
 for name in names:
  p=pathlib.PurePosixPath(name)
  assert not p.is_absolute() and '..' not in p.parts
  assert not set(p.parts).intersection({'node_modules','data','releases','reports','.git','__pycache__'})
  assert not p.name.startswith('.env')
 assert z.testzip() is None
 z.extractall(sys.argv[2])`,archive,extracted]);
 const npmArgs=['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'];
 if(process.platform==='win32')await run(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm.cmd '+npmArgs.join(' ')],{cwd:extracted,timeout:300000});else await run('npm',npmArgs,{cwd:extracted,timeout:300000});
 await run(process.execPath,['build.mjs'],{cwd:extracted});const port=await freePort(),origin='http://127.0.0.1:'+port;
 child=spawn(process.execPath,['server.mjs'],{cwd:extracted,env:isolatedEnv({DB_DRIVER:'sqlite',DB_PATH:path.join(directory,'smoke.sqlite'),UPLOAD_DIR:path.join(directory,'uploads'),PORT:String(port),PUBLIC_ORIGIN:origin,ADMIN_EMAIL:'smoke@example.test',ADMIN_PASSWORD:randomBytes(20).toString('hex'),MFA_ENCRYPTION_KEY:randomBytes(32).toString('hex')}),stdio:['ignore','pipe','pipe']});let output='',ready=false;child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);let spawnError;child.on('error',e=>spawnError=e);
 for(let i=0;i<100;i++){if(spawnError)throw spawnError;if(child.exitCode!==null)throw Error('Extracted server failed: '+output);try{if((await fetch(origin+'/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert(ready,'Extracted server never became healthy');
 assert.equal((await fetch(origin+'/api/users')).status,401);assert.equal((await fetch(origin+'/admin/imoveis/novo')).status,200);const properties=await (await fetch(origin+'/api/properties')).json();assert(properties.length>0);assert(properties.every(p=>p.status==='Publicado'&&!p.internal));
 result={...result,code:0,version,zipIntegrity:true,checksum:true,cleanProductionInstall:true,extractedBuild:true,extractedHealth:true,anonymousBoundary:true};console.log(JSON.stringify(result));
}catch(error){result.error=error.message;console.error(error.message);process.exitCode=1;}
finally{if(child&&child.exitCode===null){child.kill();await new Promise(resolve=>{const timer=setTimeout(resolve,3000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}await removeFixture(directory);await mkdir(path.join(root,'reports'),{recursive:true});await writeEvidence('release-smoke',result,startedDigest);}
