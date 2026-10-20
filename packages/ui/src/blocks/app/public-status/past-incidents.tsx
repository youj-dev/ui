'use client'

import { useId, useMemo } from 'react'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible'
import type { StatusService } from '../status/data'
import { longDay, pastIncidents, type PublicStatusCopy } from './data'

/** The newest days with a resolved incident, read from the services' days, the newest open. */
function PastIncidents({ services, copy, locale }: { services: readonly StatusService[]; copy: PublicStatusCopy; locale: string }) {
  const id = useId()
  const past = pastIncidents(services, copy.disruption)
  const day = useMemo(() => longDay(locale), [locale])
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-ui-lg font-semibold tracking-tight">
        {copy.pastIncidents}
      </h2>
      {/* The days scroll in their own height (the newest open, at an app's size): opening more never resizes the page. */}
      <div className="flex h-74.75 flex-col divide-y divide-line overflow-y-auto rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface yj-scrollbar">
        {past.length === 0 && <p className="px-4 py-3 text-ui text-fg-muted">{copy.noPastIncidents}</p>}
        {past.map((entry, i) => (
          <Collapsible key={entry.date.getTime()} defaultOpen={i === 0}>
            <CollapsibleTrigger className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-start text-ui">
              <span className="flex-1 font-medium">{day.format(entry.date)}</span>
              <span className="text-ui-sm text-fg-muted">{copy.resolvedCount(entry.incidents.length)}</span>
              <CollapsibleChevron size={14} className="text-fg-muted" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="flex flex-col gap-3 px-4 pb-4 text-ui">
                {entry.incidents.map((item) => (
                  <li key={item.service + item.title} className="flex flex-col gap-0.5 border-s-2 border-success-line ps-3">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-ui-sm text-fg-muted">
                      {copy.affected} <span className="font-mono">{item.service}</span>
                    </span>
                    <span className="text-ui-xs text-success-text">{copy.lasted(item.minutes)}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </section>
  )
}

export { PastIncidents }
