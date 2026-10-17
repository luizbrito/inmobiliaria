import {createWhatsAppQR} from './core/whatsapp-qr.mjs';
import {runBackupVerification,backupStatus,enqueueBackupAlert} from './core/backup-verification.mjs';
import {runWhatsAppNotifications,validWhatsAppSignature,receiveWhatsAppWebhook,cleanWhatsAppEvents} from './core/whatsapp.mjs';
import {requestPasswordReset,confirmPasswordReset} from './core/password-reset.mjs';
import {recordPropertyView,cleanPerformanceViews} from './core/performance.mjs';
import express from 'express';
import {enqueueNotifications} from './core/notifications.mjs';
import {runEmailNotifications} from './core/email-notifications.mjs';
import {promisify} from 'node:util';
import {scrypt as scryptCallback,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {service,initialProperties,defaultSettings} from './core/service.mjs';
import {newSecret,secretBox,verifyTotp,requiresMFA} from './core/security.mjs';
import sharp from 'sharp';
import QRCode from 'qrcode';
import {bootstrapAdmin} from './core/bootstrap-admin.mjs';
import {normalizeListingFilters,filterListing,listingMetadata} from './public/portal/listing-seo.js';
const box=secretBox(process.env.MFA_ENCRYPTION_KEY);
const scrypt=promisify(scryptCallback),root=path.dirname(fileURLToPath(import.meta.url)),assetRoot=process.env.ASSET_ROOT||path.resolve(root,'public');
const port=Number(process.env.PORT||3000),origin=process.env.PUBLIC_ORIGIN||`http://localhost:${port}`;
if(process.env.NODE_ENV==='production'&&(!process.env.PUBLIC_ORIGIN||new URL(origin).protocol!=='https:'))throw Error('Produção exige PUBLIC_ORIGIN com HTTPS.');
const dbType=process.env.DB_DRIVER||'mysql',tables=new Set(['properties','leads','settings','users','sessions','audit','property_internal','visits','notification_jobs']);
let db;
if(dbType==='sqlite'){
 const {DatabaseSync}=await import('node:sqlite');const dbPath=process.env.DB_PATH||path.join(root,'data/confianza.sqlite');await mkdir(path.dirname(dbPath),{recursive:true});db=new DatabaseSync(dbPath);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');for(const t of tables)db.exec(`CREATE TABLE IF NOT EXISTS ${t}(id TEXT PRIMARY KEY,payload TEXT NOT NULL)`);
}else{
 const mysql=(await import('mysql2/promise')).default;
 if(!process.env.MYSQL_HOST||!process.env.MYSQL_DATABASE||!process.env.MYSQL_USER||!process.env.MYSQL_PASSWORD)throw Error('Configure MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER e MYSQL_PASSWORD.');
 db=mysql.createPool({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,connectionLimit:5,enableKeepAlive:true,charset:'utf8mb4',...(process.env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
 for(const t of tables)await db.execute(`CREATE TABLE IF NOT EXISTS ${t}(id VARCHAR(80) PRIMARY KEY,payload LONGTEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
 await db.execute('CREATE TABLE IF NOT EXISTS image_files(id VARCHAR(80) PRIMARY KEY,bytes MEDIUMBLOB NOT NULL,content_type VARCHAR(50) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4');
}
function table(t){if(!tables.has(t))throw Error('Tabela inválida');return t;}
async function query(sql,args=[]){if(dbType==='sqlite')return db.prepare(sql).all(...args);const [rows]=await db.execute(sql,args);return rows;}
async function run(sql,args=[]){if(dbType==='sqlite')return db.prepare(sql).run(...args);return db.execute(sql,args);}
const store={async all(t){return(await query(`SELECT payload FROM ${table(t)}`)).map(x=>JSON.parse(x.payload));},async get(t,id){const [r]=await query(`SELECT payload FROM ${table(t)} WHERE id=?`,[id]);return r?JSON.parse(r.payload):null;},async set(t,id,x){const suffix=dbType==='sqlite'?'ON CONFLICT(id) DO UPDATE SET payload=excluded.payload':'ON DUPLICATE KEY UPDATE payload=VALUES(payload)';await run(`INSERT INTO ${table(t)}(id,payload) VALUES(?,?) ${suffix}`,[id,JSON.stringify(x)]);},async remove(t,id){await run(`DELETE FROM ${table(t)} WHERE id=?`,[id]);},async seed(items){for(const x of items)await run(`${dbType==='sqlite'?'INSERT OR IGNORE':'INSERT IGNORE'} INTO properties(id,payload) VALUES(?,?)`,[x.id,JSON.stringify(x)]);}};
store.atomicCompareSet=async changes=>{
 const applySqlite=()=>{db.exec('BEGIN IMMEDIATE');try{for(const c of changes){const row=db.prepare('SELECT payload FROM '+table(c.table)+' WHERE id=?').get(c.id);if((row?.payload??null)!==(c.old?JSON.stringify(c.old):null)){db.exec('ROLLBACK');return false;}}
 for(const c of changes){if(c.next===null)db.prepare('DELETE FROM '+table(c.table)+' WHERE id=?').run(c.id);else db.prepare('INSERT INTO '+table(c.table)+'(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(c.id,JSON.stringify(c.next));}db.exec('COMMIT');return true;}catch(e){db.exec('ROLLBACK');throw e;}};
 if(dbType==='sqlite')return applySqlite();const connection=await db.getConnection();try{await connection.beginTransaction();for(const c of changes){const [rows]=await connection.execute('SELECT payload FROM '+table(c.table)+' WHERE id=? FOR UPDATE',[c.id]);if((rows[0]?.payload??null)!==(c.old?JSON.stringify(c.old):null)){await connection.rollback();return false;}}
 for(const c of changes){if(c.next===null)await connection.execute('DELETE FROM '+table(c.table)+' WHERE id=?',[c.id]);else await connection.execute('INSERT INTO '+table(c.table)+'(id,payload) VALUES(?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)',[c.id,JSON.stringify(c.next)]);}await connection.commit();return true;
 }catch(e){await connection.rollback();if(['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT','ER_DUP_ENTRY'].includes(e.code))return false;throw e;}finally{connection.release();}
};
async function hashPassword(password){const salt=randomBytes(16).toString('hex'),derived=await scrypt(password,salt,64);return salt+':'+derived.toString('hex');}
async function verifyPassword(password,hash){try{const [salt,wanted]=hash.split(':'),actual=await scrypt(password,salt,64),buf=Buffer.from(wanted,'hex');return actual.length===buf.length&&timingSafeEqual(actual,buf);}catch{return false;}}
await bootstrapAdmin(store);
delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
const allUsers=await store.all('users');
if(!allUsers.length){const email=process.env.ADMIN_EMAIL,password=process.env.ADMIN_PASSWORD;if(!email||!/^\S+@\S+\.\S+$/.test(email)||!password||password.length<12)throw Error('Primeiro início: configure ADMIN_EMAIL e ADMIN_PASSWORD com no mínimo 12 caracteres.');const id=crypto.randomUUID();await store.set('users',id,{id,name:process.env.ADMIN_NAME||'Administrador',email:email.toLowerCase(),role:'admin',active:true,passwordHash:await hashPassword(password),createdAt:new Date().toISOString()});}
if(!await store.get('settings','initialized')){if(process.env.SEED_DEMO!=='false')await store.seed(initialProperties);await store.set('settings','initialized',{done:true});}
// Apply the requested initial number once, including existing installations with an empty field.
// Subsequent edits (including clearing the number to hide WhatsApp) remain authoritative.
if(!await store.get('settings','whatsapp-default-v1')){
 const settings=await store.get('settings','public');
 if(settings&&!settings.whatsapp)await store.set('settings','public',{...settings,whatsapp:defaultSettings.whatsapp});
 await store.set('settings','whatsapp-default-v1',{done:true});
}
const whatsappQR=createWhatsAppQR(store);await whatsappQR.resume();
const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
const sessionsCookie='confianza_session',secure=origin.startsWith('https://'),cookieOptions={httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:8*60*60*1000};
const tokenHash=t=>createHash('sha256').update(t).digest('hex');
function cookieToken(req){return(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(sessionsCookie+'='))?.slice(sessionsCookie.length+1);}
async function getUser(req){const token=cookieToken(req);if(!token||! /^[a-f0-9]{64}$/.test(token))return null;const s=await store.get('sessions',tokenHash(token));if(!s||s.expires<Date.now()||s.pending)return null;const u=await store.get('users',s.userId);return u?.active&&(s.version??0)===(u.authVersion??0)&&(!requiresMFA(u)||s.mfa&&u.mfaSecret)?{id:u.id,name:u.name,email:u.email,role:u.role,commissionView:u.commissionView===true,commissionEdit:u.commissionEdit===true,language:u.language||'pt',accessibility:u.accessibility||{scale:1,simplified:false}}:null;}
async function audit(req,action,status,userId=null){const id=crypto.randomUUID();await store.set('audit',id,{id,date:new Date().toISOString(),action,status,userId,ip:req.ip});}
let mfaQueue=Promise.resolve();
async function serialMfa(fn){const prior=mfaQueue;let release;mfaQueue=new Promise(r=>release=r);await prior;try{return await fn();}finally{release();}}
const bucket=process.env.UPLOAD_DIR||path.join(root,'data/uploads');await mkdir(bucket,{recursive:true});
const media={mode:'node',async put(key,bytes){if(dbType==='mysql')await db.execute('INSERT INTO image_files(id,bytes,content_type) VALUES(?,?,?)',[key,Buffer.from(bytes),key.endsWith('.jpg')?'image/jpeg':key.endsWith('.png')?'image/png':'image/webp']);else await writeFile(path.join(bucket,key),bytes,{flag:'wx'});},async get(key){if(!/^[a-z\d-]+\.(jpg|png|webp)$/.test(key))return new Response('Not found',{status:404});try{let buf;if(dbType==='mysql'){const [rows]=await db.execute('SELECT bytes FROM image_files WHERE id=?',[key]);if(!rows.length)return new Response('Not found',{status:404});buf=rows[0].bytes;}else buf=await readFile(path.join(bucket,key));return new Response(buf,{headers:{'Content-Type':key.endsWith('.jpg')?'image/jpeg':key.endsWith('.png')?'image/png':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}catch{return new Response('Not found',{status:404});}}};
const limits=new Map();function rate(key,max,ms){const now=Date.now();let x=limits.get(key);if(!x||now>x.expires){x={count:0,expires:now+ms};limits.set(key,x);}return ++x.count<=max;}
setInterval(()=>{const now=Date.now();for(const [k,v] of limits)if(v.expires<now)limits.delete(k);},60000).unref();
setInterval(async()=>{try{for(const s of await store.all('sessions'))if(s.expires<Date.now())await store.remove('sessions',s.id);}catch{}},3600000).unref();
let notificationTickRunning=false;
setInterval(async()=>{if(notificationTickRunning)return;notificationTickRunning=true;try{await enqueueNotifications(store);await runEmailNotifications(store);await runWhatsAppNotifications(store);}catch{console.error('Falha ao preparar fila de notificações.');}finally{notificationTickRunning=false;}},60000).unref();
setInterval(async()=>{try{await cleanPerformanceViews(store);await cleanWhatsAppEvents(store);}catch{console.error('Falha na retenção de dados operacionais.');}},86400000).unref();
let backupTickRunning=false;setInterval(async()=>{if(backupTickRunning||process.env.BACKUP_AUTOMATION_ENABLED!=='true')return;backupTickRunning=true;try{await runBackupVerification();await enqueueBackupAlert(store,await backupStatus());}catch{console.error('Falha na verificação automática de backups.');}finally{backupTickRunning=false;}},60000).unref();
app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'"});if(secure)res.set('Strict-Transport-Security','max-age=31536000');next();});
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');next();},express.raw({type:()=>true,limit:'4mb'}),async(req,res)=>{try{
 const method=req.method,pathname='/api'+req.url.split('?')[0];
 if(pathname==='/api/whatsapp/webhook'){
  if(method==='GET'){if(process.env.WHATSAPP_VERIFY_TOKEN&&req.query['hub.mode']==='subscribe'&&typeof req.query['hub.verify_token']==='string'&&tokenHash(req.query['hub.verify_token'])===tokenHash(process.env.WHATSAPP_VERIFY_TOKEN)&&typeof req.query['hub.challenge']==='string'&&req.query['hub.challenge'].length<200)return res.type('text/plain').send(req.query['hub.challenge']);return res.sendStatus(403);}
  if(method==='POST'){if(!validWhatsAppSignature(req.body,req.headers['x-hub-signature-256'],process.env.WHATSAPP_APP_SECRET))return res.sendStatus(403);try{await receiveWhatsAppWebhook(store,JSON.parse(req.body.toString('utf8')));return res.json({ok:true});}catch{return res.sendStatus(503);}}
  return res.sendStatus(405);
 }
 if(!['GET','HEAD'].includes(method)&&req.headers.origin!==origin){await audit(req,'origin.denied',403);return res.status(403).json({error:'Origem inválida.'});}
 const url=new URL('/api'+req.url,origin);const request=new Request(url,{method,headers:req.headers,...(!['GET','HEAD'].includes(method)?{body:req.body?.length?req.body:undefined}: {})});
 const user=await getUser(request);
 if(pathname.startsWith('/api/whatsapp-qr/')){const response=await whatsappQR.api(request,user,pathname.split('/').filter(Boolean));if(method!=='GET'&&pathname.split('/')[3]!=='read')await audit(req,'whatsapp-qr.'+pathname.split('/')[3],response.status,user?.id);return res.status(response.status).json(await response.json());}
 if(pathname==='/api/team/backups'&&method==='GET'){if(!user)return res.status(401).json({error:'Acesso restrito.'});if(user.role!=='admin')return res.status(403).json({error:'Acesso restrito.'});return res.json(await backupStatus());}
 if(pathname==='/api/password-reset/request'&&method==='POST'){
  const x=await request.json(),email=String(x.email||'').trim().toLowerCase();
  if(!rate('reset-ip:'+req.ip,10,3600000)||!rate('reset-email:'+tokenHash(email),3,3600000))return res.status(429).json({error:'Muitas tentativas. Tente novamente mais tarde.'});
  setImmediate(()=>requestPasswordReset(store,email,{record:(action,id)=>audit(req,action,200,id)}).catch(()=>audit(req,'password.reset.unavailable',503).catch(()=>{})));
  return res.status(202).json({ok:true});
 }
 if(pathname==='/api/password-reset/confirm'&&method==='POST'){
  if(!rate('reset-confirm:'+req.ip,10,900000))return res.status(429).json({error:'Muitas tentativas. Tente novamente mais tarde.'});
  try{return res.json(await confirmPasswordReset(store,await request.json(),{hashPassword,record:(action,id)=>audit(req,action,200,id)}));}catch(error){return res.status(400).json({error:error.message});}
 }
 if(pathname==='/api/login'&&method==='POST'){
  if(!rate('login:'+req.ip,10,15*60*1000)){await audit(req,'login.throttled',429);return res.status(429).json({error:'Muitas tentativas. Tente novamente mais tarde.'});}
  const x=await request.json();const u=(await store.all('users')).find(u=>u.email===String(x.email).toLowerCase());
  const valid=await verifyPassword(String(x.password),u?.passwordHash||'00000000000000000000000000000000:'+Buffer.alloc(64).toString('hex'));
  if(!u||!u.active||!valid){await audit(req,'login.denied',401);return res.status(401).json({error:'Credenciais inválidas.'});}
  const token=randomBytes(32).toString('hex'),id=tokenHash(token),pending=requiresMFA(u),secret=pending&&!u.mfaSecret?newSecret():null;
  const setupUri=secret?`otpauth://totp/Confianza:${encodeURIComponent(u.email)}?secret=${secret}&issuer=Confianza&algorithm=SHA1&digits=6&period=30`:null;
  const setupQr=setupUri?await QRCode.toDataURL(setupUri,{errorCorrectionLevel:'M',margin:4,width:320,color:{dark:'#000000',light:'#ffffff'}}):null;
  await store.set('sessions',id,{id,userId:u.id,version:u.authVersion??0,pending,setupSecret:secret?box.seal(secret):null,expires:Date.now()+(pending?5*60*1000:cookieOptions.maxAge)});await audit(req,pending?'login.mfa_required':'login.success',200,u.id);res.cookie(sessionsCookie,token,{...cookieOptions,maxAge:pending?5*60*1000:cookieOptions.maxAge});return res.json({ok:true,mfaRequired:pending,...(secret?{setupSecret:secret,setupUri,setupQr}:{})});
 }
 if(pathname==='/api/mfa/verify'&&method==='POST')return await serialMfa(async()=>{
  if(!rate('mfa:'+req.ip,10,15*60*1000)){await audit(req,'mfa.throttled',429);return res.status(429).json({error:'Muitas tentativas. Tente novamente mais tarde.'});}
  const token=cookieToken(request),id=token&&tokenHash(token),s=id&&await store.get('sessions',id),u=s&&await store.get('users',s.userId);
  if(!s?.pending||s.expires<Date.now()||!u?.active||(s.version??0)!==(u.authVersion??0)||!requiresMFA(u))return res.status(401).json({error:'Entre novamente para verificar o código.'});
  const x=await request.json(),step=verifyTotp(box.open(u.mfaSecret||s.setupSecret),x.code,u.mfaLastStep??-1);
  if(step===null){await audit(req,'mfa.denied',401,u.id);return res.status(401).json({error:'Código inválido ou já utilizado.'});}
  const previous=JSON.stringify(u);u.mfaSecret=u.mfaSecret||s.setupSecret;u.mfaLastStep=step;
  const claimed=await run(`UPDATE users SET payload=? WHERE id=? AND ${dbType==='mysql'?'BINARY payload=BINARY ?':'payload=?'}`,[JSON.stringify(u),u.id,previous]);
  if((dbType==='sqlite'?claimed.changes:claimed[0].affectedRows)!==1)return res.status(401).json({error:'Código já utilizado. Entre novamente.'});
  await store.remove('sessions',id);
  const next=randomBytes(32).toString('hex'),sid=tokenHash(next);await store.set('sessions',sid,{id:sid,userId:u.id,version:u.authVersion??0,mfa:true,expires:Date.now()+cookieOptions.maxAge});await audit(req,'mfa.success',200,u.id);res.cookie(sessionsCookie,next,cookieOptions);return res.json({ok:true});
 });
 if(pathname==='/api/audit'&&method==='GET'){if(!user)return res.status(401).json({error:'Acesso restrito.'});if(user.role!=='admin')return res.status(403).json({error:'Acesso restrito.'});return res.json((await store.all('audit')).sort((a,b)=>b.date.localeCompare(a.date)));}
 if(pathname==='/api/logout'&&method==='POST'){
  await audit(req,'logout',200,user?.id);
  const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(sessionsCookie+'='))?.slice(sessionsCookie.length+1);if(token)await store.remove('sessions',tokenHash(token));res.clearCookie(sessionsCookie,{...cookieOptions,maxAge:undefined});return res.json({ok:true});
 }
 if(pathname==='/api/staff'&&method==='GET'){if(!user)return res.status(401).json({error:'Acesso restrito.'});if(!['admin','editor','agent'].includes(user.role))return res.status(403).json({error:'Acesso restrito.'});return res.json((await store.all('users')).filter(u=>u.active).map(u=>({id:u.id,name:u.name,role:u.role})));}
 if(pathname==='/api/preferences'&&method==='PUT'){
  if(!user)return res.status(401).json({error:'Acesso restrito.'});const x=await request.json();if(x.language!==undefined&&!['pt','es','en','it','de'].includes(x.language))return res.status(400).json({error:'Idioma inválido.'});
  if(x.accessibility&&(typeof x.accessibility.simplified!=='boolean'||![1,1.2,1.4].includes(x.accessibility.scale)))return res.status(400).json({error:'Preferência inválida.'});const old=await store.get('users',user.id),next={...old,...(x.language?{language:x.language}:{}),...(x.accessibility?{accessibility:x.accessibility}:{})};if(!await store.atomicCompareSet([{table:'users',id:user.id,old,next}]))return res.status(409).json({error:'Atualize e tente novamente.'});return res.json({language:next.language||'pt',accessibility:next.accessibility||{scale:1,simplified:false}});
 }
 if(pathname.startsWith('/api/users')){
  if(!user)return res.status(401).json({error:'Acesso restrito.'});
  if(user.role!=='admin')return res.status(403).json({error:'Acesso restrito.'});
  if(method==='GET')return res.json({supported:true,users:(await store.all('users')).map(({passwordHash,mfaSecret,mfaLastStep,...u})=>({...u,mfaRequired:requiresMFA(u),mfaEnabled:!!mfaSecret}))});
  if(method==='POST'||method==='PUT'){
   const x=await request.json(),id=method==='PUT'?pathname.split('/')[3]:crypto.randomUUID();
   const old=method==='PUT'?await store.get('users',id):null;if(method==='PUT'&&!old)return res.status(404).json({error:'Usuário não encontrado.'});
   if(typeof x.name!=='string'||x.name.length<2||x.name.length>100||typeof x.email!=='string'||!/^\S+@\S+\.\S+$/.test(x.email)||x.email.length>200||!['admin','editor','agent'].includes(x.role))return res.status(400).json({error:'Dados do usuário inválidos.'});
   if(x.language!==undefined&&!['pt','es','en','it','de'].includes(x.language))return res.status(400).json({error:'Idioma inválido.'});
   if(x.password&&(typeof x.password!=='string'||x.password.length<12||x.password.length>200)||!old&&!x.password)return res.status(400).json({error:'A senha deve ter entre 12 e 200 caracteres.'});
   if((await store.all('users')).some(u=>u.email===x.email.toLowerCase()&&u.id!==id))return res.status(400).json({error:'E-mail já cadastrado.'});
   if(id===user.id&&(!x.active||x.role!=='admin'))return res.status(400).json({error:'Você não pode desativar ou rebaixar seu próprio acesso.'});
   if(x.mfaRequired!==undefined&&typeof x.mfaRequired!=='boolean')return res.status(400).json({error:'mfaRequired deve ser booleano.'});
   const mfaRequired=x.mfaRequired??(typeof old?.mfaRequired==='boolean'?old.mfaRequired:x.role==='admin'),mfaChanged=!!old&&mfaRequired!==requiresMFA(old);
   const u={id,name:x.name,email:x.email.toLowerCase(),role:x.role,mfaRequired,accessibility:old?.accessibility,publicProfile:old?.publicProfile,commissionView:!!x.commissionView||!!x.commissionEdit,commissionEdit:!!x.commissionEdit,language:x.language||old?.language||'pt',active:!!x.active,passwordHash:x.password?await hashPassword(x.password):old.passwordHash,mfaSecret:old?.mfaSecret,mfaLastStep:old?.mfaLastStep,authVersion:(old?.authVersion??0)+(x.password||old?.role!==x.role||!x.active||mfaChanged?1:0),createdAt:old?.createdAt||new Date().toISOString()};await audit(req,'users.'+method.toLowerCase()+':'+id,200,user.id);if(old){const updated=await run(`UPDATE users SET payload=? WHERE id=? AND ${dbType==='mysql'?'BINARY payload=BINARY ?':'payload=?'}`,[JSON.stringify(u),id,JSON.stringify(old)]);if((dbType==='sqlite'?updated.changes:updated[0].affectedRows)!==1)return res.status(409).json({error:'Usuário alterado por outra operação. Atualize e tente novamente.'});}else await store.set('users',id,u);if(mfaChanged)await audit(req,'users.mfa.'+(mfaRequired?'enabled:':'disabled:')+id,200,user.id);if(x.password||old?.role!==u.role||!u.active||mfaChanged)for(const s of await store.all('sessions'))if(s.userId===id)await store.remove('sessions',s.id);return res.json({ok:true,id,reauthenticate:id===user.id&&(!!x.password||mfaChanged)});
  }
 }
 if(pathname==='/api/leads'&&method==='POST'&&!rate('lead:'+req.ip,20,60*60*1000))return res.status(429).json({error:'Muitas solicitações. Tente novamente mais tarde.'});
 const validatedMedia={...media,async validate(bytes){const image=sharp(Buffer.from(bytes),{failOn:'warning',limitInputPixels:24000000,animated:true}),meta=await image.metadata();if(!['jpeg','png','webp'].includes(meta.format)||(meta.pages||1)>1)throw Error('Use uma foto JPG, PNG ou WebP sem animação.');const output=await image.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();if(output.length>3*1024*1024)throw Error('A imagem processada excede 3 MB.');return {bytes:output,ext:'webp'};}};
 const result=await service(request,store,async()=>user,validatedMedia);if(!['GET','HEAD'].includes(method)&&!(pathname==='/api/leads'&&result.status<400))await audit(req,method+' '+pathname.slice(0,180),result.status,user?.id);res.status(result.status);result.headers.forEach((v,k)=>res.set(k,v));res.send(Buffer.from(await result.arrayBuffer()));
 }catch(e){console.error('Falha no pedido:',e.name);res.status(400).json({error:'Não foi possível concluir a solicitação.'});}});
app.use('/portal',express.static(path.join(assetRoot,'portal'),{maxAge:'1h',etag:true}));
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const propertyImage=property=>new URL(property.image?.startsWith('https://')||property.image?.startsWith('/api/media/')?property.image:'/portal/assets/'+(property.image||'house.jpg'),origin).href;
const propertyAlt=property=>[property.title,property.location].filter(Boolean).join(' — ');
app.get('/buscar',async(req,res,next)=>{try{
 const search=new URL(req.originalUrl,origin).searchParams,filters=normalizeListingFilters(search),rows=filterListing(await store.all('properties'),filters),settings=await store.get('settings','public')||defaultSettings;
 const metadata=listingMetadata(filters,'pt',settings.name||'Confianza'),canonical=new URL('/buscar',origin);
 for(const [key,value] of Object.entries(filters))if(value!=='')canonical.searchParams.set(key,String(value));
 // Search combinations remain useful to visitors without becoming thousands of local landing pages.
 const robots=search.size?'noindex,follow':'index,follow';
 let html=await readFile(path.join(assetRoot,'portal/index.html'),'utf8');
 html=html.replace(/<title>.*?<\/title>/,()=>`<title>${escapeHtml(metadata.title)}</title>`).replace(/<meta name="description"[^>]*>/,()=>`<meta name="description" content="${escapeHtml(metadata.description)}">`);
 html=html.replace('</head>',()=>`<link rel="canonical" href="${escapeHtml(canonical.href)}"><meta name="robots" content="${robots}"><meta property="og:type" content="website"><meta property="og:url" content="${escapeHtml(canonical.href)}"><meta property="og:title" content="${escapeHtml(metadata.title)}"><meta property="og:description" content="${escapeHtml(metadata.description)}"></head>`);
 const content=`<main class="container page-space"><nav aria-label="Navegação"><a href="/">Início</a></nav><h1>${escapeHtml(metadata.heading)}</h1>${settings.demo?'<p class="note">Catálogo demonstrativo. Imóveis, fotos e valores ilustrativos; não representam ofertas reais.</p>':''}<section aria-labelledby="listing-results"><h2 id="listing-results">Imóveis encontrados</h2><p>${rows.length} ${rows.length===1?'imóvel encontrado':'imóveis encontrados'}</p><div class="grid">${rows.map(property=>`<article class="card"><a href="/imovel/${encodeURIComponent(property.id)}"><img src="${escapeHtml(propertyImage(property))}" alt="${escapeHtml(propertyAlt(property))}" loading="lazy" width="600" height="440"><h3>${escapeHtml(property.title)}</h3></a><p>${escapeHtml(property.location)}</p><p>${escapeHtml(property.type)} · ${escapeHtml(property.purpose)}</p><p>${property.priceOnRequest?'Preço sob consulta':escapeHtml(new Intl.NumberFormat('pt-BR',{style:'currency',currency:property.currency||'BRL',maximumFractionDigits:0}).format(property.price))}</p><a href="/imovel/${encodeURIComponent(property.id)}">Ver imóvel e agendar visita</a></article>`).join('')||'<p>Nenhum imóvel encontrado. Tente ajustar os filtros.</p>'}</div></section><a href="/buscar">Ver todos os imóveis</a></main>`;
 html=html.replace('<!-- APP_CONTENT -->',()=>content);
 res.set({'Cache-Control':'no-cache','X-Robots-Tag':robots}).type('html').send(html);
 }catch(error){next(error);}});
app.get('/imovel/:id',async(req,res,next)=>{try{
 const property=await store.get('properties',req.params.id);
 if(!property||property.status!=='Publicado')return res.status(404).type('html').send('<!doctype html><html lang="pt-BR"><title>Imóvel não encontrado</title><h1>Imóvel não encontrado</h1><a href="/">Ver catálogo</a></html>');
 await recordPropertyView(store,property.id,{user:await getUser(new Request(origin+req.originalUrl,{headers:req.headers})),userAgent:req.headers['user-agent']||'',ip:req.ip,key:process.env.ANALYTICS_HASH_KEY||''});
 const canonical=origin+'/imovel/'+encodeURIComponent(property.id),title=property.title+' | Confianza',description=String(property.description||property.location||'').slice(0,300),image=propertyImage(property);
 let html=await readFile(path.join(assetRoot,'portal/index.html'),'utf8');
 html=html.replace(/<title>.*?<\/title>/,()=>`<title>${escapeHtml(title)}</title>`).replace(/<meta name="description"[^>]*>/,()=>`<meta name="description" content="${escapeHtml(description)}">`);
 html=html.replace('</head>',()=>`<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="website"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:card" content="summary_large_image"></head>`);
 html=html.replace('<!-- APP_CONTENT -->',()=>`<main><h1>${escapeHtml(property.title)}</h1><p>${escapeHtml(property.location)}</p><img src="${escapeHtml(image)}" alt="${escapeHtml(propertyAlt(property))}" width="1200" height="800"><p>${escapeHtml(description)}</p><p>${property.priceOnRequest?'Preço sob consulta':escapeHtml(new Intl.NumberFormat('pt-BR',{style:'currency',currency:property.currency}).format(property.price))}</p><a href="/">Ver catálogo</a></main>`);
 res.set('Cache-Control','no-cache').type('html').send(html);
 }catch(error){next(error);}});
app.get('/sitemap.xml',async(req,res,next)=>{try{const properties=(await store.all('properties')).filter(x=>x.status==='Publicado');res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(origin+'/')}</loc></url>${properties.map(p=>`<url><loc>${escapeHtml(origin+'/imovel/'+encodeURIComponent(p.id))}</loc></url>`).join('')}</urlset>`);}catch(error){next(error);}});
app.get('/robots.txt',(req,res)=>res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`));
app.get(['/', '/favoritos','/comparar','/sobre','/privacidade','/admin','/admin/:section','/admin/recuperar','/admin/imoveis/novo','/admin/imoveis/:id/editar'],(req,res)=>{if(req.path.startsWith('/admin'))res.set({'Cache-Control':'no-store','X-Robots-Tag':'noindex'});res.sendFile(path.join(assetRoot,'portal/index.html'));});
app.use((err,req,res,next)=>res.status(err.status||500).json({error:err.type==='entity.too.large'?'Arquivo muito grande.':'Falha ao processar o pedido.'}));
app.listen(port,process.env.LISTEN_HOST||'0.0.0.0',()=>console.log(`Confianza pronta na porta ${port}; banco ${dbType}.`));
