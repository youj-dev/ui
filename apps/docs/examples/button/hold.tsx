'use client'

import { AsyncButton } from '@youj/react'
import { TrashIcon } from '@youj/icons'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ButtonHold() {
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-4 rounded-xl border border-danger-line bg-danger-subtle px-4 py-3">
      <div className="min-w-0">
        <p className="text-ui font-medium text-fg">Delete “atlas-web”</p>
        <p className="text-ui-sm text-fg-muted">Removes 214 deployments and every domain.</p>
      </div>
      {/* Runs only once the press is held: the fill sweeps across, letting go early springs it back. */}
      <AsyncButton variant="danger" hold onAction={() => wait(1200)} pendingLabel="Deleting…" successLabel="Deleted">
        <TrashIcon />
        Delete project
      </AsyncButton>
    </div>
  )
}
