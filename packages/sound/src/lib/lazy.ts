import type { SoundCue } from '@youj/core'
import type { SoundPack } from './pack'

/* The only part of the engine in an app's first load: a handle on the player,
 * which is fetched the first time a provider turns sound on. With sound off
 * or muted, nothing here runs and the player is never downloaded. */

type Player = typeof import('./player')

let player: Player | undefined
let loading: Promise<Player> | undefined

/** Fetches the player once. A failed fetch (offline, a deploy in between) is retried by the next caller. */
export function loadPlayer(): Promise<Player> {
  return (loading ??= import('./player').then(
    (mod) => (player = mod),
    (error: unknown) => {
      loading = undefined
      throw error
    },
  ))
}

/** Plays through the player once it's here, and says whether it played. Until then the cue is dropped, since a late sound would miss its motion. */
export function playLazily(cue: SoundCue, pack: SoundPack, volume: number): boolean {
  if (player) return player.play(cue, pack, volume)
  loadPlayer().catch(() => {})
  return false
}

/** Fetches the player and the pack, and listens for the gesture that unlocks audio. Returns the cleanup. */
export function armLazily(pack: SoundPack): () => void {
  let live = true
  let disarm: (() => void) | undefined
  loadPlayer().then(
    (mod) => {
      if (live) disarm = mod.arm(pack)
    },
    () => {},
  )
  return () => {
    live = false
    disarm?.()
  }
}
