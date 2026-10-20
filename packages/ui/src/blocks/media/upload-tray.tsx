'use client'

import { createContext, useContext, useLayoutEffect, useMemo, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEMO_ITEMS,
  RETRY_DELAYS,
  type UploadTrayContext,
  type UploadTrayCopy,
  type UploadTrayItem,
  type UploadTrayStatus,
} from './upload-tray/data'
import { DropOverlay } from './upload-tray/drop-overlay'
import type { Picked } from './upload-tray/files'
import { Tray } from './upload-tray/tray'
import { useQueue } from './upload-tray/use-queue'

/* Uploads that keep going while people keep working. Wrap a page in it:
 * files dragged anywhere over the page raise a veil that names where they'll
 * go, dropping uploads them (folders read whole), and anything inside can
 * send files with `useUploadTray().add(files)`. A tray rises in the corner
 * with the queue. A few files move at once; each pauses and resumes from the
 * bytes already stored (for tus or S3 multipart; `onUpload` gets the offset
 * and an AbortSignal), a failure retries itself after 2, 5 and 10 seconds
 * with a countdown, then stops with its reason and Retry. Going offline
 * holds everything and says so; coming back resumes it. The header sums it
 * up: an overall ring, the combined speed and an honest time left (a
 * smoothed rate, rounded up), Pause all, and Close, which asks first while
 * anything's still to upload. The tray folds to its header, leaving a
 * hairline of progress. While real files move, leaving the page asks first.
 * Every outcome is announced, without reading out each percent. Reduced
 * motion: the tray appears and goes in place and the rings jump. */

interface UploadTrayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Wraps the block (and the page in it) in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Any of the block's strings, to rewrite or translate; `destination` names where files go. */
  copy?: Partial<UploadTrayCopy>
  /** Writes sizes, speeds and times in this locale (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The page under the tray. Files dropped anywhere on it upload, and anything inside can add files with `useUploadTray()`. */
  children?: ReactNode
  /** The queue it starts with. Items with a `file` upload; items without one are simulated. Default: six demo files mid-flight. */
  defaultItems?: UploadTrayItem[]
  /** Every change to the queue: added, moving, paused, done (with what `onUpload` resolved), failed, removed. */
  onItemsChange?: (items: UploadTrayItem[]) => void
  /** How many files move at once. Default 3. */
  concurrency?: number
  /** The waits before each automatic retry of a failed upload, in milliseconds; as many retries as waits, `[]` for none. Default 2, 5 and 10 seconds. */
  retryDelays?: number[]
  /** Files dropped anywhere on the page upload. Default true. */
  dropOnPage?: boolean
  /** Whether the list is open (controlled): pair it with `onExpandedChange`. */
  expanded?: boolean
  /** Whether the list starts open, when the block owns it. Default true. */
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Uploads one file: resume from `offset`, report the bytes stored through `onProgress`, stop on `signal`, and resolve with anything you'll want back (a URL, a key); reject to retry or fail with your message. Default: a simulated upload. */
  onUpload?: (file: File, context: UploadTrayContext) => Promise<unknown> | unknown
  /** When the queue comes to rest, with every item as it ended. */
  onComplete?: (items: UploadTrayItem[]) => void
  /** The dashed Demo data badge in the tray's header while it shows the demo's files. Default true. */
  demoMarker?: boolean
  /** Classes for its parts: `tray` is the floating panel (its place and width), `list` the region the queue scrolls in (its height, 320px at 100%, holds the tray's size). */
  classNames?: { tray?: string; list?: string }
}

interface TrayApi {
  /** Queues files to upload (each with its folder, if you have one). Returns the items it queued. */
  add: (files: (File | Picked)[]) => UploadTrayItem[]
  /** The queue as it stands. */
  items: UploadTrayItem[]
}

const TrayApiContext = createContext<TrayApi | null>(null)

/** The tray around this component: `add(files)` sends files to it from your own Upload button. */
function useUploadTray(): TrayApi {
  const api = useContext(TrayApiContext)
  if (!api) throw new Error('useUploadTray() needs an UploadTray around it')
  return api
}

function UploadTray({
  theme,
  copy: copyProp,
  locale,
  children,
  defaultItems,
  onItemsChange,
  concurrency = 3,
  retryDelays = RETRY_DELAYS,
  dropOnPage = true,
  expanded: expandedProp,
  defaultExpanded = true,
  onExpandedChange,
  onUpload,
  onComplete,
  demoMarker = true,
  classNames,
  className,
  ...rest
}: UploadTrayProps) {
  const copy: UploadTrayCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const queue = useQueue({ initial: defaultItems ?? DEMO_ITEMS, concurrency, retryDelays, onUpload, onItemsChange, onComplete, copy, announce })
  const [expanded, setExpanded] = useControllableState(expandedProp, defaultExpanded)
  const expand = (next: boolean) => {
    setExpanded(next)
    onExpandedChange?.(next)
  }
  const add = (files: (File | Picked)[]) => {
    const added = queue.add(files)
    if (added.length && !expanded) expand(true)
    return added
  }
  const addRef = useRef(add)
  useLayoutEffect(() => {
    addRef.current = add
  })
  const api = useMemo<TrayApi>(() => ({ add: (files) => addRef.current(files), items: queue.items }), [queue.items])
  const demo = defaultItems === undefined && demoMarker && queue.items.some((i) => !i.file)

  const view = (
    <TrayApiContext.Provider value={api}>
      <div data-slot="upload-tray-page" {...rest} className={cn('relative', className)}>
        {children}
        <DropOverlay copy={copy} disabled={!dropOnPage} onFiles={add} />
        <Tray
          queue={queue}
          copy={copy}
          retries={retryDelays.length}
          expanded={expanded}
          onExpandedChange={expand}
          demoMarker={demo}
          className={classNames?.tray}
          listClassName={classNames?.list}
        />
        <div ref={politeRef} role="status" className="sr-only" />
        <div ref={assertiveRef} role="alert" className="sr-only" />
      </div>
    </TrayApiContext.Provider>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { UploadTray, useUploadTray, DEFAULT_COPY as UPLOAD_TRAY_COPY }
export type { UploadTrayContext, UploadTrayCopy, UploadTrayItem, UploadTrayProps, UploadTrayStatus }
