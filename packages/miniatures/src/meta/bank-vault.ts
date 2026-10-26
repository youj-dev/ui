import type { MiniatureMeta } from '../engine/types'

/** HALVARD V–40, bank vault: what a showroom shows before it mounts. */
export const bankVault = {
  id: 'bank-vault',
  name: 'Bank vault',
  model: 'HALVARD V–40',
  maker: 'HALVARD / STRONGROOM WORKS',
  study: '098',
  spec: 'V–40 / ROUND DOOR · RADIAL BOLTS · 0–99 DIAL',
  label: 'Bank vault, HALVARD V–40',
  description: 'Dial the demo combination 30, 70, 15, pressing Enter after each number: every number that clicks in lights a lamp over the door, then the bolts slide back, the handle turns and the door swings open on its hinge. Space closes it and it relocks. A wrong number gives a gentle shake; three in a row ring the alarm. Turn the dial with the arrow keys or by dragging it, or type a number with 0–9. C changes what the vault holds: gold, cash or a single key.',
  keys: [
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['← →'], label: 'turn the dial' },
    { keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], caps: ['0–9'], label: 'dial a number' },
    { keys: ['Enter'], caps: ['Enter'], label: 'set it' },
    { keys: [' '], caps: ['Space'], label: 'handle · open / close' },
    { keys: ['Escape'], caps: ['Esc'], label: 'clear / close' },
    { keys: ['c'], caps: ['C'], label: 'contents' },
  ],
  initial: { readout: 'DIAL 00 · –– –– –– · DOOR 0°', state: 'LOCKED / DEMO 30 · 70 · 15', pressed: {} },
  viewBox: '-240.8986557915229 -194 415.9793808954285 365',
  progress: false,
} as const satisfies MiniatureMeta
