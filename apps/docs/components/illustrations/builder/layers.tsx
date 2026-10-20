'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { cn } from '@/lib/cn'
import { boundsOf, isRound, MAX_NAME, type BuilderScene } from '@youj/illustrations/builder'

/* The layers: every part in the scene, in its order, a group's parts under
 * its row. It's how the scene is read and chosen from the keyboard, and the
 * canvas mirrors it: one listbox (one tab stop, the active row followed with
 * aria-activedescendant), the arrows move and select, Shift extends, Space
 * adds or removes a row, Enter goes to the canvas to move what's chosen, and
 * F2 (or a double-click) names a part, a name the code keeps.
 * Order doesn't set depth (the scene sorts itself); it only reads as the
 * code will. */

type Row = { kind: 'group'; id: string; members: string[]; label: string } | { kind: 'part'; id: string; nested: boolean }

function rowsOf(scene: BuilderScene): Row[] {
  const rows: Row[] = []
  const seen = new Set<string>()
  scene.parts.forEach((part) => {
    if (!part.group) return rows.push({ kind: 'part', id: part.id, nested: false })
    if (seen.has(part.group)) return
    seen.add(part.group)
    const members = scene.parts.filter((p) => p.group === part.group).map((p) => p.id)
    rows.push({ kind: 'group', id: part.group, members, label: `Group ${scene.groups.findIndex((g) => g.id === part.group) + 1}` })
    for (const id of members) rows.push({ kind: 'part', id, nested: true })
  })
  return rows
}

const idsOf = (row: Row) => (row.kind === 'group' ? row.members : [row.id])
const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id))

export interface LayersProps {
  scene: BuilderScene
  names: ReadonlyMap<string, string>
  selected: readonly string[]
  onSelect: (ids: string[]) => void
  /** Enter: go to the canvas with the selection. */
  onEnter: () => void
  /** A part named in place (F2 or a double-click); an empty name gives it its own back. */
  onRename: (id: string, name: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

export function Layers({ scene, names, selected, onSelect, onEnter, onRename, onKeyDown }: LayersProps) {
  const base = useId()
  const rows = useMemo(() => rowsOf(scene), [scene])
  const list = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const rowKey = (row: Row) => `${row.kind}-${row.id}`

  const finishRename = (id: string, value: string | null) => {
    setEditing(null)
    if (value !== null) onRename(id, value)
    list.current?.focus({ preventScroll: true })
  }

  // The active row follows a selection made elsewhere (the canvas), and never points at a row that's gone.
  useEffect(() => {
    const current = rows.find((r) => rowKey(r) === active)
    if (current && idsOf(current).every((id) => selected.includes(id))) return
    const last = selected.at(-1)
    const next = (last && rows.find((r) => r.kind === 'part' && r.id === last)) || (current ? current : rows[0])
    setActive(next ? rowKey(next) : null)
  }, [rows, selected, active])

  // The active row scrolls into the list's view. By hand, not scrollIntoView: that also moves the browser's
  // sequential focus starting point, so on arrival the first Tab landed in the toolbar, past the skip link.
  useEffect(() => {
    if (!active) return
    const row = document.getElementById(`${base}-${active}`)
    let view = row?.parentElement
    while (view && !/auto|scroll/.test(getComputedStyle(view).overflowY)) view = view.parentElement
    if (!row || !view) return
    const r = row.getBoundingClientRect()
    const v = view.getBoundingClientRect()
    if (r.top < v.top) view.scrollTop -= v.top - r.top
    else if (r.bottom > v.bottom) view.scrollTop += r.bottom - v.bottom
  }, [active, base])

  const isSelected = (row: Row) => idsOf(row).every((id) => selected.includes(id))

  const pick = (row: Row, extend: boolean, toggle: boolean) => {
    setActive(rowKey(row))
    const ids = idsOf(row)
    if (toggle) onSelect(isSelected(row) ? selected.filter((id) => !ids.includes(id)) : [...selected, ...ids.filter((id) => !selected.includes(id))])
    else if (extend) onSelect([...selected, ...ids.filter((id) => !selected.includes(id))])
    else if (!same(selected, ids)) onSelect(ids)
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = rows.findIndex((r) => rowKey(r) === active)
    const go = (i: number) => {
      const row = rows[Math.max(0, Math.min(rows.length - 1, i))]
      if (row) pick(row, e.shiftKey, false)
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      // With nothing chosen yet, the first press chooses the row the focus is on.
      go(index < 0 ? 0 : !selected.length ? index : index + (e.key === 'ArrowDown' ? 1 : -1))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      go(e.key === 'Home' ? 0 : rows.length - 1)
    } else if (e.key === ' ' && index >= 0) {
      e.preventDefault()
      pick(rows[index]!, false, true)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onEnter()
    } else if (e.key === 'F2' && rows[index]?.kind === 'part') {
      e.preventDefault()
      setEditing(rows[index]!.id)
    } else onKeyDown(e)
  }

  const onClick = (e: MouseEvent, row: Row) => pick(row, false, e.shiftKey || e.metaKey || e.ctrlKey)

  if (!rows.length) {
    return (
      <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12px] leading-relaxed text-pretty text-fg-muted">
        No parts yet. Drag one onto the floor, or press it.
      </p>
    )
  }

  return (
    <div
      ref={list}
      role="listbox"
      aria-label="Layers"
      aria-multiselectable="true"
      aria-activedescendant={active ? `${base}-${active}` : undefined}
      tabIndex={0}
      onKeyDown={onKey}
      className="flex flex-col gap-px rounded-lg outline-none"
    >
      {rows.map((row) => {
        const key = rowKey(row)
        const selectedRow = isSelected(row)
        const part = row.kind === 'part' ? scene.parts.find((p) => p.id === row.id) : undefined
        const size = part ? (isRound(part) ? `r${part.r} · ${part.h}` : `${boundsOf(part).w}×${boundsOf(part).d}×${part.h}`) : `${row.kind === 'group' ? row.members.length : 0} parts`
        const name = row.kind === 'group' ? row.label : (names.get(row.id) ?? row.id)
        return (
          <div
            key={key}
            id={`${base}-${key}`}
            role="option"
            aria-selected={selectedRow}
            aria-label={`${name}${part?.lit ? ', lit' : ''}, ${size}`}
            onPointerDown={(e) => e.preventDefault()}
            onClick={(e) => {
              if (editing === row.id) return
              list.current?.focus({ preventScroll: true })
              onClick(e, row)
            }}
            onDoubleClick={() => row.kind === 'part' && setEditing(row.id)}
            className={cn(
              'flex h-7 cursor-default items-center gap-2 rounded-md px-2 text-[12.5px] transition-colors yj-duration-fast ease-standard select-none',
              row.kind === 'part' && row.nested && 'ps-6',
              selectedRow ? 'bg-accent-subtle text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
              active === key && '[[role=listbox]:focus-visible_&]:ring-1 [[role=listbox]:focus-visible_&]:ring-accent [[role=listbox]:focus-visible_&]:ring-inset',
            )}
          >
            <span aria-hidden className={cn('size-1.5 shrink-0 rounded-[1px]', row.kind === 'group' ? 'border border-current' : part?.lit ? 'bg-accent' : 'bg-line-strong')} />
            {editing === row.id ? (
              <input
                // Opened with F2 or a double-click: focused and selected, as renaming a file is.
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                defaultValue={name}
                maxLength={MAX_NAME}
                aria-label={`Rename ${name}`}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') finishRename(row.id, e.currentTarget.value)
                  else if (e.key === 'Escape') finishRename(row.id, null)
                }}
                onBlur={(e) => editing === row.id && finishRename(row.id, e.currentTarget.value)}
                className="-ms-1 h-6 min-w-0 flex-1 rounded-sm bg-canvas px-1 text-[12.5px] text-fg outline-none ring-1 ring-accent"
              />
            ) : (
              <span className={cn('min-w-0 flex-1 truncate', row.kind === 'group' && 'font-medium text-fg')}>{name}</span>
            )}
            <span aria-hidden className="shrink-0 type-label text-fg-subtle tabular-nums">
              {size}
            </span>
          </div>
        )
      })}
    </div>
  )
}
