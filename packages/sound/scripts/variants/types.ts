import type { Signal } from '../dsp.ts'

/** The cues, in the order motion's `soundCues` lists them (a test holds the two equal). */
export const CUES = ['tap', 'select', 'toggleOn', 'toggleOff', 'success', 'error', 'notify', 'open', 'close', 'tick'] as const
export type Cue = (typeof CUES)[number]

/** The material a variant is made of. A pack reads as one object when its cues share one. */
export type Family = 'glass' | 'wood' | 'digital' | 'felt' | 'classic' | 'air' | 'pluck' | 'zephyr' | 'rill' | 'glyph' | 'beacon' | 'halo'

export const FAMILY_NAMES: Record<Family, string> = {
  glass: 'Glass',
  wood: 'Soft wood',
  digital: 'Digital',
  felt: 'Muted felt',
  classic: 'Classic',
  air: 'Air',
  pluck: 'Pluck',
  zephyr: 'Zephyr',
  rill: 'Rill',
  glyph: 'Glyph',
  beacon: 'Beacon',
  halo: 'Halo',
}

export interface Variant {
  /** `<cue>.<family>`, the id a pack names. */
  id: string
  cue: Cue
  family: Family
  /** The recipe in a sentence or two: what it is and how it's made. */
  recipe: string
  render: () => Signal
}

/**
 * How loud each cue is, in LUFS over its loudest 100 ms (K-weighted), at full
 * volume. Frequent, small moments sit lowest (a tick, a choice); outcomes
 * sit highest. Every variant of a cue is normalised to the same level, so
 * the Lab compares character, not loudness. The provider's volume scales
 * them all (0.5, the default, is 12 dB down).
 */
export const LEVEL: Record<Cue, number> = {
  tick: -27,
  select: -24.5,
  tap: -23,
  toggleOn: -22,
  toggleOff: -23.5,
  open: -24,
  close: -25.5,
  notify: -21,
  success: -19.5,
  error: -20,
}

export const variant = (cue: Cue, family: Family, recipe: string, render: () => Signal): Variant => ({ id: `${cue}.${family}`, cue, family, recipe, render })
