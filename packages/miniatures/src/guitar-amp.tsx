import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/guitar-amp'
import { guitarAmp } from './meta/guitar-amp'

export { guitarAmp }
export type MiniatureGuitarAmpKey = MiniatureKeyOf<typeof guitarAmp>
export type MiniatureGuitarAmpHandle = MiniatureHandle<MiniatureGuitarAmpKey>
export interface MiniatureGuitarAmpProps extends MiniatureProps {
  ref?: Ref<MiniatureGuitarAmpHandle>
}

/**
 * HARROWAY MK·50, valve amplifier. Black tolex, cream piping, a brushed-gold control panel with six knobs, a red jewel lamp and two bat toggles, valves glowing behind a rear side vent, a two-button footswitch and a guitar cable plugged into the high input. Switch on, let the valves warm and lift standby; then strum a chord through the amp. Gain and tone change the sound, the footswitch swaps clean and lead channels and adds reverb, and the speaker cones pulse with the level.
 *
 * Keys: P power · S standby · Space strum · G gain · T tone · F channel · V reverb · ⇧ G ⇧ T turns down.
 */
export function MiniatureGuitarAmp(props: MiniatureGuitarAmpProps) {
  return <Miniature {...props} meta={guitarAmp} figure={figure} />
}
