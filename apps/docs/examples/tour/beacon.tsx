'use client'

import { useState } from 'react'
import { BellIcon } from '@youj/icons'
import { Button, Tour, TourBeacon } from '@youj/react'

export default function TourBeaconDemo() {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  return (
    <div ref={setFrame} className="relative flex h-[300px] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg [contain:paint]">
      <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="font-semibold">Payouts</span>
        <span className="relative ms-auto">
          <Button id="tour-beacon-bell" variant="outline" size="icon" aria-label="Notifications">
            <BellIcon />
          </Button>
          {!seen && <TourBeacon className="absolute -end-2 -top-2" label="What’s new: notifications" onClick={() => setOpen(true)} />}
        </span>
      </header>
      <p className="m-auto max-w-xs text-center text-ui text-fg-muted">
        {seen ? 'Seen. The beacon is gone until the next new thing.' : 'A beacon marks what’s new. Click the dot by the bell.'}
      </p>
      <Tour
        container={frame}
        open={open}
        onOpenChange={setOpen}
        onComplete={() => setSeen(true)}
        onSkip={() => setSeen(true)}
        allowInteraction
        steps={[{ target: '#tour-beacon-bell', title: 'New: notifications', body: 'Get told when a payout lands or a refund goes out. The bell works while this is open.' }]}
      />
    </div>
  )
}
