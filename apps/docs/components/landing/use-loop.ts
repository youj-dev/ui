'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'

/** Whether a picture plays right now: on screen, in a visible tab, with motion allowed. Flips only as those do. */
export function usePlaying(ref: RefObject<Element | null>) {
  const k = useYouj()
  const inView = useInView(ref, { amount: 0.25 })
  const [shown, setShown] = useState(true)
  useEffect(() => {
    const update = () => setShown(!document.hidden)
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return !k.reduced && inView && shown
}

/** Runs `tick` every `ms` while `ref` plays (usePlaying). */
export function useLoop(ref: RefObject<Element | null>, ms: number, tick: () => void) {
  const playing = usePlaying(ref)
  const latest = useRef(tick)
  latest.current = tick
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => latest.current(), ms)
    return () => clearInterval(id)
  }, [playing, ms])
}
