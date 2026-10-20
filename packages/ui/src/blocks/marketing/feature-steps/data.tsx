import type { MouseEventHandler, ReactNode } from 'react'
import { ConnectVisual, PromoteVisual, PushVisual, ReviewVisual } from './visuals'

/** Where a step is in the tour: not reached yet, playing now, or behind it. */
export type FeatureStepsState = 'idle' | 'active' | 'done'

/** One step along the track. */
export interface FeatureStepsStep {
  /** Names the step for `value`. Default: its title. */
  id?: string
  title: string
  description: string
  /** A small picture under the text, decorative: a node, or a function of the step's state (`idle` before the tour reaches it, `active` while it plays, `done` once it's behind). */
  media?: ReactNode | ((state: FeatureStepsState) => ReactNode)
}

/** A call to action: a link styled as a button. */
export interface FeatureStepsCta {
  label: string
  href: string
  /** Runs on click; the link still follows `href` unless you call `event.preventDefault()`. */
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export const DEFAULT_COPY = {
  eyebrow: 'How it works',
  title: 'From repository to production in four steps',
  description: 'No YAML, no build servers, no ticket to ops. Most teams ship their first preview in under three minutes.',
  /** Names the list of steps. */
  stepsLabel: 'Steps',
  /** A step's button: "Step 2 of 4: Push a branch". */
  stepName: (index: number, total: number, title: string) => `Step ${index} of ${total}: ${title}`,
  /** The tour's button while it plays. */
  pause: 'Pause the tour',
  /** The tour's button while it's stopped. */
  play: 'Play the tour',
}
export type FeatureStepsCopy = typeof DEFAULT_COPY

export const STEPS: FeatureStepsStep[] = [
  {
    id: 'connect',
    title: 'Connect a repository',
    description: 'Pick a repo from GitHub, GitLab or Bitbucket. The framework, build command and output are detected.',
    media: (state) => <ConnectVisual state={state} />,
  },
  {
    id: 'push',
    title: 'Push a branch',
    description: 'Every push builds in its own sandbox, reusing whatever didn’t change since the last one.',
    media: (state) => <PushVisual state={state} />,
  },
  {
    id: 'review',
    title: 'Review the preview',
    description: 'Each pull request gets a live URL. Reviewers comment on the page itself, not a screenshot.',
    media: (state) => <ReviewVisual state={state} />,
  },
  {
    id: 'promote',
    title: 'Promote to production',
    description: 'Merge, or promote the preview you reviewed. The same build goes live everywhere at once.',
    media: (state) => <PromoteVisual state={state} />,
  },
]
