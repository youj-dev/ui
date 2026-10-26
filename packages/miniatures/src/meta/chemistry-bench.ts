import type { MiniatureMeta } from '../engine/types'

/** ALEMVER DS–7, chemistry bench: what a showroom shows before it mounts. */
export const chemistryBench = {
  id: 'chemistry-bench',
  name: 'Chemistry bench',
  model: 'ALEMVER DS–7',
  maker: 'ALEMVER / BENCH GLASSWORKS',
  study: '097',
  spec: 'DS–7 / VIGREUX COLUMN · COIL CONDENSER · STIRRER PLATE',
  label: 'Chemistry bench, ALEMVER DS–7',
  description:
    'A distillation train on a lab bench: a round-bottom flask clamped over a gas burner, a Vigreux column with a thermometer, a coil condenser and a bent adapter that drips into a conical receiving flask, beside test tubes in a rack and a beaker on a stirring hot plate. The charge boils, vapor climbs the column, and drops condense and drip into the receiver as the flask runs down. Space lights the burner or puts it out, the arrow keys set the heat, a test tube (click it, or press its number) pours into the beaker with a color change, and S spins the stir bar. As a progress indicator the distillate fills to the progress, and done puts the burner out and lights the receiver.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'burner' },
    { keys: ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'], caps: ['← ↓ ↑ →'], label: 'heat' },
    { keys: ['1', '2', '3', '4'], caps: ['1–4'], label: 'pour a tube' },
    { keys: ['s'], caps: ['S'], label: 'stir' },
  ],
  initial: { readout: '99.6 °C · YIELD 32%', state: 'DISTILLING · HEAT 3 · BATCH 1', pressed: {} },
  viewBox: '-106 -176 212 240',
  progress: true,
} as const satisfies MiniatureMeta
