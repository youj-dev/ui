/* Pictures of files without holding them whole. An image is decoded once
 * and drawn small (a 40 MB photo becomes a few kilobytes of WebP, so a
 * folder of them doesn't fill memory), keeping its size in pixels; a video
 * gives up a frame from a second in (a quarter of the way through a shorter
 * one), its size and running time; an audio file its running time. Every
 * preview is an object URL the caller owns and revokes. Browser only; what
 * can't be read (a HEIC outside Safari) resolves with nothing, so the row
 * keeps its glyph. One file is described at a time. */

import { typeOf } from './intake'

export interface Described {
  preview?: string
  width?: number
  height?: number
  duration?: number
}

const canvasUrl = (canvas: HTMLCanvasElement) =>
  new Promise<string | undefined>((resolve) => canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : undefined), 'image/webp', 0.82))

/** Draws a picture so its short side is `edge` px (never larger than it is) and returns it as an object URL. */
function thumbnail(source: CanvasImageSource, width: number, height: number, edge: number) {
  const scale = Math.min(1, edge / Math.max(1, Math.min(width, height)))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(undefined)
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvasUrl(canvas)
}

async function image(file: File, type: string, edge: number): Promise<Described> {
  if (type !== 'image/svg+xml' && typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    try {
      return { width: bitmap.width, height: bitmap.height, preview: await thumbnail(bitmap, bitmap.width, bitmap.height, edge) }
    } finally {
      bitmap.close()
    }
  }
  // A vector stays a vector: the file is its own preview.
  const url = URL.createObjectURL(file)
  const img = new Image()
  img.src = url
  try {
    await img.decode()
    return { width: img.naturalWidth || undefined, height: img.naturalHeight || undefined, preview: url }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('unreadable')
  }
}

/** Loads a media element from the file and settles with what `read` gets from it (or nothing, after a while). */
function media<T extends HTMLMediaElement>(file: File, tag: 'video' | 'audio', read: (el: T, done: (result: Described) => void) => void) {
  return new Promise<Described>((resolve) => {
    const url = URL.createObjectURL(file)
    const el = document.createElement(tag) as T
    let settled = false
    const done = (result: Described) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      el.removeAttribute('src')
      el.load()
      URL.revokeObjectURL(url)
      resolve(result)
    }
    const timer = setTimeout(() => done({}), 8000)
    el.muted = true
    el.preload = 'metadata'
    el.onerror = () => done({})
    read(el, done)
    el.src = url
  })
}

const seconds = (el: HTMLMediaElement) => (Number.isFinite(el.duration) ? el.duration : undefined)

function video(file: File, edge: number) {
  return media<HTMLVideoElement>(file, 'video', (el, done) => {
    el.playsInline = true
    el.onloadedmetadata = () => {
      el.currentTime = Math.min(1, (seconds(el) ?? 0) / 4)
    }
    el.onseeked = () => {
      const { videoWidth: width, videoHeight: height } = el
      void thumbnail(el, width, height, edge).then((preview) =>
        done({ width: width || undefined, height: height || undefined, duration: seconds(el), preview }),
      )
    }
  })
}

function audio(file: File) {
  return media<HTMLAudioElement>(file, 'audio', (el, done) => {
    el.onloadedmetadata = () => done({ duration: seconds(el) })
  })
}

let chain: Promise<unknown> = Promise.resolve()

/** What a file looks like and measures: a thumbnail and pixel size for an image, a frame, size and running time for a video, a running time for audio. Queued, one at a time. */
export function describe(file: File, edge = 96): Promise<Described> {
  const run = async (): Promise<Described> => {
    if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return {}
    const type = typeOf(file)
    try {
      if (type.startsWith('image/')) return await image(file, type, edge)
      if (type.startsWith('video/')) return await video(file, edge)
      if (type.startsWith('audio/')) return await audio(file)
    } catch {
      // Not readable here: the row keeps its glyph.
    }
    return {}
  }
  const next = chain.then(run, run)
  chain = next
  return next
}
