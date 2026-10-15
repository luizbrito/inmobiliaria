// Run on the hosting server with its existing environment, before publishing.
// node --env-file=.env scripts/preflight-production.mjs EXPECTED_DB BACKUP_PATH RESTORE_TEST_DB
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import mysql from 'mysql2/promise';
import {secretBox,requiresMFA} from '../core/security.mjs';
const [expectedDatabase,backupPath,restoreDatabase]=process.argv.slice(2),root=path.resolve(import.meta.dirname,'..');
if(process.env.DB_DRIVER!=='mysql'||!expectedDatabase||expectedDatabase!==process.env.MYSQL_DATABASE)throw Error('Informe explicitamente o banco de produção esperado, igual a MYSQL_DATABASE.');
if(!backupPath||!restoreDatabase||restoreDatabase===expectedDatabase||!/^[a-zA-Z0-9_]{1,64}$/.test(restoreDatabase))throw Error('Informe backup e banco separado para testar a restauração.');
for(const key of ['MFA_ENCRYPTION_KEY','BACKUP_ENCRYPTION_KEY'])if(!/^[a-f\d]{64}$/i.test(process.env[key]||''))throw Error('Mantenha as chaves existentes de MFA e backup no ambiente.');
const env={...process.env},fingerprints=Object.fromEntries(['MFA_ENCRYPTION_KEY','BACKUP_ENCRYPTION_KEY'].map(key=>[key,createHash('sha256').update(env[key]).digest('hex')]));
const connection=await mysql.createConnection({host:env.MYSQL_HOST,port:Number(env.MYSQL_PORT||3306),user:env.MYSQL_USER,password:env.MYSQL_PASSWORD,database:expectedDatabase,...(env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
 const run=(args,environment)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{cwd:root,env:environment,stdio:['ignore','pipe','pipe']});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Operação falhou. Confira o banco e o ambiente no servidor.')));});
try{
 const [[actual]]=await connection.query('SELECT DATABASE() AS name, VERSION() AS version');if(actual.name!==expectedDatabase)throw Error('Banco conectado não corresponde ao esperado.');
 const [tables]=await connection.query('SHOW TABLES'),names=tables.map(row=>Object.values(row)[0]);for(const name of ['properties','leads','users','settings','audit','visits','property_internal','sessions','image_files'])if(!names.includes(name))throw Error('Instalação existente incompleta. Não publique antes de conferir o banco.');
 const [protectedUsers]=await connection.query('SELECT payload FROM users');for(const row of protectedUsers){const user=JSON.parse(row.payload);if(user.mfaSecret)secretBox(env.MFA_ENCRYPTION_KEY).open(user.mfaSecret);}
 // Backup script safely supports the pre-1.2 schema without notification_jobs.
 await run(['backup.mjs','backup',path.resolve(backupPath)],env);
 await run(['backup.mjs','restore',path.resolve(backupPath)],{...env,MYSQL_DATABASE:restoreDatabase});
 for(const [key,fingerprint] of Object.entries(fingerprints))if(createHash('sha256').update(process.env[key]).digest('hex')!==fingerprint)throw Error('A chave de criptografia mudou durante a operação.');
 const packageJson=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
 const [userRows]=await connection.query('SELECT payload FROM users'),admins=userRows.map(row=>JSON.parse(row.payload)).filter(user=>user.role==='admin'&&user.active),settingsRow=(await connection.query('SELECT payload FROM settings WHERE id=?',['public']))[0][0],settings=settingsRow?JSON.parse(settingsRow.payload):{};
 const result={date:new Date().toISOString(),databaseConfirmed:true,mysqlVersion:actual.version,sourceVersion:packageJson.version,backup:path.resolve(backupPath),restoreDatabase,restorationVerified:true,existingEncryptionKeysPreserved:true,bootstrapVariableStillConfigured:!!env.BOOTSTRAP_ADMIN_PASSWORD,initialPasswordVariableStillConfigured:!!env.ADMIN_PASSWORD,activeAdminsRequiringMFA:admins.filter(requiresMFA).length,activeAdminsWithMFA:admins.filter(user=>!!user.mfaSecret).length,missingPublicContactFields:['phone','email','address'].filter(key=>!settings[key])};
 await writeFile(path.resolve(backupPath)+'.preflight.json',JSON.stringify(result,null,2),{flag:'wx',mode:0o600});console.log(JSON.stringify(result));
}finally{await connection.end();}
