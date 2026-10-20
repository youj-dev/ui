'use client'

import { useId, useRef, useState } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useLabels, useYouj } from '@youj/core'
import { PlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { SidebarContent } from '../../../components/ui/sidebar'
import { navPages, useFrame, type FrameNavSection } from '../shell'
import { branchesOf, filterNav, shownRow } from '../shell/filter'
import { FrameFilterField } from '../shell/filter-field'
import { FrameTree } from '../shell/tree'
import { DrillPanel, type DrillCopy } from './drill'

/* The panel beside the rail: the chosen section's title with an add button,
 * an optional segmented toggle of views, a filter field, and the section's
 * pages as a tree on guide lines with counts as pills (or one level at a
 * time, `panel="drill"`). A new section's pages arrive from the side of the
 * rail they're on. */

/** A view the panel's toggle offers: "30 days", "12 months". */
export interface FrameRailPanelView {
  id: string
  label: string
}

export interface PanelCopy extends DrillCopy {
  /** The add button's name. */
  add: (section: string) => string
  /** The views toggle's name. */
  views: string
}

interface PanelProps {
  section: FrameNavSection
  from: number
  mode: 'tree' | 'drill'
  search: boolean
  views?: FrameRailPanelView[]
  view: string | undefined
  onViewChange: (id: string) => void
  onAdd?: (section: string) => void
  copy: PanelCopy
}

export function Panel({ section, from, mode, search, views, view, onViewChange, onAdd, copy }: PanelProps) {
  const k = useYouj()
  const labels = useLabels()
  const { active, navigate } = useFrame()
  const idBase = useId()
  const titleId = `${idBase}-title`
  const tree = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  // The first section is simply there; only a switch animates.
  const [shownId, setShownId] = useState(section.id)
  const [switched, setSwitched] = useState(false)
  if (shownId !== section.id) {
    setShownId(section.id)
    setSwitched(true)
  }

  const nav = [section]
  // The branches you've opened; the current page's start open, and a page reached from elsewhere opens its own.
  const [open, setOpen] = useState(() => new Set(branchesOf(nav, active)))
  const [seenActive, setSeenActive] = useState(active)
  if (seenActive !== active) {
    setSeenActive(active)
    const holding = branchesOf(nav, active)
    if (holding.some((id) => !open.has(id))) setOpen(new Set([...open, ...holding]))
  }
  const filtering = query.trim() !== ''
  const shown = filterNav(nav, query)
  const isOpen = (id: string) => filtering || open.has(id)
  const onOpenChange = (ids: string[], next: boolean) => {
    if (filtering) return
    const set = new Set(open)
    for (const id of ids) {
      if (next) set.add(id)
      else set.delete(id)
    }
    setOpen(set)
  }
  const found = navPages(shown).map((p) => p.item)
  const drilling = mode === 'drill' && !filtering

  return (
    <MotionFeatures>
      <m.div
        key={section.id}
        initial={k.reduced || !switched ? false : { opacity: 0, y: from * 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={k.tween('fast', 'enter')}
        className="flex min-h-0 flex-1 flex-col gap-3 pt-3"
      >
        <div className="flex items-center gap-2 ps-2 pe-1">
          <h2 id={titleId} data-slot="frame-panel-title" className="min-w-0 flex-1 truncate text-ui-lg font-semibold tracking-tight text-fg">
            {section.label}
          </h2>
          {onAdd && (
            <Button variant="ghost" size="icon-sm" aria-label={copy.add(section.label ?? section.id)} onClick={() => onAdd(section.id)}>
              <PlusIcon />
            </Button>
          )}
        </div>
        {views?.length ? (
          <SegmentedControl variant="pill" value={view ?? views[0]!.id} onValueChange={(v) => onViewChange(String(v))} aria-label={copy.views} className="w-full *:flex-1">
            {views.map((v) => (
              <SegmentedControlItem key={v.id} value={v.id}>
                {v.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        ) : null}
        {search && (
          <FrameFilterField
            query={query}
            onQuery={setQuery}
            onSubmit={() => found[0] && navigate(found[0].id)}
            onEnterList={() => tree.current?.querySelector<HTMLElement>('[data-yj-tree-item][tabindex="0"], [data-row]')?.focus()}
          />
        )}
        <p role="status" className="sr-only">
          {filtering ? (found.length ? labels.pagesFound(found.length) : labels.pagesNoMatch(query.trim())) : ''}
        </p>
        {/* The tree and the drill-down carry their own key: the content's sits out. */}
        <SidebarContent indicator="none" className="-mx-2">
          <div ref={tree} className="px-2 pb-2">
            {filtering && !found.length ? (
              <p className="px-2 py-6 text-center text-ui text-fg-muted">{labels.pagesNoMatch(query.trim())}</p>
            ) : drilling ? (
              <DrillPanel key={section.id} section={section} copy={copy} labelledBy={titleId} />
            ) : (
              <FrameTree nav={shown} query={query} isOpen={isOpen} onOpenChange={onOpenChange} here={shownRow(shown, active, isOpen)} idBase={idBase} headings={false} />
            )}
          </div>
        </SidebarContent>
      </m.div>
    </MotionFeatures>
  )
}
