/* Fixtures and helpers for the arranger: a demo song sketch in four tracks,
 * each track's source as loudness samples (one a tenth of a second, drawn from
 * the part's rhythm rather than decoded), and the clips laid out on them. */

import type { TimelineClip, TimelineTrack } from '../../../components/ui/track-timeline'

/** What is being arranged: a song sketch, an episode edit, a video cut. */
export interface TrackArrangerProject {
  title: string
  /** The project's length, in seconds. */
  length: number
  /** A second line under the title, after the copy's lead-in: "96 BPM · A minor". Default: none. */
  detail?: string
}

/** A lane: its name, caption, color and the source's loudness samples. */
export type TrackArrangerTrack = TimelineTrack
/** A bar on a lane: where it sits, where in the source it begins, and its gain. */
export type TrackArrangerClip = TimelineClip

export const PROJECT: TrackArrangerProject = { title: 'Late platform', length: 48, detail: '96 BPM · A minor' }
const SONG = { length: PROJECT.length, tempo: 96 }

/** Seconds per sample in the sources. */
export const RESOLUTION = 0.1
const SAMPLES = SONG.length / RESOLUTION
const BEAT = 60 / SONG.tempo

/** A seeded wobble, the same on every run. */
const wobble = (i: number, seed: number) => 0.5 + 0.5 * Math.sin(i * 12.9898 * seed + seed * 78.233) * Math.cos(i * 0.37 + seed)
const round = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 100) / 100

/** A hummed line: phrases that swell and fall, with breaths between. */
const voice = Array.from({ length: SAMPLES }, (_, i) => {
  const t = i * RESOLUTION
  const phrase = (t % (BEAT * 8)) / (BEAT * 8)
  const breath = phrase > 0.82 ? 0.05 : 1
  return round((0.25 + 0.55 * Math.sin(Math.PI * Math.min(1, phrase / 0.82)) + 0.15 * wobble(i, 1.3)) * breath)
})
/** An arpeggio: a pluck on every eighth note, ringing down. */
const guitar = Array.from({ length: SAMPLES }, (_, i) => {
  const since = (i * RESOLUTION) % (BEAT / 2)
  return round(0.2 + 0.6 * Math.exp(-since * 7) + 0.12 * wobble(i, 2.1))
})
/** Held roots: a note a bar, fading slowly. */
const bass = Array.from({ length: SAMPLES }, (_, i) => {
  const since = (i * RESOLUTION) % (BEAT * 4)
  return round(0.35 + 0.45 * Math.exp(-since * 0.6) + 0.08 * wobble(i, 0.7))
})
/** A beat: a kick on every beat, the snare on two and four a touch softer. */
const beat = Array.from({ length: SAMPLES }, (_, i) => {
  const t = i * RESOLUTION
  const since = t % BEAT
  const count = Math.floor(t / BEAT) % 4
  return round(0.12 + (count % 2 ? 0.7 : 0.85) * Math.exp(-since * 11) + 0.1 * wobble(i, 3.7))
})

export const TRACKS: TrackArrangerTrack[] = [
  { id: 'voice', name: 'Voice memo', caption: 'Hummed', color: 1, peaks: voice },
  { id: 'guitar', name: 'Guitar', caption: 'Nylon, DI', color: 2, peaks: guitar },
  { id: 'bass', name: 'Bass', caption: 'Synth', color: 3, peaks: bass },
  { id: 'beat', name: 'Beat', caption: 'Drum loop', color: 5, peaks: beat },
]

export const CLIPS: TrackArrangerClip[] = [
  { id: 'hum', track: 'voice', name: 'hum take 3', start: 8, end: 22, offset: 8 },
  { id: 'chorus', track: 'voice', name: 'chorus idea', start: 26, end: 40, offset: 26, gain: 2 },
  { id: 'arp', track: 'guitar', name: 'arpeggio', start: 0, end: 24 },
  { id: 'strum', track: 'guitar', name: 'strum', start: 24, end: 44, offset: 24, gain: -3 },
  { id: 'roots', track: 'bass', name: 'roots', start: 8, end: 40, offset: 8 },
  { id: 'loop-a', track: 'beat', name: 'loop A', start: 0, end: 16 },
  { id: 'loop-a2', track: 'beat', name: 'loop A', start: 16, end: 30, offset: 16 },
  { id: 'fill', track: 'beat', name: 'fill', start: 30, end: 32.5, offset: 30, gain: 4 },
  { id: 'loop-b', track: 'beat', name: 'loop B', start: 33, end: 48, offset: 33 },
]

export const GAIN = { min: -12, max: 6, step: 0.5 }
const MIN_CLIP = 0.5

/**
 * Sets a clip's start or end from the inspector, as a drag of that edge
 * would: never into the clip beside it on its track, past its source, or
 * shorter than half a second. Moving the start moves where the source
 * begins with it.
 */
export function trim(clips: TrackArrangerClip[], id: string, edge: 'start' | 'end', to: number, length: number): TrackArrangerClip[] {
  const c = clips.find((o) => o.id === id)
  if (!c) return clips
  const same = clips.filter((o) => o.track === c.track && o.id !== c.id)
  const before = Math.max(0, ...same.filter((o) => o.end <= c.start + 1e-6).map((o) => o.end))
  const after = Math.min(length, ...same.filter((o) => o.start >= c.end - 1e-6).map((o) => o.start))
  const offset = c.offset ?? 0
  const next =
    edge === 'start'
      ? (() => {
          const start = Math.min(c.end - MIN_CLIP, Math.max(before, c.start - offset, to))
          return { ...c, start, offset: offset + (start - c.start) }
        })()
      : { ...c, end: Math.max(c.start + MIN_CLIP, Math.min(after, c.start + (length - offset), to)) }
  const round1 = (n: number) => Math.round(n * 10) / 10
  return clips.map((o) => (o.id === id ? { ...next, start: round1(next.start), end: round1(next.end), offset: round1(next.offset ?? 0) } : o))
}

export const DEFAULT_COPY = {
  subtitle: (detail?: string) => (detail ? `Sketch · ${detail}` : 'Sketch'),
  more: 'More options',
  duplicate: 'Duplicate sketch',
  rename: 'Rename',
  timeline: 'Arrangement',
  play: 'Play',
  pause: 'Pause',
  rewind: 'Back to the start',
  snap: 'Snap',
  inspector: 'Clip',
  none: 'Select a clip to set its start, end and gain.',
  onTrack: (track: string) => `on ${track}`,
  start: 'Start',
  end: 'End',
  gain: 'Gain',
  length: 'Length',
  seconds: 's',
  decibels: (db: string) => `${db} dB`,
  saved: 'Saved on this device',
  export: 'Export mix',
  exporting: 'Exporting…',
  exported: 'Exported',
  announceExported: 'Mix exported',
  loadingLabel: 'Loading the arrangement',
  retry: 'Retry',
  emptyTitle: 'No tracks yet',
  emptyDescription: 'The tracks of your project show up here.',
}

export type TrackArrangerCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}
