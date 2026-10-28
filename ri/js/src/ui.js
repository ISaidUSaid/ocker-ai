// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {assertRecord,clone,formatDate,saveNote,saveAuthority,deleteAnnotation,exportRecord,base64ToBytes,verifyAssetsSync,sha256} from './model.js';
const palette={blue:'#b7d9e8',lavender:'#d6c9e5',mint:'#c3dfcf',peach:'#ecd0bb',slate:'#c5d1d7'};
const svgNS='http://www.w3.org/2000/svg';
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
function button(label,action,className=''){const b=el('button',className,label);b.type='button';b.addEventListener('click',action);return b;}
function download(bytes,type,name){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function mountChronology(element,initial,configuration={}) {
  let record=clone(verifyAssetsSync(assertRecord(initial))),options={animate:true,showToolbar:true,theme:'glass',...configuration};
  let zoom=1,query='',status='',documentId='',selected=null,destroyed=false,mobile=!!options.mobile;
  let drag=null,ghost=null,dragFrame=0,observer;const dialogs=new Set(),controllers=new Set();
  const root=el('section','ocker-root '+(options.className??''));root.setAttribute('aria-label','OCKER chronology');element.appendChild(root);
  const toolbar=el('div','ocker-toolbar'),board=el('div','ocker-board'),stage=el('div','ocker-stage');stage.append(board);root.append(toolbar,stage);
  const t=(key,fallback)=>options.labels?.[key]??fallback;
  const dispensers=el('div','ocker-dispensers');root.append(dispensers);
  const notePad=button(t('addNote','Add note'),()=>{},'ocker-note-pad'),flagPad=button(t('addAuthority','Add precedent'),()=>{},'ocker-flag-pad');
  notePad.setAttribute('aria-label',t('dragNote','Drag a note onto an event'));flagPad.setAttribute('aria-label',t('dragAuthority','Drag a precedent onto an event'));
  dispensers.append(flagPad,notePad);
  function error(e){options.onError?.(e);const box=modal(t('error','Something needs attention'));box.content.append(el('p','',e.message));}
  function change(next){record=clone(verifyAssetsSync(assertRecord(next)));render();options.onChange?.(clone(record));root.dispatchEvent(new CustomEvent('ocker:change',{detail:clone(record),bubbles:true}));}
  function currentAuthor(){return options.authorId?{authorId:options.authorId}:{};}
  function modal(title){
    const dialog=el('dialog','ocker-dialog');const heading=el('h2','',title);heading.id='ocker-dialog-'+crypto.randomUUID();dialog.setAttribute('aria-labelledby',heading.id);
    const content=el('div','ocker-dialog-content'),footer=el('footer','ocker-dialog-footer');dialog.append(heading,content,footer);root.append(dialog);dialogs.add(dialog);
    const close=()=>{dialog.close();dialog.remove();dialogs.delete(dialog);};footer.append(button(t('close','Close'),close));dialog.addEventListener('cancel',()=>close());dialog.showModal();return {dialog,content,footer,close};
  }
  function input(form,label,value='',type='text',required=false){const l=el('label','ocker-field');l.append(el('span','',label));const node=el(type==='textarea'?'textarea':'input');if(type!=='textarea')node.type=type;node.value=value;node.required=required;l.append(node);form.append(l);return node;}
  function select(form,label,values,value){const l=el('label','ocker-field');l.append(el('span','',label));const node=el('select');for(const [key,text]of values){const option=el('option','',text);option.value=key;node.append(option);}node.value=value;l.append(node);form.append(l);return node;}
  function noteEditor(eventId,existing,position={x:40,y:100}){
    if(options.readOnly)return;
    const box=modal(existing?t('editNote','Edit note'):t('addNote','Add note'));const form=el('form','ocker-form');
    const body=input(form,t('noteText','Your note'),existing?.body??'','textarea',true);body.maxLength=20000;
    const save=el('button','ocker-primary',t('saveNote','Save note'));save.type='submit';form.append(save);box.content.append(form);
    form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;try{change(saveNote(record,{...existing,...currentAuthor(),eventId,body:body.value,position:existing?.position??position}));box.close();}catch(e){error(e);}});
    if(existing)box.footer.prepend(button(t('delete','Delete'),()=>{change(deleteAnnotation(record,existing.id));box.close();},'ocker-danger'));body.focus();
  }
  function authorityEditor(eventId,existing){
    if(options.readOnly)return;
    const box=modal(existing?t('editAuthority','Edit precedent'):t('addAuthority','Add precedent'));const form=el('form','ocker-form ocker-form-grid');
    const title=input(form,t('authorityTitle','Authority title'),existing?.title??'','text',true),citation=input(form,t('citation','Citation'),existing?.citation??'','text',true);
    const type=select(form,t('authorityType','Authority type'),[['binding','Binding'],['persuasive','Persuasive'],['unspecified','Not specified']],existing?.type??'unspecified');
    const color=select(form,t('colour','Flag colour'),Object.keys(palette).map(k=>[k,k[0].toUpperCase()+k.slice(1)]),existing?.color??'blue');
    const pinpoint=input(form,t('pinpoint','Pinpoint reference'),existing?.pinpoint??''),court=input(form,t('court','Court'),existing?.court??''),jurisdiction=input(form,t('jurisdiction','Jurisdiction'),existing?.jurisdiction??''),sourceUrl=input(form,t('sourceUrl','Source URL'),existing?.sourceUrl??'','url'),body=input(form,t('application','Application to this event'),existing?.body??'','textarea');
    const save=el('button','ocker-primary',t('saveAuthority','Save precedent'));save.type='submit';form.append(save);box.content.append(form);
    form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;try{const value={...existing,...currentAuthor(),eventId,title:title.value,citation:citation.value,type:type.value,color:color.value};for(const [k,v]of Object.entries({pinpoint,court,jurisdiction,sourceUrl,body})){if(v.value.trim())value[k]=v.value.trim();else delete value[k];}change(saveAuthority(record,value));box.close();}catch(e){error(e);}});
    if(existing)box.footer.prepend(button(t('delete','Delete'),()=>{change(deleteAnnotation(record,existing.id));box.close();},'ocker-danger'));title.focus();
  }
  function authorityReader(a){const box=modal(a.title);box.content.append(el('strong','',a.citation),el('p','',[a.type,a.court,a.jurisdiction,a.pinpoint].filter(Boolean).join(' · ')),el('p','',a.body??''));if(a.sourceUrl&&/^https?:\/\//.test(a.sourceUrl)){const link=el('a','',t('viewSource','View authority source'));link.href=a.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';box.content.append(link);}if(!options.readOnly)box.footer.prepend(button(t('edit','Edit'),()=>{box.close();authorityEditor(a.eventId,a);}));}
  function notesReader(eventId){const box=modal(t('notes','Notes'));for(const n of record.notes.filter(n=>n.eventId===eventId)){const item=el('article','ocker-note-summary');item.append(el('p','',n.body));if(!options.readOnly)item.append(button(t('edit','Edit'),()=>{box.close();noteEditor(eventId,n);}));box.content.append(item);}if(!options.readOnly)box.footer.prepend(button(t('addNote','Add note'),()=>{box.close();noteEditor(eventId);}));}
  function sourceReader(e){
    const box=modal(t('sourceEvidence','Source evidence'));
    for(const s of e.sources){const doc=record.documents.find(d=>d.id===s.documentId);const p=doc?.paragraphs.find(p=>p.id===s.paragraphId);const item=el('article','ocker-source');item.append(el('h3','',doc?.title??s.documentId),el('p','ocker-meta',`Page ${s.page??p?.page??'—'} · Paragraph ${p?.label??s.paragraphId??'—'}`),el('blockquote','',s.quote??p?.text??''));
      const asset=record.assets.find(a=>a.id===(s.assetId??doc?.assetId));
      if(asset?.derivedFrom)item.append(el('p','ocker-meta','Derived asset · source: '+(record.assets.find(a=>a.id===asset.derivedFrom)?.name??asset.derivedFrom)));
      if(asset?.data){const url=URL.createObjectURL(new Blob([base64ToBytes(asset.data)],{type:asset.mediaType}));box.dialog.addEventListener('close',()=>URL.revokeObjectURL(url),{once:true});
        if(asset.mediaType.startsWith('image/')){const image=el('img','ocker-evidence-image');image.src=url;image.alt=asset.name;item.append(image);}
        if(asset.mediaType.startsWith('video/')){const video=el('video','ocker-evidence-video');video.src=url;video.controls=true;if(s.selector?.kind==='time')video.addEventListener('loadedmetadata',()=>{video.currentTime=(s.selector.start??0)/1000;},{once:true});item.append(video);}
        item.append(button(asset.derivedFrom?t('downloadDerived','Download derived asset'):t('downloadOriginal','Download original evidence'),()=>download(base64ToBytes(asset.data),asset.mediaType,asset.name)));item.append(el('small','ocker-hash','SHA-256: '+asset.sha256));
      }else if(asset?.uri){
        item.append(el('p','',t('externalEvidence','External evidence is referenced but has not been fetched.')));
        if(options.assetResolver){const resolve=button(t('resolveEvidence','Load referenced evidence'),async()=>{resolve.disabled=true;try{const bytes=await options.assetResolver(clone(asset));if(bytes.byteLength!==asset.byteLength||await sha256(bytes)!==asset.sha256)throw new Error('Evidence integrity check failed: '+asset.id);item.append(button(t('downloadOriginal','Download original evidence'),()=>download(bytes,asset.mediaType,asset.name)));resolve.remove();}catch(e){resolve.disabled=false;error(e);}});item.append(resolve);}
      }
      if(options.onSourceClick)item.append(button(t('sourceCallback','Open in host application'),()=>options.onSourceClick(clone(s),clone(e))));box.content.append(item);
    }
  }
  function related(e){
    const relationships=record.relationships.filter(r=>r.from===e.id||r.to===e.id);const linked=new Set([e.id,...relationships.flatMap(r=>[r.from,r.to])]);
    const box=modal(t('relatedEvents','Related events'));box.dialog.classList.add('ocker-web-dialog');
    const web=el('div','ocker-web');box.content.append(web);const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('class','ocker-web-lines');web.append(svg);
    const nodes=new Map();
    for(const event of record.events.filter(x=>linked.has(x.id))){const article=card(event,record.events.indexOf(event),true);web.append(article);nodes.set(event.id,article);}
    const legend=el('p','ocker-legend','Solid teal: supports · Dashed red: contradicts');box.content.prepend(legend);
    const paint=()=>{svg.replaceChildren();const bounds=web.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${web.scrollHeight}`);svg.style.height=web.scrollHeight+'px';for(const relation of relationships){const a=nodes.get(relation.from)?.getBoundingClientRect(),b=nodes.get(relation.to)?.getBoundingClientRect();if(!a||!b)continue;const line=document.createElementNS(svgNS,'path');const x1=a.left-bounds.left+a.width/2,y1=a.top-bounds.top+a.height/2,x2=b.left-bounds.left+b.width/2,y2=b.top-bounds.top+b.height/2;line.setAttribute('d',`M ${x1} ${y1} C ${x1} ${y1+50}, ${x2} ${y2-50}, ${x2} ${y2}`);line.setAttribute('class','ocker-edge ocker-edge-'+relation.type);svg.append(line);}};
    const resize=new ResizeObserver(paint);resize.observe(web);box.dialog.addEventListener('close',()=>resize.disconnect(),{once:true});requestAnimationFrame(paint);
    for(const r of relationships){const detail=el('details','ocker-relation-detail');const sum=el('summary','',`${r.type}: ${record.events.find(candidate=>candidate.id===(r.from===e.id?r.to:r.from))?.title??''}`);detail.append(sum,el('p','',r.rationale),button(t('goTo','Go to event'),()=>{box.close();const id=r.from===e.id?r.to:r.from;root.querySelector(`[data-event-id="${CSS.escape(id)}"]`)?.scrollIntoView({behavior:options.animate?'smooth':'instant',block:'center'});}));box.content.append(detail);}
    if(!mobile&&!options.readOnly){const pads=el('div','ocker-modal-pads');const np=button(t('addNote','Add note'),()=>{},'ocker-note-pad'),fp=button(t('addAuthority','Add precedent'),()=>{},'ocker-flag-pad');np.addEventListener('pointerdown',e=>startDrag(e,{kind:'note'}));fp.addEventListener('pointerdown',e=>startDrag(e,{kind:'authority'}));pads.append(fp,np);box.content.append(pads);}
  }
  function card(e,index,inWeb=false){
    const card=el('article','ocker-card '+(index%2?'ocker-right':'ocker-left'));card.dataset.eventId=e.id;card.tabIndex=0;card.setAttribute('aria-label',e.title);card.style.setProperty('--ocker-local-zoom',inWeb?1:zoom);
    const heading=el('header','ocker-card-header');heading.append(el('p','ocker-date',formatDate(e.date,options.locale)),el('h3','',e.title));card.append(heading);
    if(e.assertedBy)card.append(el('p','ocker-meta',t('accountBy','Account by')+' '+e.assertedBy));
    card.append(el('span','ocker-status ocker-status-'+(e.status??'unresolved'),e.status==='agreed'?t('commonGround','Common ground'):e.status??'unresolved'),el('p','ocker-summary',e.summary));
    const actions=el('div','ocker-actions');
    if(e.sources.length)actions.append(button(t('evidence','Source evidence'),()=>sourceReader(e),'ocker-source-button'));
    const rel=record.relationships.filter(r=>r.from===e.id||r.to===e.id);
    if(rel.length){const relatedButton=button(t('related','Related')+` (${rel.length})`,()=>related(e));relatedButton.title=t('relatedHint','View linked accounts and their reasons');actions.append(relatedButton);}
    if(mobile&&!options.readOnly){actions.append(button(t('addAuthority','Add precedent'),()=>authorityEditor(e.id)),button(t('addNote','Add note'),()=>noteEditor(e.id)));}
    card.append(actions);
    const notes=record.notes.filter(n=>n.eventId===e.id);
    if(mobile&&notes.length)card.append(button('▱ '+notes.length,()=>notesReader(e.id),'ocker-mini-note'));
    if(!mobile)for(const note of notes){const paper=el('aside','ocker-note');paper.style.left=note.position.x-120+'px';paper.style.top=note.position.y-14+'px';paper.dataset.noteId=note.id;const pin=button('●',()=>{},'ocker-pin');pin.setAttribute('aria-label',t('dragNote','Drag note by its pin'));if(!options.readOnly)pin.addEventListener('pointerdown',event=>startDrag(event,{kind:'note',note}));paper.append(pin,el('p','ocker-note-body',note.body));if(!options.readOnly){const tools=el('div','ocker-note-tools');tools.append(button('✎',()=>noteEditor(e.id,note)),button('×',()=>change(deleteAnnotation(record,note.id))));tools.children[0].setAttribute('aria-label','Edit note');tools.children[1].setAttribute('aria-label','Delete note');paper.append(tools);}card.append(paper);}
    const flags=el('div','ocker-authorities');for(const authority of record.authorities.filter(a=>a.eventId===e.id)){const flag=button(authority.citation,()=>authorityReader(authority),'ocker-authority');flag.style.setProperty('--ocker-flag-color',palette[authority.color]);flag.title=authority.title;flags.append(flag);}card.append(flags);
    card.addEventListener('click',event=>{if(event.target.closest('button,a,input,select,textarea'))return;options.onEventClick?.(clone(e));selected=e.id;root.querySelectorAll('.ocker-note').forEach(note=>{const a=card.getBoundingClientRect(),b=note.getBoundingClientRect();note.classList.toggle('ocker-read-through',a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top);});});
    card.addEventListener('keydown',event=>{if(event.target!==card)return;if(['Enter',' '].includes(event.key)){event.preventDefault();card.click();}});
    return card;
  }
  function render(){
    if(destroyed)return;root.classList.toggle('ocker-mobile',mobile);root.classList.toggle('ocker-readonly',!!options.readOnly);root.classList.toggle('ocker-no-motion',!options.animate);
    root.classList.toggle('ocker-theme-glass',options.theme==='glass');
    for(const [key,value]of Object.entries({...((typeof options.theme==='object'&&options.theme)||{}),...(options.themeVariables??{})}))root.style.setProperty(key.startsWith('--ocker-')?key:'--ocker-'+key,value);
    toolbar.hidden=!options.showToolbar;const focusKey=document.activeElement?.dataset?.ockerControl;const focusSelection=document.activeElement?.selectionStart;
    toolbar.replaceChildren();const search=el('input');search.type='search';search.placeholder=t('search','Search events');search.setAttribute('aria-label',t('search','Search events'));search.value=query;search.dataset.ockerControl='search';search.addEventListener('input',()=>{query=search.value;render();});toolbar.append(search);
    const sf=el('select');sf.setAttribute('aria-label',t('filterStatus','Filter status'));for(const val of ['', 'alleged','agreed','disputed','unresolved']){const option=el('option','',val==='agreed'?t('commonGround','Common ground'):val||t('allStatuses','All statuses'));option.value=val;sf.append(option);}sf.value=status;sf.addEventListener('change',()=>{status=sf.value;render();});toolbar.append(sf);
    const df=el('select');df.setAttribute('aria-label',t('filterDocument','Filter document'));const all=el('option','',t('allDocuments','All documents'));all.value='';df.append(all);for(const doc of record.documents){const option=el('option','',doc.title);option.value=doc.id;df.append(option);}df.value=documentId;df.addEventListener('change',()=>{documentId=df.value;render();});toolbar.append(df);
    toolbar.append(button('−',()=>{zoom=Math.max(.5,+(zoom-.1).toFixed(1));render();}),el('output','ocker-zoom',Math.round(zoom*100)+'%'),button('+',()=>{zoom=Math.min(1.5,+(zoom+.1).toFixed(1));render();}),button(t('exportJson','Export OCKER'),()=>download(exportRecord(record),'application/vnd.ocker+json','chronology.ocker.json')),button('PNG',()=>exportVisual(stage,'png',record.title).catch(error)),button('PDF',()=>exportVisual(stage,'pdf',record.title).catch(error)));
    board.style.zoom=String(zoom);board.replaceChildren();const title=el('header','ocker-board-heading');title.append(el('span','ocker-eyebrow','OCKER · OPEN CHRONOLOGY, KNOWLEDGE AND EVIDENCE RECORD'),el('h2','',record.title));board.append(title);
    const events=record.events.filter(e=>(!query||(e.title+' '+e.summary+' '+(e.assertedBy??'')).toLowerCase().includes(query.toLowerCase()))&&(!status||e.status===status)&&(!documentId||e.sources.some(s=>s.documentId===documentId))).sort((a,b)=>(a.date.value??'9999').localeCompare(b.date.value??'9999'));
    board.append(el('p','ocker-count',`${events.length} ${t('of','of')} ${record.events.length} ${t('events','events')}`));
    const cards=el('div','ocker-cards');board.append(cards);events.forEach((e,index)=>{const node=card(e,index);cards.append(node);if(options.animate&&!mobile&&!matchMedia('(prefers-reduced-motion: reduce)').matches)node.animate([{opacity:0,transform:`translateX(${index%2?24:-24}px)`},{opacity:1,transform:'translateX(0)'}],{duration:220,easing:'ease-out'});});
    if(!events.length)cards.append(el('p','ocker-empty',t('empty','No events match this view. Import a chronology or build one from your documents.')));
    const credit=el('footer','ocker-credit','OCKER · Portable chronology and evidence · Apache 2.0');board.append(credit);
    if(focusKey){const node=toolbar.querySelector(`[data-ocker-control="${focusKey}"]`);node?.focus();if(focusSelection!==null&&focusSelection!==undefined)try{node.setSelectionRange(focusSelection,focusSelection);}catch{}}
  }
  function startDrag(event,value){
    if(options.readOnly||mobile||event.button!==0)return;event.preventDefault();event.stopPropagation();
    drag={...value,x:event.clientX,y:event.clientY};ghost=el('div',value.kind==='authority'?'ocker-drag-flag':'ocker-drag-note',value.kind==='authority'?t('addAuthority','Add precedent'):(value.note?.body??t('addNote','Add note')));ghost.setAttribute('aria-hidden','true');document.body.append(ghost);moveGhost();document.addEventListener('pointermove',moveDrag);document.addEventListener('pointerup',finishDrag,{once:true});document.addEventListener('keydown',escapeDrag);
    const scroll=()=>{if(!drag)return;let target=document.elementFromPoint(drag.x,drag.y);while(target&&target!==document.body){const style=getComputedStyle(target);if(/auto|scroll/.test(style.overflowY)&&target.scrollHeight>target.clientHeight){const r=target.getBoundingClientRect();let dy=drag.y<r.top+64?-14:drag.y>r.bottom-64?14:0;if(dy)target.scrollTop+=dy;break;}target=target.parentElement;}if(!target||target===document.body){if(drag.y<70)window.scrollBy(0,-14);else if(drag.y>innerHeight-70)window.scrollBy(0,14);}dragFrame=requestAnimationFrame(scroll);};dragFrame=requestAnimationFrame(scroll);
  }
  function moveGhost(){if(!ghost||!drag)return;ghost.style.left=drag.x-(drag.kind==='note'?120:70)+'px';ghost.style.top=drag.y-(drag.kind==='note'?14:16)+'px';}
  function moveDrag(event){if(!drag)return;drag.x=event.clientX;drag.y=event.clientY;moveGhost();}
  function clearDrag(){cancelAnimationFrame(dragFrame);document.removeEventListener('pointermove',moveDrag);document.removeEventListener('pointerup',finishDrag);document.removeEventListener('keydown',escapeDrag);ghost?.remove();ghost=null;drag=null;}
  function escapeDrag(event){if(event.key==='Escape')clearDrag();}
  function finishDrag(event){
    const value=drag;if(!value)return;const card=document.elementsFromPoint(event.clientX,event.clientY).map(e=>e.closest?.('.ocker-card')).find(e=>{if(!e||!root.contains(e))return false;const r=e.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;});
    let position,eventId;
    if(card){const r=card.getBoundingClientRect();const factor=r.width/card.offsetWidth;position={x:(event.clientX-r.left)/factor,y:(event.clientY-r.top)/factor};eventId=card.dataset.eventId;}
    clearDrag();if(!card)return;
    try{if(value.kind==='authority')authorityEditor(eventId);else if(value.note)change(saveNote(record,{...value.note,eventId,position}));else noteEditor(eventId,undefined,position);}catch(e){error(e);}
  }
  board.addEventListener('click',event=>{if(!event.target.closest('.ocker-card'))root.querySelectorAll('.ocker-read-through').forEach(note=>note.classList.remove('ocker-read-through'));});
  notePad.addEventListener('pointerdown',event=>startDrag(event,{kind:'note'}));flagPad.addEventListener('pointerdown',event=>startDrag(event,{kind:'authority'}));
  if(options.mobile===undefined){observer=new ResizeObserver(entries=>{const next=entries[0].contentRect.width<740;if(next!==mobile){mobile=next;render();}});observer.observe(element);}
  render();
  return {getRecord:()=>clone(record),setRecord(next){record=clone(verifyAssetsSync(assertRecord(next)));render();},setOptions(next){options={...options,...next};if(next.mobile!==undefined){observer?.disconnect();mobile=next.mobile;}render();},destroy(){destroyed=true;clearDrag();observer?.disconnect();for(const dialog of dialogs){dialog.close();dialog.remove();}for(const controller of controllers)controller.abort();root.remove();}};
}
export async function exportVisual(element,format,title='Chronology') {
  const {toPng}=await import('html-to-image');
  // Capture the filtered, zoomed board. The live view isn't modified for export.
  const png=await toPng(element,{backgroundColor:'#f5f7fa',pixelRatio:2,cacheBust:true,width:Math.max(element.scrollWidth,element.clientWidth),height:Math.max(element.scrollHeight,element.clientHeight),style:{overflow:'visible'},filter:n=>!(n instanceof Element)||!n.matches('.ocker-note-tools,.ocker-pin')});
  if(format==='png'){const response=await fetch(png);download(await response.arrayBuffer(),'image/png','chronology.png');return;}
  const {jsPDF}=await import('jspdf');const image=new Image();image.src=png;await image.decode();
  const width=297,margin=12,usable=width-margin*2,ratio=usable/image.naturalWidth,pageHeight=210,contentHeight=pageHeight-30;
  const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;
  const slicePixels=Math.floor(contentHeight/ratio);
  for(let top=0,page=1;top<image.naturalHeight;top+=slicePixels,page++){
    if(page>1)pdf.addPage();pdf.setFontSize(10);pdf.setTextColor('#163451');pdf.text('OCKER · '+title,margin,10);
    canvas.height=Math.min(slicePixels,image.naturalHeight-top);canvas.getContext('2d').drawImage(image,0,top,canvas.width,canvas.height,0,0,canvas.width,canvas.height);pdf.addImage(canvas.toDataURL('image/png'),'PNG',margin,15,usable,canvas.height*ratio);
    pdf.setFontSize(8);pdf.text(`Open Chronology, Knowledge and Evidence Record · ${page}`,margin,pageHeight-5);
  }
  pdf.save('chronology.pdf');
}
