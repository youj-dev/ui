import type { MiniatureMeta } from '../engine/types'

/** SOLRAN PX–6, Mars rover: what a showroom shows before it mounts. */
export const marsRover = {
  id: 'mars-rover',
  name: 'Mars rover',
  model: 'SOLRAN PX–6',
  maker: 'SOLRAN / PLANETARY WORKS',
  study: '094',
  spec: 'PX–6 / SIX-WHEEL ROCKER-BOGIE · STEREO MAST · CORING ARM',
  label: 'Mars rover, SOLRAN PX–6',
  description:
    'A six-wheeled rover on a patch of dusty red ground: a white body under a solar deck, a mast with stereo camera eyes, a dish and a whip antenna, a robotic arm folded at its nose, and a rocker-bogie that lets each wheel ride over rocks on its own. The up and down arrows drive it and the ground rolls by under its wheels; left and right turn it on the spot, its corner wheels steering in. The mast follows your pointer. Space unfolds the arm to the nearest rock, drills a core in a puff of dust and stows it; P sweeps the mast for a panorama and fires the flash. Left alone, it drives, samples and looks around by itself.',
  keys: [
    {
      keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
      caps: ['↑ ↓ ← →'],
      label: 'drive / steer',
    },
    { keys: [' '], caps: ['Space'], label: 'sample' },
    { keys: ['p'], caps: ['P'], label: 'panorama' },
  ],
  initial: { readout: 'SOL 214 · 0 M · 0 SAMPLES · 0 FRAMES', state: 'READY · ARM STOWED', pressed: {} },
  viewBox: '-89.88677271346657 -104 179.77354542693314 159.7',
  progress: false,
} as const satisfies MiniatureMeta
