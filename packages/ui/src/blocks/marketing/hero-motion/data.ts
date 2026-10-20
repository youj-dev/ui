import type { MouseEventHandler } from 'react'

/** A call to action: a link styled as a button. */
export interface HeroMotionCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** One figure in the hero's closing row. */
export interface HeroMotionFact {
  /** The figure, as it should read ("90+"). */
  value: string
  label: string
}

export const FACTS: HeroMotionFact[] = [
  { value: '130+', label: 'components' },
  { value: '4', label: 'theme presets' },
  { value: '0', label: 'hard-coded milliseconds' },
]

/** The headline's second line takes each of these in turn. */
export const ACCENTS = ['move with intent.', 'respond to touch.', 'adapt to everyone.']

export const DEFAULT_COPY = {
  eyebrow: 'Youj UI · Motion-first components for React',
  /** The headline's first line. */
  headlineLead: 'Interfaces that',
  description:
    'Accessible components on Base UI, with one motion contract underneath. Every duration, spring and stagger is a token, so speed, reduced motion and theme reach everything at once.',
  /** Before the keyboard shortcut. */
  shortcutHint: 'or press',
  /** The tuner panel's title. */
  tunerTitle: 'Try the contract',
  tunerHint: 'Change a setting and everything in the panel follows.',
  speed: 'Speed',
  /** A speed segment's label: "2×". */
  speedOption: (factor: number) => `${factor}×`,
  reducedMotion: 'Reduced motion',
  theme: 'Theme',
  /** The theme segment that leaves the page's own theme in place. */
  ownTheme: 'Own',
  /** The demo's heading. */
  demoTitle: 'Release checklist',
  filterLabel: 'Show',
  all: 'All',
  open: 'Open',
  done: 'Done',
  addTask: 'Add a task',
  /** Shown when the filter leaves nothing. */
  nothingHere: 'Nothing here',
  ship: 'Ship it',
  shipping: 'Shipping…',
  /** The checklist's list label. */
  tasksLabel: 'Tasks',
}
export type HeroMotionCopy = typeof DEFAULT_COPY

export interface HeroMotionTask {
  id: string
  label: string
  done: boolean
}

export const TASKS: HeroMotionTask[] = [
  { id: 'review', label: 'Review the pull request', done: true },
  { id: 'tests', label: 'Run the visual tests', done: false },
  { id: 'notes', label: 'Write the release notes', done: false },
]

/** What "Add a task" adds, in turn. */
export const MORE_TASKS = ['Check the rollout in Frankfurt', 'Tell support what changed', 'Archive the old preview', 'Update the status page']
