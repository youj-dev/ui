import type { MiniatureMeta } from '../engine/types'

/** VERMIL ST–73, stage keyboard: what a showroom shows before it mounts. */
export const stageSynth = {
  id: 'stage-synth',
  name: 'Stage keyboard',
  model: 'VERMIL ST–73',
  maker: 'VERMIL / INSTRUMENTS',
  study: '073',
  spec: 'ST–73 / 73 KEYS · ORGAN · PIANO · SYNTH · 32 VOICES',
  label: 'Stage keyboard, VERMIL ST–73',
  description: 'A graphite chassis between walnut end cheeks with a fine vermilion pinstripe, 73 ivory and ebony keys under a light guide, a rubber mod wheel and a walnut pitch stick, and a brushed panel with organ LED drawbars, piano type buttons, synth knobs with LED rings and a small OLED. Play it from the computer keyboard. Switch between the organ, piano and synth sections, pull new drawbar registrations, sweep the filter and roll the mod wheel for vibrato. Keys dip, and the light guide above them marks the playable range and lights each note in the color of the active section.',
  keys: [
    { keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''], caps: ["A–'"], label: 'play' },
    { keys: ['w', 'e', 't', 'y', 'u', 'o', 'p'], caps: ['W', 'E', 'T', 'Y', 'U', 'O', 'P'], label: 'sharps' },
    { keys: ['z', 'x'], caps: ['Z', 'X'], label: 'octave' },
    { keys: ['1', '2', '3'], caps: ['1', '2', '3'], label: 'organ · piano · synth' },
    { keys: ['r'], caps: ['R'], label: 'drawbars' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'filter' },
    { keys: ['m'], caps: ['M'], label: 'mod wheel', toggle: true },
  ],
  initial: { readout: 'PIANO · GRAND', state: 'PLAY A–\' · OCT 0 · CUT 70%', pressed: { m: false } },
  viewBox: '-60.12658773652741 -33 270.5085830296549 188.25',
  progress: false,
} as const satisfies MiniatureMeta
