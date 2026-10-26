import type { MiniatureMeta } from '../engine/types'

/** CALDERN M–66, modular synth: what a showroom shows before it mounts. */
export const modularSynth = {
  id: 'modular-synth',
  name: 'Modular synth',
  model: 'CALDERN M–66',
  maker: 'CALDERN / VOLTAGE WORKS',
  study: '055',
  spec: 'M–66 / 66 HP · STEP SEQUENCER · VCO · VCF · ENVELOPE · VCA',
  label: 'Modular synth, CALDERN M–66',
  description:
    'A desktop Eurorack case between walnut cheeks: a step sequencer, an oscillator, a lowpass filter, an envelope and an output module on aluminum panels, with knobs, jacks and LEDs, and colored patch cables sagging between the jacks. The cables are the patch: a note’s pulse runs from the sequencer down each cable to the module it feeds, lighting its LED on the way to the output. Space starts or stops the sequencer, the number keys switch steps on and off, the left and right arrows pick a knob and the up and down arrows turn it. Drag from one jack to another to patch a cable, drag a plugged one away to pull it, P steps through the preset patches and Backspace pulls every cable.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'run / stop' },
    { keys: ['1', '2', '3', '4', '5', '6', '7', '8'], caps: ['1–8'], label: 'steps' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'pick a knob' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'turn it' },
    { keys: ['p'], caps: ['P'], label: 'patches' },
    { keys: ['Backspace'], caps: ['⌫'], label: 'pull the cables · drag jack to jack to patch' },
  ],
  initial: {
    readout: '120 BPM · STEP 1/8 · PATCH BASS',
    state: 'RUNNING · VCO → VCF → OUT',
    pressed: {},
  },
  viewBox: '-116.26131704435062 -136.6 372.2125317191312 372.95',
  progress: false,
} as const satisfies MiniatureMeta
