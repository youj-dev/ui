import type { MiniatureMeta } from '../engine/types'

/** KEVRA PT–4, security camera: what a showroom shows before it mounts. */
export const securityCamera = {
  id: 'security-camera',
  name: 'Security camera',
  model: 'KEVRA PT–4',
  maker: 'KEVRA / SITE VISION',
  study: '059',
  spec: 'PT–4 / PAN-TILT · 4× ZOOM · IR 850 NM · 30 M',
  label: 'Security camera, KEVRA PT–4',
  description: 'A pan-tilt camera on a wall bracket: a long housing under a sun shield, a dark glass front with the lens, a ring of infrared LEDs and a REC light, a yoke on a pan unit with a status ring, and a drip loop down to a junction box with a privacy key switch. It follows your pointer across the floor with a little lag, throwing a soft pool of light where it looks, and patrols left and right when the pointer leaves. A fast movement counts as motion: the lens snaps to focus, the event is logged and the floodlight comes on. The arrow keys pan and tilt it by hand, Z zooms, N switches to infrared night vision, P slides the privacy shutter over the lens and parks it, and Space takes a snapshot.',
  keys: [
    {
      keys: ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'],
      caps: ['← ↑ ↓ →'],
      label: 'pan / tilt',
    },
    { keys: ['z'], caps: ['Z'], label: 'zoom' },
    { keys: ['n'], caps: ['N'], label: 'night vision' },
    { keys: ['p'], caps: ['P'], label: 'privacy' },
    { keys: [' '], caps: ['Space'], label: 'snapshot' },
  ],
  initial: {
    readout: 'PAN −45.0° · TILT −20.0° · 1.0×',
    state: 'PATROL · REC · DAY',
    pressed: {},
  },
  viewBox: '-66.88972745734182 -78.5 151.96598839415685 176.5',
  progress: false,
} as const satisfies MiniatureMeta
