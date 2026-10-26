import type { MiniatureMeta } from '../engine/types'

/** TORVIK K–75, mechanical keyboard: what a showroom shows before it mounts. */
export const mechanicalKeyboard = {
  id: 'mechanical-keyboard',
  name: 'Mechanical keyboard',
  model: 'TORVIK K–75',
  maker: 'TORVIK / TYPING INSTRUMENTS',
  study: '077',
  spec: 'K–75 / 75% · GASKET MOUNT · TACTILE 62 g · PBT DOUBLESHOT · RGB',
  label: 'Mechanical keyboard, TORVIK K–75',
  description: 'A 75% mechanical keyboard in a silver aluminum case on a felt desk mat: cream and graphite doubleshot keycaps with orange accents, a knurled volume knob in the corner, a frosted diffuser between the case halves and an orange coiled cable with an aviator plug. Type on your keyboard and the matching key travels down and springs back while an RGB ripple spreads from it across the keys and the underglow. Caps lock lights its LED, the up and down arrows turn the knob, the left and right arrows switch the lighting, and the space bar rocks on its stabilizer. Left alone, it types by itself.',
  keys: [
    { keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], caps: ['A–Z'], label: 'type' },
    { keys: [' '], caps: ['Space'], label: 'space bar' },
    { keys: ['CapsLock'], caps: ['⇪'], label: 'caps lock' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'volume' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'lighting' },
  ],
  initial: { readout: 'VOL 40 · RIPPLE', state: 'READY · TYPE ON YOUR KEYBOARD', pressed: {} },
  viewBox: '-82.2102355330306 -28 238.8986557915229 144',
  progress: false,
} as const satisfies MiniatureMeta
