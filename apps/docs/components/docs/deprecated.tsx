import type { ReactNode } from 'react'
import { Callout } from './blocks'

/**
 * A deprecation in prose: what's going, since and until which version, and
 * what to use instead. Pair it with the code's `deprecate()` warning and the
 * prop's JSDoc `@deprecated` (which the props table shows on its own):
 *
 *   <Deprecated name="tone" since="0.3.0" removeIn="0.5.0">Use `variant`.</Deprecated>
 */
export function Deprecated({ name, since, removeIn, children }: { name: string; since: string; removeIn: string; children: ReactNode }) {
  return (
    <Callout type="warning" title={`${name} is deprecated since ${since}, and goes in ${removeIn}`}>
      {children}
    </Callout>
  )
}
