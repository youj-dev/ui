'use client'

import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import { useYouj } from '@youj/core'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../../components/ui/dialog'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { Art } from './art'
import { formatBytes, formatDuration, type MediaLibraryAsset, type MediaLibraryCopy, type MediaLibraryFolder } from './data'

/* A file large, with its details and a Select that doesn't close it. It
 * grows out of its tile: the picture starts where the tile's was and moves
 * into place (a FLIP on the Web Animations API, on the slow token and the
 * emphasized curve), while the dialog fades in; ← and → step through what's
 * shown, and closing hands focus back to the file's tile. A video with a
 * file plays; one without (the demo's) shows its frame. Reduced motion: it
 * appears in place. */

interface LightboxProps {
  asset: MediaLibraryAsset | null
  index: number
  total: number
  selected: boolean
  folders: MediaLibraryFolder[]
  copy: MediaLibraryCopy
  /** The tile it grows from and returns focus to. */
  origin: () => HTMLElement | null
  onStep: (delta: number) => void
  onToggle: () => void
  onClose: () => void
}

export function Lightbox({ asset, index, total, selected, folders, copy, origin, onStep, onToggle, onClose }: LightboxProps) {
  const k = useYouj()
  const picture = useRef<HTMLDivElement>(null)
  const opened = useRef<string | null>(null)

  // Grow from the tile the first time it opens (not on every step).
  useLayoutEffect(() => {
    if (!asset) {
      opened.current = null
      return
    }
    if (opened.current || k.reduced) {
      opened.current = asset.id
      return
    }
    opened.current = asset.id
    const from = origin()?.querySelector('img, svg')?.getBoundingClientRect()
    const el = picture.current
    if (!from || !el || typeof el.animate !== 'function') return
    const to = el.getBoundingClientRect()
    if (!to.width || !to.height) return
    const scale = Math.max(from.width / to.width, from.height / to.height)
    el.animate(
      [
        {
          transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${scale})`,
          opacity: 0.6,
        },
        { transform: 'none', opacity: 1 },
      ],
      { duration: k.ms('slow'), easing: `cubic-bezier(${k.ease('emphasized').join(',')})` }, // youj-allow: the emphasized token's own curve, for a Web Animation
    )
  }, [asset, k, origin])

  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    if (event.key === 'ArrowRight') onStep(rtl ? -1 : 1)
    else if (event.key === 'ArrowLeft') onStep(rtl ? 1 : -1)
    else return
    event.preventDefault()
  }

  const facts = asset
    ? [
        [copy.type, copy.kinds[asset.kind]],
        asset.width && asset.height ? [copy.dimensionsLabel, copy.dimensions(asset.width, asset.height)] : null,
        asset.duration !== undefined ? [copy.length, formatDuration(asset.duration, copy.locale)] : null,
        [copy.size, formatBytes(asset.size, copy.locale)],
        [copy.added, dateTimeFormat(copy.locale, { dateStyle: 'medium' }).format(asset.addedAt)],
        [copy.folder, folders.find((f) => f.id === asset.folder)?.name ?? copy.root],
        [copy.alt, asset.alt || copy.noAlt],
      ].filter((row): row is string[] => !!row)
    : []

  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        presentation="dialog"
        finalFocus={origin}
        className="max-w-5xl gap-0 overflow-hidden p-0 sm:grid sm:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*64)]"
        onKeyDown={onKeyDown}
      >
        {asset && (
          <>
            <div className="relative grid min-h-72 place-items-center bg-well p-6 sm:min-h-120">
              <div ref={picture} className="grid max-h-[70vh] w-full place-items-center">
                {asset.kind === 'video' && asset.url ? (
                  <video src={asset.url} poster={asset.preview} controls className="max-h-[70vh] max-w-full rounded-md" />
                ) : asset.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
                  <img
                    src={asset.url ?? asset.preview}
                    alt={asset.alt ?? ''}
                    className="max-h-[70vh] max-w-full rounded-md object-contain shadow-md"
                  />
                ) : (
                  <span className="flex w-full max-w-sm flex-col items-center gap-3">
                    <Art kind={asset.kind} name={asset.name} className="aspect-square w-full rounded-md" />
                    <span className="text-ui-sm text-fg-muted">{copy.noPreview}</span>
                  </span>
                )}
              </div>
              <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
                <Button
                  variant="secondary"
                  size="icon"
                  className="shadow-sm"
                  aria-label={copy.previous}
                  disabled={index === 0}
                  onClick={() => onStep(-1)}
                >
                  <ChevronLeftIcon trigger="none" className="rtl:-scale-x-100" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="shadow-sm"
                  aria-label={copy.next}
                  disabled={index === total - 1}
                  onClick={() => onStep(1)}
                >
                  <ChevronRightIcon trigger="none" className="rtl:-scale-x-100" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t border-line p-5 sm:border-t-0 sm:border-s">
              <div className="flex flex-col gap-1 pe-8">
                <DialogTitle dir="auto" className="wrap-break-word">
                  {asset.name}
                </DialogTitle>
                <DialogDescription className="tabular-nums">{copy.position(index + 1, total)}</DialogDescription>
              </div>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-ui-sm">
                {facts.map(([term, value]) => (
                  <div key={term} className="contents">
                    <dt className="text-fg-muted">{term}</dt>
                    <dd className={cn('text-fg tabular-nums', term === copy.alt && !asset.alt && 'text-fg-subtle')}>{value}</dd>
                  </div>
                ))}
              </dl>
              <Button className="mt-auto" variant={selected ? 'secondary' : 'default'} aria-pressed={selected} onClick={onToggle}>
                {selected && <CheckIcon trigger="mount" />}
                {selected ? copy.deselect : copy.select}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
