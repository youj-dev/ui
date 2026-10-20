'use client'

import { HistoryStrip } from '../../../components/ui/history-strip'
import { cn } from '../../../lib/utils'
import { stats, type StatusLevel, type StatusService } from './data'

/** A filled well a step into the section, lighter on hover; the chosen one is keyed with a hairline ring. */
const WELL = [
  'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]',
  'hover:bg-[color-mix(in_oklab,var(--color-canvas)_calc(25%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_5%,transparent))]',
  'aria-pressed:bg-[color-mix(in_oklab,var(--color-fg)_calc(4%+3%*var(--yj-dark)),transparent)]',
  'aria-pressed:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_20%,transparent)]',
]
const DOT = {
  accent: 'bg-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_22%,transparent)]',
  info: 'bg-info shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-info)_22%,transparent)]',
  success: 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_22%,transparent)]',
  warning: 'bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-warning)_22%,transparent)]',
  danger: 'bg-danger shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-danger)_22%,transparent)]',
} as const

interface ServiceListProps {
  services: StatusService[]
  /** The service the day strip above shows, or null for all of them. */
  selected: string | null
  onSelect: (id: string | null) => void
  /** What each service's status is. */
  levelOf: (service: StatusService) => StatusLevel
  percent: (share: number) => string
  target: number
  critical: number
  /** The day strip these rows drive. */
  controls: string
}

/**
 * One well per service: its status today, its name, its own 90 days as a mini
 * strip and its uptime over them. Pressing a row puts that service on the day
 * strip and the figure above; pressing it again goes back to all of them.
 */
function ServiceList({ services, selected, onSelect, levelOf, percent, target, critical, controls }: ServiceListProps) {
  return (
    <ul className="@container/services flex flex-col gap-2">
      {services.map((service) => {
        const { average } = stats(service.days)
        const status = levelOf(service)
        const on = selected === service.id
        return (
          <li key={service.id}>
            <button
              type="button"
              aria-pressed={on}
              aria-controls={controls}
              aria-label={`${service.name}, ${status.label}, ${percent(average)}`}
              onClick={() => onSelect(on ? null : service.id)}
              data-status={status.id}
              className={cn(
                'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 rounded-xl px-4 py-3 text-start focus-ring',
                '@min-[32rem]/services:grid-cols-[auto_--spacing(34)_minmax(0,1fr)_--spacing(19)] @min-[32rem]/services:gap-x-4',
                'transition-[background-color,box-shadow] yj-duration-fast ease-standard',
                WELL,
              )}
            >
              <span aria-hidden className={cn('size-2 rounded-full', DOT[status.tone])} />
              <span className="truncate font-mono text-ui-lg text-fg">{service.name}</span>
              <HistoryStrip
                days={service.days}
                target={target}
                critical={critical}
                size="sm"
                interactive={false}
                className="col-span-full row-start-2 @min-[32rem]/services:col-span-1 @min-[32rem]/services:col-start-3 @min-[32rem]/services:row-start-1"
              />
              <span
                className={cn(
                  'col-start-3 row-start-1 text-end font-mono text-ui tabular-nums @min-[32rem]/services:col-start-4',
                  average < target ? 'text-warning-text' : 'text-fg-muted',
                )}
              >
                {percent(average)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export { ServiceList }
