import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/oscilloscope'
import { oscilloscope } from './meta/oscilloscope'

export { oscilloscope }
export type MiniatureOscilloscopeKey = MiniatureKeyOf<typeof oscilloscope>
export type MiniatureOscilloscopeHandle = MiniatureHandle<MiniatureOscilloscopeKey>
export interface MiniatureOscilloscopeProps extends MiniatureProps {
  ref?: Ref<MiniatureOscilloscopeHandle>
}

/**
 * ORYNT T–12, oscilloscope. A CRT oscilloscope with a sunshade, volts and time dials, trigger lamp and position knobs, connected by two BNC cables to a compact generator with an amber frequency display, lit waveform keys and an output lamp. Select sine, square or saw, change scales and frequency, switch the output or hold the trace.
 *
 * Keys: 1–3 sine / square / saw · ↑ ↓ volts/div · ← → time/div · F frequency · G output · Space hold · O power.
 */
export function MiniatureOscilloscope(props: MiniatureOscilloscopeProps) {
  return <Miniature {...props} meta={oscilloscope} figure={figure} />
}
