'use client'

import { EntranceHost, type EntranceHostProps } from '../entrance/host'
import type { InspectorOptions } from './engine'

export interface InspectorEntranceProps extends EntranceHostProps, Pick<InspectorOptions, 'duration' | 'speed' | 'phases'> {}

const load = () => import('./engine').then((m) => m.inspector)

/**
 * Shows its child first as the browser's box model, part by part (margin, padding and content in soft tints, a hover
 * with a size tag running through the tree), then hands each part to the real UI. The look loads on the first play.
 * Under reduced motion the UI is just there.
 */
export function InspectorEntrance({ duration, speed, phases, ...rest }: InspectorEntranceProps) {
  return <EntranceHost load={load} options={{ duration, speed, phases }} {...rest} />
}
