import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/stage-synth'
import { stageSynth } from './meta/stage-synth'

export { stageSynth }
export type MiniatureStageSynthKey = MiniatureKeyOf<typeof stageSynth>
export type MiniatureStageSynthHandle = MiniatureHandle<MiniatureStageSynthKey>
export interface MiniatureStageSynthProps extends MiniatureProps {
  ref?: Ref<MiniatureStageSynthHandle>
}

/**
 * VERMIL ST–73, stage keyboard. A graphite chassis between walnut end cheeks with a fine vermilion pinstripe, 73 ivory and ebony keys under a light guide, a rubber mod wheel and a walnut pitch stick, and a brushed panel with organ LED drawbars, piano type buttons, synth knobs with LED rings and a small OLED. Play it from the computer keyboard. Switch between the organ, piano and synth sections, pull new drawbar registrations, sweep the filter and roll the mod wheel for vibrato. Keys dip, and the light guide above them marks the playable range and lights each note in the color of the active section.
 *
 * Keys: A–' play · W E T Y U O P sharps · Z X octave · 1 2 3 organ · piano · synth · R drawbars · ↑ ↓ filter · M mod wheel.
 */
export function MiniatureStageSynth(props: MiniatureStageSynthProps) {
  return <Miniature {...props} meta={stageSynth} figure={figure} />
}
