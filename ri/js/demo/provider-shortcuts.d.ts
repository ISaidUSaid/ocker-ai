// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export interface ProviderPreset{id:string;label:string;endpoint:string;protocol:'openai'|'anthropic';requiresKey:boolean}
export const PROVIDER_PRESETS:readonly ProviderPreset[];
export function mountProviderShortcuts(container:HTMLElement,options:{onSelect:(preset:ProviderPreset)=>void;labels?:Record<string,string>}):{destroy():void};
