'use client'

import { Button } from '@youj/react'
import { DownloadIcon, ListChecksIcon } from '@youj/icons'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ButtonAsync() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div>
        <p className="text-ui font-medium text-fg">Usage report</p>
        <p className="text-ui-sm text-fg-muted">September, all projects. 14,208 rows.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* onClick returns a promise: the button is busy until it settles. No state to keep. */}
        <Button variant="outline" onClick={() => wait(1800)}>
          <DownloadIcon />
          Export CSV
        </Button>
        <Button variant="secondary" onClick={() => wait(2400)}>
          <ListChecksIcon />
          Run checks
        </Button>
      </div>
    </div>
  )
}
