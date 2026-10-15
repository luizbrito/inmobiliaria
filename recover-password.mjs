// Offline operator recovery. Stop the application and use its production database environment.
import {randomBytes, scrypt as scryptCallback, randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import {existsSync} from 'node:fs';
const email=process.argv[2]?.trim().toLowerCase();
if(!email)throw Error('Uso: node [--env-file=.env] recover-password.mjs email-do-admin');
const password=process.env.RECOVERY_PASSWORD;
delete process.env.RECOVERY_PASSWORD;
if(!password||password.length<12||password.length>200)throw Error('Defina RECOVERY_PASSWORD com 12 a 200 caracteres. Não passe a senha como argumento.');
const driver=process.env.DB_DRIVER||'mysql';
if(!['mysql','sqlite'].includes(driver))throw Error('DB_DRIVER deve ser mysql ou sqlite.');
let db;
if(driver==='sqlite'){
 const filename=process.env.DB_PATH||new URL('./data/confianza.sqlite',import.meta.url);
 if(!existsSync(filename))throw Error('Banco SQLite existente não encontrado. Confira DB_PATH.');
 const {DatabaseSync}=await import('node:sqlite');db=new DatabaseSync(filename);db.exec('PRAGMA busy_timeout=5000');
}else{
 for(const key of ['MYSQL_HOST','MYSQL_DATABASE','MYSQL_USER','MYSQL_PASSWORD'])if(!process.env[key])throw Error(`Variável ${key} ausente no SSH. Carregue as variáveis do banco da aplicação; não use .env.example.`);
 const mysql=(await import('mysql2/promise')).default;
 db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),database:process.env.MYSQL_DATABASE,user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,...(process.env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
}
const sqlite=driver==='sqlite';
const query=async(sql,args=[])=>sqlite?db.prepare(sql).all(...args):(await db.execute(sql,args))[0];
const run=async(sql,args=[])=>sqlite?db.prepare(sql).run(...args):db.execute(sql,args);
try{
 if(sqlite)db.exec('BEGIN IMMEDIATE');else await db.beginTransaction();
 const user=(await query('SELECT payload FROM users'+(sqlite?'':' FOR UPDATE'))).map(r=>JSON.parse(r.payload)).find(u=>u.email===email&&u.role==='admin'&&u.active);
 if(!user)throw Error('Administrador ativo não encontrado. Nenhuma conta foi criada ou alterada.');
 const salt=randomBytes(16).toString('hex');
 user.passwordHash=salt+':'+(await promisify(scryptCallback)(password,salt,64)).toString('hex');
 user.authVersion=(user.authVersion??0)+1;
 await run('UPDATE users SET payload=? WHERE id=?',[JSON.stringify(user),user.id]);
 for(const row of await query('SELECT id,payload FROM sessions'))if(JSON.parse(row.payload).userId===user.id)await run('DELETE FROM sessions WHERE id=?',[row.id]);
 const id=randomUUID();await run('INSERT INTO audit(id,payload) VALUES(?,?)',[id,JSON.stringify({id,date:new Date().toISOString(),action:'password.operator_reset',status:200,userId:user.id,ip:'offline-operator'})]);
 if(sqlite)db.exec('COMMIT');else await db.commit();
 console.log('Senha redefinida e sessões revogadas. MFA existente preservado. Reinicie a aplicação e entre com a nova senha.');
}catch(error){try{if(sqlite)db.exec('ROLLBACK');else await db.rollback();}catch{}throw error;}finally{if(sqlite)db.close();else await db.end();}
