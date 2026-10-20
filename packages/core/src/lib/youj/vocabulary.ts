/* The words every component shares. One word means one thing: a component that
 * needs the idea uses these, and vocabulary.test.ts in @youj/react keeps the
 * props that spell them differently from growing back. */

/**
 * The size scale, shadcn's names. `sm | default | lg` is the scale; `xs` and
 * `xl` come from the same line for a component that genuinely needs another
 * step. A component takes the subset it has (`Extract<Size, 'sm' | 'default'>`),
 * never a name of its own (`md`, `medium`, `large`). `size` is how big one
 * control is; the provider's `density` is how much room a layout takes.
 */
export type Size = 'xs' | 'sm' | 'default' | 'lg' | 'xl'

/**
 * The severity, in the words of the colour roles (`danger`, as in `bg-danger`).
 * A prop that picks a severity takes these, or a subset: `variant` or `tone`
 * values built on it, never `destructive`, `error` or `critical`. A tone prop
 * may add the neutral colours around it (`accent`, `neutral`, `chart-1`…).
 */
export type Status = 'info' | 'success' | 'warning' | 'danger'

/** What counts as in view: how much of the element, and from which margin. */
export interface InViewOptions {
  /** Play once (the default) or every time it enters. */
  once?: boolean
  /** The fraction of the element that must be visible (`'some'`, `'all'` or 0 to 1). */
  amount?: 'some' | 'all' | number
  /** An IntersectionObserver root margin, as CSS: `'0px 0px -20% 0px'`. */
  margin?: string
}

/**
 * When a motion component plays: `false` plays on mount; `true` plays as it
 * scrolls into view; an object says how much and how often. Every component
 * that waits for the viewport takes this one prop, `inView`.
 */
export type InView = boolean | InViewOptions
