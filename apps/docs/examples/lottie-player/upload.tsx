'use client'

import { useEffect, useState } from 'react'
import { useYouj } from '@youj/core'
import { FileTextIcon, UploadIcon } from '@youj/icons'
import { LottiePlayer } from '@youj/motion/players'

const FILES = [
  { name: 'q3-board-deck.pdf', size: '4.2 MB' },
  { name: 'brand-guidelines.pdf', size: '12.8 MB' },
  { name: 'launch-film.mp4', size: '86.1 MB' },
]

export default function LottiePlayerUpload() {
  const k = useYouj()
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(0)
  const running = started && done < FILES.length
  const finished = started && done === FILES.length

  // Stands in for the uploads: one file lands every two deliberate beats.
  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => setDone((n) => n + 1), k.ms('deliberate') * 2)
    return () => clearTimeout(timer)
  }, [running, done, k])

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-2 shadow-sm">
      <ul className="divide-y divide-line">
        {FILES.map((file, i) => {
          const complete = i < done
          return (
            <li key={file.name} className="flex items-center gap-3 px-3 py-2.5">
              <FileTextIcon size={16} className="text-fg-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{file.name}</p>
                <p className="text-xs text-fg-muted">{complete ? 'Uploaded' : started ? 'Uploading' : file.size}</p>
              </div>
              {started &&
                (complete ? (
                  <LottiePlayer src="/samples/success-check.json" playing label="Uploaded" className="size-7" />
                ) : (
                  <LottiePlayer src="/samples/upload-progress.json" autoplay loop label="Uploading" className="size-7" />
                ))}
            </li>
          )
        })}
      </ul>
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-3 pt-3 pb-1.5">
        <p role="status" className="text-xs text-fg-muted">
          {started ? `${done} of ${FILES.length} uploaded` : `${FILES.length} files ready`}
        </p>
        <button
          type="button"
          onClick={() => {
            if (running) return
            setDone(0)
            setStarted(!finished)
          }}
          aria-disabled={running}
          className="inline-flex items-center gap-1.5 rounded-lg bg-fg px-3 py-1.5 text-xs font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none aria-disabled:opacity-60"
        >
          <UploadIcon size={14} />
          {finished ? 'Clear' : 'Upload'}
        </button>
      </div>
    </div>
  )
}
