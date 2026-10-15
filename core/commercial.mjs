import {commissionAccess,activeVisit} from './enhancements.mjs';
export const languages=['pt','es','en','it','de'];
export function publicBroker(user){
 const p=user?.publicProfile;
 return user?.active&&['admin','editor','agent'].includes(user.role)&&p?.enabled?{id:user.id,name:p.name,whatsapp:p.whatsapp,email:p.email}:null;
}
export function validatePublicProfile(p={}){
 if(typeof p.enabled!=='boolean'||typeof p.name!=='string'||p.name.length>100||p.enabled&&!p.name.trim())throw Error('Informe o nome comercial do corretor.');
 if(typeof p.whatsapp!=='string'||p.whatsapp&&!/^[1-9]\d{9,14}$/.test(p.whatsapp))throw Error('WhatsApp público: informe país, DDD e número, apenas dígitos (10 a 15).');
 if(typeof p.email!=='string'||p.email.length>200||p.email&&!/^\S+@\S+\.\S+$/.test(p.email))throw Error('E-mail profissional inválido.');
 return {enabled:p.enabled,name:p.name.trim(),whatsapp:p.whatsapp,email:p.email};
}
export function dateKey(value,timeZone='America/Sao_Paulo'){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function operationalReport({leads,visits,properties,internals,user,query,now=Date.now()}){
 const timeZone=query.get('timeZone')||'America/Sao_Paulo';dateKey(now,timeZone);
 const from=query.get('from')||'',to=query.get('to')||'',responsible=query.get('responsible')||'',propertyId=query.get('propertyId')||'';
 for(const value of [from,to])if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value))throw Error('Período inválido.');
 if(from&&to&&from>to)throw Error('O início deve anteceder o fim do período.');
 const period=date=>{const key=dateKey(date,timeZone);return (!from||key>=from)&&(!to||key<=to);};
 const scope=x=>(!responsible||x.responsible?.id===responsible)&&(!propertyId||x.propertyId===propertyId);
 const contacts=leads.filter(l=>scope(l)&&period(l.date)),appointments=visits.filter(v=>scope(v)&&period(v.startAt));
 const rows=contacts.map(l=>({kind:'Contato',id:l.id,propertyId:l.propertyId||'',responsible:l.responsible?.name||'',date:l.date,status:l.status})).concat(appointments.map(v=>({kind:'Visita',id:v.id,propertyId:v.propertyId,responsible:v.responsible?.name||'',date:v.startAt,status:v.status})));
 const report={timeZone,from,to,criteria:'Contatos pela data de entrada; visitas pela data agendada; etapas atuais. Retornos vencidos são um retrato atual dos contatos filtrados. Comissões são valores atuais dos imóveis vinculados ao filtro, separados por moeda, e não movimentações no período.',contacts:Object.fromEntries(['Novo','Em atendimento','Visita agendada','Concluído'].map(s=>[s,contacts.filter(l=>l.status===s).length])),overdue:contacts.filter(l=>l.status!=='Concluído'&&l.followUpAt&&Date.parse(l.followUpAt)<now).length,visits:Object.fromEntries(['Solicitada','Confirmada pelo proprietário','Realizada','Cancelada'].map(s=>[s,appointments.filter(v=>(v.status==='Agendada'?'Solicitada':v.status)===s).length])),movements:contacts.flatMap(l=>(l.history||[]).filter(h=>h.from&&h.to&&period(h.date)).map(h=>({date:h.date,from:h.from,to:h.to,actor:h.actorName}))),legacyWithoutHistory:contacts.filter(l=>!l.history?.length).length,openPastVisits:appointments.filter(v=>activeVisit(v)&&Date.parse(v.endAt)<now).length,rows};
 if(commissionAccess(user).view){
  const eligible=new Set(responsible||from||to?contacts.map(l=>l.propertyId).concat(appointments.map(v=>v.propertyId)):properties.map(p=>p.id));
  report.commissions={};
  for(const p of properties.filter(p=>(!propertyId||p.id===propertyId)&&eligible.has(p.id))){const c=internals.find(i=>i.id===p.id)?.commission;if(!c)continue;const totals=report.commissions[p.currency]??={forecast:0,approved:0,paid:0};for(const v of c.participants||[]){totals.forecast+=v.type==='percent'?c.saleValue*v.value/100:v.value;totals.approved+=c.stage&&c.stage!=='Previsão'?(v.type==='percent'?c.actualSaleValue*v.value/100:v.value):0;totals.paid+=v.paidAmount||0;}}
 }
 return report;
}
