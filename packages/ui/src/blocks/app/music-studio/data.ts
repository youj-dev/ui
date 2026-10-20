export interface Section {
  name: string
  /** First bar, from 1. */
  start: number
  /** Short-term loudness while it plays, in LUFS. */
  loudness: number
}

export interface Clip {
  name: string
  /** First and last bar it covers, from 1. */
  from: number
  to: number
}

export interface Lane {
  id: string
  name: string
  /** Which chart color it wears, 1 to 5. */
  tone: 1 | 2 | 3 | 4 | 5
  clips: Clip[]
}

export interface Session {
  title: string
  artist: string
  bars: number
  /** Beats in a bar. */
  meter: number
  sections: Section[]
  lanes: Lane[]
}

export const SESSION: Session = {
  title: 'Night Swim',
  artist: 'Harbour Lights',
  bars: 32,
  meter: 4,
  sections: [
    { name: 'Intro', start: 1, loudness: -14.6 },
    { name: 'Verse', start: 9, loudness: -11.8 },
    { name: 'Drop', start: 17, loudness: -8.4 },
    { name: 'Outro', start: 25, loudness: -12.9 },
  ],
  lanes: [
    { id: 'drums', name: 'Drums', tone: 1, clips: [{ name: 'Kit · brushed', from: 1, to: 8 }, { name: 'Kit · full', from: 9, to: 24 }, { name: 'Kit · sparse', from: 25, to: 32 }] },
    { id: 'bass', name: 'Bass', tone: 2, clips: [{ name: 'Sub line', from: 9, to: 24 }, { name: 'Sub tail', from: 25, to: 28 }] },
    { id: 'keys', name: 'Keys', tone: 3, clips: [{ name: 'Tape pads', from: 1, to: 16 }, { name: 'Stabs', from: 17, to: 24 }, { name: 'Pads out', from: 25, to: 32 }] },
    { id: 'lead', name: 'Lead', tone: 4, clips: [{ name: 'Hook', from: 17, to: 24 }, { name: 'Hook echo', from: 29, to: 32 }] },
    { id: 'vox', name: 'Vox', tone: 5, clips: [{ name: 'Verse take 3', from: 9, to: 16 }, { name: 'Chops', from: 17, to: 22 }] },
  ],
}

/** Every string the block shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  session: 'Session',
  arrangement: 'Arrangement',
  search: 'Find a clip',
  bar: (bar: number) => `bar ${bar}`,
  section: (name: string, bar: number) => `${name}, from bar ${bar}`,
  noMatch: (query: string) => `No clip matches “${query}”`,
  matches: (count: number, query: string) => `${count} ${count === 1 ? 'clip matches' : 'clips match'} “${query}”`,
  dsp: 'DSP',
  latency: 'Latency',
  loudness: 'Loudness',
  tempo: 'Tempo',
  snap: 'Snap',
  snaps: [
    { value: '4', label: '1/4' },
    { value: '8', label: '1/8' },
    { value: '16', label: '1/16' },
  ],
  transport: 'Transport',
  loop: 'Loop section',
  click: 'Click track',
}
export type MusicStudioCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
