import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {scryptSync} from 'node:crypto';
test('operator password recovery preserves MFA, revokes only target sessions and audits no password',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'confianza-recovery-')),filename=path.join(folder,'test.sqlite');
 const db=new DatabaseSync(filename);
 try{
  for(const t of ['users','sessions','audit'])db.exec(`CREATE TABLE ${t}(id TEXT PRIMARY KEY,payload TEXT NOT NULL)`);
  const user={id:'admin',email:'owner@example.com',role:'admin',active:true,passwordHash:'old',mfaSecret:'encrypted-secret',mfaLastStep:123};
  db.prepare('INSERT INTO users VALUES(?,?)').run(user.id,JSON.stringify(user));
  for(const [id,userId] of [['target','admin'],['other','editor']])db.prepare('INSERT INTO sessions VALUES(?,?)').run(id,JSON.stringify({userId}));
  const password='new-unique-password-2026';
  const result=spawnSync(process.execPath,['recover-password.mjs',user.email],{encoding:'utf8',env:{...process.env,DB_DRIVER:'sqlite',DB_PATH:filename,RECOVERY_PASSWORD:password}});
  assert.equal(result.status,0,result.stderr);
  const updated=JSON.parse(db.prepare('SELECT payload FROM users').get().payload);
  const [salt,hash]=updated.passwordHash.split(':');assert.equal(hash,scryptSync(password,salt,64).toString('hex'));
  assert.equal(updated.mfaSecret,user.mfaSecret);assert.equal(updated.mfaLastStep,123);assert.equal(updated.authVersion,1);
  assert.deepEqual(db.prepare('SELECT id FROM sessions').all().map(r=>r.id),['other']);
  const audit=db.prepare('SELECT payload FROM audit').get().payload;assert.equal(JSON.parse(audit).action,'password.operator_reset');assert.ok(!audit.includes(password));
  const failed=spawnSync(process.execPath,['recover-password.mjs','missing@example.com'],{encoding:'utf8',env:{...process.env,DB_DRIVER:'sqlite',DB_PATH:filename,RECOVERY_PASSWORD:password}});
  assert.notEqual(failed.status,0);assert.equal(db.prepare('SELECT count(*) AS n FROM audit').get().n,1);
 }finally{db.close();rmSync(folder,{recursive:true,force:true});}
});
