'use client'

import { DiffBar, type DiffBarProps } from '@youj/react'

const PCT: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent', maximumFractionDigits: 1 }

const ROWS: (DiffBarProps & { id: string })[] = [
  { id: 'accuracy', label: 'Accuracy', a: 91.2, b: 92.4, format: PCT },
  { id: 'latency', label: 'Latency p95', a: 1840, b: 910, better: 'lower', format: { style: 'unit', unit: 'millisecond' } },
  { id: 'cost', label: 'Cost / 1K runs', a: 4.1, b: 1.35, better: 'lower', format: { style: 'currency', currency: 'USD' } },
  { id: 'faithfulness', label: 'Faithfulness', a: 88.4, b: 86.9, format: PCT },
  { id: 'toxicity', label: 'Toxicity', a: 0.4, b: 0.4, better: 'lower', format: PCT },
]

export default function DiffBarDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-line bg-surface p-5">
      {ROWS.map(({ id, ...row }) => (
        <DiffBar key={id} {...row} names={['Large', 'Mini']} />
      ))}
    </div>
  )
}
