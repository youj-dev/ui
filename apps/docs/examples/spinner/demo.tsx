'use client'

import { Button, Spinner } from '@youj/react'

export default function SpinnerDemo() {
  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      {/* The row's own status line announces the wait, so the spinner stays silent. */}
      <Spinner label={null} className="text-fg-muted" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-ui font-medium text-fg">Importing 1,204 issues</p>
        <p className="truncate text-ui-sm text-fg-muted">From GitHub · about a minute left</p>
      </div>
      <Button variant="ghost" size="sm">
        Cancel
      </Button>
      <span role="status" className="sr-only">
        Importing issues from GitHub
      </span>
    </div>
  )
}
