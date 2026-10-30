import type { MouseEventHandler } from 'react'

/** A call to action: a link styled as a button. */
export interface HeroCollageCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** One stage of the story the collage tells: a button under it and a line of caption while it is shown. */
export interface HeroCollageStage {
  id: string
  label: string
  caption: string
}

export const STAGES: HeroCollageStage[] = [
  { id: 'review', label: 'Review', caption: 'Teammates comment on the live preview, not a screenshot. The pull request merges when the checks are green.' },
  { id: 'build', label: 'Build', caption: 'Every push builds in its own sandbox and gets a working URL in seconds, with nothing to set up.' },
  { id: 'canary', label: 'Canary', caption: 'Traffic moves to the new build a slice at a time while error rates and latency are watched.' },
  { id: 'live', label: 'Live', caption: 'Everyone is on the new build. Rolling back is a single click and takes under a second.' },
]

export const DEFAULT_COPY = {
  eyebrow: 'Northwind for teams',
  headline: 'Ship together, and watch every release land',
  description: 'Previews, reviews, canaries and rollbacks in one place, updating as they happen, so the whole team sees the same release at the same moment.',
  /** The small print under the calls to action; empty hides it. */
  note: '14 days of Pro for up to 20 people · no card',
  /** Names the stage buttons. */
  stagesLabel: 'A release, stage by stage',
  /** The stage buttons' play/pause control while the tour runs. */
  pause: 'Pause the tour',
  play: 'Play the tour',
  /** Names a stage's button: "Stage 2 of 4: Build". */
  stageName: (index: number, count: number, label: string) => `${index} ${label}, stage ${index} of ${count}`,
  /** Names the build card's progress bar. */
  buildProgress: 'Build progress',
  /** Titles the canary card and names its slider. */
  canaryTraffic: 'Canary traffic',
}
export type HeroCollageCopy = typeof DEFAULT_COPY
