'use client'

import { useId, useMemo } from 'react'
import { Counter } from '@youj/motion'
import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { ArcGlobeCopy, ArcGlobePlace, ArcGlobeRegion, ArcGlobeTone } from './data'

/* The lists beside the globe, which are also its keyboard: the regions (a
 * toggle each, bringing that region forward and narrowing the countries to
 * it) and the top countries (pointing at or focusing one turns the globe to
 * it; pressing it pins it there). Plus every country as a table for
 * assistive tech, since the globe is a picture. */

export interface Row {
  place: ArcGlobePlace
  /** For the chosen site. */
  volume: number
  change: number
  share: number
}

export interface Formats {
  count: Intl.NumberFormatOptions
  compact: Intl.NumberFormatOptions
  percent: (n: number) => string
  signed: (n: number) => string
  locale: string
}

const SWATCH: Record<ArcGlobeTone, string> = {
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}

/** A change in the good or bad ink, signed. */
function Change({ value, format }: { value: number; format: Formats }) {
  return (
    <span className={cn('font-mono text-ui-xs tabular-nums', value >= 0 ? 'text-success-text' : 'text-danger-text')}>{format.signed(value)}</span>
  )
}

const ROW = cn(
  'group/row relative grid w-full items-center gap-x-3 rounded-md px-2 py-1.5 text-start text-ui transition-colors yj-duration-fast ease-standard focus-ring',
  'hover:bg-hover data-[active]:bg-selected aria-pressed:bg-selected',
)

export function RegionList({
  rows,
  selected,
  copy,
  format,
  onSelect,
}: {
  rows: { region: ArcGlobeRegion; volume: number; change: number; share: number }[]
  selected: string | null
  copy: ArcGlobeCopy
  format: Formats
  onSelect: (id: string) => void
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-1">
      <Eyebrow id={headingId} render={<h3 />} className="px-2">
        {copy.regions}
      </Eyebrow>
      <ul className="flex flex-col">
        {rows.map((row) => {
          const { id, label, tone } = row.region
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={selected === id}
                onClick={() => onSelect(id)}
                className={cn(ROW, 'grid-cols-[auto_minmax(0,1fr)_auto_--spacing(14)]')}
              >
                <span aria-hidden className={cn('size-2 rounded-[2px]', SWATCH[tone])} />
                <span className="truncate">{label}</span>
                <span className="font-mono tabular-nums">
                  <Counter value={row.volume} format={format.compact} locale={format.locale} duration="slow" ease="standard" />
                </span>
                <span className="text-end">
                  <Change value={row.change} format={format} />
                </span>
                <ShareBar value={row.share} tone={tone} className="col-span-full mt-1.5 h-0.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function PlaceList({
  rows,
  active,
  pinned,
  copy,
  format,
  onPreview,
  onPin,
}: {
  rows: Row[]
  active: string | null
  pinned: string | null
  copy: ArcGlobeCopy
  format: Formats
  onPreview: (id: string | null) => void
  onPin: (id: string) => void
}) {
  const headingId = useId()
  const counts = useMemo(() => numberFormat(format.locale, format.compact), [format.locale, format.compact])
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-1">
      <Eyebrow id={headingId} render={<h3 />} className="px-2">
        {copy.topPlaces}
      </Eyebrow>
      <ol className="flex flex-col" onPointerLeave={() => onPreview(null)}>
        {rows.map((row, i) => (
          <li key={row.place.id}>
            <button
              type="button"
              aria-pressed={pinned === row.place.id}
              // The row as shown (rank, code, place, figure, change), then its share.
              aria-label={`${String(i + 1).padStart(2, '0')} ${row.place.id} ${row.place.name} ${counts.format(row.volume)} ${format.signed(row.change)}, ${copy.share(format.percent(row.share))}`}
              data-active={active === row.place.id || undefined}
              onPointerEnter={() => onPreview(row.place.id)}
              onFocus={() => onPreview(row.place.id)}
              onBlur={() => onPreview(null)}
              onClick={() => onPin(row.place.id)}
              className={cn(ROW, 'grid-cols-[--spacing(5)_--spacing(8)_minmax(0,1fr)_auto_--spacing(14)]')}
            >
              <span className="font-mono text-ui-xs text-fg-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>{' '}
              <span className="rounded-sm border border-line px-1 text-center font-mono text-ui-xs tracking-wider text-fg-muted group-aria-pressed/row:border-accent group-aria-pressed/row:text-accent-text">
                {row.place.id}
              </span>{' '}
              <span className="truncate">{row.place.name}</span>{' '}
              <span className="font-mono tabular-nums">
                <Counter value={row.volume} format={format.compact} locale={format.locale} inView={false} duration="slow" ease="standard" />
              </span>{' '}
              <span className="text-end">
                <Change value={row.change} format={format} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Every place's figures, for assistive tech. */
export function PlaceTable({ rows, regions, copy, format }: { rows: Row[]; regions: ArcGlobeRegion[]; copy: ArcGlobeCopy; format: Formats }) {
  const counts = useMemo(() => numberFormat(format.locale, format.compact), [format.locale, format.compact])
  return (
    <table className="sr-only">
      <caption>{copy.table}</caption>
      <thead>
        <tr>
          <th scope="col">{copy.place}</th>
          <th scope="col">{copy.regions}</th>
          <th scope="col">{copy.primary}</th>
          <th scope="col">{copy.change}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.place.id}>
            <th scope="row">{row.place.name}</th>
            <td>{regions.find((r) => r.id === row.place.region)?.label}</td>
            <td>
              {counts.format(row.volume)} ({format.percent(row.share)})
            </td>
            <td>{format.signed(row.change)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
