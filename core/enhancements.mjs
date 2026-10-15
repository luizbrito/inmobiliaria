export const activeVisit=v=>['Agendada','Solicitada','Confirmada pelo proprietário'].includes(v.status);
export const visitStatus=v=>v.status==='Agendada'?'Solicitada':v.status;
export const commissionAccess=user=>({view:user?.role==='admin'||user?.commissionView===true,edit:user?.role==='admin'||user?.commissionEdit===true});
export function availability(input={}){
 const timeZone=input.timeZone||'America/Sao_Paulo';try{new Intl.DateTimeFormat('en',{timeZone}).format();}catch{throw Error('Fuso horário inválido.');}
 const weekdays=input.weekdays??[0,1,2,3,4,5,6],startHour=input.startHour||'00:00',endHour=input.endHour||'23:59',intervalMinutes=Number(input.intervalMinutes||0),blocked=input.blocked||[];
 if(!Array.isArray(weekdays)||!weekdays.length||weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(weekdays).size!==weekdays.length)throw Error('Selecione os dias permitidos.');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(startHour)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(endHour)||startHour>=endHour)throw Error('Informe uma faixa de horários válida.');
 if(!Number.isInteger(intervalMinutes)||intervalMinutes<0||intervalMinutes>240||!Array.isArray(blocked)||blocked.length>100)throw Error('Intervalo ou bloqueios inválidos.');
 const periods=blocked.map(b=>{const start=Date.parse(b.startAt),end=Date.parse(b.endAt);if(!Number.isFinite(start)||!Number.isFinite(end)||start>=end||String(b.reason||'').length>200)throw Error('Período bloqueado inválido.');return {startAt:new Date(start).toISOString(),endAt:new Date(end).toISOString(),reason:String(b.reason||'')};});
 return {timeZone,weekdays,startHour,endHour,intervalMinutes,blocked:periods};
}
export function checkAvailability(start,end,policy,events,oldId){
 const a=availability(policy.availability),parts=time=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:a.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(time).map(p=>[p.type,p.value]));
 const from=parts(start),to=parts(end),date=p=>`${p.year}-${p.month}-${p.day}`,time=p=>`${p.hour}:${p.minute}`,weekday=new Date(date(from)+'T12:00:00Z').getUTCDay();
 if(!a.weekdays.includes(weekday)||date(from)!==date(to)||time(from)<a.startHour||time(to)>a.endHour)throw Error('Visita fora dos dias ou horários permitidos para esta propriedade.');
 if(a.blocked.some(b=>start<Date.parse(b.endAt)&&end>Date.parse(b.startAt)))throw Error('Este período está bloqueado para visitas.');
 const gap=a.intervalMinutes*60000;if(events.some(v=>v.id!==oldId&&activeVisit(v)&&start<Date.parse(v.endAt)+gap&&end+gap>Date.parse(v.startAt)))throw Error('Horário ocupado ou intervalo entre visitas insuficiente.');
}
export function commissionState(c,old,actor){
 const actualSaleValue=Number(c.actualSaleValue||0),stage=c.stage||'Previsão';if(!['Previsão','Aprovada','Paga'].includes(stage)||!Number.isFinite(actualSaleValue)||actualSaleValue<0)throw Error('Controle de comissão inválido.');
 if(stage!=='Previsão'&&actualSaleValue<=0)throw Error('Informe o preço efetivo da venda antes da aprovação.');
 const participants=c.participants.map((p,i)=>({...p,id:c.participants[i].id||old?.participants?.find(o=>o.name===p.name)?.id||crypto.randomUUID(),paidAmount:Number(c.participants[i].paidAmount||0)}));
 const entitlement=p=>Math.round((p.type==='percent'?actualSaleValue*p.value/100:p.value)*100)/100;
 const total=participants.reduce((sum,p)=>sum+entitlement(p),0);
 if(actualSaleValue&&total>actualSaleValue+0.001)throw Error('Comissões excedem o preço efetivo da venda.');
 for(const p of participants){const approved=entitlement(p);if(!Number.isFinite(p.paidAmount)||p.paidAmount<0||p.paidAmount>approved+0.001||stage==='Previsão'&&p.paidAmount>0||stage==='Paga'&&Math.abs(p.paidAmount-approved)>0.001)throw Error('Pagamento deve corresponder ao valor aprovado; previsão não aceita pagamento.');}
 const result={saleValue:c.saleValue,actualSaleValue,stage,participants};const snapshot=x=>JSON.stringify({...x,history:undefined});const history=old?.history||[];return {...result,history:snapshot(result)!==snapshot(old||{})?[...history,{date:new Date().toISOString(),actorId:actor.id,actorName:actor.name,from:old?{saleValue:old.saleValue,actualSaleValue:old.actualSaleValue||0,stage:old.stage||'Previsão',participants:old.participants}:null,to:result}]:history};
}
