import {test,expect,login} from './fixtures.mjs';

test('@functional delayed loading feedback and compact accessibility controls',async({page,app})=>{
 await page.route('**/api/session',async route=>{await new Promise(resolve=>setTimeout(resolve,1500));await route.continue();});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('#app .loading')).toBeVisible();
 await expect(page.locator('main#main-content')).toBeVisible();
 await expect(page.locator('#app .loading')).toHaveCount(0);
 await page.unroute('**/api/session');

 const listing=await page.request.get('/buscar');
 expect(listing.ok()).toBeTruthy();
 const html=await listing.text();
 expect(html).toContain('id="listing-results"');
 expect(html).not.toContain('APP_CONTENT');
 expect(html).not.toContain('Preparando novos horizontes');

 await login(page,app);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  await page.goto('/admin/imoveis');
  const controls=page.locator('.admin-header-actions');
  const menu=controls.locator('.staff-accessibility');
  await expect(controls.locator('[data-language]')).toBeVisible();
  await expect(menu.locator('summary')).toBeVisible();
  await expect(menu).not.toHaveAttribute('open');
  await expect(menu.locator('#staff-font')).not.toBeVisible();
  await menu.locator('summary').click();
  await expect(menu.locator('#staff-font')).toBeVisible();
  await menu.locator('#staff-font').selectOption('1.2');
  await expect(menu.locator('#staff-preference-status')).toContainText('salvas');
  await expect(page.locator('html')).toHaveAttribute('style',/--staff-scale: 1.2/);
  const bounds=await menu.locator('.staff-accessibility-panel').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);
  await page.screenshot({path:`reports/ui-refinement-${width}.png`});
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await expect(menu.locator('summary')).toBeFocused();
 }
});
