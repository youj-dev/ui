import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/stand-mixer'
import { standMixer } from './meta/stand-mixer'

export { standMixer }
export type MiniatureStandMixerKey = MiniatureKeyOf<typeof standMixer>
export type MiniatureStandMixerHandle = MiniatureHandle<MiniatureStandMixerKey>
export interface MiniatureStandMixerProps extends MiniatureProps {
  ref?: Ref<MiniatureStandMixerHandle>
}

/**
 * TAVREN M–04, stand mixer. Lift the hinged head, change between whisk, paddle and dough hook, and move the speed lever to swirl the batter in a rounded steel bowl. The lock ring glows green when the head is latched and amber when released, a five-step LED ladder shows the speed and a bowl light shines into the batter.
 *
 * Keys: T tilt · A attachment · 1–5 speed · 0 stop · L bowl light · click latch to release.
 */
export function MiniatureStandMixer(props: MiniatureStandMixerProps) {
  return <Miniature {...props} meta={standMixer} figure={figure} />
}
