export interface Page {
  id: string
  label: string
  /** People on it now. */
  value: number
}

export interface Snapshot {
  /** People active now. */
  current: number
  /** The same, the strip's span ago (its buckets times their length), for the change. */
  previous?: number
  /** One reading per bucket, oldest first; the last is the bucket filling now. */
  series: number[]
  /** The bucket filling now, as a number that goes up by one each bucket: when it steps, the strip slides along. */
  bucket: number
  /** Where people are, largest first. */
  pages?: Page[]
}

/** The block's item types, under its name. */
export type LiveMetricSnapshot = Snapshot
export type LiveMetricPage = Page

/** A seeded generator (mulberry32), so the demo starts the same on every visit. */
export function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** The demo site's pages and how much of the traffic each tends to draw. */
export const PAGES: { id: string; label: string; weight: number }[] = [
  { id: 'home', label: '/', weight: 0.31 },
  { id: 'pricing', label: '/pricing', weight: 0.19 },
  { id: 'launch', label: '/blog/launch-week', weight: 0.15 },
  { id: 'docs', label: '/docs/getting-started', weight: 0.12 },
  { id: 'changelog', label: '/changelog', weight: 0.08 },
  { id: 'signup', label: '/signup', weight: 0.07 },
  { id: 'careers', label: '/careers', weight: 0.04 },
]

export const DEFAULT_COPY = {
  title: 'Right now',
  /** Under the title. */
  description: 'People on the site, live',
  /** After the big figure. */
  people: 'people on the site',
  /** After the change. */
  versus: (minutes: string) => `vs. ${minutes} ago`,
  /** The strip's name for assistive tech and its caption. */
  strip: (seconds: string, minutes: string) => `Page views every ${seconds}, the last ${minutes}`,
  /** Its ends. */
  ago: (minutes: string) => `${minutes} ago`,
  now: 'Now',
  pages: 'Top pages',
  pagePeople: 'People',
  /** A page for assistive tech. */
  page: (label: string, people: string) => `${label}: ${people} people`,
  pause: 'Pause',
  resume: 'Resume',
  /** Spoken when updates stop or start again. */
  paused: 'Updates paused',
  resumed: 'Updates resumed',
  /** Spoken every half minute while it runs. */
  announcement: (people: string) => `${people} people on the site now`,
  demoData: 'Demo data',
  empty: 'No one on the site right now',
  loading: 'Connecting',
  retry: 'Retry',
}

export type LiveMetricCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
