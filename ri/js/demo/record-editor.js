// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {parseRecord,exportRecord} from '../src/model.js';
export function mountRecordEditor(container,{getRecord,onApply,theme='glass'}={}) {
  const open=document.createElement('button');open.type='button';open.textContent='Edit OCKER file';container.append(open);let closeEditor;
  open.addEventListener('click',async()=>{
    open.disabled=true;
    try {
      const [{EditorView,basicSetup},{json}]=await Promise.all([import('codemirror'),import('@codemirror/lang-json')]);
      const root=document.createElement('section');root.className='ocker-root ocker-import-host'+((typeof theme==='function'?theme():theme)==='glass'?' ocker-theme-glass':'');
      root.innerHTML='<dialog class="ocker-dialog ocker-json-dialog" aria-label="Edit OCKER file"><h2>Edit OCKER file</h2><div class="ocker-dialog-content"><p>Changes apply only after the complete record passes validation. Provider settings and API keys are not part of this file.</p><div class="ocker-json-editor"></div><p class="ocker-editor-status" role="status" aria-live="polite"></p></div><footer class="ocker-dialog-footer"><button type="button" data-editor="format">Pretty print</button><button type="button" data-editor="cancel">Cancel</button><button type="button" data-editor="apply" class="ocker-primary">Apply changes</button></footer></dialog>';
      const dialog=root.querySelector('dialog'),status=root.querySelector('[role="status"]');document.body.append(root);
      const editor=new EditorView({doc:exportRecord(getRecord()),extensions:[basicSetup,json(),EditorView.contentAttributes.of({'aria-label':'OCKER JSON','spellcheck':'false'}),EditorView.theme({'&':{height:'min(60dvh,600px)',fontSize:'12px'},'.cm-scroller':{overflow:'auto',fontFamily:'ui-monospace,monospace'},'.cm-content':{padding:'12px 0'},'.cm-gutters':{backgroundColor:'#eff5f8',color:'#69808b'}})],parent:root.querySelector('.ocker-json-editor')});
      closeEditor=()=>{editor.destroy();dialog.close();root.remove();closeEditor=undefined;open.disabled=false;open.focus();};
      dialog.addEventListener('cancel',event=>event.preventDefault());root.querySelector('[data-editor="cancel"]').onclick=closeEditor;
      root.querySelector('[data-editor="format"]').onclick=()=>{try{const text=JSON.stringify(JSON.parse(editor.state.doc.toString()),null,2)+'\n';editor.dispatch({changes:{from:0,to:editor.state.doc.length,insert:text}});status.textContent='JSON formatted. Choose Apply changes to validate and update the chronology.';}catch(error){status.textContent=error.message;}};
      root.querySelector('[data-editor="apply"]').onclick=async()=>{try{const next=parseRecord(editor.state.doc.toString());await onApply(next);closeEditor();}catch(error){status.textContent=error.message;}};
      dialog.showModal();editor.focus();
    } catch(error){open.disabled=false;open.title=error.message;}
  });
  return {destroy(){closeEditor?.();open.remove();}};
}
