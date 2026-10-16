import {browserOptions} from './helpers/fixtures.mjs';
import {test,before,after,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from '@playwright/test';
let server,browser,page,origin;
before(async()=>{
 server=createServer(async(req,res)=>{
  if(req.url.startsWith('/public/portal/')&&/^\/public\/portal\/[\w-]+\.js(?:\?.*)?$/.test(req.url)){
   try{res.setHeader('Content-Type','text/javascript');res.end(await readFile(new URL('..'+req.url.split('?')[0],import.meta.url)));}catch{res.writeHead(404).end();}
  }else res.end('<!doctype html><html lang="pt"><title>Isolated QR test</title><div id="root"></div></html>');
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch(browserOptions());
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
beforeEach(async()=>{
 page=await browser.newPage();await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());await page.goto(origin);
 await page.evaluate(async()=>{
  const {createWhatsAppQRUI}=await import('/public/portal/whatsapp-qr-ui.js');
  const state={session:{id:'u1',role:'agent'},lang:'pt',leads:[],staff:[]},threads=['a','b'].map(id=>({id,phone:id,consent:true,revision:1,readBy:{},sequence:0}));
  const calls=[],pending=new Map();let denied=false;
  const api=async(path,method,body)=>{
   if(denied)throw Error('qr_access_denied');
   if(pending.has(path))return new Promise((resolve,reject)=>pending.set(path,{resolve,reject}));
   if(path.endsWith('/status'))return {state:'connected',available:true,sendEnabled:true};
   if(path.endsWith('/threads'))return threads;
   if(path.includes('/messages/'))return {thread:threads.find(t=>t.id===path.split('/').at(-1).split('?')[0]),messages:[]};
   if(path.endsWith('/send')){calls.push(body);return {state:'submitted'};}
   return {ok:true};
  };
  const ui=createWhatsAppQRUI({state:()=>state,api,esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),tr:s=>s});
  document.querySelector('#root').innerHTML=ui.page();await ui.mount();
  window.h={ui,state,threads,calls,pending,deny(){denied=true;}};
 });
});
afterEach(async()=>{await page?.close();});
const select=id=>page.evaluate(id=>h.ui.action('qr-select',id),id);
test('29.1 drafts and outgoing payload belong only to their recipient',async()=>{
 await select('a');await page.locator('#qr-message-text').fill('Private draft A');await select('b');
 assert.equal(await page.locator('#qr-message-text').inputValue(),'');
 await page.locator('#qr-message-text').fill('Private draft B');await select('a');assert.equal(await page.locator('#qr-message-text').inputValue(),'Private draft A');
 await page.evaluate(()=>h.ui.submit(document.querySelector('#qr-send-form')));
 assert.deepEqual(await page.evaluate(()=>h.calls.map(({threadId,text})=>({threadId,text}))),[{threadId:'a',text:'Private draft A'}]);
 await select('b');assert.equal(await page.locator('#qr-message-text').inputValue(),'Private draft B');
});
test('29.1 late send result cannot clear the next conversation draft',async()=>{
 await select('a');await page.locator('#qr-message-text').fill('A pending');
 await page.evaluate(()=>{h.pending.set('whatsapp-qr/send',true);h.sending=h.ui.submit(document.querySelector('#qr-send-form'));});
 await select('b');await page.locator('#qr-message-text').fill('B stays');
 await page.evaluate(async()=>{h.pending.get('whatsapp-qr/send').resolve({state:'uncertain'});await h.sending;});
 assert.equal(await page.locator('#qr-message-text').inputValue(),'B stays');assert.equal(await page.locator('#qr-error').textContent(),'');
});
test('29.1 access revocation and account changes discard protected drafts',async()=>{
 await select('a');await page.locator('#qr-message-text').fill('Secret');
 await page.evaluate(async()=>{h.state.session={id:'u2',role:'agent'};await h.ui.mount();});
 await select('a');assert.equal(await page.locator('#qr-message-text').inputValue(),'');
 await page.locator('#qr-message-text').fill('Second secret');
 await page.evaluate(async()=>{h.deny();await h.ui.mount();});assert.equal(await page.locator('#qr-send-form').count(),0);
});
test('29.1 out-of-order conversation responses never replace selected recipient',async()=>{
 await page.evaluate(()=>{h.pending.set('whatsapp-qr/messages/a',true);h.selectA=h.ui.action('qr-select','a');});
 await select('b');await page.locator('#qr-message-text').fill('B only');
 await page.evaluate(async()=>{h.pending.get('whatsapp-qr/messages/a').resolve({thread:h.threads[0],messages:[]});await h.selectA;});
 assert.equal(await page.locator('#qr-thread-form').getAttribute('data-thread'),'b');assert.equal(await page.locator('#qr-message-text').inputValue(),'B only');
});
test('29.1 same-thread refresh preserves text and concurrent submit does not duplicate a send',async()=>{
 await select('a');await page.locator('#qr-message-text').fill('Keep while refreshing');await select('a');assert.equal(await page.locator('#qr-message-text').inputValue(),'Keep while refreshing');
 await page.evaluate(()=>{h.pending.set('whatsapp-qr/send',true);h.first=h.ui.submit(document.querySelector('#qr-send-form'));});
 await page.evaluate(()=>h.ui.submit(document.querySelector('#qr-send-form')));
 await page.locator('#qr-message-text').fill('New draft while sending');
 await page.evaluate(async()=>{h.pending.get('whatsapp-qr/send').resolve({state:'submitted'});await h.first;});
 assert.equal(await page.locator('#qr-message-text').inputValue(),'New draft while sending');
});
test('29.1 failed HTTP response retains the original idempotency key on explicit retry',async()=>{
 await select('a');await page.locator('#qr-message-text').fill('Retry same attempt');
 await page.evaluate(()=>{h.pending.set('whatsapp-qr/send',true);h.first=h.ui.submit(document.querySelector('#qr-send-form')).catch(()=>{});});
 await page.evaluate(async()=>{h.pending.get('whatsapp-qr/send').reject(Error('Network failure'));await h.first;h.pending.delete('whatsapp-qr/send');});
 assert.equal(await page.locator('#qr-message-text').inputValue(),'Retry same attempt');
 await page.evaluate(()=>h.ui.submit(document.querySelector('#qr-send-form')));assert.equal(await page.evaluate(()=>h.calls.length),1);
});
test('29.3 a real drag-only photo reorder protects exit; preview and initial render remain clean',async()=>{
 await page.evaluate(async()=>{
  h.ui.dispose();const {mountPhotoEditor}=await import('/public/portal/photo-editor.js'),{installDirtyGuard}=await import('/public/portal/property-page.js');
  document.querySelector('#root').innerHTML='<form id="photos-form"><div id="photos"></div></form>';
  h.guard=installDirtyGuard(document.querySelector('form'),{message:()=> 'Discard?'});
  h.photos=mountPhotoEditor(document.querySelector('#photos'),{image:'cover.jpg',gallery:['a.jpg','b.jpg']},{esc:String,img:s=>s});
 });
 assert.equal(await page.evaluate(()=>h.guard.dirty),false);
 await page.locator('[data-photo=preview]').first().click();assert.equal(await page.evaluate(()=>h.guard.dirty),false);
 await page.locator('[data-photo=close-preview]').click();
 await page.evaluate(()=>{
  const items=document.querySelectorAll('[data-photo-id]'),transfer=new DataTransfer();items[2].dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:transfer}));items[1].dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer,cancelable:true}));
 });
 assert.deepEqual(await page.evaluate(()=>h.photos.value().gallery),['b.jpg','a.jpg']);assert.equal(await page.evaluate(()=>h.guard.dirty),true);
 page.once('dialog',dialog=>dialog.dismiss());assert.equal(await page.evaluate(()=>h.guard.leave()),false);
 assert.deepEqual(await page.evaluate(()=>h.photos.value().gallery),['b.jpg','a.jpg']);
 await page.evaluate(()=>h.guard.clean());assert.equal(await page.evaluate(()=>h.guard.dirty),false);
 await page.evaluate(()=>{h.guard.dispose();h.photos.dispose();});
});
