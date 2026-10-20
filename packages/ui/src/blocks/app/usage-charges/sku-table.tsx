'use client'

import { Skeleton } from '../../../components/ui/skeleton'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { cn, numberFormat, toneColor } from '../../../lib/utils'
import type { UsageChargesCopy, UsageChargesSku } from './data'
import type { SkuRow } from './model'

/** First and last cells sit on the card's own inline padding, so the table's edges line up with its header. */
const START = 'ps-(--card-spacing)'
const END = 'pe-(--card-spacing)'

/** A SKU's quantity: plain counts are written short (8.6M), the rest with their unit (21.5 GB). */
function quantity(locale: string, sku: UsageChargesSku, value: number) {
  if (!sku.unit) return numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  return `${numberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${sku.unit}`
}

/** A small ring: how much of the allowance is used. Decorative; the figures beside it say it. */
function Ring({ share, over }: { share: number; over: boolean }) {
  const r = 6
  const c = 2 * Math.PI * r
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 -rotate-90">
      <circle cx="8" cy="8" r={r} fill="none" strokeWidth="2" className="stroke-line" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0, share)))}
        className={over ? 'stroke-warning' : 'stroke-fg-subtle'}
      />
    </svg>
  )
}

interface SkuTableProps {
  copy: UsageChargesCopy
  locale: string
  currency: string
  rows: SkuRow[]
  total: number
  loading?: boolean
}

function SkuTable({ copy, locale, currency, rows, total, loading }: SkuTableProps) {
  const money = numberFormat(locale, { style: 'currency', currency })
  return (
    <Table aria-label={copy.tableTitle} aria-busy={loading || undefined}>
      <TableHeader>
        <TableRow>
          <TableHead className={START}>{copy.sku}</TableHead>
          <TableHead>{copy.usage}</TableHead>
          <TableHead className="text-end">{copy.overage}</TableHead>
          <TableHead className={cn('text-end', END)}>{copy.charge}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ sku, used, overage, charge }) => {
          const over = used > sku.included
          const billed = overage > 0
          return (
            <TableRow key={sku.id}>
              <TableCell className={START}>
                <span className="flex items-center gap-2.5 font-medium">
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: toneColor(sku.tone) }} />
                  {sku.name}
                </span>
              </TableCell>
              <TableCell>
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <span className="flex items-center gap-2 tabular-nums">
                    <Ring share={sku.included > 0 ? used / sku.included : 0} over={over} />
                    <span className="sr-only">{copy.usageOf(quantity(locale, sku, used), quantity(locale, sku, sku.included), over)}</span>
                    <span aria-hidden>
                      {quantity(locale, sku, used)} <span className="text-fg-muted">/ {quantity(locale, sku, sku.included)}</span>
                    </span>
                  </span>
                )}
              </TableCell>
              <TableCell className="text-end tabular-nums">{loading ? <Skeleton className="ms-auto h-4 w-14" /> : billed ? quantity(locale, sku, overage) : <span className="text-fg-muted">{copy.none}</span>}</TableCell>
              <TableCell className={cn('text-end tabular-nums', END)}>
                {loading ? <Skeleton className="ms-auto h-4 w-14" /> : <span className={cn(!billed && 'text-fg-muted')}>{money.format(charge)}</span>}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className={START} colSpan={3}>
            {copy.total}
          </TableCell>
          <TableCell className={cn('text-end tabular-nums', END)}>{loading ? <Skeleton className="ms-auto h-4 w-16" /> : money.format(total)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

export { SkuTable, quantity }
