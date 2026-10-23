// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export function confirmPdfDocuments(files:File[]|FileList,options?:{theme?:'glass'|'none'}):Promise<{file:File;kind:'affidavit'|'order'|'report'}[]|null>;
