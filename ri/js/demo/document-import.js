// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export function confirmPdfDocuments(files,{theme='glass',labels={}}={}) {
  const t=(key,fallback)=>labels[key]??fallback;
  const selected=Array.from(files);if(!selected.length)return Promise.resolve([]);
  return new Promise(resolve=>{
    const root=document.createElement('section');root.className='ocker-root ocker-import-host'+(theme==='glass'?' ocker-theme-glass':'');
    const dialog=document.createElement('dialog');dialog.className='ocker-dialog ocker-import-dialog';const heading=document.createElement('h2');heading.textContent=t('addDocuments','Add documents');heading.id='ocker-import-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',heading.id);
    const content=document.createElement('div');content.className='ocker-dialog-content';const intro=document.createElement('p');intro.className='ocker-import-intro';intro.textContent=t('chooseDocumentTypes','Choose the document type for each document before importing.');content.append(intro);
    const fields=selected.map(file=>{const row=document.createElement('label');row.className='ocker-import-file';const name=document.createElement('span');name.textContent=file.name;const select=document.createElement('select');select.setAttribute('aria-label',`${t('documentType','Document type')} ${file.name}`);for(const [value,text]of [['affidavit',t('affidavit','Affidavit')],['order',t('order','Order')],['report',t('report','Report')]]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}row.append(name,select);content.append(row);return{file,select};});
    const footer=document.createElement('footer');footer.className='ocker-dialog-footer';const cancel=document.createElement('button');cancel.type='button';cancel.textContent=t('cancel','Cancel');const add=document.createElement('button');add.type='button';add.className='ocker-primary';add.textContent=selected.length===1?t('addDocument','Add document'):t('addDocuments','Add documents');footer.append(cancel,add);dialog.append(heading,content,footer);root.append(dialog);document.body.append(root);
    let settled=false;const finish=value=>{if(settled)return;settled=true;dialog.close();root.remove();resolve(value);};cancel.addEventListener('click',()=>finish(null));dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});dialog.addEventListener('close',()=>finish(null));add.addEventListener('click',()=>finish(fields.map(({file,select})=>({file,kind:select.value}))));dialog.showModal();fields[0].select.focus();
  });
}
