import type {ThemeName} from '../src/themes.js';
// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import type {OckerRecord} from '../src/index.js';
export function mountRecordEditor(container:HTMLElement,options:{getRecord:()=>OckerRecord;onApply:(record:OckerRecord)=>void|Promise<void>;theme?:ThemeName|(()=> ThemeName);labels?:Record<string,string>}):{destroy():void};
