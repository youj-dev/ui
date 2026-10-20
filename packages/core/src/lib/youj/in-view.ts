import type { InView, InViewOptions } from './vocabulary'

export interface ResolvedInView {
  /** True when it waits for the viewport; false when it plays on mount. */
  onView: boolean
  once: boolean
  amount: NonNullable<InViewOptions['amount']>
  margin: string | undefined
}

/** Reads a component's `inView` prop. `defaults.amount` is the component's own. */
export function resolveInView(inView: InView | undefined, defaults: { amount: number }): ResolvedInView {
  const options = typeof inView === 'object' ? inView : {}
  return {
    onView: inView !== false,
    once: options.once ?? true,
    amount: options.amount ?? defaults.amount,
    margin: options.margin,
  }
}
