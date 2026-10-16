import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDirtyGuard} from '../public/portal/property-page.js';
test('29.3 photo mutations protect exit while rendering and preview do not',()=>{
 globalThis.window=new EventTarget();let confirmations=0;globalThis.confirm=()=>{confirmations++;return false;};const form=new EventTarget(),guard=installDirtyGuard(form,{message:()=> 'Discard?'});
 try{form.dispatchEvent(new Event('photo-editor-update'));assert.equal(guard.dirty,false);form.dispatchEvent(new Event('photo-editor-change'));assert.equal(guard.dirty,true);assert.equal(guard.leave(),false);assert.equal(confirmations,1);const unload=new Event('beforeunload',{cancelable:true});window.dispatchEvent(unload);assert.equal(unload.defaultPrevented,true);guard.clean();assert.equal(guard.leave(),true);guard.dispose();form.dispatchEvent(new Event('input'));assert.equal(guard.dirty,false);}finally{guard.dispose();delete globalThis.window;delete globalThis.confirm;}
});
