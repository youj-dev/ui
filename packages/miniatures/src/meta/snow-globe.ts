import type { MiniatureMeta } from '../engine/types'

/** HUSHFALL G–10, snow globe: what a showroom shows before it mounts. */
export const snowGlobe = {
  id: 'snow-globe',
  name: 'Snow globe',
  model: 'HUSHFALL G–10',
  maker: 'HUSHFALL / GLASS & MUSIC BOXES',
  study: '081',
  spec: 'G–10 / 92 MM GLASS · WALNUT BASE · WIND-UP MUSIC BOX',
  label: 'Snow globe, HUSHFALL G–10',
  description: 'A glass snow globe on a turned walnut base with a small brass plate and a winding key. Inside, a red log cabin with lit windows stands in the snow between pines, with a lamp post and a skater on a frozen pond. Drag the globe or press Space to shake it: the snow whirls with the water, then slowly settles, and the readout follows it. The arrow keys swirl it one way or the other. W winds the music box in the base: it plays a little waltz, the skater glides while it plays, and the tune slows as the spring runs down. At night the windows and the lamp glow.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'shake · or drag the globe' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'swirl' },
    { keys: ['w'], caps: ['W'], label: 'wind the music box' },
  ],
  initial: { readout: 'SETTLING · 30%', state: 'MUSIC BOX STILL · W WINDS IT', pressed: {} },
  viewBox: '-62.84 -122.84 129.14 160.84',
  progress: false,
} as const satisfies MiniatureMeta
