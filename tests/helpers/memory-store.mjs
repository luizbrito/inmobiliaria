// Observable transaction contract used to exercise the service, not a copy of SQL.
export function memoryStore(){
 const rows=new Map();return {
 async get(table,id){return structuredClone(rows.get(table+':'+id)||null);},
 async all(table){return [...rows].filter(([key])=>key.startsWith(table+':')).map(([,value])=>structuredClone(value));},
 async set(table,id,value){rows.set(table+':'+id,structuredClone(value));},
 async remove(table,id){rows.delete(table+':'+id);},
 async atomicCompareSet(changes){if(changes.some(c=>JSON.stringify(rows.get(c.table+':'+c.id)||null)!==JSON.stringify(c.old)))return false;for(const c of changes)c.next===null?rows.delete(c.table+':'+c.id):rows.set(c.table+':'+c.id,structuredClone(c.next));return true;},
 };
}
