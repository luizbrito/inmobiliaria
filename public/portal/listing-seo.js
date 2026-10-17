// Shared by the browser and the Node renderer: one search has one set of results.
const text=(value,max=150)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):'';
const comparable=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
const positive=value=>value!==''&&value!==null&&Number.isFinite(Number(value))&&Number(value)>0?Number(value):'';

export function normalizeListingFilters(input={}){
 const get=key=>typeof input?.get==='function'?input.get(key):input?.[key];
 return {q:text(get('q')),type:text(get('type'),80),purpose:text(get('purpose'),80),region:text(get('region'),80),max:positive(get('max')),minArea:positive(get('minArea'))};
}

export function filterListing(properties,filters={}, {lang='pt'}={}){
 const f=normalizeListingFilters(filters),q=comparable(f.q);
 return properties.filter(p=>p.status==='Publicado'&&(!q||comparable((p.translations?.[lang]?.title||p.title)+' '+p.location).includes(q))&&(!f.type||p.type===f.type)&&(!f.purpose||p.purpose===f.purpose)&&(!f.region||p.region===f.region)&&(!f.max||(!p.priceOnRequest&&p.currency==='BRL'&&Number(p.price)>0&&Number(p.price)<=f.max))&&(!f.minArea||Number(p.area)>=f.minArea));
}

const labels={
 pt:{all:'Imóveis',types:{Casa:'Casas',Apartamento:'Apartamentos',Fazenda:'Fazendas',Terreno:'Terrenos'},available:'disponíveis',sale:'à venda',rent:'para alugar',launch:'em lançamento',launches:'Lançamentos imobiliários',in:'em',region:{Sul:'no Sul','Centro-Oeste':'no Centro-Oeste',Sudeste:'no Sudeste',Nordeste:'no Nordeste',Norte:'no Norte',Paraguai:'no Paraguai'},description:'Confira localização, características e valores informados. Converse com a equipe para planejar uma visita.'},
 es:{all:'Inmuebles',types:{Casa:'Casas',Apartamento:'Apartamentos',Fazenda:'Fincas',Terreno:'Terrenos'},available:'disponibles',sale:'en venta',rent:'en alquiler',launch:'en lanzamiento',launches:'Nuevos desarrollos inmobiliarios',in:'en',description:'Consulta la ubicación, las características y los precios informados. Habla con el equipo para planificar una visita.'},
 en:{all:'Properties',types:{Casa:'Houses',Apartamento:'Apartments',Fazenda:'Farms',Terreno:'Land'},available:'available',sale:'for sale',rent:'for rent',launch:'in new developments',launches:'New property developments',in:'in',description:'Explore listed locations, features and prices. Contact the team to plan a viewing.'},
 it:{all:'Immobili',types:{Casa:'Case',Apartamento:'Appartamenti',Fazenda:'Aziende agricole',Terreno:'Terreni'},available:'disponibili',sale:'in vendita',rent:'in affitto',launch:'in nuovi progetti',launches:'Nuovi progetti immobiliari',in:'a',description:'Consulta ubicazione, caratteristiche e prezzi indicati. Contatta il team per organizzare una visita.'},
 de:{all:'Immobilien',types:{Casa:'Häuser',Apartamento:'Wohnungen',Fazenda:'Landwirtschaftliche Anwesen',Terreno:'Grundstücke'},available:'verfügbar',sale:'zum Kauf',rent:'zur Miete',launch:'in Neubauprojekten',launches:'Neubauprojekte',in:'in',description:'Entdecken Sie die angegebenen Standorte, Merkmale und Preise. Kontaktieren Sie das Team für eine Besichtigung.'}
};

export function listingHeading(filters={},lang='pt'){
 const f=normalizeListingFilters(filters),l=labels[lang]||labels.pt,subject=l.types[f.type]||l.all;
 const intent=f.purpose==='Comprar'?l.sale:f.purpose==='Alugar'?l.rent:f.purpose==='Lançamentos'?l.launch:l.available;
 const heading=f.purpose==='Lançamentos'&&!l.types[f.type]?l.launches:subject+' '+intent;
 const place=f.q?l.in+' '+f.q:f.region?(l.region?.[f.region]||l.in+' '+f.region):'';
 return heading+(place?' '+place:'');
}

export function listingMetadata(filters={},lang='pt',brand='Confianza'){
 const heading=listingHeading(filters,lang),l=labels[lang]||labels.pt;
 return {heading,title:heading+' | '+text(brand,100),description:heading+'. '+l.description};
}
