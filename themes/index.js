// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export const THEME_NAMES=Object.freeze(['glass','none','chambers','caseboard','blueprint','after-hours','paper']);
export function themeName(theme){return THEME_NAMES.includes(theme)?theme:'none';}
export function applyTheme(element,theme){const name=themeName(theme);element.dataset.ockerTheme=name;element.classList.toggle('ocker-theme-glass',name==='glass'&&element.classList.contains('ocker-root'));}
