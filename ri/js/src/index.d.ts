export {THEME_NAMES,themeName,applyTheme} from './themes.js';
import type {ThemeName} from './themes.js';
export type {ThemeName} from './themes.js';
// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
export interface DateValue {precision:'day'|'month'|'year'|'range'|'unknown';value?:string;end?:string;approximate?:boolean;basis?:string}
export interface Selector {kind:'text'|'page'|'time'|'frame';start?:number;end?:number;page?:number}
export interface Source {documentId:string;paragraphId?:string;page?:number;quote?:string;assetId?:string;selector?:Selector}
export interface Paragraph {id:string;page:number;label?:string;text:string}
export interface Document {id:string;title:string;kind:'affidavit'|'order'|'report';author?:string;assetId?:string;paragraphs:Paragraph[]}
export interface Event {id:string;title:string;summary:string;date:DateValue;assertedBy?:string;actorIds?:string[];sources:Source[];status?:'alleged'|'agreed'|'disputed'|'unresolved';narrative?:string;extensions?:object}
export interface Relationship {id:string;from:string;to:string;type:'supports'|'contradicts';rationale:string;provenance:{method:'llm'|'human'|'imported';createdAt:string;authorId?:string};sources?:Source[];extensions?:object}
export interface Note {id:string;eventId:string;body:string;position:{x:number;y:number};createdAt:string;updatedAt:string;authorId?:string;extensions?:object}
export interface Authority {id:string;eventId:string;title:string;citation:string;type:'binding'|'persuasive'|'unspecified';color:'blue'|'lavender'|'mint'|'peach'|'slate';pinpoint?:string;court?:string;jurisdiction?:string;sourceUrl?:string;body?:string;createdAt:string;updatedAt:string;authorId?:string;extensions?:object}
export interface Asset {id:string;name:string;mediaType:string;sha256:string;byteLength:number;data?:string;uri?:string;derivedFrom?:string;selector?:Selector;extensions?:object}
export interface Record {format:'ocker';version:'0.1.0';id:string;title:string;createdAt:string;updatedAt:string;actors:{id:string;name:string;role?:string;extensions?:object}[];documents:Document[];events:Event[];relationships:Relationship[];notes:Note[];authorities:Authority[];assets:Asset[];extensions?:object}
export type OckerRecord=Record;
export interface Intermediate {format:'ocker-document';version:'0.1.0';document:Document;asset?:Asset}
export type Actor=Record['actors'][number];
export type RelationshipType=Relationship['type'];
export interface ResolvedEvidence {source:Source;document:Document;paragraph?:Paragraph;asset?:Asset}
export class ChronologyGraph {
  constructor(record:Record);
  getRecord():Record;
  getEvent(id:string):Event|undefined;
  getDocument(id:string):Document|undefined;
  getActor(id:string):Actor|undefined;
  getAsset(id:string):Asset|undefined;
  getRelationships(eventId:string,type?:RelationshipType):Relationship[];
  getRelatedEvents(eventId:string,type?:RelationshipType):Event[];
  getNotes(eventId:string):Note[];
  getAuthorities(eventId:string):Authority[];
  getEvidence(eventId:string):ResolvedEvidence[];
}
export function createGraph(record:Record):ChronologyGraph;
export class RecordBuilder {
  constructor(input?:string|Record);
  addActor(value:Actor):this;
  addAsset(value:Asset):this;
  addDocument(value:Document):this;
  addEvent(value:Event):this;
  addRelationship(value:Relationship):this;
  addNote(value:Note):this;
  addAuthority(value:Authority):this;
  addIntermediate(value:Intermediate):this;
  build():Record;
}
export function recordBuilder(input?:string|Record):RecordBuilder;
export interface Progress {stage:string;detail:string;current?:number;total?:number}
export type LlmAdapter=(request:{task:'extract'|'relate';locale?:string;prompt:string;input:unknown;signal?:AbortSignal})=>Promise<object|string>;
export interface PipelineOptions {llm?:LlmAdapter;onProgress?:(progress:Progress)=>void;signal?:AbortSignal;title?:string;authorId?:string;locale?:string;maxDocumentCharacters?:number;maxRelationshipCharacters?:number;maxEventsPerDocument?:number}
export interface DoclingOptions {endpoint?:string;timeoutMs?:number;assetBaseUrl?:string;modelBaseUrl?:string;ocrLanguage?:'en'|'ch'|'cyrillic';tableStructure?:boolean;fetch?:typeof fetch}
export interface PdfOptions {docling?:DoclingOptions;maxTextCharacters?:number;workerSrc?:string;title?:string;kind?:Document['kind'];author?:string;maxBytes?:number;maxPages?:number;signal?:AbortSignal;onProgress?:(progress:Progress)=>void}
export interface ChronologyOptions {onChange?:(record:Record)=>void;onProgress?:(progress:Progress)=>void;onError?:(error:Error)=>void;llm?:LlmAdapter;readOnly?:boolean;locale?:string;theme?:ThemeName|{[key:string]:string};themeVariables?:{[key:string]:string};labels?:{[key:string]:string};assetResolver?:(asset:Asset)=>Promise<Uint8Array>;onEventClick?:(event:Event)=>void;onSourceClick?:(source:Source,event:Event)=>void;animate?:boolean;showToolbar?:boolean;mobile?:boolean;authorId?:string;className?:string}
export interface ChronologyHandle {getRecord():Record;setRecord(record:Record):void;setOptions(options:Partial<ChronologyOptions>):void;destroy():void}
export const VERSION:string;
export function id():string;
export function now():string;
export function clone<T>(value:T):T;
export function createRecord(title?:string):Record;
export function validateRecord(record:unknown):{valid:boolean;errors:string[]};
export function assertRecord(record:Record):Record;
export function parseRecord(input:string|Uint8Array,options?:{maxBytes?:number}):Record;
export function exportRecord(record:Record):string;
export function verifyAssetsSync(record:Record):Record;
export function verifyAssets(record:Record,options?:{signal?:AbortSignal}):Promise<Record>;
export function makeAsset(bytes:Uint8Array,name:string,mediaType?:string):Promise<Asset>;
export function sha256(bytes:Uint8Array):Promise<string>;
export function bytesToBase64(bytes:Uint8Array):string;
export function base64ToBytes(data:string):Uint8Array;
export function updateRecord(record:Record,mutator:(next:Record)=>void):Record;
export function saveNote(record:Record,note:Omit<Note,'id'|'createdAt'|'updatedAt'>&Partial<Pick<Note,'id'|'createdAt'|'updatedAt'>>):Record;
export function saveAuthority(record:Record,authority:Omit<Authority,'id'|'createdAt'|'updatedAt'>&Partial<Pick<Authority,'id'|'createdAt'|'updatedAt'>>):Record;
export function deleteAnnotation(record:Record,id:string):Record;
export function formatDate(date:DateValue,locale?:string):string;
export function parsePdf(input:Uint8Array|ArrayBuffer|Blob,options?:PdfOptions):Promise<Intermediate>;
export function buildChronology(documents:Intermediate[],options?:PipelineOptions):Promise<Record>;
export function findRelationships(record:Record,options?:PipelineOptions):Promise<Record>;
export function createOpenAICompatibleAdapter(options:{endpoint:string;model:string;apiKey:string;fetch?:typeof fetch;headers?:{[key:string]:string};temperature?:number;responseFormat?:boolean;maxResponseBytes?:number}):LlmAdapter;
export function mountChronology(element:HTMLElement,record:Record,options?:ChronologyOptions):ChronologyHandle;
export function exportVisual(element:HTMLElement,format:'pdf'|'png',title?:string):Promise<void>;
export const EXTRACTION_PROMPT:string;
export const RELATIONSHIP_PROMPT:string;
export const SUPPORTED_PROMPT_LOCALES:readonly string[];
export const DEFAULT_PROMPT_LOCALE:string;
export function normalisePromptLocale(locale?:string,fallback?:string):string;
export function getPrompts(locale?:string):{extract:string;relate:string};

export function assertIntermediate(item:Intermediate):Intermediate;
export function parseIntermediate(input:string|Uint8Array):Intermediate;
export function exportIntermediate(item:Intermediate):string;

export interface DocumentOptions extends PdfOptions {format?:'pdf'|'docx'|'rtf'|'txt'|'text'|'html'|'htm';maxExpandedBytes?:number;maxTextCharacters?:number}
export function parseDocument(input:Uint8Array|ArrayBuffer|Blob,options?:DocumentOptions):Promise<Intermediate>;
export function parseText(text:string,options?:DocumentOptions):Promise<Intermediate>;
export function rtfText(rtf:string):string;
export function parseRichText(html:string,options?:DocumentOptions):Promise<Intermediate>;

export function isLoopbackEndpoint(endpoint:string):boolean;
export function createProviderAdapter(options:{protocol?:'openai'|'anthropic';endpoint:string;model:string;apiKey?:string;fetch?:typeof fetch;headers?:{[key:string]:string};temperature?:number;responseFormat?:boolean;maxResponseBytes?:number;maxTokens?:number}):LlmAdapter;

export function testDoclingConnection(options?:{endpoint?:string;timeoutMs?:number;signal?:AbortSignal;fetch?:typeof fetch}):Promise<{ok:true;endpoint:string}>;
export function doclingParagraphs(document:unknown,options?:PdfOptions):Paragraph[];
