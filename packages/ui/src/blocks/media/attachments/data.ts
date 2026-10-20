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

export interface AttachmentComposerFile {
  id: string
  name: string
  /** In bytes. */
  size: number
  /** MIME type. */
  type: string
  /** A picture of it: an image's own URL. Made from the file when it's attached. */
  preview?: string
  status: 'uploading' | 'done' | 'error'
  /** 0–100 while it uploads. */
  progress?: number
  /** Why it failed. */
  error?: string
  /** The file itself (absent on ones attached before). */
  file?: File
  /** What `onUpload` resolved with: a URL, a key. */
  result?: unknown
}

export interface AttachmentComposerMessage {
  text: string
  /** In the order they were arranged. */
  attachments: AttachmentComposerFile[]
}

export interface AttachmentComposerUploadContext {
  /** Aborted when the file is removed or the block unmounts. */
  signal: AbortSignal
  /** Report progress, 0–100. */
  onProgress: (percent: number) => void
}

const MB = 1024 * 1024
/** Where the demo's photos are served from: the Youj site, so a copied block shows them in any app. */
const P = 'https://www.youj.dev/blocks/products'

/** A support reply part-way written: two photos in, a replacement order uploading. */
export const DEMO_ATTACHMENTS: AttachmentComposerFile[] = [
  { id: 'lid', name: 'batch-check-lid.webp', size: 1.6 * MB, type: 'image/webp', preview: `${P}/kettle-cream.webp`, status: 'done' },
  { id: 'side', name: 'batch-check-side.webp', size: 1.5 * MB, type: 'image/webp', preview: `${P}/kettle-cream-side.webp`, status: 'done' },
  { id: 'order', name: 'replacement-order-4821.pdf', size: 0.4 * MB, type: 'application/pdf', status: 'uploading', progress: 46 },
]

export const DEMO_TEXT = 'Sorry about the lid, Priya. A replacement is on its way today; photos from the batch check and the order are attached.'

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Reply to Priya Raman',
  description: 'Ticket 4821 · Ridge kettle arrived with a cracked lid',
  message: 'Reply',
  placeholder: 'Write a reply… paste or drop files to attach them',
  attach: 'Attach files',
  attachments: 'Attachments',
  dropHere: 'Drop to attach',
  /** The attachments' row before there are any. */
  noFiles: 'Attach, paste or drop files',
  /** A chip. */
  uploading: (percent: number) => `uploading, ${percent}%`,
  failed: (reason: string) => `didn’t upload: ${reason}`,
  uploadFailed: 'The upload failed.',
  remove: (name: string) => `Remove ${name}`,
  retry: (name: string) => `Retry ${name}`,
  retryShort: 'Retry',
  keys: (modifier: string) => `${modifier} and the arrow keys move it, Delete removes it, Enter opens it.`,
  /** The footer line. */
  count: (count: number, max: number, size: string) => `${count} of ${max} files · ${size}`,
  send: 'Send',
  sending: 'Sending…',
  sent: 'Sent',
  sendFailed: 'Couldn’t send',
  /** Send pressed while files still upload: it waits. */
  waiting: (count: number) => `Sends when ${count} ${plural(count, 'file finishes', 'files finish')}`,
  blocked: (count: number) => `${count} ${plural(count, 'file', 'files')} didn’t upload. Retry or remove ${plural(count, 'it', 'them')} to send.`,
  /** The send shortcut, shown beside Send. */
  shortcut: (modifier: string) => `${modifier}↵`,
  /** Refusals. */
  notAccepted: (name: string) => `${name} isn’t a file you can attach here.`,
  tooLarge: (name: string, size: string, max: string) => `${name} is ${size}, over the ${max} limit.`,
  tooMany: (max: number) => `You can attach ${max} files at most.`,
  /** A pasted image's name, from the moment it was pasted. */
  pastedName: (stamp: string) => `Pasted image ${stamp}`,
  /** The preview. */
  open: 'Open in a new tab',
  close: 'Close',
  /** Announced. */
  attached: (count: number) => `${count} ${plural(count, 'file', 'files')} attached`,
  removed: (name: string) => `${name} removed`,
  moved: (name: string, position: number, total: number) => `${name} moved to ${position} of ${total}`,
  uploadedOne: (name: string) => `${name} uploaded`,
  failedOne: (name: string, reason: string) => `${name} didn’t upload: ${reason}`,
  sentMessage: 'Reply sent',
}

export type AttachmentComposerCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its sizes are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
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

const pad = (n: number) => String(n).padStart(2, '0')
/** A file-name-safe moment: 2026-10-10 14.32.05. */
export const stamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`
