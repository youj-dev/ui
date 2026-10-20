import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureHandle, MiniatureKeyOf, MiniatureProps } from './engine/types'
import { figure } from './figures/microscope'
import { microscope } from './meta/microscope'

export { microscope }
export type MiniatureMicroscopeKey = MiniatureKeyOf<typeof microscope>
export type MiniatureMicroscopeHandle = MiniatureHandle<MiniatureMicroscopeKey>
export interface MiniatureMicroscopeProps extends MiniatureProps {
  ref?: Ref<MiniatureMicroscopeHandle>
}

/**
 * AVEL M–04, lab microscope. A binocular microscope on a cast stand: a filter turret over the LED lamp, a condenser with iris lever, a dark mechanical stage that carries the slide sideways, coarse and fine focus, a three-objective nosepiece with color-coded rings and two angled eyepieces. The circular field shows the stained cells at the selected magnification, focus, position and filter.
 *
 * Keys: 1 2 3 objective · ↑ ↓ focus · ← → stage · F filter · L light.
 */
export function MiniatureMicroscope(props: MiniatureMicroscopeProps) {
  return <Miniature {...props} meta={microscope} figure={figure} />
}
