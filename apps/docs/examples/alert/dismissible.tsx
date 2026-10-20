'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle, Button } from '@youj/react'

const NOTICES = [
  { id: 'maintenance', variant: 'info', title: 'Maintenance on October 3', body: 'Read-only from 02:00 to 02:20 UTC.' },
  { id: 'domain', variant: 'success', title: 'youj.io is verified', body: 'Certificates are issued automatically.' },
  { id: 'token', variant: 'warning', title: 'A token expires in 3 days', body: '“CI deploys” stops working on Friday.' },
  { id: 'payment', variant: 'danger', title: 'Payment failed', body: 'Update the card ending 4242.' },
] as const

export default function AlertDismissible() {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  return (
    <div className="flex w-full max-w-md flex-col">
      {/* Each alert's spacing is its own margin, so it collapses with it and leaves no gap behind. */}
      {NOTICES.map((notice) => (
        <Alert
          key={notice.id}
          variant={notice.variant}
          className="mb-2"
          open={open[notice.id] ?? true}
          onOpenChange={(next) => setOpen((all) => ({ ...all, [notice.id]: next }))}
        >
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.body}</AlertDescription>
        </Alert>
      ))}
      <Button variant="outline" size="sm" className="mt-2 self-start" onClick={() => setOpen({})}>
        Bring them back
      </Button>
    </div>
  )
}
