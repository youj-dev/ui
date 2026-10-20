'use client'

import { useEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { MenuIcon, PlayIcon, ThemeIcon } from '@youj/icons'

const ICONS = [MenuIcon, PlayIcon, ThemeIcon]

const button =
  'h-8 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'

export default function IconReversal() {
  const k = useYouj()
  const [active, setActive] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  // Toggle, then toggle straight back while the morph is still in flight.
  const interrupt = () => {
    clearTimeout(timer.current)
    setActive((a) => !a)
    timer.current = setTimeout(() => setActive((a) => !a), k.ms('fast'))
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div className="flex items-center gap-10 text-fg" aria-hidden>
        {ICONS.map((Icon) => (
          <Icon key={Icon.meta.name} active={active} size={56} strokeWidth={1.25} />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" aria-pressed={active} onClick={() => setActive(!active)} className={button}>
          Toggle
        </button>
        <button type="button" onClick={interrupt} className={button}>
          Interrupt mid-morph
        </button>
      </div>
      <p className="font-mono text-xs text-fg-muted">
        {ICONS.map((Icon) => Icon.meta.states![active ? 1 : 0]).join(' · ')}
      </p>
    </div>
  )
}
