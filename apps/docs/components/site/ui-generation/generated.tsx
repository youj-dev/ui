'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { ENTRANCES } from './entrances'
import { lowPower, slowFrames } from './power'

/* Docs site only: plays an entrance effect over the child once, when it scrolls into view: the `run` of the chosen
 * entry in ENTRANCES (./entrances.ts): one of the entrance looks in @youj/motion (Generate, Blueprint, Prism;
 * ./scripts.ts tunes a few demos) or Code (./compile.ts). The code and its CSS
 * load on the first play, so a page without one of these never fetches them. A replay is a remount (the preview
 * island's Replay re-keys the demo), and so is a new story: that is the only time it plays again. A dialog or popover
 * the reader opens afterwards appears as it always does; the host wears `data-gen-live` until the effect is over,
 * which is when ./overlays.ts lets an opening overlay build. */

export function Generated({
  children,
  name,
  code,
  entrance = 'generate',
  still = false,
  speed = 1,
  className = 'flex w-full min-w-fit items-center justify-center',
}: {
  children: ReactNode
  /** The demo's name, for its script (./scripts.ts). */
  name?: string
  /** Where the demo's source is published (lib/code-url.ts), for the Code entrance; a docs example's by its name otherwise. */
  code?: string
  /** The id of the entry in ENTRANCES that plays. */
  entrance?: string
  still?: boolean
  speed?: number
  className?: string
}) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = host.current
    if (!el || still) return
    let seen = false
    let started = false
    let gone = false
    let run: { cancel: () => void; finished?: Promise<unknown> } | undefined
    const entry = ENTRANCES.find((e) => e.id === entrance)
    if (!entry?.run) {
      el.removeAttribute('data-gen-pending')
      return
    }
    if (!lowPower()) void slowFrames() // the page's frame budget, measured while the demo mounts (./power.ts)
    el.setAttribute('data-gen-live', '')
    // the demo's first box (a provider may wrap it in `display: contents`); the build's layers come after it
    const target = () => {
      let node = el.firstElementChild as HTMLElement | null
      while (node && getComputedStyle(node).display === 'contents') node = node.firstElementChild as HTMLElement | null
      return node
    }

    const over = () => el.removeAttribute('data-gen-live')

    const play = async () => {
      const node = target()
      if (started || !seen || !node) return
      started = true
      arrive.disconnect()
      try {
        const playing = await entry.run!({ host: el, node, name, code, speed })
        if (gone) playing?.cancel()
        else {
          run = playing
          void playing?.finished?.then(over, over)
        }
        if (!playing) over()
      } catch {
        // The effect is decoration: if it can't load, the demo just shows.
        over()
      } finally {
        el.removeAttribute('data-gen-pending')
      }
    }

    const watch = new IntersectionObserver(
      (entries) => {
        // most of it in view; a demo taller than the window once it fills half of it
        if (entries.some((e) => e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height > innerHeight * 0.5))) {
          seen = true
          void play()
        }
      },
      { threshold: [0.1, 0.2, 0.35] },
    )
    let watched: Element | null = null
    const look = () => {
      const node = target()
      if (node && node !== watched) {
        if (watched) watch.unobserve(watched)
        watched = node
        watch.observe(node)
      }
    }
    // The demo is lazy: its element arrives after this mounts.
    const arrive = new MutationObserver(look)
    arrive.observe(el, { childList: true, subtree: true })
    look()

    return () => {
      gone = true
      over()
      arrive.disconnect()
      watch.disconnect()
      run?.cancel()
    }
  }, [name, code, entrance, still, speed])

  return (
    <div ref={host} data-generated="" data-gen-pending={still ? undefined : ''} className={`relative isolate ${className}`}>
      {children}
    </div>
  )
}
