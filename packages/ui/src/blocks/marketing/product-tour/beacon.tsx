'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { useYouj } from '@youj/core'
import { useVisible } from '../../../hooks/use-visible'

/* The beacon: a dot on the corner of the control the open step asks you to
 * try (the one its picture marks `data-yj-tour-target`), with a slow ping
 * going out from it. It follows the mark (a step may move it as you go: the
 * slider, then the button it unlocks), re-places itself as the window
 * resizes or a panel settles, and goes once the step is done. Decorative,
 * and it never takes a click. Reduced motion: the dot, without the ping. */

/** Placed over the host's open step: `step` is that step's id, `show` false once it's done. */
export function TourBeacon({ host, step, show }: { host: RefObject<HTMLElement | null>; step: string; show: boolean }) {
  const k = useYouj()
  const dot = useRef<HTMLSpanElement>(null)
  const ping = useRef<HTMLSpanElement>(null)
  const visible = useVisible(host)

  useEffect(() => {
    const root = host.current
    const el = dot.current
    if (!root || !el) return
    let frame = 0
    let pinging: Animation | undefined
    const place = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const panel = [...root.querySelectorAll<HTMLElement>('[data-yj-tour-step]')].find((p) => p.dataset.yjTourStep === step)
        const target = show ? panel?.querySelector<HTMLElement>('[data-yj-tour-target]:not(:disabled)') : null
        if (!target) {
          el.dataset.state = 'hidden'
          pinging?.cancel()
          pinging = undefined
          return
        }
        // On the control's top end corner. Rects are on screen and the dot moves in the host's own pixels, so undo any scale around it.
        const h = root.getBoundingClientRect()
        const t = target.getBoundingClientRect()
        const scale = root.offsetWidth ? h.width / root.offsetWidth : 1
        const half = el.offsetWidth / 2
        const rtl = getComputedStyle(root).direction === 'rtl'
        const x = (rtl ? t.left - h.right : t.right - h.left) / scale + (rtl ? half : -half)
        el.style.translate = `${x}px ${(t.top - h.top) / scale - half}px`
        el.dataset.state = 'shown'
        if (k.reduced || pinging || typeof ping.current?.animate !== 'function') return
        pinging = ping.current.animate(
          [
            { transform: 'scale(1)', opacity: 0.6 },
            { transform: 'scale(3.2)', opacity: 0 },
          ],
          { duration: k.ms('deliberate') * 2.6, easing: `cubic-bezier(${k.ease('enter').join(',')})`, iterations: Infinity }, // youj-allow: WAAPI takes the enter token as a cubic-bezier string
        )
      })
    }
    place()
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place)
    resize?.observe(root)
    const marks = new MutationObserver(place)
    marks.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-yj-tour-target', 'disabled', 'hidden'] })
    root.addEventListener('transitionend', place)
    return () => {
      cancelAnimationFrame(frame)
      resize?.disconnect()
      marks.disconnect()
      root.removeEventListener('transitionend', place)
      pinging?.cancel()
    }
  }, [host, step, show, k])

  useEffect(() => {
    for (const animation of ping.current?.getAnimations?.() ?? []) {
      if (visible) animation.play()
      else animation.pause()
    }
  }, [visible])

  return (
    <span
      ref={dot}
      aria-hidden
      data-slot="tour-beacon"
      data-state="hidden"
      className="pointer-events-none absolute start-0 top-0 z-10 size-3 transition-[opacity,scale] yj-duration-base ease-enter data-[state=hidden]:scale-50 data-[state=hidden]:opacity-0"
    >
      <span ref={ping} className="absolute inset-0 rounded-full bg-accent opacity-0" />
      <span className="absolute inset-0 rounded-full border-2 border-canvas bg-accent shadow-sm" />
    </span>
  )
}
