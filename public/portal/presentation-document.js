import {copy,locales,term} from './presentation-i18n.js?v=20261015-5';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function photoURL(value,origin){
 if(/^[a-z\d_-]+\.jpg$/i.test(value))return new URL('/portal/assets/'+value,origin).href;
 if(/^\/api\/media\/[a-z\d-]+\.(jpg|png|webp)$/i.test(value))return new URL(value,origin).href;
 try{const u=new URL(value);if(!u.username&&!u.password&&(u.protocol==='https:'||u.origin===new URL(origin).origin&&(/^\/portal\/assets\/[a-z\d_-]+\.jpg$/i.test(u.pathname)||/^\/api\/media\/[a-z\d-]+\.(jpg|png|webp)$/i.test(u.pathname))))return u.href;}catch{}
 return '';
}
export function photosFor(p,origin){return [...new Set([p.image,...(p.gallery||[])].map(v=>photoURL(v,origin)).filter(Boolean))].slice(0,21);}
export function commercialText(p,settings,options){
 const {language='pt',includePrice=true,broker=null,url}=options,c=copy(language),translation=p.translations?.[language],title=translation?.title||p.title;
 const price=p.priceOnRequest?c.consult:new Intl.NumberFormat(locales[language],{style:'currency',currency:p.currency||'BRL'}).format(p.price);
 const contact=broker?[broker.name,broker.whatsapp?'+'+broker.whatsapp:'',broker.email]:[settings.name,settings.phone,settings.whatsapp?'+'+settings.whatsapp:'',settings.email];
 return [title,p.location,includePrice?price:'',url,...contact].filter(Boolean).join('\n');
}
export function documentHTML(p,settings,options){
 const {language='pt',broker=null,includePrice=true,photos=[],url,qr,origin}=options,c=copy(language),t=p.translations?.[language]||{},title=t.title||p.title,description=t.description||p.description||'',features=t.features?.length?t.features:p.features||[];
 const n=v=>new Intl.NumberFormat(locales[language],{maximumFractionDigits:2}).format(v),price=p.priceOnRequest?c.consult:new Intl.NumberFormat(locales[language],{style:'currency',currency:p.currency||'BRL'}).format(p.price);
 const missing=language!=='pt'&&(!t.title||p.description&&!t.description||p.features?.length&&!t.features?.length);
 const contact=(broker?[broker.name,broker.whatsapp?'WhatsApp: +'+broker.whatsapp:'',broker.email]:[settings.phone,settings.whatsapp?'WhatsApp: +'+settings.whatsapp:'',settings.email]).filter(Boolean).map(esc).join(' · ');
 const brand=`<header class="document-header"><div class="brand"><svg viewBox="0 0 40 44" aria-hidden="true"><path d="M4 32V19L20 6l16 13v13M10 29V21l10-8 10 8v8M15 38V24h10v14M2 39h36"/></svg><div><strong>${esc(settings.name||'Confianza')}</strong><small>${esc(settings.tagline||'')}</small></div></div><h1>${esc(title)}</h1><p>${contact}</p>${settings.address?`<small>${esc(settings.address)}</small>`:''}</header>`;
 const present=v=>v!==undefined&&v!==null&&v!=='';
 const row=(label,value)=>present(value)?`<dl class="technical-row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></dl>`:'';
 const section=(heading,rows)=>rows?`<h2>${esc(heading)}</h2>${rows}`:'';
 const field=(key,label,unit='')=>present(p[key])?row(c[label],typeof p[key]==='number'?n(p[key])+(unit?' '+unit:''):p[key]):'';
 const selected=photos.filter(x=>photoURL(x.src,origin)).slice(0,21);
 const photo=(x,cover=false)=>`<figure class="${cover?'cover-photo':'gallery-photo'}"><img src="${esc(photoURL(x.src,origin))}" alt="${esc(x.caption||title)}"><figcaption>${esc(String(x.caption||'').slice(0,180))}</figcaption></figure>`;
 const content=[selected[0]?photo(selected[0],true):'',`<h2>${esc(title)}</h2>`,`<p>${esc(p.location)}</p>`,includePrice?`<h2>${esc(price)}</h2>`:'',missing?`<p class="notice">${esc(c.original)}</p>`:'',section(c.identification,row(c.code,p.id)+row(c.type,term(p.type,language))+row(c.purpose,term(p.purpose,language))),section(c.location,row(c.location,p.location)+row(c.region,p.region)),section(c.areas,field('area','area',p.unit)+field('productive','productive',p.unit)+field('reserve','reserve',p.unit)),section(c.structure,field('beds','beds')+field('baths','baths')+field('parking','parking')+field('soil','soil')+field('rain','rain','mm')),description?`<h2>${esc(c.description)}</h2>`:'',...description.split(/\n\s*\n/).filter(Boolean).map(text=>`<p class="description">${esc(text)}</p>`),features.length?`<h2>${esc(c.features)}</h2>`:'',...features.map(f=>`<p>${esc(f)}</p>`),`<div class="qr-block"><img src="${esc(qr)}" width="120" height="120" alt="QR Code"><div><h2>${esc(c.qr)}</h2><a href="${esc(url)}">${esc(url)}</a></div></div>`,settings.demo?`<p class="notice">${esc(c.demo)}</p>`:'',...selected.slice(1).flatMap((x,i)=>[i===0?`<h2>${esc(c.gallery)}</h2>`:'',photo(x)])].join('');
 return `<!doctype html><html lang="${locales[language]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.id)}-${language} — ${esc(title)}</title><link rel="stylesheet" href="${origin}/portal/presentation.css?v=20261015-5"></head><body data-language="${language}"><div class="print-actions"><p role="status" aria-live="polite" id="print-status">${esc(c.loading)}</p><button id="print-button" disabled>${esc(c.print)}</button><button id="retry-images" hidden>${esc(c.retry)}</button></div><template id="page-header">${brand}</template><div id="pages"></div><div id="flow">${content}</div><script type="module" src="${origin}/portal/presentation-runtime.js?v=20261015-5"></script></body></html>`;
}
