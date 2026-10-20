'use client'

import { useState } from 'react'
import { Button } from '@youj/react'
import { DownloadIcon, ListChecksIcon } from '@youj/icons'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ButtonLoading() {
  const [exporting, setExporting] = useState(false)
  const [checking, setChecking] = useState(false)

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      <div>
        <p className="text-ui font-medium text-fg">Usage report</p>
        <p className="text-ui-sm text-fg-muted">September, all projects. 14,208 rows.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* `loading` is controlled: you decide when the wait starts and ends. */}
        <Button
          variant="outline"
          loading={exporting}
          loadingLabel="Exporting report"
          onClick={async () => {
            setExporting(true)
            await wait(1800)
            setExporting(false)
          }}
        >
          <DownloadIcon />
          Export CSV
        </Button>
        <Button
          variant="secondary"
          loading={checking}
          loadingLabel="Running checks"
          onClick={async () => {
            setChecking(true)
            await wait(2400)
            setChecking(false)
          }}
        >
          <ListChecksIcon />
          Run checks
        </Button>
      </div>
    </div>
  )
}
