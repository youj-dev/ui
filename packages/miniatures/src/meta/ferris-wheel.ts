import type { MiniatureMeta } from '../engine/types'

/** CORVELLE R–24, Ferris wheel: what a showroom shows before it mounts. */
export const ferrisWheel = {
  id: 'ferris-wheel',
  name: 'Ferris wheel',
  model: 'CORVELLE R–24',
  maker: 'CORVELLE / PLEASURE WHEELS',
  study: '052',
  spec: 'R–24 / 24 M WHEEL · LEVEL CARS · 1–4 RPM · RIM LIGHTS',
  label: 'Ferris wheel, CORVELLE R–24',
  description:
    'A classic Ferris wheel on two lattice A-frames: a white steel wheel with laced twin rims and spokes, colorful cars that hang level as it turns, lights along the rim and spokes, a boarding deck with steps and a ticket booth with a lit marquee. Space starts or stops it and the arrow keys set its speed. Click a car to send it round to the boarding platform, where riders step on or off, and click it there to send it to the top. B brings the next car down to the platform, and L cycles the lights: twinkle, chase, starburst and rainbow. As a progress indicator the wheel turns as far round as the progress, its rim lights filling in behind car 1, and on completion car 1 comes back to the platform and every light flashes.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'start / stop' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'speed' },
    { keys: ['l'], caps: ['L'], label: 'lights' },
    { keys: ['b'], caps: ['B'], label: 'next car · click a car to send it round' },
  ],
  initial: { readout: 'TOP · CAR 07 · 2.0 RPM', state: 'RUNNING · TWINKLE LIGHTS', pressed: {} },
  viewBox: '-78.15 -172.48 156.3 220.98',
  progress: true,
} as const satisfies MiniatureMeta
