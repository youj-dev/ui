'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CloudUploadIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import type { UploadTrayCopy } from './data'
import { carriesFiles, dragCount, takeDrop, type Picked } from './files'

/* The page as a drop target. While files are dragged anywhere over the
 * window, a veil settles over the page with a dashed frame and a card that
 * says where they'll go and how many are coming; dropping anywhere uploads
 * them. A drop something else on the page already took (a drop zone inside
 * it) is left alone, and a drop outside any target never opens the file in
 * the tab. The veil only fades and the frame eases in on the CSS spring;
 * under reduced motion it just appears. */

export function DropOverlay({ copy, disabled, onFiles }: { copy: UploadTrayCopy; disabled: boolean; onFiles: (files: Picked[]) => void }) {
  const [count, setCount] = useState<number | null>(null)
  const take = useRef(onFiles)
  useLayoutEffect(() => {
    take.current = onFiles
  })

  useEffect(() => {
    if (disabled) return
    let depth = 0
    const enter = (event: DragEvent) => {
      if (!carriesFiles(event.dataTransfer)) return
      depth++
      setCount(dragCount(event.dataTransfer))
    }
    const leave = (event: DragEvent) => {
      if (!carriesFiles(event.dataTransfer)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setCount(null)
    }
    const over = (event: DragEvent) => {
      if (!carriesFiles(event.dataTransfer)) return
      event.preventDefault()
      if (event.dataTransfer && !event.defaultPrevented) event.dataTransfer.dropEffect = 'copy'
    }
    const drop = (event: DragEvent) => {
      depth = 0
      setCount(null)
      if (!event.dataTransfer || !carriesFiles(event.dataTransfer)) return
      // Taken by a drop target inside the page already.
      if (event.defaultPrevented) return
      event.preventDefault()
      void takeDrop(event.dataTransfer)
        .then((files) => take.current(files))
        .catch(() => {})
    }
    const end = () => {
      depth = 0
      setCount(null)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    window.addEventListener('dragend', end)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
      window.removeEventListener('dragend', end)
    }
  }, [disabled])

  const on = count !== null && !disabled
  return (
    <div
      aria-hidden
      data-slot="upload-tray-drop"
      data-state={on ? 'open' : 'closed'}
      className={cn(
        'pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 opacity-0 transition-opacity yj-duration-fast ease-standard data-[state=open]:opacity-100',
        'bg-[color-mix(in_oklab,var(--color-canvas)_72%,transparent)] backdrop-blur-sm',
      )}
    >
      <div
        className={cn(
          'absolute inset-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border-2 border-dashed border-accent',
          'scale-[0.985] transition-transform [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))] ease-spring in-data-[state=open]:scale-100',
        )}
      />
      <div className="relative flex flex-col items-center gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-overlay px-8 py-6 text-center text-fg shadow-lg">
        <span className="grid size-12 place-items-center rounded-full bg-accent-subtle text-accent-text">
          <CloudUploadIcon size={24} strokeWidth={1.75} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-ui-lg font-semibold">{copy.dropTitle}</span>
          <span className="text-ui text-fg-muted">{copy.dropTo(copy.destination)}</span>
        </span>
        {!!count && (
          <span className="rounded-full bg-band px-2.5 py-0.5 text-ui-sm font-medium text-fg-muted tabular-nums">{copy.dropCount(count)}</span>
        )}
      </div>
    </div>
  )
}
