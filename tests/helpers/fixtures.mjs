import {createServer} from 'node:net';
import {existsSync} from 'node:fs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {chromium} from '@playwright/test';
export async function freePort(){const server=createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const port=server.address().port;await new Promise(r=>server.close(r));return port;}
export const browserOptions=()=>({headless:true,...(process.env.BROWSER_EXECUTABLE_PATH?{executablePath:process.env.BROWSER_EXECUTABLE_PATH}:!existsSync(chromium.executablePath())&&process.platform==='win32'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{})});
export function isolatedEnv(overrides={}){
 const env={...process.env,NODE_ENV:'development',LISTEN_HOST:'127.0.0.1',BOOTSTRAP_ADMIN_PASSWORD:'',ADMIN_PASSWORD:'',PASSWORD_RESET_ENABLED:'false',WHATSAPP_ENABLED:'false',WHATSAPP_QR_ENABLED:'false',WHATSAPP_QR_SEND_ENABLED:'false',EMAIL_NOTIFICATIONS_ENABLED:'false',BACKUP_AUTOMATION_ENABLED:'false',ANALYTICS_HASH_KEY:'',...overrides};
 // Never inherit production transport credentials into a fixture server.
 for(const key of ['SMTP_PASSWORD','WHATSAPP_ACCESS_TOKEN','WHATSAPP_QR_ENCRYPTION_KEY'])if(!(key in overrides))delete env[key];
 return env;
}
export async function localOnly(page,origin){await page.route('**/*',route=>['data:','blob:'].includes(new URL(route.request().url()).protocol)||new URL(route.request().url()).origin===origin?route.continue():route.abort());}
export async function removeFixture(directory){const resolved=path.resolve(directory);if(path.dirname(resolved)!==path.resolve(tmpdir())||!path.basename(resolved).startsWith('confianza-'))throw Error('Refusing cleanup outside isolated test directory');await rm(resolved,{recursive:true,force:true,maxRetries:10,retryDelay:200});}
async function isolatedMysql(){
 if(process.env.MYSQL_TEST_ISOLATED!=='true'||process.env.MYSQL_HOST!=='127.0.0.1'||!/^qa_/.test(process.env.MYSQL_DATABASE||''))throw Error('MySQL fixtures require the isolated Docker harness');
 const mysql=await import('mysql2/promise'),connection=await mysql.createConnection({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD}),name='qa_matrix_'+randomBytes(12).toString('hex');
 try{await connection.query('CREATE DATABASE `'+name+'` CHARACTER SET utf8mb4');}catch(error){await connection.end();throw error;}
 return {env:{DB_DRIVER:'mysql',MYSQL_DATABASE:name},async close(){try{if(!/^qa_matrix_[a-f0-9]{24}$/.test(name))throw Error('Unsafe test schema');await connection.query('DROP DATABASE `'+name+'`');}finally{await connection.end();}}};
}
export async function startApp(overrides={}){
 const directory=await mkdtemp(path.join(tmpdir(),'confianza-browser-')),port=await freePort(),origin='http://127.0.0.1:'+port,password=randomBytes(20).toString('hex');
 let mysqlFixture;try{if(process.env.TEST_MYSQL==='true')mysqlFixture=await isolatedMysql();}catch(error){await removeFixture(directory);throw error;}
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('../../',import.meta.url),env:isolatedEnv({DB_DRIVER:'sqlite',DB_PATH:path.join(directory,'test.sqlite'),UPLOAD_DIR:path.join(directory,'uploads'),PORT:String(port),PUBLIC_ORIGIN:origin,ADMIN_EMAIL:'qa@example.test',ADMIN_PASSWORD:password,MFA_ENCRYPTION_KEY:randomBytes(32).toString('hex'),...mysqlFixture?.env,...overrides}),stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);let spawnError;child.on('error',e=>spawnError=e);
 const close=async()=>{if(child.exitCode===null){child.kill();await new Promise(resolve=>{const timer=setTimeout(resolve,3000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}try{await mysqlFixture?.close();}finally{await removeFixture(directory);}};
 try{for(let i=0;i<100;i++){if(spawnError)throw spawnError;if(child.exitCode!==null)throw Error('Fixture server stopped: '+output);try{if((await fetch(origin+'/api/health')).ok)return {origin,password,child,directory,close};}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Fixture server did not become ready');}catch(error){await close();throw error;}
}
