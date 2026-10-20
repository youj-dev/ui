import type { MiniatureMeta } from '../engine/types'

/** HALVARD OP–4, chamber organ: what a showroom shows before it mounts. */
export const pipeOrgan = {
  id: 'pipe-organ',
  name: 'Chamber organ',
  model: 'HALVARD OP–4',
  maker: 'HALVARD / ORGAN BUILDERS',
  study: '040',
  spec: 'OP–4 / 4 STOPS · 25 KEYS · WIND 55 MM',
  label: 'Chamber organ, HALVARD OP–4',
  description: 'A painted case with a two-octave keyboard in a key well, four drawstops and a windchest carrying wooden stopped pipes, chimney flutes, an open principal and a mixture. A blower feeds a weighted wedge reservoir; a water gauge shows the wind pressure. Pipes light in their rank\'s color as they sound.',
  keys: [
    {
      keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
      caps: ['A …', '\''],
      label: 'naturals',
    },
    {
      keys: ['w', 'e', 't', 'y', 'u', 'o', 'p'],
      caps: ['W', 'E', 'T', 'Y', 'U', 'O', 'P'],
      label: 'sharps',
    },
    { keys: ['1', '2', '3', '4'], caps: ['1–4'], label: 'stops' },
    { keys: ['b'], caps: ['B'], label: 'blower', toggle: true },
    { keys: [' '], caps: ['Space'], label: 'cadence' },
  ],
  initial: { readout: '— · 1 STOP', state: 'WIND OFF · 8′', pressed: { b: false } },
  viewBox: '-74.35382907247958 -139 217.98969044771425 263',
  progress: false,
} as const satisfies MiniatureMeta
