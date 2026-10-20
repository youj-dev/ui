'use client'

import { SlideToConfirm } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function SlideToConfirmDanger() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-danger-line bg-danger-subtle p-5">
      <div>
        <p className="text-ui font-medium text-fg">Delete workspace “atlas”</p>
        <p className="text-ui-sm text-fg-muted">12 projects, 38 members and every deployment go with it.</p>
      </div>
      <SlideToConfirm tone="danger" label="Slide to delete workspace" confirmingLabel="Deleting…" confirmedLabel="Deleted" onConfirm={() => wait(1400)} />
    </div>
  )
}
