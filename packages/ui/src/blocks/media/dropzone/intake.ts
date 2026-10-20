/* Getting files in, read the way people mean them.
 * - A drop: plain files from `dataTransfer.files`; a folder through its
 *   entries (taken while the drop event lasts, since the browser empties the
 *   list after), read recursively. A directory reader hands its entries over
 *   in batches (a hundred at a time in Chrome) until it returns none, so it's
 *   read until then. Each file keeps its folder's path.
 * - System files a folder brings along (.DS_Store, Thumbs.db, AppleDouble
 *   `._` files, anything hidden, __MACOSX) are left out and counted.
 * - A paste: a screenshot arrives as "image.png", so a clipboard image gets
 *   a name from the moment it was pasted, as a screenshot would.
 * - Types: the input's own `accept` syntax (`.pdf`, `image/png`, `image/*`),
 *   with the type read from the extension when the browser gives none
 *   (HEIC, Markdown on some systems). While a drag is over, the browser
 *   shows the types but not the names, so a drag is checked by type alone. */

import type { MediaDropzoneCopy, MediaDropzoneRejection } from './data'
import { formatBytes } from './data'

/** A file, and its folder inside a dropped or picked folder. */
export interface Picked {
  file: File
  path?: string
}

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  pdf: 'application/pdf',
  zip: 'application/zip',
  json: 'application/json',
  csv: 'text/csv',
  md: 'text/markdown',
  txt: 'text/plain',
}

export const extension = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** A file's type, from its extension when the browser gives none. */
export const typeOf = (file: { name: string; type: string }) => (file.type || MIME[extension(file.name)] || '').toLowerCase()

/** The rules of an `accept` string, lowercased. */
export const rulesOf = (accept?: string) =>
  (accept ?? '')
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)

const typeMatches = (type: string, rule: string) => (rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule)

/** Whether a file passes the rules: by extension, by type, or by a type family. */
export function accepts(name: string, type: string, rules: string[]) {
  if (rules.length === 0) return true
  const lower = name.toLowerCase()
  return rules.some((rule) => (rule.startsWith('.') ? lower.endsWith(rule) || MIME[rule.slice(1)] === type : typeMatches(type, rule)))
}

/** A drag's files as the browser reveals them while they're over: how many, and how many the rules turn away. Folders and files of no known type count as accepted. */
export function dragSummary(data: DataTransfer | null, rules: string[]) {
  if (!data || !Array.from(data.types ?? []).includes('Files')) return null
  const items = Array.from(data.items ?? []).filter((item) => item.kind === 'file')
  const known = (type: string) => !!type && rules.length > 0
  const refused = items.filter(
    (item) =>
      known(item.type) &&
      !rules.some((rule) =>
        rule.startsWith('.') ? MIME[rule.slice(1)] === item.type || !MIME[rule.slice(1)] : typeMatches(item.type.toLowerCase(), rule),
      ),
  ).length
  return { count: items.length, refused }
}

/** How a format is usually written, where its extension or subtype isn't. */
const FORMAT: Record<string, string> = {
  jpeg: 'JPG',
  webp: 'WebP',
  quicktime: 'MOV',
  'svg+xml': 'SVG',
  mpeg: 'MP3',
  'x-m4v': 'M4V',
  'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

/** "JPG, PNG or PDF" from the rules. */
export function describeRules(rules: string[], copy: MediaDropzoneCopy) {
  const names = rules.map((rule) => {
    if (rule.endsWith('/*')) return copy.typeGroup(rule.slice(0, -2))
    const name = rule.startsWith('.') ? rule.slice(1) : (rule.split('/')[1] ?? rule)
    return FORMAT[name] ?? name.toUpperCase()
  })
  return copy.types([...new Set(names)])
}

const SYSTEM = /^(?:\.ds_store|thumbs\.db|desktop\.ini|icon\r)$/i
const hidden = (segment: string) => segment.startsWith('.') || segment === '__MACOSX'
const isSystem = (name: string, path?: string) => SYSTEM.test(name) || hidden(name) || (path ?? '').split('/').some(hidden)

/** The folder part of a relative path: `lookbook/day-2/a.jpg` → `lookbook/day-2`. */
const folderOf = (relative: string) => relative.replace(/^\//, '').split('/').slice(0, -1).join('/') || undefined

/** A drop's folder entries, taken while the event lasts; none when it holds only files. */
export function folderEntries(data: DataTransfer) {
  const entries = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is FileSystemEntry => entry !== null)
  return entries.some((entry) => entry.isDirectory) ? entries : []
}

/** Every file under the entries, in name order, each with its folder; system files are left out and counted. Stops near `limit`. */
export async function readEntries(entries: FileSystemEntry[], onCount?: (count: number) => void, limit = 5000) {
  let count = 0
  let skipped = 0
  const fileOf = (entry: FileSystemFileEntry) => new Promise<File>((resolve, reject) => entry.file(resolve, reject))
  const childrenOf = async (dir: FileSystemDirectoryEntry) => {
    const reader = dir.createReader()
    const all: FileSystemEntry[] = []
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
      if (batch.length === 0) return all.sort((a, b) => a.name.localeCompare(b.name))
      all.push(...batch)
    }
  }
  const walk = async (entry: FileSystemEntry): Promise<Picked[]> => {
    if (count >= limit) return []
    const path = folderOf(entry.fullPath)
    if (isSystem(entry.name, entry.isFile ? path : undefined)) {
      skipped++
      return []
    }
    if (entry.isDirectory) return (await Promise.all((await childrenOf(entry as FileSystemDirectoryEntry)).map(walk))).flat()
    try {
      const file = await fileOf(entry as FileSystemFileEntry)
      onCount?.(++count)
      return [{ file, path }]
    } catch {
      return []
    }
  }
  const picked = (await Promise.all(entries.map(walk))).flat()
  return { picked, skipped }
}

/** Files from a picker, with the folder of each when a folder was picked; system files left out and counted. */
export function fromInput(files: FileList | File[]) {
  let skipped = 0
  const picked: Picked[] = []
  for (const file of Array.from(files)) {
    const path = file.webkitRelativePath ? folderOf(file.webkitRelativePath) : undefined
    if (isSystem(file.name, path)) skipped++
    else picked.push({ file, path })
  }
  return { picked, skipped }
}

const pad = (n: number) => String(n).padStart(2, '0')
/** A file-name-safe moment: 2026-10-10 14.32.05. */
export const stamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`

/** The files a paste carries, a clipboard image (named "image.png" by the browser) named by the moment instead. */
export function fromPaste(data: DataTransfer | null, name: (stamp: string) => string, now = new Date()): File[] {
  return Array.from(data?.files ?? []).map((file, i) => {
    if (file.name && !/^image\.\w+$/i.test(file.name)) return file
    const ext = Object.entries(MIME).find(([, type]) => type === file.type)?.[0] ?? (extension(file.name) || 'png')
    return new File([file], `${name(stamp(now))}${i ? ` (${i + 1})` : ''}.${ext}`, { type: file.type, lastModified: file.lastModified })
  })
}

export interface Rules {
  accept: string[]
  maxSize?: number
  minSize: number
  maxFiles?: number
  maxTotalSize?: number
}

interface Held {
  name: string
  size: number
  path?: string
}

const keyOf = (f: Held) => `${f.path ?? ''}/${f.name}:${f.size}`

/** Splits incoming files into the ones the rules take and the ones they don't, each refusal with its reason. Count and space are shared with what's already held. */
export function check(incoming: Picked[], held: Held[], rules: Rules, copy: MediaDropzoneCopy) {
  const accepted: Picked[] = []
  const rejected: MediaDropzoneRejection[] = []
  const known = new Set(held.map(keyOf))
  let total = held.reduce((sum, f) => sum + f.size, 0)
  let count = held.length
  const size = (bytes: number) => formatBytes(bytes, copy.locale)
  for (const { file, path } of incoming) {
    const name = file.name
    const reason =
      file.size < rules.minSize
        ? copy.empty(name)
        : !accepts(name, typeOf(file), rules.accept)
          ? copy.notAccepted(name, describeRules(rules.accept, copy))
          : rules.maxSize !== undefined && file.size > rules.maxSize
            ? copy.tooLarge(name, size(file.size), size(rules.maxSize))
            : known.has(keyOf({ name, size: file.size, path }))
              ? copy.duplicate(name)
              : rules.maxFiles !== undefined && count >= rules.maxFiles
                ? copy.tooMany(name, rules.maxFiles)
                : rules.maxTotalSize !== undefined && total + file.size > rules.maxTotalSize
                  ? copy.overBudget(name, size(Math.max(0, rules.maxTotalSize - total)))
                  : null
    if (reason) {
      rejected.push({ name, reason })
      continue
    }
    known.add(keyOf({ name, size: file.size, path }))
    total += file.size
    count++
    accepted.push({ file, path })
  }
  return { accepted, rejected }
}
