'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { simulate, type UploadTrayContext, type UploadTrayCopy, type UploadTrayItem } from './data'
import { thumbnail, typeOf, type Picked } from './files'

/* The upload engine. A few files move at once (`concurrency`); the rest wait
 * their turn. Each upload gets an AbortSignal and the offset it resumes from,
 * so pausing aborts it and resuming starts again from the bytes already
 * stored (tus, S3 multipart); an uploader that can't resume reports from 0
 * and is followed. A failure retries by itself after each of `retryDelays`
 * (2, 5 and 10 seconds), then stops with its reason and a Retry. Going offline puts
 * every moving file on hold and coming back resumes them. Speed is an
 * exponentially weighted average (a two-second half-life), so the time left
 * doesn't jump with every packet. While real files move, closing the tab
 * asks first. Items without a file are the demo's and are simulated, held
 * while the tab is hidden. */

const ACTIVE: UploadTrayItem['status'][] = ['queued', 'uploading', 'waiting', 'retrying']
let seq = 0

export interface QueueOptions {
  initial: UploadTrayItem[]
  concurrency: number
  retryDelays: number[]
  onUpload?: (file: File, context: UploadTrayContext) => Promise<unknown> | unknown
  onItemsChange?: (items: UploadTrayItem[]) => void
  onComplete?: (items: UploadTrayItem[]) => void
  copy: UploadTrayCopy
  announce: (message: string, options?: { assertive?: boolean; delay?: number }) => void
}

interface Track {
  controller: AbortController
  last: { at: number; loaded: number }
}

const subscribeOnline = (notify: () => void) => {
  window.addEventListener('online', notify)
  window.addEventListener('offline', notify)
  return () => {
    window.removeEventListener('online', notify)
    window.removeEventListener('offline', notify)
  }
}

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : typeof error === 'string' && error ? error : fallback

export function useQueue(options: QueueOptions) {
  const opts = useRef(options)
  useLayoutEffect(() => {
    opts.current = options
  })
  const [items, setItems] = useState(options.initial)
  const itemsRef = useRef(items)
  const tracks = useRef(new Map<string, Track>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const owned = useRef(new Set<string>())
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
  const onlineRef = useRef(online)
  useLayoutEffect(() => {
    onlineRef.current = online
  })
  const settled = useRef(true)

  const update = (next: (all: UploadTrayItem[]) => UploadTrayItem[]) => {
    const value = next(itemsRef.current)
    itemsRef.current = value
    setItems(value)
    opts.current.onItemsChange?.(value)
  }
  const patch = (id: string, change: Partial<UploadTrayItem>) => update((all) => all.map((i) => (i.id === id ? { ...i, ...change } : i)))
  const find = (id: string) => itemsRef.current.find((i) => i.id === id)
  const release = (url?: string) => {
    if (url && owned.current.delete(url)) URL.revokeObjectURL(url)
  }
  const stop = (id: string) => {
    tracks.current.get(id)?.controller.abort()
    tracks.current.delete(id)
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }

  /** Says so once when the queue comes to rest. */
  const settle = () => {
    const all = itemsRef.current
    const busy = all.some((i) => ACTIVE.includes(i.status))
    if (busy) settled.current = false
    if (busy || settled.current || all.length === 0) return
    settled.current = true
    if (all.every((i) => i.status === 'done')) opts.current.announce(opts.current.copy.allDone(all.length), { delay: 700 })
    opts.current.onComplete?.(all)
  }

  const pump = () => {
    if (onlineRef.current) {
      let free = opts.current.concurrency - itemsRef.current.filter((i) => i.status === 'uploading').length
      for (const item of itemsRef.current) {
        if (free <= 0) break
        if (item.status !== 'queued') continue
        free--
        start(item)
      }
    }
    settle()
  }

  const start = (item: UploadTrayItem) => {
    const { onUpload, copy, announce, retryDelays } = opts.current
    const attempt = item.attempt ?? 1
    const controller = new AbortController()
    // The rate's clock starts with the upload itself, a tick later.
    const track: Track = { controller, last: { at: 0, loaded: item.loaded } }
    let rate: number | undefined
    tracks.current.set(item.id, track)
    patch(item.id, { status: 'uploading', error: undefined, retryAt: undefined, attempt })
    const onProgress = (loaded: number) => {
      if (controller.signal.aborted || !find(item.id)) return
      const value = Math.max(0, Math.min(item.size, loaded))
      const now = performance.now()
      const elapsed = now - track.last.at
      if (elapsed >= 250) {
        const sample = Math.max(0, ((value - track.last.loaded) / elapsed) * 1000)
        rate = rate === undefined ? sample : rate + (1 - Math.exp(-elapsed / 2000)) * (sample - rate)
        track.last = { at: now, loaded: value }
      }
      patch(item.id, { loaded: value, rate })
    }
    const context: UploadTrayContext = { signal: controller.signal, offset: item.loaded, onProgress, attempt, path: item.path }
    Promise.resolve()
      .then(() => {
        track.last = { at: performance.now(), loaded: item.loaded }
        return item.file && onUpload ? onUpload(item.file, context) : simulate(item, controller.signal, onProgress, attempt, copy)
      })
      .then(
        (result) => {
          if (controller.signal.aborted || !find(item.id)) return
          patch(item.id, { status: 'done', loaded: item.size, rate: undefined, result })
          announce(copy.uploadedOne(item.name), { delay: 400 })
        },
        (error: unknown) => {
          if (controller.signal.aborted || !find(item.id)) return
          const reason = messageOf(error, copy.uploadFailed)
          const delay = retryDelays[attempt - 1]
          if (delay !== undefined) {
            patch(item.id, { status: 'retrying', rate: undefined, attempt: attempt + 1, retryAt: Date.now() + delay, error: reason })
            schedule(item.id, delay)
          } else {
            patch(item.id, { status: 'failed', rate: undefined, error: reason })
            announce(copy.failedOne(item.name, reason), { assertive: true })
          }
        },
      )
      .finally(() => {
        if (tracks.current.get(item.id) === track) tracks.current.delete(item.id)
        pump()
      })
  }

  const schedule = (id: string, delay: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id)
        if (find(id)?.status !== 'retrying') return
        patch(id, { status: 'queued', retryAt: undefined })
        pump()
      }, delay),
    )
  }

  const add = (incoming: (File | Picked)[]) => {
    const { copy, announce } = opts.current
    const added: UploadTrayItem[] = incoming.map((entry) => {
      const { file, path } = entry instanceof File ? { file: entry, path: undefined } : entry
      return { id: `upload-${++seq}`, name: file.name, size: file.size, type: typeOf(file), loaded: 0, status: 'queued', file, path }
    })
    if (added.length === 0) return []
    update((all) => [...all, ...added])
    announce(copy.started(added.length, copy.destination))
    for (const item of added) {
      void thumbnail(item.file!).then((url) => {
        if (!url) return
        owned.current.add(url)
        if (find(item.id)) patch(item.id, { preview: url })
        else release(url)
      })
    }
    pump()
    return added
  }

  const pause = (id: string) => {
    const item = find(id)
    if (!item || !ACTIVE.includes(item.status)) return
    stop(id)
    patch(id, { status: 'paused', rate: undefined, retryAt: undefined })
    pump()
  }
  const resume = (id: string) => {
    if (find(id)?.status !== 'paused') return
    patch(id, { status: onlineRef.current ? 'queued' : 'waiting' })
    pump()
  }
  const retry = (id: string) => {
    const item = find(id)
    if (item?.status !== 'failed' && item?.status !== 'retrying') return
    stop(id)
    patch(id, { status: 'queued', attempt: item.status === 'failed' ? 1 : item.attempt, retryAt: undefined, error: undefined })
    pump()
  }
  const remove = (id: string) => {
    stop(id)
    release(find(id)?.preview)
    update((all) => all.filter((i) => i.id !== id))
    pump()
  }
  const pauseAll = () => itemsRef.current.filter((i) => ACTIVE.includes(i.status)).forEach((i) => pause(i.id))
  const resumeAll = () => itemsRef.current.filter((i) => i.status === 'paused').forEach((i) => resume(i.id))
  const clearDone = () => itemsRef.current.filter((i) => i.status === 'done').forEach((i) => remove(i.id))
  const clear = () => {
    for (const id of [...tracks.current.keys(), ...timers.current.keys()]) stop(id)
    for (const item of itemsRef.current) release(item.preview)
    settled.current = true
    update(() => [])
  }

  // Offline: what's moving waits, and nothing new starts; back online, it all carries on.
  // Every render's functions read refs, so the latest are the same as these.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on a change of connection only
  useEffect(() => {
    if (online) {
      for (const item of itemsRef.current) if (item.status === 'waiting') patch(item.id, { status: 'queued' })
      pump()
      return
    }
    for (const item of itemsRef.current) {
      if (item.status !== 'uploading' && item.status !== 'retrying') continue
      stop(item.id)
      patch(item.id, { status: 'waiting', rate: undefined, retryAt: undefined })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on a change of connection only
  }, [online])

  // The files the block starts with: the moving ones carry on, a retry counts down. On unmount everything stops and every preview is given back.
  const begin = useRef(() => {
    for (const item of itemsRef.current) {
      if (item.status === 'uploading' && !tracks.current.has(item.id)) start(item)
      if (item.status === 'retrying') {
        const { retryDelays } = opts.current
        const delay = retryDelays[Math.min(Math.max(0, (item.attempt ?? 2) - 2), retryDelays.length - 1)] ?? 0
        patch(item.id, { retryAt: Date.now() + delay })
        schedule(item.id, delay)
      }
    }
    pump()
  })
  useEffect(() => {
    const live = tracks.current
    const waits = timers.current
    const urls = owned.current
    begin.current()
    return () => {
      for (const track of live.values()) track.controller.abort()
      live.clear()
      for (const timer of waits.values()) clearTimeout(timer)
      waits.clear()
      for (const url of urls) URL.revokeObjectURL(url)
      urls.clear()
    }
  }, [])

  // Real files in flight: leaving the page asks first. (The demo's simulated ones don't hold the page.)
  const holding = items.some((i) => i.file && ACTIVE.includes(i.status))
  useEffect(() => {
    if (!holding) return
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [holding])

  return { items, online, add, pause, resume, retry, remove, pauseAll, resumeAll, clearDone, clear }
}
