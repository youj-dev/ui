'use client'

import { useEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { BellIcon, BellOffIcon, IconSwap, type IconSwapTransition } from '@youj/icons'

const TRANSITIONS: IconSwapTransition[] = ['scale-blur', 'rotate', 'morph', 'draw', 'flip', 'fold', 'slide', 'wipe', 'zoom', 'pop']

export default function IconSwapTransitions() {
  const k = useYouj()
  const [on, setOn] = useState<boolean[]>(() => TRANSITIONS.map(() => false))
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const all = on.every(Boolean)
  const set = (i: number, value: boolean) => setOn((s) => s.map((v, j) => (j === i ? value : v)))

  // One gesture across the grid: each card starts a stagger step after the one before.
  const swapAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = TRANSITIONS.map((_, i) => setTimeout(() => set(i, !all), i * k.stagger('base') * 1000))
  }

  return (
    <div className="@container w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-fg-muted">Notifications on → muted, ten ways.</p>
        <button
          type="button"
          onClick={swapAll}
          className="h-8 shrink-0 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {all ? 'Reset all' : 'Swap all'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-5">
        {TRANSITIONS.map((id, i) => (
          <button
            key={id}
            type="button"
            aria-pressed={on[i]}
            onClick={() => set(i, !on[i])}
            className="flex flex-col items-center gap-3.5 rounded-xl border border-line bg-surface px-2 pt-6 pb-3.5 text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:border-line-strong aria-pressed:text-fg"
          >
            <IconSwap from={BellIcon} to={BellOffIcon} active={on[i]} transition={id} size={32} />
            <span className="font-mono text-xs text-fg">{id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
