'use client'

import { UnitChart } from '@youj/react'
import { Demo } from './demo'

/** Quarter-hour slots from 11:30, as "HH:MM". */
const slot = (i: number) => {
  const minutes = 11 * 60 + 30 + i * 15
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
const COVERS = [3, 6, 9, 12, 13, 11, 9, 7, 5, 3, 2, 1, 0, 0, 1, 2, 3, 5, 8, 11, 14, 17, 19, 18, 16, 14, 12, 10, 8, 6, 5, 4, 3, 2, 1, 0].map(
  (value, i) => ({ label: slot(i), value }),
)
const covers = (value: number) => `${value} ${value === 1 ? 'cover' : 'covers'}`
const TOTAL = COVERS.reduce((sum, bucket) => sum + bucket.value, 0)

/** A bistro's evening, one dot a cover: point at a column to read it. */
export default function UnitsTile() {
  return (
    <Demo>
      <div className="explore-box flex w-full max-w-md flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{TOTAL}</span>
            <span className="text-ui-sm text-fg-muted">covers expected</span>
          </div>
          <span className="text-ui-sm text-fg-muted">One dot, one cover</span>
        </div>
        <UnitChart data={COVERS} formatValue={covers} label="Covers through the day" tickEvery={8} highlight={[18, 30]} />
      </div>
    </Demo>
  )
}
