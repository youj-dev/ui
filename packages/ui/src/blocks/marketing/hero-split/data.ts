import type { MouseEventHandler } from 'react'

/** A call to action: a link styled as a button. */
export interface HeroSplitCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** Where the window's camera looks while a point is shown. */
export interface HeroSplitFocus {
  /** The spot to centre, as fractions of the picture's box: 0 at its inline start, 1 at its end. */
  x: number
  /** 0 at its top, 1 at its bottom. */
  y: number
  /** How far it zooms in. Default 1.5. */
  zoom?: number
}

/** A selling point. With a `focus`, it's a button that sends the window's camera there. */
export interface HeroSplitPoint {
  id: string
  label: string
  focus?: HeroSplitFocus
}

export const DEFAULT_COPY = {
  badge: 'Analytics, now in every plan',
  headline: 'Know how every deploy lands',
  description: 'Traffic, latency and errors, split by deploy, in the same place you ship. See the regression before your customers do.',
  /** The address in the window's title bar. */
  url: 'app.northwind.dev',
  /** Names the list of points. */
  pointsLabel: 'What you get',
  /** The tour's button while it plays. */
  pause: 'Pause the tour',
  /** The tour's button while it's stopped. */
  play: 'Play the tour',
}
export type HeroSplitCopy = typeof DEFAULT_COPY

/** The demo's points, each looking at its part of the demo's window. */
export const POINTS: HeroSplitPoint[] = [
  { id: 'previews', label: 'Previews on every pull request', focus: { x: 0.36, y: 0.83, zoom: 1.6 } },
  { id: 'rollbacks', label: 'Rollbacks in under a second', focus: { x: 0.27, y: 0.2, zoom: 1.75 } },
  { id: 'analytics', label: 'Analytics without cookies', focus: { x: 0.45, y: 0.5, zoom: 1.3 } },
]
