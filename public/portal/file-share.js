export async function preparePDFFile(file,name){
 if(!file||file.size>20*1024*1024||file.size<5)throw Error('PDF_INVALID');
 const header=new Uint8Array(await file.slice(0,5).arrayBuffer());if(String.fromCharCode(...header)!=='%PDF-')throw Error('PDF_INVALID');
 return new File([file],name,{type:'application/pdf',lastModified:file.lastModified});
}
export const canSharePDF=(file,nav=navigator)=>!!(file&&typeof nav.canShare==='function'&&typeof nav.share==='function'&&nav.canShare({files:[file]}));
