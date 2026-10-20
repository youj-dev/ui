'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { useTheme as useColorScheme } from 'fumadocs-ui/provider/base'
import { useYouj } from '@youj/core'
import { DEFAULT_STYLE, isStyleId, type StyleId } from '@youj/core/lib/youj/theme'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import type { NeutralPage } from '@youj/core/lib/youj/theme'
import { isDensity, isScaling } from '@youj/react/docs/create/size-url'
import { DEFAULT_PREVIEW_MOTION, isPreviewSpeed, type PreviewMotion, type PreviewSize, type PreviewSpeed } from '@/lib/preview'
import { settleModeSwitch } from '@/lib/site-mode'
import { applyPreset, isPresetId } from '@/lib/site-preset'
import { useModePreset } from '@/lib/site-theme'
import { lookEdge, sweepClip, sweepEdge, useShowcasePreset, useShowcaseLook, type SweepEdge } from '@/lib/showcase-theme'

/* Live theme for the showcase frames. A block or example runs in an iframe
 * (/view/…) so its breakpoints answer to the frame's width, which makes it a
 * document of its own: it starts in the site's preset for the mode (Graphite in light, Basalt in dark), and nothing tells it
 * what its page shows the items in. So each frame says hello, and the page
 * answers with the site's light or dark, the preset and component style the
 * page's theme bar picked (lib/showcase-theme), and the frame's own speed and
 * reduced motion (its toolbar's), then again on every change. The frame
 * applies them without a reload and without writing them to storage (the
 * page owns the choice), and says when its demo has painted, so the page can
 * reveal it without a flash. A preset or style picked in the theme bar sweeps
 * into each frame on screen, from the side the selection moved away from (a
 * clip-path wipe in a view transition, on the page's clock); light or dark is
 * left to the page's own reveal, and reduced motion swaps in place.
 *
 * Only same-origin messages from the frame's own window (or its parent) are
 * read, and every value is checked before it's used. */

export const FRAME_CHANNEL = 'youj:frame'

export interface FrameState {
  /** The site's resolved light or dark. */
  dark: boolean
  /** The preset the demo wears: on the frame's document, and as the `theme` of an item that takes one. */
  preset: ThemeId
  /** The frame's speed (lib/preview's PREVIEW_SPEEDS). */
  speed: PreviewSpeed
  /** The frame shows its reduced-motion state. */
  reduced: boolean
  /** The style the demo is built in (it brings its look); `preset` names the palette it wears. A message without one means the default, Clean (the gallery's capture sends none). */
  style: StyleId
  /** Ink as the accent in light (lib/preview sitePreset's `ink`): the docs pages' monochrome look, until a preset is picked. */
  ink?: boolean
  /** The layout density and scale the demo renders at, the frame's Size pick (lib/preview-size). A message without one means the item's own (Create's frame sizes itself). */
  size?: PreviewSize
}

/** How a frame shows a theme the page's theme bar picked: swept in from one inline edge, on the page's clock. */
export interface FrameReveal {
  /** The edge the new theme enters from: the side the selection moved away from. */
  from: SweepEdge
  /** Milliseconds, on the page's clock. */
  duration: number
  /** Cubic-bezier control points. */
  easing: readonly [number, number, number, number]
}

export type FrameMessage =
  | { channel: typeof FRAME_CHANNEL; kind: 'state'; state: FrameState; reveal?: FrameReveal }
  | { channel: typeof FRAME_CHANNEL; kind: 'hello' }
  /** The demo has painted; `href` is the page it painted (its path and query), for a page that moves its frame between pages. */
  | { channel: typeof FRAME_CHANNEL; kind: 'ready'; href?: string }
  /** The height a section's or card's stage needs (components/showcase/kind-stage.tsx), in the demo's CSS pixels: what its frame sizes itself to. */
  | { channel: typeof FRAME_CHANNEL; kind: 'size'; height: number }
  /** The item viewer's frame, told to show another /view page in place (a client-side replace: the document, its runtime and its history entry stay). */
  | { channel: typeof FRAME_CHANNEL; kind: 'go'; href: string }

/** A /view page a frame may be sent to: `/view/blocks/app-billing`, `/view/primitive/button?story=button%2Fsizes`. */
const VIEW_HREF = /^\/view\/[a-z]+\/[a-z0-9-]+(\?story=[\w%.-]+)?$/

/** The tallest stage a frame reports that the page believes. */
const MAX_REPORTED_HEIGHT = 20_000

/** A well-formed reveal, or null: a bad one is dropped, and the state it came with still applies. */
function readReveal(value: unknown): FrameReveal | null {
  if (typeof value !== 'object' || value === null) return null
  const { from, duration, easing } = value as Partial<FrameReveal>
  if (from !== 'start' && from !== 'end') return null
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0 || duration > 5000) return null
  if (!Array.isArray(easing) || easing.length !== 4 || !easing.every((n) => typeof n === 'number' && Number.isFinite(n))) return null
  return { from, duration, easing: [easing[0]!, easing[1]!, easing[2]!, easing[3]!] }
}

/** A well-formed frame message, or null. */
export function readFrameMessage(data: unknown): FrameMessage | null {
  if (typeof data !== 'object' || data === null) return null
  const message = data as Partial<FrameMessage>
  if (message.channel !== FRAME_CHANNEL) return null
  if (message.kind === 'hello') return { channel: FRAME_CHANNEL, kind: 'hello' }
  if (message.kind === 'ready') {
    const href = (message as { href?: unknown }).href
    return { channel: FRAME_CHANNEL, kind: 'ready', ...(typeof href === 'string' && href.length < 512 ? { href } : {}) }
  }
  if (message.kind === 'size') {
    const height = (message as { height?: unknown }).height
    return typeof height === 'number' && Number.isFinite(height) && height > 0 && height <= MAX_REPORTED_HEIGHT ? { channel: FRAME_CHANNEL, kind: 'size', height } : null
  }
  if (message.kind === 'go') {
    const href = (message as { href?: unknown }).href
    return typeof href === 'string' && VIEW_HREF.test(href) ? { channel: FRAME_CHANNEL, kind: 'go', href } : null
  }
  if (message.kind !== 'state') return null
  const state = (message as { state?: Partial<FrameState> }).state
  if (
    !state ||
    typeof state.dark !== 'boolean' ||
    !isPresetId(state.preset) ||
    !isPreviewSpeed(state.speed) ||
    typeof state.reduced !== 'boolean' ||
    !(state.style === undefined || isStyleId(state.style)) ||
    !(state.ink === undefined || typeof state.ink === 'boolean') ||
    !(state.size === undefined || (typeof state.size === 'object' && state.size !== null && isDensity(state.size.density) && isScaling(state.size.scaling)))
  ) {
    return null
  }
  const reveal = readReveal((message as { reveal?: unknown }).reveal)
  const read: FrameState = {
    dark: state.dark,
    preset: state.preset,
    speed: state.speed,
    reduced: state.reduced,
    style: state.style ?? DEFAULT_STYLE,
    ...(state.ink ? { ink: true } : {}),
    ...(state.size ? { size: { density: state.size.density, scaling: state.size.scaling } } : {}),
  }
  return { channel: FRAME_CHANNEL, kind: 'state', state: read, ...(reveal ? { reveal } : {}) }
}

/** Where a frame is: in the viewport, wholly out of it, or not laid out (nothing to tell). */
function placement(el: Element | null): 'on' | 'off' | 'unknown' {
  const box = el?.getBoundingClientRect()
  if (!box || box.width === 0) return 'unknown'
  return box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth ? 'on' : 'off'
}

/**
 * The page's side: keeps `frame` in step with the site's light or dark, the
 * page's showcase look (or, with `look: false`, the defaults: Create's frame
 * themes itself) and the frame's `motion` and `size` (none: the item's own),
 * and reports when the frame's demo has painted. Nothing is sent until the
 * page's choice is known, so a frame is never shown the default first.
 */
export function useFrameSync(
  frame: RefObject<HTMLIFrameElement | null>,
  { motion = DEFAULT_PREVIEW_MOTION, look = true, size, preset: own, ink = false, latest: followLatest = false }: { motion?: PreviewMotion; look?: boolean; size?: PreviewSize; /** A preset the frame's own controls picked, over the page's look. */ preset?: ThemeId | null; /** The docs' monochrome look: ink as the accent in light. */ ink?: boolean; /** Follow the height the block reports last, not the tallest: for a frame whose stage holds no viewport-sized page (the docs' block preview), so a passing layout (mid-animation) can't stick. */ latest?: boolean } = {},
) {
  const k = useYouj()
  const { resolvedTheme } = useColorScheme()
  const pickedPreset = useShowcasePreset()
  const pickedLook = useShowcaseLook()
  const [ready, setReady] = useState(false)
  // The stage's height a section or card reports: the tallest it has been since its demo (re)loaded or the frame changed width, so content sized by the viewport can't shrink the frame in a loop.
  const [height, setHeight] = useState<number | null>(null)
  const fresh = useRef(true)
  const modeDefault = useModePreset()
  // The preset the page's look holds (its own pick, else the site's for the mode); Create's frame themes itself, so it takes the mode's.
  const preset = own ?? (look ? pickedPreset : modeDefault)
  const style = look ? pickedLook : DEFAULT_STYLE
  const { speed, reduced } = motion
  const density = size?.density
  const scaling = size?.scaling

  const state = useMemo<FrameState | null>(
    () =>
      preset && style && resolvedTheme
        ? { dark: resolvedTheme === 'dark', preset, speed, reduced, style, ...(ink ? { ink } : {}), ...(density && scaling ? { size: { density, scaling } } : {}) }
        : null,
    [resolvedTheme, preset, style, speed, reduced, density, scaling, ink],
  )
  const latest = useRef(state)
  latest.current = state

  const post = useCallback(
    (reveal?: FrameReveal) => {
      const target = frame.current?.contentWindow
      if (!target || !latest.current) return
      const message: FrameMessage = { channel: FRAME_CHANNEL, kind: 'state', state: latest.current, ...(reveal ? { reveal } : {}) }
      target.postMessage(message, window.location.origin)
    },
    [frame],
  )

  // The look when the frame last changed: a new preset or style was picked in the theme bar.
  const shown = useRef<{ preset: ThemeId; style: StyleId; dark: boolean } | null>(null)
  const clock = useRef({ k, ready })
  clock.current = { k, ready }

  // Every change reaches a frame in view at once, and a pick in the theme bar
  // sweeps in. The frames share the page's thread, so one out of view takes
  // its change once those in view have swept to theirs.
  useEffect(() => {
    if (!state) return
    const before = shown.current
    shown.current = { preset: state.preset, style: state.style, dark: state.dark }
    const { k, ready } = clock.current
    const where = placement(frame.current)
    if (where === 'off') {
      const timer = setTimeout(() => post(), k.ms('slow') + k.ms('deliberate'))
      return () => clearTimeout(timer)
    }
    const restyled = before !== null && before.style !== state.style
    // A preset that moved with the mode (the site's own, Graphite and Basalt) isn't a pick: the page's reveal covers it.
    const picked = restyled || (before !== null && before.dark === state.dark && before.preset !== state.preset)
    if (!picked || !ready || k.reduced || where !== 'on') return post()
    const from = restyled ? lookEdge(before.style, state.style) : sweepEdge(before.preset, state.preset)
    post({ from, duration: k.ms('slow'), easing: k.ease('standard') })
  }, [state, frame, post])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !frame.current || event.source !== frame.current.contentWindow) return
      const message = readFrameMessage(event.data)
      if (message?.kind === 'hello') post()
      else if (message?.kind === 'ready') setReady(true)
      else if (message?.kind === 'size') {
        const reported = message.height
        const replace = fresh.current
        fresh.current = false
        setHeight((last) => (followLatest || replace || last === null ? reported : Math.max(last, reported)))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [frame, post, followLatest])

  /** Call when the frame reloads: it's hidden again until its demo paints, and keeps its height until the demo reports a new one. */
  const reset = useCallback(() => {
    setReady(false)
    fresh.current = true
  }, [])
  /** Call when the frame's width changes: the next height the demo reports replaces the last. */
  const remeasure = useCallback(() => {
    fresh.current = true
  }, [])
  return { ready, reset, height, remeasure }
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> } }

/** The frame's wipe in progress, if any: one document per frame, so one at a time. */
let wiping: Promise<void> | null = null

/**
 * Sweeps a new theme in over the old one: the document's view transition,
 * with the new snapshot's clip opening from `reveal.from`. Hard-edged, so two
 * layouts (a preset's type and density move things) never ghost through each
 * other. A theme picked mid-sweep shows at once in the part already swept,
 * and the edge carries on to finish; nothing jumps back. Without View
 * Transitions, or with reduced motion, it switches in place.
 */
function wipe(update: () => void, reveal: FrameReveal) {
  const doc = document as ViewTransitionDocument
  if (wiping || !doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update()
    return
  }
  // Only the clip moves: the default crossfade and blend are held for the sweep.
  const hold = document.createElement('style')
  hold.textContent = '::view-transition-group(root),::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}'
  document.head.appendChild(hold)
  const transition = doc.startViewTransition(update)
  const clipPath = sweepClip(reveal.from, getComputedStyle(document.documentElement).direction === 'rtl')
  transition.ready.then(
    () => {
      document.documentElement.animate(
        { clipPath },
        { duration: reveal.duration, easing: `cubic-bezier(${reveal.easing.join(',')})`, pseudoElement: '::view-transition-new(root)' },
      )
    },
    () => {},
  )
  wiping = transition.finished
    .catch(() => {})
    .finally(() => {
      hold.remove()
      wiping = null
    })
}

/** Light or dark on this document, the way next-themes writes it; the caller settles it with the rest of the state. */
function applyMode(dark: boolean) {
  const html = document.documentElement
  const mode = dark ? 'dark' : 'light'
  if (html.getAttribute('data-theme') === mode && html.classList.contains(mode)) return
  html.classList.remove('light', 'dark')
  html.classList.add(mode)
  html.setAttribute('data-theme', mode)
  html.style.colorScheme = mode
}

/**
 * The frame's side: in an iframe, says hello and applies each state the page
 * sends (mode and preset on this document, the rest, the style included,
 * returned for the demo's own YoujProvider). `page` is the item's own light
 * page (lib/showcase): a website's demo sits on a white one. `framed` is false when the page is opened on its own,
 * and `state` stays null until the page answers. `ready()` tells the page the
 * demo has painted.
 */
export function useFrameState(page: NeutralPage = 'gray') {
  const [framed, setFramed] = useState(false)
  const [state, setState] = useState<FrameState | null>(null)

  useEffect(() => {
    if (window.parent === window) return
    setFramed(true)
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const message = readFrameMessage(event.data)
      if (message?.kind !== 'state') return
      const next = message.state
      // Mode, preset and the demo's render land together; then style resolves once and nothing fades.
      const apply = () => {
        flushSync(() => {
          applyMode(next.dark)
          // The server marks <html> with the dark preset but writes none of its values: a first state always applies.
          const html = document.documentElement
          const ink = next.ink ?? false
          if (html.getAttribute('data-yj-theme') !== next.preset || html.getAttribute('data-yj-style') !== next.style || !html.style.getPropertyValue('--yj-neutral-page') || html.hasAttribute('data-ink') !== ink) {
            applyPreset(html, next.preset, page, ink, next.style)
            html.toggleAttribute('data-ink', ink)
          }
          setState(next)
        })
        settleModeSwitch()
      }
      if (message.reveal && !next.reduced) wipe(apply, message.reveal)
      else apply()
    }
    window.addEventListener('message', onMessage)
    const hello: FrameMessage = { channel: FRAME_CHANNEL, kind: 'hello' }
    window.parent.postMessage(hello, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [page])

  const ready = useCallback(() => {
    if (window.parent === window) return
    const message: FrameMessage = { channel: FRAME_CHANNEL, kind: 'ready', href: window.location.pathname + window.location.search }
    window.parent.postMessage(message, window.location.origin)
  }, [])

  /** Tells the page how tall a section's or card's stage is, so its frame can fit it. */
  const size = useCallback((height: number) => {
    if (window.parent === window) return
    const message: FrameMessage = { channel: FRAME_CHANNEL, kind: 'size', height }
    window.parent.postMessage(message, window.location.origin)
  }, [])

  return { framed, state, ready, size }
}
