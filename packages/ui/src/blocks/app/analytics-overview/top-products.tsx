'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Sparkline } from '../../../components/ui/sparkline'
import { StatDelta } from '../../../components/ui/stat-card'
import { Treemap } from '../../../components/ui/treemap'
import type { AnalyticsOverviewCopy } from './copy'
import { CATEGORIES, usd, withCurrency, type Summary } from './data'
import { numberFormat } from '../../../lib/utils'

const TOP = 5
type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
/** The demo's categories keep their colors as they re-rank; your own take the palette in the order you list them. */
const KNOWN = Object.keys(CATEGORIES)
const toneOf = (summary: Summary, key: string): Tone => {
  const known = KNOWN.indexOf(key)
  const i = known >= 0 ? known : summary.categories.findIndex((c) => c.key === key)
  return `chart-${(Math.max(0, i) % 5) + 1}` as Tone
}

interface PartProps {
  summary: Summary
  locale: string
  currency: string
  copy: AnalyticsOverviewCopy
}

/** The period's best sellers, ranked by revenue, each with its change on the period before and its shape across the range. */
function TopProducts({ summary, locale, currency, copy }: PartProps) {
  const money = useMemo(() => numberFormat(locale, withCurrency(usd, currency)).format, [locale, currency])
  const units = useMemo(() => numberFormat(locale).format, [locale])
  const rows = summary.products.slice(0, TOP)
  const categoryName = (key: string) => summary.categories.find((c) => c.key === key)?.label ?? key
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.productsTitle}</CardTitle>
        <CardDescription>{copy.productsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-ui text-fg-muted">{copy.noSales}</p>
        ) : (
          <Table aria-label={copy.productsTable}>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-8 ps-0">
                  <span aria-hidden>#</span>
                  <span className="sr-only">{copy.rank}</span>
                </TableHead>
                <TableHead scope="col">{copy.product}</TableHead>
                <TableHead scope="col" className="hidden text-end sm:table-cell">
                  {copy.units}
                </TableHead>
                <TableHead scope="col" className="text-end">
                  {copy.revenue}
                </TableHead>
                <TableHead scope="col" className="text-end">
                  {copy.change}
                </TableHead>
                <TableHead scope="col" className="hidden w-28 md:table-cell">
                  <span className="sr-only">{copy.trend}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell className="ps-0 font-mono text-ui-sm text-fg-muted tabular-nums">{i + 1}</TableCell>
                  <TableCell className="max-w-0 min-w-28 sm:min-w-36">
                    <span className="block truncate font-medium">{row.name}</span>
                    <span className="block text-ui-sm text-fg-muted">{categoryName(row.category)}</span>
                  </TableCell>
                  <TableCell className="hidden text-end tabular-nums sm:table-cell">{units(row.units)}</TableCell>
                  <TableCell className="text-end font-medium tabular-nums">{money(row.revenue)}</TableCell>
                  <TableCell className="text-end">{row.previous > 0 && <StatDelta value={row.revenue / row.previous - 1} />}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Sparkline data={row.trend} color={`var(--color-${toneOf(summary, row.category)})`} area={false} className="h-7 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

/** How revenue splits by category: area is revenue, the leader highlighted. */
function Categories({ summary, locale, currency, copy }: PartProps) {
  const money = useMemo(() => numberFormat(locale, { ...withCurrency(usd, currency), notation: 'compact', maximumFractionDigits: 1 }).format, [locale, currency])
  const items = summary.categories.map((c) => ({ id: c.key, name: c.label, value: Math.round(c.revenue), tone: toneOf(summary, c.key) }))
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.categoriesTitle}</CardTitle>
        <CardDescription>{items[0] ? copy.categoriesLead(items[0].name) : copy.noSales}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <Treemap items={items} highlight={items[0]?.id} formatValue={money} label={copy.categoriesLabel} aspect={1.6} className="min-h-56 flex-1" />
      </CardContent>
    </Card>
  )
}

export { Categories, TopProducts }
