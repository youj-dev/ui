'use client'

import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import {
  NEAR_LIMIT,
  daysLeft,
  shareOf,
  usedOf,
  type TieredCapacityCopy,
  type TieredCapacityRegion,
  type TieredCapacityTier,
  type TieredCapacityTone,
} from './data'

/* The selected region in figures, the legend, and the whole chart as a
 * table for assistive tech (the drawing itself is a picture). */

export const SWATCH: Record<TieredCapacityTone, string> = {
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}

export interface Formats {
  /** A figure in your unit. */
  size: (n: number) => string
  percent: (n: number) => string
}

/** A figure's number and unit apart, so the unit can be set small and muted ("460" "TB"). */
export function splitUnit(text: string) {
  const match = /^([^\p{L}]*?)\s*([\p{L}].*)$/u.exec(text)
  return match ? { value: match[1]!.trim(), unit: match[2]! } : { value: text, unit: '' }
}

export function RegionDetail({
  region,
  tiers,
  copy,
  format,
}: {
  region: TieredCapacityRegion
  tiers: TieredCapacityTier[]
  copy: TieredCapacityCopy
  format: Formats
}) {
  const used = usedOf(region)
  const share = shareOf(region)
  const over = share > 1
  const near = !over && share >= NEAR_LIMIT
  const days = daysLeft(region)
  const figure = splitUnit(format.size(used))
  const status = over
    ? copy.over(format.size(used - region.provisioned))
    : days === Infinity
      ? copy.steady
      : days === 0
        ? copy.full
        : copy.fullIn(days)
  return (
    <div data-slot="tiered-capacity-detail" className="flex min-w-0 flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow className="font-mono tracking-[0.12em] uppercase">{region.id}</Eyebrow>
        <span className="truncate text-ui text-fg-muted">{region.name}</span>
      </div>
      <div>
        <p className="font-mono text-3xl leading-none font-medium tracking-tight tabular-nums">
          {figure.value} <span className="ms-0.5 text-base text-fg-muted">{figure.unit}</span>
        </p>
        <p className="mt-2 text-ui text-fg-muted">{copy.ofProvisioned(format.size(region.provisioned))}</p>
      </div>
      <p className={cn('font-mono text-ui-sm tabular-nums', over ? 'text-danger' : near ? 'text-warning' : 'text-fg-muted')}>
        {copy.percentUsed(format.percent(share))} · {status}
      </p>
      <dl className="grid gap-2 border-t border-line pt-3">
        {tiers.map((tier) => (
          <div key={tier.id} className="flex items-center gap-2.5 text-ui">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-[2px]', SWATCH[tier.tone])} />
            <dt className="text-fg-muted">{tier.label}</dt>
            <dd className="ms-auto font-mono tabular-nums">{format.size(region.used[tier.id] ?? 0)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Legend({ tiers, copy }: { tiers: TieredCapacityTier[]; copy: TieredCapacityCopy }) {
  return (
    <ul aria-label={copy.legend} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ui-sm text-fg-muted">
      {tiers.map((tier) => (
        <li key={tier.id} className="flex items-center gap-1.5">
          <span aria-hidden className={cn('size-2 rounded-[2px]', SWATCH[tier.tone])} />
          {tier.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-2.5 rounded-[2px] border border-dashed border-fg-subtle" />
        {copy.provisioned}
      </li>
    </ul>
  )
}

/** Every region's figures, for assistive tech. */
export function CapacityTable({
  regions,
  tiers,
  copy,
  format,
}: {
  regions: TieredCapacityRegion[]
  tiers: TieredCapacityTier[]
  copy: TieredCapacityCopy
  format: Formats
}) {
  return (
    <table className="sr-only">
      <caption>{copy.table}</caption>
      <thead>
        <tr>
          <th scope="col">{copy.region}</th>
          {tiers.map((tier) => (
            <th key={tier.id} scope="col">
              {tier.label}
            </th>
          ))}
          <th scope="col">{copy.used}</th>
          <th scope="col">{copy.provisioned}</th>
        </tr>
      </thead>
      <tbody>
        {regions.map((r) => (
          <tr key={r.id}>
            <th scope="row">{r.name}</th>
            {tiers.map((tier) => (
              <td key={tier.id}>{format.size(r.used[tier.id] ?? 0)}</td>
            ))}
            <td>
              {format.size(usedOf(r))} ({format.percent(shareOf(r))})
            </td>
            <td>{format.size(r.provisioned)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
