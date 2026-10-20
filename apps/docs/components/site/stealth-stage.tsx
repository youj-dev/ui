'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { LoaderBanyan, scene } from '@youj/loaders/banyan'
import { ScrambleText } from '@youj/motion/components/youj/motion/scramble-text'
import { cn } from '@/lib/cn'
import { Phrase } from './stealth-intro'
import { PHRASES } from './stealth-phrases'
import { saveData } from './stealth-idle'

export interface StealthStageProps {
  /** The tree's reserved box (stealth-intro.tsx), the same as before this loaded. */
  boxClassName: string
}

/* Where in Banyan's loop the phrase turns: as it starts to grow, mid-growth,
 * as the sap-light rises (that phrase holds through the lit crown), and as it
 * draws back to its root. About 2.5 s apart at the default tempo. */
const TURNS = [0.02, 0.28, 0.53, 0.78]
const GLYPHS = 'abcdefghijklmnopqrstuvwxyz'
/* Banyan's crown and ground fill about 15–82% of its square's height: the
 * drawing is set larger than the box and lifted, so the tree itself fills it. */
const TOP = 0.15
const FILL = 0.67

/**
 * Banyan, sized to its box, and the phrase under it, turning on the tree's
 * own clock: the kit starts a live animation at its still frame and advances
 * it by beats × the deliberate duration, and so does this (only while the tab
 * is visible, as the tree is). Loosely in step, which is all a phrase needs.
 * Reduced motion: the tree's still frame and the first phrase, unchanging.
 * Save-Data: the tree holds its still frame.
 */
export function StealthStage({ boxClassName }: StealthStageProps) {
  const k = useYouj()
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)
  const [index, setIndex] = useState(0)
  const [frugal] = useState(saveData)
  const [shown, setShown] = useState(false)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize(Math.round(el.getBoundingClientRect().height))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (k.reduced) return
    const loop = scene.beats * k.ms('deliberate')
    let phase = scene.still
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = document.hidden ? 0 : now - last
      last = now
      const next = phase + dt / loop
      const crossed = TURNS.some((turn) => (phase < turn && next >= turn) || (phase < turn + 1 && next >= turn + 1))
      phase = next % 1
      if (crossed) setIndex((i) => (i + 1) % PHRASES.length)
    }, 100)
    return () => clearInterval(id)
  }, [k])

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        ref={box}
        className={cn(boxClassName, 'text-fg opacity-0 transition-opacity duration-1000 ease-out data-[shown]:opacity-100 [--yj-anim-paper:var(--color-canvas)]')}
        data-shown={shown ? '' : undefined}
      >
        {size > 0 && (
          <LoaderBanyan
            size={Math.round(size / FILL)}
            label={null}
            paused={frugal}
            className="absolute start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
            style={{ top: -Math.round((size / FILL) * TOP), maxWidth: 'none' }}
          />
        )}
      </div>
      <Phrase>
        <ScrambleText trigger="change" glyphs={GLYPHS} duration="deliberate">
          {PHRASES[index]!}
        </ScrambleText>
      </Phrase>
    </div>
  )
}
