export function organizePropertyForm(form,tr){
 const grid=form.querySelector('.form-grid'),groups=[['Dados gerais',['type','purpose','priceOnRequest','price','currency','area','unit','beds','baths','parking','productive','reserve','soil','rain']],['Localização',['location','region','latitude','longitude']],['Descrição e traduções',['title','description','features']],['Fotos',[]],['Publicação',['status','featured']],['Informações internas',[]]];
 const sections=groups.map(([title])=>{const fieldset=document.createElement('fieldset');fieldset.className='property-section form-grid';const legend=document.createElement('legend');legend.textContent=tr(title);fieldset.append(legend);return fieldset;});
 for(const node of [...grid.children]){const name=node.querySelector('[name]')?.name||node.getAttribute('name');let index=groups.findIndex(([,names])=>names.includes(name));if(node.id==='property-photos')index=3;if(node.querySelector('#draft-lang'))index=2;if(index<0)index=5;sections[index].append(node);}
 grid.replaceWith(...sections);
}
export function installDirtyGuard(form,{message,changed=()=>{}}){
 let dirty=false;const mark=()=>{dirty=true;changed();},before=e=>{if(dirty){e.preventDefault();e.returnValue='';}};
 const fieldChange=e=>{if(e.target?.id!=='photo-files')mark();};
 form.addEventListener('input',fieldChange);form.addEventListener('change',fieldChange);form.addEventListener('photo-editor-change',mark);window.addEventListener('beforeunload',before);
 return {get dirty(){return dirty;},clean(){dirty=false;},leave(){if(dirty&&!confirm(message()))return false;dirty=false;return true;},dispose(){window.removeEventListener('beforeunload',before);form.removeEventListener('input',fieldChange);form.removeEventListener('change',fieldChange);form.removeEventListener('photo-editor-change',mark);}};
}
