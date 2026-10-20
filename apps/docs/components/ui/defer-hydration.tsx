'use client'

import { lazy, Suspense, useEffect, useId, useRef, useState, type ComponentType, type FunctionComponent } from 'react'

export interface DeferOptions {
  /** Hydrate once the page is idle (after its load). */
  idle?: boolean
  /** Hydrate when it's pointed at, touched or focused. */
  intent?: boolean
  /** Hydrate when its box (its parent's) nears the screen. */
  view?: boolean
  /** Hydrate only while this media query matches (the desktop menus on a phone never do). */
  media?: string
}

/**
 * A client component the server renders in full, whose code the browser
 * fetches later: when the page is idle, when it's pointed at or focused, or
 * when it nears the screen. Until then the server's markup stays as it was
 * sent (a Suspense boundary waiting to hydrate), so nothing shifts and
 * nothing is missing; it just isn't interactive yet. Once one instance has
 * loaded, the rest render straight away, and one that mounts with no server
 * markup to keep (after a client navigation) loads straight away. The gate opens without a render, so a waiting
 * boundary is never re-rendered into its empty fallback.
 *
 * A press or a key that lands before the code does isn't lost: it opens the
 * gate, and once the boundary has hydrated the first one is replayed on the
 * same element (its click, or its key for a keyboard user; a key that makes a
 * click, Enter or Space on a button, replays as that click).
 *
 * React gives up on a waiting boundary when a context above it changes before
 * its code is in (the site's root providers settle the theme and the motion
 * personality just after hydrating): it removes the server's markup and shows
 * the fallback. The fallback is that markup, copied as the boundary hydrates,
 * so nothing blinks out while the code is on its way; it then renders afresh.
 */
export function deferHydration<P extends object>(load: () => Promise<ComponentType<P>>, options: DeferOptions): FunctionComponent<P> {
  let Loaded: ComponentType<P> | undefined
  let loading: Promise<ComponentType<P>> | undefined
  const fetchIt = () => (loading ??= load().then((component) => (Loaded = component)))

  function Deferred(props: P) {
    const root = useRef<HTMLSpanElement>(null)
    const id = useId()
    // The server's markup, read once while hydrating (nothing to read on the server or after a client navigation).
    const [snapshot] = useState(() => (typeof document === 'undefined' ? '' : (document.getElementById(id)?.innerHTML ?? '')))
    const [gate] = useState(() => {
      let open = () => {}
      // The server renders it straight away; the browser waits for the gate.
      const ready = typeof window === 'undefined' ? Promise.resolve() : new Promise<void>((resolve) => (open = resolve))
      // Opening starts the fetch too, whether or not React has tried the boundary yet.
      return { ready, open: () => (open(), void fetchIt()) }
    })
    const [Lazy] = useState(() => lazy(() => gate.ready.then(fetchIt).then((component) => ({ default: component }))))
    // The first activation that React dropped (it stops an event bound for markup it hasn't hydrated), and what to do once it has.
    const [replay] = useState(() => {
      const state = { hydrated: false, pending: undefined as Lost | undefined, release: () => {}, hydrate: () => void (state.hydrated = true) }
      return state
    })

    useEffect(() => {
      const el = root.current
      // Already hydrated (its code was in when it rendered): nothing to wait for.
      if (!el || replay.hydrated) return
      // Nothing from the server to keep (a render of its own, after a client navigation): load now.
      if (!el.hasChildNodes()) return gate.open()
      const cleanups: (() => void)[] = []
      const open = () => {
        gate.open()
        for (const cleanup of cleanups) cleanup()
      }
      const presses: (() => void)[] = []
      replay.release = () => {
        for (const cleanup of presses) cleanup()
      }
      replay.hydrate = () => {
        replay.hydrated = true
        replay.release()
        const lost = replay.pending
        replay.pending = undefined
        // After React's work, so the replay is an event like any other.
        // On the same element, or, if the boundary was rendered afresh (see above), on its copy there.
        if (lost)
          window.setTimeout(() => {
            const on = lost.target.isConnected ? lost.target : counterpart(el, lost.target)
            if (on && el.contains(on)) lost.replay(on)
          })
      }
      const arm = () => {
        // A press or a key before the code: fetch it now, and keep the activation for when it's in.
        const press = (event: Event) => {
          const target = event.target
          if (replay.hydrated || !(target instanceof HTMLElement) || !el.contains(target)) return
          open()
          // Once the code is in, React hydrates the boundary on the spot and delivers the event itself (not to the copy, which it replaces).
          if (event.type === 'pointerdown' || (Loaded && !target.closest('[data-deferred-copy]'))) return
          if (event.type === 'click') {
            // A modified click (a link to a new tab) keeps its native default.
            const { button, metaKey, ctrlKey, shiftKey, altKey } = event as MouseEvent
            if (button !== 0 || metaKey || ctrlKey || shiftKey || altKey) return
            // Its default (a link's navigation) waits for the replay too, which may take it over (a client-side link).
            event.preventDefault()
            if (!replay.pending || (replay.pending.key && replay.pending.target === target)) replay.pending = { target, replay: (on) => on.click() }
          } else if (!replay.pending && event instanceof KeyboardEvent && event.key !== 'Tab') {
            const { key, code, shiftKey, altKey, ctrlKey, metaKey } = event
            const init = { key, code, shiftKey, altKey, ctrlKey, metaKey, bubbles: true, cancelable: true }
            replay.pending = { target, key: true, replay: (on) => on.dispatchEvent(new KeyboardEvent('keydown', init)) }
          }
        }
        for (const type of ['pointerdown', 'keydown', 'click'] as const) {
          document.addEventListener(type, press, { capture: true })
          presses.push(() => document.removeEventListener(type, press, { capture: true }))
        }
        if (options.idle) {
          const idle = window.requestIdleCallback ? window.requestIdleCallback(open, { timeout: 3000 }) : window.setTimeout(open, 1500)
          cleanups.push(() => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle)))
        }
        if (options.intent) {
          // On the document, in capture: React stops an event bound for markup it hasn't hydrated before it reaches this element.
          const intent = (event: Event) => event.target instanceof Node && el.contains(event.target) && open()
          for (const type of ['pointerover', 'pointerdown', 'focusin'] as const) {
            document.addEventListener(type, intent, { capture: true, passive: true })
            cleanups.push(() => document.removeEventListener(type, intent, { capture: true }))
          }
        }
        if (options.view && el.parentElement && typeof IntersectionObserver !== 'undefined') {
          const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && open(), { rootMargin: '50% 0px' })
          observer.observe(el.parentElement)
          cleanups.push(() => observer.disconnect())
        }
      }
      if (!options.media) arm()
      else {
        const query = window.matchMedia(options.media)
        const change = () => {
          if (!query.matches) return
          query.removeEventListener('change', change)
          arm()
        }
        if (query.matches) arm()
        else {
          query.addEventListener('change', change)
          cleanups.push(() => query.removeEventListener('change', change))
        }
      }
      return () => {
        for (const cleanup of cleanups) cleanup()
        replay.release()
      }
    }, [gate, replay])

    return (
      <span ref={root} id={id} className="contents">
        {/* Nothing here may re-render while the boundary waits (an update would swap the server's markup for the fallback), so once the code is in it's used as is. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the server's own markup for this boundary, read back from the page */}
        <Suspense fallback={snapshot ? <span data-deferred-copy="" className="contents" dangerouslySetInnerHTML={{ __html: snapshot }} /> : null}>
          {Loaded ? <Loaded {...props} /> : <Lazy {...props} />}
          <Hydrated replay={replay} />
        </Suspense>
      </span>
    )
  }
  return Deferred
}

interface Lost {
  target: HTMLElement
  /** A key, which the click it makes (Enter or Space on a button) replaces. */
  key?: boolean
  replay: (on: HTMLElement) => void
}

/** The element in `root` that stands where `gone` stood: the same tag, link, name and text. */
function counterpart(root: HTMLElement, gone: HTMLElement): HTMLElement | undefined {
  const same = (a: Element, name: string) => a.getAttribute(name) === gone.getAttribute(name)
  return [...root.querySelectorAll<HTMLElement>(gone.tagName)].find((a) => same(a, 'href') && same(a, 'aria-label') && a.textContent === gone.textContent)
}

/** Renders nothing; its effect runs once the boundary it sits in has hydrated, after the component's own. */
function Hydrated({ replay }: { replay: { hydrate: () => void } }) {
  useEffect(() => replay.hydrate(), [replay])
  return null
}
