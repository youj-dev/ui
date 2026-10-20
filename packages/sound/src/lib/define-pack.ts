import { soundCues, type SoundCue } from '@youj/core'
import { beacon } from '../packs'
import { pack, type SoundFile, type SoundPack, type SoundSources } from './pack'
import { DEV, reason, warn } from './warn'

/**
 * A sound for definePack: a file (a URL, or its bytes), a built-in candidate
 * (`candidates.tap.wood`), or a function that loads a file when sound first
 * turns on, such as a dynamic import of an audio file your bundler serves as
 * a URL (a module's `default` is used).
 */
export type SoundSource = SoundFile | (() => Promise<SoundFile | { default: SoundFile }>)

export interface PackDefinition {
  /** Names the pack in warnings. Default 'custom'. */
  name?: string
  /** The pack that plays every cue `sounds` leaves out, and any whose file won't load or decode. Default: `beacon`, the default pack. */
  base?: SoundPack
  /** Each cue's sound. The cues you leave out play the base pack's. */
  sounds: Partial<Record<SoundCue, SoundSource>>
}

const isFile = (value: unknown): value is SoundFile =>
  typeof value === 'string' || value instanceof URL || value instanceof ArrayBuffer || value instanceof Uint8Array

const describe = (value: unknown) => (value === null ? 'null' : Array.isArray(value) ? 'an array' : typeof value === 'object' ? 'an object' : `a ${typeof value}`)

/**
 * A pack of your own: the sounds you name, over a base pack that plays the
 * rest. Nothing loads until sound turns on. Then each source is fetched (or
 * called) once and decoded, and one that fails leaves its cue to the base,
 * with a warning in development. Define it at module scope, so it's one pack
 * for the page's life.
 */
export function definePack({ name = 'custom', base = beacon, sounds }: PackDefinition): SoundPack {
  const instead = (cue: string) => `${base.name}'s ${cue} plays instead`
  const own: [SoundCue, SoundSource][] = []
  for (const [cue, source] of Object.entries(sounds)) {
    if (!soundCues.includes(cue as SoundCue)) {
      if (DEV) warn(`${name}: "${cue}" isn't a cue, so it never plays. The cues are ${soundCues.join(', ')}.`)
    } else if (!isFile(source) && typeof source !== 'function') {
      if (DEV) warn(`${name}: ${cue} is ${describe(source)}, not a URL, bytes or a function that loads one, so ${instead(cue)}.`)
    } else own.push([cue as SoundCue, source])
  }

  return pack({
    name,
    base,
    async load() {
      const loaded = await Promise.all(
        own.map(async ([cue, source]) => {
          try {
            const value = typeof source === 'function' ? await source() : source
            const file = isFile(value) ? value : (value as { default?: unknown } | null)?.default
            if (isFile(file)) return [cue, file] as const
            if (DEV) warn(`${name}: ${cue}'s loader gave ${describe(file ?? value)}, not a URL or bytes, so ${instead(cue)}.`)
          } catch (error) {
            if (DEV) warn(`${name}: ${cue} didn't load (${reason(error)}), so ${instead(cue)}.`)
          }
          return undefined
        }),
      )
      return Object.fromEntries(loaded.filter((entry) => entry !== undefined)) as SoundSources
    },
  })
}
