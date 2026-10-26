import type { MiniatureMeta } from '../engine/types'

/** TOVANE K–8, popcorn machine: what a showroom shows before it mounts. */
export const popcornMachine = {
  id: 'popcorn-machine',
  name: 'Popcorn machine',
  model: 'TOVANE K–8',
  maker: 'TOVANE / CONCESSION WORKS',
  study: '080',
  spec: 'K–8 / 8 OZ KETTLE · HEAT LAMP · TEMPERED GLASS',
  label: 'Popcorn machine, TOVANE K–8',
  description:
    'A cinema popcorn machine on the counter: a red cabinet of glass with a steel kettle hanging from the roof, a heat lamp, a door at the front and a scoop inside, a kernel jar and a butter pump on top, and a striped box beside it. It heats and pops on its own: the first kernels pop slowly, then in a crackling rush that lifts the lids and tumbles popcorn onto the heap, and the empty kettle tips forward to dump the rest. Left running, the cabinet fills until it overflows and the door bursts open onto the counter. Space switches the kettle’s heat off and on, N drops a new batch, B drizzles butter, and S or a click on the door scoops a box. As a progress indicator the heap fills with the progress, and done pops it to the brim and over.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'heat on / off' },
    { keys: ['n'], caps: ['N'], label: 'new batch' },
    { keys: ['b'], caps: ['B'], label: 'butter' },
    { keys: ['s'], caps: ['S'], label: 'scoop · or click the door' },
  ],
  initial: { readout: 'KETTLE 22°C · 0 POPS · 55% FULL', state: 'READY · SPACE HEATS THE KETTLE', pressed: {} },
  viewBox: '-54.60030829489859 -96.8 117.94747316802001 158.6',
  progress: true,
} as const satisfies MiniatureMeta
