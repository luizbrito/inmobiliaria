import {test,expect,login} from './fixtures.mjs';
test('M01 @functional public catalogue navigation, favorites and private-data boundary',async({page,app})=>{
 const response=await page.request.get('/api/properties');expect(response.ok()).toBeTruthy();const properties=await response.json();expect(properties.length).toBeGreaterThan(1);expect(properties.every(p=>p.status==='Publicado'&&!p.internal)).toBeTruthy();
 await page.goto('/buscar');await expect(page.getByRole('article').first()).toBeVisible();
 const favorite=page.locator('[data-action=favorite]').first();await favorite.click();await page.goto('/favoritos');await expect(page.getByRole('article')).toHaveCount(1);await page.reload();await expect(page.getByRole('article')).toHaveCount(1);
 await page.goto('/imovel/'+properties[0].id);await expect(page.locator('h1')).toContainText(properties[0].title);
 const sitemap=await (await page.request.get('/sitemap.xml')).text();expect(sitemap).toContain('/imovel/'+properties[0].id);
 const missing=await page.request.get('/imovel/missing-fixture');expect([200,404]).toContain(missing.status());expect(await missing.text()).not.toContain('passwordHash');
 const p=properties[0],query=new URLSearchParams({q:p.title,type:p.type,purpose:p.purpose,minArea:String(p.area)});await page.goto('/buscar?'+query);await expect(page.getByRole('article')).toHaveCount(1);
 await page.goto('/buscar?q=NO_MATCH_FIXTURE');await expect(page.getByRole('article')).toHaveCount(0);
 const farms=properties.filter(p=>p.type==='Fazenda');if(farms.length>=2){await page.goto('/comparar?a='+farms[0].id+'&b='+farms[1].id);await expect(page.locator('main')).toContainText(farms[0].title);await expect(page.locator('main')).toContainText(farms[1].title);}
});
test('M02 @functional public content falls back safely in every language',async({page})=>{
 const properties=await (await page.request.get('/api/properties')).json(),p=properties[0];
 for(const language of ['pt','es','en','it','de']){
  await page.goto('/');await page.evaluate(language=>localStorage.setItem('confianza-language',language),language);await page.goto('/imovel/'+p.id);
  await expect(page.locator('[data-language]').first()).toHaveValue(language);await expect(page.locator('h1')).toHaveText(p.translations?.[language]?.title||p.title);
  const html=await page.content();expect(html).not.toContain('passwordHash');expect(html).not.toContain('mfaSecret');expect(html).not.toContain('[object Object]');
 }
});
test('M03 @functional presentation pagination preserves brand and safe public fields',async({page})=>{
 const [p]=await (await page.request.get('/api/properties')).json();await page.goto('/imovel/'+p.id);await page.locator('[data-action=presentation]').first().click();await expect(page.locator('#presentation-form')).toBeVisible();
 const preview=page.frameLocator('#presentation-preview');await expect(preview.locator('#print-button')).toBeEnabled();expect(await preview.locator('.document-page').count()).toBeGreaterThan(0);expect(await preview.locator('.document-page').count()).toEqual(await preview.locator('.document-page header').count());
 const html=await preview.locator('body').innerHTML();expect(html).not.toContain('passwordHash');expect(html).not.toContain('saleValue');
 await page.locator('#presentation-form [name=language]').selectOption('de');await expect(preview.locator('body')).toHaveAttribute('data-language','de');await expect(preview.locator('#print-button')).toBeEnabled();
});
test('M04 @functional server enforces roles and does not trust hidden menu items',async({page,app,request,browser})=>{
 expect((await request.get('/api/users')).status()).toBe(401);await login(page,app);
 const headers={Origin:app.origin},data={name:'Fixture agent',email:'agent@example.test',role:'agent',active:true,password:app.password,mfaRequired:false};
 expect((await page.request.post('/api/users',{headers,data})).ok()).toBeTruthy();
 const context=await browser.newContext();try{
  const response=await context.request.post(app.origin+'/api/login',{headers,data:{email:data.email,password:app.password}});expect((await response.json()).mfaRequired).toBe(false);
  for(const path of ['users','audit'])expect((await context.request.get(app.origin+'/api/'+path)).status()).toBe(403);
  expect((await context.request.post(app.origin+'/api/properties',{headers,data:{}})).status()).toBe(403);
  expect((await context.request.put(app.origin+'/api/settings',{headers,data:{}})).status()).toBe(403);
  expect((await context.request.get(app.origin+'/api/leads')).status()).toBe(200);
 }finally{await context.close();}
 expect((await page.request.post('/api/logout',{headers,data:{}})).ok()).toBeTruthy();expect((await page.request.get('/api/users')).status()).toBe(401);
});
test('M06 @functional draft creation and conflict keep the editor data and exit protection',async({page,app})=>{
 await login(page,app);await page.goto('/admin/imoveis/novo');await expect(page.locator('#property-form')).toBeVisible();await page.locator('#field-status').selectOption('Rascunho');
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/properties/'+new URL(r.url()).pathname.split('/').at(-1))&&r.request().method()==='POST');
 await page.locator('button[form=property-form]').click();expect((await saved).status()).toBe(201);await expect(page.locator('#admin-search')).toBeVisible();
 const [p]=await (await page.request.get('/api/properties')).json();await page.goto('/admin/imoveis/'+p.id+'/editar');await page.locator('#field-title').fill('Unsaved conflict fixture');
 await page.route('**/api/properties/'+p.id,route=>route.request().method()==='PUT'?route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'Imóvel alterado. Atualize a página antes de salvar novamente.'})}):route.continue());
 await page.locator('button[form=property-form]').click();await expect(page.locator('#property-form .form-error')).toContainText('alterado');await expect(page.locator('#field-title')).toHaveValue('Unsaved conflict fixture');
 page.once('dialog',dialog=>dialog.dismiss());await page.locator('[data-action=property-back]').first().click();await expect(page.locator('#field-title')).toHaveValue('Unsaved conflict fixture');
});
