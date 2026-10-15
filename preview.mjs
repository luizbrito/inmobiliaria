import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),directory=path.join(root,'data','preview');
await mkdir(directory,{recursive:true});
const configFile=path.join(directory,'credentials.json');let config;
try{config=JSON.parse(await readFile(configFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;config={password:randomBytes(16).toString('hex'),mfaKey:randomBytes(32).toString('hex')};await writeFile(configFile,JSON.stringify(config),{flag:'wx',mode:0o600});}
Object.assign(process.env,{NODE_ENV:'development',DB_DRIVER:'sqlite',DB_PATH:path.join(directory,'preview.sqlite'),UPLOAD_DIR:path.join(directory,'uploads'),PORT:'39628',LISTEN_HOST:'127.0.0.1',PUBLIC_ORIGIN:'http://localhost:39628',ADMIN_EMAIL:'preview@example.test',ADMIN_NAME:'Administrador de teste',ADMIN_PASSWORD:config.password,MFA_ENCRYPTION_KEY:config.mfaKey,SEED_DEMO:'true'});
console.log('Prévia: http://localhost:39628');
console.log('Painel: http://localhost:39628/admin');
console.log('E-mail de teste: preview@example.test');
console.log('Senha de teste: '+config.password);
await import('./server.mjs');
