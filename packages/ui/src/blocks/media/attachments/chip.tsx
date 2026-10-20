'use client'

import { useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { animate, m, useMotionValue } from 'motion/react'
import { useYouj } from '@youj/core'
import { AlertTriangleIcon, FileArchiveIcon, FileAudioIcon, FileIcon, FileTextIcon, FileVideoIcon, RefreshIcon, XIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { formatBytes, type AttachmentComposerCopy, type AttachmentComposerFile } from './data'

/* One attachment. A picture shows itself; any other file its glyph, name
 * and size. While it uploads a ring fills over it; if it fails it turns to
 * danger and a press retries it. It's a button (Enter opens it, Delete
 * removes it, Alt or Option with an arrow moves it) and it can be dragged:
 * it follows the pointer, the others make room where it would land (a caret
 * shows the spot), and on release it glides from where it was let go into
 * its new place (FLIP) while the others glide aside on layout. */

/** The file's kind, as a glyph. */
function FileGlyph({ type, size }: { type: string; size: number }) {
  if (type.startsWith('video/')) return <FileVideoIcon size={size} strokeWidth={1.5} />
  if (type.startsWith('audio/')) return <FileAudioIcon size={size} strokeWidth={1.5} />
  if (type === 'application/pdf' || type.startsWith('text/')) return <FileTextIcon size={size} strokeWidth={1.5} />
  if (/zip|compressed|tar/.test(type)) return <FileArchiveIcon size={size} strokeWidth={1.5} />
  return <FileIcon size={size} strokeWidth={1.5} />
}

interface ChipProps {
  file: AttachmentComposerFile
  copy: AttachmentComposerCopy
  keysId: string
  /** This chip is the one being dragged. */
  dragging: boolean
  /** Just dropped: glide from where it was let go. */
  settling: boolean
  onOpen: () => void
  onRetry: () => void
  onRemove: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  onDragStart: () => void
  onDragMove: (x: number, y: number) => void
  onDrop: () => void
  onSettled: () => void
}

export function Chip({
  file,
  copy,
  keysId,
  dragging,
  settling,
  onOpen,
  onRetry,
  onRemove,
  onKeyDown,
  onDragStart,
  onDragMove,
  onDrop,
  onSettled,
}: ChipProps) {
  const k = useYouj()
  const button = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const released = useRef<DOMRect | null>(null)
  // A drag ends in a click; that one isn't a press.
  const dropped = useRef(false)
  const image = file.type.startsWith('image/') && !!file.preview
  const percent = Math.round(file.progress ?? 0)
  const state = file.status === 'uploading' ? copy.uploading(percent) : file.status === 'error' ? copy.failed(file.error ?? copy.uploadFailed) : null

  // Dropped: from where the pointer let go, into its new slot.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per drop, as the chip starts to settle
  useLayoutEffect(() => {
    if (!settling) return
    const from = released.current
    const to = button.current?.getBoundingClientRect()
    released.current = null
    if (!from || !to || k.reduced) {
      x.jump(0)
      y.jump(0)
      return onSettled()
    }
    x.jump(from.left - to.left + x.get())
    y.jump(from.top - to.top + y.get())
    void Promise.all([animate(x, 0, k.spring('smooth')), animate(y, 0, k.spring('smooth'))]).then(onSettled)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per drop, as the chip starts to settle
  }, [settling])

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return
    press.current = { x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const p = press.current
    if (!p) return
    const dx = event.clientX - p.x
    const dy = event.clientY - p.y
    if (!p.moved && Math.hypot(dx, dy) < 5) return
    if (!p.moved) onDragStart()
    p.moved = true
    x.jump(dx)
    y.jump(dy)
    onDragMove(event.clientX, event.clientY)
  }
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const p = press.current
    press.current = null
    if (!p?.moved) return
    event.preventDefault()
    dropped.current = true
    released.current = button.current?.getBoundingClientRect() ?? null
    x.jump(0)
    y.jump(0)
    onDrop()
  }

  return (
    <>
      <m.button
        ref={button}
        type="button"
        aria-label={[file.name, formatBytes(file.size, copy.locale), state].filter(Boolean).join(', ')}
        aria-describedby={keysId}
        onClick={() => {
          if (dropped.current) return void (dropped.current = false)
          if (file.status === 'error') onRetry()
          else onOpen()
        }}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ x, y }}
        data-status={file.status}
        className={cn(
          'group/chip relative flex h-14 touch-none items-center overflow-hidden rounded-lg border border-line bg-surface text-start select-none focus-ring',
          'transition-[box-shadow,border-color,scale] yj-duration-fast ease-standard',
          'data-[status=error]:border-danger',
          image ? 'w-14' : 'max-w-56 gap-2.5 ps-1.5 pe-3',
          dragging ? 'z-10 scale-[1.04] cursor-grabbing shadow-lg' : 'cursor-grab',
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
          <img src={file.preview} alt="" draggable={false} className="size-full object-cover" />
        ) : (
          <>
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
              <FileGlyph type={file.type} size={18} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span dir="auto" className="truncate text-ui-sm font-medium text-fg">
                {file.name}
              </span>
              <span className={cn('truncate text-ui-xs tabular-nums', file.status === 'error' ? 'text-danger-text' : 'text-fg-muted')}>
                {file.status === 'error' ? copy.retryShort : formatBytes(file.size, copy.locale)}
              </span>
            </span>
          </>
        )}
        {file.status === 'uploading' && (
          <span
            className={cn(
              'grid place-items-center',
              image ? 'absolute inset-0 bg-[color-mix(in_oklab,var(--color-canvas)_50%,transparent)]' : 'ms-auto ps-1',
            )}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-6 -rotate-90">
              <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.5" className="stroke-well" />
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${percent} 100`}
                className="stroke-accent transition-[stroke-dasharray] yj-duration-base ease-standard"
              />
            </svg>
          </span>
        )}
        {file.status === 'error' && image && (
          <span className="absolute inset-0 grid place-items-center bg-danger-subtle text-danger-text">
            <RefreshIcon size={16} strokeWidth={2} />
          </span>
        )}
        {file.status === 'error' && !image && <AlertTriangleIcon size={14} strokeWidth={2} className="ms-auto shrink-0 text-danger-text" />}
      </m.button>
      <button
        type="button"
        aria-label={copy.remove(file.name)}
        onClick={onRemove}
        className={cn(
          'absolute -end-1.5 -top-1.5 z-20 grid size-5 place-items-center rounded-full border border-line bg-overlay text-fg-muted shadow-sm',
          'transition-[opacity,color] yj-duration-fast ease-standard hover:text-fg focus-ring',
          'opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 group-focus-within/item:opacity-100 touch:opacity-100',
          dragging && 'invisible',
        )}
      >
        <XIcon size={11} strokeWidth={2.25} />
      </button>
    </>
  )
}
