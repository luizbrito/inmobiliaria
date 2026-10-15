import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scryptSync} from 'node:crypto';
import {bootstrapAdmin} from './core/bootstrap-admin.mjs';
test('bootstrap creates or recovers admin once and requires fresh MFA enrollment',async()=>{
 for(const existing of [false,true]){
  const tables={users:{},settings:{},audit:{},sessions:{}};
  if(existing){tables.users.admin={id:'admin',email:'luizbritodarosa@gmail.com',role:'admin',active:true,passwordHash:'old',mfaSecret:'old-secret',mfaLastStep:3};tables.sessions.old={id:'old',userId:'admin'};}
  const store={get:async(t,id)=>tables[t][id],all:async t=>Object.values(tables[t]),atomicCompareSet:async changes=>{for(const c of changes)if(c.next===null)delete tables[c.table][c.id];else tables[c.table][c.id]=c.next;return true;}};
  const password='test-bootstrap-secret-2026';
  assert.equal(await bootstrapAdmin(store,{}),false);
  assert.equal(await bootstrapAdmin(store,{BOOTSTRAP_ADMIN_PASSWORD:password}),true);
  const user=Object.values(tables.users)[0];const [salt,hash]=user.passwordHash.split(':');
  assert.equal(hash,scryptSync(password,salt,64).toString('hex'));assert.equal(user.mfaSecret,undefined);assert.equal(user.mfaLastStep,undefined);assert.equal(Object.keys(tables.sessions).length,0);
  user.mfaSecret='enrolled';
  assert.equal(await bootstrapAdmin(store,{BOOTSTRAP_ADMIN_PASSWORD:'another-password-2026'}),false);assert.equal(user.mfaSecret,'enrolled');
  assert.ok(!JSON.stringify(tables).includes(password));
 }
});
