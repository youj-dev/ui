'use client'

import { useState } from 'react'
import { FilterBuilder, type FilterField, type FilterGroup } from '@youj/react'

const FIELDS: FilterField[] = [
  { id: 'level', label: 'Level', type: 'select', options: ['debug', 'info', 'warn', 'error'] },
  { id: 'service', label: 'Service', type: 'select', options: ['api', 'billing', 'worker', 'web'] },
  { id: 'message', label: 'Message', type: 'text' },
  { id: 'duration', label: 'Duration (ms)', type: 'number' },
  { id: 'at', label: 'Logged', type: 'date' },
  { id: 'retried', label: 'Retried', type: 'boolean' },
]

const START: FilterGroup = {
  type: 'group',
  combinator: 'or',
  children: [
    { type: 'rule', field: 'level', operator: 'is', value: 'error' },
    {
      type: 'group',
      combinator: 'and',
      children: [
        { type: 'rule', field: 'service', operator: 'isAnyOf', value: ['api', 'billing'] },
        { type: 'rule', field: 'duration', operator: 'between', value: [500, 5000] },
        {
          type: 'group',
          combinator: 'or',
          children: [
            { type: 'rule', field: 'message', operator: 'contains', value: 'timeout' },
            { type: 'rule', field: 'retried', operator: 'isTrue' },
          ],
        },
      ],
    },
  ],
}

export default function FilterBuilderNested() {
  const [filter, setFilter] = useState(START)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <FilterBuilder fields={FIELDS} maxDepth={3} value={filter} onValueChange={setFilter} />
      <pre aria-label="Applied filter as JSON" className="max-h-48 overflow-auto rounded-lg border border-line-subtle bg-band p-3 font-mono text-ui-sm yj-scrollbar">
        {JSON.stringify(filter, (key, value) => (key === 'id' ? undefined : value))}
      </pre>
    </div>
  )
}
