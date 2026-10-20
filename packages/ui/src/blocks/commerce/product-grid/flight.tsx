'use client'

import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useYouj, type Youj } from '@youj/core'

/* Quick view's choreography, all of it Web Animations on the token clock. Opening under a pointer, the dialog's photo
 * starts on its tile (scaled to cover it and clipped to its frame) and lands in place on the slow token and the
 * emphasized curve, while the surface, the details and the arrows rise in around it; a tile of another shape (the
 * wide one) fades the photo in as it grows, so the change of crop never shows. With the tile off screen, the dialog
 * rises as it always does. A step slides the details in from the side the shopper moved to. Closing flies the photo
 * home onto its tile as the scrim lifts (played back from where it is when the open is still flying), and the dialog
 * lets go over the real tile. Every animation is cancelled when the dialog goes. */

interface FlightParts {
  slot: RefObject<HTMLDivElement | null>
  surface: RefObject<HTMLDivElement | null>
  details: RefObject<HTMLDivElement | null>
  arrows: RefObject<HTMLDivElement | null>
  /** Every animation in play, to cancel or play back. */
  running: RefObject<Animation[]>
  /** The photo's flight out of its tile. */
  flight: RefObject<Animation | null>
  /** The last step's direction (0: none since it opened). */
  step: RefObject<number>
}

/** The tile's corner radius, in px: the flight's clip starts and lands on it. */
const RADIUS = 12

/** A token's curve, as Web Animations write it. */
const curve = (points: readonly number[]) => `cubic-bezier(${points.join(',')})` // youj-allow: the token's own curve, for a Web Animation

const onScreen = (rect: DOMRect | undefined): rect is DOMRect => Boolean(rect && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight)

/** Keyframes that put the photo slot over a tile and bring it home: scaled to cover the tile, clipped to its frame. */
function flightFrames(slot: HTMLElement, from: DOMRect) {
  const to = slot.getBoundingClientRect()
  const scale = Math.max(from.width / to.width, from.height / to.height)
  const dx = from.left + from.width / 2 - (to.left + to.width / 2)
  const dy = from.top + from.height / 2 - (to.top + to.height / 2)
  const insetX = Math.max(0, (to.width - from.width / scale) / 2)
  const insetY = Math.max(0, (to.height - from.height / scale) / 2)
  const frames: Keyframe[] = [
    { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, clipPath: `inset(${insetY}px ${insetX}px round ${RADIUS / scale}px)` },
    { transform: 'none', clipPath: `inset(0px 0px round ${RADIUS}px)` },
  ]
  return { frames, mismatched: Math.abs(from.width / from.height - to.width / to.height) > 0.05 }
}

function cancelAll(parts: FlightParts) {
  for (const animation of parts.running.current) animation.cancel()
  parts.running.current = []
}

/**
 * Flies the photo home onto `tile` and lifts the scrim; resolves when it has landed. Null when there's nothing to fly
 * to (no tile on screen, no Web Animations): close at once.
 */
function flyHome(parts: FlightParts, tile: HTMLElement | null, k: Youj): Promise<unknown> | null {
  const slot = parts.slot.current
  const rect = tile?.getBoundingClientRect()
  if (!slot || !onScreen(rect) || typeof slot.animate !== 'function') return null
  const timing = { duration: k.ms('base'), easing: curve(k.ease('standard')), fill: 'forwards' as const }
  const fade = [{ opacity: 0 }]
  const scrim = slot.closest('[data-slot=dialog-portal]')?.querySelector<HTMLElement>('[data-slot=dialog-overlay]')
  let landed: Animation
  if (parts.flight.current?.playState === 'running' && parts.step.current === 0) {
    // Closed while still flying out: the same flight plays back from where it is.
    for (const animation of parts.running.current) animation.reverse()
    landed = parts.flight.current
  } else {
    cancelAll(parts)
    const { frames, mismatched } = flightFrames(slot, rect)
    landed = slot.animate([...frames].reverse(), timing)
    parts.running.current = [
      landed,
      ...(mismatched ? [slot.animate([{ opacity: 1, offset: 0.6 }, { opacity: 0 }], timing)] : []),
      ...[parts.surface.current, parts.details.current, parts.arrows.current].flatMap((el) =>
        el ? [el.animate(fade, { ...timing, duration: k.ms('fast') })] : [],
      ),
    ]
  }
  // The scrim lifts as the photo goes home, so the grid is there to land on.
  if (scrim) parts.running.current.push(scrim.animate(fade, timing))
  return landed.finished
}

/** Out of the tile when it's on screen, else the dialog's own rise. */
function flyOut(parts: FlightParts, tile: HTMLElement | null, k: Youj) {
  const slot = parts.slot.current
  if (!slot || typeof slot.animate !== 'function') return
  const rect = tile?.getBoundingClientRect()
  // Filled both ways: played back (a close mid-flight), each part holds its first frame until the dialog has gone.
  const timing = { duration: k.ms('slow'), easing: curve(k.ease('emphasized')), fill: 'both' as const }
  const rise = (el: HTMLElement | null, delay: number, from: string, fill: FillMode = 'both') =>
    el
      ? [
          el.animate(
            [
              { opacity: 0, transform: from },
              { opacity: 1, transform: 'none' },
            ],
            { duration: k.ms('base'), easing: curve(k.ease('enter')), delay, fill },
          ),
        ]
      : []
  if (onScreen(rect)) {
    const { frames, mismatched } = flightFrames(slot, rect)
    parts.running.current = [
      slot.animate(frames, timing),
      ...(mismatched ? [slot.animate([{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 1 }], timing)] : []),
      ...rise(parts.surface.current, 0, 'scale(0.98)'),
      ...rise(parts.details.current, k.ms('fast'), 'translateY(8px)'),
      ...rise(parts.arrows.current, k.ms('base'), 'none'),
    ]
    parts.flight.current = parts.running.current[0] ?? null
  } else {
    // Not held after it ends: the popup's own exit plays on close.
    parts.running.current = rise(slot.closest<HTMLElement>('[data-slot=dialog-content]'), 0, 'translateY(6px) scale(0.96)', 'backwards')
  }
}

/* The entrance and the steps, kept in a part of its own so its effects run with the popup's DOM (the portal mounts it
 * a commit after the dialog opens). */
function Choreography({
  parts,
  flies,
  tile,
  rtl,
  id,
  children,
}: {
  parts: FlightParts
  flies: boolean
  tile: () => HTMLElement | null
  rtl: boolean
  id: string
  children: ReactNode
}) {
  const k = useYouj()
  const first = useRef(true)

  // Opening: out of the tile when it's on screen, else the dialog's own rise (the popup's CSS one is held for the flight).
  useLayoutEffect(() => {
    if (!flies) return
    flyOut(parts, tile(), k)
    return () => cancelAll(parts)
    // Once, as the popup mounts: a step keeps the dialog open and is the effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once, as the popup mounts: a step is the effect below
  }, [])

  // A step: the details come in from the side the shopper moved to.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const details = parts.details.current
    if (k.reduced || !details || typeof details.animate !== 'function') return
    const shift = (rtl ? -1 : 1) * Math.sign(parts.step.current) * 16
    const animation = details.animate(
      [
        { opacity: 0, transform: `translateX(${shift}px)` },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: k.ms('base'),
        easing: curve(k.ease('enter')),
      },
    )
    return () => animation.cancel()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- plays once per step
  }, [id])

  return children
}

export { cancelAll, Choreography, flyHome }
export type { FlightParts }
