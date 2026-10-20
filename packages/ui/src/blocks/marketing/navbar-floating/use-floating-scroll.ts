'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useMotionValueEvent, useScroll, type MotionValue } from 'motion/react'

/* What the page's scroll says about the floating bar:
 * - condensed: past 24px, and back to rest only under 8px, so it never
 *   flickers at the threshold;
 * - hidden: once the page has travelled 12px down past 160px; shown again
 *   after 12px back up, or near the top;
 * - current: the in-page section under a line 35% down the view (the last
 *   one at the very bottom), unless a link was just followed, which pins its
 *   own section until the scroll it started comes to rest;
 * - progress: how far through the page, 0 to 1. */

interface FloatingScrollOptions {
  /** The element that scrolls under the bar. Default: the page. */
  container?: RefObject<HTMLElement | null>
  condense: boolean
  hide: boolean
  /** The ids of the sections the bar links to, in page order. */
  sections: string[]
}

interface FloatingScroll {
  condensed: boolean
  hidden: boolean
  current: string | undefined
  progress: MotionValue<number>
  /** A link to `id` was followed: mark it now and hold it while the page scrolls there. */
  pin: (id: string) => void
}

/** How long a scroll must rest, in ms, before a followed link lets the scrollspy back in. */
const SETTLE_MS = 160

function viewOf(container?: RefObject<HTMLElement | null>) {
  const el = container?.current
  if (el) {
    const box = el.getBoundingClientRect()
    return { top: box.top, height: el.clientHeight, atEnd: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 }
  }
  const root = document.documentElement
  return { top: 0, height: window.innerHeight, atEnd: window.scrollY + window.innerHeight >= root.scrollHeight - 2 }
}

function sectionAt(sections: string[], container?: RefObject<HTMLElement | null>) {
  const view = viewOf(container)
  const present = sections.filter((id) => document.getElementById(id))
  if (view.atEnd && present.length) return present.at(-1)
  const line = view.top + view.height * 0.35
  let found: string | undefined
  for (const id of present) if (document.getElementById(id)!.getBoundingClientRect().top <= line) found = id
  return found
}

export function useFloatingScroll({ container, condense, hide, sections }: FloatingScrollOptions): FloatingScroll {
  const { scrollY, scrollYProgress } = useScroll(container ? { container } : undefined)
  const [state, setState] = useState({ condensed: false, hidden: false })
  const [current, setCurrent] = useState<string | undefined>(undefined)
  const travel = useRef({ last: 0, from: 0, down: true })
  const pinned = useRef<{ id: string; timer: ReturnType<typeof setTimeout> | undefined } | null>(null)
  const key = sections.join(' ')

  const unpinLater = () => {
    const pin = pinned.current
    if (!pin) return
    clearTimeout(pin.timer)
    pin.timer = setTimeout(() => {
      pinned.current = null
      setCurrent(sectionAt(sections, container))
    }, SETTLE_MS)
  }

  useMotionValueEvent(scrollY, 'change', (y) => {
    const t = travel.current
    const down = y > t.last
    if (y !== t.last && down !== t.down) Object.assign(t, { down, from: t.last })
    t.last = y
    setState((was) => {
      const condensed = condense && (was.condensed ? y > 8 : y > 24)
      let hidden = was.hidden
      if (!hide || y < 160) hidden = false
      else if (t.down && y - t.from > 12) hidden = true
      else if (!t.down && t.from - y > 12) hidden = false
      return condensed === was.condensed && hidden === was.hidden ? was : { condensed, hidden }
    })
    if (pinned.current) unpinLater()
    else if (sections.length) setCurrent(sectionAt(sections, container))
  })

  // A page opened mid-way (a reload, a link to #pricing) starts in the state its scroll says.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const y = container?.current ? container.current.scrollTop : window.scrollY
      travel.current = { last: y, from: y, down: true }
      setState({ condensed: condense && y > 24, hidden: false })
      if (sections.length) setCurrent(sectionAt(sections, container))
    })
    return () => cancelAnimationFrame(frame)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- key stands for the sections
  }, [container, condense, key])

  useEffect(() => () => clearTimeout(pinned.current?.timer), [])

  const pin = (id: string) => {
    clearTimeout(pinned.current?.timer)
    pinned.current = { id, timer: undefined }
    setCurrent(id)
    unpinLater()
  }

  return { ...state, current, progress: scrollYProgress, pin }
}
