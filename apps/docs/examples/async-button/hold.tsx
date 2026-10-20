'use client'

import { AsyncButton } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AsyncButtonHold() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-ui font-medium text-fg">€1,240.00 to Northwind Ltd</p>
        <p className="text-ui-sm text-fg-muted">Invoice INV-2041 · arrives today</p>
      </div>
      {/* A full hold runs the action; then Sending… → Sent, as any AsyncButton. */}
      <AsyncButton hold onAction={() => wait(1400)} pendingLabel="Sending…" successLabel="Sent" errorLabel="Payment declined">
        Send payment
      </AsyncButton>
    </div>
  )
}
