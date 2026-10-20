'use client'

import { useState } from 'react'
import { Button, ConfirmDialog } from '@youj/react'
import { KeyIcon } from '@youj/icons'

export default function AlertDialogPlain() {
  const [open, setOpen] = useState(false)
  const [revoked, setRevoked] = useState(false)

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <KeyIcon size={16} className="text-fg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-ui font-medium text-fg">Deploy key</span>
        <span className="text-ui-sm text-fg-muted">{revoked ? 'Revoked' : 'Last used 2 hours ago'}</span>
      </div>
      <Button variant="outline" size="sm" disabled={revoked} onClick={() => setOpen(true)}>
        Revoke
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<KeyIcon />}
        title="Revoke this key?"
        description="Deploys that use it start failing immediately."
        // No `challenge`: the plain tier. Focus starts on Cancel.
        consequences={['2 pipelines use this key']}
        confirmLabel="Revoke key"
        onConfirm={() => setRevoked(true)}
      />
    </div>
  )
}
