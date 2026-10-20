import { numberFormat } from '../../../lib/utils'
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development (only when `warn`: a real file with no handler), then waits like a request. */
export function demo(action: string, ms: number, warn = true) {
  if (warn && process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export type MediaDropzoneStatus = 'checking' | 'queued' | 'uploading' | 'done' | 'error' | 'removing'

export interface MediaDropzoneFile {
  id: string
  name: string
  /** In bytes. */
  size: number
  /** MIME type. */
  type: string
  /** The folder it came from, inside a dropped or picked folder: `lookbook/day-2`. */
  path?: string
  /** A small picture of it: a thumbnail for an image, a frame for a video. Made from the file when it's added. */
  preview?: string
  /** In pixels, for an image or a video. */
  width?: number
  height?: number
  /** In seconds, for a video or an audio file. */
  duration?: number
  /** `done` for a file that's already stored. */
  status: MediaDropzoneStatus
  /** 0–100 while uploading; `null` before the first report. */
  progress?: number | null
  /** Why it failed. */
  error?: string
  /** The file itself (absent on files that were already stored). */
  file?: File
  /** What `onUpload` resolved with: a URL, a key. */
  result?: unknown
}

/** A file that wasn't added, and why. */
export interface MediaDropzoneRejection {
  name: string
  reason: string
}

export interface MediaDropzoneUploadContext {
  /** Aborted when the file is removed or the block unmounts. */
  signal: AbortSignal
  /** Report progress, 0–100. */
  onProgress: (percent: number) => void
  /** Its folder inside a dropped folder, to keep the structure on your side: `lookbook/day-2`. */
  path?: string
}

const MB = 1024 * 1024
/** Where the demo's photos are served from: the Youj site, so a copied block shows them in any app. Pass your own files in `defaultFiles`. */
const PHOTOS = 'https://www.youj.dev/blocks/products'

/** Four files part-way through: two stored, a film uploading, a photo whose upload dropped. */
export const DEMO_FILES: MediaDropzoneFile[] = [
  {
    id: 'demo-kettle',
    name: 'ridge-kettle-sage.webp',
    size: 1.4 * MB,
    type: 'image/webp',
    preview: `${PHOTOS}/kettle-sage.webp`,
    width: 2400,
    height: 3000,
    status: 'done',
    progress: 100,
  },
  {
    id: 'demo-teaser',
    name: 'autumn-teaser.mp4',
    size: 46.2 * MB,
    type: 'video/mp4',
    preview: `${PHOTOS}/bud-vases.webp`,
    width: 1920,
    height: 1080,
    duration: 42, // youj-allow: a film's running time, not an animation
    status: 'uploading',
    progress: 38,
  },
  {
    id: 'demo-tea',
    name: 'tea-set-on-tray.webp',
    size: 3.8 * MB,
    type: 'image/webp',
    preview: `${PHOTOS}/tea-set.webp`,
    width: 2400,
    height: 3000,
    status: 'error',
    progress: 58,
    error: 'The connection dropped at 58%.',
  },
  {
    id: 'demo-lookbook',
    name: 'lookbook-autumn.pdf',
    size: 2.3 * MB,
    type: 'application/pdf',
    path: 'lookbook/print',
    status: 'done',
    progress: 100,
  },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Upload files',
  description: 'Photos, video and documents for the autumn lookbook.',
  /** The zone's main line at rest. */
  drop: 'Drop files or folders here',
  /** Under it: the zone is the browse button. */
  browse: 'or browse your files',
  /** The paste hint, with the shortcut's modifier. */
  pasteHint: (modifier: string) => `Paste with ${modifier}V`,
  /** While files are dragged anywhere over the page. */
  dropReady: 'Drop them here',
  /** While a drag is over the zone, when the count is known. */
  dropCount: (count: number) => `Drop ${count} ${plural(count, 'file', 'files')}`,
  /** …and the drag says some won't be accepted. */
  dropSome: (refused: number) => `${refused} ${plural(refused, 'isn’t', 'aren’t')} a type this accepts`,
  dropNone: 'These files aren’t accepted here',
  /** Under it: what is. */
  onlyTypes: (allowed: string) => `Only ${allowed}`,
  /** Under a drag the rules take whole. */
  dropRelease: 'Let go to add them',
  /** While a dropped folder is read. */
  reading: (count: number) => `Reading the folder… ${count} ${plural(count, 'file', 'files')}`,
  /** When `maxFiles` is reached. */
  full: (max: number) => `${max} of ${max} files added`,
  fullHint: 'Remove one to add another.',
  chooseFolder: 'Choose a folder',
  /** The rules line's parts. */
  types: (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}` : (names[0] ?? '')),
  typeGroup: (group: string) => (({ image: 'Images', video: 'Video', audio: 'Audio', text: 'Text' }) as Record<string, string>)[group] ?? group,
  atLeast: (dimensions: string) => `at least ${dimensions} px`,
  eachUpTo: (size: string) => `up to ${size} each`,
  inAll: (size: string) => `${size} in all`,
  /** The refusals. */
  refusedTitle: (count: number) => `${count} ${plural(count, 'file wasn’t', 'files weren’t')} added`,
  refusedMore: (count: number) => `${count} more`,
  dismiss: 'Dismiss',
  skipped: (count: number) => `Skipped ${count} system ${plural(count, 'file', 'files')} (like .DS_Store).`,
  notAccepted: (name: string, allowed: string) => `${name} isn’t accepted. Use ${allowed}.`,
  tooLarge: (name: string, size: string, max: string) => `${name} is ${size}, over the ${max} limit.`,
  empty: (name: string) => `${name} is empty.`,
  duplicate: (name: string) => `${name} is already added.`,
  tooMany: (name: string, max: number) => `${name} wasn’t added: ${max} files at most.`,
  overBudget: (name: string, left: string) => `${name} doesn’t fit: ${left} left in all.`,
  tooSmall: (name: string, actual: string, min: string) => `${name} is ${actual}; it needs at least ${min}.`,
  unreadable: (name: string) => `${name} couldn’t be read as an image.`,
  /** A pasted image's name, from the moment it was pasted. */
  pastedName: (stamp: string) => `Pasted image ${stamp}`,
  /** A row. */
  files: 'Files',
  /** The list before anything's added. */
  noFiles: 'Files you add show up here.',
  checking: 'Checking…',
  queued: 'Waiting…',
  uploaded: 'Uploaded',
  failed: (reason: string) => `Failed: ${reason}`,
  uploadFailed: 'The upload failed.',
  removing: 'Removing…',
  removeFailed: (reason: string) => `Couldn’t remove it: ${reason}`,
  retry: (name: string) => `Retry ${name}`,
  remove: (name: string) => `Remove ${name}`,
  cancel: (name: string) => `Cancel uploading ${name}`,
  uploading: (name: string, percent: number) => `Uploading ${name}, ${percent}%`,
  dimensions: (width: number, height: number) => `${width} × ${height}`,
  /** The footer. */
  summary: (count: number) => `${count} ${plural(count, 'file', 'files')}`,
  ofBudget: (used: string, max: string) => `${used} of ${max}`,
  budget: 'Space used',
  /** Announced. */
  added: (count: number) => `${count} ${plural(count, 'file', 'files')} added`,
  refused: (count: number) => `${count} not added`,
  uploadedOne: (name: string) => `${name} uploaded`,
  failedOne: (name: string, reason: string) => `${name} failed: ${reason}`,
  removed: (name: string) => `${name} removed`,
}

export type MediaDropzoneCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its sizes, times and durations are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte']

/** Bytes in the largest unit under a thousand, in the locale: "6.8 MB" (1024 to the kilobyte, as limits are written). */
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

/** A running time as the clock reads it: "0:42", "1:04:09". */
export function formatDuration(seconds: number, locale: string) {
  const s = Math.max(0, Math.round(seconds))
  const two = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
  const one = numberFormat(locale, { useGrouping: false })
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${one.format(h)}:${two.format(m)}:${two.format(s % 60)}` : `${one.format(m)}:${two.format(s % 60)}`
}
