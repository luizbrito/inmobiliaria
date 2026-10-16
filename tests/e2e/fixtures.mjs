import {test as base,expect} from '@playwright/test';
import {startApp,localOnly} from '../helpers/fixtures.mjs';
import {totp} from '../../core/security.mjs';
export const test=base.extend({
 app:async({},use)=>{const app=await startApp();try{await use(app);}finally{await app.close();}},
 baseURL:async({app},use)=>use(app.origin),
 page:async({page,app},use)=>{await localOnly(page,app.origin);const errors=[];page.on('pageerror',error=>errors.push(error.message));await use(page);expect(errors).toEqual([]);},
});
export {expect};
export async function login(page,app){
 const response=await page.request.post(app.origin+'/api/login',{headers:{Origin:app.origin},data:{email:'qa@example.test',password:app.password}});expect(response.status()).toBe(200);const challenge=await response.json();
 if(challenge.mfaRequired){const verified=await page.request.post(app.origin+'/api/mfa/verify',{headers:{Origin:app.origin},data:{code:totp(challenge.setupSecret)}});expect(verified.status()).toBe(200);}
}
