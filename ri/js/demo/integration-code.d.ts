// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export type CodeLanguage='js'|'angular'|'react'|'node'|'java'|'csharp';
export function integrationCode(language?:CodeLanguage,theme?:'glass'|'none'):string;
export function mountCodeDisclosure(container:HTMLElement,options?:{language?:CodeLanguage;theme?:'glass'|'none'|(()=> 'glass'|'none')}):{refresh():void;destroy():void};
