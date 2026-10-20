'use client'

import { useEffect, useState } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import {
  AlertTriangleIcon,
  CheckIcon,
  FileArchiveIcon,
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileTextIcon,
  FileVideoIcon,
  PlayIcon,
  RefreshIcon,
  XIcon,
} from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { formatBytes, formatLeft, formatSeconds, type UploadTrayCopy, type UploadTrayItem } from './data'

/* One file in the tray: its picture, its name with the extension always in
 * view, a line that says where it is (bytes of the size and the speed while
 * it moves, queued, paused, waiting for the connection, the countdown to a
 * retry, or why it stopped) and two buttons. The first is its ring: the
 * progress drawn around a pause mark that shows on hover or focus (a play
 * mark when paused, a retry arrow when it's stuck), so the ring is the
 * control; the second cancels it, or takes a finished one off the list. */

/** The file's kind, as a glyph. */
function FileGlyph({ type, size }: { type: string; size: number }) {
  if (type.startsWith('image/')) return <FileImageIcon size={size} strokeWidth={1.5} />
  if (type.startsWith('video/')) return <FileVideoIcon size={size} strokeWidth={1.5} />
  if (type.startsWith('audio/')) return <FileAudioIcon size={size} strokeWidth={1.5} />
  if (type === 'application/pdf' || type.startsWith('text/')) return <FileTextIcon size={size} strokeWidth={1.5} />
  if (/zip|compressed|tar/.test(type)) return <FileArchiveIcon size={size} strokeWidth={1.5} />
  return <FileIcon size={size} strokeWidth={1.5} />
}

/** Progress as a ring that fills clockwise from the top on the smooth spring. */
export function Ring({ value, tone, className }: { value: number; tone: 'accent' | 'muted' | 'warning' | 'danger' | 'success'; className?: string }) {
  const k = useYouj()
  const stroke = {
    accent: 'stroke-accent',
    muted: 'stroke-fg-subtle',
    warning: 'stroke-warning',
    danger: 'stroke-danger',
    success: 'stroke-success',
  }[tone]
  return (
    <MotionFeatures>
      <svg aria-hidden viewBox="0 0 24 24" className={cn('size-6 -rotate-90', className)}>
        <circle cx="12" cy="12" r="9.5" fill="none" strokeWidth={2} className="stroke-well" />
        <m.circle
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          className={cn(stroke, 'transition-[stroke] yj-duration-fast ease-standard')}
          initial={false}
          // Nothing yet draws nothing, not a dot.
          animate={{ pathLength: Math.max(0.001, Math.min(1, value)), opacity: value > 0 ? 1 : 0 }}
          transition={k.reduced ? { type: false } : k.spring('smooth')}
        />
      </svg>
    </MotionFeatures>
  )
}

/** Seconds until `at`, ticking while it's in the future. */
function useCountdown(at?: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!at) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [at])
  return at ? Math.max(0, (at - now) / 1000) : 0
}

interface RowProps {
  item: UploadTrayItem
  retries: number
  copy: UploadTrayCopy
  onPause: () => void
  onResume: () => void
  onRetry: () => void
  onCancel: () => void
  onRemove: () => void
}

export function Row({ item, retries, copy, onPause, onResume, onRetry, onCancel, onRemove }: RowProps) {
  const { status, name } = item
  const size = (bytes: number) => formatBytes(bytes, copy.locale)
  const left = useCountdown(status === 'retrying' ? item.retryAt : undefined)
  const fraction = item.size ? item.loaded / item.size : 0
  const dot = name.lastIndexOf('.')
  const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, '']
  const of = copy.of(size(item.loaded), size(item.size))
  const line = {
    uploading: item.rate ? `${of} · ${formatBytes(item.rate, copy.locale, true)}` : of,
    queued: `${copy.queued} · ${size(item.size)}`,
    paused: `${copy.pausedRow} · ${of}`,
    waiting: copy.waitingRow,
    retrying: copy.retryingIn(formatSeconds(left, copy.locale), item.attempt ?? 2, retries + 1),
    done: `${copy.uploadedRow} · ${size(item.size)}`,
    failed: copy.failed(item.error ?? copy.uploadFailed),
  }[status]
  const valueText =
    status === 'uploading' && item.rate
      ? copy.progressText(size(item.loaded), size(item.size), formatLeft((item.size - item.loaded) / item.rate, copy))
      : line
  const ring = {
    uploading: { tone: 'accent', label: copy.pause(name), act: onPause, mark: 'pause' },
    queued: { tone: 'muted', label: copy.pause(name), act: onPause, mark: 'pause' },
    paused: { tone: 'muted', label: copy.resume(name), act: onResume, mark: 'play' },
    waiting: { tone: 'warning', label: copy.pause(name), act: onPause, mark: 'pause' },
    retrying: { tone: 'warning', label: copy.retry(name), act: onRetry, mark: 'retry' },
    failed: { tone: 'danger', label: copy.retry(name), act: onRetry, mark: 'retry' },
  } as const

  return (
    <div data-slot="upload-tray-row" data-status={status} className="flex items-center gap-3 px-(--ui--panel-x) py-2">
      <span aria-hidden className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-band text-fg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too */}
        {item.preview ? <img src={item.preview} alt="" decoding="async" className="size-full object-cover" /> : <FileGlyph type={item.type} size={16} />}
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] border border-line-subtle" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span dir="auto" className="flex min-w-0 text-ui font-medium text-fg">
          <span className="truncate">{base}</span>
          <span className="shrink-0">{ext}</span>
        </span>
        <span className={cn('truncate text-ui-sm tabular-nums', status === 'failed' ? 'text-danger-text' : 'text-fg-muted')}>{line}</span>
      </div>
      {/* A button's children are presentational, so the bar that reads out where it is sits beside the ring, not in it. */}
      {status !== 'done' && (
        <span
          role="progressbar"
          aria-label={name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction * 100)}
          aria-valuetext={valueText}
          className="sr-only"
        />
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {status === 'done' ? (
          <span className="grid size-control-sm place-items-center">
            <span className="grid size-5 place-items-center rounded-full bg-success-subtle text-success-text">
              <CheckIcon trigger="mount" size={12} strokeWidth={2.5} />
            </span>
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            // shape: the progress ring is drawn around this button, so it is round in every theme
            className="group/ring relative rounded-full"
            aria-label={ring[status].label}
            onClick={ring[status].act}
          >
            <Ring value={fraction} tone={ring[status].tone} />
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 grid place-items-center text-fg transition-opacity yj-duration-fast ease-standard',
                status === 'paused' || status === 'failed'
                  ? 'opacity-100'
                  : 'opacity-0 group-hover/ring:opacity-100 group-focus-visible/ring:opacity-100 touch:opacity-100',
              )}
            >
              {ring[status].mark === 'play' ? (
                <PlayIcon size={10} strokeWidth={2.5} className="ms-px fill-current rtl:-scale-x-100" />
              ) : ring[status].mark === 'retry' ? (
                status === 'failed' ? (
                  <AlertTriangleIcon size={11} strokeWidth={2.25} className="text-danger-text" />
                ) : (
                  <RefreshIcon size={11} strokeWidth={2.25} />
                )
              ) : (
                <span className="flex gap-0.5">
                  <span className="h-2 w-0.5 rounded-full bg-current" />
                  <span className="h-2 w-0.5 rounded-full bg-current" />
                </span>
              )}
            </span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={status === 'done' || status === 'failed' ? copy.remove(name) : copy.cancel(name)}
          onClick={status === 'done' || status === 'failed' ? onRemove : onCancel}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}
