import {test,expect,login} from './fixtures.mjs';
test('M16 @visual WhatsApp identity across states, five languages, fonts and viewports',async({page,app},info)=>{
 test.setTimeout(120000);await login(page,app);
 for(const width of [1440,390])for(const language of ['pt','es','en','it','de'])for(const scale of [1,1.2,1.4]){
  await page.setViewportSize({width,height:1000});expect((await page.request.put('/api/preferences',{headers:{Origin:app.origin},data:{language,accessibility:{scale,simplified:scale===1.4}}})).ok()).toBeTruthy();
  for(const [route,active] of [['/admin/imoveis',false],['/admin/conversas',true]]){
   await page.goto(route);const button=page.locator('[data-value="/admin/conversas"]'),icon=button.locator('svg');await expect(icon).toBeVisible();await expect(icon).toHaveAttribute('aria-hidden','true');expect(await button.getAttribute('aria-label')).toContain('WhatsApp');
   await expect(button).toHaveClass(active?'active':'');await expect(page.locator('#staff-font')).toHaveValue(String(scale));
   const metrics=await button.evaluate(button=>{const icon=button.querySelector('svg'),path=icon.querySelector('path'),b=button.getBoundingClientRect(),i=icon.getBoundingClientRect();return {fits:i.width>0&&i.left>=b.left&&i.right<=b.right&&i.top>=b.top&&i.bottom<=b.bottom,fill:getComputedStyle(path).fill,color:getComputedStyle(button).color,stroke:getComputedStyle(path).stroke};});expect(metrics.fits).toBeTruthy();expect(metrics.fill).toBe(metrics.color);expect(metrics.stroke).toBe('none');
   await expect(icon).toHaveScreenshot('whatsapp-'+width+'-'+language+'-'+scale+'-'+(active?'active':'inactive')+'.png');
  }
  if(language==='pt'&&scale===1.4)await info.attach('menu-'+width,{body:await page.locator('.admin-sidebar').screenshot(),contentType:'image/png'});
 }
});
