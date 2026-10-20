'use client'

import { useState } from 'react'
import { Button, ConfirmDialog } from '@youj/react'
import { TrashIcon } from '@youj/icons'
import { IllustrationWarehouse } from '@youj/illustrations'
import { LoaderOffshoot } from '@youj/loaders/offshoot'

// Stands in for the request to your API.
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AlertDialogDemo() {
  const [open, setOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface shadow-xs">
      <div className="border-b border-line px-4 py-3">
        <span className="text-ui font-semibold text-fg">Danger zone</span>
      </div>
      <div className="flex items-center gap-4 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-ui font-medium text-fg">Delete this project</span>
          <span role="status" className="text-ui-sm text-fg-muted">
            {deleted ? 'orion and its 214 deployments were deleted.' : 'Removes orion with its deployments and domains.'}
          </span>
        </div>
        <Button variant="danger" size="sm" disabled={deleted} focusableWhenDisabled onClick={() => setOpen(true)}>
          <TrashIcon />
          {deleted ? 'Deleted' : 'Delete…'}
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<TrashIcon />}
        title="Delete orion?"
        description="Its 214 deployments, 3 domains and every environment variable go with it. This can’t be undone."
        confirmLabel="Delete project"
        pendingLabel="Deleting orion"
        challenge="orion"
        onConfirm={async () => {
          // A promise keeps the dialog open, and busy, until the work lands.
          setDeleting(true)
          await wait(1200)
          setDeleting(false)
          setDeleted(true)
        }}
      >
        {/* Decorative: the warehouse, and while it's deleting a loader in its place (the button already announces the wait). */}
        <div className="grid h-28 place-items-center rounded-lg">
          {deleting ? <LoaderOffshoot size={72} label={null} /> : <IllustrationWarehouse unit={10} />}
        </div>
      </ConfirmDialog>
    </div>
  )
}
