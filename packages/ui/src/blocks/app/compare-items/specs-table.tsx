import type { CSSProperties } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { cn } from '../../../lib/utils'
import type { CompareItem, CompareItemsCopy, CompareSpec } from './data'
import { bestOf } from './model'

interface SpecsTableProps {
  picks: readonly CompareItem[]
  specs: readonly CompareSpec[]
  /** The color each pick wears on the chart, by id. */
  tones: ReadonlyMap<string, string>
  highlight: boolean
  copy: CompareItemsCopy
  formatNumber: (spec: CompareSpec) => Intl.NumberFormat
}

const CELL = 'own:py-2.5 own:ps-2.5 own:pe-2 whitespace-normal border-line-subtle align-baseline'

/** The overview: a row per spec, a column per pick, the columns lining up with the pickers above. */
function SpecsTable({ picks, specs, tones, highlight, copy, formatNumber }: SpecsTableProps) {
  return (
    <Table aria-label={copy.overview} data-slot="compare-items-table" className="table-fixed text-ui">
      <colgroup>
        <col style={{ width: 'var(--compare-items-label)' }} />
        {picks.map((pick) => (
          <col key={pick.id} />
        ))}
      </colgroup>
      <TableHeader className="sr-only">
        <TableRow>
          <TableHead>{copy.overview}</TableHead>
          {picks.map((pick) => (
            <TableHead key={pick.id} scope="col">
              {pick.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {specs.map((spec) => {
          const best = highlight ? bestOf(spec, picks) : new Set<string>()
          return (
            <TableRow key={spec.id} data-slot="compare-items-row" className="hover:bg-transparent">
              <TableHead scope="row" className={cn(CELL, 'ps-0 h-auto text-ui font-normal text-fg-muted [font-family:inherit] tracking-normal normal-case [tbody>tr:last-child>&]:border-b-0')}>
                {spec.label}
              </TableHead>
              {picks.map((pick) => {
                const value = pick.specs[spec.id]
                const lit = best.has(pick.id)
                return (
                  <TableCell
                    key={pick.id}
                    data-slot="compare-items-cell"
                    data-yj-best={lit || undefined}
                    className={cn(CELL, 'relative tabular-nums', lit ? 'own:font-medium own:text-fg' : highlight ? 'own:text-fg-muted' : 'own:text-fg')}
                    style={{ '--compare-items-tone': tones.get(pick.id) } as CSSProperties}
                  >
                    {lit && <span aria-hidden data-slot="compare-items-best" className="absolute start-0.5 top-1/2 -translate-y-1/2 own:size-1.5 own:rounded-full bg-(--compare-items-tone)" />}
                    {value === undefined ? (
                      <span className="own:text-fg-subtle">{copy.empty}</span>
                    ) : spec.kind === 'boolean' ? (
                      <Badge variant={lit ? 'success' : 'secondary'} className={cn('[font-family:inherit] tracking-normal normal-case', !value && 'text-fg-subtle')}>
                        {value ? copy.yes : copy.no}
                      </Badge>
                    ) : spec.kind === 'number' && typeof value === 'number' ? (
                      <>
                        <bdi>{formatNumber(spec).format(value)}</bdi>
                        {spec.unit && <span className="ms-1.5 own:font-normal own:text-ui-sm own:text-fg-subtle">{spec.unit}</span>}
                      </>
                    ) : (
                      <bdi>{String(value)}</bdi>
                    )}
                    {lit && <span className="sr-only">, {copy.best}</span>}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export { SpecsTable }
