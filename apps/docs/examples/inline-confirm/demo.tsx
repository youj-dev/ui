'use client'

import { TrashIcon } from '@youj/icons'
import { InlineConfirm } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InlineConfirmDemo() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-xl border border-line bg-surface py-2 ps-4 pe-2">
      <div className="min-w-0">
        <p className="truncate text-ui font-medium text-fg">q3-forecast.xlsx</p>
        <p className="text-ui-sm text-fg-muted">2.4 MB · edited yesterday</p>
      </div>
      <InlineConfirm
        destructive
        variant="ghost"
        size="sm"
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        successLabel="Deleted"
        onConfirm={() => wait(1200)}
      >
        <TrashIcon />
        Delete
      </InlineConfirm>
    </div>
  )
}
