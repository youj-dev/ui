import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/rotary-phone'
import { rotaryPhone } from './meta/rotary-phone'

export { rotaryPhone }
export type MiniatureRotaryPhoneKey = MiniatureKeyOf<typeof rotaryPhone>
export type MiniatureRotaryPhoneHandle = MiniatureHandle<MiniatureRotaryPhoneKey>
export interface MiniatureRotaryPhoneProps extends MiniatureProps {
  ref?: Ref<MiniatureRotaryPhoneHandle>
}

/**
 * NALDEN R–10, rotary phone. An ivory key telephone with a sloped front: a ten-hole finger wheel over a number plate that lights when the handset is lifted, a cradle with hook plungers, lit line and hold keys, a dialled-number card, twin gongs behind a side window and a coiled handset cord. Lift the handset, dial, take an incoming call or put it on hold.
 *
 * Keys: H handset · 0–9 dial · R ring / quiet · K hold.
 */
export function MiniatureRotaryPhone(props: MiniatureRotaryPhoneProps) {
  return <Miniature {...props} meta={rotaryPhone} figure={figure} />
}
