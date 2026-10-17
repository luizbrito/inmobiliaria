// Portuguese source strings stay compatible with the portal's existing translation keys.
const messages = {
  'Encontre seu próximo endereço': ['Encuentra tu próxima dirección', 'Trova il tuo prossimo indirizzo', 'Find your next address', 'Finden Sie Ihre nächste Adresse'],
  'Até {price}': ['Hasta {price}', 'Fino a {price}', 'Up to {price}', 'Bis {price}'],
  'Ordenar imóveis': ['Ordenar inmuebles', 'Ordina immobili', 'Sort properties', 'Immobilien sortieren'],
  'Bairro ou cidade': ['Barrio o ciudad', 'Quartiere o città', 'Neighborhood or city', 'Stadtteil oder Stadt'],
  'Cidade, bairro ou região': ['Ciudad, barrio o región', 'Città, quartiere o regione', 'City, neighborhood or region', 'Stadt, Stadtteil oder Region'],
  'Buscas rápidas': ['Búsquedas rápidas', 'Ricerche rapide', 'Quick searches', 'Schnellsuche'],
  'Casas para morar': ['Casas para vivir', 'Case da abitare', 'Homes to live in', 'Häuser zum Wohnen'],
  'Apartamentos': ['Apartamentos', 'Appartamenti', 'Apartments', 'Wohnungen'],
  'Fazendas': ['Fincas', 'Tenute agricole', 'Farms', 'Landwirtschaftliche Anwesen'],
  'Até R$ 1 milhão': ['Hasta R$ 1 millón', 'Fino a R$ 1 milione', 'Up to R$ 1 million', 'Bis R$ 1 Million'],
  'Imóveis para alugar': ['Inmuebles en alquiler', 'Immobili in affitto', 'Properties to rent', 'Immobilien zur Miete'],
  'Agendar visita': ['Solicitar visita', 'Richiedi una visita', 'Request a viewing', 'Besichtigung anfragen'],
  'WhatsApp': ['WhatsApp', 'WhatsApp', 'WhatsApp', 'WhatsApp'],
  'Conversar pelo WhatsApp': ['Conversar por WhatsApp', 'Parla con noi su WhatsApp', 'Chat on WhatsApp', 'Über WhatsApp schreiben'],
  'Olá! Quero ajuda para encontrar um imóvel.': ['¡Hola! Quisiera ayuda para encontrar un inmueble.', 'Ciao! Vorrei aiuto per trovare un immobile.', 'Hello! I would like help finding a property.', 'Hallo! Ich suche Unterstützung bei der Immobiliensuche.'],
  'Olá! Gostaria de conhecer este imóvel:': ['¡Hola! Me gustaría conocer este inmueble:', 'Ciao! Vorrei visitare questo immobile:', 'Hello! I would like to view this property:', 'Hallo! Ich würde gerne diese Immobilie besichtigen:'],
  'Sua preferência de data será confirmada pela equipe.': ['El equipo confirmará la disponibilidad de la fecha solicitada.', 'Il team confermerà la disponibilità della data richiesta.', 'The team will confirm availability for your preferred date.', 'Das Team bestätigt die Verfügbarkeit Ihres Wunschtermins.'],
  'Escolha os filtros e encontre seu próximo endereço.': ['Elige los filtros y encuentra tu próxima dirección.', 'Scegli i filtri e trova il tuo prossimo indirizzo.', 'Choose your filters and find your next address.', 'Wählen Sie Ihre Filter und finden Sie Ihre nächste Adresse.'],
  'Preços em reais (BRL).': ['Precios en reales brasileños (BRL).', 'Prezzi in real brasiliani (BRL).', 'Prices in Brazilian reais (BRL).', 'Preise in brasilianischen Real (BRL).'],
  'Limpar filtros': ['Borrar filtros', 'Cancella filtri', 'Clear filters', 'Filter zurücksetzen'],
  'Ver detalhes': ['Ver detalles', 'Vedi dettagli', 'View details', 'Details ansehen'],
  'Faixa de preço': ['Rango de precio', 'Fascia di prezzo', 'Price range', 'Preisspanne'],
  'Qualquer valor': ['Cualquier precio', 'Qualsiasi prezzo', 'Any price', 'Beliebiger Preis'],
  'Até R$ 500 mil': ['Hasta R$ 500 mil', 'Fino a R$ 500 mila', 'Up to R$ 500,000', 'Bis R$ 500.000'],
  'Até R$ 2 milhões': ['Hasta R$ 2 millones', 'Fino a R$ 2 milioni', 'Up to R$ 2 million', 'Bis R$ 2 Millionen'],
  'Até R$ 5 milhões': ['Hasta R$ 5 millones', 'Fino a R$ 5 milioni', 'Up to R$ 5 million', 'Bis R$ 5 Millionen'],
  'A partir de R$ 5 milhões': ['Desde R$ 5 millones', 'Da R$ 5 milioni', 'From R$ 5 million', 'Ab R$ 5 Millionen'],
  'Ir para o conteúdo': ['Ir al contenido', 'Vai al contenuto', 'Skip to content', 'Zum Inhalt springen'],
  'Imóveis encontrados': ['Inmuebles encontrados', 'Immobili trovati', 'Properties found', 'Gefundene Immobilien'],
  'Sobre a Confianza': ['Sobre Confianza', 'Chi è Confianza', 'About Confianza', 'Über Confianza'],
  'Conheça a Confianza': ['Conoce Confianza', 'Scopri Confianza', 'Meet Confianza', 'Confianza kennenlernen'],
  'Falar sobre meus planos': ['Hablar de mis planes', 'Parliamo dei miei progetti', 'Discuss my plans', 'Über meine Pläne sprechen'],
  'Depoimentos de clientes': ['Testimonios de clientes', 'Testimonianze dei clienti', 'Client testimonials', 'Erfahrungen unserer Kunden'],
  'Parceiros': ['Socios', 'Partner', 'Partners', 'Partner'],
  'Relações construídas com confiança.': ['Relaciones construidas con confianza.', 'Rapporti costruiti sulla fiducia.', 'Relationships built on trust.', 'Beziehungen, die auf Vertrauen bauen.']
};

/** Translate a Portuguese key; interpolation uses {name} and must be escaped on output. */
export function conversionText(key, lang = 'pt', values = {}) {
  const index = ['es', 'it', 'en', 'de'].indexOf(lang);
  const value = index < 0 ? key : messages[key]?.[index] || key;
  return value.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
}

const about = {
  pt: {
    title: 'Um novo endereço começa com o que importa para você.',
    opening: 'A mesa onde a família se reúne. O caminho até o trabalho. O espaço para um novo projeto. Quando você procura um imóvel, procura também um lugar para a vida que quer construir.',
    purpose: 'Na Confianza, nosso propósito é aproximar pessoas de escolhas que façam sentido para o seu momento. Uma casa, um apartamento ou uma propriedade rural começa a ganhar significado quando entendemos quem vai viver, investir ou produzir ali.',
    clarityTitle: 'Confiança para dar o próximo passo.',
    clarity: 'Uma decisão importante merece tempo, perguntas e informação clara. Queremos ajudar você a olhar além das fotos: conhecer a localização, comparar características e entender o que ainda precisa ser esclarecido antes de seguir.',
    stepsTitle: 'Primeiro, vamos entender seus planos.',
    needsTitle: 'O que faz diferença no seu dia a dia',
    needs: 'Conte sobre sua rotina, a região que procura e o que não pode faltar. Suas prioridades dão direção à busca.',
    choicesTitle: 'Possibilidades para comparar com calma',
    choices: 'Explore o catálogo, salve seus favoritos e reúna as dúvidas de cada imóvel. Preço, localização e características ajudam a construir uma visão mais completa.',
    visitTitle: 'Uma visita para olhar de perto',
    visit: 'Solicite uma visita e converse com a equipe sobre os detalhes. O encontro é uma oportunidade de avaliar o espaço e conferir se ele faz sentido para você.',
    closingTitle: 'Seu próximo capítulo começa com uma conversa.',
    closing: 'Seus planos não precisam estar prontos. Conte o que você imagina, o que precisa e quais são suas dúvidas.',
    homeTitle: 'Um imóvel faz parte de uma história. A sua.',
    homeText: 'Mudar de endereço é pensar na família, na rotina e no futuro. Nosso propósito é ajudar você a transformar esses planos em uma busca com mais clareza, tempo para comparar e espaço para perguntar.'
  },
  es: {
    title: 'Una nueva dirección empieza por lo que te importa.',
    opening: 'La mesa donde se reúne la familia. El camino al trabajo. El espacio para un nuevo proyecto. Cuando buscas un inmueble, también buscas un lugar para la vida que quieres construir.',
    purpose: 'En Confianza, nuestro propósito es acercar a las personas a decisiones que tengan sentido para su momento. Una casa, un apartamento o una propiedad rural empieza a cobrar significado cuando entendemos quién va a vivir, invertir o producir allí.',
    clarityTitle: 'Confianza para dar el siguiente paso.',
    clarity: 'Una decisión importante merece tiempo, preguntas e información clara. Queremos ayudarte a mirar más allá de las fotos: conocer la ubicación, comparar características y entender qué falta por aclarar antes de seguir.',
    stepsTitle: 'Primero, entendamos tus planes.',
    needsTitle: 'Lo que marca la diferencia en tu día a día',
    needs: 'Cuéntanos sobre tu rutina, la zona que buscas y lo que no puede faltar. Tus prioridades orientan la búsqueda.',
    choicesTitle: 'Opciones para comparar con calma',
    choices: 'Explora el catálogo, guarda tus favoritos y reúne tus preguntas sobre cada inmueble. El precio, la ubicación y las características ayudan a tener una visión más completa.',
    visitTitle: 'Una visita para conocer de cerca',
    visit: 'Solicita una visita y conversa con el equipo sobre los detalles. El encuentro es una oportunidad para evaluar el espacio y comprobar si responde a tus necesidades.',
    closingTitle: 'Tu próximo capítulo empieza con una conversación.',
    closing: 'No necesitas tener todos tus planes definidos. Cuéntanos lo que imaginas, lo que necesitas y cuáles son tus dudas.',
    homeTitle: 'Un inmueble es parte de una historia. La tuya.',
    homeText: 'Cambiar de dirección es pensar en la familia, la rutina y el futuro. Nuestro propósito es ayudarte a transformar esos planes en una búsqueda con más claridad, tiempo para comparar y espacio para preguntar.'
  },
  it: {
    title: 'Un nuovo indirizzo parte da ciò che conta per te.',
    opening: 'Il tavolo dove si riunisce la famiglia. Il tragitto verso il lavoro. Lo spazio per un nuovo progetto. Quando cerchi un immobile, cerchi anche un luogo per la vita che vuoi costruire.',
    purpose: 'In Confianza, il nostro obiettivo è avvicinare le persone a scelte adatte alla fase della loro vita. Una casa, un appartamento o una proprietà rurale acquista significato quando capiamo chi vi abiterà, investirà o lavorerà.',
    clarityTitle: 'La fiducia per fare il prossimo passo.',
    clarity: 'Una decisione importante merita tempo, domande e informazioni chiare. Vogliamo aiutarti a guardare oltre le foto: conoscere la posizione, confrontare le caratteristiche e capire cosa va ancora chiarito prima di proseguire.',
    stepsTitle: 'Prima, capiamo i tuoi progetti.',
    needsTitle: 'Ciò che fa la differenza ogni giorno',
    needs: 'Raccontaci la tua routine, la zona che cerchi e ciò che non può mancare. Le tue priorità orientano la ricerca.',
    choicesTitle: 'Possibilità da confrontare con calma',
    choices: 'Esplora il catalogo, salva i preferiti e raccogli le domande su ogni immobile. Prezzo, posizione e caratteristiche aiutano a costruire un quadro più completo.',
    visitTitle: 'Una visita per guardare da vicino',
    visit: 'Richiedi una visita e parla dei dettagli con il team. L’incontro è un’occasione per valutare lo spazio e verificare se risponde alle tue esigenze.',
    closingTitle: 'Il tuo prossimo capitolo inizia con una conversazione.',
    closing: 'Non devi aver già definito tutto. Raccontaci cosa immagini, di cosa hai bisogno e quali sono i tuoi dubbi.',
    homeTitle: 'Un immobile fa parte di una storia. La tua.',
    homeText: 'Cambiare indirizzo significa pensare alla famiglia, alla routine e al futuro. Il nostro obiettivo è aiutarti a trasformare questi progetti in una ricerca più chiara, con il tempo per confrontare e lo spazio per fare domande.'
  },
  en: {
    title: 'A new address begins with what matters to you.',
    opening: 'The table where your family gathers. The journey to work. The space for a new project. When you look for a property, you are also looking for a place for the life you want to build.',
    purpose: 'At Confianza, our purpose is to connect people with choices that fit their stage of life. A house, an apartment or a rural property takes on meaning when we understand who will live, invest or work there.',
    clarityTitle: 'Confidence to take your next step.',
    clarity: 'An important decision deserves time, questions and clear information. We want to help you look beyond the photos: explore the location, compare features and understand what still needs to be clarified before moving forward.',
    stepsTitle: 'First, let us understand your plans.',
    needsTitle: 'What makes a difference in your daily life',
    needs: 'Tell us about your routine, the area you are looking for and your essentials. Your priorities guide the search.',
    choicesTitle: 'Options to compare at your own pace',
    choices: 'Explore the catalog, save your favorites and collect your questions about each property. Price, location and features help you build a fuller picture.',
    visitTitle: 'A viewing to take a closer look',
    visit: 'Request a viewing and talk through the details with the team. The meeting is a chance to assess the space and see whether it suits your needs.',
    closingTitle: 'Your next chapter starts with a conversation.',
    closing: 'You do not need to have everything worked out. Tell us what you imagine, what you need and what questions you have.',
    homeTitle: 'A property is part of a story. Yours.',
    homeText: 'A change of address means thinking about family, daily life and the future. Our purpose is to help you turn those plans into a clearer search, with time to compare and room to ask questions.'
  },
  de: {
    title: 'Eine neue Adresse beginnt mit dem, was Ihnen wichtig ist.',
    opening: 'Der Tisch, an dem die Familie zusammenkommt. Der Weg zur Arbeit. Der Raum für ein neues Projekt. Wenn Sie eine Immobilie suchen, suchen Sie auch einen Ort für das Leben, das Sie gestalten möchten.',
    purpose: 'Bei Confianza möchten wir Menschen mit Entscheidungen verbinden, die zu ihrer Lebensphase passen. Ein Haus, eine Wohnung oder ein ländliches Anwesen erhält Bedeutung, wenn wir verstehen, wer dort wohnen, investieren oder arbeiten möchte.',
    clarityTitle: 'Vertrauen für Ihren nächsten Schritt.',
    clarity: 'Eine wichtige Entscheidung verdient Zeit, Fragen und klare Informationen. Wir möchten Ihnen helfen, über die Fotos hinauszuschauen: die Lage kennenzulernen, Eigenschaften zu vergleichen und offene Fragen vor dem nächsten Schritt zu klären.',
    stepsTitle: 'Zuerst möchten wir Ihre Pläne verstehen.',
    needsTitle: 'Was in Ihrem Alltag einen Unterschied macht',
    needs: 'Erzählen Sie uns von Ihrem Alltag, Ihrer Wunschregion und dem, was nicht fehlen darf. Ihre Prioritäten geben der Suche eine Richtung.',
    choicesTitle: 'Möglichkeiten in Ruhe vergleichen',
    choices: 'Entdecken Sie den Katalog, speichern Sie Ihre Favoriten und sammeln Sie Fragen zu jeder Immobilie. Preis, Lage und Eigenschaften helfen Ihnen, sich ein vollständigeres Bild zu machen.',
    visitTitle: 'Eine Besichtigung für einen genaueren Blick',
    visit: 'Fragen Sie eine Besichtigung an und besprechen Sie die Details mit dem Team. Der Termin bietet Gelegenheit, die Räume einzuschätzen und zu prüfen, ob sie zu Ihren Bedürfnissen passen.',
    closingTitle: 'Ihr nächstes Kapitel beginnt mit einem Gespräch.',
    closing: 'Ihre Pläne müssen noch nicht bis ins Detail feststehen. Erzählen Sie uns von Ihren Vorstellungen, Ihren Bedürfnissen und Ihren Fragen.',
    homeTitle: 'Eine Immobilie ist Teil einer Geschichte. Ihrer.',
    homeText: 'Ein Umzug bedeutet, an die Familie, den Alltag und die Zukunft zu denken. Wir möchten Ihnen helfen, daraus eine Suche mit mehr Klarheit zu machen: mit Zeit zum Vergleichen und Raum für Fragen.'
  }
};

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Internal /sobre content: the caller owns <main>, site header and footer. */
export function aboutContent({lang = 'pt', esc = escapeHTML, icon = () => ''} = {}) {
  const content = about[lang] || about.pt;
  return `<div class="about-story" data-no-translate>
    <div class="about-intro"><h1>${esc(content.title)}</h1><p class="about-lead">${esc(content.opening)}</p><p>${esc(content.purpose)}</p></div>
    <section class="about-clarity"><h2>${esc(content.clarityTitle)}</h2><p>${esc(content.clarity)}</p></section>
    <section class="about-steps"><h2>${esc(content.stepsTitle)}</h2><div class="about-step-list">${[['needsTitle','needs'],['choicesTitle','choices'],['visitTitle','visit']].map(([heading, text]) => `<div><h3>${esc(content[heading])}</h3><p>${esc(content[text])}</p></div>`).join('')}</div></section>
    <section class="about-next"><h2>${esc(content.closingTitle)}</h2><p>${esc(content.closing)}</p><button type="button" class="btn primary" data-action="contact">${esc(conversionText('Falar sobre meus planos', lang))}${icon('arrow')}</button></section>
  </div>`;
}

export function homeAbout({lang = 'pt', esc = escapeHTML} = {}) {
  const content = about[lang] || about.pt;
  return `<section class="home-about" data-no-translate><h2>${esc(content.homeTitle)}</h2><div><p>${esc(content.homeText)}</p><a class="text-link" href="/sobre">${esc(conversionText('Conheça a Confianza', lang))}<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></a></div></section>`;
}

/**
 * Publish only real, authorized testimonials. Keep the original quote unchanged.
 * Schema: {quote: string, name: string, context?: string, published: boolean,
 * consent: boolean, translations?: {[lang]: {quote?: string, context?: string}}}.
 * consent records authorization to display the quote and attribution publicly.
 * No sample quotes, customer identities or implied ratings are shipped.
 */
export const trustedTestimonials = [];

/**
 * Publish a partner only after verifying the relationship and logo permission.
 * Schema: {name: string, logo: '/path/to/approved-logo.svg' | 'https://…',
 * href?: string, published: boolean, permission: boolean}.
 * The name is the image alternative text. No logos or partner claims are invented.
 */
export const trustedPartners = [];

const safeURL = value => typeof value === 'string' && (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)) && !/[\s<>"\\]/.test(value) ? value : '';

/** No placeholder social proof: the entire section stays absent until approved data exists. */
export function trustContent({lang = 'pt', esc = escapeHTML, settings = {}} = {}) {
  if (settings.demo) return '';
  const testimonials = trustedTestimonials.filter(item => item.published === true && item.consent === true && item.quote?.trim() && item.name?.trim());
  const partners = trustedPartners.filter(item => item.published === true && item.permission === true && item.name?.trim() && safeURL(item.logo));
  if (!testimonials.length && !partners.length) return '';
  const testimonialHTML = testimonials.length ? `<section class="testimonials" aria-labelledby="testimonials-title"><h2 id="testimonials-title">${esc(conversionText('Depoimentos de clientes', lang))}</h2><div class="testimonial-list">${testimonials.map(item => {const translated = item.translations?.[lang] || {}; return `<figure class="testimonial"><blockquote><p>${esc(translated.quote || item.quote)}</p></blockquote><figcaption><strong>${esc(item.name)}</strong>${translated.context || item.context ? `<span>${esc(translated.context || item.context)}</span>` : ''}</figcaption></figure>`;}).join('')}</div></section>` : '';
  const partnerHTML = partners.length ? `<section class="partners" aria-labelledby="partners-title"><h2 id="partners-title">${esc(conversionText('Parceiros', lang))}</h2><div class="partner-list">${partners.map(item => {const logo = `<img src="${esc(safeURL(item.logo))}" alt="${esc(item.name)}" loading="lazy" width="160" height="72">`; const href = safeURL(item.href); return href ? `<a href="${esc(href)}">${logo}</a>` : `<div>${logo}</div>`;}).join('')}</div></section>` : '';
  return `<div class="trust-content" data-no-translate>${testimonialHTML}${partnerHTML}</div>`;
}
