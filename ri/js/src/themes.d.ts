export type ThemeName='glass'|'none'|'chambers'|'caseboard'|'blueprint'|'after-hours'|'paper';
export const THEME_NAMES:readonly ThemeName[];
export function themeName(theme:unknown):ThemeName;
export function applyTheme(element:HTMLElement,theme:unknown):void;
