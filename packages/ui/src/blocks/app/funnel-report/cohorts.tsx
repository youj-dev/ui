'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { cn, numberFormat } from '../../../lib/utils'
import type { FunnelReportCopy } from './copy'
import { pct, type Cohort } from './data'

/** How strongly a share tints its cell: week 0 (always 100%) sits at the top, the plateau near the bottom. */
const heat = (share: number) => `color-mix(in oklab, var(--color-chart-1) ${Math.round(8 + share * 44)}%, transparent)`

/** Weekly trial cohorts down the side, weeks since signup across: the share of each cohort still active, as a heat grid. */
function Cohorts({ cohorts, locale, copy }: { cohorts: Cohort[]; locale: string; copy: FunnelReportCopy }) {
  const percent = useMemo(() => pct(locale), [locale])
  const number = useMemo(() => numberFormat(locale).format, [locale])
  const weeks = Math.max(0, ...cohorts.map((c) => c.retention.length))
  const average = Array.from({ length: weeks }, (_, w) => {
    const rows = cohorts.filter((c) => c.retention[w] !== undefined)
    const size = rows.reduce((t, c) => t + c.size, 0)
    return rows.reduce((t, c) => t + c.retention[w]! * c.size, 0) / size
  })
  const last = weeks - 1

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.cohortsTitle}</CardTitle>
        <CardDescription>{copy.cohortsDescription(percent(average[last] ?? 0), Math.max(0, last))}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Table aria-label={copy.cohortsTable} className="border-separate border-spacing-0.5 text-ui-sm">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="ps-0">
                {copy.cohort}
              </TableHead>
              <TableHead scope="col" className="text-end">
                {copy.teams}
              </TableHead>
              {Array.from({ length: weeks }, (_, w) => (
                <TableHead key={w} scope="col" className="min-w-12 text-center">
                  <span aria-hidden>{copy.weekShort(w)}</span>
                  <span className="sr-only">{copy.week(w)}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cohorts.map((cohort) => (
              <TableRow key={cohort.label} className="hover:bg-transparent">
                <TableHead scope="row" className="ps-0 font-normal whitespace-nowrap text-fg">
                  {cohort.label}
                </TableHead>
                <TableCell className="text-end text-fg-muted tabular-nums">{number(cohort.size)}</TableCell>
                {Array.from({ length: weeks }, (_, w) => {
                  const share = cohort.retention[w]
                  return (
                    <TableCell
                      key={w}
                      className={cn(
                        'h-10 rounded-xs border-0 p-0 text-center font-mono text-ui-sm transition-[background-color] yj-duration-slow ease-standard',
                        share === undefined && 'bg-transparent',
                      )}
                      style={share === undefined ? undefined : { background: heat(share) }}
                    >
                      {share === undefined ? <span className="sr-only">{copy.notYet}</span> : <span className="tabular-nums">{percent(share)}</span>}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="row" className="ps-0 text-fg">
                {copy.average}
              </TableHead>
              <TableCell className="text-end text-fg-muted tabular-nums">{number(cohorts.reduce((t, c) => t + c.size, 0))}</TableCell>
              {average.map((share, w) => (
                <TableCell key={w} className="p-0 text-center font-mono text-ui-sm font-medium">
                  <span className="tabular-nums">{percent(share)}</span>
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
        <div aria-hidden className="mt-4 flex items-center justify-end gap-2 font-mono text-ui-xs text-fg-muted uppercase">
          <span>{copy.fewer}</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map((share) => (
            <span key={share} className="size-3 rounded-xs" style={{ background: heat(share) }} />
          ))}
          <span>{copy.more}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export { Cohorts }
