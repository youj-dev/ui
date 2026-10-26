import type { MiniatureMeta } from '../engine/types'

/** LOUVEN MT–15, reel-to-reel tape recorder: what a showroom shows before it mounts. */
export const reelToReel = {
  id: 'reel-to-reel',
  name: 'Reel-to-reel tape recorder',
  model: 'LOUVEN MT–15',
  maker: 'LOUVEN / MAGNETIC WORKS',
  study: '060',
  spec: 'MT–15 / ½ IN · 2 TRACK · 15 IPS · NAB REELS',
  label: 'Reel-to-reel tape recorder, LOUVEN MT–15',
  description:
    'An upright studio tape deck in a walnut sleeve: two machined reels with windows onto the tape pack, the tape running off the supply reel around a tension roller, under the guides, heads and capstan and up to the take-up reel, backlit VU meters, a tape-time counter, transport keys and a record lamp. Space plays or stops it. The tape runs at a steady speed, so each reel turns as fast as its own pack needs: the emptying reel speeds up as the other fills. R records, lighting the lamp while the needles swing on the input, and punches out again. The arrows rewind and fast-forward with the tape lifted off the heads, and T threads a fresh reel of blank tape. As a progress indicator the tape travels from one reel to the other with the progress.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'play / stop' },
    { keys: ['r'], caps: ['R'], label: 'record' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'rewind / fast-forward' },
    { keys: ['t'], caps: ['T'], label: 'fresh reel' },
  ],
  initial: { readout: '01:12 · −7 DB · PLAY', state: 'PLAYING · 15 IPS · THE MIX', pressed: {} },
  viewBox: '-47.23909236273086 -147 192.33905535310328 247.5',
  progress: true,
} as const satisfies MiniatureMeta
