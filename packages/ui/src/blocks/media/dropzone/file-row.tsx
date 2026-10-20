'use client'

import {
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
import { Progress } from '../../../components/ui/progress'
import { Spinner } from '../../../components/ui/spinner'
import { cn, numberFormat } from '../../../lib/utils'
import { formatBytes, formatDuration, type MediaDropzoneCopy, type MediaDropzoneFile } from './data'

/* One file: its picture (a thumbnail, a video's frame with a play mark, or
 * the type's glyph), its name, and a line that says where it is: checking,
 * waiting its turn, a bar with the percentage while it uploads, its size in
 * pixels, running time and bytes once it's in, or why it failed with Retry.
 * The end button cancels an upload or removes a stored file. */

/** The file's kind, as a glyph. */
function FileGlyph({ type, size }: { type: string; size: number }) {
  if (type.startsWith('image/')) return <FileImageIcon size={size} strokeWidth={1.5} />
  if (type.startsWith('video/')) return <FileVideoIcon size={size} strokeWidth={1.5} />
  if (type.startsWith('audio/')) return <FileAudioIcon size={size} strokeWidth={1.5} />
  if (type === 'application/pdf' || type.startsWith('text/')) return <FileTextIcon size={size} strokeWidth={1.5} />
  if (/zip|compressed|tar|rar/.test(type)) return <FileArchiveIcon size={size} strokeWidth={1.5} />
  return <FileIcon size={size} strokeWidth={1.5} />
}

function Thumb({ item }: { item: MediaDropzoneFile }) {
  return (
    <span aria-hidden className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-md bg-band text-fg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too */}
      {item.preview ? <img src={item.preview} alt="" decoding="async" className="size-full object-cover" /> : <FileGlyph type={item.type} size={18} />}
      {item.preview && item.type.startsWith('video/') && (
        <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--color-shadow)_36%,transparent)] text-[white]">
          <PlayIcon size={12} strokeWidth={2} className="fill-current" />
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] border border-line-subtle" />
    </span>
  )
}

interface FileRowProps {
  item: MediaDropzoneFile
  copy: MediaDropzoneCopy
  onRemove: () => void
  onRetry: () => void
}

export function FileRow({ item, copy, onRemove, onRetry }: FileRowProps) {
  const { status, name } = item
  const percent = Math.round(item.progress ?? 0)
  const facts = [
    item.duration !== undefined && formatDuration(item.duration, copy.locale),
    item.width && item.height && copy.dimensions(item.width, item.height),
    formatBytes(item.size, copy.locale),
  ].filter(Boolean) as string[]
  const busy = status === 'uploading' || status === 'queued' || status === 'checking'

  return (
    <div data-slot="media-dropzone-file" data-status={status} className={cn('flex items-center gap-3 py-2.5', status === 'removing' && 'opacity-60')}>
      <Thumb item={item} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span dir="auto" className="flex min-w-0 items-baseline text-ui">
          {item.path && <span className="min-w-0 shrink truncate text-fg-subtle">{item.path}/</span>}
          <span className="max-w-full min-w-0 shrink-0 truncate font-medium text-fg">{name}</span>
        </span>
        {status === 'uploading' ? (
          <span className="flex items-center gap-2.5">
            <Progress value={item.progress ?? null} aria-label={copy.uploading(name, percent)} className="flex-1" />
            <span className="w-9 shrink-0 text-end text-ui-sm text-fg-muted tabular-nums">
              {numberFormat(copy.locale, { style: 'percent' }).format(percent / 100)}
            </span>
          </span>
        ) : (
          <span
            className={cn('flex min-w-0 items-center gap-1.5 text-ui-sm', status === 'error' || item.error ? 'text-danger-text' : 'text-fg-muted')}
          >
            {status === 'error' ? (
              <span className="truncate">{copy.failed(item.error ?? copy.uploadFailed)}</span>
            ) : status === 'removing' ? (
              <span>{copy.removing}</span>
            ) : item.error ? (
              <span className="truncate">{item.error}</span>
            ) : (
              <>
                <span className="truncate tabular-nums">{facts.join(' · ')}</span>
                {status === 'done' && (
                  <span className="flex shrink-0 items-center gap-1 text-success-text">
                    <span aria-hidden>·</span>
                    <CheckIcon trigger="mount" size={12} strokeWidth={2.5} />
                    {copy.uploaded}
                  </span>
                )}
                {status === 'checking' && <span className="shrink-0">· {copy.checking}</span>}
                {status === 'queued' && <span className="shrink-0">· {copy.queued}</span>}
              </>
            )}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {status === 'error' && (
          <Button variant="ghost" size="icon-sm" aria-label={copy.retry(name)} onClick={onRetry}>
            <RefreshIcon size={16} strokeWidth={1.75} />
          </Button>
        )}
        {status === 'removing' ? (
          <span className="grid size-control-sm place-items-center text-fg-muted">
            <Spinner size={14} label={null} />
          </span>
        ) : (
          <Button
            data-slot="media-dropzone-remove"
            variant="ghost"
            size="icon-sm"
            aria-label={busy ? copy.cancel(name) : copy.remove(name)}
            onClick={onRemove}
          >
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  )
}
