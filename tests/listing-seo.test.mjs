import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeListingFilters,filterListing,listingHeading,listingMetadata} from '../public/portal/listing-seo.js';
import {startApp} from './helpers/fixtures.mjs';
import {totp} from '../core/security.mjs';
import './helpers/network-guard.mjs';

const property={id:'casa-publica',title:'Casa <segura> $&',location:'Goiânia, GO',region:'Centro-Oeste',type:'Casa',purpose:'Comprar',price:500000,currency:'BRL',area:120,unit:'m²',beds:3,baths:2,parking:1,image:'house.jpg',gallery:['house.jpg'],description:'Informações da casa para planejar uma visita.',features:[],status:'Publicado'};
const properties=[property,{...property,id:'aluguel',purpose:'Alugar',price:2500},{...property,id:'usd',currency:'USD',price:100},{...property,id:'consulta',priceOnRequest:true,price:null},{...property,id:'rascunho',status:'Rascunho'},{...property,id:'vendido',status:'Vendido'}];

test('listing filters normalize URL and object inputs and reject invalid numeric bounds',()=>{
 const expected={q:'Jardim das Flores',type:'Casa',purpose:'Comprar',region:'Sul',max:500000,minArea:80.5};
 const input={q:'  Jardim  das Flores  ',type:'Casa',purpose:'Comprar',region:'Sul',max:'500000',minArea:'80.5'};
 assert.deepEqual(normalizeListingFilters(input),expected);
 assert.deepEqual(normalizeListingFilters(new URLSearchParams(input)),expected);
 for(const bad of ['NaN','Infinity','-1','0',null,undefined,{},[]])assert.equal(normalizeListingFilters({max:bad,minArea:bad}).max,'');
 assert.equal(normalizeListingFilters({q:{toString(){throw Error('untrusted');}}}).q,'');
});

test('listing results apply combined local filters and BRL limits without exposing unpublished properties',()=>{
 assert.deepEqual(filterListing(properties,{}).map(p=>p.id),['casa-publica','aluguel','usd','consulta']);
 assert.deepEqual(filterListing(properties,{q:'goiania',type:'Casa',purpose:'Comprar',region:'Centro-Oeste',max:'500000',minArea:'120'}).map(p=>p.id),['casa-publica']);
 for(const filters of [{purpose:'Unknown'},{type:'Unknown'},{region:'Sul'},{max:499999,purpose:'Comprar'},{minArea:121}])assert.deepEqual(filterListing(properties,filters),[]);
 const translated={...property,translations:{en:{title:'Garden home'}}};
 assert.equal(filterListing([translated],{q:'garden'},{lang:'en'}).length,1);
 assert.equal(filterListing([translated],{q:'garden'}).length,0);
});

test('local headings and metadata use supplied geography and the selected intent in all supported languages',()=>{
 assert.equal(listingHeading({q:'Curitiba',purpose:'Comprar'}),'Imóveis à venda em Curitiba');
 assert.equal(listingHeading({type:'Apartamento',purpose:'Alugar',q:'Batel'}),'Apartamentos para alugar em Batel');
 assert.equal(listingHeading({type:'Fazenda',region:'Paraguai'}),'Fazendas disponíveis no Paraguai');
 assert.equal(listingHeading({purpose:'Lançamentos',region:'Sul'}),'Lançamentos imobiliários no Sul');
 assert.equal(listingHeading({q:'Curitiba',purpose:'Comprar'},'en'),'Properties for sale in Curitiba');
 for(const [lang,expected] of [['es','Casas en alquiler en Curitiba'],['it','Case in affitto a Curitiba'],['de','Häuser zur Miete in Curitiba']])assert.equal(listingHeading({type:'Casa',purpose:'Alugar',q:'Curitiba'},lang),expected);
 assert.equal(listingHeading({},'unknown'),listingHeading({}));
 const meta=listingMetadata({q:'Curitiba',purpose:'Comprar'},'pt','Confianza');
 assert.equal(meta.title,meta.heading+' | Confianza');assert(meta.description.startsWith(meta.heading+'.'));
 assert(!listingMetadata({}).description.includes('Curitiba'));
});

test('listing HTTP serves escaped, filtered HTML and indexing directives before JavaScript runs',async t=>{
 const app=await startApp({SEED_DEMO:'false'});
 try{
  const post=async(route,data,cookie='')=>fetch(app.origin+'/api/'+route,{method:'POST',headers:{origin:app.origin,'content-type':'application/json',cookie},body:JSON.stringify(data)});
  const login=await post('login',{email:'qa@example.test',password:app.password});assert.equal(login.status,200);
  const challenge=await login.json(),verified=await post('mfa/verify',{code:totp(challenge.setupSecret)},login.headers.get('set-cookie').split(';')[0]);assert.equal(verified.status,200);
  const cookie=verified.headers.get('set-cookie').split(';')[0];
  for(const p of properties){const created=await post('properties',p,cookie);assert.equal(created.status,201,await created.text());}

  await t.test('base catalog has one H1, an H2 result section and H3 published cards',async()=>{
   const response=await fetch(app.origin+'/buscar'),html=await response.text();
   assert.equal(response.status,200);assert.equal(response.headers.get('x-robots-tag'),'index,follow');
   assert(html.includes('<h1>Imóveis disponíveis</h1>'));assert.equal((html.match(/<h1>/g)||[]).length,1);
   assert(html.includes('<h2 id="listing-results">Imóveis encontrados</h2>'));assert.equal((html.match(/<h3>/g)||[]).length,4);
   assert(html.includes('4 imóveis encontrados'));assert(html.includes('Catálogo demonstrativo.'));
   assert(html.includes('alt="Casa &lt;segura&gt; $&amp; — Goiânia, GO"'));
   assert(!html.includes('/imovel/rascunho'));assert(!html.includes('/imovel/vendido'));
   assert(html.includes(`<link rel="canonical" href="${app.origin}/buscar">`));
  });
  await t.test('combined query gets matching metadata and noindex with normalized canonical',async()=>{
   const response=await fetch(app.origin+'/buscar?purpose=Comprar&q=goiania&max=500000&type=Casa&minArea=120&region=Centro-Oeste&utm_source=ignored'),html=await response.text();
   assert.equal(response.headers.get('x-robots-tag'),'noindex,follow');assert(html.includes('<meta name="robots" content="noindex,follow">'));
   assert(html.includes('<title>Casas à venda em goiania | Confianza</title>'));assert(html.includes('1 imóvel encontrado'));
   assert(html.includes('/imovel/casa-publica'));for(const id of ['aluguel','usd','consulta','rascunho','vendido'])assert(!html.includes('/imovel/'+id));
   assert(html.includes(`href="${app.origin}/buscar?q=goiania&amp;type=Casa&amp;purpose=Comprar&amp;region=Centro-Oeste&amp;max=500000&amp;minArea=120"`));
  });
  await t.test('untrusted search is text and unknown locations do not create offers',async()=>{
   const q='<script>alert("x")</script> $&',response=await fetch(app.origin+'/buscar?q='+encodeURIComponent(q)),html=await response.text();
   assert.equal(response.status,200);assert.equal(response.headers.get('x-robots-tag'),'noindex,follow');
   assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; $&amp;'));
   assert.equal((html.match(/<title>/g)||[]).length,1);assert(html.includes('Nenhum imóvel encontrado.'));
   assert.equal((html.match(/<h3>/g)||[]).length,0);
  });
  await t.test('property detail remains canonical and unpublished properties remain unavailable',async()=>{
   const response=await fetch(app.origin+'/imovel/casa-publica'),html=await response.text();
   assert.equal(response.status,200);assert(html.includes('<title>Casa &lt;segura&gt; $&amp; | Confianza</title>'));
   assert(html.includes('alt="Casa &lt;segura&gt; $&amp; — Goiânia, GO"'));assert(html.includes('property="og:image"'));
   for(const id of ['rascunho','vendido','unknown'])assert.equal((await fetch(app.origin+'/imovel/'+id)).status,404);
   const sitemap=await (await fetch(app.origin+'/sitemap.xml')).text();assert(!sitemap.includes('/buscar?'));assert(!sitemap.includes('/imovel/rascunho'));assert(sitemap.includes('/imovel/casa-publica'));
  });
 }finally{await app.close();}
});
