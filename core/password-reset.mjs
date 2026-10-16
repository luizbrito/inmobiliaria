import {randomBytes,createHash} from 'node:crypto';
import nodemailer from 'nodemailer';
import {smtpOptions} from './email-notifications.mjs';
const digest=token=>createHash('sha256').update(token).digest('hex');
const messages={pt:['Redefinir senha','Use este link em até 15 minutos para redefinir sua senha. Se não pediu, ignore esta mensagem.'],es:['Restablecer contraseña','Use este enlace en 15 minutos para restablecer su contraseña. Si no lo solicitó, ignore este mensaje.'],en:['Reset password','Use this link within 15 minutes to reset your password. If you did not request it, ignore this message.'],it:['Reimposta password','Usa questo link entro 15 minuti per reimpostare la password. Se non lo hai richiesto, ignora il messaggio.'],de:['Passwort zurücksetzen','Verwenden Sie diesen Link innerhalb von 15 Minuten. Wenn Sie dies nicht angefordert haben, ignorieren Sie diese Nachricht.']};
export async function requestPasswordReset(store,email,{env=process.env,now=Date.now(),send,record=async()=>{}}={}){
 if(env.PASSWORD_RESET_ENABLED!=='true')return;
 const u=(await store.all('users')).find(u=>u.active&&u.email===String(email).trim().toLowerCase());if(!u)return;
 const testMode=env.PASSWORD_RESET_TEST_MODE!=='false',allowed=(env.PASSWORD_RESET_TEST_EMAILS||'').split(',').map(s=>s.trim().toLowerCase());if(testMode&&!allowed.includes(u.email))return;
 const base=new URL(env.PUBLIC_ORIGIN);if(base.username||base.password||base.search||base.hash||base.pathname!=='/'||env.NODE_ENV==='production'&&base.protocol!=='https:'||!['http:','https:'].includes(base.protocol))throw Error('RESET_ORIGIN');
 const token=randomBytes(32).toString('hex'),id='password-reset-'+u.id,old=await store.get('settings',id),entry={id,userId:u.id,tokenHash:digest(token),expires:now+900000,authVersion:u.authVersion||0,used:false};
 if(!await store.atomicCompareSet([{table:'settings',id,old,next:entry}]))return;
 const copy=messages[u.language]||messages.pt,message={from:env.SMTP_FROM,to:u.email,subject:'Confianza · '+copy[0],text:copy[1]+'\n\n'+new URL('/admin/recuperar',base).href+'#token='+token,disableFileAccess:true,disableUrlAccess:true};let transport;
 try{if(!send)transport=nodemailer.createTransport(smtpOptions(env));const result=await (send?send(message):transport.sendMail(message));if(!result.accepted?.some(x=>String(x).toLowerCase()===u.email))throw Error('RESET_SEND');await record('password.reset.smtp_accepted',u.id);}
 catch{await store.atomicCompareSet([{table:'settings',id,old:entry,next:{...entry,used:true}}]);await record('password.reset.send_failed',u.id);}
 finally{transport?.close();}
}
export async function confirmPasswordReset(store,input,{hashPassword,now=Date.now(),record=async()=>{}}={}){
 if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token)||typeof input.password!=='string'||input.password.length<12||input.password.length>200)throw Error('Link inválido ou senha fora do limite de 12 a 200 caracteres.');
 const tokenHash=digest(input.token),old=(await store.all('settings')).find(x=>x.id?.startsWith('password-reset-')&&x.tokenHash===tokenHash);
 const u=old&&await store.get('users',old.userId);if(!old||old.used||old.expires<=now||!u?.active||(u.authVersion||0)!==old.authVersion)throw Error('Link inválido ou expirado. Solicite outro link.');
 const next={...u,passwordHash:await hashPassword(input.password),authVersion:(u.authVersion||0)+1};
 if(!await store.atomicCompareSet([{table:'users',id:u.id,old:u,next},{table:'settings',id:old.id,old,next:{...old,used:true}}]))throw Error('Link inválido ou expirado. Solicite outro link.');
 for(const s of await store.all('sessions'))if(s.userId===u.id)await store.remove('sessions',s.id);await record('password.reset.completed',u.id);return {ok:true};
}
