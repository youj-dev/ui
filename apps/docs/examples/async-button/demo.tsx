'use client'

import { useState, type ReactNode } from 'react'
import { AsyncButton } from '@youj/react'
import { RefreshIcon } from '@youj/icons'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function AsyncButtonDemo() {
  const [synced, setSynced] = useState('2 minutes ago')

  return (
    <div className="w-full max-w-lg divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      <Row title="Profile" detail="Name, avatar and time zone.">
        {/* Resolve for success. */}
        <AsyncButton onAction={() => wait(1200)} pendingLabel="Saving…" successLabel="Saved" errorLabel="Couldn’t save">
          Save
        </AsyncButton>
      </Row>
      <Row title="Payment method" detail="Visa ending in 4242. The last charge was declined.">
        {/* Reject, or throw, for an error. It shakes, then returns to rest. */}
        <AsyncButton
          variant="outline"
          onAction={async () => {
            await wait(1200)
            throw new Error('card_declined')
          }}
          pendingLabel="Charging…"
          successLabel="Paid"
          errorLabel="Card declined"
        >
          Retry charge
        </AsyncButton>
      </Row>
      <Row title="GitHub" detail={`Last synced ${synced}.`}>
        {/* Icon-only buttons stay square: their labels are announced, not shown. */}
        <AsyncButton
          variant="ghost"
          size="icon-sm"
          aria-label="Sync repositories"
          onAction={() => wait(900)}
          onActionStateChange={(state) => state === 'success' && setSynced('just now')}
          successLabel="Synced"
          errorLabel="Sync failed"
        >
          <RefreshIcon />
        </AsyncButton>
      </Row>
    </div>
  )
}

function Row({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-ui font-medium text-fg">{title}</p>
        <p className="text-ui-sm text-fg-muted">{detail}</p>
      </div>
      {children}
    </div>
  )
}
