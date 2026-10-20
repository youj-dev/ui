import type { StagePipelineRun } from './data'

/** One step of a finished run. Times are in ms. */
export interface StagePipelineTimingStep {
  id: string
  name: string
  /** When the step started, counted from the start of the run. */
  start: number
  /** How long it took. Ignored for a skipped step. */
  took: number
  /** How long it took in the run before, to compare against: a longer ghost bar when it got faster, an overshoot when it got slower. */
  previous?: number
  /** The step did not run (a cache hit, a branch that was not taken): no bar, just the word. */
  skipped?: boolean
}

/** Steps that belong together, such as Build or Deploy. */
export interface StagePipelineTimingGroup {
  id: string
  name: string
  steps: StagePipelineTimingStep[]
}

export interface StagePipelineTimingResult {
  /** Where it ended up: "checkout.example.dev". */
  location: string
  /** The time to show with it. Default: the run's total. */
  took?: number
}

export const TIMING_RUN: StagePipelineRun = {
  id: '2481',
  name: 'checkout-api',
  target: 'production',
  source: 'main',
  revision: '9f3c2ab',
  summary: 'Cache the pricing table at the edge',
  author: 'mara',
  runner: 'eu-west-2',
}

export const TIMING_GROUPS: StagePipelineTimingGroup[] = [
  {
    id: 'build',
    name: 'Build',
    steps: [
      { id: 'restore', name: 'Restore cache', start: 0, took: 4_000, previous: 4_000 },
      { id: 'install', name: 'Install packages', start: 4_000, took: 9_000, previous: 15_000 },
      { id: 'types', name: 'Check types', start: 13_000, took: 8_000, previous: 5_000 },
      { id: 'bundle', name: 'Bundle', start: 21_000, took: 10_000, previous: 11_000 },
    ],
  },
  {
    id: 'deploy',
    name: 'Deploy',
    steps: [
      { id: 'canary', name: 'Canary rollout', start: 31_000, took: 6_000, previous: 6_000 },
      { id: 'warm', name: 'Warm the edge cache', start: 37_000, took: 0, skipped: true },
      { id: 'shift', name: 'Shift traffic', start: 37_000, took: 5_000, previous: 8_000 },
    ],
  },
]

export const TIMING_COPY = {
  title: (name: string) => name,
  subtitle: (run: string, target: string) => `Run #${run} · ${target}`,
  total: 'Total',
  skipped: 'Skipped',
  /** Beside a step that took a different time than before. */
  was: (duration: string) => `was ${duration}`,
  slower: (duration: string) => `${duration} slower`,
  faster: (duration: string) => `${duration} faster`,
  /** The strip's name for assistive tech; `parts` is "Build 31 s, Deploy 11 s". */
  stripLabel: (parts: string) => `Time by group: ${parts}`,
  /** The result line under the steps. */
  live: (location: string, duration: string) => `Live on ${location} · ${duration}`,
}

export type StagePipelineTimingCopy = typeof TIMING_COPY & {
  /** The locale durations are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
