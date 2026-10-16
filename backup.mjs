import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {secretBox} from './core/security.mjs';
const [action,file]=process.argv.slice(2),names=['properties','leads','settings','users','sessions','audit','property_internal','visits','notification_jobs'];
if(!['backup','restore'].includes(action)||!file)throw Error('Uso: node --env-file=.env backup.mjs backup|restore arquivo');
const box=secretBox(process.env.BACKUP_ENCRYPTION_KEY),sqlite=process.env.DB_DRIVER==='sqlite';
let db;
if(sqlite){const {DatabaseSync}=await import('node:sqlite');db=new DatabaseSync(process.env.DB_PATH||'./data/confianza.sqlite');}
else{const mysql=(await import('mysql2/promise')).default;db=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),database:process.env.MYSQL_DATABASE,user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,...(process.env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});}
const query=async(sql,args=[])=>sqlite?db.prepare(sql).all(...args):(await db.execute(sql,args))[0];
const run=async(sql,args=[])=>sqlite?db.prepare(sql).run(...args):db.execute(sql,args);
const uploads=process.env.UPLOAD_DIR||'./data/uploads';
const createdFiles=[];
try{
 if(action==='backup'){
  if(sqlite)db.exec('BEGIN IMMEDIATE');else{await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');}
  const data={version:1,date:new Date().toISOString(),tables:{},images:[]};
  for(const name of names){try{data.tables[name]=await query(`SELECT id,payload FROM ${name}`);}catch(error){if(name==='notification_jobs'&&(error.code==='ER_NO_SUCH_TABLE'||/no such table: notification_jobs/.test(error.message)))data.tables[name]=[];else throw error;}}
  // Sessions are deliberately not restored: every user signs in again after recovery.
  data.tables.sessions=[];data.tables.settings=data.tables.settings.filter(row=>!row.id.startsWith('password-reset-')&&!['whatsapp-qr-auth','whatsapp-qr-lease'].includes(row.id));
  if(sqlite){for(const key of await readdir(uploads)){if(/^[a-z\d-]+\.(jpg|png|webp)$/.test(key))data.images.push({id:key,bytes:(await readFile(path.join(uploads,key))).toString('base64'),content_type:key.endsWith('.jpg')?'image/jpeg':key.endsWith('.png')?'image/png':'image/webp'});}}
  else data.images=(await query('SELECT id,bytes,content_type FROM image_files')).map(x=>({...x,bytes:x.bytes.toString('base64')}));
  await writeFile(file,box.seal(JSON.stringify(data)),{flag:'wx',mode:0o600});
  if(sqlite)db.exec('COMMIT');else await db.commit();
  console.log('Backup criptografado concluído.');
 }else{
  const data=JSON.parse(box.open(await readFile(file,'utf8')));
  if(data.version!==1||!data.tables||!Array.isArray(data.images))throw Error('Backup inválido.');
  for(const name of ['property_internal','visits','notification_jobs'])data.tables[name]??=[];data.tables.settings=data.tables.settings.filter(row=>!row.id.startsWith('password-reset-')&&!['whatsapp-qr-auth','whatsapp-qr-lease'].includes(row.id));
  for(const name of names){if(!Array.isArray(data.tables[name]))throw Error('Tabela ausente.');for(const row of data.tables[name]){if(typeof row.id!=='string'||typeof row.payload!=='string')throw Error('Registro inválido.');JSON.parse(row.payload);}}
  for(const image of data.images)if(!/^[a-z\d-]+\.(jpg|png|webp)$/.test(image.id)||typeof image.bytes!=='string'||!['image/jpeg','image/png','image/webp'].includes(image.content_type))throw Error('Imagem inválida.');
  if(sqlite){await mkdir(uploads,{recursive:true});if((await readdir(uploads)).length)throw Error('Restaure em uma pasta de fotos vazia.');db.exec('BEGIN IMMEDIATE');}
  for(const name of names){await run(`CREATE TABLE IF NOT EXISTS ${name}(id ${sqlite?'TEXT':'VARCHAR(80)'} PRIMARY KEY,payload ${sqlite?'TEXT':'LONGTEXT'} NOT NULL)`);if((await query(`SELECT id FROM ${name} LIMIT 1`)).length)throw Error('Restaure em um banco vazio.');}
  if(!sqlite){await run('CREATE TABLE IF NOT EXISTS image_files(id VARCHAR(80) PRIMARY KEY,bytes MEDIUMBLOB NOT NULL,content_type VARCHAR(50) NOT NULL)');if((await query('SELECT id FROM image_files LIMIT 1')).length)throw Error('Banco de fotos deve estar vazio.');}
  if(!sqlite)await db.beginTransaction();
  for(const name of names)if(name!=='sessions')for(const row of data.tables[name])await run(`INSERT INTO ${name}(id,payload) VALUES(?,?)`,[row.id,row.payload]);
  for(const image of data.images){const bytes=Buffer.from(image.bytes,'base64');if(sqlite){const target=path.join(uploads,image.id);await writeFile(target,bytes,{flag:'wx'});createdFiles.push(target);}else await run('INSERT INTO image_files(id,bytes,content_type) VALUES(?,?,?)',[image.id,bytes,image.content_type]);}
  for(const name of names){const rows=await query(`SELECT id,payload FROM ${name}`),expected=name==='sessions'?[]:data.tables[name];if(rows.length!==expected.length||rows.some(r=>!expected.some(e=>e.id===r.id&&e.payload===r.payload)))throw Error('Verificação de restauração falhou.');}
  for(const image of data.images){const bytes=sqlite?await readFile(path.join(uploads,image.id)):(await query('SELECT bytes FROM image_files WHERE id=?',[image.id]))[0].bytes;if(!bytes.equals(Buffer.from(image.bytes,'base64')))throw Error('Verificação da foto restaurada falhou.');}
  if(sqlite)db.exec('COMMIT');else await db.commit();console.log('Restauração concluída e registros conferidos.');
 }
}catch(error){try{if(sqlite)db.exec('ROLLBACK');else await db.rollback();}catch{}for(const target of createdFiles)await unlink(target);throw error;}finally{if(sqlite)db.close();else await db.end();}
