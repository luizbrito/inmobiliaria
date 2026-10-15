self.addEventListener('notificationclick',event=>{
 event.notification.close();const href=event.notification.data?.href;
 if(typeof href!=='string'||!/^\/admin\/(pendencias|visitas|notificacoes)$/.test(href))return;
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{const target=windows.find(w=>new URL(w.url).origin===self.location.origin&&new URL(w.url).pathname.startsWith('/admin'));if(target){await target.navigate(href);return target.focus();}return clients.openWindow(href);}));
});
