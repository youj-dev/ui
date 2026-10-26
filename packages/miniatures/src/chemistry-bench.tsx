import type { Ref } from 'react'
import { Miniature } from './engine/miniature'
import type { MiniatureProgressHandle, MiniatureKeyOf, MiniatureProgressProps } from './engine/types'
import { figure } from './figures/chemistry-bench'
import { chemistryBench } from './meta/chemistry-bench'

export { chemistryBench }
export type MiniatureChemistryBenchKey = MiniatureKeyOf<typeof chemistryBench>
export type MiniatureChemistryBenchHandle = MiniatureProgressHandle<MiniatureChemistryBenchKey>
export interface MiniatureChemistryBenchProps extends MiniatureProgressProps {
  ref?: Ref<MiniatureChemistryBenchHandle>
}

/**
 * ALEMVER DS–7, chemistry bench. A distillation train on a lab bench: a round-bottom flask clamped over a gas burner, a Vigreux column with a thermometer, a coil condenser and a bent adapter that drips into a conical receiving flask, beside test tubes in a rack and a beaker on a stirring hot plate. The charge boils, vapor climbs the column, and drops condense and drip into the receiver as the flask runs down. Space lights the burner or puts it out, the arrow keys set the heat, a test tube (click it, or press its number) pours into the beaker with a color change, and S spins the stir bar. As a progress indicator the distillate fills to the progress, and done puts the burner out and lights the receiver.
 *
 * Keys: Space burner · ← ↓ ↑ → heat · 1–4 pour a tube · S stir.
 */
export function MiniatureChemistryBench(props: MiniatureChemistryBenchProps) {
  return <Miniature {...props} meta={chemistryBench} figure={figure} />
}
