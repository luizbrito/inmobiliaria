import {availability,checkAvailability,visitStatus,activeVisit} from './enhancements.mjs';
export const staffRoles=['admin','editor','agent'];
export function validateInternal(input={}){
 const policy=input.visitPolicy||{mode:'immediate',noticeDays:0};
 if(!['immediate','prior'].includes(policy.mode)||!Number.isInteger(Number(policy.noticeDays))||Number(policy.noticeDays)<0||Number(policy.noticeDays)>365)throw Error('Antecedência deve ser de 0 a 365 dias.');
 const commission=input.commission||{saleValue:0,participants:[]};
 if(!Number.isFinite(Number(commission.saleValue))||Number(commission.saleValue)<0||!Array.isArray(commission.participants)||commission.participants.length>30)throw Error('Comissão inválida.');
 const participants=commission.participants.map(p=>{if(typeof p.name!=='string'||!p.name.trim()||p.name.length>150||!['percent','amount'].includes(p.type)||!Number.isFinite(Number(p.value))||Number(p.value)<0||p.type==='percent'&&Number(p.value)>100)throw Error('Participante da comissão inválido.');return {name:p.name.trim(),type:p.type,value:Number(p.value)};});
 const saleValue=Number(commission.saleValue),total=participants.reduce((sum,p)=>sum+(p.type==='percent'?saleValue*p.value/100:p.value),0);
 if(saleValue>0&&total>saleValue+0.001||participants.filter(p=>p.type==='percent').reduce((s,p)=>s+p.value,0)>100)throw Error('A soma das comissões não pode exceder o valor da venda.');
 return {visitPolicy:{mode:policy.mode,noticeDays:policy.mode==='prior'?Number(policy.noticeDays):0,availability:availability(policy.availability)},commission:{saleValue,participants:participants.map((p,i)=>({...p,...(commission.participants[i].id?{id:commission.participants[i].id}:{}),paidAmount:commission.participants[i].paidAmount||0})),actualSaleValue:commission.actualSaleValue||0,stage:commission.stage||'Previsão'}};
}
export function publicProperty(p){const keys=['id','title','type','purpose','status','currency','price','priceOnRequest','area','productive','reserve','rain','beds','baths','parking','latitude','longitude','location','region','description','image','soil','gallery','translations','features','unit','tag','featured','updatedAt'];return Object.fromEntries(keys.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]));}
export function transitionLead(lead,status,actor,now=new Date().toISOString()){
 if(!['Novo','Em atendimento','Visita agendada','Concluído'].includes(status))throw Error('Situação inválida.');
 if(lead.status===status)return lead;
 const next={...lead,status,history:[...(lead.history||[]),{date:now,from:lead.status,to:status,actorId:actor.id,actorName:actor.name}]};
 if(status==='Em atendimento')next.responsible={id:actor.id,name:actor.name};
 return next;
}
export function validateVisit(x,property,internal,ledger,actor,old=null){
 if(old&&['Cancelada','Realizada'].includes(old.status))throw Error('Visita encerrada não pode ser alterada.');
 const status=x.status||'Solicitada';if(!['Solicitada','Confirmada pelo proprietário','Cancelada','Realizada'].includes(status))throw Error('Situação da visita inválida.');
 if(old&&(x.status||x.notifyOwner)){
  const previous=visitStatus(old);if(['Cancelada','Realizada'].includes(previous))throw Error('Visita encerrada não pode ser alterada.');
  let notice=old.ownerNotice||null;const date=new Date().toISOString(),history=[...(old.history||[])];
  if(x.notifyOwner){if(!['WhatsApp','Telefone','E-mail','Outro'].includes(x.channel)||String(x.noticeNote||'').length>500)throw Error('Informe o canal utilizado para avisar o proprietário.');notice={date,actorId:actor.id,actorName:actor.name,channel:x.channel,note:String(x.noticeNote||'')};history.push({...notice,action:'Proprietário avisado'});}
  const next=x.status||previous;if(next==='Confirmada pelo proprietário'&&!notice)throw Error('Registre o aviso ao proprietário antes de confirmar.');if(next==='Realizada'&&previous!=='Confirmada pelo proprietário')throw Error('Somente visitas confirmadas podem ser realizadas.');
  if(next!==previous)history.push({date,actorId:actor.id,actorName:actor.name,action:next});return {...old,status:next,ownerNotice:notice,history};
 }
 if(status!=='Solicitada')throw Error('Uma nova visita começa como solicitada.');
 const mode=x.mode||'scheduled',durationMinutes=Number(x.durationMinutes||60),now=Date.now();
 if(!['immediate','scheduled'].includes(mode)||!Number.isInteger(durationMinutes)||durationMinutes<15||durationMinutes>480)throw Error('Duração deve ser de 15 a 480 minutos.');
 const policy=internal?.visitPolicy||{mode:'immediate',noticeDays:0};
 if(mode==='immediate'&&policy.mode==='prior')throw Error('Esta propriedade exige agendamento prévio.');
 if(mode==='scheduled'&&!/^\d{4}-\d{2}-\d{2}T.*(Z|[+-]\d{2}:\d{2})$/.test(x.startAt||''))throw Error('Informe data e horário válidos.');
 const start=mode==='immediate'?now:Date.parse(x.startAt),minimum=now+(policy.mode==='prior'?policy.noticeDays*86400000:0);
 if(!Number.isFinite(start)||start<minimum-1000)throw Error(`A visita exige ${policy.noticeDays||0} dias de antecedência e não pode estar no passado.`);
 const end=start+durationMinutes*60000;
 checkAvailability(start,end,policy,ledger,old?.id);
 if(typeof x.notes!=='string'&&x.notes!==undefined||String(x.notes||'').length>2000)throw Error('Observação inválida.');
 const date=new Date().toISOString();return {id:old?.id||crypto.randomUUID(),propertyId:property.id,propertyTitle:property.title,leadId:String(x.leadId||old?.leadId||''),startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString(),durationMinutes,mode,status:'Solicitada',ownerNotice:null,notes:String(x.notes||''),responsible:old?.responsible||{id:actor.id,name:actor.name},history:[...(old?.history||[]),{date,actorId:actor.id,actorName:actor.name,action:old?'Reagendada':'Solicitada'}]};
}
