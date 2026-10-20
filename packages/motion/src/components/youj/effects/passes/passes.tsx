'use client'

import { renderPassesLabels } from '@youj/core/labels'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import { EntranceHost, type EntranceHostProps } from '../entrance/host'
import type { RenderPassesOptions } from './engine'

export interface RenderPassesEntranceProps extends EntranceHostProps, Pick<RenderPassesOptions, 'duration' | 'speed' | 'phases'> {}

const load = () => import('./engine').then((m) => m.renderPasses)

/**
 * Plays its child in as the browser's pipeline: a layout pass (every box outlined with its size), a paint pass (flat
 * greys, text in grey) and a composite pass (the real UI, piece by piece), each labelled with its count. The look loads
 * on the first play. Under reduced motion the UI is just there.
 */
export function RenderPassesEntrance({ duration, speed, phases, ...rest }: RenderPassesEntranceProps) {
  const labels = useComponentLabels(renderPassesLabels)
  return <EntranceHost load={load} options={{ duration, speed, phases, labels }} {...rest} />
}
