// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import { buildChronology, createOpenAICompatibleAdapter, createRecord, findRelationships, parsePdf, parseRecord } from '@ocker-ai/core';
import { OckerChronology } from '@ocker-ai/react';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './style.css';

function App() {
  const [record, setRecord] = useState(createRecord('React chronology'));
  const [theme, setTheme] = useState<'glass' | 'none'>('glass');
  const [documents, setDocuments] = useState<any[]>([]);
  const [kind, setKind] = useState<'affidavit'|'order'|'report'>('affidavit');
  const [provider, setProvider] = useState({ endpoint:'', model:'', apiKey:'' });
  const [consent, setConsent] = useState(false);
  const [progress, setProgress] = useState('Choose PDFs or load the fictional example.');
  const [working, setWorking] = useState(false);
  const controller = useRef<AbortController | null>(null);
  async function upload(files: FileList | null) { if (!files?.length) return; setWorking(true); const next = [...documents]; try { for (const file of Array.from(files)) { setProgress(`Reading ${file.name}…`); next.push(await parsePdf(file, { workerSrc, kind, signal: controller.current?.signal, onProgress: item => setProgress(item.detail) })); } setDocuments(next); setProgress(`${next.length} document${next.length === 1 ? '' : 's'} ready to build.`); } catch (error) { setProgress(error instanceof Error ? error.message : 'Import failed.'); } finally { setWorking(false); } }
  function adapter() { if (!consent) throw new Error('Confirm before sending selected text to your provider.'); return createOpenAICompatibleAdapter(provider); }
  async function build() { controller.current = new AbortController(); setWorking(true); try { const next = await buildChronology(documents, { llm:adapter(), title:record.title, signal:controller.current.signal, onProgress:item => setProgress(item.detail) }); setRecord(next); setProgress('Chronology built.'); } catch (error) { setProgress(error instanceof Error ? error.message : 'Build failed.'); } finally { setWorking(false); } }
  async function relate() { controller.current = new AbortController(); setWorking(true); try { setRecord(await findRelationships(record, { llm:adapter(), signal:controller.current.signal, onProgress:item => setProgress(item.detail) })); setProgress('Relationships found.'); } catch (error) { setProgress(error instanceof Error ? error.message : 'Relationship check failed.'); } finally { setWorking(false); } }
  function importRecord(file: File | undefined) { if (!file) return; file.text().then(text => { setRecord(parseRecord(text)); setProgress('OCKER record imported.'); }).catch(error => setProgress(error.message)); }
  async function loadExample() { setRecord(parseRecord(await (await fetch('/assets/examples/joe-jill.ocker.json')).text())); setProgress('Loaded the shared fictional example.'); }
  return <main className={`demo demo--${theme}`}><header className="demo__hero"><p className="demo__eyebrow">Reusable chronology</p><h1>OCKER / React</h1><p>Build a clear path through competing accounts.</p></header><section className="demo__controls" aria-label="Chronology controls"><label>Theme <select value={theme} onChange={event => setTheme(event.target.value as 'glass' | 'none')}><option value="glass">Glass</option><option value="none">Plain</option></select></label><label>Document kind <select value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="affidavit">Affidavit</option><option value="order">Order</option><option value="report">Report</option></select></label><label>Queue text PDFs <input type="file" multiple accept="application/pdf" onChange={e => upload(e.target.files)}/></label><label>Import OCKER <input type="file" accept="application/json,.ocker.json" onChange={e => importRecord(e.target.files?.[0])}/></label><button type="button" onClick={loadExample}>Load Joe &amp; Jill example</button></section><section className="demo__provider"><label>Endpoint <input value={provider.endpoint} onChange={e => setProvider({...provider,endpoint:e.target.value})} placeholder="https://provider.example/v1/chat/completions"/></label><label>Model <input value={provider.model} onChange={e => setProvider({...provider,model:e.target.value})}/></label><label>API key <input type="password" value={provider.apiKey} onChange={e => setProvider({...provider,apiKey:e.target.value})}/></label><label className="demo__consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/> I approve sending selected document text to this provider.</label><div><button type="button" disabled={!documents.length||working} onClick={build}>Build chronology</button><button type="button" disabled={record.events.length < 2 || working} onClick={relate}>Find relationships</button><button type="button" disabled={!working} onClick={() => controller.current?.abort()}>Cancel</button></div></section><p className="demo__status" aria-live="polite">{progress}</p><OckerChronology record={record} onChange={setRecord} theme={theme}/></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
