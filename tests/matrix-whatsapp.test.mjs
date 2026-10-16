import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoryStore} from './helpers/memory-store.mjs';
import {runWhatsAppNotifications,whatsappPayload} from '../core/whatsapp.mjs';
import {notificationDefaults} from '../core/notifications.mjs';
test('M13 official transport classifies 429, rejection, server error and timeout without blind resend',async()=>{
 const now=Date.parse('2026-10-15T15:00:00Z');
 for(const [status,expected] of [[429,'pending'],[400,'failed'],[500,'uncertain'],['timeout','uncertain']]){
  const store=memoryStore(),env={WHATSAPP_ENABLED:'true',WHATSAPP_DRY_RUN:'false',WHATSAPP_ACCESS_TOKEN:'fixture',WHATSAPP_PHONE_NUMBER_ID:'123',WHATSAPP_API_VERSION:'v99.0',WHATSAPP_APP_SECRET:'fixture',WHATSAPP_VERIFY_TOKEN:'fixture',PUBLIC_ORIGIN:'https://example.test',WHATSAPP_TEST_NUMBERS:'5511999991111',...Object.fromEntries(['pt','es','en','it','de'].map(l=>['WHATSAPP_TEMPLATE_'+l.toUpperCase(),'fixture_'+l]))};
  await store.set('users','u',{id:'u',role:'admin',active:true,language:'pt'});await store.set('settings','notifications',{...notificationDefaults,enabled:true,channel:'whatsapp',testUserIds:['u'],startHour:'00:00',endHour:'23:59'});await store.set('settings','notification-user-u',{id:'notification-user-u',whatsapp:true,whatsappNumber:'5511999991111'});await store.set('notification_jobs','j',{id:'j',userId:'u',kind:'test',channel:'whatsapp',state:'pending',attempts:0,nextAt:new Date(now).toISOString(),expiresAt:new Date(now+3600000).toISOString(),href:'/admin/notificacoes'});
  let calls=0;const fetcher=async()=>{calls++;if(status==='timeout')throw Error('timeout');return {ok:false,status};};await runWhatsAppNotifications(store,{env,now:()=>now,fetcher});assert.equal((await store.get('notification_jobs','j')).state,expected);await runWhatsAppNotifications(store,{env,now:()=>now,fetcher});assert.equal(calls,1);
  for(const [language,code] of [['pt','pt_BR'],['es','es'],['en','en_US'],['it','it'],['de','de']])assert.equal(whatsappPayload({kind:'test',href:'/admin'}, {language},{whatsapp:true,whatsappNumber:'5511999991111'},env).template.language.code,code);
 }
});
