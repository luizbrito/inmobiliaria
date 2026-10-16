import {notificationCopy} from './notification-copy.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {activeVisit} from './enhancements.mjs';
import {dateKey} from './commercial.mjs';
export const notificationDefaults={channel:'email',enabled:false,testMode:true,testUserIds:[],timeZone:'America/Sao_Paulo',startHour:'08:00',endHour:'20:00',visitLeadMinutes:60,maxPerDay:20,maxAttempts:3};
export function validateNotificationConfig(input){
 const c={...notificationDefaults,...input};if(input&&Object.keys(input).length&&!('channel' in input))c.channel='browser';
 if(!['email','browser','whatsapp'].includes(c.channel))throw Error('Escolha e-mail, navegador ou WhatsApp.');
 if(typeof c.enabled!=='boolean'||typeof c.testMode!=='boolean'||!Array.isArray(c.testUserIds)||c.testUserIds.length>100||c.testUserIds.some(id=>typeof id!=='string'||id.length>80))throw Error('Configuração de notificações inválida.');
 dateKey(Date.now(),c.timeZone);
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.startHour)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.endHour)||c.startHour>=c.endHour)throw Error('Informe um intervalo diário válido para notificações.');
 for(const [key,min,max] of [['visitLeadMinutes',5,1440],['maxPerDay',1,100],['maxAttempts',1,5]])if(!Number.isInteger(c[key])||c[key]<min||c[key]>max)throw Error('Limites de notificação inválidos.');
 return Object.fromEntries(Object.keys(notificationDefaults).map(key=>[key,c[key]]));
}
const preferenceKey=id=>'notification-user-'+id;
export async function optedIn(store,userId,channel='browser'){const u=await store.get('users',userId);return u?.active&&['admin','editor','agent'].includes(u.role)&&(await store.get('settings',preferenceKey(userId)))?.[channel]===true;}
export async function notificationCurrent(store,job){
 if(!await optedIn(store,job.userId,job.channel||'browser'))return false;
 if(job.kind==='test')return true;if(job.kind==='backup')return (await store.get('users',job.userId))?.role==='admin'&&(await (await import('./backup-verification.mjs')).backupStatus()).alert;
 if(job.kind==='followup'){const l=await store.get('leads',job.entityId);return !!(l&&!l.mergedInto&&l.status!=='Concluído'&&l.responsible?.id===job.userId&&l.followUpAt===job.sourceAt);}
 const ledger=await store.get('visits',job.propertyId),v=ledger?.events?.find(v=>v.id===job.entityId);return !!(v&&activeVisit(v)&&v.responsible?.id===job.userId&&v.startAt===job.sourceAt);
}
export async function enqueueNotifications(store,now=Date.now()){
 const config=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults);if(!config.enabled)return;
 const [users,leads,ledgers]=await Promise.all(['users','leads','visits'].map(t=>store.all(t)));
 const targets=new Set();for(const u of users)if((!config.testMode||config.testUserIds.includes(u.id))&&await optedIn(store,u.id,config.channel))targets.add(u.id);
 const sources=leads.filter(l=>!l.mergedInto&&l.status!=='Concluído'&&l.followUpAt).map(l=>({kind:'followup',entityId:l.id,userId:l.responsible?.id,sourceAt:l.followUpAt,dueAt:l.followUpAt,href:'/admin/pendencias'})).concat(ledgers.flatMap(l=>(l.events||[]).filter(activeVisit).map(v=>({kind:'visit',entityId:v.id,propertyId:v.propertyId,userId:v.responsible?.id,sourceAt:v.startAt,dueAt:new Date(Date.parse(v.startAt)-config.visitLeadMinutes*60000).toISOString(),href:'/admin/visitas'}))));
 for(const source of sources){const due=Date.parse(source.dueAt);if(!targets.has(source.userId)||!Number.isFinite(due)||due<now-86400000||due>now+7*86400000)continue;
  const identity=[source.kind,source.entityId,source.userId,source.sourceAt];if(config.channel!=='browser')identity.push(config.channel);const id=createHash('sha256').update(JSON.stringify(identity)).digest('hex');if(await store.get('notification_jobs',id))continue;
  const job={...source,id,channel:config.channel,state:'pending',attempts:0,createdAt:new Date(now).toISOString(),nextAt:source.dueAt,expiresAt:new Date((source.kind==='visit'?Date.parse(source.sourceAt):due+86400000)).toISOString()};await store.atomicCompareSet([{table:'notification_jobs',id,old:null,next:job}]);
 }
 for(const old of await store.all('notification_jobs')){if(!['pending','processing'].includes(old.state))continue;let next=null;
  if((old.channel||'browser')!==config.channel||Date.parse(old.expiresAt)<=now||!await notificationCurrent(store,old))next={...old,state:'cancelled',completedAt:new Date(now).toISOString(),token:null};
  else if(old.state==='processing'&&Date.parse(old.lockUntil)<=now)next={...old,state:['email','whatsapp'].includes(old.channel)?'uncertain':old.attempts>=config.maxAttempts?'failed':'pending',token:null,nextAt:new Date(now+60000).toISOString(),errorCode:'ack_timeout'};
  if(next)await store.atomicCompareSet([{table:'notification_jobs',id:old.id,old,next}]);
 }
}
export async function claimNotification(store,userId,now=Date.now(),channel='browser'){
 const config=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults);
 if(!config.enabled||config.channel!==channel||config.testMode&&!config.testUserIds.includes(userId)||!await optedIn(store,userId,channel))return null;
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:config.timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);if(time<config.startHour||time>=config.endHour)return null;
 const jobs=await store.all('notification_jobs'),today=dateKey(now,config.timeZone),guardId='notification-delivery-'+userId,guard=await store.get('settings',guardId);
 if(guard?.pendingUntil>now||guard?.day===today&&guard.count>=config.maxPerDay)return null;
 if(jobs.filter(j=>j.userId===userId&&j.lastAttemptAt&&dateKey(j.lastAttemptAt,config.timeZone)===today&&['processing','processed','smtp_accepted','whatsapp_accepted','simulated','sent','delivered','read','uncertain'].includes(j.state)).length>=config.maxPerDay)return null;
 if(jobs.some(j=>j.userId===userId&&j.state==='processing'&&Date.parse(j.lockUntil)>now))return null;
 for(const old of jobs.filter(j=>j.userId===userId&&(j.channel||'browser')===channel&&j.state==='pending'&&Date.parse(j.nextAt)<=now&&Date.parse(j.expiresAt)>now).sort((a,b)=>a.nextAt.localeCompare(b.nextAt))){if(!await notificationCurrent(store,old))continue;
  const next={...old,state:'processing',attempts:old.attempts+1,token:randomUUID(),lastAttemptAt:new Date(now).toISOString(),lockUntil:new Date(now+60000).toISOString()},nextGuard={day:today,count:(guard?.day===today?guard.count:0)+1,pendingUntil:now+60000,token:next.token};if(await store.atomicCompareSet([{table:'settings',id:guardId,old:guard,next:nextGuard},{table:'notification_jobs',id:old.id,old,next}]))return {id:next.id,token:next.token,...notificationCopy(next.kind,(await store.get('users',userId))?.language),href:next.href};
 }
 return null;
}
export async function acknowledgeNotification(store,userId,id,input,now=Date.now()){
 const old=await store.get('notification_jobs',id);if(!old||(old.channel||'browser')!=='browser'||old.userId!==userId||old.state!=='processing'||old.token!==input.token||Date.parse(old.lockUntil)<=now)throw Error('Notificação não está disponível para confirmação.');
 const config=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults),current=await notificationCurrent(store,old),success=input.ok===true;
 const next={...old,token:null,state:!current?'cancelled':success?'processed':old.attempts>=config.maxAttempts?'failed':'pending',nextAt:new Date(now+Math.min(900000,60000*5**(old.attempts-1))).toISOString(),errorCode:success?null:['permission_denied','unsupported','display_failed'].includes(input.errorCode)?input.errorCode:'display_failed',...(success?{completedAt:new Date(now).toISOString()}: {})};
 const guardId='notification-delivery-'+userId,guard=await store.get('settings',guardId),changes=[{table:'notification_jobs',id,old,next}];if(guard?.token===old.token)changes.unshift({table:'settings',id:guardId,old:guard,next:{...guard,pendingUntil:0,token:null}});
 if(!await store.atomicCompareSet(changes))throw Error('Notificação alterada. Atualize e tente novamente.');return {state:next.state};
}
export async function notificationAPI(req,store,user,path){
 const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
 if(!user)return response({error:'Acesso restrito.'},401);if(!['admin','editor','agent'].includes(user.role))return response({error:'Acesso restrito.'},403);
 const method=req.method;
 if(path[1]==='preference'){
  if(method==='GET'){const pref=await store.get('settings',preferenceKey(user.id));return response({browser:pref?.browser===true,email:pref?.email===true,whatsapp:pref?.whatsapp===true,whatsappNumber:pref?.whatsappNumber||''});}
  if(method==='PUT'){
   const input=await req.json(),keys=['browser','email','whatsapp'];if(!keys.some(key=>typeof input[key]==='boolean')||keys.some(key=>input[key]!==undefined&&typeof input[key]!=='boolean'))throw Error('Preferência inválida.');
   if(input.whatsapp===true&&(!/^[1-9]\d{7,14}$/.test(input.whatsappNumber||'')||input.consent!==true))throw Error('Informe telefone internacional e consentimento para WhatsApp.');
   const old=await store.get('settings',preferenceKey(user.id)),next={...old,id:preferenceKey(user.id),browser:old?.browser===true,email:old?.email===true,...Object.fromEntries(keys.filter(key=>input[key]!==undefined).map(key=>[key,input[key]])),updatedAt:new Date().toISOString(),...(input.whatsapp!==undefined?{whatsappNumber:input.whatsappNumber||old?.whatsappNumber||'',whatsappConsent:{date:new Date().toISOString(),source:'account-preference',enabled:input.whatsapp}}:{})};
   if(!await store.atomicCompareSet([{table:'settings',id:preferenceKey(user.id),old,next}]))return response({error:'Preferência alterada. Atualize e tente novamente.'},409);return response({browser:next.browser,email:next.email,whatsapp:next.whatsapp===true,whatsappNumber:next.whatsappNumber||''});
  }
 }
 if(path[1]==='inbox'&&method==='POST'){await enqueueNotifications(store);return response({job:await claimNotification(store,user.id)});}
 if(path[1]==='jobs'&&method==='POST')return response(await acknowledgeNotification(store,user.id,path[2],await req.json()));
 if(user.role!=='admin')return response({error:'Apenas administradores podem configurar notificações.'},403);
 if(path[1]==='verify-email'&&method==='POST'){const {verifySMTP}=await import('./email-notifications.mjs');return response(await verifySMTP());}
 if(path[1]==='config'){
  if(method==='GET'){const raw=await store.get('settings','notifications')||notificationDefaults,config={...validateNotificationConfig(raw),revision:raw.revision||0},jobs=await store.all('notification_jobs'),{emailStatus}=await import('./email-notifications.mjs');return response({config,email:emailStatus(),whatsapp:(await import('./whatsapp.mjs')).whatsappStatus(),counts:Object.fromEntries(['pending','processing','processed','smtp_accepted','whatsapp_accepted','simulated','sent','delivered','read','uncertain','failed','cancelled'].map(s=>[s,jobs.filter(j=>j.state===s).length])),jobs:jobs.filter(j=>['failed','uncertain'].includes(j.state)).slice(-20).map(j=>({id:j.id,kind:j.kind,channel:j.channel||'browser',state:j.state,attempts:j.attempts,errorCode:j.errorCode,date:j.lastAttemptAt}))});}
  if(method==='PUT'){const old=await store.get('settings','notifications'),input=await req.json();if(input.expectedRevision!==undefined&&input.expectedRevision!==(old?.revision||0))return response({error:'Configuração alterada. Atualize e tente novamente.'},409);const config=validateNotificationConfig(input.config);if(config.enabled&&config.channel==='email'){const {emailStatus}=await import('./email-notifications.mjs');if(!emailStatus().ready)throw Error('Configure SMTP e libere EMAIL_NOTIFICATIONS_ENABLED no servidor antes de ativar o e-mail.');}if(config.enabled&&config.channel==='whatsapp'){const status=(await import('./whatsapp.mjs')).whatsappStatus();if(!status.enabled||!status.configured)throw Error('Configure WhatsApp no servidor antes de ativar o canal.');}for(const id of config.testUserIds)if(!(await store.get('users',id))?.active)throw Error('Selecione destinatários de teste ativos.');const next={...config,revision:(old?.revision||0)+1};if(!await store.atomicCompareSet([{table:'settings',id:'notifications',old,next}]))return response({error:'Configuração alterada. Atualize e tente novamente.'},409);return response(next);}
 }
 if(path[1]==='test'&&method==='POST'){
  const input=await req.json(),config=validateNotificationConfig(await store.get('settings','notifications')||notificationDefaults);
  if(!config.enabled||!config.testMode||!config.testUserIds.includes(input.userId)||!await optedIn(store,input.userId,config.channel))throw Error('Ative o modo de teste e selecione um destinatário com preferência habilitada.');
  const id=randomUUID(),now=Date.now();await store.set('notification_jobs',id,{id,channel:config.channel,kind:'test',entityId:id,userId:input.userId,sourceAt:new Date(now).toISOString(),dueAt:new Date(now).toISOString(),href:'/admin/notificacoes',state:'pending',attempts:0,createdAt:new Date(now).toISOString(),nextAt:new Date(now).toISOString(),expiresAt:new Date(now+86400000).toISOString()});return response({ok:true,id},201);
 }
 return response({error:'Recurso não encontrado.'},404);
}
