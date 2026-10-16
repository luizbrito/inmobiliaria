import {mkdir,readFile,writeFile,open,unlink,readdir,stat,statfs,mkdtemp,rm,realpath} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {randomBytes} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
const exec=promisify(execFile),root=path.resolve(import.meta.dirname,'..'),defaults={state:'unconfigured',lastBackup:null,lastVerified:null,lastAttempt:null};
const directory=env=>path.resolve(env.BACKUP_DIR||path.join(root,'data/automated-backups'));
export async function backupStatus(env=process.env,now=Date.now()){let data=defaults;try{data={...defaults,...JSON.parse(await readFile(path.join(directory(env),'status.json'),'utf8'))};}catch{}const hours=Number(env.BACKUP_INTERVAL_HOURS||24);return {...data,enabled:env.BACKUP_AUTOMATION_ENABLED==='true',alert:!data.lastVerified||data.state==='failed'||!!data.errorCode||now-Date.parse(data.lastVerified)>Math.max(1,hours)*2*3600000};}
export async function runBackupVerification({env=process.env,force=false,now=()=>Date.now(),run=async(args,childEnv)=>exec(process.execPath,args,{cwd:root,env:childEnv,timeout:600000,maxBuffer:1024*1024})}={}){
 if(env.BACKUP_AUTOMATION_ENABLED!=='true')return backupStatus(env,now());const interval=Number(env.BACKUP_INTERVAL_HOURS||24),retention=Number(env.BACKUP_RETENTION_COUNT||7),budget=Number(env.BACKUP_MAX_BYTES||1073741824);if(!Number.isFinite(interval)||interval<1||interval>720||!Number.isInteger(retention)||retention<2||retention>365||!Number.isSafeInteger(budget)||budget<1048576)throw Error('BACKUP_CONFIG');
 const publicRoot=path.resolve(env.ASSET_ROOT||path.join(root,'public'));if(directory(env)===publicRoot||directory(env).startsWith(publicRoot+path.sep))throw Error('BACKUP_PUBLIC_DIRECTORY');
 await mkdir(directory(env),{recursive:true});const dir=await realpath(directory(env));if(dir===publicRoot||dir.startsWith(publicRoot+path.sep))throw Error('BACKUP_PUBLIC_DIRECTORY');const old=await backupStatus(env,now());if(!force&&old.lastAttempt&&now()-Date.parse(old.lastAttempt)<interval*3600000)return old;
 const lockPath=path.join(dir,'verification.lock');let lock;try{lock=await open(lockPath,'wx',0o600);}catch(error){if(error.code==='EEXIST'){const info=await stat(lockPath);if(now()-info.mtimeMs>3600000)await unlink(lockPath);return old;}throw error;}
 let stage,connection,verifyDB,created=false;const started=now(),state={...old,lastAttempt:new Date(started).toISOString(),state:'running'};const save=async()=>{const temporary=path.join(dir,'status-'+randomBytes(8).toString('hex')+'.json');await writeFile(temporary,JSON.stringify(state),{mode:0o600});const {rename}=await import('node:fs/promises');await rename(temporary,path.join(dir,'status.json'));};
 try{
  await save();const space=await statfs(dir);if(Number(space.bavail)*Number(space.bsize)<50*1024*1024)throw Error('BACKUP_SPACE');
  if(!/^[a-f0-9]{64}$/i.test(env.BACKUP_ENCRYPTION_KEY||''))throw Error('BACKUP_KEY');
  const file=path.join(dir,'confianza-'+new Date(started).toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(5).toString('hex')+'.enc');await run(['backup.mjs','backup',file],env);state.lastBackup=new Date(now()).toISOString();state.state='verifying';await save();if((await stat(file)).size>budget)throw Error('BACKUP_BUDGET');
  stage=await mkdtemp(path.join(tmpdir(),'confianza-verify-'));const target=path.join(stage,'restored.sqlite'),uploads=path.join(stage,'uploads');
  if(env.DB_DRIVER==='sqlite'){
   if(path.resolve(env.DB_PATH||path.join(root,'data/confianza.sqlite'))===target||path.resolve(env.UPLOAD_DIR||path.join(root,'data/uploads'))===uploads)throw Error('BACKUP_DESTINATION');
   await run(['backup.mjs','restore',file],{...env,DB_PATH:target,UPLOAD_DIR:uploads});
  }else{
   const mysql=(await import('mysql2/promise')).default;connection=await mysql.createConnection({host:env.MYSQL_HOST,port:Number(env.MYSQL_PORT||3306),user:env.MYSQL_USER,password:env.MYSQL_PASSWORD,...(env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});verifyDB='confianza_verify_'+randomBytes(12).toString('hex');if(!/^confianza_verify_[a-f0-9]{24}$/.test(verifyDB)||verifyDB===env.MYSQL_DATABASE)throw Error('BACKUP_DESTINATION');await connection.query('CREATE DATABASE `'+verifyDB+'` CHARACTER SET utf8mb4');created=true;await run(['backup.mjs','restore',file],{...env,MYSQL_DATABASE:verifyDB});
  }
  state.lastVerified=new Date(now()).toISOString();state.state='verified';state.errorCode=null;
  const files=(await readdir(dir)).filter(name=>/^confianza-\d{4}-\d\d-\d\dT[\dZ-]+-[a-f0-9]{10}\.enc$/.test(name)).sort().reverse();let total=0;for(let i=0;i<files.length;i++){const candidate=path.join(dir,files[i]),size=(await stat(candidate)).size;if(i>=retention||total+size>budget&&i>=2)await unlink(candidate);else total+=size;}
  if(total>budget)state.errorCode='backup_storage_budget';
 }catch(error){state.state='failed';state.errorCode=['BACKUP_SPACE','BACKUP_KEY','BACKUP_BUDGET','BACKUP_DESTINATION'].includes(error.message)?error.message.toLowerCase():'backup_verify_failed';}
 finally{
  try{if(created&&/^confianza_verify_[a-f0-9]{24}$/.test(verifyDB)&&verifyDB!==env.MYSQL_DATABASE)await connection.query('DROP DATABASE `'+verifyDB+'`');}catch{state.state='failed';state.errorCode='backup_cleanup';}finally{try{await connection?.end();}catch{state.state='failed';state.errorCode='backup_cleanup';}}
  if(stage){const resolved=path.resolve(stage),parent=path.resolve(tmpdir());if(path.dirname(resolved)!==parent||!path.basename(resolved).startsWith('confianza-verify-')){state.state='failed';state.errorCode='backup_cleanup';}else try{await rm(resolved,{recursive:true,force:true});}catch{state.state='failed';state.errorCode='backup_cleanup';}}
  state.durationMs=now()-started;try{await save();}finally{await lock.close();await unlink(lockPath);}
 }return state;
}
export async function enqueueBackupAlert(store,status,now=Date.now()){
 if(status.state!=='failed'&&!status.alert)return;const config=await store.get('settings','notifications');if(!config?.enabled)return;for(const u of await store.all('users')){if(!u.active||u.role!=='admin'||config.testMode&&!config.testUserIds.includes(u.id))continue;const id='backup-'+new Date(now).toISOString().slice(0,10)+'-'+u.id;if(await store.get('notification_jobs',id))continue;const job={id,userId:u.id,kind:'backup',entityId:id,channel:config.channel||'email',state:'pending',attempts:0,href:'/admin/notificacoes',createdAt:new Date(now).toISOString(),sourceAt:status.lastAttempt||new Date(now).toISOString(),dueAt:new Date(now).toISOString(),nextAt:new Date(now).toISOString(),expiresAt:new Date(now+86400000).toISOString()};await store.atomicCompareSet([{table:'notification_jobs',id,old:null,next:job}]);}
}
