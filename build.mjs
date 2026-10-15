import {access} from 'node:fs/promises';
await access(new URL('./public/portal/index.html',import.meta.url));
console.log('Frontend pronto. Sem compilação de interface ou renderização pesada.');
