import type { MiniatureMeta } from '../engine/types'

/** VAARDEN BK–2, drawbridge: what a showroom shows before it mounts. */
export const drawbridge = {
  id: 'drawbridge',
  name: 'Drawbridge',
  model: 'VAARDEN BK–2',
  maker: 'VAARDEN / CANAL WORKS',
  study: '096',
  spec: 'BK–2 / DOUBLE-LEAF BASCULE · BALANCE BEAMS · 6 M SPAN',
  label: 'Drawbridge, VAARDEN BK–2',
  description: 'A white double-leaf bascule bridge over a canal: balance beams and their counterweights on its portals, road barriers with signals, red and green span lamps, a brick control tower, and a sailing boat whose mast is too tall for the closed bridge. Press Space or click the tower to approve: the barriers come down and the road signals turn red, the leaves rise as the counterweights swing down, the span lamps turn green and the boat passes, then everything returns and the next boat comes up. Escape denies: the boat holds and sounds its horn, and an opening still under way comes back down. As a progress indicator the opening follows the progress, and on completion the boat passes.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'approve' },
    { keys: ['Escape'], caps: ['Esc'], label: 'deny' },
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
  ],
  initial: { readout: 'LEAVES 0° · BARRIERS UP · CANAL RED', state: 'REQUEST · AWAITING APPROVAL', pressed: {} },
  viewBox: '-63.42562584220407 -82.5 161.4922678357857 147.5',
  progress: true,
} as const satisfies MiniatureMeta
