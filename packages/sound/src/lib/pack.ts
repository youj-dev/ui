import type { SoundCue, SoundRuntime } from '@youj/core'
import { armLazily, playLazily } from './lazy'

/**
 * One cue's audio: an encoded file (MP3, WAV, Ogg, AAC, anything the browser
 * decodes) as bytes, or the URL to fetch it from.
 */
export type SoundFile = ArrayBuffer | Uint8Array | string | URL

/** Each cue's file. A cue left out plays the pack's `base`, or stays silent without one. */
export type SoundSources = Partial<Record<SoundCue, SoundFile>>

/**
 * A set of sounds for the cues, which is what YoujProvider's `sound` takes:
 * `arm` and `play` (from `@youj/motion`'s SoundRuntime) reach the player,
 * which is fetched only when sound is on. `load` is called once, the first
 * time sound turns on with this pack.
 */
export interface SoundPack extends SoundRuntime {
  /** A stable name, such as `'beacon'`. Warnings name the pack by it. */
  name: string
  load: () => Promise<SoundSources>
  /** Plays every cue this pack leaves out, and any whose file won't load or decode. Loaded only when one does. */
  base?: SoundPack
}

/** A pack from its sounds' loader (and base): adds what YoujProvider calls, `arm` and `play`, which go through the lazily loaded player. */
export function pack(spec: Omit<SoundPack, 'arm' | 'play'>): SoundPack {
  const own: SoundPack = {
    ...spec,
    arm: () => armLazily(own),
    play: (cue, volume) => playLazily(cue, own, volume),
  }
  return own
}

const bytes = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))

/** A pack whose audio sits in a module of its own as base64, imported when sound first turns on. */
export function embedded(name: string, load: () => Promise<{ sounds: Record<string, string> }>): SoundPack {
  return pack({
    name,
    load: () => load().then(({ sounds }) => Object.fromEntries(Object.entries(sounds).map(([cue, data]) => [cue, bytes(data)]))),
  })
}

/** A built-in candidate: a loader for its module's base64 MP3, decoded to bytes when a pack first plays it. */
export const candidate =
  (load: () => Promise<{ sound: string }>) =>
  (): Promise<Uint8Array> =>
    load().then(({ sound }) => bytes(sound))
