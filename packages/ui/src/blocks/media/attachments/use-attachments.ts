'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { demo, formatBytes, type AttachmentComposerCopy, type AttachmentComposerFile, type AttachmentComposerUploadContext } from './data'

/* The attachments and their uploads. Each file uploads the moment it's
 * attached (through `onUpload`, or a simulated upload), in the order shown,
 * which the person can change. `settled()` resolves once nothing is
 * uploading, or rejects with the files that failed: Send waits on it. A
 * removed file stops uploading and gives back its picture; so does
 * unmounting. */

let seq = 0
const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)
const objectUrl = (file: File) => {
  try {
    return URL.createObjectURL(file)
  } catch {
    return undefined
  }
}

interface Options {
  initial: AttachmentComposerFile[]
  accept: string
  maxFiles: number
  maxSize: number
  onUpload?: (file: File, context: AttachmentComposerUploadContext) => Promise<unknown> | unknown
  onAttachmentsChange?: (files: AttachmentComposerFile[]) => void
  copy: AttachmentComposerCopy
  announce: (message: string, options?: { assertive?: boolean; delay?: number }) => void
}

const accepts = (file: File, accept: string) =>
  accept
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .some((rule) =>
      rule.startsWith('.')
        ? file.name.toLowerCase().endsWith(rule)
        : rule.endsWith('/*')
          ? file.type.startsWith(rule.slice(0, -1))
          : file.type === rule,
    )

export function useAttachments(options: Options) {
  const opts = useRef(options)
  useLayoutEffect(() => {
    opts.current = options
  })
  const [files, setFiles] = useState(options.initial)
  const [refused, setRefused] = useState<string[]>([])
  const ref = useRef(files)
  const controllers = useRef(new Map<string, AbortController>())
  const urls = useRef(new Set<string>())
  const waiters = useRef(new Set<() => void>())

  const update = (next: (all: AttachmentComposerFile[]) => AttachmentComposerFile[]) => {
    ref.current = next(ref.current)
    setFiles(ref.current)
    opts.current.onAttachmentsChange?.(ref.current)
    for (const wake of waiters.current) wake()
  }
  const patch = (id: string, change: Partial<AttachmentComposerFile>) => update((all) => all.map((f) => (f.id === id ? { ...f, ...change } : f)))
  const alive = (id: string) => ref.current.some((f) => f.id === id)

  const start = (item: AttachmentComposerFile) => {
    const { onUpload, copy, announce } = opts.current
    const controller = new AbortController()
    controllers.current.set(item.id, controller)
    patch(item.id, { status: 'uploading', progress: item.progress ?? 0, error: undefined })
    const onProgress = (percent: number) => {
      if (!controller.signal.aborted && alive(item.id)) patch(item.id, { progress: Math.max(0, Math.min(100, percent)) })
    }
    const simulate = async () => {
      for (let p = item.progress ?? 0; p < 100; p += 9 + Math.random() * 12) {
        await demo('AttachmentComposer: onUpload', 220, !!item.file)
        if (controller.signal.aborted) throw new Error('Canceled')
        onProgress(p)
      }
    }
    Promise.resolve()
      .then(() => (item.file && onUpload ? onUpload(item.file, { signal: controller.signal, onProgress }) : simulate()))
      .then(
        (result) => {
          if (controller.signal.aborted || !alive(item.id)) return
          patch(item.id, { status: 'done', progress: 100, result })
          announce(copy.uploadedOne(item.name), { delay: 400 })
        },
        (error: unknown) => {
          if (controller.signal.aborted || !alive(item.id)) return
          const reason = messageOf(error, copy.uploadFailed)
          patch(item.id, { status: 'error', error: reason })
          announce(copy.failedOne(item.name, reason), { assertive: true })
        },
      )
      .finally(() => controllers.current.delete(item.id))
  }

  const add = (incoming: File[]) => {
    const { accept, maxFiles, maxSize, copy, announce } = opts.current
    if (incoming.length === 0) return
    const reasons: string[] = []
    const taken: AttachmentComposerFile[] = []
    for (const file of incoming) {
      if (!accepts(file, accept)) reasons.push(copy.notAccepted(file.name))
      else if (file.size > maxSize) reasons.push(copy.tooLarge(file.name, formatBytes(file.size, copy.locale), formatBytes(maxSize, copy.locale)))
      else if (ref.current.length + taken.length >= maxFiles) {
        if (!reasons.includes(copy.tooMany(maxFiles))) reasons.push(copy.tooMany(maxFiles))
      } else {
        const preview = file.type.startsWith('image/') ? objectUrl(file) : undefined
        if (preview) urls.current.add(preview)
        taken.push({ id: `attachment-${++seq}`, name: file.name, size: file.size, type: file.type, preview, status: 'uploading', progress: 0, file })
      }
    }
    setRefused(reasons)
    if (reasons.length) announce(reasons.join(' '), { assertive: true })
    if (taken.length === 0) return
    update((all) => [...all, ...taken])
    announce(copy.attached(taken.length))
    taken.forEach(start)
  }

  const remove = (id: string) => {
    const item = ref.current.find((f) => f.id === id)
    if (!item) return
    controllers.current.get(id)?.abort()
    if (item.preview && urls.current.delete(item.preview)) URL.revokeObjectURL(item.preview)
    update((all) => all.filter((f) => f.id !== id))
    opts.current.announce(opts.current.copy.removed(item.name))
  }
  const retry = (id: string) => {
    const item = ref.current.find((f) => f.id === id)
    if (item?.status === 'error') start({ ...item, progress: 0 })
  }
  /** Moves a file to another place in the order. */
  const move = (id: string, to: number) => {
    const from = ref.current.findIndex((f) => f.id === id)
    if (from < 0) return
    const index = Math.max(0, Math.min(ref.current.length - 1, to))
    if (index === from) return
    update((all) => {
      const next = all.filter((f) => f.id !== id)
      next.splice(index, 0, all[from]!)
      return next
    })
    const { copy, announce } = opts.current
    announce(copy.moved(ref.current[index]!.name, index + 1, ref.current.length))
  }
  /** Resolves once nothing uploads; rejects with the ids that failed. */
  const settled = () =>
    new Promise<void>((resolve, reject) => {
      const check = () => {
        if (ref.current.some((f) => f.status === 'uploading')) return false
        waiters.current.delete(check)
        const failed = ref.current.filter((f) => f.status === 'error').map((f) => f.id)
        if (failed.length) reject(failed)
        else resolve()
        return true
      }
      if (!check()) waiters.current.add(check)
    })
  const clear = () => {
    for (const c of controllers.current.values()) c.abort()
    for (const url of urls.current) URL.revokeObjectURL(url)
    urls.current.clear()
    setRefused([])
    update(() => [])
  }

  // The demo's upload already in flight carries on; on unmount every upload stops and every picture is given back.
  const begin = useRef(() => {
    for (const item of ref.current) if (item.status === 'uploading' && !controllers.current.has(item.id)) start(item)
  })
  useEffect(() => {
    const live = controllers.current
    const made = urls.current
    begin.current()
    return () => {
      for (const c of live.values()) c.abort()
      live.clear()
      for (const url of made) URL.revokeObjectURL(url)
    }
  }, [])

  /** The attachments as they are now (an awaited Send reads them after its wait). */
  const current = () => ref.current

  return { files, refused, add, remove, retry, move, settled, clear, current }
}
