export const quickSearches = [
  {label:'Casas para morar', query:{type:'Casa',purpose:'Comprar'}},
  {label:'Apartamentos', query:{type:'Apartamento',purpose:'Comprar'}},
  {label:'Fazendas', query:{type:'Fazenda'}},
  {label:'Até R$ 5 milhões', query:{max:'5000000',purpose:'Comprar'}},
  {label:'Imóveis para alugar', query:{purpose:'Alugar'}}
];

export function searchParams(filters, purpose) {
  const query = new URLSearchParams();
  for (const key of ['q','type','max','minArea','region']) {
    const value = String(filters[key] ?? '').trim();
    if (value) query.set(key, value);
  }
  if (purpose === 'Fazendas') query.set('type', 'Fazenda');
  else if (purpose && purpose !== 'Todos') query.set('purpose', purpose);
  return query;
}

export function whatsAppURL(number, message) {
  const digits = String(number ?? '').replace(/\D/g, '');
  if (!/^[1-9]\d{9,14}$/.test(digits)) return '';
  return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message);
}

// The catalogue has no per-photo captions yet. Use only known property data;
// do not infer a room, view or amenity from the property's marketing title.
export function propertyPhotoAlt(property, lang='pt', index=0, total=1) {
  const names = {pt:'Foto',es:'Foto',en:'Photo',it:'Foto',de:'Foto'};
  const title = property.translations?.[lang]?.title || property.title || property.type || '';
  const context = [...new Set([title, property.location].filter(Boolean))].join(' — ');
  return `${names[lang] || names.pt} ${index + 1}/${total}: ${context}`;
}
