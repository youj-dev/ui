import type { ReactNode } from 'react'

/** What a step's live picture is given. */
export interface ProductTourStepContext {
  /** Whether the visitor has done this step's thing. */
  done: boolean
  /** Call it when they do: the step gets its check and the progress moves. */
  complete: () => void
  /** The block's strings, for a step's own labels. */
  copy: ProductTourCopy
}

/** One step of the tour: a heading on the rail and a live picture to try. */
export interface ProductTourStep {
  id: string
  /** The step's name on the rail. */
  title: string
  /** What happens, in a sentence or two; shown under the title while the step is open. */
  description: string
  /** What to try ("Connect a repository"), shown over the picture as a prompt. */
  prompt?: string
  /** The live picture: real components the visitor can operate. Call `complete` when they have done the step's thing; mark the control to try with `data-yj-tour-target` and a beacon points it out until then. */
  render: (context: ProductTourStepContext) => ReactNode
}

export const DEFAULT_COPY = {
  eyebrow: 'Product tour',
  title: 'See it work in four steps',
  description: 'Not a video: these are the real components. Try each step and watch the page respond.',
  /** Names the step list. */
  stepsLabel: 'Tour steps',
  /** A step's accessible name: "Step 2 of 4: Set guardrails, done". */
  stepName: (index: number, total: number, title: string, done: boolean) => `Step ${index} of ${total}: ${title}${done ? ', done' : ''}`,
  /** The progress line: "2 of 4 steps tried". */
  progress: (done: number, total: number) => `${done} of ${total} steps tried`,
  /** The window's address, shown in its title bar. */
  address: 'app.northwind.dev/acme/web',
  back: 'Back',
  next: 'Next step',
  /** After the last step, in place of Next. */
  finish: 'Start with your own project',
  reset: 'Start the tour again',
  /** The prompt label over a step's picture. */
  try: 'Try it',
  /** Announced when a step is done. */
  stepDone: (title: string) => `${title}: done`,
  /** Names a repository's button in the connect step: "Connect acme/web". */
  connectRepo: (name: string) => `Connect ${name}`,
  /** Names the pin in the review step. */
  commentPin: 'Comment on the button',
  /** The review step's reply box. */
  replyPlaceholder: 'Reply…',
  replyLabel: 'Reply to Theo',
  /** Names the canary step's slider. */
  trafficLabel: 'Traffic on the new build',
}
export type ProductTourCopy = typeof DEFAULT_COPY
