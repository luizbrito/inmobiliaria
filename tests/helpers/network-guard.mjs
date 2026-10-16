// Loaded by test entry points and inherited by fixture Node children. No real providers.
import net from 'node:net';
import tls from 'node:tls';
const local=host=>!host||['localhost','127.0.0.1','::1','[::1]'].includes(String(host).toLowerCase());
function check(args){let options=args[0];if(Array.isArray(options))options=options[0];const host=typeof options==='object'?options?.host:typeof args[1]==='string'?args[1]:null;if(!local(host))throw Error('TEST_NETWORK_BLOCKED: '+host);}
const connect=net.Socket.prototype.connect;net.Socket.prototype.connect=function(...args){check(args);return connect.apply(this,args);};
const secure=tls.connect;tls.connect=function(...args){check(args);return secure.apply(this,args);};
const request=globalThis.fetch;globalThis.fetch=function(input,...args){const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!local(url.hostname))return Promise.reject(Error('TEST_NETWORK_BLOCKED: '+url.hostname));return request.call(this,input,...args);};
