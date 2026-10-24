import { Component } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OckerChronologyComponent } from '@ocker-ai/angular';
import { createRecord, type OckerRecord } from '@ocker-ai/core';
@Component({selector:'app-root',standalone:true,imports:[OckerChronologyComponent],template:`<output data-testid="note-count">{{record.notes.length}}</output><ocker-chronology [record]="record" [options]="{theme: 'glass', mobile: mobile}" (recordChange)="record=$event" />`})
class ConsumerApp {
 record:OckerRecord=createRecord('Tarball Angular consumer');
 mobile:boolean;
 constructor(breakpoints:BreakpointObserver){this.mobile=breakpoints.isMatched('(max-width: 700px)');this.record.events.push({id:'angular-event',title:'Consumer event',summary:'A source-linked consumer event.',date:{precision:'year',value:'2024'},sources:[],status:'unresolved'});}
}
bootstrapApplication(ConsumerApp,{providers:[provideAnimations()]});
