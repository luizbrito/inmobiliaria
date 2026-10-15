import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {secretBox} from './core/security.mjs';
test('backup before the notification migration restores a legacy schema and preserves encrypted MFA',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'confianza-legacy-backup-')),source=path.join(dir,'legacy.sqlite'),restored=path.join(dir,'restored.sqlite'),uploads=path.join(dir,'uploads');await mkdir(uploads);
 const key=randomBytes(32).toString('hex'),mfaKey=randomBytes(32).toString('hex'),mfaSecret=secretBox(mfaKey).seal('TEST_MFA_SECRET'),record={id:'admin',role:'admin',active:true,mfaSecret,publicProfile:{enabled:true,name:'Public name',whatsapp:'',email:''}},db=new DatabaseSync(source);
 for(const table of ['properties','leads','settings','users','sessions','audit','property_internal','visits'])db.exec(`CREATE TABLE ${table}(id TEXT PRIMARY KEY,payload TEXT NOT NULL)`);
 db.prepare('INSERT INTO users(id,payload) VALUES(?,?)').run(record.id,JSON.stringify(record));db.close();const env={...process.env,DB_DRIVER:'sqlite',DB_PATH:source,UPLOAD_DIR:uploads,BACKUP_ENCRYPTION_KEY:key},archive=path.join(dir,'backup.enc');
 execFileSync(process.execPath,['backup.mjs','backup',archive],{env,stdio:'pipe'});execFileSync(process.execPath,['backup.mjs','restore',archive],{env:{...env,DB_PATH:restored,UPLOAD_DIR:path.join(dir,'restored-uploads')},stdio:'pipe'});
 const copy=new DatabaseSync(restored);try{const user=JSON.parse(copy.prepare('SELECT payload FROM users').get().payload);assert.deepEqual(user,record);assert.equal(secretBox(mfaKey).open(user.mfaSecret),'TEST_MFA_SECRET');assert.equal(copy.prepare('SELECT COUNT(*) AS total FROM notification_jobs').get().total,0);}finally{copy.close();}
});
