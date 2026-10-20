'use client'

import { useState, type ReactNode } from 'react'
import { BellIcon, CheckCircleIcon, LoaderRingIcon, MicIcon, RefreshIcon } from '@youj/icons'

function Card({ trigger, note, children }: { trigger: string; note: string; children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex h-28 items-center justify-center gap-3 border-b border-line bg-canvas px-3">{children}</div>
      <div className="px-3.5 py-3">
        <p className="font-mono text-xs text-fg">{trigger}</p>
        <p className="mt-1 text-xs leading-relaxed text-fg-muted">{note}</p>
      </div>
    </div>
  )
}

const button =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'

export default function IconTriggers() {
  const [muted, setMuted] = useState(false)

  return (
    <div className="@container w-full max-w-3xl">
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-4">
        <Card trigger={'trigger="hover"'} note="Plays while its button is hovered or keyboard-focused.">
          <button type="button" className={button}>
            <BellIcon size={16} strokeWidth={1.75} />
            Notifications
          </button>
        </Card>

        <Card trigger={'trigger="mount"'} note="Plays once as it appears. Press Replay above.">
          <p className="flex items-center gap-2 text-sm font-medium text-fg">
            <CheckCircleIcon trigger="mount" size={18} strokeWidth={1.75} className="text-success" />
            Deployed
          </p>
        </Card>

        <Card trigger={'trigger="loop"'} note="Repeats while on screen, and pauses offscreen and in hidden tabs.">
          <span className="flex items-center gap-1.5 text-xs text-fg-muted">
            <LoaderRingIcon size={18} />
            continuous
          </span>
          <span className="flex items-center gap-1.5 text-xs text-fg-muted">
            <RefreshIcon trigger="loop" size={18} />
            cycle
          </span>
        </Card>

        <Card trigger="active={muted}" note="Controlled from state. It wins over any trigger.">
          <button type="button" aria-pressed={muted} onClick={() => setMuted(!muted)} className={`${button} aria-pressed:bg-raised [&[aria-pressed=true]>svg]:text-danger`}>
            <MicIcon size={16} strokeWidth={1.75} active={muted} />
            Mute
          </button>
        </Card>
      </div>
    </div>
  )
}
