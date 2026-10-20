'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { useVisible } from '../../../hooks/use-visible'

/**
 * A demo's beat: a step index that advances every `every` ms (scaled by the
 * Speed control) while the demo is on screen, and holds wherever it is when
 * it scrolls away. Under reduced motion it never ticks: the demo shows the
 * `still` step, its representative frame.
 */
export function useLoop(steps: number, every: number, still = steps - 1): { ref: RefObject<HTMLDivElement | null>; step: number; running: boolean } {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const [step, setStep] = useState(0)
  // Also off while the tab is hidden: `inView` alone keeps a scrolled-to demo ticking in the background.
  const shown = useVisible(ref)
  const running = inView && shown && !k.reduced
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setStep((s) => (s + 1) % steps), every * k.timeScale)
    return () => clearInterval(id)
  }, [running, steps, every, k.timeScale])
  return { ref, step: k.reduced ? still : step, running }
}
