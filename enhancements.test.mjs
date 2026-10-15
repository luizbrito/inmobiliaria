import {test} from 'node:test';
import assert from 'node:assert/strict';
import {availability,checkAvailability,commissionState} from './core/enhancements.mjs';
import {validateVisit} from './core/operations.mjs';
test('availability enforces farm timezone, weekdays, full duration, blocks and buffer',()=>{
 const start=Date.parse('2026-10-19T13:00:00Z'),end=start+3600000;
 const policy={availability:{timeZone:'America/Sao_Paulo',weekdays:[1],startHour:'09:00',endHour:'12:00',intervalMinutes:30}};
 assert.doesNotThrow(()=>checkAvailability(start,end,policy,[]));
 assert.throws(()=>checkAvailability(start+86400000,end+86400000,policy,[]));
 assert.throws(()=>checkAvailability(start,end+7200000,policy,[]));
 assert.throws(()=>checkAvailability(start,end,{availability:{...policy.availability,blocked:[{startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString()}]}},[]));
 const other={id:'other',status:'Solicitada',startAt:new Date(start-3600000).toISOString(),endAt:new Date(start-600000).toISOString()};
 assert.throws(()=>checkAvailability(start,end,policy,[other]));
 assert.doesNotThrow(()=>checkAvailability(start,end,policy,[{...other,status:'Cancelada'}]));
 assert.throws(()=>availability({weekdays:[]}));
});
test('owner notice and confirmation use authenticated actor and closed visits cannot reopen',()=>{
 const actor={id:'actor',name:'Staff'},old={id:'visit',status:'Solicitada',history:[]};
 assert.throws(()=>validateVisit({status:'Confirmada pelo proprietário'}, {},null,[],actor,old));
 assert.throws(()=>validateVisit({status:'Realizada'}, {},null,[],actor,old));
 const notified=validateVisit({notifyOwner:true,channel:'WhatsApp',actorName:'forged'}, {},null,[],actor,old);
 assert.equal(notified.ownerNotice.actorName,'Staff');assert(notified.ownerNotice.date);
 const confirmed=validateVisit({status:'Confirmada pelo proprietário'}, {},null,[],actor,notified);
 const done=validateVisit({status:'Realizada'}, {},null,[],actor,confirmed);
 assert.equal(done.history.length,3);assert.throws(()=>validateVisit({}, {},null,[],actor,done));
});
test('commission approval uses actual sale and payments cannot exceed approved entitlement',()=>{
 const actor={id:'a',name:'Admin'},c={saleValue:1000000,actualSaleValue:800000,stage:'Aprovada',participants:[{name:'A',type:'percent',value:3,paidAmount:10000},{name:'B',type:'amount',value:5000,paidAmount:0}]};
 const approved=commissionState(c,null,actor);assert.equal(approved.history[0].actorId,'a');
 assert.throws(()=>commissionState({...c,actualSaleValue:0},null,actor));
 assert.throws(()=>commissionState({...c,participants:[{...c.participants[0],paidAmount:25000}]},approved,actor));
 const paid=commissionState({...approved,stage:'Paga',participants:approved.participants.map(p=>({...p,paidAmount:p.type==='percent'?24000:5000}))},approved,actor);
 assert.equal(paid.history.length,2);assert.equal(paid.history[1].from.stage,'Aprovada');
});
