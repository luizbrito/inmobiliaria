export function historyChange(oldLedger,old,oldInternal,next,internal,actor,restoredFrom){
 const date=next.updatedAt,version=(property,inside,who,when)=>({id:crypto.randomUUID(),property:structuredClone(property),internal:structuredClone(inside||{}),actor:who,date:when,fields:[]});
 const versions=[...(oldLedger?.versions||[])];if(!versions.length&&old)versions.push(version(old,oldInternal,null,old.updatedAt||null));
 const fields=[...new Set([...Object.keys(old||{}),...Object.keys(next)])].filter(k=>k!=='updatedAt'&&JSON.stringify(old?.[k])!==JSON.stringify(next[k]));if(JSON.stringify(oldInternal)!==JSON.stringify(internal))fields.push('internal');
 versions.push({...version(next,internal,{id:actor.id,name:actor.name},date),fields,...(restoredFrom?{restoredFrom}:{})});return {id:historyKey(next.id),versions:versions.slice(-100)};
}
export function visibleHistory(ledger,user,commissionView){return (ledger?.versions||[]).map(v=>{const internal={...v.internal};if(!commissionView)delete internal.commission;return {...v,internal};});}
import {createHash} from 'node:crypto';
export const historyKey=id=>'property-history-'+createHash('sha256').update(id).digest('hex').slice(0,60);
