import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { demo, type FileManagerFile } from './data'

export interface Upload {
  id: string
  name: string
  size: number
  progress: number
  /** Driven by the demo timer rather than your `onUpload`. */
  demo: boolean
}

/** Sends one file; report progress (0–100) as it goes and resolve with the stored file, or nothing to list it from its name and size. */
export type FileManagerUploadHandler = (file: File, onProgress: (percent: number) => void) => Promise<FileManagerFile | void> | FileManagerFile | void

export function useUploads(onDone: (upload: Upload, stored?: FileManagerFile) => void, onUpload?: FileManagerUploadHandler, onFail?: (upload: Upload, reason: unknown) => void) {
  const [uploads, setUploads] = useState<Upload[]>([])
  const done = useRef(onDone)
  const fail = useRef(onFail)
  useLayoutEffect(() => {
    done.current = onDone
    fail.current = onFail
  })
  const stored = useRef(new Map<string, FileManagerFile>())
  const active = uploads.some((u) => u.demo && u.progress < 100)
  useEffect(() => {
    if (!active) return
    // Demo transfer at a fixed network cadence: pass `onUpload` for your upload's progress events.
    const tick = setInterval(() => {
      setUploads((list) => list.map((u) => (u.demo ? { ...u, progress: Math.min(100, u.progress + Math.max(6, 400 / Math.sqrt(u.size / 1024 + 1))) } : u)))
    }, 280)
    return () => clearInterval(tick)
  }, [active])
  useEffect(() => {
    const finished = uploads.filter((u) => u.progress >= 100)
    if (finished.length === 0) return
    // Let the full bar register before the row leaves and the file lands.
    const settle = setTimeout(() => {
      finished.forEach((u) => {
        done.current(u, stored.current.get(u.id))
        stored.current.delete(u.id)
      })
      setUploads((list) => list.filter((u) => u.progress < 100))
    }, 400)
    return () => clearTimeout(settle)
  }, [uploads])
  const add = (files: File[]) => {
    const stamp = Date.now()
    const added = files.map((f, i) => ({ id: `u${stamp}-${i}`, name: f.name, size: f.size, progress: 0, demo: !onUpload }))
    setUploads((list) => [...list, ...added])
    if (!onUpload) return void demo('FileManager: onUpload', 0)
    const patch = (id: string, change: (u: Upload) => Upload) => setUploads((list) => list.map((u) => (u.id === id ? change(u) : u)))
    added.forEach((u, i) => {
      // Progress stops short of full until the upload resolves.
      const progress = (percent: number) => patch(u.id, (x) => ({ ...x, progress: Math.min(99, Math.max(x.progress, percent)) }))
      new Promise<FileManagerFile | void>((resolve) => resolve(onUpload(files[i]!, progress))).then(
        (file) => {
          if (file) stored.current.set(u.id, file)
          patch(u.id, (x) => ({ ...x, progress: 100 }))
        },
        (reason) => {
          setUploads((list) => list.filter((x) => x.id !== u.id))
          fail.current?.(u, reason)
        },
      )
    })
  }
  return { uploads, add }
}
