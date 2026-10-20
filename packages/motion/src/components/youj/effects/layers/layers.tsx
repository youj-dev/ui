'use client'

import { layersLabels } from '@youj/core/labels'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import { EntranceHost, type EntranceHostProps } from '../entrance/host'
import type { LayersOptions } from './engine'

export interface LayersEntranceProps extends EntranceHostProps, Pick<LayersOptions, 'duration' | 'speed' | 'phases'> {}

const load = () => import('./engine').then((m) => m.layers)

/**
 * Shows its child first as an exploded isometric stack of its layers (frame, regions, boxes, content), then settles the
 * camera flat as the stack collapses layer by layer into the real UI. The look loads on the first play. Under reduced
 * motion the UI is just there.
 */
export function LayersEntrance({ duration, speed, phases, ...rest }: LayersEntranceProps) {
  const labels = useComponentLabels(layersLabels)
  return <EntranceHost load={load} options={{ duration, speed, phases, labels }} {...rest} />
}
