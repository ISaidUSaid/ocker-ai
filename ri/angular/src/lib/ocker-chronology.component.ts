// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { animate, style, transition, trigger } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { mountChronology } from '@ocker-ai/core';
import type { ChronologyOptions, Record } from '@ocker-ai/core';

export type OckerAngularOptions = ChronologyOptions;

/** A thin Angular boundary around the reusable browser chronology. */
@Component({
  selector: 'ocker-chronology', standalone: true,
  template: '<section #host class="ocker-angular-host" [@boundary]="mobile ? \'compact\' : \'wide\'"></section>',
  animations: [trigger('boundary', [transition('* <=> *', [style({ opacity: .7 }), animate('150ms ease-out', style({ opacity: 1 }))])])]
})
export class OckerChronologyComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) record!: Record;
  @Input() options: OckerAngularOptions = {};
  @Output() recordChange = new EventEmitter<Record>();
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  protected mobile = false;
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly zone = inject(NgZone);
  private readonly destroyed = new Subject<void>();
  private instance?: ReturnType<typeof mountChronology>;

  constructor(){this.mobile=this.breakpoints.isMatched('(max-width: 700px)');}
  ngAfterViewInit(): void {
    this.mobile = this.breakpoints.isMatched('(max-width: 700px)');
    this.breakpoints.observe('(max-width: 700px)').pipe(takeUntil(this.destroyed)).subscribe(state => {
      this.mobile = state.matches;
      this.zone.runOutsideAngular(() => this.instance?.setOptions({ ...this.options, mobile: this.mobile, onChange: this.changed }));
    });
    this.mount();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.instance) return;
    if (changes['record']) this.zone.runOutsideAngular(() => this.instance!.setRecord(this.record));
    if (changes['options']) this.zone.runOutsideAngular(() => this.instance!.setOptions({ ...this.options, mobile: this.mobile, onChange: this.changed }));
  }
  ngOnDestroy(): void { this.destroyed.next(); this.destroyed.complete(); this.instance?.destroy(); }
  private mount(): void { this.instance = this.zone.runOutsideAngular(() => mountChronology(this.host.nativeElement, this.record, { ...this.options, mobile: this.mobile, onChange: this.changed })); }
  private changed = (next: Record) => this.zone.run(() => { this.options.onChange?.(next); this.recordChange.emit(next); });
}
