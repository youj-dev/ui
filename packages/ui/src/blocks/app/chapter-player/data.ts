import type { WaveformChapter } from '../../../components/ui/waveform-scrubber'

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

/** Where a chapter starts, in seconds, and what it's called. */
export type ChapterPlayerChapter = WaveformChapter

/** What plays: a podcast episode, a lecture recording, an audiobook. */
export interface ChapterPlayerMedia {
  /** The show, course or book it belongs to. */
  series: string
  /** Who made it or reads it. */
  author: string
  /** Its number in the series, shown in the subtitle. Default: none. */
  part?: number
  title: string
  /** When it came out. Default: none, so no date is shown. */
  date?: number
  /** Seconds. */
  length: number
  chapters: ChapterPlayerChapter[]
  /** Loudness samples, 0–1, evenly over the media. */
  peaks: number[]
}

const CHAPTERS: ChapterPlayerChapter[] = [
  { start: 0, title: 'Cold open' },
  { start: 3 * 60 + 12, title: 'The brief' },
  { start: 9 * 60 + 40, title: 'Night shift' },
  { start: 18 * 60 + 5, title: 'What the data said' },
  { start: 27 * 60 + 30, title: 'The quiet part' },
  { start: 35 * 60 + 50, title: 'Listener mail' },
]
const LENGTH = 42 * 60 + 10

/** A plausible talk-show wave from a seed: speech in phrases, a breath between them, a dip at every chapter's seam. */
export function speech(length: number, chapters: ChapterPlayerChapter[], samples = 480, seed = 142) {
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  let level = 0.5
  return Array.from({ length: samples }, (_, i) => {
    const t = (i / samples) * length
    level += (rand() - 0.5) * 0.35
    level = Math.min(0.95, Math.max(0.2, level))
    const phrase = 0.55 + 0.45 * Math.abs(Math.sin(i * 0.47 + rand()))
    const seam = Math.min(...chapters.slice(1).map((c) => Math.abs(t - c.start))) / 18
    const breath = rand() < 0.06 ? 0.25 : 1
    return Math.round(Math.min(1, level * phrase * breath * Math.min(1, 0.15 + seam)) * 100) / 100
  })
}

export const MEDIA: ChapterPlayerMedia = {
  series: 'Field Notes',
  author: 'Ada Reyes',
  part: 142,
  title: 'The quiet shift',
  date: new Date(2026, 8, 24).getTime(),
  length: LENGTH,
  chapters: CHAPTERS,
  // One sample a second, so a clip zoomed to two minutes still has a bar per second.
  peaks: speech(LENGTH, CHAPTERS, LENGTH),
}

/** Where the demo opens: a little into the third chapter. */
export const START = 12 * 60 + 34
export const RATES = { min: 0.8, max: 2, step: 0.1 }

export const DEFAULT_COPY = {
  subtitle: (series: string, part?: number) => (part === undefined ? series : `${series} · Ep. ${part}`),
  more: 'More options',
  byline: (author: string) => `with ${author}`,
  play: 'Play',
  pause: 'Pause',
  back: (s: number) => `Back ${s} seconds`,
  forward: (s: number) => `Forward ${s} seconds`,
  left: (time: string) => `−${time}`,
  speed: 'Speed',
  speedValue: (rate: string) => `${rate}×`,
  clip: 'Clip',
  clipping: 'Clip to share',
  clipLength: (seconds: string) => `${seconds} s`,
  share: (range: string) => `Share ${range}`,
  sharing: 'Copying link…',
  shared: 'Link copied',
  sharedAnnounce: (range: string) => `Link to ${range} copied`,
  cancel: 'Cancel',
  chapters: 'Chapters',
  chapterCount: (n: number) => `${n} chapters`,
  now: 'Now',
  minutes: (m: string) => `${m} min`,
  status: 'Auto-transcribed',
  timeLeft: (time: string) => `${time} left`,
  transcript: 'Transcript',
  idleTitle: 'Now playing',
  loadingLabel: 'Loading the recording',
  retry: 'Retry',
  emptyTitle: 'Nothing to play',
  emptyDescription: 'What you pick shows up here.',
}

export type ChapterPlayerCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
