import type { MiniatureMeta } from '../engine/types'

/** MOTRIK SQ–16, drum machine: what a showroom shows before it mounts. */
export const drumMachine = {
  id: 'drum-machine',
  name: 'Drum machine',
  model: 'MOTRIK SQ–16',
  maker: 'MOTRIK / RHYTHM DEVICES',
  study: '076',
  spec: 'SQ–16 / 8 VOICES · 16 STEPS · SWING · 2 × 3" MONITORS',
  label: 'Drum machine, MOTRIK SQ–16',
  description: 'A long two-tier step sequencer between walnut cheeks with sixteen color-grouped step buttons and LEDs, eight instrument channels with level and tune knobs, a tempo knob with a red LED display, a swing knob, a pattern screen and a pair of small studio monitors behind it. Press play and a light runs along the sixteen steps while the monitors thump. Pick one of eight instruments, toggle its steps, change the tempo and the swing, or clear a track.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'play', toggle: true },
    { keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k'], caps: ['Q–I', 'A–K'], label: 'steps' },
    { keys: ['1', '2', '3', '4', '5', '6', '7', '8'], caps: ['1–8'], label: 'instrument' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'tempo' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'swing' },
    { keys: ['Backspace'], caps: ['⌫'], label: 'clear' },
  ],
  initial: {
    readout: '■ 122 BPM · SWING 54%',
    state: 'BD · KICK · 5 STEPS · PATTERN A01',
    pressed: { ' ': false },
  },
  viewBox: '-116.85125168440814 -108.5 373.99861878189535 287.5',
  progress: false,
} as const satisfies MiniatureMeta
