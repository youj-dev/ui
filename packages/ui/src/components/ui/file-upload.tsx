'use client'

import { fileUploadLabels } from '@youj/core/labels'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from 'react'
import { type YoujLabels } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { FileIcon } from '@youj/icons/components/youj/icons/file'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { ImageIcon } from '@youj/icons/components/youj/icons/image'
import { RefreshIcon } from '@youj/icons/components/youj/icons/refresh'
import { UploadIcon } from '@youj/icons/components/youj/icons/upload'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, formatBytes } from '../../lib/utils'
import { Button } from './button'
import { FieldError } from './field'
import { Progress, ProgressLabel, ProgressValue } from './progress'

/* Files in, with the whole lifecycle shown.
 * - The drop zone is a button (Enter or Space opens the picker) and a drop
 *   target; while a drag hovers it the border turns accent and motion's
 *   UploadIcon lifts. Its description states the rules (types, size, count).
 * - Files are checked against `accept`, `maxSize`, `maxFiles` and duplicates;
 *   rejections are listed in one alert that grows in under the zone.
 * - Accepted files join a PresenceList (they fade down into place while the
 *   rows below glide; removed rows fade and the rest close up) with an image
 *   thumbnail or a type glyph, and upload through `onUpload(file, { signal,
 *   onProgress })`: Progress glides with each report, the row settles into a
 *   drawn check, or shows the error with Retry. Removing a file mid-upload
 *   aborts it. Focus never drops to <body>: removing a row moves it to the
 *   next row's button, or back to the zone.
 * - `variant="gallery"` is for images: a grid of square tiles, with the zone
 *   as the last tile once there are files.
 * Every change is announced politely. Reduced motion: rows and tiles appear
 * and go at once, progress jumps. */

type UploadStatus = 'uploading' | 'done' | 'error'

interface UploadFile {
  id: string
  file: File
  status: UploadStatus
  /** 0–100, or null while the upload hasn't reported any. */
  progress: number | null
  error?: string
  /** An object URL for image files (revoked when the file is removed). */
  preview?: string
}

interface UploadContext {
  /** Aborted when the file is removed (or the component unmounts). */
  signal: AbortSignal
  /** Report progress, 0–100. */
  onProgress: (percent: number) => void
}

interface FileRejection {
  file: File
  message: string
}

interface UseFileUploadOptions {
  /** As the input's `accept`: extensions (`.pdf`), MIME types (`image/png`) or wildcards (`image/*`). */
  accept?: string
  /** In bytes. */
  maxSize?: number
  /** Total files allowed. */
  maxFiles?: number
  /** Uploads one file. Resolve when done; reject (or throw) to show the error. Without it, files are only collected. */
  onUpload?: (file: File, context: UploadContext) => Promise<unknown>
  onFilesChange?: (files: UploadFile[]) => void
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule,
    )
}

/** "PNG, JPG or PDF" from an accept string. */
function describeAccept(labels: Pick<YoujLabels, keyof typeof fileUploadLabels>, accept?: string) {
  if (!accept) return ''
  const names = [
    ...new Set(
      accept
        .split(',')
        .map((rule) => rule.trim())
        .filter(Boolean)
        .map((rule) => (rule.startsWith('.') ? rule.slice(1).toUpperCase() : rule.endsWith('/*') ? labels.fileTypeGroup(rule.slice(0, -2)) : rule.split('/')[1]!.toUpperCase()))
        .map((name) => (name === 'JPEG' ? 'JPG' : name)),
    ),
  ]
  return labels.fileTypeList(names)
}

let seq = 0
const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

/** The state behind FileUpload, for building your own layout around the same rules. */
function useFileUpload({ accept, maxSize, maxFiles, onUpload, onFilesChange }: UseFileUploadOptions) {
  const labels = useComponentLabels(fileUploadLabels)
  const locale = useLocale()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [rejections, setRejections] = useState<FileRejection[]>([])
  const [announcement, setAnnouncement] = useState('')
  const controllers = useRef(new Map<string, AbortController>())
  const filesRef = useRef(files)
  filesRef.current = files

  const onFilesChangeRef = useRef(onFilesChange)
  onFilesChangeRef.current = onFilesChange
  const onUploadRef = useRef(onUpload)
  onUploadRef.current = onUpload

  const update = useCallback((next: (files: UploadFile[]) => UploadFile[]) => {
    const value = next(filesRef.current)
    filesRef.current = value
    setFiles(value)
    onFilesChangeRef.current?.(value)
  }, [])

  const patch = useCallback(
    (id: string, changes: Partial<UploadFile>) => update((all) => all.map((f) => (f.id === id ? { ...f, ...changes } : f))),
    [update],
  )

  const start = useCallback(
    (entry: UploadFile) => {
      const upload = onUploadRef.current
      if (!upload) return
      const controller = new AbortController()
      controllers.current.set(entry.id, controller)
      const alive = () => !controller.signal.aborted && filesRef.current.some((f) => f.id === entry.id)
      Promise.resolve()
        .then(() =>
          upload(entry.file, {
            signal: controller.signal,
            onProgress: (percent) => {
              if (alive()) patch(entry.id, { progress: Math.max(0, Math.min(100, percent)) })
            },
          }),
        )
        .then(
          () => {
            if (!alive()) return
            patch(entry.id, { status: 'done', progress: 100, error: undefined })
            setAnnouncement(labels.fileUploaded(entry.file.name))
          },
          (error: unknown) => {
            if (!alive()) return
            const message = error instanceof Error && error.message ? error.message : labels.fileUploadFailed
            patch(entry.id, { status: 'error', error: message })
            setAnnouncement(labels.fileFailedToUpload(entry.file.name, message))
          },
        )
        .finally(() => {
          if (controllers.current.get(entry.id) === controller) controllers.current.delete(entry.id)
        })
    },
    [patch, labels],
  )

  const add = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      if (!list.length) return
      const rejected: FileRejection[] = []
      const accepted: UploadFile[] = []
      const known = new Set(filesRef.current.map((f) => fileKey(f.file)))
      for (const file of list) {
        if (!matchesAccept(file, accept)) {
          rejected.push({ file, message: labels.fileUnsupported(file.name, accept ? describeAccept(labels, accept) : undefined) })
        } else if (maxSize !== undefined && file.size > maxSize) {
          rejected.push({ file, message: labels.fileTooLarge(file.name, formatBytes(file.size, locale), formatBytes(maxSize, locale)) })
        } else if (known.has(fileKey(file))) {
          rejected.push({ file, message: labels.fileDuplicate(file.name) })
        } else if (maxFiles !== undefined && filesRef.current.length + accepted.length >= maxFiles) {
          rejected.push({ file, message: labels.fileTooMany(file.name, maxFiles) })
        } else {
          known.add(fileKey(file))
          accepted.push({
            id: `file-${++seq}`,
            file,
            status: onUploadRef.current ? 'uploading' : 'done',
            progress: onUploadRef.current ? null : 100,
            preview: file.type.startsWith('image/') && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined,
          })
        }
      }
      setRejections(rejected)
      if (accepted.length) {
        update((all) => [...all, ...accepted])
        accepted.forEach(start)
      }
      const parts = [
        accepted.length && labels.filesAdded(accepted.length),
        rejected.length && labels.filesRejected(rejected.length),
      ].filter(Boolean)
      setAnnouncement(parts.join(', '))
    },
    [accept, maxSize, maxFiles, start, update, labels, locale],
  )

  const remove = useCallback(
    (id: string) => {
      const entry = filesRef.current.find((f) => f.id === id)
      if (!entry) return
      controllers.current.get(id)?.abort()
      controllers.current.delete(id)
      if (entry.preview) URL.revokeObjectURL(entry.preview)
      update((all) => all.filter((f) => f.id !== id))
      setAnnouncement(labels.fileRemoved(entry.file.name))
    },
    [update, labels],
  )

  const retry = useCallback(
    (id: string) => {
      const entry = filesRef.current.find((f) => f.id === id)
      if (!entry) return
      const next = { ...entry, status: 'uploading' as const, progress: null, error: undefined }
      patch(id, next)
      setAnnouncement(labels.fileRetrying(entry.file.name))
      start(next)
    },
    [patch, start, labels],
  )

  const clear = useCallback(() => {
    for (const f of filesRef.current) {
      controllers.current.get(f.id)?.abort()
      if (f.preview) URL.revokeObjectURL(f.preview)
    }
    controllers.current.clear()
    update(() => [])
    setRejections([])
  }, [update])

  // Abort in-flight uploads and release previews on unmount.
  useEffect(
    () => () => {
      for (const c of controllers.current.values()) c.abort()
      for (const f of filesRef.current) if (f.preview) URL.revokeObjectURL(f.preview)
    },
    [],
  )

  return { files, rejections, announcement, add, remove, retry, clear }
}

/** Drag-and-drop onto any element: returns its handlers and whether a drag is over it. */
function useFileDrop(onFiles: (files: FileList) => void, disabled?: boolean) {
  const [over, setOver] = useState(false)
  const depth = useRef(0)
  const hasFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files')
  return {
    over: over && !disabled,
    props: {
      onDragEnter: (event: DragEvent) => {
        if (disabled || !hasFiles(event)) return
        event.preventDefault()
        depth.current++
        setOver(true)
      },
      onDragOver: (event: DragEvent) => {
        if (disabled || !hasFiles(event)) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'copy'
      },
      onDragLeave: () => {
        depth.current = Math.max(0, depth.current - 1)
        if (depth.current === 0) setOver(false)
      },
      onDrop: (event: DragEvent) => {
        depth.current = 0
        setOver(false)
        if (disabled || !event.dataTransfer?.files.length) return
        event.preventDefault()
        onFiles(event.dataTransfer.files)
      },
    },
  }
}

interface FileUploadProps extends UseFileUploadOptions, Omit<ComponentProps<'div'>, 'children' | 'onChange' | 'title'> {
  /** 'list' (default): rows with progress. 'gallery': a grid of image tiles. */
  variant?: 'list' | 'gallery'
  /** Allow several files. Default true. */
  multiple?: boolean
  disabled?: boolean
  /** The zone's main line. */
  title?: ReactNode
  /** Overrides the generated rules line ("PNG or JPG · up to 5 MB each"). */
  hint?: ReactNode
}

function FileUpload({
  accept,
  maxSize,
  maxFiles,
  onUpload,
  onFilesChange,
  variant = 'list',
  multiple = true,
  disabled = false,
  title,
  hint,
  className,
  ...props
}: FileUploadProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(fileUploadLabels)
  const upload = useFileUpload({ accept, maxSize, maxFiles, onUpload, onFilesChange })
  const { files, rejections, announcement, add } = upload
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const drop = useFileDrop(add, disabled)
  const full = maxFiles !== undefined && files.length >= maxFiles
  const gallery = variant === 'gallery'

  const rules =
    hint ??
    [
      describeAccept(labels, accept),
      maxSize !== undefined && labels.fileMaxSize(formatBytes(maxSize, locale), multiple),
      maxFiles !== undefined && multiple && labels.fileMaxFiles(maxFiles),
    ]
      .filter(Boolean)
      .join(' · ')

  // Removing a row moves focus to the row that took its place, or the zone.
  const root = useRef<HTMLDivElement>(null)
  const refocus = useRef<number | null>(null)
  const removeAndRefocus = (id: string) => {
    const index = files.findIndex((f) => f.id === id)
    const hadFocus = root.current?.contains(document.activeElement)
    upload.remove(id)
    if (hadFocus) refocus.current = index
  }
  useLayoutEffect(() => {
    if (refocus.current === null) return
    const index = refocus.current
    refocus.current = null
    const rows = files.length
    const target =
      rows > 0
        ? // The removed row is still leaving (inert); skip it.
          root.current?.querySelector<HTMLElement>(
            `[data-file-index="${Math.min(index, rows - 1)}"]:not([inert]) [data-slot=file-upload-action]:last-of-type`,
          )
        : root.current?.querySelector<HTMLElement>('[data-slot=file-upload-dropzone]')
    target?.focus()
  })

  const open = () => input.current?.click()

  const zone = (compact: boolean) => (
    <button
      type="button"
      data-slot="file-upload-dropzone"
      data-dragging={drop.over || undefined}
      data-compact={compact || undefined}
      disabled={disabled || full}
      aria-describedby={rules ? hintId : undefined}
      onClick={open}
      {...drop.props}
      className={cn(
        'group/dropzone relative own:flex w-full flex-col items-center justify-center gap-2 own:rounded-lg border border-dashed border-line-control own:text-center',
        'transition-[border-color,background-color] yj-duration-fast ease-standard',
        'hover:border-fg-subtle own:hover:bg-hover focus-ring',
        'data-dragging:border-accent own:data-dragging:bg-accent-subtle',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-control own:disabled:hover:bg-transparent',
        compact ? 'aspect-square own:p-3' : 'own:px-6 own:py-8',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'own:grid place-items-center rounded-full bg-band own:text-fg-muted transition-colors yj-duration-fast ease-standard',
          'group-hover/dropzone:text-fg group-data-dragging/dropzone:bg-accent-subtle group-data-dragging/dropzone:text-accent',
          compact ? 'size-8' : 'size-10',
        )}
      >
        {gallery ? (
          <ImageIcon size={compact ? 16 : 20} strokeWidth={1.75} active={drop.over || undefined} />
        ) : (
          <UploadIcon size={20} strokeWidth={1.75} active={drop.over || undefined} />
        )}
      </span>
      <span className="own:flex flex-col gap-0.5">
        <span className="own:text-ui own:font-medium own:text-fg">
          {compact ? labels.add : (title ?? (drop.over ? labels.fileDropToUpload : (
            <>
              {labels.fileDropPrompt(gallery ? 'images' : multiple ? 'files' : 'file')} <span className="own:text-accent">{labels.fileBrowse}</span>
            </>
          )))}
        </span>
        {!compact && rules && (
          <span id={hintId} className="own:text-ui-sm own:text-fg-muted">
            {rules}
          </span>
        )}
        {compact && rules && (
          <span id={hintId} className="sr-only">
            {rules}
          </span>
        )}
      </span>
    </button>
  )

  return (
    <div
      ref={root}
      data-slot="file-upload"
      data-variant={variant}
      data-reduced-motion={k.reduced || undefined}
      className={cn('own:flex w-full flex-col gap-3', className)}
      {...props}
    >
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          if (event.currentTarget.files) add(event.currentTarget.files)
          event.currentTarget.value = ''
        }}
      />
      {(!gallery || files.length === 0) && zone(false)}
      <FieldError errors={rejections.map((r) => ({ message: r.message }))} />
      {gallery ? (
        files.length > 0 && (
          <div {...drop.props} data-dragging={drop.over || undefined} className="own:rounded-lg outline-offset-4 data-dragging:outline-2 data-dragging:outline-accent data-dragging:outline-dashed">
            <PresenceList
              as="div"
              aria-label={labels.fileListImages}
              role="list"
              className="own:grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*26),1fr))] gap-2"
            >
              {files.map((f, i) => (
                <PresenceItem as="div" role="listitem" key={f.id} data-file-index={i}>
                  <GalleryTile file={f} onRemove={() => removeAndRefocus(f.id)} onRetry={() => upload.retry(f.id)} />
                </PresenceItem>
              ))}
              {multiple && !full && (
                <PresenceItem as="div" key="add">
                  {zone(true)}
                </PresenceItem>
              )}
            </PresenceList>
          </div>
        )
      ) : (
        <PresenceList aria-label={labels.fileListFiles} className="own:flex flex-col empty:hidden">
          {files.map((f, i) => (
            <PresenceItem key={f.id} data-file-index={i}>
              <FileRow file={f} onRemove={() => removeAndRefocus(f.id)} onRetry={() => upload.retry(f.id)} />
            </PresenceItem>
          ))}
        </PresenceList>
      )}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}

interface ItemProps {
  file: UploadFile
  onRemove: () => void
  onRetry: () => void
}

function Thumb({ file, className }: { file: UploadFile; className?: string }) {
  const Glyph = file.file.type === 'application/pdf' || file.file.type.startsWith('text/') ? FileTextIcon : FileIcon
  return (
    <span
      aria-hidden
      className={cn('relative own:grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-band own:text-fg-muted', className)}
    >
      {file.preview ? (
        <img src={file.preview} alt="" className="size-full object-cover" />
      ) : (
        <Glyph className="own:size-4" strokeWidth={1.75} />
      )}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] border border-line-subtle" />
    </span>
  )
}

const actionClass = 'own:text-fg-muted'

function FileRow({ file, onRemove, onRetry }: ItemProps) {
  const labels = useComponentLabels(fileUploadLabels)
  const locale = useLocale()
  const name = file.file.name
  return (
    <div
      data-slot="file-upload-item"
      data-status={file.status}
      className="group/file own:flex items-center gap-3 own:rounded-lg px-1 py-2 [li:not(:last-child)>&]:border-b [li:not(:last-child)>&]:border-line"
    >
      <Thumb file={file} />
      <div className="own:flex min-w-0 flex-1 flex-col justify-center">
        {file.status === 'uploading' ? (
          <Progress value={file.progress} className="gap-y-1.5">
            <ProgressLabel className="min-w-0 flex-1 truncate">{name}</ProgressLabel>
            {file.progress !== null && <ProgressValue />}
          </Progress>
        ) : (
          <>
            <span className="truncate own:text-ui own:font-medium own:text-fg">{name}</span>
            <span
              className={cn(
                'own:flex min-w-0 items-center gap-1.5 own:text-ui-sm',
                file.status === 'error' ? 'own:text-danger-text' : 'own:text-fg-muted',
              )}
            >
              {formatBytes(file.file.size, locale)}
              {file.status === 'done' && (
                <>
                  <span aria-hidden>·</span>
                  <CheckIcon trigger="mount" size={12} strokeWidth={2.5} className="own:text-success" />
                  <span>{labels.fileStatusUploaded}</span>
                </>
              )}
              {file.status === 'error' && (
                <>
                  <span aria-hidden>·</span>
                  <span className="truncate">{file.error}</span>
                </>
              )}
            </span>
          </>
        )}
      </div>
      <div className="own:flex shrink-0 items-center gap-0.5">
        {file.status === 'error' && (
          <Button data-slot="file-upload-action" variant="ghost" size="icon-sm" className={actionClass} aria-label={labels.fileRetry(name)} onClick={onRetry}>
            <RefreshIcon size={16} strokeWidth={1.75} />
          </Button>
        )}
        <Button
          data-slot="file-upload-action"
          variant="ghost"
          size="icon-sm"
          className={actionClass}
          aria-label={file.status === 'uploading' ? labels.fileCancelUpload(name) : labels.remove(name)}
          onClick={onRemove}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  )
}

function GalleryTile({ file, onRemove, onRetry }: ItemProps) {
  const labels = useComponentLabels(fileUploadLabels)
  const name = file.file.name
  return (
    <div
      data-slot="file-upload-tile"
      data-status={file.status}
      className="group/tile relative aspect-square overflow-hidden own:rounded-lg own:bg-band"
    >
      <Thumb file={file} className="absolute inset-0 own:size-full own:rounded-lg [&_svg]:size-6" />
      {/* A scrim for legibility while uploading or failed. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-transparent transition-colors yj-duration-base ease-standard',
          'group-data-[status=uploading]/tile:bg-canvas/45 youj-allow-glass group-data-[status=error]/tile:bg-danger-line',
        )}
      />
      {file.status === 'uploading' && (
        <Progress value={file.progress} aria-label={labels.fileUploading(name)} className="absolute inset-x-2 bottom-2 w-auto" />
      )}
      {file.status === 'done' && (
        <span className="absolute start-1.5 bottom-1.5 own:grid size-4.5 place-items-center rounded-full bg-success own:text-canvas shadow-sm ring-2 ring-canvas">
          <CheckIcon trigger="mount" size={11} strokeWidth={2.75} />
          <span className="sr-only">{labels.fileUploadedTile(name)}</span>
        </span>
      )}
      {file.status === 'error' && (
        <div className="absolute inset-0 own:grid place-items-center">
          <Button
            data-slot="file-upload-action"
            variant="secondary"
            size="xs"
            className="own:bg-canvas/90 youj-allow-glass own:text-fg own:shadow-sm backdrop-blur-sm own:hover:bg-canvas"
            aria-label={labels.fileRetryError(name, file.error ?? '')}
            onClick={onRetry}
          >
            <RefreshIcon size={14} strokeWidth={1.75} />
            {labels.retry}
          </Button>
        </div>
      )}
      <Button
        data-slot="file-upload-action"
        variant="secondary"
        size="icon-xs"
        aria-label={file.status === 'uploading' ? labels.fileCancelUpload(name) : labels.remove(name)}
        onClick={onRemove}
        className={cn(
          'absolute end-1.5 top-1.5 own:bg-canvas/85 youj-allow-glass own:text-fg own:shadow-sm backdrop-blur-sm own:hover:bg-canvas',
          // Shown on hover or focus where there is hover; always on touch.
          'fine:opacity-0 fine:group-hover/tile:opacity-100 fine:focus-visible:opacity-100',
        )}
      >
        <XIcon />
      </Button>
    </div>
  )
}

export {
  FileUpload,
  useFileUpload,
  useFileDrop,
  formatBytes,
  type FileUploadProps,
  type FileRejection,
  type UploadContext,
  type UploadFile,
  type UploadStatus,
  type UseFileUploadOptions,
}
