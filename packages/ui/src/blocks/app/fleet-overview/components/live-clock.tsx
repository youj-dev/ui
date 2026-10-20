'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn, dateTimeFormat } from '../../../../lib/utils'

/** A dot that breathes while it's on screen and motion is allowed; still otherwise. */
function LiveDot() {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref)
  return (
    <span ref={ref} aria-hidden className="relative inline-flex size-2">
      {!k.reduced && inView && (
        <motion.span
          className="absolute inset-0 rounded-full bg-success"
          initial={{ scale: 1, opacity: 0.55 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ ...k.tween('deliberate', 'enter'), repeat: Infinity, repeatDelay: k.duration('slow') }}
        />
      )}
      <span className="relative size-2 rounded-full bg-success" />
    </span>
  )
}

const utc = dateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className={cn('inline-flex items-center gap-2 text-ui-sm whitespace-nowrap text-fg-muted', className)}>
      <LiveDot />
      <span className="font-medium text-fg">Live</span>
      <span aria-hidden>·</span>
      <time className="font-mono text-[11px] tracking-wide tabular-nums">{utc.format(now)} UTC</time>
    </span>
  )
}
