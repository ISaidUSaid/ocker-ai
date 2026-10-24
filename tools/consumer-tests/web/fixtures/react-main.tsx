import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { createRecord, type OckerRecord } from '@ocker-ai/core';
import { OckerChronology } from '@ocker-ai/react';
import '@ocker-ai/core/styles.css';
const initial=createRecord('Tarball React consumer');
initial.events.push({id:'react-event',title:'Consumer event',summary:'A source-linked consumer event.',date:{precision:'year',value:'2024'},sources:[],status:'unresolved'});
function App(){const [record,setRecord]=useState<OckerRecord>(initial);return <><output data-testid="note-count">{record.notes.length}</output><OckerChronology record={record} onChange={setRecord} theme="glass" /></>}
createRoot(document.getElementById('root')!).render(<App/>);
