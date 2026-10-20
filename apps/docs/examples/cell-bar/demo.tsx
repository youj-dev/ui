'use client'

import { CellBar, type CellBarCell } from '@youj/react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Twelve months, the first nine settled and the rest forecast. */
const cellsOf = (values: number[]): CellBarCell[] => values.map((value, i) => ({ label: MONTHS[i]!, value, projected: i >= 9 }))
const usd = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`

/** A made-up bakery's year of ingredients, each against its plan. */
const ROWS = [
  { name: 'Flour', tone: 'warning', plan: 4800, cells: cellsOf([310, 320, 340, 360, 390, 420, 460, 500, 540, 560, 590, 620]) },
  { name: 'Butter', tone: 'success', plan: 4400, cells: cellsOf([420, 410, 390, 360, 330, 300, 280, 270, 260, 255, 250, 245]) },
  { name: 'Sugar', tone: 'neutral', plan: 1500, cells: cellsOf([120, 125, 118, 122, 130, 126, 124, 128, 125, 125, 125, 125]) },
] as const

export default function CellBarDemo() {
  return (
    <div className="grid w-full max-w-lg grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-4 text-ui">
      {ROWS.map((row) => (
        <div key={row.name} className="contents">
          <span className="text-fg-muted">{row.name}</span>
          <CellBar cells={row.cells} max={6000} target={row.plan} tone={row.tone} formatValue={usd} label={`${row.name}, by month`} />
        </div>
      ))}
    </div>
  )
}
