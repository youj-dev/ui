import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/modular-synth'
import { modularSynth } from './meta/modular-synth'

export { modularSynth }
export type MiniatureModularSynthKey = MiniatureKeyOf<typeof modularSynth>
export type MiniatureModularSynthHandle = MiniatureHandle<MiniatureModularSynthKey>
export interface MiniatureModularSynthProps extends MiniatureProps {
  ref?: Ref<MiniatureModularSynthHandle>
}

/**
 * CALDERN M–66, modular synth. A desktop Eurorack case between walnut cheeks: a step sequencer, an oscillator, a lowpass filter, an envelope and an output module on aluminum panels, with knobs, jacks and LEDs, and colored patch cables sagging between the jacks. The cables are the patch: a note’s pulse runs from the sequencer down each cable to the module it feeds, lighting its LED on the way to the output. Space starts or stops the sequencer, the number keys switch steps on and off, the left and right arrows pick a knob and the up and down arrows turn it. Drag from one jack to another to patch a cable, drag a plugged one away to pull it, P steps through the preset patches and Backspace pulls every cable.
 *
 * Keys: Space run / stop · 1–8 steps · ← → pick a knob · ↑ ↓ turn it · P patches · ⌫ pull the cables · drag jack to jack to patch.
 */
export function MiniatureModularSynth(props: MiniatureModularSynthProps) {
  return <Miniature {...props} meta={modularSynth} figure={figure} />
}
