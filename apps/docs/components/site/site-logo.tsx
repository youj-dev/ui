'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useYouj } from '@youj/core'
import { YoujLockup } from '@/components/client'
import { cn } from '@/lib/cn'

/**
 * The logo, linking home, set 24px tall (the text cut, its tittle grown so it
 * reads). Pointing at it replays the stamp: the letters rise into place and
 * the tittle lands. It rests still on load (the server can't play it) and
 * under reduced motion.
 */
export function SiteLogo({ className }: { className?: string }) {
  const k = useYouj()
  const [take, setTake] = useState(0)
  const playing = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(playing.current), [])

  const replay = () => {
    if (k.reduced || playing.current) return
    setTake((t) => t + 1)
    playing.current = setTimeout(() => (playing.current = undefined), k.ms('deliberate') * 2)
  }

  return (
    <Link
      href="/"
      aria-label="Youj home"
      onPointerEnter={replay}
      onFocus={replay}
      className={cn('site-logo flex h-9 touch:h-11 items-center rounded-md px-1 focus-ring', className)}
    >
      {/* The tittle's paint: the aurora, a small gradient its rect fills with (styles/site.css, .site-logo). */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="site-aurora" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="aurora-stop-1" />
            <stop offset="0.5" className="aurora-stop-2" />
            <stop offset="1" className="aurora-stop-3" />
          </linearGradient>
        </defs>
      </svg>
      <YoujLockup key={take} animated={take > 0} className="text-[24px]" />
    </Link>
  )
}
