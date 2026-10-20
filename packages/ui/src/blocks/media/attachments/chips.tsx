'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Chip } from './chip'
import type { AttachmentComposerCopy, AttachmentComposerFile } from './data'

/* The attachments in their order, in one row that scrolls sideways (so the
 * card never grows as files come). Dragging one shows where it
 * would land with a caret between the others (reading order, so right to
 * left in RTL); the order changes on release. With the keyboard, Alt or
 * Option and an arrow moves the focused one, Home and End with it move it
 * to either end, Delete or Backspace removes it and focus goes on to its
 * neighbour (or back to the message when none is left). Chips enter and
 * leave with a fade and a scale, and the rest glide on layout. */

interface ChipsProps {
  files: AttachmentComposerFile[]
  copy: AttachmentComposerCopy
  modifier: string
  /** The element id of a file's item, so focus can be put on it from outside. */
  idOf: (id: string) => string
  onOpen: (id: string) => void
  onRetry: (id: string) => void
  onRemove: (id: string) => void
  onMove: (id: string, to: number) => void
  /** Focus has nowhere left in the list (the last one was removed). */
  onEmpty: () => void
}

export function Chips({ files, copy, modifier, idOf, onOpen, onRetry, onRemove, onMove, onEmpty }: ChipsProps) {
  const k = useYouj()
  const keysId = useId()
  const list = useRef<HTMLUListElement>(null)
  const [drag, setDrag] = useState<{ id: string; to: number; caret: { x: number; y: number; h: number } | null } | null>(null)
  const [settling, setSettling] = useState<string | null>(null)

  const chips = () => Array.from(list.current?.children ?? []).filter((el): el is HTMLElement => el.tagName === 'LI')
  const focusChip = (id: string) => requestAnimationFrame(() => document.getElementById(idOf(id))?.querySelector('button')?.focus())

  /** Where a dragged chip would land: the first other chip after the pointer, in reading order. */
  const target = (id: string, px: number, py: number) => {
    const box = list.current!.getBoundingClientRect()
    const rtl = getComputedStyle(list.current!).direction === 'rtl'
    const others = chips().filter((el) => el.id !== idOf(id))
    const rects = others.map((el) => el.getBoundingClientRect())
    const index = rects.findIndex((r) => (py < r.top ? true : py <= r.bottom && (rtl ? px > r.left + r.width / 2 : px < r.left + r.width / 2)))
    const at = index < 0 ? others.length : index
    const edge = rects[at] ?? rects[at - 1]
    const caret = edge
      ? {
          x: (rects[at] ? (rtl ? edge.right + 4 : edge.left - 6) : rtl ? edge.left - 6 : edge.right + 4) - box.left,
          y: edge.top - box.top,
          h: edge.height,
        }
      : null
    return { to: at, caret }
  }

  const onKeyDown = (id: string) => (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = files.findIndex((f) => f.id === id)
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End')) {
      event.preventDefault()
      const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1
      onMove(id, event.key === 'Home' ? 0 : event.key === 'End' ? files.length - 1 : index + step)
      focusChip(id)
      return
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      const next = files[index + 1] ?? files[index - 1]
      onRemove(id)
      if (next) focusChip(next.id)
      else onEmpty()
    }
  }

  return (
    <MotionFeatures features="max">
      <span id={keysId} className="sr-only">
        {copy.keys(modifier)}
      </span>
      <ul ref={list} aria-label={copy.attachments} className="yj-scrollbar relative flex h-full gap-2.5 overflow-x-auto pt-2 pe-2 pb-1">
        <AnimatePresence initial={false} mode="popLayout">
          {files.map((file) => (
            <m.li
              key={file.id}
              id={idOf(file.id)}
              layout={drag?.id !== file.id && settling !== file.id ? 'position' : false}
              initial={k.reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={k.reduced ? { opacity: 0, transition: { type: false } } : { opacity: 0, scale: 0.9 }}
              transition={k.reduced ? { type: false } : k.spring('smooth')}
              className="group/item relative"
            >
              <Chip
                file={file}
                copy={copy}
                keysId={keysId}
                dragging={drag?.id === file.id}
                settling={settling === file.id}
                onOpen={() => onOpen(file.id)}
                onRetry={() => onRetry(file.id)}
                onRemove={() => {
                  const index = files.findIndex((f) => f.id === file.id)
                  const next = files[index + 1] ?? files[index - 1]
                  onRemove(file.id)
                  if (next) focusChip(next.id)
                  else onEmpty()
                }}
                onKeyDown={onKeyDown(file.id)}
                onDragStart={() => setDrag({ id: file.id, to: files.findIndex((f) => f.id === file.id), caret: null })}
                onDragMove={(px, py) => setDrag({ id: file.id, ...target(file.id, px, py) })}
                onDrop={() => {
                  const to = drag?.to
                  setDrag(null)
                  setSettling(file.id)
                  if (to !== undefined) onMove(file.id, to)
                }}
                onSettled={() => setSettling(null)}
              />
            </m.li>
          ))}
        </AnimatePresence>
        {drag?.caret && (
          <span
            aria-hidden
            className="pointer-events-none absolute w-0.5 rounded-full bg-accent"
            style={{ left: drag.caret.x, top: drag.caret.y, height: drag.caret.h }}
          />
        )}
      </ul>
    </MotionFeatures>
  )
}
