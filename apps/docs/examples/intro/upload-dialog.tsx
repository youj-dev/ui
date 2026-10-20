'use client'

import { useEffect, useId, useState } from 'react'
import { useYouj } from '@youj/core'
import { CheckIcon, FileImageIcon, FileSpreadsheetIcon, FileTextIcon } from '@youj/icons'
import { IllustrationCloud, IllustrationSuccess } from '@youj/illustrations'
import { ContentSwap } from '@youj/motion'
import { Button, DialogFooter, DialogHeader, Progress } from '@youj/react'

// Each file starts and finishes at its own time (ms), like a real batch.
const FILES = [
  { name: 'brand-guide.pdf', size: '2.4 MB', icon: FileTextIcon, start: 0, end: 2100 },
  { name: 'hero-photo.png', size: '1.8 MB', icon: FileImageIcon, start: 250, end: 2900 },
  { name: 'q3-budget.xlsx', size: '640 KB', icon: FileSpreadsheetIcon, start: 500, end: 1600 },
]
const DONE = Math.max(...FILES.map((f) => f.end))

// A stand-in for the upload: progress by time, eased so each file slows as it lands.
function progress(file: (typeof FILES)[number], t: number) {
  const x = Math.min(1, Math.max(0, (t - file.start) / (file.end - file.start)))
  return Math.round((1 - (1 - x) ** 1.6) * 100)
}

// Shown in place, as an open dialog resting in the page. In an app it is a
// DialogContent opened by your upload button, with these same parts inside.
export default function IntroUploadDialog() {
  const { reduced } = useYouj()
  const id = useId()
  const [t, setT] = useState(reduced ? DONE : 0)

  useEffect(() => {
    if (reduced) return setT(DONE)
    const from = performance.now()
    const timer = setInterval(() => {
      const now = performance.now() - from
      setT(Math.min(now, DONE))
      if (now >= DONE) clearInterval(timer)
    }, 120)
    return () => clearInterval(timer)
  }, [reduced])

  const finished = FILES.filter((f) => progress(f, t) === 100).length
  const done = finished === FILES.length

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-slot="dialog-content"
      data-yj-tone="overlay"
      // The working density: 16px sides and 12px bands, so it sits small in the page.
      // own: as in DialogContent, so Bezel's dialog recipe (head, body, footer band) still applies.
      data-yj-density="compact"
      className="yj-dialog relative flex w-full max-w-md flex-col own:gap-3 own:rounded-xl border border-line own:bg-overlay own:p-4 text-ui text-fg shadow-lg"
    >
      <DialogHeader className="flex-row items-center gap-3.5">
        <div
          aria-hidden
          className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line-subtle bg-well bg-[radial-gradient(var(--color-line)_0.6px,transparent_0.8px)] bg-size-[--spacing(1.5)_--spacing(1.5)] bg-center [--yj-anim-paper:var(--color-well)] [&_[data-slot=iso-scene]]:-mx-[20%] [&_[data-slot=iso-scene]]:w-[140%]! [&_[data-slot=iso-scene]]:max-w-none!"
        >
          <ContentSwap loading={!done} fallback={<IllustrationCloud float={false} />} className="w-full">
            <IllustrationSuccess float={false} />
          </ContentSwap>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={`${id}-title`} className="text-base leading-6 font-semibold tracking-tight text-fg">
            Upload 3 files
          </h2>
          <p aria-live="polite" className="text-sm text-fg-muted">
            {done ? 'Added to Orion / Assets' : `Uploading to Orion · ${finished} of ${FILES.length}`}
          </p>
        </div>
      </DialogHeader>

      <ul className="flex flex-col gap-3">
        {FILES.map((file) => {
          const value = progress(file, t)
          const Icon = file.icon
          return (
            <li key={file.name} className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line-subtle bg-well text-fg-muted">
                <Icon size={15} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-fg">{file.name}</span>
                  <span className="shrink-0 text-xs text-fg-muted tabular-nums">{value === 100 ? file.size : `${value}%`}</span>
                </div>
                <Progress value={value} aria-label={`${file.name} upload`} />
              </div>
              <span className="grid size-5 shrink-0 place-items-center text-accent">
                {value === 100 && <CheckIcon size={16} strokeWidth={2.5} trigger="mount" />}
              </span>
            </li>
          )
        })}
      </ul>

      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button disabled={!done}>Done</Button>
      </DialogFooter>
    </section>
  )
}
