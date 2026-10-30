'use client'

import { Counter } from '@youj/motion'
import { ArrowDownLeftIcon, ArrowUpRightIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { ShareBar } from '../../../components/ui/share-bar'
import { Sparkline } from '../../../components/ui/sparkline'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { HubMapCopy, HubMapHub, HubMapLane, HubMapStatus, HubMapThresholds } from './data'

/* The picked hub in figures: its code, city and status; its throughput,
 * large and rolling, over the last hour as a sparkline; its on-time rate,
 * parcels delayed and sort capacity in use; and its top lanes, busiest
 * first, each a button that picks the hub at the other end (the map
 * follows). */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'
export interface Formats {
  /** A volume or a backlog. */
  compact: (n: number) => string
  /** A duration. */
  hours: (n: number) => string
  percent: (n: number) => string
  options: Intl.NumberFormatOptions
}

interface HubDetailProps {
  hub: HubMapHub
  status: HubMapStatus | undefined
  thresholds: HubMapThresholds
  lanes: HubMapLane[]
  history: number[]
  diverted: boolean
  copy: HubMapCopy
  format: Formats
  onSelect: (id: string) => void
}

export function HubDetail({ hub, status, thresholds, lanes, history, diverted, copy, format, onSelect }: HubDetailProps) {
  const own = lanes.filter((l) => l.from === hub.id || l.to === hub.id).sort((a, b) => b.volume - a.volume)
  const figures = [
    { label: copy.health, value: format.percent(hub.health), tone: hub.health < thresholds.health ? 'text-warning-text' : '' },
    { label: copy.backlog, value: format.compact(hub.backlog), tone: hub.backlog > thresholds.backlog ? 'text-warning-text' : '' },
  ]
  const full = hub.load > thresholds.load
  const healthy = !!status?.healthy
  return (
    <div data-slot="hub-map-detail" className="grid min-w-0 gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-ui-lg leading-5 text-fg">{hub.id}</p>
            <p className="truncate text-ui text-fg-muted">{hub.city}</p>
          </div>
          <Badge variant={diverted ? 'secondary' : (status?.tone ?? 'secondary')} className="shrink-0">
            <BadgeDot />
            {diverted ? copy.acted : status?.label}
          </Badge>
        </div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Eyebrow className={VOICE}>{copy.volume}</Eyebrow>
            <p className="flex items-baseline gap-1 font-mono leading-none">
              <Counter
                value={hub.volume}
                from={hub.volume}
                format={format.options}
                locale={copy.locale}
                duration="slow"
                className="text-3xl font-medium tracking-tight"
              />
              <span className="text-ui text-fg-muted">{copy.unit}</span>
            </p>
          </div>
          <Sparkline
            data={history}
            label={copy.lastHour}
            color={diverted ? 'var(--color-fg-subtle)' : healthy ? 'var(--color-accent)' : 'var(--color-warning)'}
            className="h-10 w-full max-w-40 min-w-24 flex-1"
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-3 border-t border-line pt-4 md:border-s md:border-t-0 md:ps-6 md:pt-0">
        {figures.map((f, i) => (
          <div key={f.label} className={cn('flex min-w-0 flex-col gap-1', i > 0 && 'border-s border-line ps-4')}>
            <dt>
              <Eyebrow className={cn('block truncate', VOICE)}>{f.label}</Eyebrow>
            </dt>
            <dd className={cn('truncate font-mono text-ui-lg font-medium tabular-nums', f.tone || 'text-fg')}>{f.value}</dd>
          </div>
        ))}
        <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5">
          <dt>
            <Eyebrow className={VOICE}>{copy.load}</Eyebrow>
          </dt>
          <dd className={cn('font-mono text-ui tabular-nums', full ? 'text-warning-text' : 'text-fg-muted')}>{format.percent(hub.load)}</dd>
          {/* The figure above says the value, so the bar is decorative. */}
          <dd className="col-span-2">
            <ShareBar value={hub.load} segments={24} tone={full ? 'warning' : 'neutral'} />
          </dd>
        </div>
      </dl>

      <div className="flex min-w-0 flex-col gap-1.5 border-t border-line pt-4 md:border-s md:border-t-0 md:ps-6 md:pt-0">
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow className={VOICE}>{copy.lanes}</Eyebrow>
          <Eyebrow className={VOICE}>{copy.duration}</Eyebrow>
        </div>
        <ul className="-mx-2 flex flex-col">
          {own.map((lane) => {
            const out = lane.from === hub.id
            const peer = out ? lane.to : lane.from
            const Arrow = out ? ArrowUpRightIcon : ArrowDownLeftIcon
            return (
              <li key={`${lane.from}-${lane.to}`}>
                <button
                  type="button"
                  onClick={() => onSelect(peer)}
                  // The lane as shown (airport, volume, time), then its direction and what the time is.
                  aria-label={`${peer} ${format.compact(lane.volume)}${copy.unit} ${format.hours(lane.time)}, ${out ? copy.outbound(peer) : copy.inbound(peer)}, ${copy.duration}`}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_--spacing(13)] items-center gap-2 rounded-[min(var(--radius-md),8px)] px-2 py-1.5 text-start focus-ring transition-[background-color] yj-duration-fast ease-standard hover:bg-hover"
                >
                  <Arrow size={13} aria-hidden className={cn('rtl:-scale-x-100', out ? 'text-accent' : 'text-fg-muted')} />
                  <span className="truncate font-mono text-ui text-fg">{peer}</span>{' '}
                  <span className="font-mono text-ui-sm text-fg-muted tabular-nums">
                    {format.compact(lane.volume)}
                    {copy.unit}
                  </span>{' '}
                  <span className="text-end font-mono text-ui-sm text-fg-muted tabular-nums">{format.hours(lane.time)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
