// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {assertRecord,clone,verifyAssetsSync} from './model.js';

/** Indexed navigation over a validated snapshot. Returned objects are copies. */
export class ChronologyGraph {
  #record;
  #entities={};
  #edges=new Map();
  #notes=new Map();
  #authorities=new Map();
  #paragraphs=new Map();
  #order=new Map();
  constructor(record) {
    this.#record=verifyAssetsSync(assertRecord(clone(record)));
    for(const group of ['events','documents','actors','assets'])this.#entities[group]=new Map(this.#record[group].map(item=>[item.id,item]));
    this.#record.events.forEach((event,index)=>this.#order.set(event.id,index));
    for(const document of this.#record.documents)this.#paragraphs.set(document.id,new Map(document.paragraphs.map(paragraph=>[paragraph.id,paragraph])));
    const append=(map,key,value)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(value);};
    for(const edge of this.#record.relationships){append(this.#edges,edge.from,edge);append(this.#edges,edge.to,edge);}
    for(const note of this.#record.notes)append(this.#notes,note.eventId,note);
    for(const authority of this.#record.authorities)append(this.#authorities,authority.eventId,authority);
  }
  getRecord(){return clone(this.#record);}
  getEvent(id){return clone(this.#entities.events.get(id));}
  getDocument(id){return clone(this.#entities.documents.get(id));}
  getActor(id){return clone(this.#entities.actors.get(id));}
  getAsset(id){return clone(this.#entities.assets.get(id));}
  #event(id){const event=this.#entities.events.get(id);if(!event)throw new Error('Unknown event: '+id);return event;}
  #relationships(eventId,type) {
    this.#event(eventId);
    if(type!==undefined&&!['supports','contradicts'].includes(type))throw new Error('Unsupported relationship type: '+type);
    return (this.#edges.get(eventId)??[]).filter(edge=>type===undefined||edge.type===type);
  }
  getRelationships(eventId,type){return clone(this.#relationships(eventId,type));}
  getRelatedEvents(eventId,type) {
    const ids=new Set(this.#relationships(eventId,type).map(edge=>edge.from===eventId?edge.to:edge.from));
    return [...ids].sort((a,b)=>this.#order.get(a)-this.#order.get(b)).map(id=>this.getEvent(id));
  }
  getNotes(eventId){this.#event(eventId);return clone(this.#notes.get(eventId)??[]);}
  getAuthorities(eventId){this.#event(eventId);return clone(this.#authorities.get(eventId)??[]);}
  getEvidence(eventId) {
    return this.#event(eventId).sources.map(source=>{
      const document=this.#entities.documents.get(source.documentId);
      const paragraph=this.#paragraphs.get(document.id)?.get(source.paragraphId);
      const asset=this.#entities.assets.get(source.assetId??document.assetId);
      return clone({source,document,...(paragraph?{paragraph}:{}),...(asset?{asset}:{})});
    });
  }
}
export function createGraph(record){return new ChronologyGraph(record);}
