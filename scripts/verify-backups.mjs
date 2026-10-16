import {runBackupVerification} from '../core/backup-verification.mjs';
const status=await runBackupVerification({force:process.argv.includes('--force')});
console.log(JSON.stringify({state:status.state,lastBackup:status.lastBackup,lastVerified:status.lastVerified,durationMs:status.durationMs,errorCode:status.errorCode||null}));
if(status.state==='failed')process.exitCode=1;
