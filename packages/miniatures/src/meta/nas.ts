import type { MiniatureMeta } from '../engine/types'

/** HALCYON N4, nas: what a showroom shows before it mounts. */
export const nas = {
  id: 'nas',
  name: 'NAS',
  model: 'HALCYON N4',
  maker: 'HALCYON / STORAGE',
  study: '042',
  spec: 'N4 / 4 × 8 TB · RAID 5 · 2.5GbE',
  label: 'NAS, HALCYON N4',
  description: 'A four-bay NAS with an aluminum shell, a dark front bezel, an OLED strip, a power button and a side fan. Pull and reinsert drives to degrade and rebuild the RAID, run a transfer or power it down.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power' },
    { keys: ['1', '2', '3', '4'], caps: ['1–4'], label: 'pull / insert drive' },
    { keys: ['t'], caps: ['T'], label: 'transfer' },
  ],
  initial: { readout: '4/4 DRIVES · 0 MB/s', state: 'HEALTHY', pressed: {  } },
  viewBox: '-154.76983597145022 -128 253.24802069691194 251.5',
  progress: false,
} as const satisfies MiniatureMeta
