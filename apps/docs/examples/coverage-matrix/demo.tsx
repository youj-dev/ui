'use client'

import { useState } from 'react'
import { CoverageMatrix, type CoverageMatrixColumn, type CoverageMatrixRow } from '@youj/react'

/** A made-up app's features against the platforms they ship on, filled by how complete each is (0–3). */
const COLUMNS: CoverageMatrixColumn[] = [
  { id: 'web', label: 'Web' },
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
  { id: 'desktop', label: 'Desktop' },
]
const ROWS: CoverageMatrixRow[] = [
  { id: 'sync', label: 'Offline sync', values: [3, 3, 2, 1] },
  { id: 'share', label: 'Sharing', values: [3, 2, 2, 0] },
  { id: 'search', label: 'Search', values: [3, 1, 1, 2] },
  { id: 'export', label: 'Export', values: [2, 0, 0, 3] },
  { id: 'widgets', label: 'Widgets', values: [0, 3, 2, 0] },
]

export default function CoverageMatrixDemo() {
  const [row, setRow] = useState('export')
  const picked = ROWS.find((r) => r.id === row)
  const gaps = picked ? COLUMNS.filter((_, c) => !picked.values[c]).map((col) => col.label) : []
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <CoverageMatrix
        rows={ROWS}
        columns={COLUMNS}
        max={3}
        value={row}
        onValueChange={setRow}
        formatValue={(v) => `${v} of 3`}
        noneLabel="Not started"
        label="Features by platform"
      />
      <p className="text-ui text-fg-muted">
        {gaps.length ? `${picked?.label} is missing on ${gaps.join(' and ')}.` : `${picked?.label} ships everywhere.`}
      </p>
    </div>
  )
}
