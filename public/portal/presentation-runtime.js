import {copy} from './presentation-i18n.js?v=20261015-5';
const c=copy(document.body.dataset.language),status=document.querySelector('#print-status'),print=document.querySelector('#print-button'),retry=document.querySelector('#retry-images'),flow=document.querySelector('#flow');
const nodes=[...flow.children];let preparing=false;
async function loadImage(img){return new Promise(resolve=>{const finish=()=>{clearTimeout(timer);img.removeEventListener('load',finish);img.removeEventListener('error',finish);resolve(img.complete&&img.naturalWidth>0);};const timer=setTimeout(finish,15000);if(img.complete)return finish();img.addEventListener('load',finish);img.addEventListener('error',finish);});}
function paginate(){
 const pages=document.querySelector('#pages');pages.replaceChildren();let content;
 const newPage=()=>{const page=document.createElement('section');page.className='document-page';page.append(document.querySelector('#page-header').content.cloneNode(true));content=document.createElement('div');content.className='page-content';page.append(content);const footer=document.createElement('footer');footer.className='page-number';footer.textContent='1';page.append(footer);pages.append(page);};
 newPage();const fits=()=>content.scrollHeight<=content.clientHeight+1;
 for(const original of nodes){let node=original.cloneNode(true);content.append(node);
  if(fits())continue;
  node.remove();let heading=null;if(content.lastElementChild?.tagName==='H2'){heading=content.lastElementChild;heading.remove();}if(content.children.length)newPage();if(heading)content.append(heading);content.append(node);
  if(fits())continue;
  if(node.tagName==='P'||node.tagName==='DL'){
   if(node.tagName==='DL'){const replacement=document.createElement('p');replacement.textContent=node.textContent;node.replaceWith(replacement);node=replacement;}
   const text=node.textContent;node.remove();let rest=text;
   while(rest){const part=node.cloneNode(false);content.append(part);let lo=0,hi=rest.length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);part.textContent=rest.slice(0,mid);if(fits())lo=mid;else hi=mid-1;}if(!lo)throw Error('Conteúdo excede a página.');let split=lo;if(lo<rest.length){const boundary=rest.lastIndexOf(' ',lo);if(boundary>lo/2)split=boundary;}part.textContent=rest.slice(0,split);rest=rest.slice(split).trimStart();if(rest)newPage();}
  }else if(node.tagName==='FIGURE'){
   const image=node.querySelector('img');if(image){image.style.height=Math.max(80,content.clientHeight-(node.querySelector('figcaption')?.offsetHeight||0)-20)+'px';}
   if(!fits())throw Error('Foto excede a página.');
  }else throw Error('Conteúdo excede a página.');
 }
 [...pages.children].forEach((page,i)=>page.querySelector('.page-number').textContent=`${i+1} / ${pages.children.length}`);
}
async function prepare(){
 if(preparing)return;preparing=true;print.disabled=true;retry.hidden=true;status.textContent=c.loading;
 try{await document.fonts.ready;let failed=0,completed=0,critical=false;const images=[...flow.querySelectorAll('img')];await Promise.all(images.map(async img=>{const ok=await loadImage(img);completed++;status.textContent=`${c.loading}: ${completed} / ${images.length}`;if(!ok){failed++;const figure=img.closest('figure');if(figure){const old=figure.querySelector('.image-error');if(!old){const message=document.createElement('p');message.className='image-error';message.textContent=c.unavailable;figure.prepend(message);}img.hidden=true;}else critical=true;}else{img.hidden=false;img.closest('figure')?.querySelector('.image-error')?.remove();if(img.naturalHeight>img.naturalWidth)img.closest('figure')?.classList.add('portrait');}}));if(critical)throw Error(c.unavailable);paginate();status.textContent=failed?c.failed:c.ready;print.disabled=false;retry.hidden=!failed;
 }catch(error){status.textContent=error.message;retry.hidden=false;}finally{preparing=false;}
}
print.addEventListener('click',()=>window.print());retry.addEventListener('click',()=>{flow.querySelectorAll('img').forEach(img=>{const source=img.src;img.src='';img.src=source;});prepare();});
prepare();
