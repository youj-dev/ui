import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/pipe-organ'
import { pipeOrgan } from './meta/pipe-organ'

export { pipeOrgan }
export type MiniaturePipeOrganKey = MiniatureKeyOf<typeof pipeOrgan>
export type MiniaturePipeOrganHandle = MiniatureHandle<MiniaturePipeOrganKey>
export interface MiniaturePipeOrganProps extends MiniatureProps {
  ref?: Ref<MiniaturePipeOrganHandle>
}

/**
 * HALVARD OP–4, chamber organ. A painted case with a two-octave keyboard in a key well, four drawstops and a windchest carrying wooden stopped pipes, chimney flutes, an open principal and a mixture. A blower feeds a weighted wedge reservoir; a water gauge shows the wind pressure. Pipes light in their rank's color as they sound.
 *
 * Keys: A … ' naturals · W E T Y U O P sharps · 1–4 stops · B blower · Space cadence.
 */
export function MiniaturePipeOrgan(props: MiniaturePipeOrganProps) {
  return <Miniature {...props} meta={pipeOrgan} figure={figure} />
}
