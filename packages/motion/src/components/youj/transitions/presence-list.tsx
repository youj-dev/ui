'use client'

import { createContext, useContext, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, LayoutGroup, m, useIsPresent } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { MotionFeatures } from '@youj/core/lib/youj/features'
import { useSettledEntrances } from '../motion/settled'

/* Insert, remove and reorder for lists and table rows, built to work on <tr>.
 * Table rows rule out the usual tricks: a popped-out (absolute) <tr> loses
 * table layout, and a row can't be collapsed by height or clipped with
 * overflow. So:
 * - Enter: the row appears in its slot and fades in from a few px above,
 *   while the rows below glide down to make room.
 * - Exit: the row fades where it stands (keeping its space, so column widths
 *   hold), inert at once; then it is removed and the rows below glide up.
 * - Reorder: rows glide to their new slots.
 * All movement is FLIP on translate only (layout="position"): no scale, so
 * cells, borders and text never distort. The list element is a layout root:
 * rows are measured against it, so when the list itself moves (a toolbar
 * appears above it, a centered card re-centers) rows don't glide for nothing.
 * Every list is its own LayoutGroup so two lists don't fight, and items
 * re-measure whenever the list renders, even when rows are memoized.
 *
 * Tables: `border-collapse: collapse` (Tailwind's default for tables) paints
 * borders on the table grid, so they'd stay behind while rows move. Use
 * `border-separate border-spacing-0`, put row dividers on the cells, and give
 * rows a background so rows crossing during a re-sort occlude cleanly. */

/** A fresh value per PresenceList render, so memoized rows still re-measure with the list. */
const ListRender = createContext<object>({})

const LISTS = { ul: m.ul, ol: m.ol, tbody: m.tbody, div: m.div }

export interface PresenceListProps
  extends Omit<HTMLAttributes<HTMLElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** The list element. Default 'ul'. */
  as?: keyof typeof LISTS
  /** Also animate the items present on first render. Default false. */
  initial?: boolean
  /** PresenceItems, keyed by a stable id. */
  children: ReactNode
}

/** A list (or tbody) whose PresenceItems animate as they are added, removed and reordered. */
export function PresenceList({ as = 'ul', initial = false, children, ...rest }: PresenceListProps) {
  const List = LISTS[as] as typeof m.ul
  return (
    <MotionFeatures features="max">
      <LayoutGroup inherit="id">
        {/* A measured layout root: items animate relative to it, and its own moves apply instantly. */}
        <List {...rest} layout layoutRoot>
          <ListRender.Provider value={{}}>
            <AnimatePresence initial={initial}>{children}</AnimatePresence>
          </ListRender.Provider>
        </List>
      </LayoutGroup>
    </MotionFeatures>
  )
}

const TAGS = { li: m.li, tr: m.tr, div: m.div, article: m.article, section: m.section }

export interface PresenceItemProps
  extends Omit<HTMLAttributes<HTMLElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /** The element to render. Default 'li'. */
  as?: keyof typeof TAGS
  children?: ReactNode
}

/** One animated row (`as="tr"` inside `<PresenceList as="tbody">`). Must be a direct, keyed child of PresenceList. */
export function PresenceItem({ as = 'li', children, ...rest }: PresenceItemProps) {
  const k = useYouj()
  const settled = useSettledEntrances()
  useContext(ListRender)
  const present = useIsPresent()
  const Tag = TAGS[as] as typeof m.div
  return (
    <Tag
      {...rest}
      // Reduced: no projection at all, so changes (removals included) apply at once.
      layout={k.reduced ? false : 'position'}
      inert={!present || undefined}
      initial={k.reduced || settled ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0, transition: k.reduced ? { type: false } : k.tween('base', 'enter') }}
      exit={k.reduced ? undefined : { opacity: 0, transition: k.tween('fast', 'exit') }}
      transition={{ layout: k.reduced ? { type: false } : k.spring('smooth') }}
    >
      {children}
    </Tag>
  )
}
