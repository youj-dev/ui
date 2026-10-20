import { numberFormat } from '../../../lib/utils'
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

export type MediaLibraryKind = 'image' | 'video' | 'audio' | 'document'

export interface MediaLibraryAsset {
  id: string
  name: string
  kind: MediaLibraryKind
  /** What its tile shows: an image's URL, a video's poster. Without one, a drawn tile for its kind. */
  preview?: string
  /** The file itself, played or shown large in the lightbox (a video's URL). Default: `preview`. */
  url?: string
  /** In pixels, for an image or a video. */
  width?: number
  height?: number
  /** In seconds, for a video or audio. */
  duration?: number
  /** In bytes. */
  size: number
  /** The id of its folder. */
  folder?: string
  alt?: string
  /** When it was added, in epoch milliseconds. */
  addedAt: number
  /** 0–100 while it uploads into the library. */
  progress?: number
}

export interface MediaLibraryFolder {
  id: string
  name: string
}

/** Uploads one file into the library: report progress (0–100), resolve with what's stored (its `preview` URL, an `id`), reject to say why. */
export type MediaLibraryUpload = (
  file: File,
  context: { signal: AbortSignal; onProgress: (percent: number) => void; folder?: string },
) => Promise<Partial<MediaLibraryAsset> | void> | Partial<MediaLibraryAsset> | void

const MB = 1024 * 1024
const KB = 1024
/** Where the demo's photos are served from: the Youj site, so a copied block shows them in any app. */
const P = 'https://www.youj.dev/blocks/products'
const day = (d: number, h = 10) => Date.UTC(2026, 9, d, h)

export const FOLDERS: MediaLibraryFolder[] = [
  { id: 'kettles', name: 'Kettles' },
  { id: 'tableware', name: 'Tableware' },
  { id: 'campaign', name: 'Autumn campaign' },
]

/** A small studio's library: product shots in two folders, and a campaign's film, cut-downs, sound and lookbook (drawn). */
export const ASSETS: MediaLibraryAsset[] = [
  {
    id: 'sage',
    name: 'ridge-kettle-sage.webp',
    kind: 'image',
    preview: `${P}/kettle-sage.webp`,
    width: 1040,
    height: 1300,
    size: 1.4 * MB,
    folder: 'kettles',
    alt: 'Sage enamel kettle, front.',
    addedAt: day(9),
  },
  {
    id: 'sage-side',
    name: 'ridge-kettle-sage-side.webp',
    kind: 'image',
    preview: `${P}/kettle-sage-side.webp`,
    width: 1040,
    height: 1300,
    size: 1.3 * MB,
    folder: 'kettles',
    alt: 'Sage enamel kettle, side.',
    addedAt: day(9, 9),
  },
  {
    id: 'rose',
    name: 'ridge-kettle-rose.webp',
    kind: 'image',
    preview: `${P}/kettle-rose.webp`,
    width: 1040,
    height: 1300,
    size: 1.5 * MB,
    folder: 'kettles',
    alt: 'Rose enamel kettle, front.',
    addedAt: day(8),
  },
  {
    id: 'rose-side',
    name: 'ridge-kettle-rose-side.webp',
    kind: 'image',
    preview: `${P}/kettle-rose-side.webp`,
    width: 1040,
    height: 1300,
    size: 1.4 * MB,
    folder: 'kettles',
    alt: 'Rose enamel kettle, side.',
    addedAt: day(8, 9),
  },
  {
    id: 'sky',
    name: 'ridge-kettle-sky.webp',
    kind: 'image',
    preview: `${P}/kettle-sky.webp`,
    width: 1040,
    height: 1300,
    size: 1.5 * MB,
    folder: 'kettles',
    alt: 'Sky blue enamel kettle, front.',
    addedAt: day(7),
  },
  {
    id: 'sky-side',
    name: 'ridge-kettle-sky-side.webp',
    kind: 'image',
    preview: `${P}/kettle-sky-side.webp`,
    width: 1040,
    height: 1300,
    size: 1.4 * MB,
    folder: 'kettles',
    alt: 'Sky blue enamel kettle, side.',
    addedAt: day(7, 9),
  },
  {
    id: 'cream',
    name: 'stovetop-kettle-cream.webp',
    kind: 'image',
    preview: `${P}/kettle-cream.webp`,
    width: 1040,
    height: 1300,
    size: 1.6 * MB,
    folder: 'kettles',
    alt: 'Cream kettle with a wooden handle.',
    addedAt: day(6),
  },
  {
    id: 'cream-side',
    name: 'stovetop-kettle-cream-side.webp',
    kind: 'image',
    preview: `${P}/kettle-cream-side.webp`,
    width: 1040,
    height: 1300,
    size: 1.5 * MB,
    folder: 'kettles',
    alt: 'Cream kettle, side.',
    addedAt: day(6, 9),
  },
  {
    id: 'tea',
    name: 'tea-set-on-tray.webp',
    kind: 'image',
    preview: `${P}/tea-set.webp`,
    width: 1040,
    height: 1300,
    size: 2.1 * MB,
    folder: 'tableware',
    alt: 'A tea set on a wooden tray.',
    addedAt: day(5),
  },
  {
    id: 'mug',
    name: 'white-mug.webp',
    kind: 'image',
    preview: `${P}/mug.webp`,
    width: 1200,
    height: 800,
    size: 0.9 * MB,
    folder: 'tableware',
    alt: 'A white mug.',
    addedAt: day(5, 9),
  },
  {
    id: 'vases',
    name: 'bud-vases.webp',
    kind: 'image',
    preview: `${P}/bud-vases.webp`,
    width: 1200,
    height: 800,
    size: 1.1 * MB,
    folder: 'tableware',
    alt: 'Three white bud vases.',
    addedAt: day(4),
  },
  {
    id: 'film',
    name: 'autumn-film-master.mp4',
    kind: 'video',
    width: 1920,
    height: 1080,
    duration: 94, // youj-allow: a clip's running time, not an animation
    size: 214 * MB,
    folder: 'campaign',
    addedAt: day(3),
  },
  {
    id: 'cut',
    name: 'autumn-cutdown-15s.mp4',
    kind: 'video',
    width: 1080,
    height: 1920,
    duration: 15, // youj-allow: a clip's running time, not an animation
    size: 38 * MB,
    folder: 'campaign',
    addedAt: day(3, 9),
  },
  {
    id: 'sound',
    name: 'kettle-whistle-loop.wav',
    kind: 'audio',
    duration: 12, // youj-allow: a clip's running time, not an animation
    size: 2.1 * MB,
    folder: 'campaign',
    addedAt: day(2),
  },
  { id: 'lookbook', name: 'autumn-lookbook.pdf', kind: 'document', size: 860 * KB, folder: 'campaign', addedAt: day(1) },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export type MediaLibrarySort = 'newest' | 'oldest' | 'name' | 'largest'
export type MediaLibraryFilter = 'all' | MediaLibraryKind

export const DEFAULT_COPY = {
  title: 'Choose media',
  description: 'Pick up to four for the product page. The first one you pick is the cover.',
  upload: 'Upload',
  search: 'Search media',
  searchLabel: 'Search by name or description',
  filter: 'Type',
  filters: { all: 'All', image: 'Images', video: 'Video', audio: 'Audio', document: 'Docs' } as Record<MediaLibraryFilter, string>,
  sort: 'Sort',
  sorts: { newest: 'Newest', oldest: 'Oldest', name: 'Name', largest: 'Largest' } as Record<MediaLibrarySort, string>,
  view: 'View',
  grid: 'Grid',
  list: 'List',
  root: 'All media',
  folders: 'Folders',
  inFolder: (count: number) => `${count}`,
  media: 'Media',
  /** A tile. */
  dimensions: (width: number, height: number) => `${width} × ${height}`,
  open: (name: string) => `Open ${name}`,
  selectedAs: (position: number) => `Selected ${position}`,
  uploading: (percent: number) => `Uploading, ${percent}%`,
  /** Selection. */
  selected: (count: number, max?: number) => (max ? `${count} of ${max} selected` : `${count} selected`),
  clear: 'Clear',
  cancel: 'Cancel',
  insert: (count: number) => (count ? `Insert ${count}` : 'Insert'),
  inserting: 'Inserting…',
  inserted: 'Inserted',
  insertFailed: 'Couldn’t insert',
  full: (max: number) => `That’s ${max}, the most you can pick. Deselect one to swap it.`,
  /** The lightbox. */
  previous: 'Previous',
  next: 'Next',
  position: (index: number, total: number) => `${index} of ${total}`,
  select: 'Select',
  deselect: 'Selected',
  type: 'Type',
  dimensionsLabel: 'Dimensions',
  length: 'Length',
  size: 'Size',
  added: 'Added',
  folder: 'Folder',
  alt: 'Alt text',
  noAlt: 'None yet',
  noPreview: 'No preview for this file in the demo.',
  kinds: { image: 'Image', video: 'Video', audio: 'Audio', document: 'Document' } as Record<MediaLibraryKind, string>,
  /** Empty, loading, failed. */
  emptyTitle: 'Nothing here yet',
  emptyBody: 'Drop files here, or upload them.',
  noResults: (query: string) => `Nothing matches “${query}”`,
  noResultsBody: 'Check the spelling, or look in all media.',
  clearSearch: 'Clear search',
  loading: 'Loading media…',
  errorTitle: 'The library didn’t load',
  retry: 'Try again',
  dropHere: (folder: string) => `Drop to upload to ${folder}`,
  uploadFailed: 'The upload failed.',
  /** Announced. */
  results: (count: number) => `${count} ${plural(count, 'item', 'items')}`,
  selectedOne: (name: string, position: number) => `${name} selected, ${position}`,
  deselectedOne: (name: string) => `${name} deselected`,
  cleared: 'Selection cleared',
  uploadedOne: (name: string) => `${name} uploaded`,
  failedOne: (name: string, reason: string) => `${name} didn’t upload: ${reason}`,
}

export type MediaLibraryCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its sizes, dates and running times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte']

/** Bytes in the locale: "6.8 MB" (1024 to the kilobyte, as limits are written). */
export function formatBytes(bytes: number, locale: string) {
  const i = Math.min(UNITS.length - 1, Math.max(0, Math.floor(Math.log(Math.max(1, bytes)) / Math.log(1024))))
  const value = bytes / 1024 ** i
  return numberFormat(locale, {
    style: 'unit',
    unit: UNITS[i],
    unitDisplay: i === 0 ? 'long' : 'short',
    maximumFractionDigits: i > 0 && value < 100 ? 1 : 0,
  }).format(value)
}

/** A running time as a clock reads it: "1:34". */
export function formatDuration(seconds: number, locale: string) {
  const s = Math.round(seconds)
  const two = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
  return `${numberFormat(locale, { useGrouping: false }).format(Math.floor(s / 60))}:${two.format(s % 60)}`
}
