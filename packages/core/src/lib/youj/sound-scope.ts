'use client'

import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { createStorageStore } from './store'

/* YoujProvider's sound options, resolved against the providers above it. The
 * provider holds the mute and the volume, and hands the cues to the pack's
 * runtime; the audio itself (the player, each pack's files) lives in
 * @youj/sound and is fetched by `runtime.arm()`, only while sound is on and
 * unmuted. Without a `sound` prop there is no runtime, so no cue goes
 * anywhere and no sound code is ever requested. */

/** The moments a component can sound, in the order a sound pack lists them. */
export const soundCues = ['tap', 'select', 'toggleOn', 'toggleOff', 'success', 'error', 'notify', 'open', 'close', 'tick'] as const

/**
 * A moment worth a sound: `tap` (a press), `select` (a choice among options),
 * `toggleOn` / `toggleOff`, `success` / `error` (an outcome), `notify` (an
 * arrival, such as a toast), `open` / `close` (a surface), `tick` (a detent,
 * a step of a continuous control).
 */
export type SoundCue = (typeof soundCues)[number]

/** Where cues go: called with the cue and whether motion is reduced where it happened. */
export type SoundCueSink = (cue: SoundCue, reduced: boolean) => void

/** The nearest provider's sink, or null (the default): nothing listens, so cues are dropped. */
export const SoundCueContext = createContext<SoundCueSink | null>(null)

/** The volume sound plays at unless a provider sets one. */
export const DEFAULT_SOUND_VOLUME = 0.5

/**
 * What YoujProvider's `sound` takes: a pack from `@youj/sound` (`beacon`,
 * `halo`, `rill`, `glyph`, `zephyr`, `glass`, or your own `definePack`). It
 * hands the provider two things and keeps its audio to itself, so the
 * provider carries no sound code.
 */
export interface SoundRuntime {
  /** A stable name, such as `'beacon'`. */
  name: string
  /** Fetches the player and the pack's audio and waits for the gesture that unlocks audio. Returns the cleanup. Called only while sound is on and unmuted. */
  arm: () => () => void
  /** Plays a cue at a volume, 0–1. True when it played. Called only while sound is on, unmuted and, under reduced motion, allowed. */
  play: (cue: SoundCue, volume: number) => boolean
}

export interface SoundState {
  /** The pack, or null: no `sound` here, or `sound={false}`. */
  runtime: SoundRuntime | null
  volume: number
  muted: boolean
  setMuted: (muted: boolean) => void
  whenReduced: boolean
}

/** The nearest provider's sound settings, or null while no provider has set any. */
export const SoundStateContext = createContext<SoundState | null>(null)

/** What YoujProvider's `sound` takes as an object: the pack and how it plays. Every field is optional; what you leave out comes from the enclosing provider. */
export interface SoundSettings {
  /** The pack from `@youj/sound` (`beacon`, `halo`, …, or your own `definePack`). `false` silences this subtree (a preview, an embedded editor). */
  pack?: SoundRuntime | false
  /** Loudness, 0–1, on a perceptual curve. Default: the enclosing provider's, 0.5 at the root. */
  volume?: number
  /**
   * The user's mute, controlled: keep it in your state (and storage, if it
   * should last), and update it from `onMutedChange`. Leave it out and the
   * provider keeps it, starting at `defaultMuted` and remembering the user's
   * choice in localStorage; a nested provider shares its parent's.
   * `useSound().setMuted` changes it from anywhere.
   */
  muted?: boolean
  /** Start muted until the user turns sound on (uncontrolled; their choice is remembered after that). Default false: a pack plays. */
  defaultMuted?: boolean
  /** Called when `useSound().setMuted` changes the mute. */
  onMutedChange?: (muted: boolean) => void
  /** Keep playing under reduced motion. Default: the enclosing provider's, false at the root: sounds belong to their motion, so they go quiet with it. */
  whenReduced?: boolean
}

/** YoujProvider's `sound`: a pack on its own (the usual case), `false`, or a `SoundSettings` object. */
export type SoundProp = SoundRuntime | false | SoundSettings

export interface SoundOptions {
  sound?: SoundRuntime | false
  soundVolume?: number
  soundMuted?: boolean
  soundDefaultMuted?: boolean
  onSoundMutedChange?: (muted: boolean) => void
  soundWhenReduced?: boolean
}

const isRuntime = (sound: SoundRuntime | SoundSettings): sound is SoundRuntime => typeof (sound as SoundRuntime).arm === 'function'

/** YoujProvider's `sound` prop as the flat options useSoundScope takes. */
export function soundOptions(sound: SoundProp | undefined): SoundOptions {
  const settings: SoundSettings = sound === undefined ? {} : sound === false || isRuntime(sound) ? { pack: sound } : sound
  return {
    sound: settings.pack,
    soundVolume: settings.volume,
    soundMuted: settings.muted,
    soundDefaultMuted: settings.defaultMuted,
    onSoundMutedChange: settings.onMutedChange,
    soundWhenReduced: settings.whenReduced,
  }
}

/** Plays a cue under a provider's settings: nothing while off or muted, nor under reduced motion unless it plays anyway. True when it played. */
export function playCue(state: SoundState, cue: SoundCue, reduced: boolean): boolean {
  if (!state.runtime || state.muted || state.volume <= 0 || (reduced && !state.whenReduced)) return false
  return state.runtime.play(cue, state.volume)
}

/**
 * Resolves a provider's sound options against the parent's: the settings it
 * leaves out come from above. Returns the state, and the cue sink components
 * emit to (stable for the provider's life, reading the latest settings, so a
 * volume slider doesn't re-render every component; null while there is no
 * runtime). A provider that sets no sound option passes its parent's through.
 */
/* The provider's own mute, remembered across visits. The server and the
 * hydrating render use the default, so their markup agrees; the stored choice
 * applies straight after. */
const storedMute = createStorageStore('youj-sound-muted')
const readStoredMute = (fallback: boolean) => {
  const value = storedMute.read()
  return value === null ? fallback : value === 'true'
}

export function useSoundScope(
  { sound, soundVolume, soundMuted, soundDefaultMuted = false, onSoundMutedChange, soundWhenReduced }: SoundOptions,
  parent: SoundState | null,
  parentSink: SoundCueSink | null,
): { state: SoundState | null; sink: SoundCueSink | null } {
  const owns = sound !== undefined || soundVolume !== undefined || soundMuted !== undefined || soundDefaultMuted || onSoundMutedChange !== undefined || soundWhenReduced !== undefined
  const ownMuted = useSyncExternalStore(
    storedMute.subscribe,
    () => readStoredMute(soundDefaultMuted),
    () => soundDefaultMuted,
  )
  const setOwnMuted = useCallback((next: boolean) => storedMute.write(String(next)), [])
  const controlled = soundMuted !== undefined
  const report = useRef(onSoundMutedChange)
  useLayoutEffect(() => {
    report.current = onSoundMutedChange
  })
  const parentSetMuted = parent?.setMuted
  const setMuted = useCallback(
    (next: boolean) => {
      if (!controlled) (parentSetMuted ?? setOwnMuted)(next)
      report.current?.(next)
    },
    [controlled, parentSetMuted, setOwnMuted],
  )
  const state = useMemo<SoundState | null>(
    () =>
      owns
        ? {
            runtime: sound === false ? null : (sound ?? parent?.runtime ?? null),
            volume: Math.min(Math.max(soundVolume ?? parent?.volume ?? DEFAULT_SOUND_VOLUME, 0), 1),
            muted: soundMuted ?? parent?.muted ?? ownMuted,
            setMuted,
            whenReduced: soundWhenReduced ?? parent?.whenReduced ?? false,
          }
        : parent,
    [owns, sound, soundVolume, soundMuted, soundWhenReduced, parent, ownMuted, setMuted],
  )

  const latest = useRef(state)
  useLayoutEffect(() => {
    latest.current = state
  })
  const sink = useCallback<SoundCueSink>((cue, reduced) => {
    if (latest.current) playCue(latest.current, cue, reduced)
  }, [])

  // Fetch the player and decode the pack as soon as sound is on (and only then).
  const runtime = state?.runtime ?? null
  const active = owns && runtime !== null && !state!.muted && state!.volume > 0
  useEffect(() => (active && runtime ? runtime.arm() : undefined), [active, runtime])

  if (!owns) return { state, sink: parentSink }
  return { state, sink: runtime ? sink : null }
}
