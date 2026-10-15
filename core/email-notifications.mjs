import nodemailer from 'nodemailer';
import {claimNotification,enqueueNotifications,notificationCurrent,validateNotificationConfig,notificationDefaults} from './notifications.mjs';
const emailValid=value=>typeof value==='string'&&value.length<=200&&/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value)&&!value.includes('..');
export function smtpOptions(env=process.env){
 const port=Number(env.SMTP_PORT||587),secure=env.SMTP_SECURE===undefined?port===465:env.SMTP_SECURE==='true';
 if(!env.SMTP_HOST||!/^[a-z\d.-]{1,253}$/i.test(env.SMTP_HOST)||!Number.isInteger(port)||port<1||port>65535||!env.SMTP_USER||!env.SMTP_PASSWORD||!emailValid(env.SMTP_FROM))throw Error('SMTP_CONFIG');
 if(env.SMTP_SECURE!==undefined&&!['true','false'].includes(env.SMTP_SECURE))throw Error('SMTP_CONFIG');
 return {host:env.SMTP_HOST,port,secure,requireTLS:!secure,auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},tls:{rejectUnauthorized:true},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false,pool:false};
}
export function emailStatus(env=process.env){let configured=true;try{smtpOptions(env);}catch{configured=false;}return {configured,enabled:env.EMAIL_NOTIFICATIONS_ENABLED==='true',ready:configured&&env.EMAIL_NOTIFICATIONS_ENABLED==='true',missing:['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].filter(key=>!env[key])};}
export async function verifySMTP(env=process.env){if(!emailStatus(env).configured)return {ok:false,errorCode:'smtp_config'};const transport=nodemailer.createTransport(smtpOptions(env));try{await transport.verify();return {ok:true};}catch(error){return {ok:false,errorCode:error.code==='EAUTH'?'smtp_auth':'smtp_connection'};}finally{transport.close();}}
export function emailMessage(job,user,env=process.env){
 if(!emailValid(user.email))throw Error('SMTP_RECIPIENT');let origin;try{origin=new URL(env.PUBLIC_ORIGIN);}catch{throw Error('SMTP_ORIGIN');}if(!['http:','https:'].includes(origin.protocol)||env.NODE_ENV==='production'&&origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.pathname!=='/')throw Error('SMTP_ORIGIN');
 if(!/^\/admin\/(pendencias|visitas|notificacoes)$/.test(job.href))throw Error('SMTP_LINK');
 return {from:env.SMTP_FROM,to:user.email,subject:'Confianza · '+job.title,text:job.body+'\n\nAcesse o painel: '+new URL(job.href,origin).href+'\n\nVocê recebe este aviso porque habilitou a preferência de e-mail na sua conta. Para desativar, abra Notificações no painel.',messageId:'<'+job.id+'@'+origin.hostname+'>',disableFileAccess:true,disableUrlAccess:true};
}
async function finish(store,job,state,errorCode,now){
 const old=await store.get('notification_jobs',job.id);if(!old||old.state!=='processing'||old.token!==job.token)return;
 const config=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults),guardId='notification-delivery-'+old.userId,guard=await store.get('settings',guardId),next={...old,state:state==='pending'&&old.attempts>=config.maxAttempts?'failed':state,token:null,errorCode,nextAt:new Date(now+Math.min(900000,60000*5**(old.attempts-1))).toISOString(),...(['smtp_accepted','failed','uncertain','cancelled'].includes(state)?{completedAt:new Date(now).toISOString()}: {})};
 const changes=[{table:'notification_jobs',id:old.id,old,next}];if(guard?.token===old.token)changes.unshift({table:'settings',id:guardId,old:guard,next:{...guard,pendingUntil:0,token:null}});await store.atomicCompareSet(changes);
}
export async function runEmailNotifications(store,{env=process.env,createTransport=nodemailer.createTransport,now=()=>Date.now()}={}){
 if(!emailStatus(env).ready)return {processed:0};const config=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults);if(!config.enabled||config.channel!=='email')return {processed:0};
 await enqueueNotifications(store,now());let processed=0;
 for(const user of await store.all('users')){if(processed>=5)break;const job=await claimNotification(store,user.id,now(),'email');if(!job)continue;
  let transport,timer;try{
   const source=await store.get('notification_jobs',job.id),freshConfig=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults),freshUser=await store.get('users',user.id);
   if(!freshConfig.enabled||freshConfig.channel!=='email'||freshConfig.testMode&&!freshConfig.testUserIds.includes(user.id)||!await notificationCurrent(store,source)){await finish(store,job,'cancelled',null,now());continue;}
   const message=emailMessage(job,freshUser,env);transport=createTransport(smtpOptions(env));
   const result=await Promise.race([transport.sendMail(message),new Promise((_,reject)=>{timer=setTimeout(()=>{const error=Error('SMTP_TIMEOUT');error.code='ETIMEDOUT';error.command='DATA';transport.close();reject(error);},35000);})]);
   if(result.accepted?.some(address=>String(address).toLowerCase()===freshUser.email.toLowerCase()))await finish(store,job,'smtp_accepted',null,now());
   else await finish(store,job,result.rejected?.length?'failed':'uncertain',result.rejected?.length?'smtp_rejected':'smtp_uncertain',now());processed++;
  }catch(error){const permanent=['EAUTH','EENVELOPE','SMTP_RECIPIENT','SMTP_ORIGIN','SMTP_LINK','ETLS'].includes(error.code||error.message),retry=error.command==='CONN'||error.command==='EHLO',state=permanent?'failed':retry?'pending':'uncertain',code=error.code==='EAUTH'?'smtp_auth':permanent?'smtp_rejected':retry?'smtp_connection':'smtp_uncertain';await finish(store,job,state,code,now());processed++;}
  finally{clearTimeout(timer);transport?.close();}
 }
 return {processed};
}
