'use client'

import { PlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn, numberFormat, toneColor } from '../../../lib/utils'
import type { ConnectSourcesCopy, DataSource } from './data'

/* One source as a tile: its name and color, where it stands (a status light,
 * how far a backfill has come, or a Connect button), its day as a small
 * histogram, and one line of what it brings. A connected source's bars are
 * solid; a backfilling one's are solid as far as the history has come and
 * outlined past it; an available one's are a quiet preview. Low hours shrink
 * to a dot. The histogram is decorative: the line under it says the number. */

function Bars({ source }: { source: DataSource }) {
  const values = source.volume
  const top = Math.max(...values, 0) || 1
  const color = toneColor(source.tone)
  const filled = source.status === 'backfilling' ? Math.round((source.progress ?? 0) * values.length) : values.length
  return (
    <div aria-hidden data-slot="connect-sources-bars" className="flex h-8 items-end gap-px">
      {values.map((v, i) => (
        <span
          key={i}
          className={cn('min-h-1 min-w-0 flex-1 rounded-full', i >= filled && 'border border-dashed')}
          style={{
            height: `${Math.round((v / top) * 100)}%`,
            background: i >= filled ? undefined : source.status === 'available' ? `color-mix(in oklab, ${color} 45%, var(--color-surface))` : color,
            borderColor: i >= filled ? color : undefined,
          }}
        />
      ))}
    </div>
  )
}

interface TileProps {
  source: DataSource
  copy: ConnectSourcesCopy
  locale: string
  format?: (perDay: number) => string
  pending: boolean
  onConnect: () => void
}

export function Tile({ source, copy, locale, format, pending, onConnect }: TileProps) {
  const compact = numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 })
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const available = source.status === 'available'
  return (
    <li
      data-slot="connect-sources-tile"
      data-status={source.status}
      className={cn(
        'flex min-w-0 flex-col gap-2.5 rounded-lg border px-3 pt-2.5 pb-3 transition-colors yj-duration-fast ease-standard',
        source.status === 'backfilling' ? 'border-line-strong' : 'border-line hover:border-line-strong',
      )}
    >
      <div className="flex h-6 items-center justify-between gap-2">
        <span className={cn('flex min-w-0 items-center gap-2 text-ui', available ? 'text-fg-muted' : 'font-medium text-fg')}>
          <span aria-hidden className="size-2 shrink-0 rounded-xs" style={{ background: toneColor(source.tone) }} />
          <span className="truncate">{source.label}</span>
        </span>
        {source.status === 'connected' && (
          <span className="grid size-6 shrink-0 place-items-center">
            <span aria-hidden className="size-2 rounded-full bg-success shadow-[0_0_0_3px_var(--color-success-subtle)]" />
            <span className="sr-only">{copy.connected}</span>
          </span>
        )}
        {source.status === 'backfilling' && <span className="font-mono text-ui-sm text-fg tabular-nums">{percent.format(source.progress ?? 0)}</span>}
        {available && (
          <Button
            variant="outline"
            size="icon-xs"
            aria-label={copy.connect(source.label)}
            loading={pending}
            loadingLabel={copy.connecting(source.label)}
            onClick={onConnect}
          >
            <PlusIcon size={14} />
          </Button>
        )}
      </div>
      <Bars source={source} />
      <p className={cn('truncate text-ui-sm tabular-nums', available ? 'text-fg-subtle' : 'text-fg-muted')}>
        {source.status === 'connected'
          ? source.perDay !== undefined
            ? copy.perDay((format ?? compact.format)(source.perDay))
            : copy.connected
          : source.status === 'backfilling'
            ? copy.backfilling(source.backfillDays ?? 0)
            : copy.adds(percent.format(source.coverage))}
      </p>
    </li>
  )
}
