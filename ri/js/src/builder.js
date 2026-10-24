// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {assertIntermediate,assertRecord,clone,createRecord,now,verifyAssetsSync} from './model.js';

/** Assemble entities in any order, then validate the complete record at build. */
export class RecordBuilder {
  #record;
  constructor(input='Untitled chronology') {
    this.#record=typeof input==='string'?createRecord(input):verifyAssetsSync(assertRecord(clone(input)));
  }
  #add(group,value){this.#record[group].push(clone(value));return this;}
  addActor(value){return this.#add('actors',value);}
  addAsset(value){return this.#add('assets',value);}
  addDocument(value){return this.#add('documents',value);}
  addEvent(value){return this.#add('events',value);}
  addRelationship(value){return this.#add('relationships',value);}
  addNote(value){return this.#add('notes',value);}
  addAuthority(value){return this.#add('authorities',value);}
  addIntermediate(value) {
    const input=assertIntermediate(clone(value));
    this.addDocument(input.document);if(input.asset)this.addAsset(input.asset);return this;
  }
  build() {
    const result=clone(this.#record);result.updatedAt=now();
    return verifyAssetsSync(assertRecord(result));
  }
}
export function recordBuilder(input){return new RecordBuilder(input);}
