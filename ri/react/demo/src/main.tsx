// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from 'react';
import { buildChronology, createProviderAdapter, createRecord, findRelationships, parseDocument, parseRecord, parseRichText, parseText, type Intermediate, type OckerRecord } from '@ocker-ai/core';
import { mountCodeDisclosure, mountReviewActions } from '@ocker-ai/core/demo/code';
import { mountRecordEditor } from '@ocker-ai/core/demo/editor';
import { mountProviderShortcuts } from '@ocker-ai/core/demo/providers';
import { confirmPdfDocuments } from '@ocker-ai/core/demo/documents';
import { OckerChronology } from '@ocker-ai/react';
const workerSrc = new URL('assets/pdf.worker.min.mjs', document.baseURI).href;
import './style.css';

function App() {
  const [record, setRecord] = useState(createRecord('React chronology'));
  const [theme, setTheme] = useState<'glass' | 'none'>('glass');
  const [documents, setDocuments] = useState<any[]>([]);
  const [provider, setProvider] = useState<{protocol:'openai'|'anthropic';endpoint:string;model:string;apiKey:string}>({ protocol:'openai', endpoint:'', model:'', apiKey:'' });
  const [progress, setProgress] = useState('Choose a starting point: add documents, open a saved OCKER file, or try the example.');
  const [working, setWorking] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const pasteBox = useRef<HTMLDivElement>(null);
  const editorHost = useRef<HTMLDivElement>(null);
  const providerHost = useRef<HTMLDivElement>(null);
  const recordRef = useRef<OckerRecord>(record);
  const richPaste = useRef('');
  const codeHost = useRef<HTMLDivElement>(null);
  const codeDisclosure = useRef<ReturnType<typeof mountCodeDisclosure> | null>(null);
  const recordEditor = useRef<ReturnType<typeof mountRecordEditor> | null>(null);
  const providerShortcuts = useRef<ReturnType<typeof mountProviderShortcuts> | null>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  recordRef.current = record;
  useEffect(() => {
    if (!codeHost.current) return;
    codeDisclosure.current = mountCodeDisclosure(codeHost.current, { language: 'react', theme: () => themeRef.current });
    return () => codeDisclosure.current?.destroy();
  }, []);
  useEffect(() => {
    if (!editorHost.current || !providerHost.current) return;
    const reviewActions=mountReviewActions(editorHost.current,{getRecord:()=>recordRef.current});
    recordEditor.current = mountRecordEditor(editorHost.current, { getRecord: () => recordRef.current, onApply: next => { recordRef.current=next; setRecord(next); setDocuments(intermediatesFor(next)); setProgress('Edited OCKER record applied.'); }, theme: () => themeRef.current });
    providerShortcuts.current = mountProviderShortcuts(providerHost.current, { onSelect: preset => setProvider(current => ({ ...current, protocol:preset.protocol, endpoint:preset.endpoint, apiKey:'' })) });
    return () => { reviewActions.destroy(); recordEditor.current?.destroy(); providerShortcuts.current?.destroy(); };
  }, []);
  useEffect(() => { codeDisclosure.current?.refresh(); }, [theme]);
  async function upload(files: FileList | null) { if (files) await queueDocuments(files); }
  async function queueDocuments(files: FileList | File[]) { if (!files.length) return; const confirmed = await confirmPdfDocuments(files, { theme }); if (!confirmed) return; setWorking(true); const next = [...documents]; try { for (const { file, kind } of confirmed) { setProgress(`Reading ${file.name}…`); next.push(await parseDocument(file, { workerSrc, kind, signal: controller.current?.signal, onProgress: item => setProgress(item.detail) })); } setDocuments(next); setProgress(`${next.length} document${next.length === 1 ? '' : 's'} ready to build.`); } catch (error) { setProgress(error instanceof Error ? error.message : 'Import failed.'); } finally { setWorking(false); } }
  function capturePaste(event: ReactClipboardEvent<HTMLDivElement>) { event.preventDefault(); richPaste.current=event.clipboardData.getData('text/html'); event.currentTarget.textContent=(event.currentTarget.textContent ?? '')+event.clipboardData.getData('text/plain'); }
  async function addPasted() { const text=pasteBox.current?.textContent?.trim(); if (!text) return; setWorking(true); try { const item=richPaste.current ? await parseRichText(richPaste.current, {title:'Pasted rich text.html',kind:'report'}) : await parseText(text, {title:'Pasted text.txt',kind:'report'}); setDocuments(current => [...current,item]); if (pasteBox.current) pasteBox.current.textContent=''; richPaste.current=''; setProgress('Pasted text is ready to build.'); } catch (error) { setProgress(error instanceof Error ? error.message : 'Paste failed.'); } finally { setWorking(false); } }
  function adapter() { return createProviderAdapter(provider); }
  async function build() { controller.current = new AbortController(); setWorking(true); try { const extracted = await buildChronology(documents, { llm:adapter(), title:record.title, signal:controller.current.signal, onProgress:item => setProgress(item.detail) }); setProgress('Finding relationships…'); const next = await findRelationships(extracted, { llm:adapter(), signal:controller.current.signal, onProgress:item => setProgress(item.detail) }); recordRef.current=next; setRecord(next); setProgress('Chronology built with relationships.'); } catch (error) { setProgress(error instanceof Error ? error.message : 'Build failed.'); } finally { setWorking(false); } }
  function importRecord(file: File | undefined) { if (!file) return; file.text().then(text => { const next=parseRecord(text); recordRef.current=next; setRecord(next); setDocuments(intermediatesFor(next)); setProgress('OCKER record imported.'); }).catch(error => setProgress(error.message)); }
  async function loadExample() { const next=parseRecord(await (await fetch('/assets/examples/joe-jill.ocker.json')).text()); recordRef.current=next; setRecord(next); setDocuments(intermediatesFor(next)); setProgress('Loaded the shared fictional example.'); }
  return <main className={`demo demo--${theme}`}><header className="demo__hero"><img className="demo__wordmark" src="/assets/ocker-wordmark.png" alt="OCKER"/><p className="demo__eyebrow">Open Chronology, Knowledge and Evidence Record</p><h1>Open Chronology, Knowledge and Evidence Record <span>Every account. In its place.</span></h1><p>Start with a document, reopen an OCKER file, or try the example. AI setup is only needed when building from documents.</p></header><section className="demo__journey"><section className="demo__controls" aria-label="Chronology controls"><h2>Start with documents</h2><p className="demo__start-help">Choose one way to begin. You can add more documents at any time.</p><label className="demo__upload">Add documents <input type="file" multiple accept=".pdf,.docx,.rtf,.txt,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/plain,text/html" onChange={e => upload(e.target.files)}/></label><details className="demo__paste"><summary>Paste document</summary><label>Paste rich text <div ref={pasteBox} className="demo__pastebox" contentEditable role="textbox" aria-multiline="true" aria-label="Paste notes or a document excerpt" onPaste={capturePaste} onInput={() => { richPaste.current=''; }}/></label><button type="button" onClick={addPasted}>Add pasted text</button></details><label className="demo__upload">Open saved OCKER file <input type="file" accept="application/json,.ocker.json" onChange={e => importRecord(e.target.files?.[0])}/></label><p className="demo__example">Just want to see an example? <button className="demo__sample" type="button" onClick={loadExample}>Try the Joe and Jill example</button></p></section><section className="demo__records"><h2>Review and share</h2><div ref={editorHost}/><div className="demo__code" ref={codeHost}/></section><section className="demo__provider"><h2>Choose a provider</h2><details className="demo__configure"><summary>Configure provider</summary><label>Theme <select value={theme} onChange={event => setTheme(event.target.value as 'glass' | 'none')}><option value="glass">Glass</option><option value="none">Plain</option></select></label><div ref={providerHost}/><label>Model <input value={provider.model} onChange={e => setProvider({...provider,model:e.target.value})}/></label><label>API key <input type="password" value={provider.apiKey} onChange={e => setProvider({...provider,apiKey:e.target.value})}/></label><details className="demo__advanced"><summary>Advanced provider settings</summary><label>Protocol <select value={provider.protocol} onChange={e => setProvider({...provider,protocol:e.target.value as 'openai'|'anthropic'})}><option value="openai">OpenAI-compatible</option><option value="anthropic">Anthropic</option></select></label><label>Endpoint <input value={provider.endpoint} onChange={e => setProvider({...provider,endpoint:e.target.value})} placeholder="https://provider.example/v1/chat/completions"/></label></details></details><p className="demo__provider-notice">{isLoopback(provider.endpoint) ? 'Build chronology sends document text to your selected provider on this machine.' : 'Build chronology sends document text to your selected provider.'}</p><div><button type="button" disabled={!documents.length||working} onClick={build}>Build chronology</button><button type="button" disabled={!working} onClick={() => controller.current?.abort()}>Cancel</button></div></section></section><p className="demo__status" aria-live="polite"><strong>Next:</strong> {nextStep(documents.length, record.events.length, provider, working)} <span>{progress}</span></p><OckerChronology record={record} onChange={next => { recordRef.current=next; setRecord(next); }} theme={theme}/></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

function nextStep(documentCount: number, eventCount: number, provider: {endpoint: string; model: string; apiKey: string}, working: boolean) { if (working) return 'We are working on your chronology.'; if (eventCount) return 'Review your chronology, add notes, or save your OCKER file. Build again only when you want to regenerate it.'; if (!documentCount) return 'Add documents, open a saved OCKER file, or try the example.'; if (!provider.endpoint.trim()) return 'Choose your AI provider in Configure provider.'; if (!provider.model.trim()) return 'Enter your provider’s model in Configure provider.'; if (!isLoopback(provider.endpoint) && !provider.apiKey.trim()) return 'Enter your API key in Configure provider. It stays in memory.'; return 'Your documents are ready. Choose Build chronology.'; }

function isLoopback(endpoint: string) { return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(endpoint); }

function intermediatesFor(record: OckerRecord): Intermediate[] { return record.documents.map(document => { const asset=record.assets.find(item => item.id===document.assetId); return { format:'ocker-document', version:'0.1.0', document, ...(asset ? {asset} : {}) }; }); }
