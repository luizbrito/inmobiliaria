import {commissionAccess,commissionState,activeVisit,visitStatus} from './enhancements.mjs';
import seed from './seed.json' with {type:'json'};
import defaults from './default-settings.json' with {type:'json'};
import {staffRoles,validateInternal,publicProperty,transitionLead,validateVisit} from './operations.mjs';
export const initialProperties=seed;
export const defaultSettings=defaults;
export function validateProperty(x){
 if(!x||typeof x!=='object')throw Error('Dados inválidos.');
 if(typeof x.title!=='string'||x.title.trim().length<3||x.title.length>150)throw Error('Informe um título entre 3 e 150 caracteres.');
 if(!['Casa','Apartamento','Fazenda','Terreno'].includes(x.type))throw Error('Tipo inválido.');
 if(!['Comprar','Alugar','Lançamentos'].includes(x.purpose))throw Error('Finalidade inválida.');
 if(!['Publicado','Rascunho','Vendido'].includes(x.status))throw Error('Situação inválida.');
 if(!['BRL','USD'].includes(x.currency))throw Error('Moeda inválida.');
 if(x.priceOnRequest!==undefined&&typeof x.priceOnRequest!=='boolean')throw Error('Preço sob consulta inválido.');
 if(!Number.isFinite(Number(x.area))||Number(x.area)<=0||!x.priceOnRequest&&(!Number.isFinite(Number(x.price))||Number(x.price)<=0))throw Error('Preço e área devem ser positivos.');
 for(const field of ['productive','reserve','rain','beds','baths','parking'])if(x[field]!=null&&(!Number.isFinite(Number(x[field]))||Number(x[field])<0))throw Error('Dados técnicos inválidos.');
 if(x.productive!=null&&Number(x.productive)>Number(x.area))throw Error('A área produtiva não pode exceder a área total.');
 for(const [field,max] of [['latitude',90],['longitude',180]])if(x[field]!=null&&(!Number.isFinite(Number(x[field]))||Math.abs(Number(x[field]))>max))throw Error('Coordenadas inválidas.');
 for(const key of ['title','location','region','description','image','soil'])if(x[key]!==undefined&&(typeof x[key]!=='string'||x[key].length>5000))throw Error('Campo inválido: '+key);
 if(!Array.isArray(x.gallery)||x.gallery.length>20||!x.gallery.every(s=>typeof s==='string'&&s.length<1000))throw Error('Galeria inválida.');
 if(x.translations!==undefined){for(const [lang,v] of Object.entries(x.translations)){if(!['pt','es','en','it','de'].includes(lang)||typeof v!=='object'||!v)throw Error('Tradução inválida.');if(v.features!==undefined&&(!Array.isArray(v.features)||v.features.length>30||!v.features.every(f=>typeof f==='string'&&f.length<150)))throw Error('Tradução inválida.');for(const f of ['title','description'])if(v[f]!==undefined&&(typeof v[f]!=='string'||v[f].length>5000))throw Error('Tradução inválida.');}}
 const images=[x.image,...x.gallery].filter(Boolean);if(!images.every(s=>/^[a-z\d_-]+\.jpg$/i.test(s)||/^\/api\/media\/[a-z\d-]+\.(jpg|png|webp)$/i.test(s)||/^https:\/\//.test(s)))throw Error('Use fotos locais ou endereços HTTPS.');
 if(!Array.isArray(x.features)||x.features.length>30||!x.features.every(s=>typeof s==='string'&&s.length<150))throw Error('Características inválidas.');
 return {...x,id:typeof x.id==='string'&&/^[a-z0-9-]{1,80}$/.test(x.id)?x.id:crypto.randomUUID(),price:x.priceOnRequest?null:Number(x.price),area:Number(x.area),updatedAt:new Date().toISOString()};
}
function privateInternal(data,user){if(commissionAccess(user).view)return data;const {commission,...visible}=data;return visible;}
const json=(x,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
export async function service(req,store,auth,media){
 const url=new URL(req.url),path=url.pathname.replace(/^\/api\/?/,'').split('/');
 const method=req.method,admin=await auth(req);
 if(method!=='GET'&&method!=='HEAD'){
  const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'Origem inválida.'},403);
 }
 try{
 if(path[0]==='session')return json({authenticated:!!admin,id:admin?.id||null,role:admin?.role||null,name:admin?.name||'',language:admin?.language||'pt',commissionPermissions:commissionAccess(admin),mode:media.mode});
 if(path[0]==='health')return json({ok:true});
 if(path[0]==='media'&&method==='GET')return await media.get(path[1]);
 if(path[0]==='uploads'&&method==='POST'){
  if(!admin)return json({error:'Acesso restrito.'},401);
  if(!['admin','editor'].includes(admin.role))return json({error:'Você não tem permissão para editar imóveis.'},403);
  const bytes=new Uint8Array(await req.arrayBuffer());if(bytes.length>3*1024*1024)return json({error:'A foto deve ter até 3 MB.'},413);
  const ext=bytes[0]===255&&bytes[1]===216?'jpg':bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71?'png':String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'?'webp':null;
  if(!ext)return json({error:'Use JPG, PNG ou WebP.'},400);
  if(!media.validate)return json({error:'Validação de imagem indisponível.'},503);
  const validated=await media.validate(bytes);
  const key=crypto.randomUUID()+'.'+validated.ext;await media.put(key,validated.bytes,validated.ext);return json({url:'/api/media/'+key},201);
 }
 if(path[0]==='properties'){
  if(method==='GET'){let rows=await store.all('properties');if(!rows.length&&!await store.get('settings','initialized')){await store.seed(seed);await store.set('settings','initialized',{done:true});rows=await store.all('properties');}const internalView=admin&&staffRoles.includes(admin.role)&&url.searchParams.get('admin')==='1';rows=rows.filter(x=>internalView||x.status==='Publicado');return json(await Promise.all(rows.map(async x=>internalView?{...publicProperty(x),internal:privateInternal(await store.get('property_internal',x.id)||validateInternal(),admin)} :publicProperty(x))));}
  if(!admin)return json({error:'Acesso restrito.'},401);
  if(!['admin','editor'].includes(admin.role))return json({error:'Você não tem permissão para editar imóveis.'},403);
  if(method==='POST'||method==='PUT'){const input=await req.json(),x=publicProperty(validateProperty(input));if(method==='PUT'&&x.id!==path[1])return json({error:'ID inválido.'},400);const old=await store.get('properties',x.id),oldInternal=await store.get('property_internal',x.id);if(method==='PUT'&&!old)return json({error:'Imóvel não encontrado.'},404);if(input.internal?.commission&&!commissionAccess(admin).edit)return json({error:'Sem permissão para alterar comissões.'},403);const internal=validateInternal({...(input.internal||oldInternal||{}),commission:input.internal?.commission||oldInternal?.commission||{saleValue:0,participants:[]}});internal.commission= input.internal?.commission?commissionState(internal.commission,oldInternal?.commission,admin):oldInternal?.commission||internal.commission;if(!await store.atomicCompareSet([{table:'properties',id:x.id,old,next:x},{table:'property_internal',id:x.id,old:oldInternal,next:internal}]))return json({error:'Imóvel alterado por outra operação. Atualize e tente novamente.'},409);return json({...x,internal:privateInternal(internal,admin)},method==='POST'?201:200);}
  if(method==='DELETE'){const old=await store.get('properties',path[1]),ledger=await store.get('visits',path[1]),internal=await store.get('property_internal',path[1]);if(!old)return json({error:'Imóvel não encontrado.'},404);if(ledger?.events?.length)return json({error:'Este imóvel possui histórico de visitas. Altere sua situação para preservar os registros.'},409);if(!await store.atomicCompareSet([{table:'properties',id:path[1],old,next:null},{table:'visits',id:path[1],old:ledger,next:null},{table:'property_internal',id:path[1],old:internal,next:null}]))return json({error:'Imóvel alterado por outra operação. Atualize e tente novamente.'},409);return json({ok:true});}
 }
 if(path[0]==='settings'){
  if(method==='GET')return json(await store.get('settings','public')||defaults);
  if(!admin)return json({error:'Acesso restrito.'},401);
  if(admin.role!=='admin')return json({error:'Apenas administradores podem alterar configurações.'},403);
  if(method==='PUT'){const x=await req.json();const fields=['name','tagline','phone','email','address','whatsapp'];const clean={demo:!!x.demo};for(const f of fields){if(typeof x[f]!=='string'||x[f].length>200)throw Error('Configuração inválida.');clean[f]=x[f];}if(clean.whatsapp&&!/^\d{8,15}$/.test(clean.whatsapp))throw Error('WhatsApp: use país, DDD e número, apenas dígitos.');await store.set('settings','public',clean);return json(clean);}
 }
 if(path[0]==='users')return json({supported:false,users:[]});
 if(path[0]==='leads'){
  if(method==='POST'){
   const x=await req.json();if(x.website)return json({ok:true});
   if(typeof x.name!=='string'||x.name.trim().length<2||x.name.length>150)throw Error('Informe seu nome.');
   if(typeof x.email!=='string'||!/^\S+@\S+\.\S+$/.test(x.email)||x.email.length>200)throw Error('Informe um e-mail válido.');
   if(!x.consent)throw Error('Autorize o contato para continuar.');
   let propertyId='';if(x.propertyId){const property=await store.get('properties',String(x.propertyId));if(!property||property.status!=='Publicado')throw Error('Imóvel indisponível.');propertyId=property.id;}
   const lead={id:crypto.randomUUID(),name:x.name.trim(),email:x.email,phone:String(x.phone||'').slice(0,40),message:String(x.message||'').slice(0,2000),property:String(x.property||'Contato geral').slice(0,150),propertyId,kind:String(x.kind||'Contato').slice(0,30),date:new Date().toISOString(),status:'Novo',history:[]};await store.set('leads',lead.id,lead);return json({ok:true,id:lead.id},201);
  }
  if(!admin)return json({error:'Acesso restrito.'},401);
  if(!['admin','editor','agent'].includes(admin.role))return json({error:'Acesso restrito.'},403);
  if(method==='GET')return json((await store.all('leads')).sort((a,b)=>b.date.localeCompare(a.date)));
  if(method==='PUT'){const x=await req.json();const lead=await store.get('leads',path[1]);if(!lead)return json({error:'Contato não encontrado.'},404);if(x.status==='Visita agendada'&&!(await store.all('visits')).some(l=>(l.events||[]).some(v=>v.leadId===lead.id&&activeVisit(v))))throw Error('Cadastre a visita no calendário antes de mover o contato.');let next=x.status?transitionLead(lead,x.status,admin):{...lead};
   if(x.responsibleId!==undefined){const u=await store.get('users',String(x.responsibleId));if(!u?.active||!staffRoles.includes(u.role))throw Error('Selecione um responsável ativo.');if(lead.responsible?.id!==u.id){next={...next,responsible:{id:u.id,name:u.name},history:[...(next.history||[]),{date:new Date().toISOString(),actorId:admin.id,actorName:admin.name,action:'Responsável transferido',fromResponsible:lead.responsible||null,toResponsible:{id:u.id,name:u.name}}]};}}
   if(x.followUpAt!==undefined){const date=x.followUpAt?Date.parse(x.followUpAt):null;if(date!==null&&(!Number.isFinite(date)||date<Date.now()))throw Error('Lembrete deve estar no futuro.');next.followUpAt=date?new Date(date).toISOString():null;next.history=[...(next.history||[]),{date:new Date().toISOString(),actorId:admin.id,actorName:admin.name,action:date?'Lembrete criado':'Lembrete concluído'}];}
if(!await store.atomicCompareSet([{table:'leads',id:lead.id,old:lead,next}]))return json({error:'Contato alterado por outra operação. Atualize e tente novamente.'},409);return json(next);}
  if(method==='DELETE'){await store.remove('leads',path[1]);return json({ok:true});}
 }
 if(path[0]==='commissions'){
  if(!admin)return json({error:'Acesso restrito.'},401);if(!commissionAccess(admin).edit)return json({error:'Sem permissão para alterar comissões.'},403);
  if(method==='PUT'){const property=await store.get('properties',path[1]);if(!property)return json({error:'Imóvel não encontrado.'},404);const old=await store.get('property_internal',property.id),input=await req.json(),valid=validateInternal({...old,commission:input}),next={...(old||validateInternal()),commission:commissionState(valid.commission,old?.commission,admin)};if(!await store.atomicCompareSet([{table:'properties',id:property.id,old:property,next:property},{table:'property_internal',id:property.id,old,next}]))return json({error:'Comissão alterada por outra operação. Atualize e tente novamente.'},409);return json(next.commission);}
 }
 if(path[0]==='visits'){
  if(!admin)return json({error:'Acesso restrito.'},401);if(!staffRoles.includes(admin.role))return json({error:'Acesso restrito.'},403);
  if(method==='GET')return json((await store.all('visits')).flatMap(l=>(l.events||[]).map(v=>({...v,status:visitStatus(v)}))).sort((a,b)=>a.startAt.localeCompare(b.startAt)));
  if(method==='POST'||method==='PUT'){
   const x=await req.json(),property=await store.get('properties',String(x.propertyId||''));if(!property)return json({error:'Imóvel não encontrado.'},404);
   const ledger=await store.get('visits',property.id),events=ledger?.events||[],old=method==='PUT'?events.find(v=>v.id===path[1]):null;if(method==='PUT'&&!old)return json({error:'Visita não encontrada.'},404);
   const internal=await store.get('property_internal',property.id),visit=validateVisit(x,property,internal,events,admin,old);
   const lead=visit.leadId?await store.get('leads',visit.leadId):null;if(visit.leadId&&!lead)throw Error('Contato não encontrado.');if(lead?.propertyId&&lead.propertyId!==property.id)throw Error('A visita deve corresponder ao imóvel do contato.');
   const changes=[{table:'properties',id:property.id,old:property,next:property},{table:'property_internal',id:property.id,old:internal,next:internal},{table:'visits',id:property.id,old:ledger,next:{events:[...events.filter(v=>v.id!==visit.id),visit]}}];
   if(lead&&activeVisit(visit)){let next=transitionLead(lead,'Visita agendada',admin);if(!next.responsible)next={...next,responsible:{id:admin.id,name:admin.name}};changes.push({table:'leads',id:lead.id,old:lead,next});}
   if(lead&&visit.status==='Cancelada'&&lead.status==='Visita agendada'&&!events.some(v=>v.id!==visit.id&&v.leadId===lead.id&&activeVisit(v)))changes.push({table:'leads',id:lead.id,old:lead,next:{...transitionLead(lead,'Em atendimento',admin),...(lead.responsible?{responsible:lead.responsible}:{})}});
   if(!await store.atomicCompareSet(changes))return json({error:'Agenda alterada por outra operação. Atualize e tente novamente.'},409);return json(visit,old?200:201);
  }
 }
 return json({error:'Recurso não encontrado.'},404);
 }catch(e){return json({error:e.message||'Não foi possível concluir.'},400);}
}
