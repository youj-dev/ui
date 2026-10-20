'use client'

import { useId, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { ChevronDownIcon, CloudUploadIcon, PlayIcon, WifiOffIcon, XIcon } from '@youj/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { formatBytes, formatLeft, type UploadTrayCopy, type UploadTrayItem } from './data'
import { Ring, Row } from './row'
import type { useQueue } from './use-queue'

/* The tray in the corner. It rises on the smooth spring when there's
 * something to show and sinks when it's closed. The header is the summary
 * (an overall ring that becomes a check, how many files, the combined speed
 * and the time left, or that it's waiting for the connection) and the toggle
 * that folds the list away, leaving a hairline of overall progress along its
 * foot; beside it Pause all or Resume all, and Close, which asks first while
 * anything is still to upload. Offline, a banner says why nothing moves. */

const ACTIVE: UploadTrayItem['status'][] = ['queued', 'uploading', 'waiting', 'retrying']

interface TrayProps {
  queue: ReturnType<typeof useQueue>
  copy: UploadTrayCopy
  retries: number
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  demoMarker: boolean
  /** Classes for the region the queue scrolls in (its height, 320px at 100%, holds the tray's size). */
  listClassName?: string
  className?: string
}

export function Tray({ queue, copy, retries, expanded, onExpandedChange, demoMarker, listClassName, className }: TrayProps) {
  const k = useYouj()
  const listId = useId()
  const [confirm, setConfirm] = useState(false)
  const { items, online } = queue
  const active = items.filter((i) => ACTIVE.includes(i.status))
  const paused = items.filter((i) => i.status === 'paused')
  const failed = items.filter((i) => i.status === 'failed')
  const done = items.filter((i) => i.status === 'done')
  const total = items.reduce((sum, i) => sum + i.size, 0)
  const loaded = items.reduce((sum, i) => sum + i.loaded, 0)
  const rate = items.reduce((sum, i) => sum + (i.status === 'uploading' ? (i.rate ?? 0) : 0), 0)
  const remaining = [...active, ...paused].reduce((sum, i) => sum + i.size - i.loaded, 0)
  const complete = active.length === 0 && paused.length === 0 && failed.length === 0 && done.length > 0
  const moving = active.length > 0

  const title =
    !online && moving
      ? copy.offline
      : moving
        ? copy.uploading(active.length + paused.length)
        : paused.length
          ? copy.paused(paused.length)
          : failed.length
            ? copy.someFailed(failed.length)
            : copy.complete(done.length)
  const subline =
    !online && moving
      ? copy.offlineHint
      : moving
        ? rate > 0
          ? copy.rate(formatBytes(rate, copy.locale, true), formatLeft(remaining / rate, copy))
          : copy.calculating
        : paused.length || failed.length
          ? copy.settled(done.length, items.length)
          : copy.doneIn(copy.destination)
  const close = () => (active.length + paused.length > 0 ? setConfirm(true) : queue.clear())

  return (
    <MotionFeatures>
      <AnimatePresence>
        {items.length > 0 && (
          <m.section
            key="tray"
            aria-label={copy.region}
            data-slot="upload-tray"
            data-yj-tone="overlay"
            initial={k.reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={k.reduced ? { opacity: 0, transition: { type: false } } : { opacity: 0, y: 24 }}
            transition={k.reduced ? { type: false } : k.spring('smooth')}
            className={cn(
              'fixed end-4 bottom-4 z-40 w-96 max-w-[calc(100vw_-_--spacing(8))] overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-overlay text-fg shadow-lg',
              className,
            )}
          >
            <header className="relative flex items-center gap-1 py-2.5 ps-(--ui--panel-x) pe-2">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={() => onExpandedChange(!expanded)}
                className="group/head -my-1 -ms-1.5 flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 ps-1.5 text-start focus-ring"
              >
                <span className="relative grid size-8 shrink-0 place-items-center">
                  {complete ? (
                    <span className="grid size-8 place-items-center rounded-full bg-success-subtle text-success-text">
                      <CloudUploadIcon size={16} strokeWidth={1.75} active />
                    </span>
                  ) : (
                    <>
                      <Ring
                        value={total ? loaded / total : 0}
                        tone={!online && moving ? 'warning' : failed.length && !moving ? 'danger' : 'accent'}
                        className="size-8"
                      />
                      <CloudUploadIcon size={13} strokeWidth={1.75} className="absolute text-fg-muted" />
                    </>
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="flex min-w-0 items-center gap-2 text-ui font-semibold">
                    <span className="truncate">{title}</span>
                    {demoMarker && (
                      <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong font-normal">
                        {copy.demoData}
                      </Badge>
                    )}
                  </span>
                  <span className="truncate text-ui-sm text-fg-muted tabular-nums">{subline}</span>
                </span>
                <ChevronDownIcon
                  aria-hidden
                  size={16}
                  className={cn('ms-auto shrink-0 text-fg-muted transition-transform yj-duration-base ease-standard', !expanded && 'rotate-180')}
                />
              </button>
              {(moving || paused.length > 0) && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={moving ? copy.pauseAll : copy.resumeAll}
                  onClick={moving ? queue.pauseAll : queue.resumeAll}
                >
                  {moving ? (
                    <span aria-hidden className="flex gap-0.5">
                      <span className="h-2.5 w-0.5 rounded-full bg-current" />
                      <span className="h-2.5 w-0.5 rounded-full bg-current" />
                    </span>
                  ) : (
                    <PlayIcon size={12} strokeWidth={2.25} className="fill-current rtl:-scale-x-100" />
                  )}
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" aria-label={copy.close} onClick={close}>
                <XIcon />
              </Button>
              {/* Folded, the overall progress runs along the header's foot. */}
              {!expanded && !complete && (
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-well">
                  <span
                    className="absolute inset-y-0 start-0 w-full origin-left bg-accent transition-transform yj-duration-base ease-standard rtl:origin-right"
                    style={{ transform: `scaleX(${total ? loaded / total : 0})` }}
                  />
                </span>
              )}
            </header>
            <Collapse open={expanded} id={listId}>
              {/* The queue scrolls in a region of its own height, the offline note pinned to its top: files coming and going never resize the tray. */}
              <div className={cn('yj-scrollbar relative h-80 overflow-y-auto border-t border-line', listClassName)}>
                <Collapse open={!online} className="sticky top-0 z-10">
                  <p className="flex items-start gap-2 border-b border-warning-line bg-warning-subtle px-(--ui--panel-x) py-2 text-ui-sm text-warning-text">
                    <WifiOffIcon size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                    {copy.offlineBanner}
                  </p>
                </Collapse>
                <PresenceList aria-label={copy.region} className="flex flex-col py-1">
                  {items.map((item) => (
                    <PresenceItem key={item.id}>
                      <Row
                        item={item}
                        retries={retries}
                        copy={copy}
                        onPause={() => queue.pause(item.id)}
                        onResume={() => queue.resume(item.id)}
                        onRetry={() => queue.retry(item.id)}
                        onCancel={() => queue.remove(item.id)}
                        onRemove={() => queue.remove(item.id)}
                      />
                    </PresenceItem>
                  ))}
                </PresenceList>
              </div>
              <footer className="flex items-center justify-between gap-3 border-t border-line py-1.5 ps-(--ui--panel-x) pe-2 text-ui-sm text-fg-muted tabular-nums">
                {copy.settled(done.length, items.length)}
                <Button variant="ghost" size="xs" disabled={done.length === 0 || done.length === items.length} onClick={queue.clearDone}>
                  {copy.clearDone}
                </Button>
              </footer>
            </Collapse>
          </m.section>
        )}
      </AnimatePresence>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmTitle(active.length + paused.length)}</AlertDialogTitle>
            <AlertDialogDescription>{copy.confirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.keep}</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                setConfirm(false)
                queue.clear()
              }}
            >
              {copy.confirmCancel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MotionFeatures>
  )
}
