export const DEMO_LOCALES:readonly [string,string][];
export function browserLocale(search?:string,language?:string):string;
export function demoText(locale?:string):Record<string,string>;
export function chronologyLabels(locale?:string):Record<string,string>;
