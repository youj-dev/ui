import type { MiniatureMeta } from '../engine/types'

/** STRATA A10, tape library: what a showroom shows before it mounts. */
export const tapeLibrary = {
  id: 'tape-library',
  name: 'Tape library',
  model: 'STRATA A10',
  maker: 'STRATA / ARCHIVE SYSTEMS',
  study: '043',
  spec: 'A10 / 10 SLOTS · 2 × LTO-9 · 180 TB',
  label: 'Tape library, STRATA A10',
  description: 'A cabinet with a window onto ten cartridges, two tape drives and a robotic picker. Behind the glass a picker rides a gantry in front of a wall of tape cartridges and two drives. Request a tape and the picker fetches it and loads a drive; return tapes, run an inventory scan or switch the interior light.',
  keys: [
    {
      keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      caps: ['1–0'],
      label: 'load tape',
    },
    { keys: ['u'], caps: ['U'], label: 'unload' },
    { keys: ['s'], caps: ['S'], label: 'inventory' },
    { keys: ['l'], caps: ['L'], label: 'light' },
  ],
  initial: { readout: '0/2 DRIVES · 0 MB/s', state: 'IDLE', pressed: {  } },
  viewBox: '-73.96152422706632 -146 203.3486742963367 260',
  progress: false,
} as const satisfies MiniatureMeta
