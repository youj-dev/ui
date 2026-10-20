'use client'

import { useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { PresenceList } from '@youj/motion'
import { cn } from '../../../lib/utils'
import type { MediaLibraryAsset, MediaLibraryCopy } from './data'
import { Tile } from './tile'

/* The files as one multi-select listbox, one tab stop: arrows move in two
 * dimensions in the grid (up and down by a row, however many the width
 * holds; left and right follow the reading direction), Home and End jump,
 * Space picks or drops the focused file, Shift with an arrow or Space or a
 * click picks a run, ⌘A or Ctrl+A picks everything shown (as far as the
 * maximum allows), Enter opens it large and Escape clears the selection. A
 * click picks or drops; a double click opens. Results come and go through
 * PresenceList, the rest gliding into place. */

interface GridProps {
  assets: MediaLibraryAsset[]
  view: 'grid' | 'list'
  selection: string[]
  label: string
  /** The element id of a file's option: the lightbox hands focus back to it. */
  idOf: (id: string) => string
  copy: MediaLibraryCopy
  onToggle: (id: string) => void
  onExtend: (from: string, to: string) => void
  onSelectAll: () => void
  onClear: () => void
  onOpen: (id: string) => void
}

export function Grid({ assets, view, selection, label, idOf, copy, onToggle, onExtend, onSelectAll, onClear, onOpen }: GridProps) {
  const list = useRef<HTMLDivElement>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const anchor = useRef<string | null>(null)
  const ready = assets.filter((a) => a.progress === undefined)
  const current = focus && assets.some((a) => a.id === focus) ? focus : (ready[0]?.id ?? assets[0]?.id ?? null)
  const domId = idOf

  /** How many tiles a row holds at this width. */
  const columns = () => {
    if (view === 'list') return 1
    const tiles = Array.from(list.current?.querySelectorAll<HTMLElement>('[role=option]:not([inert])') ?? [])
    const top = tiles[0]?.offsetTop
    return Math.max(1, tiles.filter((el) => el.offsetTop === top).length)
  }
  const go = (id: string) => {
    setFocus(id)
    document.getElementById(domId(id))?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!current) return
    const i = assets.findIndex((a) => a.id === current)
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: columns(), ArrowUp: -columns() }[event.key]
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault()
      return onSelectAll()
    }
    if (event.key === ' ') {
      event.preventDefault()
      if (event.shiftKey && anchor.current) onExtend(anchor.current, current)
      else onToggle(current)
      anchor.current = current
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      return onOpen(current)
    }
    if (event.key === 'Escape' && selection.length > 0) {
      event.preventDefault()
      event.stopPropagation()
      return onClear()
    }
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? assets.length - 1
          : step !== undefined && (view === 'grid' || (!event.key.includes('Left') && !event.key.includes('Right')))
            ? i + step
            : null
    if (next === null) return
    event.preventDefault()
    const target = assets[Math.max(0, Math.min(assets.length - 1, next))]!
    go(target.id)
    if (event.shiftKey) onExtend(anchor.current ?? current, target.id)
    else anchor.current = target.id
  }

  const onPress = (id: string) => (event: MouseEvent) => {
    if (event.shiftKey && anchor.current) onExtend(anchor.current, id)
    else {
      onToggle(id)
      anchor.current = id
    }
    setFocus(id)
  }

  return (
    <div ref={list}>
      <PresenceList
        as="ul"
        role="listbox"
        aria-label={label}
        aria-multiselectable
        className={cn(
          view === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(calc(var(--spacing)*30),1fr))] gap-x-3 gap-y-4' : 'flex flex-col gap-0.5',
        )}
      >
        {assets.map((asset) => (
          <Tile
            key={asset.id}
            id={domId(asset.id)}
            asset={asset}
            view={view}
            position={selection.indexOf(asset.id)}
            focused={asset.id === current}
            copy={copy}
            onPress={onPress(asset.id)}
            onOpen={() => onOpen(asset.id)}
            onFocus={() => setFocus(asset.id)}
            onKeyDown={onKeyDown}
          />
        ))}
      </PresenceList>
    </div>
  )
}
