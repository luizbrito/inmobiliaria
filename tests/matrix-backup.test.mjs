import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {runBackupVerification} from '../core/backup-verification.mjs';
import {removeFixture} from './helpers/fixtures.mjs';
test('M17 backup automation refuses public destinations and preserves prior verification on failure',async()=>{
 await assert.rejects(()=>runBackupVerification({env:{BACKUP_AUTOMATION_ENABLED:'true',BACKUP_DIR:path.resolve('public')}}),/BACKUP_PUBLIC_DIRECTORY/);
 const dir=await mkdtemp(path.join(tmpdir(),'confianza-backup-matrix-'));try{
  const now=Date.now(),old={state:'verified',lastVerified:new Date(now-86400000).toISOString()},env={BACKUP_AUTOMATION_ENABLED:'true',BACKUP_DIR:dir,DB_DRIVER:'sqlite',BACKUP_ENCRYPTION_KEY:'a'.repeat(64)};await writeFile(path.join(dir,'status.json'),JSON.stringify(old));await writeFile(path.join(dir,'verification.lock'),'fixture');let calls=0;
  const run=async()=>{calls++;throw Error('Transport-like private error');};const busy=await runBackupVerification({env,force:true,run});assert.equal(busy.lastVerified,old.lastVerified);assert.equal(calls,0);await unlink(path.join(dir,'verification.lock'));
  const failed=await runBackupVerification({env,force:true,run});assert.equal(failed.state,'failed');assert.equal(failed.lastVerified,old.lastVerified);assert.equal(failed.errorCode,'backup_verify_failed');assert(!JSON.stringify(failed).includes('private error'));
 }finally{await removeFixture(dir);}
});
