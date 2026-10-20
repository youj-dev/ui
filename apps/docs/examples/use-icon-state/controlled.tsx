'use client'

import { useState } from 'react'
import { MicIcon, useIconState } from '@youj/icons'

export default function UseIconStateControlled() {
  // The call owns the state. The button reads it and reports presses back.
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState('')
  const mic = useIconState({
    label: 'Mute',
    active: muted,
    onActiveChange: (next) => {
      setMuted(next)
      setNotice('')
    },
  })

  const muteEveryone = () => {
    setMuted(true)
    setNotice('Jonas muted everyone')
  }

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-fg">Design review</p>
          <p className="text-xs text-fg-muted">6 people · hosted by Jonas Weber</p>
        </div>
        <button
          {...mic.buttonProps}
          className="grid size-10 place-items-center rounded-full border border-line bg-surface text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:border-transparent aria-pressed:bg-danger aria-pressed:text-on-accent"
        >
          <MicIcon {...mic.iconProps} size={18} />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-4 py-2.5">
        <p role="status" className="min-w-0 truncate text-xs text-fg-muted">
          {notice || (muted ? 'You’re muted' : 'Your microphone is on')}
        </p>
        <button
          type="button"
          onClick={muteEveryone}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Host: mute everyone
        </button>
      </div>
    </div>
  )
}
