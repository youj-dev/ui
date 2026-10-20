import { useMemo } from 'react'
import { useLabelOverrides } from './provider'

/** Resolve only a component's defaults under the enclosing providers' overrides. */
export function useComponentLabels<T extends object>(defaults: T): T {
  const overrides = useLabelOverrides()
  return useMemo(() => (overrides ? { ...defaults, ...overrides } : defaults), [defaults, overrides])
}
