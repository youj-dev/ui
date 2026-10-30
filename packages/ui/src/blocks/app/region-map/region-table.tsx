'use client'

import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { ShareBar } from '../../../components/ui/share-bar'
import { cn, numberFormat } from '../../../lib/utils'
import type { RegionMapCopy, RegionMapRegion } from './data'

interface RegionTableProps {
  regions: RegionMapRegion[]
  /** Past this reading a region is flagged. */
  threshold: number
  /** Writes a rate. */
  rate: Intl.NumberFormatOptions
  /** Writes a reading. */
  reading: Intl.NumberFormatOptions
  total: number
  /** The region lit on the map, from either side. */
  active: string | null
  /** The region pinned by a click, which stays lit. */
  pinned: string | null
  copy: RegionMapCopy
  onHover: (id: string | null) => void
  onPin: (id: string) => void
}

/* The figures behind the map, busiest first: each region's code and city,
 * its share of all requests as a run of cells, its rate and its p95. Hover a
 * row or focus its name and the map lights that region; a click pins it. A
 * slow region's code and latency turn to the warning ink, with a soft pill. */
function RegionTable({ regions, threshold, rate, reading, total, active, pinned, copy, onHover, onPin }: RegionTableProps) {
  const number = numberFormat(copy.locale)
  const readings = numberFormat(copy.locale, reading)
  const compact = numberFormat(copy.locale, rate)
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const sorted = [...regions].sort((a, b) => b.value - a.value)
  // Bars run against the busiest region, so the column reads at a glance; the percentage beside each is its true share.
  const top = sorted[0]?.value ?? 0

  return (
    <Table aria-label={copy.regionsLabel}>
      <TableHeader>
        <TableRow>
          <TableHead className="ps-5 sm:ps-6">{copy.region}</TableHead>
          <TableHead className="hidden sm:table-cell">{copy.share}</TableHead>
          <TableHead className="text-end">{copy.valueHead}</TableHead>
          <TableHead className="pe-5 text-end sm:pe-6">{copy.readingHead}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((region) => {
          const slow = region.reading > threshold
          const on = active === region.id
          const share = total ? region.value / total : 0
          return (
            <TableRow
              key={region.id}
              data-active={on || undefined}
              data-slow={slow || undefined}
              onPointerEnter={() => onHover(region.id)}
              onPointerLeave={() => onHover(null)}
              className="data-active:bg-selected"
            >
              <TableCell className="py-2 ps-5 sm:ps-6">
                <button
                  type="button"
                  aria-pressed={pinned === region.id}
                  aria-label={copy.showOnMap(`${region.id} ${region.city}`)}
                  onFocus={() => onHover(region.id)}
                  onBlur={() => onHover(null)}
                  onClick={() => onPin(region.id)}
                  className="-mx-1.5 flex min-w-0 items-center gap-2.5 rounded-[min(var(--radius-sm),6px)] px-1.5 py-1 text-start focus-ring"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-1.5 shrink-0 rounded-full transition-[background-color,box-shadow] yj-duration-fast ease-standard',
                      slow ? 'bg-warning' : on || pinned === region.id ? 'bg-accent' : 'bg-line-strong',
                      (on || pinned === region.id) && 'shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_24%,transparent)]',
                    )}
                  />
                  <span className={cn('w-8 shrink-0 font-mono text-ui', slow ? 'text-warning-text' : 'text-fg')}>{region.id}</span>{' '}
                  <span className="truncate text-ui text-fg-muted">{region.city}</span>
                </button>
              </TableCell>
              <TableCell className="hidden py-2 sm:table-cell">
                <div className="flex items-center gap-3">
                  {/* The percentage beside it says the value, so the bar is decorative. */}
                  <ShareBar value={region.value} max={top || 1} segments={16} tone={slow ? 'warning' : on ? 'accent' : 'neutral'} className="w-28" />
                  <span className="w-11 text-end font-mono text-ui-sm text-fg-muted tabular-nums">{percent.format(share)}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-end font-mono tabular-nums">
                <span title={number.format(region.value)}>{compact.format(region.value)}</span>
              </TableCell>
              <TableCell className="py-2 pe-5 text-end sm:pe-6">
                <span className="inline-flex items-center justify-end gap-2">
                  {slow && (
                    <Badge variant="warning" className="hidden sm:inline-flex">
                      <BadgeDot />
                      {copy.flagged}
                    </Badge>
                  )}
                  <span className={cn('font-mono text-ui tabular-nums', slow ? 'text-warning-text' : 'text-fg')}>
                    {/* The unit is set small and muted, whichever side of the figure the locale puts it. */}
                    {readings.formatToParts(region.reading).map((part, i) =>
                      part.type === 'unit' ? (
                        <span key={i} className="text-ui-sm text-fg-muted">
                          {part.value}
                        </span>
                      ) : (
                        part.value
                      ),
                    )}
                  </span>
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export { RegionTable }
