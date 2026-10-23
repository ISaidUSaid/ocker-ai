# SPDX-License-Identifier: Apache-2.0
# Author: Jenko <adam@isaidusaid.com>
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
s={'type':'string'}
text={'type':'string','minLength':1}
id_={'type':'string','minLength':1,'maxLength':255}
def enum(*items):return {'type':'string','enum':list(items)}
def ref(name):return {'$ref':'#/$defs/'+name}
def arr(item):return {'type':'array','items':item}
def obj(props,required):return {'type':'object','properties':props,'required':required,'additionalProperties':False}
ext={'type':'object'}
stamp={'type':'string','format':'date-time'}
entity={'extensions':ext}
date=obj({'precision':enum('day','month','year','range','unknown'),'value':s,'end':s,'approximate':{'type':'boolean'},'basis':s},['precision'])
date['allOf']=[{'if':{'properties':{'precision':{'const':p}}},'then':{'required':['value'],'properties':{'value':{'type':'string','pattern':pattern}}}} for p,pattern in [('day',r'^\d{4}-\d{2}-\d{2}$'),('month',r'^\d{4}-\d{2}$'),('year',r'^\d{4}$')]]+[{'if':{'properties':{'precision':{'const':'range'}}},'then':{'required':['value','end'],'properties':{'value':{'type':'string','format':'date'},'end':{'type':'string','format':'date'}}}},{'if':{'properties':{'precision':{'const':'unknown'}}},'then':{'not':{'anyOf':[{'required':['value']},{'required':['end']}]}}}]
date['allOf'].append({'if':{'properties':{'precision':{'enum':['day','month','year']}}},'then':{'not':{'required':['end']}}})
selector=obj({'kind':enum('text','page','time','frame'),'start':{'type':'number','minimum':0},'end':{'type':'number','minimum':0},'page':{'type':'integer','minimum':1}},['kind'])
source=obj({'documentId':id_,'paragraphId':id_,'page':{'type':'integer','minimum':1},'quote':s,'assetId':id_,'selector':ref('selector')},['documentId'])
paragraph=obj({'id':id_,'page':{'type':'integer','minimum':1},'label':s,'text':text},['id','page','text'])
document=obj({'id':id_,'title':text,'kind':enum('affidavit','order','report'),'author':s,'assetId':id_,'paragraphs':arr(ref('paragraph'))},['id','title','kind','paragraphs'])
event=obj({**entity,'id':id_,'title':text,'summary':s,'date':ref('date'),'assertedBy':s,'actorIds':arr(id_),'sources':arr(ref('source')),'status':enum('alleged','agreed','disputed','unresolved'),'narrative':s},['id','title','summary','date','sources'])
provenance=obj({'method':enum('llm','human','imported'),'createdAt':stamp,'authorId':id_},['method','createdAt'])
relationship=obj({**entity,'id':id_,'from':id_,'to':id_,'type':enum('supports','contradicts'),'rationale':text,'provenance':provenance,'sources':arr(ref('source'))},['id','from','to','type','rationale','provenance'])
common={**entity,'id':id_,'eventId':id_,'createdAt':stamp,'updatedAt':stamp,'authorId':id_}
note=obj({**common,'body':text,'position':obj({'x':{'type':'number'},'y':{'type':'number'}},['x','y'])},['id','eventId','body','position','createdAt','updatedAt'])
authority=obj({**common,'title':text,'citation':text,'type':enum('binding','persuasive','unspecified'),'color':enum('blue','lavender','mint','peach','slate'),'pinpoint':s,'court':s,'jurisdiction':s,'sourceUrl':{'type':'string','format':'uri'},'body':s},['id','eventId','title','citation','type','color','createdAt','updatedAt'])
asset=obj({**entity,'id':id_,'name':text,'mediaType':text,'sha256':{'type':'string','pattern':'^[a-f0-9]{64}$'},'byteLength':{'type':'integer','minimum':0},'data':{'type':'string','pattern':r'^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'},'uri':{'type':'string','format':'uri-reference'},'derivedFrom':id_,'selector':ref('selector')},['id','name','mediaType','sha256','byteLength'])
asset['anyOf']=[{'required':['data']},{'required':['uri']}]
actor=obj({**entity,'id':id_,'name':text,'role':s},['id','name'])
record=obj({**entity,'format':{'const':'ocker'},'version':{'const':'0.1.0'},'id':id_,'title':text,'createdAt':stamp,'updatedAt':stamp,**{k:arr(ref(t)) for k,t in [('actors','actor'),('documents','document'),('events','event'),('relationships','relationship'),('notes','note'),('authorities','authority'),('assets','asset')]}},['format','version','id','title','createdAt','updatedAt','actors','documents','events','relationships','notes','authorities','assets'])
defs=locals().copy()
record.update({'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://ocker.ai/spec/0.1.0/ocker.schema.json','title':'OCKER 0.1.0 record','$defs':{k:defs[k] for k in ['date','selector','source','paragraph','document','event','relationship','note','authority','asset','actor']}})
intermediate=obj({'format':{'const':'ocker-document'},'version':{'const':'0.1.0'},'document':ref('document'),'asset':ref('asset')},['format','version','document'])
intermediate.update({'$schema':record['$schema'],'$id':'https://ocker.ai/spec/0.1.0/document.schema.json','$defs':record['$defs']})
for name,value in [('ocker.schema.json',record),('document.schema.json',intermediate)]:
 (root/'spec'/name).write_text(json.dumps(value,indent=2)+'\n')
(root/'ri/js/src/schema.json').write_text(json.dumps(record,indent=2)+'\n')

(root/'ri/js/src/document.schema.json').write_text(json.dumps(intermediate,indent=2)+'\n')
