/* What a drop on the page hands over, and a small picture of each file.
 * - Folders: their entries are taken while the drop event lasts (the browser
 *   empties the list after) and read recursively, a directory reader's
 *   batches until it returns none; each file keeps its folder. System files
 *   (.DS_Store, Thumbs.db, anything hidden, __MACOSX) are left out.
 * - Pictures: an image is decoded once and drawn small, a video gives up a
 *   frame from a second in; each is an object URL the queue revokes. What
 *   can't be read resolves with nothing and the row keeps its glyph. */

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  pdf: 'application/pdf',
  zip: 'application/zip',
  csv: 'text/csv',
}

const extension = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

/** A file's type, from its extension when the browser gives none. */
export const typeOf = (file: { name: string; type: string }) => (file.type || MIME[extension(file.name)] || '').toLowerCase()

/** A file and the folder it came from. */
export interface Picked {
  file: File
  path?: string
}

const hidden = (segment: string) => segment.startsWith('.') || segment === '__MACOSX' || /^(?:thumbs\.db|desktop\.ini)$/i.test(segment)
const folderOf = (relative: string) => relative.replace(/^\//, '').split('/').slice(0, -1).join('/') || undefined

/** Whether a drag carries files (not text or a link). */
export const carriesFiles = (data: DataTransfer | null) => Array.from(data?.types ?? []).includes('Files')

/** How many files a drag holds, when the browser says (folders count as one). */
export const dragCount = (data: DataTransfer | null) => Array.from(data?.items ?? []).filter((item) => item.kind === 'file').length

/** Takes a drop's files, reading any folder in it whole. Call it inside the drop event. */
export function takeDrop(data: DataTransfer): Promise<Picked[]> {
  const entries = Array.from(data.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is FileSystemEntry => entry !== null)
  if (!entries.some((entry) => entry.isDirectory))
    return Promise.resolve(
      Array.from(data.files)
        .filter((file) => !hidden(file.name))
        .map((file) => ({ file })),
    )
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
    if (hidden(entry.name)) return []
    if (entry.isDirectory) return (await Promise.all((await childrenOf(entry as FileSystemDirectoryEntry)).map(walk))).flat()
    try {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject))
      return [{ file, path: folderOf(entry.fullPath) }]
    } catch {
      return []
    }
  }
  return Promise.all(entries.map(walk)).then((all) => all.flat())
}

/** Draws a picture so its short side is `edge` px and returns it as an object URL. */
function draw(source: CanvasImageSource, width: number, height: number, edge: number) {
  const scale = Math.min(1, edge / Math.max(1, Math.min(width, height)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(undefined)
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise<string | undefined>((resolve) =>
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : undefined), 'image/webp', 0.82),
  )
}

function frame(file: File, edge: number) {
  return new Promise<string | undefined>((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    const done = (preview?: string) => {
      clearTimeout(timer)
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
      resolve(preview)
    }
    const timer = setTimeout(() => done(), 8000)
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (Number.isFinite(video.duration) ? video.duration : 0) / 4)
    }
    video.onseeked = () => void draw(video, video.videoWidth, video.videoHeight, edge).then(done)
    video.onerror = () => done()
    video.src = url
  })
}

let chain: Promise<unknown> = Promise.resolve()

/** A small picture of the file (an image's thumbnail, a video's frame), one file at a time. */
export function thumbnail(file: File, edge = 72): Promise<string | undefined> {
  const run = async () => {
    if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return undefined
    const type = typeOf(file)
    try {
      if (type.startsWith('video/')) return await frame(file, edge)
      if (!type.startsWith('image/') || typeof createImageBitmap !== 'function') return undefined
      const bitmap = await createImageBitmap(file)
      try {
        return await draw(bitmap, bitmap.width, bitmap.height, edge)
      } finally {
        bitmap.close()
      }
    } catch {
      return undefined
    }
  }
  const next = chain.then(run, run)
  chain = next
  return next
}
