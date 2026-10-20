'use client'

import { SlideToConfirm } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function SlideToConfirmDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-ui font-medium text-fg">Northwind Ltd</p>
        <p className="text-ui-lg font-semibold text-fg tabular-nums">€1,240.00</p>
      </div>
      <p className="text-ui-sm text-fg-muted">Invoice INV-2041 · from Business account ••4417</p>
      <SlideToConfirm label="Slide to pay €1,240" confirmingLabel="Paying…" confirmedLabel="Paid" onConfirm={() => wait(1400)} />
    </div>
  )
}
