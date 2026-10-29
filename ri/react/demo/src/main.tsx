// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from 'react';
import { THEME_NAMES, buildChronology, createProviderAdapter, createRecord, findRelationships, parseDocument, parseRecord, parseRichText, parseText, type Intermediate, type OckerRecord, type ThemeName } from '@ocker-ai/core';
import { mountCodeDisclosure, mountReviewActions } from '@ocker-ai/core/demo/code';
import { mountRecordEditor } from '@ocker-ai/core/demo/editor';
import { mountProviderShortcuts } from '@ocker-ai/core/demo/providers';
import { confirmPdfDocuments } from '@ocker-ai/core/demo/documents';
import { browserLocale, chronologyLabels, demoText, DEMO_LOCALES } from '@ocker-ai/core/demo/locales';
import { OckerChronology } from '@ocker-ai/react';
const workerSrc = new URL('assets/pdf.worker.min.mjs', document.baseURI).href;
import './style.css';

function App() {
  const [record, setRecord] = useState(createRecord('React chronology'));
  const [theme, setTheme] = useState<ThemeName>('glass');
  const [locale, setLocale] = useState(() => browserLocale());
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
  const text=demoText(locale);
  themeRef.current = theme;
  recordRef.current = record;
  useEffect(() => {
    if (!codeHost.current) return;
    codeDisclosure.current = mountCodeDisclosure(codeHost.current, { language: 'react', theme: () => themeRef.current, labels:text });
    return () => codeDisclosure.current?.destroy();
  }, [locale]);
  useEffect(() => {
    if (!editorHost.current || !providerHost.current) return;
    const reviewActions=mountReviewActions(editorHost.current,{getRecord:()=>recordRef.current,labels:text});
    recordEditor.current = mountRecordEditor(editorHost.current, { getRecord: () => recordRef.current, onApply: next => { recordRef.current=next; setRecord(next); setDocuments(intermediatesFor(next)); setProgress('Edited OCKER record applied.'); }, theme: () => themeRef.current,labels:text });
    providerShortcuts.current = mountProviderShortcuts(providerHost.current, { labels:text,onSelect: preset => setProvider(current => ({ ...current, protocol:preset.protocol, endpoint:preset.endpoint, apiKey:'' })) });
    return () => { reviewActions.destroy(); recordEditor.current?.destroy(); providerShortcuts.current?.destroy(); };
  }, [locale]);
  useEffect(() => { codeDisclosure.current?.refresh(); }, [theme]);
  async function upload(files: FileList | null) { if (files) await queueDocuments(files); }
  async function queueDocuments(files: FileList | File[]) { if (!files.length) return; const confirmed = await confirmPdfDocuments(files, { theme,labels:text }); if (!confirmed) return; setWorking(true); const next = [...documents]; try { for (const { file, kind } of confirmed) { setProgress(`${text.reading} ${file.name}…`); next.push(await parseDocument(file, { workerSrc, kind, signal: controller.current?.signal, onProgress: item => setProgress(item.detail) })); } setDocuments(next); setProgress(`${next.length} ${text.documentsReady}`); } catch (error) { setProgress(error instanceof Error ? error.message : text.importFailed); } finally { setWorking(false); } }
  function capturePaste(event: ReactClipboardEvent<HTMLDivElement>) { event.preventDefault(); richPaste.current=event.clipboardData.getData('text/html'); event.currentTarget.textContent=(event.currentTarget.textContent ?? '')+event.clipboardData.getData('text/plain'); }
  async function addPasted() { const value=pasteBox.current?.textContent?.trim(); if (!value) return; setWorking(true); try { const item=richPaste.current ? await parseRichText(richPaste.current, {title:'Pasted rich text.html',kind:'report'}) : await parseText(value, {title:'Pasted text.txt',kind:'report'}); setDocuments(current => [...current,item]); if (pasteBox.current) pasteBox.current.textContent=''; richPaste.current=''; setProgress(text.documentsReady); } catch (error) { setProgress(error instanceof Error ? error.message : text.pasteFailed); } finally { setWorking(false); } }
  function adapter() { return createProviderAdapter(provider); }
  function chooseLocale(value:string) { const url=new URL(window.location.href);url.searchParams.set('lang',value);window.history.replaceState(null,'',url);setLocale(value); }
  async function build() { controller.current = new AbortController(); setWorking(true); try { const extracted = await buildChronology(documents, { llm:adapter(), locale, title:record.title, signal:controller.current.signal, onProgress:item => setProgress(item.detail) }); setProgress(text.findingRelationships); const next = await findRelationships(extracted, { llm:adapter(), locale, signal:controller.current.signal, onProgress:item => setProgress(item.detail) }); recordRef.current=next; setRecord(next); setProgress(text.built); } catch (error) { setProgress(error instanceof Error ? error.message : text.buildFailed); } finally { setWorking(false); } }
  function importRecord(file: File | undefined) { if (!file) return; file.text().then(json => { const next=parseRecord(json); recordRef.current=next; setRecord(next); setDocuments(intermediatesFor(next)); setProgress(text.recordImported); }).catch(error => setProgress(error.message)); }
  async function loadExample() { const next=parseRecord(await (await fetch('/assets/examples/joe-jill.ocker.json')).text()); recordRef.current=next; setRecord(next); setDocuments(intermediatesFor(next)); setProgress(text.exampleLoaded); }
  return <main className={`demo demo--${theme}`} data-ocker-theme={theme}><header className="demo__hero"><a href={`https://ocker.ai/${locale}/`} style={{gridColumn:1,gridRow:"1 / 3",justifySelf:"start"}}><img className="demo__wordmark" src="/assets/ocker-wordmark.png" alt="OCKER"/></a><p className="demo__eyebrow">{text.acronym}</p><h1>{text.acronym} <span>{text.tagline}</span></h1><p>{text.intro}</p><label className="demo__locale">{text.language}<select value={locale} onChange={event=>chooseLocale(event.target.value)}>{DEMO_LOCALES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></header><section className="demo__journey"><section className="demo__controls" aria-label="Chronology controls"><h2>{text.start}</h2><p className="demo__start-help">{text.startHelp}</p><label className="demo__upload">{text.addDocuments} <input type="file" multiple accept=".pdf,.docx,.rtf,.txt,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/plain,text/html" onChange={e => upload(e.target.files)}/></label><details className="demo__paste"><summary>{text.paste}</summary><label>{text.pasteRichText} <div ref={pasteBox} className="demo__pastebox" contentEditable role="textbox" aria-multiline="true" aria-label={text.pasteHint} onPaste={capturePaste} onInput={() => { richPaste.current=''; }}/></label><button type="button" onClick={addPasted}>{text.addDocuments}</button></details><label className="demo__upload">{text.importFile} <input type="file" accept="application/json,.ocker.json" onChange={e => importRecord(e.target.files?.[0])}/></label><p className="demo__example">{text.example} <button className="demo__sample" type="button" onClick={loadExample}>{text.loadExample}</button></p></section><section className="demo__records"><h2>{text.review}</h2><div ref={editorHost}/><div className="demo__code" ref={codeHost}/></section><section className="demo__provider"><h2>{text.provider}</h2><details className="demo__configure"><summary>{text.configure}</summary><label>{text.theme} <select value={theme} onChange={event => setTheme(event.target.value as ThemeName)}>{THEME_NAMES.map(name => <option key={name} value={name}>{text[name]}</option>)}</select></label><div ref={providerHost}/><label>{text.model} <input value={provider.model} onChange={e => setProvider({...provider,model:e.target.value})}/></label><label>{text.apiKey} <input type="password" value={provider.apiKey} onChange={e => setProvider({...provider,apiKey:e.target.value})}/></label><details className="demo__advanced"><summary>{text.advancedProvider}</summary><label>{text.protocol} <select value={provider.protocol} onChange={e => setProvider({...provider,protocol:e.target.value as 'openai'|'anthropic'})}><option value="openai">OpenAI-compatible</option><option value="anthropic">Anthropic</option></select></label><label>{text.endpoint} <input value={provider.endpoint} onChange={e => setProvider({...provider,endpoint:e.target.value})} placeholder="https://provider.example/v1/chat/completions"/></label></details></details><p className="demo__provider-notice">{text.notice}</p><div><button type="button" disabled={!documents.length||working} onClick={build}>{text.build}</button><button type="button" disabled={!working} onClick={() => controller.current?.abort()}>{text.cancel}</button></div></section></section><p className="demo__status" aria-live="polite"><strong>{text.next}</strong> {nextStep(documents.length, record.events.length, provider, working, text)} <span>{progress}</span></p><OckerChronology record={record} onChange={next => { recordRef.current=next; setRecord(next); }} theme={theme} locale={locale} labels={chronologyLabels(locale)}/></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

function nextStep(documentCount: number, eventCount: number, provider: {endpoint: string; model: string; apiKey: string}, working: boolean, text: Record<string,string>) { if (working) return text.working; if (eventCount) return text.reviewReady; if (!documentCount) return text.addOrOpen; if (!provider.endpoint.trim()) return text.chooseProvider; if (!provider.model.trim()) return text.enterModel; if (!isLoopback(provider.endpoint) && !provider.apiKey.trim()) return text.enterKey; return text.readyBuild; }

function isLoopback(endpoint: string) { return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(endpoint); }

function intermediatesFor(record: OckerRecord): Intermediate[] { return record.documents.map(document => { const asset=record.assets.find(item => item.id===document.assetId); return { format:'ocker-document', version:'0.1.0', document, ...(asset ? {asset} : {}) }; }); }
