import type {ThemeName} from '../src/themes.js';
// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export function confirmPdfDocuments(files:File[]|FileList,options?:{theme?:ThemeName;labels?:Record<string,string>}):Promise<{file:File;kind:'affidavit'|'order'|'report'}[]|null>;
