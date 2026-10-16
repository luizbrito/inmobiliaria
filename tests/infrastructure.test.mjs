import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isolatedEnv,freePort,removeFixture} from './helpers/fixtures.mjs';
import './helpers/network-guard.mjs';
test('test infrastructure disables providers and refuses unsafe cleanup and external HTTP',async()=>{
 const env=isolatedEnv();for(const key of ['PASSWORD_RESET_ENABLED','WHATSAPP_ENABLED','WHATSAPP_QR_ENABLED','WHATSAPP_QR_SEND_ENABLED','EMAIL_NOTIFICATIONS_ENABLED','BACKUP_AUTOMATION_ENABLED'])assert.equal(env[key],'false');
 assert.equal(env.BOOTSTRAP_ADMIN_PASSWORD,'');await assert.rejects(()=>removeFixture(process.cwd()),/Refusing/);await assert.rejects(()=>fetch('https://graph.facebook.com/'),/TEST_NETWORK_BLOCKED/);assert(await freePort()>0);
});
