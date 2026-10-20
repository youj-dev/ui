'use client'

import { useLayoutEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { ThemeScope, useSound, useYouj } from '@youj/core'
import { paletteById } from '@youj/core/lib/youj/theme'
import { RotateCcwIcon } from '@youj/icons'
import { CardFrame, ELEMENT_SIZE, SLOTS } from '@/components/landing/hero-card'
import { BUILDING, BUILT_EVENT, useHeroBuild } from '@/components/landing/hero-build'
import { HeroElementLater } from '@/components/landing/hero-element-later'
import { TILE_MOODS } from '@/components/landing/tile-moods'
import { ELEMENTS, HERO_PIN_QUERY, heroSheet, HOLD_SQUEEZE, LANDED, LANDINGS, type ElementId, type Flight } from '@/components/landing/hero-score'
import type { MenuWave, PillarId } from '@/lib/nav'

/* The homepage's hero: a release going out ("Checkout v2.4 → production"), as one card made of the parts Youj is
 * (hero-elements.tsx); scrolled, it comes apart and each part becomes its family tile. Wide and tall screens pin it on
 * a track: the copy gives way, the card's frame steps out from under its parts and shrinks into Blocks, then each part
 * travels, scaled, to its tile, whose frame and label fade in round it, and the heading comes in. One set: the element
 * in the tile is the one that was in the card. The browser plays all of it on the scroll (hero-score.ts): the stage
 * only measures, once per layout, and flips two flags as the scroll crosses the start and the landing. Where
 * scroll-driven animations aren't supported it seeks the same animations from a scroll listener instead.
 *
 * Elsewhere (phones, short screens, reduced motion) it's the card, from `md`, and then the grid, in the page's flow,
 * each tile drawing its own element once it nears the screen (TileElement).
 *
 * Every element plays all the time it's on screen, in the card, in flight and in its tile, each as cheaply as it allows
 * (hero-elements.tsx). Focus decides the scroll for keyboard users: tabbing into the grid
 * before it has landed scrolls to where it has, and tabbing back into the copy scrolls back to the top. */

/** An element's layout box inside `root`, from offsets: unaffected by transforms (an element's own, mid-flight, included). */
function boxWithin(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    const parent = node.offsetParent as HTMLElement | null
    // Offsets are measured inside a positioned ancestor's border: add it back as we climb.
    if (parent && parent !== root) {
      x += parent.clientLeft
      y += parent.clientTop
    }
    node = parent
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight }
}

/** How long the parts take to ease to the scroll once the card's build is over, in ms. */
const CATCH_UP = 450
/** Under this the card is whole: nothing is attached. */
const APART = 0.002
/** The scale an element rests at in the card: fitted to its slot. */
export function restOf(id: ElementId) {
  const size = ELEMENT_SIZE[id]
  const slot = SLOTS[id]
  // A touch under its slot, so each part sits inside its panel with room around it rather than edge to edge.
  return +(0.88 * Math.min(1, slot.w / size.w, slot.h / size.h)).toFixed(4)
}

/** Where every element rests and the room its tile gives it, read off the layout as it stands. */
function measure(stage: HTMLElement, card: HTMLElement, lift: number) {
  const flights: Flight[] = []
  for (const id of [...ELEMENTS, 'blocks'] as PillarId[]) {
    const el = card.querySelector<HTMLElement>(`[data-el=${id}]`)
    const room = stage.querySelector<HTMLElement>(`[data-tile=${id}] .family-stage`)
    if (!el || !room) continue
    flights.push({ id, from: boxWithin(el, stage), rest: id === 'blocks' ? 1 : restOf(id), room: boxWithin(room, stage) })
  }
  return heroSheet(flights, lift)
}

export function HeroStage({ copy, family, waves }: { copy: ReactNode; family: ReactNode; waves: MenuWave[] }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const cardBox = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLStyleElement>(null)
  const replay = useHeroBuild(cardBox)

  const [fits, setFits] = useState(false)
  useLayoutEffect(() => {
    const media = window.matchMedia(HERO_PIN_QUERY)
    const update = () => setFits(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const pinned = fits && !k.reduced
  const [landed, setLanded] = useState(false)
  // Where the pinned stretch starts and how long it is, in page pixels: for the flags, the fallback and focus.
  const span = useRef({ top: 0, length: 1 })
  // The site's sound, when its toggle is on (off by default): a tick as each part lands, the success cue as the last does.
  const sound = useSound()
  const play = useRef(sound.play)
  play.current = sound.play

  useLayoutEffect(() => {
    const el = root.current
    const trackEl = track.current
    const stageEl = stage.current
    const card = cardBox.current
    const style = sheet.current
    if (!el || !trackEl || !stageEl || !card || !style) return
    if (!pinned) {
      style.textContent = ''
      trackEl.style.marginBottom = ''
      delete el.dataset.apart
      delete el.dataset.landed
      setLanded(false)
      return
    }
    const timeline = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')
    let animations: Animation[] | null = null
    let frame = 0
    let was = 0
    const layout = () => {
      // The grid sits on the stage's foot; the lift centres the landed section (heading to grid) while it comes apart.
      const grid = stageEl.querySelector<HTMLElement>('.family-grid')
      const heading = stageEl.querySelector<HTMLElement>('.ho-heading')
      const scene = stageEl.querySelector<HTMLElement>('.ho-lift') ?? stageEl
      const box = scene.getBoundingClientRect()
      const g = grid?.getBoundingClientRect()
      const lift = g && heading ? Math.max(0, (heading.getBoundingClientRect().top - box.top - (box.bottom - g.bottom)) / 2) : 0
      style.textContent = measure(stageEl, card, Math.round(lift))
      // Centred, the landed grid leaves room under it; pull the next section up into that room (less a section's
      // breath), so when the pin lets go it follows the grid with no gap and nothing moves.
      const under = g ? box.bottom - g.bottom + lift : 0
      trackEl.style.marginBottom = under > 24 ? `${-Math.round(under - 24)}px` : ''
      // The rail runs from the top of the grid's first row to the bottom of its last: the UI tile to the Illustrations tile.
      const rail = stageEl.querySelector<HTMLElement>('.ho-rail')
      if (g && rail) {
        rail.style.top = `${g.top - box.top}px`
        rail.style.bottom = `${box.bottom - g.bottom}px`
      }
      const stuck = parseFloat(getComputedStyle(stageEl).top) || 0
      span.current = { top: trackEl.getBoundingClientRect().top + window.scrollY - stuck, length: Math.max(1, trackEl.offsetHeight - stageEl.offsetHeight) }
      animations = null
      update()
    }
    const progress = () => Math.min(1, Math.max(0, (window.scrollY - span.current.top) / span.current.length))
    const update = () => {
      frame = 0
      const p = progress()
      // The score's own time: the stylesheet plays it over the first 1/HOLD_SQUEEZE of the scroll, then holds.
      const t = Math.min(1, p / HOLD_SQUEEZE)
      const apart = t > APART
      if (apart !== 'apart' in el.dataset) {
        if (apart) el.dataset.apart = ''
        else delete el.dataset.apart
        animations = null
      }
      const down = t >= LANDED
      if (down !== 'landed' in el.dataset) {
        if (down) el.dataset.landed = ''
        else delete el.dataset.landed
      }
      setLanded(down)
      // Sound only going down, and only at a reading pace: a fling or a jump past several landings stays quiet.
      const step = t - was
      if (step > 0 && step < 0.03) {
        if (was < LANDED && t >= LANDED) play.current('success')
        else if (LANDINGS.some((at) => was < at && t >= at)) play.current('tick')
      }
      was = t
      if (timeline || !apart || document.documentElement.hasAttribute(BUILDING)) return
      // No scroll timeline: seek the same animations (each a 1000 ms run, paused) to the scroll.
      animations ??= el.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation && a.animationName.startsWith('ho-'))
      for (const animation of animations) animation.currentTime = p * 1000
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }
    // The card's build holds the parts at rest while the page scrolls; when it ends they ease to where the scroll is,
    // then the scroll takes them back (the hold lifts on the same value, so nothing jumps).
    let ease = 0
    const onBuilt = (event: Event) => {
      event.preventDefault()
      const release = () => document.documentElement.removeAttribute(BUILDING)
      const parts = el.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation && a.animationName.startsWith('ho-'))
      const from = parts.map((a) => Number(a.currentTime) || 0)
      const began = performance.now()
      const step = (now: number) => {
        const k = Math.min(1, (now - began) / CATCH_UP)
        const eased = 1 - (1 - k) ** 3
        for (const [i, a] of parts.entries()) a.currentTime = from[i]! + (progress() * 1000 - from[i]!) * eased
        if (k < 1) ease = requestAnimationFrame(step)
        else release()
      }
      ease = requestAnimationFrame(step)
    }
    window.addEventListener(BUILT_EVENT, onBuilt)
    layout()
    const observer = new ResizeObserver(() => layout())
    observer.observe(stageEl)
    document.fonts?.ready.then(layout, () => {})
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener(BUILT_EVENT, onBuilt)
      cancelAnimationFrame(frame)
      if (ease) {
        cancelAnimationFrame(ease)
        document.documentElement.removeAttribute(BUILDING)
      }
    }
  }, [pinned])

  const onFocus = (event: FocusEvent) => {
    const el = root.current
    if (!pinned || !el || !event.target.matches(':focus-visible')) return
    const inGrid = event.target.closest('.ho-family') !== null
    const { top, length } = span.current
    if (inGrid && !landed) window.scrollTo({ top: top + length * LANDED + 1, behavior: 'instant' })
    else if (!inGrid && 'apart' in el.dataset) window.scrollTo({ top, behavior: 'instant' })
  }

  return (
    <div
      ref={root}
      onFocus={onFocus}
      data-flat={k.reduced ? '' : undefined}
      className="ho"
    >
      <style ref={sheet} />
      <div ref={track} className="ho-track relative hero-pin:h-[313vh]">
        <div ref={stage} className="relative hero-pin:sticky hero-pin:top-[var(--header-height)] hero-pin:h-[calc(100dvh-var(--header-height))]">
          <div className="ho-lift relative h-full">
          <div className="ho-copy relative z-20">{copy}</div>
          {/* Pinned only: once the card comes apart, a rail down the left edge in the docs' timeline's language that
              fills with the scroll and lights a tick as each part lands. Decorative. */}
          <div aria-hidden className="pointer-events-none hidden hero-pin:block">
            <div className="ho-rail absolute left-3 z-20 w-2">
              <span className="absolute inset-y-0 end-0 w-px bg-line" />
              <span className="ho-rail-fill absolute inset-y-0 end-0 w-px origin-top bg-accent" />
              {LANDINGS.map((at, i) => (
                <span key={i} className="absolute end-0 h-px w-1.5" style={{ top: `${(at / LANDED) * 100}%` }}>
                  <span className="absolute inset-0 bg-line-strong" />
                  <span data-tick={i} className="ho-rail-tick absolute inset-x-0 -top-px h-0.5 origin-right rounded-full bg-accent" />
                </span>
              ))}
              <span className="ho-rail-done absolute -bottom-1 end-[-2.5px] size-1.5 rounded-full bg-accent" />
            </div>
          </div>
            {/* The intro's veil (hero-build.ts, styles/site.css): over the whole page while the card builds on it. */}
            <div aria-hidden className="ho-veil" />
            <button
              type="button"
              data-hero-skip
              className="ho-skip fixed start-1/2 bottom-10 z-[41] -translate-x-1/2 rtl:translate-x-1/2"
            >
              Skip intro
              <kbd>Esc</kbd>
            </button>
            <div className="ho-cardwrap pointer-events-none relative z-10 mt-16 flex justify-center pb-24 max-md:hidden hero-pin:mt-[clamp(2.5rem,7vh,5rem)] hero-pin:pb-0">
              <div
                ref={cardBox}
                role="img"
                aria-label="A release going out, Checkout v2.4 to production, as one card made of Youj's parts: its alerts panel, its rollout curve, Banyan growing, its toolbar of icons, the server rack it ships to, its notification and the cue it sounds, and its appearance switcher, all in the card's frame."
                inert
                className="ho-card relative h-[340px] w-[720px] shrink-0"
              >
                <div data-el="blocks" className="absolute inset-0">
                  <CardFrame />
                </div>
                {ELEMENTS.map((id) => {
                  const size = ELEMENT_SIZE[id]
                  const slot = SLOTS[id]
                  const k = restOf(id)
                  return (
                    <div
                      key={id}
                      data-el={id}
                      className="absolute origin-top-left"
                      style={{ left: slot.x + (slot.w - size.w * k) / 2, top: slot.y + (slot.h - size.h * k) / 2, width: size.w, height: size.h, scale: k }}
                    >
                      <ThemeScope palette={TILE_MOODS[id] ? paletteById(TILE_MOODS[id]) : undefined}>
                        <HeroElementLater id={id} waves={waves} />
                      </ThemeScope>
                    </div>
                  )
                })}
              </div>
              {/* Builds the card again where it is (hero-build.ts). Quiet; gone while it builds, once the card comes apart,
                  and under reduced motion. */}
              <button
                type="button"
                onClick={replay}
                title="Replay the build"
                className="ho-replay pointer-events-auto absolute top-[calc(100%-5.5rem)] flex hero-pin:top-[calc(100%+0.5rem)] items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-fg-muted hover:text-fg focus-visible:text-fg"
                style={{ insetInlineEnd: 'calc(50% - 360px)' }}
              >
                <RotateCcwIcon size={12} strokeWidth={1.75} />
                Replay
              </button>
            </div>
            {family}
          </div>
        </div>
      </div>
    </div>
  )
}
