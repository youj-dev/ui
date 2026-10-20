import type { MiniatureMeta } from '../engine/types'

/** HARROWAY MK·50, valve amplifier: what a showroom shows before it mounts. */
export const guitarAmp = {
  id: 'guitar-amp',
  name: 'Valve amplifier',
  model: 'HARROWAY MK·50',
  maker: 'HARROWAY / AMPLIFICATION',
  study: '074',
  spec: 'MK·50 / 50 W · 4 × EL34 · 3 × ECC83 · 2 × 12" CABINET',
  label: 'Valve amplifier, HARROWAY MK·50',
  description: 'Black tolex, cream piping, a brushed-gold control panel with six knobs, a red jewel lamp and two bat toggles, valves glowing behind a rear side vent, a two-button footswitch and a guitar cable plugged into the high input. Switch on, let the valves warm and lift standby; then strum a chord through the amp. Gain and tone change the sound, the footswitch swaps clean and lead channels and adds reverb, and the speaker cones pulse with the level.',
  keys: [
    { keys: ['p'], caps: ['P'], label: 'power', toggle: true },
    { keys: ['s'], caps: ['S'], label: 'standby', toggle: true },
    { keys: [' '], caps: ['Space'], label: 'strum' },
    { keys: ['g'], caps: ['G'], label: 'gain' },
    { keys: ['t'], caps: ['T'], label: 'tone' },
    { keys: ['f'], caps: ['F'], label: 'channel' },
    { keys: ['v'], caps: ['V'], label: 'reverb', toggle: true },
    { keys: ['shift+g', 'shift+t'], caps: ['⇧ G', '⇧ T'], label: 'turns down' },
  ],
  initial: {
    readout: 'LEAD · GAIN 6.5 · TONE 6.0',
    state: 'LIVE · SPACE TO STRUM',
    pressed: { p: true, s: true, v: false },
  },
  viewBox: '-151.4922678357857 -145 304.71658647914023 276',
  progress: false,
} as const satisfies MiniatureMeta
