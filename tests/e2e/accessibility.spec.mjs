import AxeBuilder from '@axe-core/playwright';
import {test,expect,login} from './fixtures.mjs';
for(const route of ['/','/buscar','/admin','/admin/imoveis','/admin/imoveis/novo','/admin/contatos','/admin/visitas','/admin/pendencias','/admin/relatorios','/admin/notificacoes','/admin/organizar','/admin/desempenho','/admin/conversas','/admin/backups','/admin/equipe','/admin/configuracoes']){
 test('M16 @a11y WCAG critical flow '+route,async({page,app},info)=>{
  if(route.startsWith('/admin/'))await login(page,app);await page.goto(route);await expect(page.locator('#app')).not.toContainText('Preparando novos');
  if(route==='/admin/imoveis/novo')await expect(page.locator('#property-form')).toBeVisible();
  if(route==='/admin/conversas')await expect(page.locator('#qr-status')).not.toContainText('Carregando');
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  await info.attach('accessibility-results',{body:JSON.stringify(result.violations,null,2),contentType:'application/json'});
  expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
 });
}
