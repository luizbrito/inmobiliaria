import {randomBytes,randomUUID,scrypt as scryptCallback} from 'node:crypto';
import {promisify} from 'node:util';

// Explicit one-time operator opt-in. Password is never stored outside its hash.
export async function bootstrapAdmin(store,env=process.env){
 const password=env.BOOTSTRAP_ADMIN_PASSWORD;
 if(!password)return false;
 const marker='bootstrap-luiz-admin-v1';
 if(await store.get('settings',marker))return false;
 if(password.length<12||password.length>200)throw Error('BOOTSTRAP_ADMIN_PASSWORD deve ter de 12 a 200 caracteres.');
 const email='luizbritodarosa@gmail.com';
 const matches=(await store.all('users')).filter(u=>u.email?.toLowerCase()===email);
 if(matches.length>1)throw Error('Cadastro duplicado do administrador. Revise o banco antes de continuar.');
 const old=matches[0]||null;
 if(old&&old.role!=='admin')throw Error('A conta existente não é administradora. Revise suas permissões antes de continuar.');
 const salt=randomBytes(16).toString('hex');
 const user={...(old||{id:randomUUID(),name:'Luiz Brito da Rosa',createdAt:new Date().toISOString()}),email,role:'admin',mfaRequired:true,active:true,passwordHash:salt+':'+(await promisify(scryptCallback)(password,salt,64)).toString('hex'),authVersion:(old?.authVersion??0)+1};
 delete user.mfaSecret;delete user.mfaLastStep;
 const auditId=randomUUID();
 const changes=[{table:'users',id:user.id,old,next:user},{table:'settings',id:marker,old:null,next:{done:true,date:new Date().toISOString()}},{table:'audit',id:auditId,old:null,next:{id:auditId,date:new Date().toISOString(),action:'admin.operator_bootstrap',status:200,userId:user.id,ip:'startup-operator'}}];
 for(const session of await store.all('sessions'))if(session.userId===user.id)changes.push({table:'sessions',id:session.id,old:session,next:null});
 if(!await store.atomicCompareSet(changes))throw Error('Preparação administrativa concorrente. Reinicie para verificar o resultado.');
 console.log('Administrador preparado uma única vez. Cadastre o MFA no próximo login e remova BOOTSTRAP_ADMIN_PASSWORD do painel.');
 return true;
}
