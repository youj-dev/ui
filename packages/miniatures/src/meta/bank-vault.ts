import type { MiniatureMeta } from '../engine/types'

/** HALVARD V–40, bank vault: what a showroom shows before it mounts. */
export const bankVault = {
  id: 'bank-vault',
  name: 'Bank vault',
  model: 'HALVARD V–40',
  maker: 'HALVARD / STRONGROOM WORKS',
  study: '098',
  spec: 'V–40 / ROUND DOOR · CRANE HINGE · RADIAL BOLTS',
  label: 'Bank vault, HALVARD V–40',
  description: 'A walk-in vault’s round door, set in its wall. Press Space or Enter, or click the big wheel: it turns once and draws the bolts back, then the thick door is drawn out of its frame and swings open on its crane hinge onto gold, cash or a single key. Press again to swing it shut and throw the bolts. Drag the wheel to turn it by hand: past three quarters of a turn it carries on and opens. C changes what the vault holds.',
  keys: [
    { keys: [' ', 'Enter'], caps: ['Space', 'Enter'], label: 'open / close', toggle: true },
    { keys: ['c'], caps: ['C'], label: 'contents · drag the wheel to turn it' },
  ],
  initial: { readout: 'WHEEL 0° · BOLTS THROWN · DOOR 0°', state: 'LOCKED / SPACE OR THE WHEEL OPENS IT', pressed: { ' ': false } },
  viewBox: '-254.75506225207394 -231 450.62039704680603 366',
  progress: false,
} as const satisfies MiniatureMeta
