import type { MiniatureMeta } from '../engine/types'

/** ODALIN E–7, theremin: what a showroom shows before it mounts. */
export const theremin = {
  id: 'theremin',
  name: 'Theremin',
  model: 'ODALIN E–7',
  maker: 'ODALIN / AIR INSTRUMENTS',
  study: '085',
  spec: 'E–7 / HETERODYNE · PITCH ROD · VOLUME LOOP · C3–C6',
  label: 'Theremin, ODALIN E–7',
  description: 'A walnut theremin on tapered legs: a chrome pitch rod on a ceramic insulator, a volume loop at its side, a speaker behind a cloth grille with brass bars, a small round scope, a vibrato knob and an air button. Your pointer is the hand: its distance from the rod sets the pitch and its height above the loop the volume. Soft rings gather around the rod and rise from the loop as you play, and the scope draws the wave. The arrow keys nudge the pitch by a semitone and the volume by a step, Space holds a note, V changes the vibrato and M plays a short original air by itself.',
  keys: [
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'pitch' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'volume' },
    { keys: [' '], caps: ['Space'], label: 'hold a note' },
    { keys: ['v'], caps: ['V'], label: 'vibrato' },
    { keys: ['m'], caps: ['M'], label: 'play the air' },
  ],
  initial: { readout: 'A4 · 440 HZ · VOL 60', state: 'READY · HOVER OR HOLD SPACE', pressed: {} },
  viewBox: '-58.49742261192856 -171 220.83129113761132 275',
  progress: false,
} as const satisfies MiniatureMeta
