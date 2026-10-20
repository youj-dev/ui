'use client'

import { useState } from 'react'
import { Badge, FilterBuilder, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, matchFilter, type FilterGroup } from '@youj/react'
import { DEALS, DEAL_FIELDS } from './deals'

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const START: FilterGroup = {
  type: 'group',
  combinator: 'and',
  children: [
    { type: 'rule', field: 'stage', operator: 'isNot', value: 'Lost' },
    {
      type: 'group',
      combinator: 'or',
      children: [
        { type: 'rule', field: 'owner', operator: 'is', value: 'Ada' },
        { type: 'rule', field: 'amount', operator: 'gt', value: 100000 },
      ],
    },
  ],
}

export default function FilterBuilderDemo() {
  const [filter, setFilter] = useState(START)
  const rows = DEALS.filter((deal) => matchFilter(deal, filter))

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <FilterBuilder fields={DEAL_FIELDS} value={filter} onValueChange={setFilter} />
      <div className="h-72 overflow-y-auto rounded-xl border border-line bg-surface yj-scrollbar">
        <Table aria-label={`Deals, ${rows.length} of ${DEALS.length}`}>
          <TableHeader>
            <TableRow>
              <TableHead>Deal</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-end">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((deal) => (
              <TableRow key={deal.name}>
                <TableCell className="font-medium">{deal.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{deal.stage}</Badge>
                </TableCell>
                <TableCell>{deal.owner}</TableCell>
                <TableCell className="text-end tabular-nums">{usd.format(deal.amount)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-fg-muted">
                  No deals match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
