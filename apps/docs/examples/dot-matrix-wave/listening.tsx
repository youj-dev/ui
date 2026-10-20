'use client'

import { useState } from 'react'
import { SendIcon, WebhookIcon } from '@youj/icons'
import { DotMatrixWave } from '@youj/motion/backgrounds'

export default function DotMatrixWaveListening() {
  const [sent, setSent] = useState(0)

  return (
    <div className="relative isolate w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-canvas">
      {/* Ambient pulses say "listening". A press anywhere in the field, the button included, sends a ring from that point. */}
      <DotMatrixWave spacing={18} />
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-20% to-transparent to-65%" />
      <div className="relative flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg shadow-sm">
          <WebhookIcon size={18} />
        </span>
        <p className="mt-4 text-sm font-medium text-fg">Listening for events</p>
        <p className="mt-1 max-w-xs text-sm text-fg-muted">
          Point your provider at <span className="font-mono text-xs text-fg">hooks.youj.io/7f3a</span>, or send a test event.
        </p>
        <button
          type="button"
          onClick={() => setSent((n) => n + 1)}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-fg px-3.5 py-2 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          <SendIcon size={15} />
          Send test event
        </button>
        <p role="status" className="mt-3 h-4 text-xs text-fg-muted">
          {sent > 0 && `${sent} test ${sent === 1 ? 'event' : 'events'} sent`}
        </p>
      </div>
    </div>
  )
}
