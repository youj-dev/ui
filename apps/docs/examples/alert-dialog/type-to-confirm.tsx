'use client'

import { useState } from 'react'
import { Button, ConfirmDialog } from '@youj/react'
import { TrashIcon } from '@youj/icons'

// Stands in for the request to your API.
const deleteProject = () => new Promise<void>((resolve) => setTimeout(resolve, 1000))

export default function AlertDialogTypeToConfirm() {
  const [open, setOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-mono text-ui font-medium text-fg">acme/orion</span>
        <span className="text-ui-sm text-fg-muted">{deleted ? 'Deleted' : '12 deployments · 3 domains'}</span>
      </div>
      <Button variant="danger" size="sm" disabled={deleted} onClick={() => setOpen(true)}>
        Delete project
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<TrashIcon />}
        title="Delete acme/orion?"
        description="This can’t be undone."
        // What will be lost, with counts.
        consequences={['12 deployments and their logs', '3 custom domains', '48 environment variables', 'Access for 7 members']}
        confirmLabel="Delete project"
        pendingLabel="Deleting acme/orion"
        // The phrase to type: shown in a copyable chip, matched exactly (case-sensitive, trimmed).
        challenge="acme/orion"
        onConfirm={() => deleteProject().then(() => setDeleted(true))}
      />
    </div>
  )
}
