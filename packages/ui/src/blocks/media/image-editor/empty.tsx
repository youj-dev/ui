'use client'

import { useState, useSyncExternalStore, type DragEvent } from 'react'
import { ImagePlusIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import type { ImageEditorCopy } from './data'

/* Before there's an image: the whole stage takes a drop, the button in its
 * middle opens the picker, and a paste anywhere in the block works too (the
 * block listens). The rules are under it, and a refusal says why. */

const subscribeNothing = () => () => {}
const isApple = () => /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')

interface EmptyProps {
  copy: ImageEditorCopy
  rules: string
  error?: string
  errorId: string
  onBrowse: () => void
  onFile: (file: File) => void
}

export function Empty({ copy, rules, error, errorId, onBrowse, onFile }: EmptyProps) {
  const [over, setOver] = useState(false)
  const apple = useSyncExternalStore(subscribeNothing, isApple, () => true)
  return (
    <div
      data-state={over ? 'over' : 'idle'}
      onDragEnter={(event) => carriesFiles(event) && setOver(true)}
      onDragOver={(event) => {
        if (!carriesFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOver(false)
      }}
      onDrop={(event) => {
        setOver(false)
        const file = event.dataTransfer?.files[0]
        if (!file) return
        event.preventDefault()
        onFile(file)
      }}
      className={cn('grid h-full place-items-center p-6 transition-colors yj-duration-fast ease-standard', 'data-[state=over]:bg-accent-subtle')}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          onClick={onBrowse}
          aria-describedby={error ? errorId : undefined}
          className="group/empty flex flex-col items-center gap-3 rounded-lg px-6 py-4 focus-ring"
        >
          <span className="grid size-12 place-items-center rounded-full border border-line bg-surface text-fg-muted shadow-xs transition-[color,scale] yj-duration-fast ease-standard group-hover/empty:text-fg in-data-[state=over]:scale-110 in-data-[state=over]:text-accent-text">
            <ImagePlusIcon size={22} strokeWidth={1.5} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-ui-lg font-medium text-fg">{copy.emptyTitle}</span>
            <span className="text-ui text-fg-muted">{copy.emptyHint(apple ? '⌘' : 'Ctrl+')}</span>
          </span>
        </button>
        <span className="text-ui-sm text-fg-subtle">{rules}</span>
        {error && (
          <p id={errorId} role="alert" className="max-w-sm text-ui-sm text-danger-text">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
