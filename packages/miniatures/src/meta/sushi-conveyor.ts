import type { MiniatureMeta } from '../engine/types'

/** MAKIRO K–8, sushi conveyor: what a showroom shows before it mounts. */
export const sushiConveyor = {
  id: 'sushi-conveyor',
  name: 'Sushi conveyor',
  model: 'MAKIRO K–8',
  maker: 'MAKIRO / CONVEYOR COUNTERS',
  study: '079',
  spec: 'K–8 / CRESCENT BELT · KITCHEN PASS · PLATE TALLY',
  label: 'Sushi conveyor, MAKIRO K–8',
  description:
    'A conveyor-belt sushi counter: a crescent-slat belt loops round a stainless island, carrying colored plates of nigiri, maki and gunkan past a wooden counter with an order screen, and the kitchen sends fresh plates out from under the noren of its window. Click a plate, or press Space for the one in front of you, to take it off: your stack of empty plates grows, and the order screen tallies them and the bill, priced by plate color. The arrows slow the belt down or speed it up, O orders a fresh plate from the kitchen and C asks for the check. As a progress indicator your stack fills with the progress; on completion the check comes.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'take the front plate · click any plate' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['← →'], label: 'belt speed' },
    { keys: ['o'], caps: ['O'], label: 'order a fresh plate' },
    { keys: ['c'], caps: ['C'], label: 'check, please' },
  ],
  initial: { readout: 'PLATES 00 · $0 · BELT 1.0×', state: 'SERVING · SPACE TAKES THE FRONT PLATE', pressed: {} },
  viewBox: '-88 -108.5 176.7 160.5',
  progress: true,
} as const satisfies MiniatureMeta
