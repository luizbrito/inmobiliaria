// Unofficial WhatsApp Web adapter. No connection occurs until this factory is called.
export async function createBaileysAdapter({loadAuth,saveAuth,onState,onMessage,onReceipt}){
 const b=await import('@whiskeysockets/baileys'),stored=await loadAuth(),data=stored?JSON.parse(stored,b.BufferJSON.reviver):{creds:b.initAuthCreds(),keys:{}};let saving=Promise.resolve();
 const persist=()=>{saving=saving.then(()=>saveAuth(JSON.stringify(data,b.BufferJSON.replacer)));return saving;};
 const noop=()=>{},logger={level:'silent',trace:noop,debug:noop,info:noop,warn:noop,error:noop,fatal:noop,child:()=>logger};
 const keys={async get(type,ids){return Object.fromEntries(ids.map(id=>{let value=data.keys[type]?.[id];if(type==='app-state-sync-key'&&value)value=b.proto.Message.AppStateSyncKeyData.fromObject(value);return [id,value];}));},async set(input){for(const [type,values]of Object.entries(input)){data.keys[type]||={};for(const [id,value]of Object.entries(values))value==null?delete data.keys[type][id]:data.keys[type][id]=value;}await persist();}};
 const socket=b.default({auth:{creds:data.creds,keys},logger,markOnlineOnConnect:false,maxMsgRetryCount:0,syncFullHistory:false,shouldSyncHistoryMessage:()=>false,getMessage:async()=>undefined});
 const safe=fn=>(...args)=>Promise.resolve(fn(...args)).catch(()=>onState({state:'disconnected',errorCode:'qr_storage_failed',reconnect:false}));
 socket.ev.on('creds.update',safe(async update=>{Object.assign(data.creds,update);await persist();}));
 socket.ev.on('connection.update',safe(async update=>{if(update.qr)await onState({state:'waiting_qr',qr:update.qr});if(update.connection==='open')await onState({state:'connected'});if(update.connection==='close'){const code=update.lastDisconnect?.error?.output?.statusCode;await onState({state:'disconnected',reconnect:code!==b.DisconnectReason.loggedOut,loggedOut:code===b.DisconnectReason.loggedOut});}}));
 socket.ev.on('messages.upsert',safe(async event=>{if(event.type!=='notify')return;for(const m of event.messages||[]){const jid=m.key?.remoteJid;if(!jid||!/@(s\.whatsapp\.net|lid)$/.test(jid))continue;let phoneJid=m.key.remoteJidAlt||jid;if(phoneJid.endsWith('@lid')){try{phoneJid=await socket.signalRepository.lidMapping.getPNForLID(phoneJid)||phoneJid;}catch{}}
  const content=b.normalizeMessageContent(m.message),text=content?.conversation||content?.extendedTextMessage?.text||null,phone=phoneJid.endsWith('@s.whatsapp.net')?phoneJid.split('@')[0].split(':')[0]:'';
  await onMessage({jid,phone,providerId:m.key.id,fromMe:m.key.fromMe===true,text,sourceAt:Number(m.messageTimestamp)?new Date(Number(m.messageTimestamp)*1000).toISOString():null,status:({2:'sent',3:'delivered',4:'read',5:'read'})[m.status]||'observed'});
 }}));
 socket.ev.on('messages.update',safe(async updates=>{for(const item of updates){const state=({0:'failed',2:'sent',3:'delivered',4:'read',5:'read'})[item.update?.status];if(state)await onReceipt({providerId:item.key?.id,state});}}));
 return {async sendText(jid,text,providerId){const message=await socket.sendMessage(jid,{text},{messageId:providerId});return {providerId:message?.key?.id||providerId};},async logout(){await socket.logout();},async close(){socket.end(undefined);await saving.catch(()=>{});}};
}
