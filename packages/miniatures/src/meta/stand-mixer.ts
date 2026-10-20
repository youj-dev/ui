import type { MiniatureMeta } from '../engine/types'

/** TAVREN M–04, stand mixer: what a showroom shows before it mounts. */
export const standMixer = {
  id: 'stand-mixer',
  name: 'Stand mixer',
  model: 'TAVREN M–04',
  maker: 'TAVREN / MOTION KITCHEN',
  study: '024',
  spec: 'M–04 / 4.8 L · PLANETARY DRIVE · BOWL LIGHT',
  label: 'Stand mixer, TAVREN M–04',
  description: 'Lift the hinged head, change between whisk, paddle and dough hook, and move the speed lever to swirl the batter in a rounded steel bowl. The lock ring glows green when the head is latched and amber when released, a five-step LED ladder shows the speed and a bowl light shines into the batter.',
  keys: [
    { keys: ['t'], caps: ['T'], label: 'tilt' },
    { keys: ['a'], caps: ['A'], label: 'attachment' },
    { keys: ['1', '2', '3', '4', '5'], caps: ['1–5'], label: 'speed' },
    { keys: ['0'], caps: ['0'], label: 'stop' },
    { keys: ['l'], caps: ['L'], label: 'bowl light · click latch to release' },
  ],
  initial: { readout: 'WHISK · 000 RPM', state: 'HEAD LOCKED · STOPPED', pressed: {  } },
  viewBox: '-195.597385602301 -217.19462300501675 346.1614502078112 425.19462300501675',
  progress: false,
} as const satisfies MiniatureMeta
