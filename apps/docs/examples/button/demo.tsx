'use client'

import { useState } from 'react'
import { Button, AsyncButton } from '@youj/react'
import { DownloadIcon, GitBranchIcon, MoreHorizontalIcon, SendIcon } from '@youj/icons'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ButtonDemo() {
  const [published, setPublished] = useState(false)

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-band text-fg">
          <GitBranchIcon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-ui-lg font-medium text-fg">Publish 3 changes to production</p>
          <p className="mt-1 text-ui text-fg-muted">
            {published
              ? 'Live on youj.io. The previous version is kept for rollback.'
              : 'Pricing page, new onboarding copy and the updated OG image.'}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="More actions">
          <MoreHorizontalIcon />
        </Button>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line bg-canvas px-5 py-3">
        <Button variant="ghost" onClick={() => setPublished(false)}>
          {published ? 'Roll back' : 'Discard'}
        </Button>
        <Button variant="outline">
          <DownloadIcon />
          Export
        </Button>
        {/* onAction runs the work and shows its whole lifecycle in place. */}
        <AsyncButton
          onAction={async () => {
            await wait(1600)
            setPublished(true)
          }}
          pendingLabel="Publishing…"
          successLabel="Published"
          errorLabel="Couldn’t publish"
          disabled={published}
        >
          {published ? 'Published' : 'Publish'}
          {!published && <SendIcon />}
        </AsyncButton>
      </div>
    </div>
  )
}
