'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { demo, type MediaDropzoneCopy, type MediaDropzoneFile, type MediaDropzoneRejection, type MediaDropzoneUploadContext } from './data'
import { check, typeOf, type Picked, type Rules } from './intake'
import { describe } from './preview'

/* The files and their uploads. Accepted files are described (thumbnail,
 * size in pixels, running time), checked where the rules need their
 * contents (an image's dimensions, the app's own `validate`), then uploaded
 * three at a time through `onUpload`; without it, a simulated upload stands
 * in. A removed file aborts its upload and gives back its preview's memory,
 * and so does unmounting. Everything here reads refs, so a callback that
 * lands late (an upload settling) always sees the current files. */

const CONCURRENCY = 3
let seq = 0

export interface FilesOptions {
  initial: MediaDropzoneFile[]
  rules: Rules
  minDimensions?: { width: number; height: number }
  validate?: (file: File) => string | null | undefined | Promise<string | null | undefined>
  onUpload?: (file: File, context: MediaDropzoneUploadContext) => Promise<unknown> | unknown
  onRemove?: (file: MediaDropzoneFile) => Promise<unknown> | unknown
  onFilesChange?: (files: MediaDropzoneFile[]) => void
  onReject?: (rejections: MediaDropzoneRejection[]) => void
  copy: MediaDropzoneCopy
  announce: (message: string, options?: { assertive?: boolean; delay?: number }) => void
}

export interface Refusals {
  rejected: MediaDropzoneRejection[]
  skipped: number
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : typeof error === 'string' && error ? error : fallback

/** The demo's upload: a few megabytes a second, held while the tab is hidden. */
async function simulate(item: MediaDropzoneFile, signal: AbortSignal, onProgress: (percent: number) => void) {
  let percent = item.progress ?? 0
  // About 2.5 MB a second, a step every 160 ms.
  const step = Math.max(1, Math.min(18, (40 * 1024 * 1024) / Math.max(1, item.size)))
  while (percent < 100) {
    await demo('MediaDropzone: onUpload', 160, !!item.file)
    if (signal.aborted) throw new Error('Canceled')
    if (typeof document !== 'undefined' && document.hidden) continue
    percent = Math.min(100, percent + step * (0.7 + Math.random() * 0.6))
    onProgress(percent)
  }
}

export function useFiles(options: FilesOptions) {
  const opts = useRef(options)
  useLayoutEffect(() => {
    opts.current = options
  })
  const [files, setFiles] = useState(options.initial)
  const [refusals, setRefusals] = useState<Refusals | null>(null)
  const filesRef = useRef(files)
  const controllers = useRef(new Map<string, AbortController>())
  const owned = useRef(new Set<string>())

  const update = (next: (all: MediaDropzoneFile[]) => MediaDropzoneFile[]) => {
    const value = next(filesRef.current)
    filesRef.current = value
    setFiles(value)
    opts.current.onFilesChange?.(value)
  }
  const patch = (id: string, change: Partial<MediaDropzoneFile>) => update((all) => all.map((f) => (f.id === id ? { ...f, ...change } : f)))
  const alive = (id: string) => filesRef.current.some((f) => f.id === id)
  const release = (preview?: string) => {
    if (preview && owned.current.delete(preview)) URL.revokeObjectURL(preview)
  }

  const pump = () => {
    let free = CONCURRENCY - filesRef.current.filter((f) => f.status === 'uploading').length
    for (const item of filesRef.current) {
      if (free <= 0) return
      if (item.status !== 'queued') continue
      free--
      start(item)
    }
  }

  const start = (item: MediaDropzoneFile) => {
    const { onUpload, copy, announce } = opts.current
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    patch(item.id, { status: 'uploading', progress: item.progress ?? null, error: undefined })
    const onProgress = (percent: number) => {
      if (!controller.signal.aborted && alive(item.id)) patch(item.id, { progress: Math.max(0, Math.min(100, percent)) })
    }
    Promise.resolve()
      .then(() =>
        item.file && onUpload
          ? onUpload(item.file, { signal: controller.signal, onProgress, path: item.path })
          : simulate(item, controller.signal, onProgress),
      )
      .then(
        (result) => {
          if (controller.signal.aborted || !alive(item.id)) return
          patch(item.id, { status: 'done', progress: 100, result, error: undefined })
          announce(copy.uploadedOne(item.name), { delay: 400 })
        },
        (error: unknown) => {
          if (controller.signal.aborted || !alive(item.id)) return
          const reason = messageOf(error, copy.uploadFailed)
          patch(item.id, { status: 'error', error: reason })
          announce(copy.failedOne(item.name, reason), { assertive: true })
        },
      )
      .finally(() => {
        if (controllers.current.get(item.id) === controller) controllers.current.delete(item.id)
        pump()
      })
  }

  /** Describes a new file, runs the checks that need its contents, then queues it. */
  const prepare = async (item: MediaDropzoneFile, file: File) => {
    const { minDimensions, validate, copy } = opts.current
    const described = await describe(file)
    if (described.preview) owned.current.add(described.preview)
    if (!alive(item.id)) return release(described.preview)
    patch(item.id, described)
    if (item.status !== 'checking') return
    let reason: string | null | undefined = null
    if (minDimensions && typeOf(file).startsWith('image/')) {
      const { width, height } = described
      if (!width || !height) reason = copy.unreadable(item.name)
      else if (width < minDimensions.width || height < minDimensions.height)
        reason = copy.tooSmall(item.name, copy.dimensions(width, height), copy.dimensions(minDimensions.width, minDimensions.height))
    }
    if (!reason && validate) reason = await Promise.resolve(validate(file)).catch((error: unknown) => messageOf(error, copy.uploadFailed))
    if (!alive(item.id)) return
    if (reason) {
      const rejection = { name: item.name, reason }
      release(described.preview)
      update((all) => all.filter((f) => f.id !== item.id))
      setRefusals((now) => ({ rejected: [...(now?.rejected ?? []), rejection], skipped: now?.skipped ?? 0 }))
      opts.current.onReject?.([rejection])
      opts.current.announce(copy.refused(1), { delay: 400 })
      return
    }
    patch(item.id, { status: 'queued' })
    pump()
  }

  const add = (incoming: Picked[], skipped = 0) => {
    const { rules, minDimensions, validate, copy, announce } = opts.current
    if (incoming.length === 0 && skipped === 0) return
    const { accepted, rejected } = check(incoming, filesRef.current, rules, copy)
    const checks = !!minDimensions || !!validate
    const items: MediaDropzoneFile[] = accepted.map(({ file, path }) => ({
      id: `file-${++seq}`,
      name: file.name,
      size: file.size,
      type: typeOf(file),
      path,
      file,
      status: checks ? 'checking' : 'queued',
      progress: null,
    }))
    setRefusals(rejected.length || skipped ? { rejected, skipped } : null)
    if (rejected.length) opts.current.onReject?.(rejected)
    if (items.length) update((all) => [...all, ...items])
    announce([items.length && copy.added(items.length), rejected.length && copy.refused(rejected.length)].filter(Boolean).join(', '))
    accepted.forEach(({ file }, i) => void prepare(items[i]!, file))
    pump()
  }

  const remove = async (id: string) => {
    const item = filesRef.current.find((f) => f.id === id)
    if (!item || item.status === 'removing') return
    const { onRemove, copy, announce } = opts.current
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    if (item.status === 'done' && onRemove) {
      patch(id, { status: 'removing', error: undefined })
      try {
        await onRemove(item)
      } catch (error) {
        if (alive(id)) patch(id, { status: 'done', error: copy.removeFailed(messageOf(error, copy.uploadFailed)) })
        return
      }
    }
    release(item.preview)
    update((all) => all.filter((f) => f.id !== id))
    announce(copy.removed(item.name))
    pump()
  }

  const retry = (id: string) => {
    if (filesRef.current.find((f) => f.id === id)?.status !== 'error') return
    patch(id, { status: 'queued', error: undefined })
    pump()
  }

  // The uploads the block starts with carry on; on unmount every upload stops and every preview is given back.
  const begin = useRef(() => {
    for (const item of filesRef.current) if (item.status === 'uploading' && !controllers.current.has(item.id)) start(item)
  })
  useEffect(() => {
    const live = controllers.current
    const urls = owned.current
    begin.current()
    return () => {
      for (const controller of live.values()) controller.abort()
      live.clear()
      for (const url of urls) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  return { files, refusals, dismissRefusals: () => setRefusals(null), add, remove, retry }
}
