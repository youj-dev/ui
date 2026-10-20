'use client'

import { useId, useRef, useState } from 'react'
import { BookmarkIcon } from '@youj/icons/components/youj/icons/bookmark'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { RotateCcwIcon } from '@youj/icons/components/youj/icons/rotate-ccw'
import { SaveIcon } from '@youj/icons/components/youj/icons/save'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnVisibilityState,
  SortingState,
} from '@tanstack/react-table'
import { useComponentLabels } from '@youj/core/labels'
import { dataTableViewsLabels } from '@youj/core/labels'
import { Button } from '../button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { Field, FieldError, FieldLabel } from '../field'
import { Input } from '../input'
import type { DataTableDensity } from './data-table-model'

/** Everything a saved view restores. Plain JSON, ready to persist. */
export interface DataTableViewState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  columnVisibility: ColumnVisibilityState
  columnOrder: ColumnOrderState
  columnPinning: ColumnPinningState
  density: DataTableDensity
}

export interface DataTableView {
  id: string
  name: string
  state: DataTableViewState
}

/** Key order and empty containers don't make two views different. */
function normalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalise)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalise(v)]),
    )
  }
  return value
}

export function viewStatesEqual(a: DataTableViewState, b: DataTableViewState) {
  return JSON.stringify(normalise(a)) === JSON.stringify(normalise(b))
}

/**
 * The view switcher: named combinations of filters, sort, columns and
 * density. Applying one writes it into the table; changing anything after
 * that marks the view modified (a dot on the trigger) until it is saved or
 * reverted. Views persist through `onViewsChange`, so where they live is the
 * app's business.
 */
export function DataTableViews({
  views,
  activeId,
  current,
  onApply,
  onViewsChange,
}: {
  views: ReadonlyArray<DataTableView>
  activeId: string | null
  current: DataTableViewState
  onApply: (view: DataTableView | null) => void
  onViewsChange: (views: DataTableView[]) => void
}) {
  const active = views.find((view) => view.id === activeId) ?? null
  const dirty = active !== null && !viewStatesEqual(current, active.state)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const labels = useComponentLabels(dataTableViewsLabels)
  const taken = views.some((view) => view.name.trim().toLowerCase() === name.trim().toLowerCase())

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed || taken) return
    const view: DataTableView = { id: `view-${Date.now().toString(36)}`, name: trimmed, state: current }
    onViewsChange([...views, view])
    onApply(view)
    setNaming(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="max-w-56" />}>
          <BookmarkIcon />
          <span className="truncate">{active?.name ?? labels.views}</span>
          {dirty && (
            <>
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
              <span className="sr-only">{labels.viewModified}</span>
            </>
          )}
          <ChevronDownIcon className="own:text-fg-muted" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-60">
          <DropdownMenuLabel>{labels.savedViews}</DropdownMenuLabel>
          {views.length === 0 ? (
            <p className="own:px-2 own:pb-2 own:text-ui-sm own:text-fg-muted">{labels.savedViewsEmpty}</p>
          ) : (
            <DropdownMenuRadioGroup
              value={activeId ?? ''}
              onValueChange={(id) => onApply(views.find((view) => view.id === id) ?? null)}
            >
              {views.map((view) => (
                <DropdownMenuRadioItem key={view.id} value={view.id} closeOnClick>
                  <span className="truncate">{view.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
          <DropdownMenuSeparator />
          {active && dirty && (
            <>
              <DropdownMenuItem onClick={() => onViewsChange(views.map((view) => (view.id === active.id ? { ...view, state: current } : view)))}>
                <SaveIcon />
                {labels.saveViewChanges(active.name)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onApply(active)}>
                <RotateCcwIcon />
                {labels.revertChanges}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem
            onClick={() => {
              setName('')
              setNaming(true)
            }}
          >
            <PlusIcon trigger="none" />
            {labels.saveAsNewView}
          </DropdownMenuItem>
          {active && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="danger"
                onClick={() => {
                  onViewsChange(views.filter((view) => view.id !== active.id))
                  onApply(null)
                }}
              >
                <TrashIcon />
                {labels.deleteView(active.name)}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={naming} onOpenChange={setNaming}>
        <DialogContent className="max-w-sm" initialFocus={input}>
          <form
            className="flex flex-col own:gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <DialogHeader>
              <DialogTitle>{labels.saveView}</DialogTitle>
              <DialogDescription>{labels.saveViewDescription}</DialogDescription>
            </DialogHeader>
            <Field invalid={taken}>
              <FieldLabel>{labels.viewName}</FieldLabel>
              <Input ref={input} value={name} onChange={(event) => setName(event.target.value)} maxLength={48} placeholder={labels.viewNamePlaceholder} aria-describedby={taken ? errorId : undefined} />
              {taken && <FieldError id={errorId}>{labels.viewNameTaken}</FieldError>}
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>{labels.cancel}</DialogClose>
              <Button type="submit" disabled={!name.trim() || taken}>
                {labels.saveView}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
