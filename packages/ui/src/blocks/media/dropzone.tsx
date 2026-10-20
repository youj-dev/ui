'use client'

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent as ReactClipboardEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { FolderOpenIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { useLiveRegion } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEMO_FILES,
  formatBytes,
  type MediaDropzoneCopy,
  type MediaDropzoneFile,
  type MediaDropzoneRejection,
  type MediaDropzoneStatus,
  type MediaDropzoneUploadContext,
} from './dropzone/data'
import { FileRow } from './dropzone/file-row'
import { describeRules, folderEntries, fromInput, fromPaste, readEntries, rulesOf } from './dropzone/intake'
import { Refusals } from './dropzone/refusals'
import { useDrag } from './dropzone/use-drag'
import { useFiles } from './dropzone/use-files'
import { Zone, type ZoneState } from './dropzone/zone'

/* A drop zone that takes files every way people have them and says exactly
 * what it took. The zone is a button (Enter or Space opens the picker) and
 * the drop target; it wakes as soon as files are dragged anywhere over the
 * page, and over it says how many are coming and whether the rules accept
 * their types, turning to danger when none would be. A drop that misses it
 * is swallowed instead of opening the file in the tab. Folders drop or pick
 * whole: read recursively, each file keeping its folder, system files left
 * out. ⌘V or Ctrl+V pastes a screenshot, named by the moment it was taken.
 * Every rule explains itself: types (with the type read from the extension
 * when the browser has none), a size range, a count, a total budget,
 * duplicates, an image's dimensions and your own `validate`; refusals are
 * gathered in one alert, a reason a line. Accepted files show a real
 * thumbnail (drawn small, not the whole photo), a video's frame and running
 * time, their folder, and upload three at a time through `onUpload`, with
 * progress, Retry and remove (which cancels an upload, or calls `onRemove`
 * for a stored file). Outcomes are announced; focus never drops to the page
 * when a row goes. Reduced motion: states change colour in place, rows
 * appear and go at once. */

interface MediaDropzoneProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onDrop' | 'onPaste'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2`, and no page around it. Default true; `false` draws its own page (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MediaDropzoneCopy>
  /** Writes sizes and running times in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The files it starts with, usually the ones already stored (`status: 'done'`). Default: four demo files part-way through. */
  defaultFiles?: MediaDropzoneFile[]
  /** Every change to the list: added, uploading, uploaded (with what `onUpload` resolved), failed, removed. */
  onFilesChange?: (files: MediaDropzoneFile[]) => void
  /** The types it takes, as an input's `accept`: extensions (`.pdf`), MIME types (`image/png`) or families (`image/*`). Default JPG, PNG, WebP, MP4, MOV and PDF. */
  accept?: string
  /** The largest file, in bytes. Default 50 MB. */
  maxSize?: number
  /** The smallest file, in bytes. Default 1, so an empty file is refused. */
  minSize?: number
  /** How many files it holds. Default 20. */
  maxFiles?: number
  /** All the files together, in bytes. Default 200 MB. */
  maxTotalSize?: number
  /** An image's smallest size in pixels: `{ width: 1200, height: 1200 }` for product photos. Default: any. */
  minDimensions?: { width: number; height: number }
  /** Your own rule: return a reason to refuse the file, or nothing to take it. May be async (a name check on your server). */
  validate?: (file: File) => string | null | undefined | Promise<string | null | undefined>
  /** Take whole folders, dropped or picked. Default true. */
  folders?: boolean
  /** Take files pasted into the block, or onto the page while nothing else has focus. Default true. */
  paste?: boolean
  disabled?: boolean
  /** Uploads one file: report progress (0–100) and resolve when it's stored, with anything you'll want back (a URL, a key); reject to show why. Default: a simulated upload. */
  onUpload?: (file: File, context: MediaDropzoneUploadContext) => Promise<unknown> | unknown
  /** Removes a stored file (from your storage). Awaited, the row dimmed meanwhile; reject to keep it and say why. Without it, removing only takes it off the list. */
  onRemove?: (file: MediaDropzoneFile) => Promise<unknown> | unknown
  /** The files the rules turned away, each with its reason. */
  onReject?: (rejections: MediaDropzoneRejection[]) => void
  /** Under the list, beside the totals: a Continue button, a note. */
  footer?: ReactNode
  /** Classes for its parts: `list` is the region the files scroll in (its height, 256px at 100%, holds the card's size). */
  classNames?: { list?: string }
}

const MB = 1024 * 1024
const subscribeNothing = () => () => {}
const isApple = () => /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)

function MediaDropzone({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  defaultFiles = DEMO_FILES,
  onFilesChange,
  accept = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf',
  maxSize = 50 * MB,
  minSize = 1,
  maxFiles = 20,
  maxTotalSize = 200 * MB,
  minDimensions,
  validate,
  folders = true,
  paste = true,
  disabled = false,
  onUpload,
  onRemove,
  onReject,
  footer,
  classNames,
  className,
  ...rest
}: MediaDropzoneProps) {
  const copy: MediaDropzoneCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const rulesId = useId()
  const refusalsId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const root = useRef<HTMLElement>(null)
  const zone = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const apple = useSyncExternalStore(subscribeNothing, isApple, () => true)
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const rules = rulesOf(accept)
  const queue = useFiles({
    initial: defaultFiles,
    rules: { accept: rules, maxSize, minSize, maxFiles, maxTotalSize },
    minDimensions,
    validate,
    onUpload,
    onRemove,
    onFilesChange,
    onReject,
    copy,
    announce,
  })
  const { files } = queue
  const [reading, setReading] = useState<number | null>(null)
  const full = files.length >= maxFiles
  const off = disabled || full || reading !== null

  const takeDrop = (data: DataTransfer) => {
    const entries = folders ? folderEntries(data) : []
    if (entries.length === 0) {
      const { picked, skipped } = fromInput(data.files)
      return queue.add(picked, skipped)
    }
    setReading(0)
    void readEntries(entries, (count) => count % 20 === 0 && setReading(count), maxFiles * 4)
      .then(({ picked, skipped }) => queue.add(picked, skipped))
      // A folder that can't be read adds nothing, and the zone wakes up again either way.
      .catch(() => {})
      .finally(() => setReading(null))
  }
  const drag = useDrag(zone, rules, off, takeDrop)

  const takePaste = (event: ClipboardEvent | ReactClipboardEvent) => {
    if (!paste || off || event.defaultPrevented) return
    const pasted = fromPaste(event.clipboardData, copy.pastedName)
    if (pasted.length === 0) return
    event.preventDefault()
    queue.add(pasted.map((file) => ({ file })))
  }
  // A paste onto the page itself (nothing focused) lands here too.
  const pasteRef = useRef(takePaste)
  useLayoutEffect(() => {
    pasteRef.current = takePaste
  })
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (root.current?.contains(event.target as Node)) return
      if (document.activeElement && document.activeElement !== document.body) return
      pasteRef.current(event)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [])

  // Removing a row moves focus to the row that took its place, or back to the zone.
  const refocus = useRef<number | null>(null)
  const remove = (id: string) => {
    if (root.current?.contains(document.activeElement)) refocus.current = files.findIndex((f) => f.id === id)
    void queue.remove(id)
  }
  useLayoutEffect(() => {
    if (refocus.current === null || files.some((f) => f.status === 'removing')) return
    const index = refocus.current
    refocus.current = null
    const rows =
      root.current?.querySelectorAll<HTMLElement>('[data-slot=media-dropzone-file-item]:not([inert]) [data-slot=media-dropzone-remove]') ?? []
    ;(rows[Math.min(index, rows.length - 1)] ?? zone.current)?.focus()
  })

  const state: ZoneState = full
    ? 'full'
    : reading !== null
      ? 'reading'
      : drag.over
        ? drag.over.count > 0 && drag.over.refused === drag.over.count
          ? 'refused'
          : 'over'
        : drag.ready
          ? 'ready'
          : 'idle'
  const title = {
    idle: copy.drop,
    ready: copy.dropReady,
    over: drag.over?.count ? copy.dropCount(drag.over.count) : copy.dropReady,
    refused: copy.dropNone,
    reading: copy.reading(reading ?? 0),
    full: copy.full(maxFiles),
  }[state]
  const hint =
    state === 'idle' ? (
      <>
        <span className="text-fg underline decoration-line-strong underline-offset-4 group-hover/zone:decoration-fg">{copy.browse}</span>
        {paste && <span className="max-sm:hidden"> · {copy.pasteHint(apple ? '⌘' : 'Ctrl+')}</span>}
      </>
    ) : state === 'over' ? (
      drag.over?.refused ? (
        copy.dropSome(drag.over.refused)
      ) : (
        copy.dropRelease
      )
    ) : state === 'refused' ? (
      copy.onlyTypes(describeRules(rules, copy))
    ) : state === 'full' ? (
      copy.fullHint
    ) : undefined

  const size = (bytes: number) => formatBytes(bytes, copy.locale)
  const total = files.reduce((sum, f) => sum + f.size, 0)
  const rulesLine = [
    describeRules(rules, copy),
    minDimensions && copy.atLeast(copy.dimensions(minDimensions.width, minDimensions.height)),
    Number.isFinite(maxSize) && copy.eachUpTo(size(maxSize)),
    Number.isFinite(maxTotalSize) && copy.inAll(size(maxTotalSize)),
  ]
    .filter(Boolean)
    .join(' · ')

  const panel = (
    <article
      ref={root}
      aria-labelledby={titleId}
      onPaste={takePaste}
      {...(embedded ? rest : null)}
      className={cn(
        'w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-2xl',
        embedded && className,
      )}
    >
      <header className="flex flex-col gap-1 px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-4">
        <Title id={titleId} className="text-(length:--ui--panel-title) leading-(--ui--panel-title-leading) font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.description}</p>
      </header>
      <div className="flex flex-col gap-3 px-(--ui--panel-x) pb-(--ui--panel-y)">
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          onChange={(event) => {
            const { picked, skipped } = fromInput(event.currentTarget.files ?? [])
            queue.add(picked, skipped)
            event.currentTarget.value = ''
          }}
        />
        {folders && (
          <input
            ref={(el) => {
              folderInput.current = el
              el?.setAttribute('webkitdirectory', '')
            }}
            type="file"
            multiple
            tabIndex={-1}
            aria-hidden
            className="sr-only"
            onChange={(event) => {
              const { picked, skipped } = fromInput(event.currentTarget.files ?? [])
              queue.add(picked, skipped)
              event.currentTarget.value = ''
            }}
          />
        )}
        <Zone
          ref={zone}
          state={state}
          title={title}
          hint={hint}
          disabled={disabled || full}
          aria-busy={reading !== null || undefined}
          aria-describedby={queue.refusals ? `${rulesId} ${refusalsId}` : rulesId}
          onClick={() => input.current?.click()}
          {...drag.props}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p id={rulesId} className="text-ui-sm text-fg-muted">
            {rulesLine}
          </p>
          {folders && (
            <Button variant="ghost" size="xs" className="-me-2" disabled={off} onClick={() => folderInput.current?.click()}>
              <FolderOpenIcon />
              {copy.chooseFolder}
            </Button>
          )}
        </div>
        {/* The files and what wasn't added, in a region of its own height: the card keeps its size as files come and go. */}
        <div className={cn('yj-scrollbar -mx-1 h-64 overflow-y-auto px-1', classNames?.list)}>
          <div className="flex min-h-full flex-col gap-3">
            <Refusals id={refusalsId} refusals={queue.refusals} copy={copy} onDismiss={queue.dismissRefusals} />
            {files.length === 0 && !queue.refusals && <p className="grid flex-1 place-items-center text-ui-sm text-fg-subtle">{copy.noFiles}</p>}
            <PresenceList aria-label={copy.files} className="flex flex-col empty:hidden">
              {files.map((item: MediaDropzoneFile) => (
                <PresenceItem key={item.id} data-slot="media-dropzone-file-item" className="border-line-subtle not-first:border-t">
                  <FileRow item={item} copy={copy} onRemove={() => remove(item.id)} onRetry={() => queue.retry(item.id)} />
                </PresenceItem>
              ))}
            </PresenceList>
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <span className="text-ui-sm font-medium text-fg tabular-nums">{copy.summary(files.length)}</span>
        {Number.isFinite(maxTotalSize) ? (
          <span className="flex min-w-40 flex-1 items-center gap-2.5">
            <Progress value={Math.min(100, (total / maxTotalSize) * 100)} tone="neutral" aria-label={copy.budget} className="max-w-48 flex-1" />
            <span className="shrink-0 text-ui-sm text-fg-muted tabular-nums">{copy.ofBudget(size(total), size(maxTotalSize))}</span>
          </span>
        ) : (
          <span className="text-ui-sm text-fg-muted tabular-nums">{size(total)}</span>
        )}
        {footer && <div className="ms-auto flex items-center gap-2">{footer}</div>}
      </footer>
      <div ref={politeRef} role="status" className="sr-only" />
      <div ref={assertiveRef} role="alert" className="sr-only" />
    </article>
  )

  const shell = embedded ? (
    panel
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {panel}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { MediaDropzone, DEFAULT_COPY as MEDIA_DROPZONE_COPY }
export type { MediaDropzoneCopy, MediaDropzoneFile, MediaDropzoneProps, MediaDropzoneRejection, MediaDropzoneStatus, MediaDropzoneUploadContext }
