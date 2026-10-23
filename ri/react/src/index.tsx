// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import { useEffect, useRef } from 'react';
import { mountChronology } from '@ocker-ai/core';
import type { Record, ChronologyOptions } from '@ocker-ai/core';

export type OckerChronologyProps = ChronologyOptions & { record: Record; className?: string };

/** Mounts the framework-neutral OCKER chronology into a React-owned element. */
export function OckerChronology({ record, className, ...options }: OckerChronologyProps) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<ReturnType<typeof mountChronology> | null>(null);
  useEffect(() => {
    if (!host.current) return;
    instance.current = mountChronology(host.current, record, options);
    return () => instance.current?.destroy();
  }, []);
  useEffect(() => { instance.current?.setRecord(record); }, [record]);
  useEffect(() => { instance.current?.setOptions(options); }, [options]);
  return <div ref={host} className={className} />;
}

export default OckerChronology;
