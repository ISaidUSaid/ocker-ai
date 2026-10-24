// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {exportRecord} from '../src/model.js';
import {exportVisual} from '../src/ui.js';

export function mountReviewActions(container,{getRecord}) {
  const actions=document.createElement('div');actions.className='ocker-review-actions';
  const status=document.createElement('p');status.setAttribute('role','status');status.hidden=true;
  for(const [label,format]of [['Save JSON','json'],['Export PNG','png'],['Export PDF','pdf']]) {
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',async()=>{
      button.disabled=true;status.hidden=true;
      try {
        const record=getRecord();
        if(format==='json') {
          const url=URL.createObjectURL(new Blob([exportRecord(record)],{type:'application/vnd.ocker+json'}));
          const link=document.createElement('a');link.href=url;link.download='chronology.ocker.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        } else {
          const stage=container.closest('.demo, .ocker-workbench')?.querySelector('.ocker-stage');
          if(!stage)throw new Error('Open a chronology before exporting.');
          await exportVisual(stage,format,record.title);
        }
      } catch(error) { status.textContent=error.message;status.hidden=false; }
      finally { button.disabled=false; }
    });actions.append(button);
  }
  actions.append(status);container.prepend(actions);
  return {destroy(){actions.remove();}};
}
const languages={js:'JavaScript',angular:'Angular',react:'React',node:'Node + Angular',java:'Java / JavaFX',csharp:'C# / Avalonia'};
export function integrationCode(language='js',theme='glass') {
  theme=theme==='none'?'none':'glass';
  const examples={
js:`import {parseRecord, mountChronology, parseDocument, buildChronology, findRelationships,
  createOpenAICompatibleAdapter} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

const record = parseRecord(await file.text());
const view = mountChronology(container, record, {
  theme: '${theme}',
  onChange: next => saveInYourApplication(next),
  onError: error => showError(error.message)
});

// Building is optional. Supply your own provider settings at runtime.
const document = await parseDocument(documentFile, {kind: 'affidavit'});
const llm = createOpenAICompatibleAdapter({endpoint, model, apiKey});
const extracted = await buildChronology([document], {llm, signal});
view.setRecord(await findRelationships(extracted, {llm, signal}));
// When the host unmounts: view.destroy();`,
angular:`import {Component} from '@angular/core';
import {OckerChronologyComponent} from '@ocker-ai/angular';
import {createRecord} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

@Component({
  selector: 'matter-chronology',
  standalone: true,
  imports: [OckerChronologyComponent],
  template: \`<ocker-chronology [record]="record" [options]="options"
    (recordChange)="record = $event" />\`
})
export class MatterChronology {
  record = createRecord('Matter chronology');
  options = {theme: '${theme}' as const};
}
// Enable Angular animations in the host application.
// The component uses BreakpointObserver for its device view.`,
react:`import {useState} from 'react';
import {OckerChronology} from '@ocker-ai/react';
import {createRecord} from '@ocker-ai/core';
import '@ocker-ai/core/styles.css';

export function MatterChronology() {
  const [record, setRecord] = useState(() => createRecord('Matter chronology'));
  return <OckerChronology record={record} onChange={setRecord}
    theme="${theme}" animate={true} />;
}`,
node:`// Node backend: use the RI's bounded PDF/build/relationship routes.
import {createApp} from './ri/node.js/src/server.js';
const app = createApp({providerOrigins: [providerOrigin]});
app.listen(3000, '127.0.0.1');

// Angular front end: provider keys belong to the operation, not the record.
const response = await fetch('/api/records/build', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({intermediates, provider: {endpoint, model, apiKey}})
});
const {record} = await response.json();

// Embed with OckerChronologyComponent:
// <ocker-chronology [record]="record" [options]="{theme: '${theme}'}"
//   (recordChange)="record = $event" />`,
java:`var view = new ChronologyView(record, ChronologyViewOptions.builder()
    .theme(ChronologyViewOptions.Theme.${theme==='glass'?'GLASS':'NONE'})
    .onChange(next -> saveInYourApplication(next))
    .onError(error -> showError(error))
    .build());

var options = OckerOptions.builder()
    .llm(new OpenAICompatibleAdapter(endpoint, model, key))
    .onProgress(progress -> showProgress(progress))
    .cancellation(() -> cancelled.get())
    .build();
var document = Ocker.parseDocument(path, documentId, title, "affidavit", options);
var next = Ocker.buildChronology(Ocker.createRecord(title), document, options);
// Set the record on the JavaFX application thread.
Platform.runLater(() -> view.setRecord(next));`,
csharp:`var view = new ChronologyView {
    Record = record,
    Options = new ChronologyViewOptions {
        Theme = "${theme}",
        OnChange = next => SaveInYourApplication(next),
        OnError = error => ShowError(error)
    }
};

var options = new OckerOptions {
    CompletionAdapter = new OpenAiCompatibleAdapter(httpClient, endpoint, model, apiKey),
    OnProgress = progress => ShowProgress(progress)
};
var document = await Ocker.ParsePdfAsync(stream, documentId, title, "affidavit",
    options: options, cancellationToken: cancellationToken);
var events = await Ocker.BuildChronologyAsync(document, options, cancellationToken);
// The host adds the returned document, asset and events to its record.`};
  return examples[language]??examples.js;
}
export function mountCodeDisclosure(container,{language='js',theme=()=>'glass'}={}) {
  const details=document.createElement('details');details.className='ocker-code-disclosure';
  const summary=document.createElement('summary');summary.textContent='Show code';
  const tools=document.createElement('div');tools.className='ocker-code-tools';
  const label=document.createElement('label');label.append('Reference implementation ');
  const select=document.createElement('select');select.setAttribute('aria-label','Reference implementation');
  for(const [value,text]of Object.entries(languages)){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=language;
  label.append(select);const copy=document.createElement('button');copy.type='button';copy.textContent='Copy code';
  const status=document.createElement('span');status.className='ocker-code-status';status.setAttribute('role','status');
  const pre=document.createElement('pre'),code=document.createElement('code');pre.append(code);tools.append(label,copy,status);details.append(summary,tools,pre);container.append(details);
  const refresh=()=>{code.textContent=integrationCode(select.value,typeof theme==='function'?theme():theme);};
  details.addEventListener('toggle',()=>{summary.textContent=details.open?'Hide code':'Show code';if(details.open)refresh();});select.addEventListener('change',refresh);
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code.textContent);status.textContent='Copied';}catch{const range=document.createRange();range.selectNodeContents(code);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Code selected—copy with your keyboard.';}});
  refresh();return {refresh,destroy(){details.remove();}};
}
