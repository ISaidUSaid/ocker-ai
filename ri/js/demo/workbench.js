// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {mountChronology,createRecord,parseRecord,verifyAssets,parsePdf,parseDocument,parseText,parseRichText,buildChronology,findRelationships,createProviderAdapter,isLoopbackEndpoint} from '../src/index.js';
import {mountCodeDisclosure,mountReviewActions} from './integration-code.js';
import {confirmPdfDocuments} from './document-import.js';
import {mountRecordEditor} from './record-editor.js';
import {mountProviderShortcuts} from './provider-shortcuts.js';
import {browserLocale,chronologyLabels,DEMO_LOCALES,demoText} from './locales.js';
export function mountWorkbench(element,configuration={}) {
  let record=configuration.record,documents=configuration.documents??[],controller;
  let defaultRecord=configuration.defaultRecord??!record;
  const state={...configuration};let locale=browserLocale(globalThis.location?.search,configuration.locale??globalThis.navigator?.language),text=demoText(locale);const root=document.createElement('section');root.className='ocker-workbench';element.append(root);
  record??=createRecord(text.defaultTitle);
  if(defaultRecord)record={...record,title:text.defaultTitle};
  root.lang=locale;
  const languageOptions=DEMO_LOCALES.map(([value,label])=>`<option value="${value}"${locale===value?' selected':''}>${label}</option>`).join('');
  root.innerHTML=`<header class="workbench-header"><a class="wordmark" href="#"><img src="assets/ocker-wordmark.png" alt="OCKER"></a><span class="project-tag">${text.acronym}</span><a class="repo-link" href="https://github.com/ISaidUSaid/ocker-ai" target="_blank" rel="noopener noreferrer">${text.specCode} ↗</a></header>
  <main><section class="workbench-intro"><p class="kicker">${text.acronym}</p><h1>${text.acronym}</h1><p class="workbench-tagline">${text.tagline}</p><p>${text.intro}</p><p class="browser-assurance">${text.browser}</p></section>
  <section class="workbench-controls" aria-label="Chronology workspace"><div class="journey-grid">
  <div class="appearance-settings"><span class="config-kicker">${text.liveReference}</span><label>${text.language} <select data-option="locale">${languageOptions}</select></label><label>${text.theme} <select data-option="theme"><option value="glass">${text.glass}</option><option value="none">${text.none}</option></select></label></div>
  <ol class="build-steps" aria-label="Build process"><li data-step="import">${text.start}</li><li data-step="connect">${text.connect}</li><li data-step="build">${text.build}</li><li data-step="relate">${text.compare}</li></ol>
  <section class="import-settings journey-panel"><span class="journey-badge">1</span><h2>${text.start}</h2><p>${text.startHelp}</p><div class="workbench-files"><label class="upload-control upload-primary">${text.addDocuments}<input type="file" accept=".pdf,.docx,.rtf,.txt,.html,.htm,application/pdf,text/plain,application/rtf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple data-action="pdf"></label><button type="button" data-action="paste">${text.paste}</button></div><ul class="document-queue"></ul></section>
  <section class="provider-settings journey-panel"><span class="journey-badge">2</span><h2>${text.provider}</h2><p>${text.aiOnly}</p><details class="configure-provider"><summary>${text.configure}</summary><div class="provider-shortcuts"></div><div class="provider-grid"><label>${text.model}<input data-option="model" placeholder="${text.model}"><small>${text.modelHelp}</small></label><label>${text.apiKey}<input type="password" autocomplete="off" data-option="key" placeholder="${text.memoryOnly}"></label></div><details class="advanced-provider"><summary>${text.advancedProvider}</summary><div class="provider-grid"><label>${text.protocol}<select data-option="protocol"><option value="openai">Chat completions</option><option value="anthropic">Anthropic Messages</option></select></label><label>${text.endpoint}<input type="url" data-option="endpoint" placeholder="https://your-provider.example/v1/chat/completions"></label></div></details></details><p class="provider-notice" role="note">${text.notice}</p><div class="provider-actions"><button type="button" data-action="build">${text.build}</button><button type="button" data-action="cancel" disabled>${text.cancel}</button></div><p class="pipeline-explainer">${text.pipeline}</p></section>
  <section class="record-settings journey-panel"><span class="journey-badge">3</span><h2>${text.review}</h2><div class="workbench-files"><label class="upload-control">${text.importFile}<input type="file" accept=".json,.ocker,application/json" data-action="open"></label><button type="button" data-action="intermediate">${text.exportIntermediate}</button></div><p class="example-invitation">${text.example} <button type="button" data-action="demo" class="example-link">${text.loadExample}</button></p><div class="workbench-code"></div></section></div><p class="workbench-next"><strong>${text.next}</strong> <span></span> <button type="button" data-action="connect">${text.connect}</button></p><p class="workbench-progress" role="status" aria-live="polite">${text.statusStart}</p></section><div class="workbench-chronology"></div></main><footer class="workbench-footer"><strong>OCKER</strong> ${text.acronym} <span>Apache 2.0 · Jenko</span></footer>`;
  const responsive=new ResizeObserver(entries=>root.classList.toggle('ocker-workbench-mobile',entries[0].contentRect.width<680));responsive.observe(root);
  const $=selector=>root.querySelector(selector);$('.workbench-header').insertBefore($('.workbench-intro'),$('.repo-link'));$('.workbench-header').append($('.appearance-settings'));$('.workbench-footer').append($('.repo-link'));const startPanel=$('.import-settings'),reviewPanel=$('.record-settings'); for(const item of [reviewPanel.querySelector('.workbench-files'),reviewPanel.querySelector('.example-invitation')]) if(item) startPanel.append(item);const progress=$('.workbench-progress'),queue=$('.document-queue');
  const view=mountChronology($('.workbench-chronology'),record,{...state,locale,labels:chronologyLabels(locale),onChange:next=>{record=next;defaultRecord=false;state.onChange?.(next);}});
  $('[data-option="theme"]').value=state.theme??'glass';
  for(const [key,value] of Object.entries(state.provider??{})){const field=$(`[data-option="${key==='apiKey'?'key':key}"]`);if(field)field.value=value;}
  const reviewActions=mountReviewActions($('.workbench-code'),{getRecord:()=>record,labels:text});
  const editor=mountRecordEditor($('.workbench-code'),{getRecord:()=>record,onApply:next=>{update(next);documents=next.documents.map(document=>({format:'ocker-document',version:'0.1.0',document,asset:next.assets.find(a=>a.id===document.assetId)}));showQueue();},theme:()=>$('[data-option="theme"]').value,labels:text});
  const providers=mountProviderShortcuts($('.provider-shortcuts'),{labels:text,onSelect:preset=>{$('[data-option="endpoint"]').value=preset.endpoint;$('[data-option="protocol"]').value=preset.protocol;$('[data-option="key"]').value='';$('[data-option="key"]').placeholder=preset.requiresKey?text.memoryOnly:text.ollamaOptional;$('.provider-notice').textContent=text.notice;refreshSetup();}});
  const code=mountCodeDisclosure($('.workbench-code'),{language:'js',theme:()=>$('[data-option="theme"]').value,labels:text});
  $('.ocker-code-disclosure').append($('[data-action="intermediate"]'));
  $('[data-option="theme"]').addEventListener('change',event=>{view.setOptions({theme:event.target.value});code.refresh();});
  $('[data-option="locale"]').addEventListener('change',event=>{const nextLocale=event.target.value;const provider=credentials();const url=new URL(globalThis.location.href);url.searchParams.set('lang',nextLocale);globalThis.history?.replaceState?.(null,'',url);dispose();element.replaceChildren();mountWorkbench(element,{...state,record,defaultRecord,documents,locale:nextLocale,provider});});
  const update=next=>{defaultRecord=false;record=next;view.setRecord(next);state.onChange?.(next);refreshSetup();};
  function showQueue(){
    queue.replaceChildren(...documents.map((item,index)=>{
      const li=document.createElement('li'),label=document.createElement('span'),remove=document.createElement('button');
      label.textContent=`${item.document.title} · ${item.document.paragraphs.length} ${text.textParagraphs}`;
      remove.disabled=!!controller;remove.type='button';remove.textContent=text.remove;remove.setAttribute('aria-label',`${text.remove} ${item.document.title}`);remove.dataset.action='remove-document';
      remove.addEventListener('click',()=>{if(controller)return;documents.splice(index,1);showQueue();progress.textContent=text.reviewReady;});
      li.append(label,remove);return li;
    }));
    $('[data-step="import"]').classList.toggle('is-complete',documents.length>0);refreshSetup();
  }
  function setupHint(){
    if(controller)return text.working;
    if(!documents.length)return record.events.length?text.reviewReady:text.addOrOpen;
    if(record.events.length)return text.reviewReady;
    const {endpoint,model,apiKey}=credentials();
    if(!state.llm&&!endpoint)return text.chooseProvider;
    if(!state.llm&&!model.trim())return text.enterModel;
    if(!state.llm&&!apiKey.trim()&&!isLoopbackEndpoint(endpoint))return text.enterKey;
    return text.readyBuild;
  }
  function refreshSetup(){
    $('.workbench-next span').textContent=setupHint();
    $('[data-action="build"]').disabled=!!controller||!documents.length;
    const {endpoint,model,apiKey}=credentials();
    const configured=!!state.llm||!!(endpoint&&model.trim()&&(apiKey.trim()||isLoopbackEndpoint(endpoint)));
    $('[data-action="connect"]').hidden=!!controller||!documents.length||!!record.events.length||configured;
    $('[data-step="connect"]').classList.toggle('is-complete',configured);
  }
  $('[data-action="connect"]').addEventListener('click',()=>{
    $('.configure-provider').open=true;
    const target=!credentials().endpoint?$('.provider-shortcuts button'):!credentials().model.trim()?$('[data-option="model"]'):$('[data-option="key"]');
    target?.focus();
  });
  root.querySelectorAll('[data-option="endpoint"],[data-option="model"],[data-option="key"],[data-option="protocol"]').forEach(input=>input.addEventListener('input',refreshSetup));
  function provider(){if(state.llm)return state.llm;return createProviderAdapter(credentials());}
  function credentials(){return {protocol:$('[data-option="protocol"]').value,endpoint:$('[data-option="endpoint"]').value,model:$('[data-option="model"]').value,apiKey:$('[data-option="key"]').value};}
  const busySelector='[data-action="build"],[data-action="relate"],[data-action="pdf"],[data-action="open"],[data-action="demo"],[data-action="paste"],[data-action="sample-documents"],[data-action="remove-document"]';
  async function run(work,success=text.reviewReady){if(controller)return;controller=new AbortController();root.querySelectorAll(busySelector).forEach(e=>e.disabled=true);$('[data-action="cancel"]').disabled=false;root.setAttribute('aria-busy','true');refreshSetup();try{await work(controller.signal);progress.textContent=success;}catch(error){progress.textContent=error.name==='AbortError'?text.cancelled:error.message;state.onError?.(error);}finally{root.querySelectorAll(busySelector).forEach(e=>e.disabled=false);$('[data-action="cancel"]').disabled=true;root.removeAttribute('aria-busy');root.querySelectorAll('.is-active').forEach(e=>e.classList.remove('is-active'));controller=null;refreshSetup();}}
  const onProgress=p=>{progress.textContent=p.stage+' · '+p.detail+(p.total?` (${p.current??0}/${p.total})`:'');root.querySelectorAll('.is-active').forEach(e=>e.classList.remove('is-active'));$('[data-step="'+(p.stage==='relating'?'relate':p.stage==='extracting'?'build':'import')+'"]').classList.add('is-active');state.onProgress?.(p);};
  const loadExample=()=>run(async signal=>{const response=state.loadDemo?await state.loadDemo():await fetch(new URL('examples/joe-jill.ocker.json',document.baseURI),{signal}).then(r=>{if(!r.ok)throw new Error('Example could not be loaded.');return r.text();});const sample=typeof response==='string'?parseRecord(response):response;await verifyAssets(sample,{signal});update(sample);documents=sample.documents.map(document=>({format:'ocker-document',version:'0.1.0',document,asset:sample.assets.find(a=>a.id===document.assetId)}));showQueue();},text.exampleLoaded);
  $('[data-action="demo"]').addEventListener('click',loadExample);
  $('[data-action="open"]').addEventListener('change',event=>run(async signal=>{const file=event.target.files[0];if(!file)return;if(file.size>100*1024*1024)throw new Error('OCKER file exceeds 100 MB.');const next=parseRecord(await file.text());await verifyAssets(next,{signal});update(next);documents=next.documents.map(document=>({format:'ocker-document',version:'0.1.0',document,asset:next.assets.find(a=>a.id===document.assetId)}));showQueue();event.target.value='';}));
  async function importFiles(files){const choices=await confirmPdfDocuments(files,{theme:$('[data-option="theme"]').value,labels:text});if(!choices)return;await run(async signal=>{const incoming=[];for(const {file,kind} of choices){const parser=state.parseDocument??(file.name.toLowerCase().endsWith('.pdf')&&state.parsePdf?state.parsePdf:parseDocument);incoming.push(await parser(file,{kind,title:file.name,workerSrc:state.workerSrc??new URL('pdf.worker.min.mjs',document.baseURI).href,signal,onProgress}));}documents.push(...incoming);showQueue();},text.documentsAdded);}
  $('[data-action="pdf"]').addEventListener('change',async event=>{try{await importFiles(Array.from(event.target.files));}finally{event.target.value='';}});
  $('[data-action="paste"]').addEventListener('click',()=>{
    const host=document.createElement('section');host.className='ocker-root ocker-import-host'+($('[data-option="theme"]').value==='glass'?' ocker-theme-glass':'');
    host.innerHTML=`<dialog class="ocker-dialog" aria-label="${text.paste}"><h2>${text.paste}</h2><div class="ocker-dialog-content ocker-form"><label class="ocker-field">${text.documentTitle??'Document title'}<input data-paste="title" value="${text.pastedDocument??'Pasted document'}"></label><label class="ocker-field">${text.documentType}<select data-paste="kind"><option value="affidavit">${text.affidavit}</option><option value="order">${text.order}</option><option value="report">${text.report}</option></select></label><label class="ocker-field">${text.documentText??'Document text'}<div class="ocker-rich-input" contenteditable="true" role="textbox" aria-label="${text.documentText??'Document text'}" aria-multiline="true"></div></label><p>${text.pasteGuidance??'Paste from Word or another editor. Formatting is kept in the source asset; chronology building uses the text.'}</p></div><footer class="ocker-dialog-footer"><button type="button" data-paste="cancel">${text.cancel}</button><button type="button" data-paste="add" class="ocker-primary">${text.addDocument}</button></footer></dialog>`;
    document.body.append(host);const dialog=host.querySelector('dialog'),editor=host.querySelector('[contenteditable]');let originalHtml=null;
    editor.addEventListener('paste',event=>{event.preventDefault();const text=event.clipboardData.getData('text/plain'),html=event.clipboardData.getData('text/html');editor.textContent=text;originalHtml=html||null;});
    editor.addEventListener('input',()=>{originalHtml=null;});
    const close=()=>{dialog.close();host.remove();};dialog.addEventListener('cancel',event=>{event.preventDefault();close();});host.querySelector('[data-paste="cancel"]').onclick=close;
    host.querySelector('[data-paste="add"]').onclick=()=>{const title=host.querySelector('[data-paste="title"]').value.trim()||(text.pastedDocument??'Pasted document'),kind=host.querySelector('[data-paste="kind"]').value,text=editor.textContent??'',html=originalHtml;close();void run(async signal=>{const item=html?await parseRichText(html,{title:title+'.html',kind,signal,onProgress}):await parseText(text,{title:title+'.txt',kind,signal,onProgress});documents.push(item);showQueue();},text.documentsAdded);};
    dialog.showModal();editor.focus();
  });
  $('[data-action="build"]').addEventListener('click',()=>run(async signal=>{if(!documents.length)throw new Error('Add at least one document first.');const llm=provider();$('[data-step="connect"]').classList.add('is-complete');const options={title:defaultRecord?text.importedTitle:record.title,llm,locale,...credentials(),signal,onProgress};const extracted=await (state.buildChronology??buildChronology)(documents,options);$('[data-step="build"]').classList.add('is-complete');const next=await (state.findRelationships??findRelationships)(extracted,options);await verifyAssets(next,{signal});update(next);$('[data-step="relate"]').classList.add('is-complete');}));
  $('[data-action="cancel"]').addEventListener('click',()=>controller?.abort());
  $('[data-action="intermediate"]').addEventListener('click',()=>{if(!documents.length){progress.textContent='Add a document or load the example first.';return;}const blob=new Blob([JSON.stringify(documents,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='documents.ocker-intermediate.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
  refreshSetup();
  // Only seed a new demo. Language changes and host-supplied records keep their state.
  if(state.autoLoadExample&&!configuration.record&&!documents.length)void loadExample();
  function dispose(){responsive.disconnect();controller?.abort();reviewActions.destroy();code.destroy();editor.destroy();providers.destroy();view.destroy();root.remove();}
  return {getRecord:()=>view.getRecord(),setRecord:update,destroy:dispose};
}
