'use client'

import { useRef, useState } from 'react'
import { Button, ConfirmDialog } from '@youj/react'
import { TrashIcon } from '@youj/icons'

export default function AlertDialogDeleteAccount() {
  const [open, setOpen] = useState(false)
  const attempts = useRef(0)

  return (
    <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-ui font-medium text-fg">Delete account</span>
        <span className="text-ui-sm text-fg-muted">Removes you and everything you own.</span>
      </div>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<TrashIcon />}
        title="Delete your account?"
        description="Your workspaces, repositories and billing history are deleted for good."
        consequences={['3 workspaces you own', '24 repositories', 'Your subscription is cancelled']}
        confirmLabel="Delete account"
        pendingLabel="Deleting account"
        challenge="delete my account"
        // The first try fails, so the dialog stays open with the reason and the typed phrase; the second one lands.
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            setTimeout(() => {
              attempts.current += 1
              if (attempts.current === 1) reject(new Error('You still own workspace “Acme”. Transfer it, then try again.'))
              else resolve()
            }, 1000),
          )
        }
      />
    </div>
  )
}
