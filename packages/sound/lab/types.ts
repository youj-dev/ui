import type { SoundCue } from '@youj/core'

/** One candidate sound, as the render measured it. */
export interface LabSound {
  /** `<cue>.<family>`: `candidates.<cue>.<family>` in the package. */
  id: string
  family: string
  /** The family's display name: "Glass", "Soft wood"… */
  name: string
  /** How it's made, in a sentence or two. */
  recipe: string
  /** Until it stays 40 dB under its peak. */
  ms: number
  /** Loudness over its loudest 100 ms, LUFS (every candidate of a cue is matched). */
  lufs: number
  /** After encoding, dBTP. */
  truePeak: number
  /** Spectral centroid, Hz: where its energy sits. */
  centroid: number
  /** % of its energy in 2–5 kHz, the ear's most sensitive band. */
  harsh: number
  /** Size of its MP3. */
  bytes: number
  /** 48 peaks over the cue's window, 0–100. */
  wave: number[]
  /** 28 log-spaced bands, 100 Hz–16 kHz: dB above a floor 60 dB under the loudest band. */
  spectrum: number[]
}

export interface LabCue {
  cue: SoundCue
  /** The candidate the default pack (Beacon) plays. */
  defaultId: string
  /** The cue's loudness, LUFS over its loudest 100 ms: every candidate is levelled to it, and so is a file the builder is given. */
  level: number
  /** The span, ms, every waveform of the cue covers: one scale for all its candidates. */
  window: number
  variants: LabSound[]
}

/** A built-in pack: its export's name and the candidate it plays for each cue. */
export interface LabPack {
  name: string
  picks: Record<SoundCue, string>
}
