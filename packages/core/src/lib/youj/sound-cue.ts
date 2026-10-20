import { useContext, useMemo } from 'react'
import { useYouj } from './provider'
import { DEFAULT_SOUND_VOLUME, SoundCueContext, SoundStateContext, playCue, type SoundCue } from './sound-scope'

/* The cue hooks. Components say which moment just happened (a press, a
 * toggle, an outcome) as their motion starts; what plays, if anything, is the
 * provider's `sound` pack (@youj/sound). Without one there's no sink, every
 * cue is dropped, and a component carries this file and nothing more. */

/**
 * Emits sound cues from a component: call the result where the motion starts
 * (a press on pointer down, a toggle as it flips, an outcome as it lands). A
 * no-op unless a YoujProvider above has `sound`.
 */
export function useSoundCue(): (cue: SoundCue) => void {
  const sink = useContext(SoundCueContext)
  const { reduced } = useYouj()
  return (cue) => sink?.(cue, reduced)
}

export interface Sound {
  /** Whether a YoujProvider above has sound on (`sound` set, not `false`). */
  enabled: boolean
  /** The user's mute. */
  muted: boolean
  /** Mutes or unmutes for the user. The provider reports it through `sound.onMutedChange`; keeping it is the app's job. Does nothing while no provider has sound. */
  setMuted: (muted: boolean) => void
  /** The provider's volume, 0–1. */
  volume: number
  /**
   * Plays a cue from your own component, as its motion starts. Silent without
   * `sound`, when muted, under reduced motion (unless the provider sets
   * `sound.whenReduced`), while the tab is hidden, before the user's first
   * gesture, and when the same cue has only just played. Returns whether it
   * played: false too while the pack is still loading.
   */
  play: (cue: SoundCue) => boolean
}

const noop = () => {}
const never = () => false

/** The nearest provider's sound: whether it's on, the user's mute, the volume, and play(). */
export function useSound(): Sound {
  const state = useContext(SoundStateContext)
  const { reduced } = useYouj()
  return useMemo(
    () => ({
      enabled: state?.runtime != null,
      muted: state?.muted ?? false,
      setMuted: state?.setMuted ?? noop,
      volume: state?.volume ?? DEFAULT_SOUND_VOLUME,
      play: state ? (cue: SoundCue) => playCue(state, cue, reduced) : never,
    }),
    [state, reduced],
  )
}
