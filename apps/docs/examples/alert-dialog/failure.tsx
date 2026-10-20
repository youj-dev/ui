'use client'

import { useState } from 'react'
import { Badge, Button, ConfirmDialog } from '@youj/react'
import { GlobeIcon } from '@youj/icons'
import { LoaderOutpost } from '@youj/loaders/outpost'

// Stands in for the request to your API, which refuses this one.
const removeDomain = () =>
  new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('acme.dev still has 2 aliases: www.acme.dev and docs.acme.dev. Remove them first.')), 900),
  )

export default function AlertDialogFailure() {
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <GlobeIcon size={16} className="text-fg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-ui font-medium text-fg">
          acme.dev
          <Badge variant="success">Valid</Badge>
        </span>
        <span className="text-ui-sm text-fg-muted">Production · 2 aliases</span>
      </div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        // While the request runs, traffic moves off the domain in the badge. The dialog announces the wait itself.
        icon={removing ? <LoaderOutpost size={28} label={null} /> : <GlobeIcon />}
        title="Remove acme.dev?"
        description="Requests to acme.dev stop reaching orion right away."
        confirmLabel="Remove domain"
        pendingLabel="Removing acme.dev"
        // A rejected promise keeps the dialog open and shows the error's message.
        onConfirm={() => {
          setRemoving(true)
          return removeDomain().finally(() => setRemoving(false))
        }}
      />
    </div>
  )
}
