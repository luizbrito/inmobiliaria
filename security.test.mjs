import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {base32,totp,verifyTotp,secretBox,requiresMFA} from './core/security.mjs';
import {validateProperty,initialProperties} from './core/service.mjs';
test('TOTP matches RFC 6238 SHA1 vectors truncated to six digits',()=>{const secret=base32(Buffer.from('12345678901234567890'));for(const [seconds,expected] of [[59,'287082'],[1111111109,'081804'],[1111111111,'050471'],[1234567890,'005924'],[2000000000,'279037'],[20000000000,'353130']])assert.equal(totp(secret,Math.floor(seconds/30)),expected);});
test('TOTP enforces format, drift window and replay counter',()=>{const secret=base32(randomBytes(20)),now=Math.floor(Date.now()/30000);assert.equal(verifyTotp(secret,totp(secret,now)),now);assert.equal(verifyTotp(secret,totp(secret,now),now),null);assert.equal(verifyTotp(secret,'invalid'),null);assert.equal(verifyTotp(secret,totp(secret,now-10)),null);});
test('encrypted secret rejects tampering, wrong keys and invalid configuration',()=>{assert.throws(()=>secretBox('example'));const box=secretBox(randomBytes(32).toString('hex')),sealed=box.seal('secret');assert.equal(box.open(sealed),'secret');assert.throws(()=>secretBox(randomBytes(32).toString('hex')).open(sealed));const bytes=Buffer.from(sealed,'base64');bytes[15]^=1;assert.throws(()=>box.open(bytes.toString('base64')));});

test('legacy MFA defaults and explicit user overrides',()=>{assert.equal(requiresMFA({role:'admin'}),true);assert.equal(requiresMFA({role:'agent'}),false);assert.equal(requiresMFA({role:'admin',mfaRequired:false}),false);assert.equal(requiresMFA({role:'editor',mfaRequired:true}),true);});

test('property API rejects malformed unit and non-text badge values',()=>{
 const property=structuredClone(initialProperties[0]);
 assert.throws(()=>validateProperty({...property,unit:'<img src=x>'}),/Unidade inválida/);
 assert.throws(()=>validateProperty({...property,tag:{html:'<script>'}}),/Destaque inválido/);
 assert.throws(()=>validateProperty({...property,tag:'x'.repeat(81)}),/Destaque inválido/);
});
