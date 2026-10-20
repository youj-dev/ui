'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  demo,
  type MediaLibraryAsset,
  type MediaLibraryCopy,
  type MediaLibraryFilter,
  type MediaLibraryKind,
  type MediaLibrarySort,
  type MediaLibraryUpload,
} from './data'

/* The library's state: which folder, search, type and order are showing,
 * the ordered selection (with its maximum), and files uploading into the
 * open folder. A new upload is a tile at the front that fills as it goes;
 * once it's stored it takes what `onUpload` resolved with and, while there's
 * room, joins the selection (you uploaded it to use it). */

let seq = 0
const kindOf = (type: string): MediaLibraryKind =>
  type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : type.startsWith('audio/') ? 'audio' : 'document'
/** A picture of a picked file, where the browser can make one. */
const objectUrl = (file: File) => {
  try {
    return URL.createObjectURL(file)
  } catch {
    return undefined
  }
}
const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

interface LibraryOptions {
  assets: MediaLibraryAsset[]
  selection: string[]
  setSelection: (next: string[]) => void
  max?: number
  onUpload?: MediaLibraryUpload
  copy: MediaLibraryCopy
  announce: (message: string, options?: { assertive?: boolean; delay?: number }) => void
}

export function useLibrary({ assets, selection, setSelection, max, onUpload, copy, announce }: LibraryOptions) {
  const [uploads, setUploads] = useState<MediaLibraryAsset[]>([])
  const [folder, setFolder] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<MediaLibraryFilter>('all')
  const [sort, setSort] = useState<MediaLibrarySort>('newest')
  const [failures, setFailures] = useState<string[]>([])
  const [full, setFull] = useState(false)
  const latest = useRef({ selection, uploads })
  useLayoutEffect(() => {
    latest.current = { selection, uploads }
  })
  const controllers = useRef(new Set<AbortController>())
  const urls = useRef(new Set<string>())

  const items = [...uploads, ...assets]
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shown = items
    .filter((a) => (folder === null || a.folder === folder) && (filter === 'all' || a.kind === filter))
    .filter((a) => words.every((w) => `${a.name} ${a.alt ?? ''}`.toLowerCase().includes(w)))
  const order: Record<MediaLibrarySort, (a: MediaLibraryAsset, b: MediaLibraryAsset) => number> = {
    newest: (a, b) => b.addedAt - a.addedAt,
    oldest: (a, b) => a.addedAt - b.addedAt,
    name: (a, b) => a.name.localeCompare(b.name, copy.locale),
    largest: (a, b) => b.size - a.size,
  }
  // Uploads in flight lead, in the order they were dropped; the rest follow the sort.
  const visible = [...shown.filter((a) => a.progress !== undefined), ...shown.filter((a) => a.progress === undefined).sort(order[sort])]

  const nameOf = (id: string) => items.find((a) => a.id === id)?.name ?? id
  const room = (count: number) => (max === undefined ? Number.POSITIVE_INFINITY : Math.max(0, max - count))

  const toggle = (id: string) => {
    const now = latest.current.selection
    if (now.includes(id)) {
      setSelection(now.filter((s) => s !== id))
      setFull(false)
      return announce(copy.deselectedOne(nameOf(id)))
    }
    if (room(now.length) === 0) {
      setFull(true)
      return announce(copy.full(max!), { assertive: true })
    }
    setSelection([...now, id])
    announce(copy.selectedOne(nameOf(id), now.length + 1))
  }
  /** Adds everything between two tiles (as shown), as far as there's room. */
  const extend = (from: string, to: string) => {
    const ids = visible.filter((a) => a.progress === undefined).map((a) => a.id)
    const [i, j] = [ids.indexOf(from), ids.indexOf(to)].sort((a, b) => a - b)
    if (i! < 0) return toggle(to)
    const now = latest.current.selection
    const adding = ids.slice(i, j! + 1).filter((id) => !now.includes(id))
    const taken = adding.slice(0, room(now.length))
    setFull(taken.length < adding.length)
    setSelection([...now, ...taken])
    announce(copy.selected(now.length + taken.length, max))
  }
  const selectAll = () => extend(visible[0]?.id ?? '', visible.at(-1)?.id ?? '')
  const clear = () => {
    setSelection([])
    setFull(false)
    announce(copy.cleared)
  }

  const upload = (files: File[]) => {
    for (const file of files) {
      const id = `upload-${++seq}`
      const preview = file.type.startsWith('image/') ? objectUrl(file) : undefined
      if (preview) urls.current.add(preview)
      const asset: MediaLibraryAsset = {
        id,
        name: file.name,
        kind: kindOf(file.type),
        preview,
        size: file.size,
        folder: folder ?? undefined,
        addedAt: Date.now(),
        progress: 0,
      }
      setUploads((now) => [asset, ...now])
      const controller = new AbortController()
      controllers.current.add(controller)
      const onProgress = (percent: number) => {
        if (!controller.signal.aborted)
          setUploads((now) => now.map((a) => (a.id === id ? { ...a, progress: Math.min(99, Math.max(0, percent)) } : a)))
      }
      const simulate = async () => {
        for (let p = 0; p < 100; p += 12 + Math.random() * 14) {
          await demo('MediaLibrary: onUpload', 140)
          onProgress(p)
        }
      }
      Promise.resolve()
        .then(() => (onUpload ? onUpload(file, { signal: controller.signal, onProgress, folder: folder ?? undefined }) : simulate()))
        .then(
          (stored) => {
            if (controller.signal.aborted) return
            setUploads((now) => now.map((a) => (a.id === id ? { ...a, ...(stored || {}), progress: undefined } : a)))
            const chosen = latest.current.selection
            if (room(chosen.length) > 0) setSelection([...chosen, (stored && stored.id) || id])
            announce(copy.uploadedOne(file.name), { delay: 300 })
          },
          (error: unknown) => {
            if (controller.signal.aborted) return
            setUploads((now) => now.filter((a) => a.id !== id))
            const reason = copy.failedOne(file.name, messageOf(error, copy.uploadFailed))
            setFailures((now) => [...now, reason])
            announce(reason, { assertive: true })
          },
        )
        .finally(() => controllers.current.delete(controller))
    }
  }

  useEffect(() => {
    const live = controllers.current
    const made = urls.current
    return () => {
      for (const c of live) c.abort()
      for (const url of made) URL.revokeObjectURL(url)
    }
  }, [])

  return {
    items,
    visible,
    folder,
    setFolder,
    query,
    setQuery,
    filter,
    setFilter,
    sort,
    setSort,
    full,
    failures,
    dismissFailures: () => setFailures([]),
    toggle,
    extend,
    selectAll,
    clear,
    upload,
  }
}
