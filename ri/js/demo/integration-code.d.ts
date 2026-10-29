import type {ThemeName} from '../src/themes.js';
// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export type CodeLanguage='js'|'angular'|'react'|'node'|'java'|'csharp';
export function mountReviewActions(container:HTMLElement,options:{getRecord:()=>import('../src/index.js').OckerRecord;labels?:Record<string,string>}):{destroy():void};
export function integrationCode(language?:CodeLanguage,theme?:ThemeName):string;
export function mountCodeDisclosure(container:HTMLElement,options?:{language?:CodeLanguage;theme?:ThemeName|(()=> ThemeName);labels?:Record<string,string>}):{refresh():void;destroy():void};
