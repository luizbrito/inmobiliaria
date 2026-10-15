// Offline operator tool. Stop the application before use; requires database access.
import {DatabaseSync} from 'node:sqlite';
const email=process.argv[2];if(!email)throw Error('Uso: node --env-file=.env recover-mfa.mjs email-do-admin');
const sqlite=process.env.DB_DRIVER==='sqlite';let db;
if(sqlite)db=new DatabaseSync(process.env.DB_PATH||'./data/confianza.sqlite');
else{const mysql=(await import('mysql2/promise')).default;db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),database:process.env.MYSQL_DATABASE,user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,...(process.env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});}
const query=async(sql,args=[])=>sqlite?db.prepare(sql).all(...args):(await db.execute(sql,args))[0];
const run=async(sql,args=[])=>sqlite?db.prepare(sql).run(...args):db.execute(sql,args);
try{
 if(sqlite)db.exec('BEGIN IMMEDIATE');else await db.beginTransaction();
 const user=(await query('SELECT payload FROM users')).map(r=>JSON.parse(r.payload)).find(u=>u.email===email.toLowerCase()&&u.role==='admin'&&u.active);
 if(!user)throw Error('Administrador ativo não encontrado.');
 delete user.mfaSecret;delete user.mfaLastStep;
 await run('UPDATE users SET payload=? WHERE id=?',[JSON.stringify(user),user.id]);
 for(const row of await query('SELECT id,payload FROM sessions'))if(JSON.parse(row.payload).userId===user.id)await run('DELETE FROM sessions WHERE id=?',[row.id]);
 const id=crypto.randomUUID();await run('INSERT INTO audit(id,payload) VALUES(?,?)',[id,JSON.stringify({id,date:new Date().toISOString(),action:'mfa.operator_reset',status:200,userId:user.id,ip:'offline-operator'})]);
 if(sqlite)db.exec('COMMIT');else await db.commit();console.log('Sessões revogadas. Se o MFA estiver exigido, o administrador deve cadastrá-lo novamente ao entrar.');
}catch(error){try{if(sqlite)db.exec('ROLLBACK');else await db.rollback();}catch{}throw error;}finally{if(sqlite)db.close();else await db.end();}
