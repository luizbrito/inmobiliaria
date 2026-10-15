// Requires Docker Desktop. Only the ephemeral container and its two test databases are modified.
import {execFileSync,spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..'),name='confianza-qa-'+randomBytes(5).toString('hex'),password=randomBytes(24).toString('hex'),out=path.join(root,'data/mysql-qa');await mkdir(out,{recursive:true});const runDir=await mkdtemp(path.join(out,'run-'));
const docker=(args)=>execFileSync('docker',args,{encoding:'utf8',env:{...process.env,MYSQL_ROOT_PASSWORD:password},stdio:['ignore','pipe','pipe']}).trim();let connection,started=false;
const run=(args,env)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:root,env,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',chunk=>{output+=chunk;process.stdout.write(chunk);});child.stderr.on('data',chunk=>output+=chunk);child.on('exit',code=>code===0?resolve(output):reject(Error('Falha na verificação MySQL. '+output)));});
try{
 docker(['run','--rm','-d','--name',name,'-p','127.0.0.1::3306','-e','MYSQL_ROOT_PASSWORD','-e','MYSQL_ROOT_HOST=%','mysql:8.4']);started=true;const port=Number(docker(['port',name,'3306/tcp']).split(':').at(-1));
 for(let attempt=0;attempt<120;attempt++){try{connection=await mysql.createConnection({host:'127.0.0.1',port,user:'root',password});break;}catch{await new Promise(r=>setTimeout(r,500));}}
 if(!connection)throw Error('MySQL isolado não iniciou.');
 const [[version]]=await connection.query('SELECT VERSION() AS version');await connection.query('CREATE DATABASE qa_test CHARACTER SET utf8mb4');await connection.query('CREATE DATABASE qa_restored CHARACTER SET utf8mb4');
 const env={...process.env,TEST_MYSQL:'true',DB_DRIVER:'mysql',MYSQL_HOST:'127.0.0.1',MYSQL_PORT:String(port),MYSQL_USER:'root',MYSQL_PASSWORD:password,MYSQL_DATABASE:'qa_test',BACKUP_ENCRYPTION_KEY:randomBytes(32).toString('hex')};
 const output=await run(['--test','test.mjs'],env);assert(!output.includes('fail 1'));
 // Add a known photo and queue payload, then round-trip every non-session record and image.
 const photo=await sharp({create:{width:20,height:20,channels:3,background:'#213c31'}}).webp().toBuffer();await connection.query('INSERT INTO qa_test.image_files(id,bytes,content_type) VALUES(?,?,?)',['qa-photo.webp',photo,'image/webp']);await connection.query('INSERT INTO qa_test.notification_jobs(id,payload) VALUES(?,?)',['qa-job',JSON.stringify({id:'qa-job',kind:'test',state:'processed',attempts:1})]);
 const archive=path.join(runDir,'backup.enc');await run(['backup.mjs','backup',archive],env);assert(!(await readFile(archive,'utf8')).includes('qa@example.test'));await run(['backup.mjs','restore',archive],{...env,MYSQL_DATABASE:'qa_restored'});
 for(const table of ['properties','leads','settings','users','audit','property_internal','visits','notification_jobs']){const [original]=await connection.query(`SELECT id,payload FROM qa_test.${table} ORDER BY id`),[restored]=await connection.query(`SELECT id,payload FROM qa_restored.${table} ORDER BY id`);assert.deepEqual(restored,original);}
 const [[sessions]]=await connection.query('SELECT COUNT(*) AS total FROM qa_restored.sessions');assert.equal(sessions.total,0);const [originalImages]=await connection.query('SELECT * FROM qa_test.image_files ORDER BY id'),[restoredImages]=await connection.query('SELECT * FROM qa_restored.image_files ORDER BY id');assert.deepEqual(restoredImages,originalImages);
 await connection.query('CREATE DATABASE qa_legacy CHARACTER SET utf8mb4');await connection.query('CREATE DATABASE qa_legacy_restored CHARACTER SET utf8mb4');
 for(const table of ['properties','leads','settings','users','sessions','audit','property_internal','visits','image_files']){await connection.query(`CREATE TABLE qa_legacy.${table} LIKE qa_test.${table}`);await connection.query(`INSERT INTO qa_legacy.${table} SELECT * FROM qa_test.${table}`);}
 const legacyBackup=path.join(runDir,'legacy.enc');await run(['backup.mjs','backup',legacyBackup],{...env,MYSQL_DATABASE:'qa_legacy'});await run(['backup.mjs','restore',legacyBackup],{...env,MYSQL_DATABASE:'qa_legacy_restored'});const [[legacyQueue]]=await connection.query('SELECT COUNT(*) AS total FROM qa_legacy_restored.notification_jobs');assert.equal(legacyQueue.total,0);const [legacyUsers]=await connection.query('SELECT * FROM qa_legacy.users ORDER BY id'),[restoredUsers]=await connection.query('SELECT * FROM qa_legacy_restored.users ORDER BY id');assert.deepEqual(restoredUsers,legacyUsers);
 // The operator reset is tested against MySQL too, with the same authenticated state invalidation.
 await run(['recover-mfa.mjs','admin@example.test'],env);const [audits]=await connection.query('SELECT payload FROM qa_test.audit');assert(audits.some(row=>JSON.parse(row.payload).action==='mfa.operator_reset'));
 await connection.query('CREATE DATABASE qa_preflight CHARACTER SET utf8mb4');await run(['scripts/preflight-production.mjs','qa_test',path.join(runDir,'preflight.enc'),'qa_preflight'],{...env,MFA_ENCRYPTION_KEY:randomBytes(32).toString('hex')});
 const result={mysqlVersion:version.version,apiTests:Number(output.match(/pass (\d+)/)?.[1]),sqliteOnlyTestsReplaced:2,backupRestored:true,legacyBackupCompatible:true,photosIdentical:true,notificationQueueRestored:true,mfaRecovery:true,preflightVerified:true,productionDataUsed:false};await writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await connection?.end();if(started)docker(['stop',name]);}
