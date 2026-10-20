'use client'

import { useState } from 'react'
import { Button, FilterBuilder, describeFilter, type FilterGroup } from '@youj/react'
import { DEAL_FIELDS } from './deals'

const SAVED: Array<{ name: string; filter: FilterGroup }> = [
  {
    name: 'Ada’s open deals',
    filter: {
      type: 'group',
      combinator: 'and',
      children: [
        { type: 'rule', field: 'owner', operator: 'is', value: 'Ada' },
        { type: 'rule', field: 'stage', operator: 'isAnyOf', value: ['Lead', 'Qualified', 'Proposal'] },
      ],
    },
  },
  {
    name: 'Renewals closing soon',
    filter: {
      type: 'group',
      combinator: 'and',
      children: [
        { type: 'rule', field: 'tags', operator: 'hasAny', value: ['renewal'] },
        { type: 'rule', field: 'closes', operator: 'between', value: ['2026-10-01', '2026-11-30'] },
      ],
    },
  },
  {
    name: 'Big or partner',
    filter: {
      type: 'group',
      combinator: 'or',
      children: [
        { type: 'rule', field: 'amount', operator: 'gt', value: 100000 },
        { type: 'rule', field: 'tags', operator: 'hasAny', value: ['partner'] },
      ],
    },
  },
]

export default function FilterBuilderSummary() {
  const [filter, setFilter] = useState(SAVED[0]!.filter)

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <ul aria-label="Saved views" className="flex flex-col divide-y divide-line-subtle rounded-lg border border-line-subtle bg-surface">
        {SAVED.map((saved) => {
          const current = describeFilter(saved.filter, DEAL_FIELDS) === describeFilter(filter, DEAL_FIELDS)
          return (
            <li key={saved.name} className="flex items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-ui font-medium">{saved.name}</p>
                <p className="truncate text-ui-sm text-fg-muted">{describeFilter(saved.filter, DEAL_FIELDS)}</p>
              </div>
              <Button variant="ghost" size="sm" disabled={current} onClick={() => setFilter(saved.filter)}>
                {current ? 'Applied' : 'Apply view'}
              </Button>
            </li>
          )
        })}
      </ul>
      <FilterBuilder fields={DEAL_FIELDS} value={filter} onValueChange={setFilter} />
    </div>
  )
}
