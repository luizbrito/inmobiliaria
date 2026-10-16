import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoryStore} from './helpers/memory-store.mjs';
import {requestPasswordReset,confirmPasswordReset} from '../core/password-reset.mjs';
import {historyChange,visibleHistory} from '../core/property-history.mjs';
import {contactAPI,duplicateContacts} from '../core/team-workflows.mjs';
import {checkAvailability,commissionState} from '../core/enhancements.mjs';
import {recordPropertyView,cleanPerformanceViews,performanceReport} from '../core/performance.mjs';
test('M05 inactive accounts and invalid reset inputs cannot change passwords or reveal tokens',async()=>{
 const store=memoryStore();await store.set('users','inactive',{id:'inactive',email:'inactive@example.test',active:false,passwordHash:'original'});let sends=0;
 await requestPasswordReset(store,'inactive@example.test',{env:{PASSWORD_RESET_ENABLED:'true',PASSWORD_RESET_TEST_EMAILS:'inactive@example.test'},send:async()=>{sends++;}});assert.equal(sends,0);
 for(const input of [{token:'bad',password:'long-enough-password'},{token:'a'.repeat(64),password:'short'},{token:'b'.repeat(64),password:'long-enough-password'}])await assert.rejects(()=>confirmPasswordReset(store,input,{hashPassword:async()=> 'changed'}));
 assert.equal((await store.get('users','inactive')).passwordHash,'original');assert.equal((await store.all('settings')).length,0);
});
test('M08 historical retention is bounded, snapshots are immutable and commissions remain private',()=>{
 let ledger=null,old=null;const actor={id:'editor',name:'Editor',role:'editor'};
 for(let i=0;i<105;i++){const next={id:'p',title:'Version '+i,image:'cover.jpg',gallery:['photo-'+i+'.jpg'],updatedAt:new Date(1000+i).toISOString()};ledger=historyChange(ledger,old,{commission:{saleValue:i}},next,{commission:{saleValue:i}},actor);old=next;}
 assert.equal(ledger.versions.length,100);assert.equal(ledger.versions[0].property.title,'Version 5');old.title='mutated';assert.equal(ledger.versions.at(-1).property.title,'Version 104');
 assert(visibleHistory(ledger,actor,false).every(v=>!v.internal.commission));assert.equal(visibleHistory(ledger,actor,true).at(-1).internal.commission.saleValue,104);
});
test('M09 reviewed merge moves QR references and cannot partially commit on conflict',async()=>{
 const store=memoryStore(),actor={id:'u',role:'agent',name:'Agent'},a={id:'a',name:'A',phone:'+55 11 99999-1111',consent:true,history:[]},b={id:'b',name:'B',phone:'5511999991111',history:[]};
 await store.set('leads','a',a);await store.set('leads','b',b);await store.set('settings','thread',{id:'thread',kind:'qr-thread',leadId:'a',candidateIds:['a','b'],revision:1});assert.equal(duplicateContacts([a,b]).length,1);
 const request=()=>new Request('https://example.test/api/team/contacts/merge',{method:'POST',body:JSON.stringify({sourceId:'a',targetId:'b',sourceRevision:0,targetRevision:0})}),cas=store.atomicCompareSet;
 store.atomicCompareSet=async()=>false;assert.equal((await contactAPI(request(),store,actor,['team','contacts','merge'])).status,409);assert.equal((await store.get('leads','a')).mergedInto,undefined);assert.equal((await store.get('settings','thread')).leadId,'a');
 store.atomicCompareSet=cas;assert.equal((await contactAPI(request(),store,actor,['team','contacts','merge'])).status,200);assert.equal((await store.get('leads','a')).mergedInto,'b');assert.equal((await store.get('settings','thread')).leadId,'b');assert.deepEqual((await store.get('settings','thread')).candidateIds,['b']);assert((await store.get('leads','b')).consentRecords.some(c=>c.sourceId==='a'&&c.consent));
});
test('M10 availability evaluates weekdays and midnight in the property timezone',()=>{
 const policy={availability:{timeZone:'America/Sao_Paulo',weekdays:[1],startHour:'20:00',endHour:'23:59'}};
 assert.doesNotThrow(()=>checkAvailability(Date.parse('2026-10-20T01:00:00Z'),Date.parse('2026-10-20T02:00:00Z'),policy,[]));
 assert.throws(()=>checkAvailability(Date.parse('2026-10-20T02:30:00Z'),Date.parse('2026-10-20T03:30:00Z'),policy,[]));
 const us={availability:{timeZone:'America/New_York',weekdays:[0],startHour:'00:00',endHour:'23:59'}};
 for(const day of ['2026-03-08','2026-11-01'])assert.doesNotThrow(()=>checkAvailability(Date.parse(day+'T17:00:00Z'),Date.parse(day+'T18:00:00Z'),us,[]));
});
test('M11 fractional commission and fixed entitlements enforce cent-level payments',()=>{
 const actor={id:'admin',name:'Admin'},c={saleValue:1000,actualSaleValue:999.99,stage:'Paga',participants:[{id:'percent',name:'P',type:'percent',value:3,paidAmount:30},{id:'fixed',name:'F',type:'amount',value:10.01,paidAmount:10.01}]};
 const paid=commissionState(c,null,actor);assert.equal(paid.participants[0].paidAmount,30);assert.equal(paid.participants[1].paidAmount,10.01);
 assert.throws(()=>commissionState({...c,participants:[{...c.participants[0],paidAmount:30.01}]},paid,actor));assert.throws(()=>commissionState({...c,stage:'Previsão'},paid,actor));
 assert.equal(commissionState(paid,paid,actor).history.length,paid.history.length);
});
test('M15 view retention and absent tracking never fabricate a responsible-user audience',async()=>{
 const store=memoryStore(),p={id:'p',title:'Fixture',status:'Publicado'},now=Date.parse('2026-10-15T12:00:00Z');await store.set('properties','p',p);
 const input={key:'fixture-key',ip:'127.0.0.1',userAgent:'Fixture browser',now};assert.equal(await recordPropertyView(store,'p',{...input,key:''}),false);assert.equal(await recordPropertyView(store,'p',input),true);assert.equal(await recordPropertyView(store,'p',input),false);
 await recordPropertyView(store,'p',{...input,now:now-91*86400000});await cleanPerformanceViews(store,now);const views=await store.all('settings');assert.equal(views.length,1);assert(!JSON.stringify(views).includes('127.0.0.1'));
 const args={properties:[p],leads:[],visits:[],views,from:'2026-10-15',to:'2026-10-15'};assert.equal(performanceReport({...args,responsibleId:'u'}).current[0].views,null);assert.equal(performanceReport({...args,trackingEnabled:false}).current[0].views,null);assert.equal(performanceReport(args).current[0].conversion,null);assert.throws(()=>performanceReport({...args,from:'2026-10-16'}));
});
