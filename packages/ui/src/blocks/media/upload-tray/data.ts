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

/** `waiting` holds for the connection to come back; `retrying` counts down to its next try. */
export type UploadTrayStatus = 'queued' | 'uploading' | 'paused' | 'waiting' | 'retrying' | 'done' | 'failed'

export interface UploadTrayItem {
  id: string
  name: string
  /** In bytes. */
  size: number
  /** MIME type. */
  type: string
  /** Bytes stored so far. */
  loaded: number
  status: UploadTrayStatus
  /** A small picture: an image's thumbnail, a video's frame. Made from the file when it's added. */
  preview?: string
  /** Why it failed. */
  error?: string
  /** Its folder inside a dropped folder: `shoot/day-2`. */
  path?: string
  /** The file itself. Items without one are the demo's, and are simulated. */
  file?: File
  /** What `onUpload` resolved with: a URL, a key. */
  result?: unknown
  /** Bytes a second while it moves, smoothed. */
  rate?: number
  /** The try it's on, or the next one while it waits to retry: 1, 2… */
  attempt?: number
  /** When a retrying item tries again, in epoch milliseconds. */
  retryAt?: number
}

export interface UploadTrayContext {
  /** Aborted when the upload is paused, cancelled, goes offline or the block unmounts. */
  signal: AbortSignal
  /** Bytes already stored: resume from here (tus, S3 multipart). 0 on a first try. An uploader that can't resume starts over and reports from 0. */
  offset: number
  /** Report the bytes stored so far, of the file's size. */
  onProgress: (loaded: number) => void
  /** 1 on the first try, then 2, 3… on the automatic retries. */
  attempt: number
  /** Its folder inside a dropped folder, to keep the structure on your side. */
  path?: string
}

/** A demo item: how fast the simulation moves it, and where its first try breaks. */
export interface DemoItem extends UploadTrayItem {
  /** Bytes a second. */
  bandwidth: number
  /** The fraction of the file where its first try breaks. */
  breakAt?: number
}

/** The waits before each automatic retry, in milliseconds. */
export const RETRY_DELAYS = [2000, 5000, 10_000]

const KB = 1024
const MB = KB * 1024
const GB = MB * 1024
/** Where the demo's photos are served from: the Youj site, so a copied block shows them in any app. */
const PHOTOS = 'https://www.youj.dev/blocks/products'

/** Six files mid-flight to the autumn lookbook: three moving, one waiting to retry after a reset, one queued, one in. */
export const DEMO_ITEMS: DemoItem[] = [
  {
    id: 'film',
    name: 'autumn-campaign-film.mov',
    size: 2.31 * GB,
    loaded: 1.41 * GB,
    type: 'video/quicktime',
    preview: `${PHOTOS}/bud-vases.webp`,
    status: 'uploading',
    bandwidth: 18.9 * MB,
  },
  {
    id: 'shoot',
    name: 'kettle-shoot-selects.zip',
    size: 940 * MB,
    loaded: 212 * MB,
    type: 'application/zip',
    status: 'uploading',
    bandwidth: 16.4 * MB,
  },
  {
    id: 'hero',
    name: 'tea-set-hero.webp',
    size: 14.6 * MB,
    loaded: 9.4 * MB,
    type: 'image/webp',
    preview: `${PHOTOS}/tea-set.webp`,
    status: 'uploading',
    bandwidth: 1.2 * MB,
  },
  {
    id: 'feed',
    name: 'product-feed-0926.csv',
    size: 386 * MB,
    loaded: 243 * MB,
    type: 'text/csv',
    status: 'retrying',
    attempt: 3,
    error: 'The connection was reset.',
    bandwidth: 12.2 * MB,
  },
  { id: 'print', name: 'lookbook-print.pdf', size: 38.2 * MB, loaded: 0, type: 'application/pdf', status: 'queued', bandwidth: 6.1 * MB },
  {
    id: 'rose',
    name: 'ridge-kettle-rose.webp',
    size: 12.1 * MB,
    loaded: 12.1 * MB,
    type: 'image/webp',
    preview: `${PHOTOS}/kettle-rose.webp`,
    status: 'done',
    bandwidth: 4 * MB,
  },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  /** The tray's region name. */
  region: 'Uploads',
  /** Where files go, named in the drop overlay and once everything's in. */
  destination: 'Autumn lookbook',
  /** The header, while files move. */
  uploading: (count: number) => `Uploading ${count} ${plural(count, 'file', 'files')}`,
  paused: (count: number) => `${count} ${plural(count, 'upload', 'uploads')} paused`,
  offline: 'Waiting for a connection',
  complete: (count: number) => `${count} ${plural(count, 'upload', 'uploads')} complete`,
  someFailed: (failed: number) => `${failed} ${plural(failed, 'upload', 'uploads')} failed`,
  /** Its second line. */
  rate: (speed: string, left: string) => `${speed} · ${left}`,
  timeLeft: (duration: string) => `${duration} left`,
  fewSeconds: 'A few seconds left',
  calculating: 'Working out the time…',
  doneIn: (destination: string) => `In ${destination}`,
  offlineHint: 'They’ll carry on when you’re back.',
  /** The header's buttons. */
  pauseAll: 'Pause all',
  resumeAll: 'Resume all',
  close: 'Close',
  /** The banner while offline. */
  offlineBanner: 'You’re offline. Uploads will resume when you’re back.',
  /** A row's line. */
  of: (loaded: string, size: string) => `${loaded} of ${size}`,
  queued: 'Queued',
  uploadedRow: 'Uploaded',
  pausedRow: 'Paused',
  waitingRow: 'Waiting for connection',
  retryingIn: (seconds: string, attempt: number, of: number) => `Retrying in ${seconds} · try ${attempt} of ${of}`,
  failed: (reason: string) => `Didn’t upload: ${reason}`,
  uploadFailed: 'The upload failed.',
  /** The demo's broken connection. */
  connectionReset: 'The connection was reset.',
  /** A row's buttons. */
  pause: (name: string) => `Pause ${name}`,
  resume: (name: string) => `Resume ${name}`,
  cancel: (name: string) => `Cancel ${name}`,
  retry: (name: string) => `Retry ${name}`,
  open: (name: string) => `Open ${name}`,
  remove: (name: string) => `Remove ${name} from the list`,
  progressText: (loaded: string, size: string, left: string) => `${loaded} of ${size}, ${left}`,
  /** The footer. */
  settled: (done: number, total: number) => `${done} of ${total} done`,
  clearDone: 'Clear finished',
  /** Closing while files move. */
  confirmTitle: (count: number) => `Cancel ${count} ${plural(count, 'upload', 'uploads')}?`,
  confirmBody: 'Files that finished stay uploaded. The rest stop now.',
  keep: 'Keep uploading',
  confirmCancel: 'Cancel uploads',
  /** The page's drop overlay. */
  dropTitle: 'Drop to upload',
  dropTo: (destination: string) => `Files go to ${destination}`,
  dropCount: (count: number) => `${count} ${plural(count, 'file', 'files')}`,
  /** The demo's marker. */
  demoData: 'Demo data',
  /** Announced. */
  started: (count: number, destination: string) => `Uploading ${count} ${plural(count, 'file', 'files')} to ${destination}`,
  uploadedOne: (name: string) => `${name} uploaded`,
  failedOne: (name: string, reason: string) => `${name} didn’t upload: ${reason}`,
  allDone: (count: number) => `All ${count} ${plural(count, 'upload', 'uploads')} complete`,
  wentOffline: 'You’re offline. Uploads are paused.',
  backOnline: 'Back online. Uploads are resuming.',
}

export type UploadTrayCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its sizes, rates and times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte']

/** Bytes, or bytes a second, in the locale: "6.8 MB", "18.9 MB/s" (1024 to the kilobyte, so a rate reads in a size's units). */
export function formatBytes(bytes: number, locale: string, perSecond = false) {
  const i = Math.min(UNITS.length - 1, Math.max(0, Math.floor(Math.log(Math.max(1, bytes)) / Math.log(1024))))
  const value = bytes / 1024 ** i
  return numberFormat(locale, {
    style: 'unit',
    unit: `${UNITS[i]}${perSecond ? '-per-second' : ''}`,
    unitDisplay: i === 0 && !perSecond ? 'long' : 'short',
    maximumFractionDigits: i > 0 && value < 100 ? 1 : 0,
  }).format(value)
}

/** Time left as a person would say it: a few seconds, 40 seconds, 3 minutes, 1 hr 20 min. Rounded up, so it never promises too soon. */
export function formatLeft(seconds: number, copy: UploadTrayCopy) {
  if (!Number.isFinite(seconds) || seconds < 0) return copy.calculating
  if (seconds < 10) return copy.fewSeconds
  const unit = (value: number, name: string, display: 'long' | 'short' = 'long') =>
    numberFormat(copy.locale, { style: 'unit', unit: name, unitDisplay: display }).format(value)
  if (seconds < 60) return copy.timeLeft(unit(Math.ceil(seconds / 10) * 10, 'second'))
  if (seconds < 3600) return copy.timeLeft(unit(Math.ceil(seconds / 60), 'minute'))
  const h = Math.floor(seconds / 3600)
  const m = Math.ceil((seconds % 3600) / 60)
  return copy.timeLeft(m ? `${unit(h, 'hour', 'short')} ${unit(m, 'minute', 'short')}` : unit(h, 'hour'))
}

/** Seconds to a retry, written short: "3 sec". */
export const formatSeconds = (seconds: number, locale: string) =>
  numberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(Math.max(1, Math.round(seconds)))

/** The demo's upload: its own bandwidth with some jitter, breaking once where it's told to. */
/** Resolves when the tab is shown again (or the upload stops). */
const shown = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const done = () => {
      if (document.hidden && !signal.aborted) return
      document.removeEventListener('visibilitychange', done)
      signal.removeEventListener('abort', done)
      resolve()
    }
    document.addEventListener('visibilitychange', done)
    signal.addEventListener('abort', done)
  })

export async function simulate(
  item: UploadTrayItem & { bandwidth?: number; breakAt?: number },
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
  attempt: number,
  copy: UploadTrayCopy,
) {
  let loaded = item.loaded
  const bandwidth = item.bandwidth ?? 4 * 1024 * 1024
  while (loaded < item.size) {
    await demo('UploadTray: onUpload', 250, !!item.file)
    if (signal.aborted) throw new Error('Aborted')
    // A hidden tab holds the demo without a timer running: it waits to be shown again.
    if (typeof document !== 'undefined' && document.hidden) await shown(signal)
    loaded = Math.min(item.size, loaded + bandwidth * 0.25 * (0.75 + Math.random() * 0.5))
    if (item.breakAt !== undefined && attempt === 1 && loaded >= item.size * item.breakAt) throw new Error(copy.connectionReset)
    onProgress(loaded)
  }
}
