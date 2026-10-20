import { useMemo } from 'react'
import type { YoujLabels } from './labels-types'
import { useLabelOverrides } from './provider'

/** Resolve only a component's defaults under the enclosing providers' overrides. */
export function useComponentLabels<K extends keyof YoujLabels>(defaults: Pick<YoujLabels, K>): Pick<YoujLabels, K> {
  const overrides = useLabelOverrides()
  return useMemo(() => (overrides ? { ...defaults, ...overrides } : defaults), [defaults, overrides])
}
