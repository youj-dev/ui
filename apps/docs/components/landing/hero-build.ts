'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { LOW_POWER_EXPR } from '@/components/site/ui-generation/power'

/* The home hero's card builds itself (@youj/motion's Blueprint entrance)
 * in two ways, and nothing waits on either: the engine loads after the page has.
 *
 *   intro   the first homepage view of a session, on a wide screen without reduced motion: an opaque veil covers the page
 *           (rendered whole underneath, so its copy paints and counts as ever), the card builds, centered, on the veil at
 *           its full length, then glides to its place in the hero (a transform, so nothing moves in the layout) as the veil
 *           fades. Scrolling, any key, any click, the Skip button or a scroll bar skip it: the card is whole at once.
 *   replay  the Replay button builds the card again where it is, no veil, no lock. Any scroll finishes it at once and
 *           hands the page straight back to the hero's own scroll animation, so the two never run together.
 *
 * While a build runs the hero's own scroll animation is held at rest (hero-stage.tsx eases it to the scroll after). A
 * back/forward return never plays the intro. */

export const BUILDING = 'data-hero-building'
/** Dispatched on window when a build ends. Cancel it to take over releasing the hold (BUILDING) once caught up. */
export const BUILT_EVENT = 'youj:hero-built'
/** The session's mark that the intro has played. */
export const SEEN = 'youj:hero-intro'
/** The handoff from the intro to the page, in ms from the end of the build: the card breathes in and eases home over
 *  `GLIDE`; the veil (styles/site.css) lifts from 250 for 900; the calls to action rise from 480; the nav is last. The
 *  heading and lede were on screen, in place, all along (styles/site.css lifts them over the veil). */
export const GLIDE = 1050
const BREATH = 0.18

/** Whether this load can play the intro: a fresh load or reload, not a history (back/forward) return. */
export const playsOnLoad = (navigationType: string | undefined) => navigationType !== 'back_forward'

/** Inline, before the card paints: the first load of a session that can play the intro, on a wide screen without reduced
 *  motion and not low-power (components/site/ui-generation/power.ts), marks <html> so the veil covers the page and the card starts hidden (styles/site.css lifts both anyway after
 *  a few seconds if the build never comes). */
export const HERO_BUILD_SCRIPT = `try{var n=performance.getEntriesByType('navigation')[0];if((!n||n.type!=='back_forward')&&!sessionStorage.getItem('${SEEN}')&&matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches&&!${LOW_POWER_EXPR}){var h=document.documentElement;h.setAttribute('data-hero-build','');h.setAttribute('data-hero-intro','')}}catch(e){}`

/** Whether an input skips the intro: any key but a browser shortcut, a wheel, a touch, a click or a scroll. */
export function skipsIntro(event: Pick<KeyboardEvent, 'type' | 'metaKey' | 'ctrlKey' | 'altKey'>) {
  if (event.type === 'keydown') return !(event.metaKey || event.ctrlKey || event.altKey)
  if (event.type === 'scroll') return window.scrollY > 0 // (the card's own return to the top is not one)
  return true
}

/** Where the intro builds the card: a shift from its place in the hero and a scale, about the card's center. */
export type Place = { x: number; y: number; scale: number }
const HOME: Place = { x: 0, y: 0, scale: 1 }
const transformOf = (p: Place) => `translate(${p.x}px, ${p.y}px) scale(${p.scale})`
/** Room kept round the card in the intro: under the heading and at the sides; at the foot, room for the notification
 *  that overhangs the card and the Skip pill under it, except on a short screen, where the pill moves to the corner
 *  (styles/site.css) to give the card that room. */
const GAP = 40
export const SHORT_INTRO = 820
const footOf = (height: number) => (height < SHORT_INTRO ? 40 : 128)

/** The intro's spot for the card (`card` its box at home): centered in the screen's room under the hero's heading
 *  (`below`, the heading block's bottom edge), never over it, and scaled down only if that room is smaller than the card. */
export function introPlace(card: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, below: number, width: number, height: number): Place {
  const top = below + GAP
  const room = Math.max(1, height - footOf(height) - top)
  const scale = Math.floor(1000 * Math.min(1, room / card.height, (width - 2 * GAP) / card.width)) / 1000
  return { x: Math.round(width / 2 - (card.left + card.width / 2)), y: Math.round(top + room / 2 - (card.top + card.height / 2)), scale }
}

/** A theme easing token's curve, else `fallback`. */
const curve = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback

/** The intro's handoff as animations on top of the page's own (they leave nothing behind): nothing under reduced motion. */
function handoffOf(host: HTMLElement, el: HTMLElement, shift: Place) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return []
  const ease = curve('--ease-standard', 'cubic-bezier(0.2, 0, 0, 1)')
  const at = transformOf(shift)
  const out: Animation[] = [
    // the card settles (a small breath in), then eases down into its place, a touch smaller until it lands
    host.animate([{ transform: at, offset: 0 }, { transform: at, offset: BREATH, easing: ease }, { transform: transformOf(HOME), offset: 1 }], { duration: GLIDE }),
    el.animate([{ transform: 'scale(1)', offset: 0, easing: 'ease-out' }, { transform: 'scale(0.985)', offset: BREATH, easing: ease }, { transform: 'scale(1)', offset: 1 }], { duration: GLIDE }),
  ]
  const section = host.closest('section')
  // the calls to action rise; the heading and lede above them stay as they are
  const ctas = section?.querySelector('.ho-ctas .hero-in')
  if (ctas) out.push(ctas.animate([{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 650, delay: 480, easing: ease, fill: 'backwards' }))
  const nav = document.querySelector('header[data-yj-tone=header]')
  if (nav) out.push(nav.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 800, easing: ease, fill: 'backwards' }))
  return out
}

const INTRO = 'data-hero-intro'
const INTRO_OUT = 'data-hero-intro-out'

/** Resolves once `node`'s DOM hasn't changed for `ms` (at most `cap` ms). */
function quiet(node: Element, ms: number, cap: number) {
  return new Promise<void>((done) => {
    const end = () => {
      watch.disconnect()
      clearTimeout(wait)
      clearTimeout(limit)
      done()
    }
    let wait = setTimeout(end, ms)
    const limit = setTimeout(end, cap)
    const watch = new MutationObserver(() => {
      clearTimeout(wait)
      wait = setTimeout(end, ms)
    })
    watch.observe(node, { childList: true, subtree: true })
  })
}

/** Returns `replay`: build the card again in place. */
export function useHeroBuild(card: RefObject<HTMLElement | null>) {
  const replayRef = useRef<() => void>(() => {})
  const replay = useCallback(() => replayRef.current(), [])

  useEffect(() => {
    const html = document.documentElement
    const intro = html.hasAttribute(INTRO)
    const show = () => html.removeAttribute('data-hero-build')
    let gone = false
    let skipped = false
    let busy = false
    let run: { cancel: () => void; finished: Promise<void> } | undefined
    let handoff: Animation[] = []
    let idle = 0
    let stopView = () => {}
    let interrupted = false
    let modules: Promise<{ blueprint: typeof import('@youj/motion/components/youj/effects/blueprint/engine').blueprint; ready: typeof import('@youj/motion/components/youj/effects/entrance/ready').ready }> | undefined

    const load = () =>
      (modules ??= (async () => {
        const [{ blueprint }, { ready }] = await Promise.all([
          import('@youj/motion/components/youj/effects/blueprint/engine'),
          import('@youj/motion/components/youj/effects/entrance/ready'),
        ])
        await document.fonts?.ready
        // its parts hydrate when the page goes idle (hero-element-later.tsx): build once they're in and still
        await import('@/components/landing/hero-elements')
        return { blueprint, ready }
      })())

    // ─── the intro's lock: the page doesn't scroll while it shows, and any input ends it ───
    const inputs: [string, EventListener, AddEventListenerOptions][] = []
    const onInput = (event: Event) => {
      if (!skipsIntro(event as KeyboardEvent)) return
      if (event.type === 'wheel' || event.type === 'touchmove' || event.type === 'keydown') event.preventDefault()
      skip()
    }
    const unlock = () => {
      for (const [type, fn, options] of inputs) window.removeEventListener(type, fn, options)
      inputs.length = 0
    }
    const lock = () => {
      for (const type of ['wheel', 'touchmove', 'keydown', 'pointerdown', 'scroll']) {
        const options = { capture: true, passive: type !== 'wheel' && type !== 'touchmove' && type !== 'keydown' }
        inputs.push([type, onInput, options])
        window.addEventListener(type, onInput, options)
      }
    }

    /** The card whole and the page as it is: the veil, the lock and the card's offset gone. */
    const end = () => {
      busy = false
      if (!html.hasAttribute(INTRO) && !html.hasAttribute('data-hero-build')) return
      unlock()
      const host = card.current?.parentElement
      if (host) {
        host.style.transform = ''
        host.style.transformOrigin = ''
      }
      html.removeAttribute(INTRO)
      html.removeAttribute(INTRO_OUT)
      show()
    }
    function skip() {
      if (skipped) return
      skipped = true
      unlock()
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      if (html.hasAttribute(INTRO)) window.scrollTo(0, 0)
      for (const a of handoff) a.cancel()
      if (run) run.cancel()
      else end()
    }

    const play = async (mode: 'intro' | 'replay') => {
      const el = card.current
      const host = el?.parentElement
      if (!el || !host) return end()
      busy = true
      let shift = HOME
      try {
        const m = await load()
        await m.ready(el, mode === 'intro' ? 3000 : 600)
        // its parts hydrate on the page's first idle moment, after the layout is already still: wait for the DOM to go quiet too
        await quiet(el, 300, mode === 'intro' ? 3000 : 600)
        if (gone || skipped) return end()
        if (mode === 'intro') {
          // the card, centered in the room under the heading: moved by a transform on its wrapper (the build draws inside it)
          window.scrollTo(0, 0)
          const r = el.getBoundingClientRect()
          const h = host.getBoundingClientRect()
          const head = host.closest('section')?.querySelector('.ho-head')?.getBoundingClientRect()
          shift = introPlace(r, head?.bottom ?? 0, innerWidth, innerHeight)
          host.style.transformOrigin = `${r.left - h.left + r.width / 2}px ${r.top - h.top + r.height / 2}px`
          host.style.transform = transformOf(shift)
          try {
            sessionStorage.setItem(SEEN, '1')
          } catch {}
        } else {
          // the reader scrolls: the card is whole at once and the hero's scroll animation takes over where the scroll is
          const from = window.scrollY
          const onMove = (event: Event) => {
            if (event.type === 'scroll' && Math.abs(window.scrollY - from) < 2) return
            interrupted = true
            run?.cancel()
          }
          const moves = ['wheel', 'touchmove', 'scroll'] as const
          for (const type of moves) window.addEventListener(type, onMove, { passive: true })
          stopView = () => {
            for (const type of moves) window.removeEventListener(type, onMove)
          }
        }
        html.setAttribute(BUILDING, '')
        run = m.blueprint(el)
        show() // built hidden: the card shows as an empty frame the drawing fills
        await run.finished
        stopView()
        if (mode === 'intro' && !skipped && !gone) {
          // the card settles and eases home, the veil lifts, the copy rises, the nav comes last; the page is locked until then
          host.style.transform = ''
          html.setAttribute(INTRO_OUT, '')
          handoff = handoffOf(host, el, shift)
          await Promise.allSettled(handoff.map((a) => a.finished))
        }
        run = undefined
        end()
        // a scroll ended it: hand straight back (no catch-up ease to fight the scroll); else the stage eases its scroll
        // animation to where the scroll is, then lifts the hold, and without a stage it lifts now
        if (interrupted) html.removeAttribute(BUILDING)
        else if (window.dispatchEvent(new CustomEvent(BUILT_EVENT, { cancelable: true }))) html.removeAttribute(BUILDING)
      } catch {
        run = undefined
        stopView()
        html.removeAttribute(BUILDING)
        end()
      }
    }

    replayRef.current = () => {
      if (busy || html.hasAttribute(BUILDING) || html.hasAttribute(INTRO)) return
      skipped = false
      interrupted = false
      void play('replay')
    }

    // after the page has loaded and gone idle: it never competes with the first paint
    const later = () => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(() => void play('intro'), { timeout: 1500 }) : window.setTimeout(() => void play('intro'), 300)
    }
    // a page restored from the back/forward cache comes back as it was left: whatever was building is shown finished
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted && (html.hasAttribute(INTRO) || run)) skip()
    }
    // the veil's Skip button (it's in the markup from the first byte)
    const button = () => document.querySelector<HTMLElement>('[data-hero-skip]')
    const onSkip = () => skip()
    window.addEventListener('pageshow', restored)
    if (intro) {
      lock()
      button()?.addEventListener('click', onSkip)
      if (document.readyState === 'complete') later()
      else window.addEventListener('load', later, { once: true })
    }
    return () => {
      gone = true
      replayRef.current = () => {}
      window.removeEventListener('load', later)
      window.removeEventListener('pageshow', restored)
      button()?.removeEventListener('click', onSkip)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      clearTimeout(idle)
      stopView()
      unlock()
      for (const a of handoff) a.cancel()
      // (an unmount before it started leaves the intro's mark for the next mount, as a dev remount does)
      if (run) {
        run.cancel()
        html.removeAttribute(BUILDING)
        end()
      }
    }
  }, [card])

  return replay
}
