'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useFrame, type FrameNavItem, type FrameNavSection, type FrameTrail } from '../shell'
import { Level, type LevelModel, type Row } from './level'

/* The panel as a drill-down (`panel="drill"`): the section's pages one level
 * at a time, as deep as the nav goes. Going deeper slides the new level in
 * from the inline end while the one it replaces slips a third of the way out
 * and fades; going back plays it in reverse. Each level below the top sets
 * its title under the path that leads to it, every step a way straight back.
 * A way in that holds the current page wears the key and names the page.
 * - It opens on the level that holds the current page, and follows the page
 *   when it's reached from elsewhere.
 * - Enter or → (← in RTL) goes in, ← (→ in RTL) goes back; focus lands on
 *   the new level's first row, and on the way back on the row you went in
 *   from; the level is announced. */

export interface DrillCopy {
  /** The path above a level's title, for assistive tech. */
  path: string
  /** The back button's name. */
  back: (level: string) => string
}

/** The groups between the section and the current page, outermost first. */
const pathOf = (trail: FrameTrail | undefined, section: FrameNavSection) =>
  trail && trail.section.id === section.id && trail.child ? [trail.item.id, ...(trail.parents ?? []).map((p) => p.id)] : []

/** How many pages a list holds, at any depth. */
const pageCount = (items: readonly FrameNavItem[]): number => items.reduce((n, item) => n + (item.items?.length ? pageCount(item.items) : 1), 0)

function levelAt(section: FrameNavSection, path: string[], trail: FrameTrail | undefined): LevelModel {
  const page = trail ? (trail.child ?? trail.item) : undefined
  const onPath = new Set(pathOf(trail, section))
  const steps: { id: string; label: string }[] = []
  let items = section.items
  let title = section.label ?? ''
  let key = section.id
  for (const id of path) {
    const group = items.find((item) => item.id === id && item.items?.length)
    if (!group) break
    steps.push({ id: key, label: title })
    items = group.items!
    title = group.label
    key = `${key}/${group.id}`
  }
  const rows = items.map((item): Row =>
    item.items?.length
      ? { kind: 'deeper', id: item.id, label: item.label, icon: item.icon, count: pageCount(item.items), here: onPath.has(item.id) ? page : undefined }
      : { kind: 'page', item },
  )
  return { key, title, steps, rows }
}

export function DrillPanel({ section, copy, labelledBy }: { section: FrameNavSection; copy: DrillCopy; labelledBy: string }) {
  const { trail } = useFrame()
  const [path, setPath] = useState(() => pathOf(trail, section))
  const [direction, setDirection] = useState(1)
  const stack = useRef<HTMLDivElement>(null)
  // Where focus goes once the next level is in: its first row, or the row we came back to.
  const focusNext = useRef<string | null>(null)

  const go = (next: string[], from?: string) => {
    if (next.join('/') === path.join('/')) return
    const rtl = Boolean(stack.current?.closest('[dir=rtl]'))
    setDirection((next.length >= path.length ? 1 : -1) * (rtl ? -1 : 1))
    if (stack.current?.contains(document.activeElement)) focusNext.current = from ?? ''
    setPath(next)
  }
  const deeper = (id: string) => go([...path, id])
  const upTo = (depth: number) => go(path.slice(0, depth), path[depth])
  const back = () => upTo(path.length - 1)

  // A page reached from elsewhere brings its level.
  const here = pathOf(trail, section).join('/')
  // biome-ignore lint/correctness/useExhaustiveDependencies: follows the page's path only, not each render's go
  useEffect(() => {
    if (trail?.section.id === section.id) go(here ? here.split('/') : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- follows the page's path only, not each render's go
  }, [here])

  const level = levelAt(section, path, trail)
  // biome-ignore lint/correctness/useExhaustiveDependencies: moves focus once each new level is in
  useEffect(() => {
    const target = focusNext.current
    if (target === null) return
    focusNext.current = null
    const shown = stack.current?.querySelector('[data-level=current]')
    const row = target ? shown?.querySelector<HTMLElement>(`[data-row="${target}"]`) : shown?.querySelector<HTMLElement>('[data-row]')
    row?.focus()
  }, [level.key])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const [inward, outward] = rtl ? ['ArrowLeft', 'ArrowRight'] : ['ArrowRight', 'ArrowLeft']
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-row]')
    if (event.key === inward && row?.hasAttribute('data-deeper')) {
      event.preventDefault()
      deeper(row.dataset.row!)
    } else if (event.key === outward && path.length && row) {
      event.preventDefault()
      back()
    }
  }

  return (
    <>
      <div ref={stack} onKeyDown={onKeyDown} className="grid min-w-0 overflow-x-clip">
        <MotionFeatures>
          <AnimatePresence initial={false} custom={direction}>
            <Level key={level.key} level={level} direction={direction} onUp={upTo} onDeeper={deeper} copy={copy} labelledBy={labelledBy} />
          </AnimatePresence>
        </MotionFeatures>
      </div>
      <div role="status" className="sr-only">
        {level.steps.length ? level.title : ''}
      </div>
    </>
  )
}
