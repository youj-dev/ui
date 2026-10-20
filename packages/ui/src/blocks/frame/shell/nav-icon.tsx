'use client'

import { useEffect, useState } from 'react'
import { useYouj } from '@youj/core'
import type { FrameIcon } from './model'

/**
 * True for a moment after `current` turns true: long enough for an icon's
 * choreography to play once. Never on the first render (the page you land on
 * doesn't flourish) and never under reduced motion.
 */
export function useArrival(current: boolean) {
  const k = useYouj()
  const [arrived, setArrived] = useState(false)
  const [seen, setSeen] = useState(current)
  if (seen !== current) {
    setSeen(current)
    setArrived(current && !k.reduced)
  }
  useEffect(() => {
    if (!arrived) return
    const timer = setTimeout(() => setArrived(false), k.ms('deliberate') * 2)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- k only times the reset
  }, [arrived])
  return arrived
}

/**
 * A page's icon in a frame sidebar (sidebar signature, rule 5): it
 * plays on hover and focus (its row is the trigger), and once more when its
 * page becomes the current one, however that came about (a click, the
 * palette, a key). Then it's back on the row's hover.
 */
export function FrameNavIcon({ icon: Icon, current, size = 16, className }: { icon: FrameIcon; current: boolean; size?: number; className?: string }) {
  const arrived = useArrival(current)
  return <Icon size={size} strokeWidth={1.75} active={arrived || undefined} className={className} />
}
