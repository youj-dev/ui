import type { MiniatureMeta } from '../engine/types'

/** AVOCET HX–2, mirrorless camera: what a showroom shows before it mounts. */
export const vintageCamera = {
  id: 'vintage-camera',
  name: 'Mirrorless camera',
  model: 'AVOCET HX–2',
  maker: 'AVOCET / CAMERA WORKS',
  study: '072',
  spec: 'HX–2 / 24 MP FULL FRAME · 40 MM ƒ/2 · VARI-ANGLE SCREEN',
  label: 'Mirrorless camera, AVOCET HX–2',
  description: 'A heritage-styled camera. Turn the dials and the aperture ring and the live view brightens or darkens; turn the focus ring and the cactus or the city lights behind it come into focus. Release the shutter, flip the screen in and out, or switch the camera off.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power', toggle: true },
    { keys: [' '], caps: ['Space'], label: 'shutter' },
    { keys: ['s', 'i', 'e'], caps: ['S', 'I', 'E'], label: 'dials' },
    { keys: ['a'], caps: ['A'], label: 'aperture' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'focus' },
    { keys: ['f'], caps: ['F'], label: 'flip screen', toggle: true },
    { keys: ['shift+s', 'shift+i', 'shift+e', 'shift+a'], caps: ['⇧'], label: 'reverse' },
  ],
  initial: {
    readout: '1/60 · f/2 · ISO 400 · ±0.0',
    state: 'FOCUSED 1.2 M · METER 0.0 · 0 SHOTS',
    pressed: { o: true, f: true },
  },
  viewBox: '-44.373066958946424 -118.25 252.42493523315173 227.25',
  progress: false,
} as const satisfies MiniatureMeta
