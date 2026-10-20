'use client'

import { useEffect, useRef } from 'react'
import { useYouj } from '@youj/core'
import { CopyIcon, useIconState } from '@youj/icons'

const KEY = 'yk_demo_key_0000000000'

export default function UseIconStateCopy() {
  const k = useYouj()
  // An action: the name says what the button does now, then what just happened.
  const copy = useIconState({ labels: ['Copy API key', 'Copied'] })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const onCopy = () => {
    navigator.clipboard?.writeText(KEY).catch(() => {})
    copy.setActive(true)
    // The hook holds no timer: the revert is app logic, on the token clock so Speed reaches it.
    clearTimeout(timer.current)
    timer.current = setTimeout(() => copy.setActive(false), k.ms('deliberate') * 3)
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-medium text-fg">Production key</p>
      <p className="mt-0.5 text-xs text-fg-muted">Use it from your server only.</p>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-canvas ps-3 pe-1">
        <code className="min-w-0 flex-1 truncate font-mono text-xs text-fg">{KEY}</code>
        <button
          {...copy.buttonProps}
          onClick={onCopy}
          className="grid size-8 place-items-center rounded-md text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <CopyIcon {...copy.iconProps} size={16} strokeWidth={1.75} />
        </button>
      </div>
      {/* A changed name isn't announced by itself, so the result gets a polite status. */}
      <p role="status" className="sr-only">
        {copy.active ? 'API key copied to the clipboard' : ''}
      </p>
    </div>
  )
}
