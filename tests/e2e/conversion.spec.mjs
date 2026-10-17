import {test,expect,login} from './fixtures.mjs';
import AxeBuilder from '@axe-core/playwright';
import {mkdir} from 'node:fs/promises';

test('catalog escapes legacy property badge and unit text before rendering HTML',async({page})=>{
  let propertyId;
  await page.route('**/api/properties',async route=>{
    const response=await route.fetch(),properties=await response.json();
    propertyId=properties[0].id;
    properties[0].tag='<span id="injected-tag">Destaque</span>';
    properties[0].unit='<span id="injected-unit">ha</span>';
    await route.fulfill({response,json:properties});
  });
  await page.goto('/');
  await expect(page.locator('#injected-tag')).toHaveCount(0);
  await page.goto('/imovel/'+propertyId);
  await expect(page.locator('#injected-tag, #injected-unit')).toHaveCount(0);
  await expect(page.locator('.gallery-main .badge')).toContainText('Destaque');
});

test('conversion: search keeps location, purpose, region and budget in shareable URLs',async({page})=>{
  await page.goto('/');
  await page.locator('#q').fill('Curitiba');
  await page.locator('#type').selectOption('Casa');
  await page.locator('#max').selectOption('5000000');
  await page.locator('#search-form button[type=submit]').click();
  await expect(page).toHaveURL(/q=Curitiba/);
  await expect(page.locator('h1')).toHaveText('Casas à venda em Curitiba');
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.locator('#q')).toHaveValue('Curitiba');
  await expect(page.locator('#max')).toHaveValue('5000000');
  await expect(page).toHaveTitle(/Casas à venda em Curitiba/);
  await page.reload();await expect(page.getByRole('article')).toHaveCount(1);
  await page.goto('/buscar?region=Paraguai');
  await page.locator('#search-form button[type=submit]').click();
  await expect(page).toHaveURL(/region=Paraguai/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.locator('.card .price')).toContainText('US$');
  await page.locator('#max').selectOption('1000000');
  await page.locator('#search-form button[type=submit]').click();
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.locator('.empty a').click();await expect(page.getByRole('article')).toHaveCount(6);
  await page.goto('/');
  await page.getByRole('link',{name:'Imóveis para alugar',exact:true}).click();
  await expect(page).toHaveURL(/purpose=Alugar/);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.locator('.quick-searches [aria-current=true]')).toHaveText('Imóveis para alugar');
  await page.locator('[data-action=purpose][data-value=Todos]').click();
  await expect(page.getByRole('article')).toHaveCount(6);
});

test('conversion: card visit request survives failure and stores the selected property after success',async({page,app})=>{
  const events=[];await page.exposeFunction('conversionEvent',event=>events.push(event));
  await page.addInitScript(()=>window.addEventListener('confianza:conversion',event=>window.conversionEvent(event.detail)));
  await page.goto('/buscar');
  const card=page.getByRole('article').first(),id=await card.locator('[data-kind=Visita]').getAttribute('data-id');
  await card.locator('[data-kind=Visita]').click();
  await expect(page.locator('#lead-form')).toHaveAttribute('data-id',id);
  await expect(page.locator('dialog')).toContainText('Sua preferência de data será confirmada pela equipe.');
  await expect(page.locator('dialog .whatsapp-float')).toHaveCount(0);
  await page.locator('#field-name').fill('Cliente de verificação');
  await page.locator('#field-email').fill('cliente@example.test');
  await page.locator('#field-phone').fill('+595 981 000000');
  await page.locator('#field-visit').fill('2099-12-20');
  await page.locator('#lead-form [name=consent]').check();
  await page.route('**/api/leads',route=>route.request().method()==='POST'?route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Falha temporária de verificação'})}):route.continue());
  await page.locator('#lead-form button:not([type])').click();
  await expect(page.locator('#lead-form .form-error')).toContainText('Falha temporária');
  await expect(page.locator('#field-name')).toHaveValue('Cliente de verificação');
  await expect(page.locator('#lead-form button:not([type])')).toBeEnabled();
  await page.unroute('**/api/leads');
  await page.locator('#lead-form button:not([type])').click();
  await expect(page.locator('dialog')).not.toBeVisible();
  await expect(page.locator('#toast')).toContainText('Solicitação enviada');
  await login(page,app);
  const leads=await (await page.request.get('/api/leads')).json(),lead=leads.find(l=>l.email==='cliente@example.test');
  expect(lead.propertyId).toBe(id);expect(lead.kind).toBe('Visita');expect(lead.message).toContain('2099-12-20');
  expect(events.map(e=>e.name)).toEqual(['visit_request_open','visit_request_sent']);
  expect(Object.keys(events[0]).sort()).toEqual(['name','propertyId']);
});

test('conversion: WhatsApp is contextual, configurable and localized on public pages',async({page})=>{
  const properties=await (await page.request.get('/api/properties')).json(),p=properties[0];
  for(const route of ['/','/buscar','/favoritos','/comparar','/sobre','/privacidade','/imovel/'+p.id]){
    await page.goto(route);const link=page.locator('.whatsapp-float');await expect(link).toBeVisible();
    const url=new URL(await link.getAttribute('href'));expect(url.hostname).toBe('wa.me');expect(url.pathname).toBe('/595981361122');
    if(route.startsWith('/imovel/')){expect(url.searchParams.get('text')).toContain(p.title);expect(url.searchParams.get('text')).toContain('/imovel/'+p.id);await expect(page).toHaveTitle(p.title+' | Confianza');}
  }
  for(const [lang,label]of Object.entries({pt:'Bairro ou cidade',es:'Barrio o ciudad',it:'Quartiere o città',en:'Neighborhood or city',de:'Stadtteil oder Stadt'})){
    await page.goto('/');await page.locator('[data-language]').selectOption(lang);await expect(page.locator('label[for=q]')).toHaveText(label);
    await expect(page.locator('.search-intro')).not.toContainText('?ximo');
    await page.goto('/sobre');await expect(page.locator('.about-story h1')).toBeVisible();
  }
  await page.goto('/admin');await expect(page.locator('.whatsapp-float')).toHaveCount(0);
  await page.route('**/api/settings',async route=>{const response=await route.fetch();await route.fulfill({response,json:{...await response.json(),whatsapp:''}});});
  await page.goto('/');await expect(page.locator('.search-box')).toBeVisible();await expect(page.locator('.whatsapp-float')).toHaveCount(0);
});

test('conversion: keyboard skip link preserves password recovery tokens',async({page})=>{
  await page.goto('/admin/recuperar#token=isolated-reset-token');
  await expect(page.locator('#main-content')).toBeVisible();
  await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused();
  await expect(page).toHaveURL(/#token=isolated-reset-token$/);
});

test('conversion: desktop and mobile layouts, keyboard focus and accessible public flows',async({page})=>{
  await mkdir('reports/cro',{recursive:true});
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const [name,route]of [['home','/'],['listing','/buscar?q=Curitiba'],['about','/sobre']]){
      await page.goto(route);await expect(page.locator('.whatsapp-float')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const audit=await new AxeBuilder({page}).include('main').include('.whatsapp-float').analyze();
      expect(audit.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
      await page.screenshot({path:`reports/cro/${name}-${viewport.width}.png`,fullPage:true});
    }
    await page.goto('/');await expect(page.locator('.search-box')).toBeVisible();await page.keyboard.press('Tab');await expect(page.locator('.skip-link').first()).toBeFocused();
    await page.keyboard.press('Enter');await expect(page.locator('main')).toBeFocused();
    await page.locator('#q').focus();expect(await page.locator('#q').evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
    await page.goto('/buscar');await page.locator('[data-kind=Visita]').first().click();
    const audit=await new AxeBuilder({page}).include('dialog').analyze();expect(audit.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id)).toEqual([]);
    await page.keyboard.press('Escape');await expect(page.locator('dialog')).not.toBeVisible();
  }
});
