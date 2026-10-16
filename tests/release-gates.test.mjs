import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {sourceDigest,requireReleaseEvidence} from '../scripts/release-evidence.mjs';
import {removeFixture} from './helpers/fixtures.mjs';
test('release rejects missing, skipped, stale, partial and different-code evidence',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'confianza-gate-test-'));try{
  await assert.rejects(()=>requireReleaseEvidence(dir),/missing all/);const digest=await sourceDigest(),valid={code:0,digest,date:new Date().toISOString(),node:process.version,skipped:0,partial:false};
  for(const suite of ['all','e2e','a11y','visual','mysql','coverage','release-smoke'])await writeFile(path.join(dir,suite+'.json'),JSON.stringify({...valid,suite}));assert.equal((await requireReleaseEvidence(dir)).digest,digest);
  for(const change of [{code:1},{partial:true},{skipped:1},{digest:'wrong'},{date:'2020-01-01'},{date:'invalid'},{date:new Date(Date.now()+60000).toISOString()},{node:'v20.0.0'}]){await writeFile(path.join(dir,'mysql.json'),JSON.stringify({...valid,suite:'mysql',...change}));await assert.rejects(()=>requireReleaseEvidence(dir),/RELEASE_BLOCKED/);}
 }finally{await removeFixture(dir);}
});
