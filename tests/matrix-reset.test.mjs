import {test} from 'node:test';
import assert from 'node:assert/strict';
import {memoryStore} from './helpers/memory-store.mjs';
import {requestPasswordReset,confirmPasswordReset} from '../core/password-reset.mjs';
const user={id:'u',email:'qa@example.test',active:true,role:'admin',authVersion:0},base={PASSWORD_RESET_ENABLED:'true',PASSWORD_RESET_TEST_EMAILS:user.email,PUBLIC_ORIGIN:'https://example.test'};
test('M05 reset rejects unsafe origins and test recipients before any mail or token',async()=>{
 for(const origin of ['http://example.test','https://user:password@example.test','https://example.test/path','https://example.test/?query=1','https://example.test/#fragment','ftp://example.test']){
  const store=memoryStore();await store.set('users','u',user);let calls=0;await assert.rejects(()=>requestPasswordReset(store,user.email,{env:{...base,NODE_ENV:'production',PUBLIC_ORIGIN:origin},send:async()=>{calls++;}}),/RESET_ORIGIN/);assert.equal(calls,0);assert.equal((await store.all('settings')).length,0);
 }
 const store=memoryStore();await store.set('users','u',user);await requestPasswordReset(store,user.email,{env:{...base,PASSWORD_RESET_TEST_EMAILS:''},send:async()=>assert.fail('must not send')});assert.equal((await store.all('settings')).length,0);
});
test('M05 reset invalidates SMTP rejections and handles token write conflicts',async()=>{
 for(const result of [{accepted:[]},{accepted:['other@example.test']},{}]){
  const store=memoryStore();await store.set('users','u',user);const actions=[];await requestPasswordReset(store,user.email,{env:base,send:async()=>result,record:async action=>actions.push(action)});assert.equal((await store.get('settings','password-reset-u')).used,true);assert.deepEqual(actions,['password.reset.send_failed']);
 }
 const store=memoryStore();await store.set('users','u',user);store.atomicCompareSet=async()=>false;await requestPasswordReset(store,user.email,{env:base,send:async()=>assert.fail('must not send on CAS conflict')});
});
test('M05 a changed account or reset CAS conflict cannot authorize password replacement',async()=>{
 for(const change of [{active:false},{authVersion:1},null]){
  const store=memoryStore();await store.set('users','u',user);let mail;await requestPasswordReset(store,user.email,{env:{...base,PASSWORD_RESET_TEST_MODE:'false'},now:1000,send:async message=>{mail=message;return {accepted:['QA@EXAMPLE.TEST']};}});
  const token=new URL(mail.text.split('\n').at(-1)).hash.slice(7);if(change)await store.set('users','u',{...user,...change});else store.atomicCompareSet=async()=>false;
  await assert.rejects(()=>confirmPasswordReset(store,{token,password:'valid-fixture-password'},{now:2000,hashPassword:async()=> 'new-hash'}));assert.notEqual((await store.get('users','u')).passwordHash,'new-hash');
 }
});
