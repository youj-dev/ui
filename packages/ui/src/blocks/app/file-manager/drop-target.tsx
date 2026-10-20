'use client'

import { CloudUploadIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'

/** The full-surface target that fades in while files are dragged over the pane. */
export function DropTarget({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-canvas transition-opacity yj-duration-fast ease-standard',
        active ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className={cn('flex flex-col items-center gap-2 text-accent-text transition-[translate] yj-duration-base ease-emphasized', active ? 'translate-y-0' : 'translate-y-2')}>
        <CloudUploadIcon size={36} strokeWidth={1.5} />
        <span className="text-lg font-semibold">{label}</span>
      </div>
    </div>
  )
}
