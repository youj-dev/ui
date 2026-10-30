'use client'

import type { KeyboardEvent, MouseEvent } from 'react'
import { PresenceItem } from '@youj/motion'
import { CheckIcon, MaximizeIcon, PlayIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { Art } from './art'
import { formatBytes, formatDuration, type MediaLibraryAsset, type MediaLibraryCopy } from './data'

/* One file as an option of the library's listbox, a tile in the grid or a
 * row in the list. Selected, its picture draws in from the edges inside an
 * accent ring and a badge says where it sits in the selection (the first is
 * the cover); on hover an empty mark says it can be picked, and a corner
 * opens it large. A video shows its running time; an upload fills a ring
 * over its picture and can't be picked until it's in. */

interface TileProps {
  asset: MediaLibraryAsset
  id: string
  view: 'grid' | 'list'
  /** Its place in the selection, from 0; −1 when it isn't selected. */
  position: number
  focused: boolean
  copy: MediaLibraryCopy
  onPress: (event: MouseEvent) => void
  onOpen: () => void
  onFocus: () => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

const meta = (a: MediaLibraryAsset, copy: MediaLibraryCopy) =>
  [
    a.duration !== undefined && formatDuration(a.duration, copy.locale),
    a.width && a.height && copy.dimensions(a.width, a.height),
    formatBytes(a.size, copy.locale),
  ]
    .filter(Boolean)
    .join(' · ')

function Picture({ asset, className }: { asset: MediaLibraryAsset; className?: string }) {
  return asset.preview ? (
    // eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too
    <img src={asset.preview} alt="" draggable={false} loading="lazy" decoding="async" className={cn('size-full object-cover', className)} />
  ) : (
    <Art kind={asset.kind} name={asset.name} className={cn('size-full', className)} />
  )
}

function Upload({ progress, copy }: { progress: number; copy: MediaLibraryCopy }) {
  return (
    <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--color-canvas)_55%,transparent)] backdrop-blur-xs">
      <span className="relative grid size-10 place-items-center">
        <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 -rotate-90">
          <circle cx="20" cy="20" r="17" fill="none" strokeWidth="3" className="stroke-well" />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${progress} 100`}
            className="stroke-accent transition-[stroke-dasharray] yj-duration-base ease-standard"
          />
        </svg>
        <span className="text-ui-xs font-medium text-fg tabular-nums">{Math.round(progress)}</span>
      </span>
      <span className="sr-only">{copy.uploading(Math.round(progress))}</span>
    </span>
  )
}

export function Tile({ asset, id, view, position, focused, copy, onPress, onOpen, onFocus, onKeyDown }: TileProps) {
  const selected = position >= 0
  const uploading = asset.progress !== undefined
  const details = meta(asset, copy)
  const open = (event: MouseEvent) => {
    event.stopPropagation()
    onOpen()
  }
  return (
    <PresenceItem
      as="li"
      id={id}
      role="option"
      aria-selected={selected}
      aria-disabled={uploading || undefined}
      // The tile as shown (its number, name and details, in the view's order), then which pick it is.
      aria-label={`${(view === 'grid' ? [selected && position + 1, asset.name, details] : [asset.name, details, selected && position + 1]).filter(Boolean).join(' ')}${selected ? `, ${copy.selectedAs(position + 1)}` : ''}`}
      tabIndex={focused ? 0 : -1}
      data-slot="media-library-item"
      onClick={uploading ? undefined : onPress}
      onDoubleClick={uploading ? undefined : onOpen}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={cn(
        'group/tile relative cursor-default rounded-lg outline-none select-none focus-ring',
        view === 'grid' ? 'flex flex-col gap-2' : 'flex items-center gap-3 px-2 py-1.5 hover:bg-hover aria-selected:bg-selected',
      )}
    >
      <span
        className={cn(
          'relative shrink-0 overflow-hidden bg-well transition-[box-shadow] yj-duration-fast ease-standard',
          view === 'grid' ? 'aspect-square w-full rounded-lg' : 'size-10 rounded-md',
          selected && view === 'grid' && 'shadow-[0_0_0_2px_var(--color-accent)]',
        )}
      >
        <Picture
          asset={asset}
          className={cn(
            'transition-[scale,border-radius] [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))] ease-spring',
            selected && view === 'grid' && 'scale-[0.88] rounded-md',
          )}
        />
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] border border-line-subtle" />
        {asset.kind === 'video' && asset.duration !== undefined && view === 'grid' && (
          <span className="absolute start-2 bottom-2 flex items-center gap-1 rounded-sm bg-[color-mix(in_oklab,var(--color-shadow)_62%,transparent)] px-1.5 py-0.5 text-ui-xs font-medium text-[white] tabular-nums">
            <PlayIcon size={9} strokeWidth={2.5} className="fill-current rtl:-scale-x-100" />
            {formatDuration(asset.duration, copy.locale)}
          </span>
        )}
        {uploading && <Upload progress={asset.progress!} copy={copy} />}
      </span>
      {view === 'grid' && !uploading && (
        <>
          <span
            aria-hidden
            className={cn(
              'absolute end-2 top-2 grid size-6 place-items-center rounded-full text-ui-xs font-semibold tabular-nums transition-[opacity,scale,background-color] yj-duration-fast ease-standard',
              selected
                ? 'scale-100 bg-accent text-on-accent shadow-sm'
                : 'scale-90 border-2 border-[white] bg-[color-mix(in_oklab,var(--color-shadow)_22%,transparent)] opacity-0 group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100 touch:opacity-100',
            )}
          >
            {selected && position + 1}
          </span>
          <span
            aria-hidden
            role="presentation"
            onClick={open}
            className="absolute start-2 top-2 grid size-6 place-items-center rounded-md bg-[color-mix(in_oklab,var(--color-shadow)_50%,transparent)] text-[white] opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/tile:opacity-100"
          >
            <MaximizeIcon size={12} strokeWidth={2} />
          </span>
        </>
      )}
      {' '}
      <span className={cn('flex min-w-0 flex-col', view === 'list' && 'flex-1')}>
        <span dir="auto" className="truncate text-ui-sm font-medium text-fg">
          {asset.name}
        </span>{' '}
        <span className="truncate text-ui-xs text-fg-muted tabular-nums">{details}</span>
      </span>{' '}
      {view === 'list' && (
        <span
          aria-hidden
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full text-ui-xs font-semibold tabular-nums',
            selected ? 'bg-accent text-on-accent' : 'border border-line-strong',
          )}
        >
          {selected ? position + 1 : <CheckIcon size={10} className="opacity-0" />}
        </span>
      )}
    </PresenceItem>
  )
}
