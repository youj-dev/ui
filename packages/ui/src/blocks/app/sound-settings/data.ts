import type { SoundCue } from '@youj/core'

/** The packs on offer, by id. Your app maps each id to a pack for YoujProvider's `sound`: `glass`, or one made with `definePack`. */
export type SoundPackId = 'glass' | 'wood' | 'felt' | 'digital'

/** The moments a person can switch on or off. Each covers one or more cues. */
export type SoundEvent = 'tap' | 'toggle' | 'success' | 'error' | 'notify'

export interface SoundSettingsValue {
  /** Interface sounds on. Off is the user's mute: nothing plays. */
  enabled: boolean
  pack: SoundPackId
  /** Loudness, 0–1, as the `volume` of YoujProvider's `sound` takes it. */
  volume: number
  /** Which moments make a sound. */
  events: Record<SoundEvent, boolean>
  /** Keep sounds when the system asks for reduced motion (the `whenReduced` of YoujProvider's `sound`). */
  playWhenReduced: boolean
}

export const DEFAULT_SOUND_SETTINGS: SoundSettingsValue = {
  enabled: true,
  pack: 'glass',
  volume: 0.5,
  events: { tap: true, toggle: true, success: true, error: true, notify: true },
  playWhenReduced: false,
}

export interface PackInfo {
  id: SoundPackId
  name: string
  detail: string
  /** A few loudness samples for the pack's little signature: how its sounds strike and fade. */
  signature: readonly number[]
}

export const PACKS: readonly PackInfo[] = [
  { id: 'glass', name: 'Glass', detail: 'Bright and short, rung on glass', signature: [0.2, 0.95, 0.7, 0.5, 0.36, 0.26, 0.18, 0.12, 0.08, 0.05] },
  { id: 'wood', name: 'Soft wood', detail: 'Warm knocks on a wood block', signature: [0.35, 0.85, 0.45, 0.22, 0.1, 0.05, 0.03, 0.02, 0.02, 0.01] },
  { id: 'felt', name: 'Muted felt', detail: 'Low and close, for quiet rooms', signature: [0.12, 0.3, 0.46, 0.5, 0.44, 0.36, 0.28, 0.2, 0.13, 0.08] },
  { id: 'digital', name: 'Digital', detail: 'Clean blips with a crisp edge', signature: [0.8, 0.8, 0.78, 0.2, 0.75, 0.74, 0.72, 0.15, 0.05, 0.02] },
]

export interface EventInfo {
  id: SoundEvent
  name: string
  detail: string
  /** What the preview plays. */
  preview: SoundCue
  /** Every cue this switch silences. */
  cues: readonly SoundCue[]
}

export const EVENTS: readonly EventInfo[] = [
  { id: 'tap', name: 'Taps', detail: 'Pressing a button or picking an option', preview: 'tap', cues: ['tap', 'select'] },
  { id: 'toggle', name: 'Switches', detail: 'Turning a setting on or off', preview: 'toggleOn', cues: ['toggleOn', 'toggleOff'] },
  { id: 'success', name: 'Success', detail: 'Something you started finished well', preview: 'success', cues: ['success'] },
  { id: 'error', name: 'Errors', detail: 'Something needs your attention', preview: 'error', cues: ['error'] },
  { id: 'notify', name: 'Notifications', detail: 'A message or an update arrives', preview: 'notify', cues: ['notify'] },
]

/** Every string on the page, including the packs' and events' names and details. */
export const DEFAULT_COPY = {
  title: 'Sound',
  description: 'Short sounds that confirm what you just did. They only ever play in response to you, never on their own.',
  reset: 'Reset',
  interfaceSounds: 'Interface sounds',
  offDescription: 'Sounds are off. Nothing in the app will make a sound.',
  onDescription: 'On for everything you do in the app.',
  volume: 'Volume',
  /** How the volume reads, as a whole percentage. */
  volumeValue: (percent: number) => `${percent}%`,
  keepReduced: 'Keep sounds with reduced motion',
  keepReducedDetail: 'Sounds belong to their motion, so they go quiet with it unless you keep them.',
  quietTitle: 'Quiet while motion is reduced',
  quietBody: 'Your device asks for reduced motion, so sounds are paused too. Keep them with the switch above.',
  packTitle: 'Sound pack',
  packDescription: 'One family of sounds for the whole app.',
  eventsTitle: 'Play a sound for',
  eventsDescription: 'Choose the moments that make a sound. Press Play to hear one, or scrub the strip to hear them in turn.',
  soundCheck: 'Sound check',
  play: 'Play',
  playEvent: (name: string) => `Play the ${name.toLowerCase()} sound`,
  silent: 'Previews are silent here: no sound is set up above this page.',
  /** Each pack's name and detail, by id. */
  packs: Object.fromEntries(PACKS.map((p) => [p.id, { name: p.name, detail: p.detail }])) as Record<SoundPackId, { name: string; detail: string }>,
  /** Each moment's name and detail, by id. */
  events: Object.fromEntries(EVENTS.map((e) => [e.id, { name: e.name, detail: e.detail }])) as Record<SoundEvent, { name: string; detail: string }>,
}

export type SoundSettingsCopy = typeof DEFAULT_COPY

/** The sound check: every event in turn, two seconds apart, as one strip to scrub along. */
export const CHECK_SPACING = 2
export const CHECK_DURATION = EVENTS.length * CHECK_SPACING

/** Loudness samples for the strip: each event's shape (a click, two taps, a bloom, two knocks, a bell), then quiet. */
const SHAPES: Record<SoundEvent, readonly number[]> = {
  tap: [0.9, 0.42, 0.16, 0.06],
  toggle: [0.7, 0.28, 0.08, 0.64, 0.24, 0.07],
  success: [0.3, 0.62, 0.8, 0.92, 0.78, 0.6, 0.44, 0.3, 0.2, 0.12, 0.07],
  error: [0.86, 0.5, 0.2, 0.06, 0.74, 0.44, 0.16, 0.05],
  notify: [0.95, 0.8, 0.66, 0.54, 0.44, 0.36, 0.29, 0.23, 0.18, 0.13, 0.09, 0.06],
}
const SLOT = 24

export const CHECK_PEAKS: readonly number[] = EVENTS.flatMap(({ id }) => {
  const shape = SHAPES[id]
  return Array.from({ length: SLOT }, (_, i) => (i < shape.length ? shape[i]! : 0.02 + ((i * 7) % 5) * 0.004))
})
