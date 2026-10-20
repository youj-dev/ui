'use client'

import { buttonAsyncLabels, multiSelectLabels } from '@youj/core/labels'
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, type Ref } from 'react'
import { useDirection } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { ChevronDownIcon as YoujChevron } from '@youj/icons/components/youj/icons/chevron-down'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { useResizeMeasure } from '../../hooks/use-resize-measure'
import { Badge, BadgeRemove } from './badge'
import { Button } from './button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  OptionNote,
  OptionRow,
  useOptionWindow,
} from './command'
import { useFieldControl } from './field'
import { InputGroup } from './input-group'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './popover'
import { sheetKeyboardClass, useKeyboardSheet, useSheetPresentation, type OverlayPresentation } from './presentation'

/* Several values from a searchable list: an InputGroup frame holds the chosen
 * values as Badge chips, as many as fit on one line, then "+N"; the trigger
 * beside them (role "combobox", named by its FieldLabel) opens a Popover with
 * a Command of checkbox rows, grouped, with "Select all" and an optional
 * limit. Chips enter and leave through motion's PresenceList: a new chip fades
 * down into its slot while the others glide aside, a removed one fades where
 * it stands and the rest close the gap. Reduced motion: instant.
 *
 * Keyboard: the trigger opens with ArrowDown, Enter or Space; in the list
 * Enter toggles and the popup stays open, Escape closes. Backspace in an empty
 * search removes the last value. On the trigger, Backspace or ArrowLeft moves
 * to the last chip; arrows move between chips, Backspace or Delete removes
 * the focused chip, and focus lands on its neighbor. Removals, "select all"
 * and reaching the limit are announced.
 *
 * On touch the list is a bottom sheet (presentation.tsx): a search field and
 * a Done button at its top, 48px checkbox rows, and the limit under them. A
 * tap toggles a row and the sheet stays open; Done, a pull down, a tap
 * outside or Escape puts it away. It opens with the keyboard down; a tap on
 * the field raises it, and the sheet then sits on the keys with the field in
 * view. It keeps its height while the search narrows the list.
 * `presentation="popover"` keeps the popover on touch; "sheet" forces it. */

/** The labels it reads: its own, plus the shared "Done" for the sheet's button. */
const labelDefaults = { ...multiSelectLabels, done: buttonAsyncLabels.done }

/** The popup as a search sheet: the Command fills it under the handle, and it follows the keyboard. */
const searchSheetClass = cn(sheetKeyboardClass, 'gap-0 overflow-hidden own:px-1.5')

interface MultiSelectOption {
  value: string
  label: string
  /** Secondary text on the row. Searched too. */
  description?: string
  /** Leading visual on the row. */
  icon?: ReactNode
  /** Rows with the same group sit under one heading, in the order groups first appear. */
  group?: string
  /** Extra words the search matches. */
  keywords?: string[]
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Shown when nothing is chosen. Default "Select…". */
  placeholder?: string
  /** The search field's placeholder and accessible name. Default "Search…". */
  searchPlaceholder?: string
  /** Shown when no row matches. Default "No results." */
  emptyMessage?: ReactNode
  /** The most values that can be chosen; further rows disable once it's reached. */
  maxCount?: number
  /** Shows a "Select all" row (when not searching, and when the limit allows all). Default true. */
  selectAll?: boolean
  disabled?: boolean
  /** Also submits each value with a native form, under this name. */
  name?: string
  id?: string
  ref?: Ref<HTMLButtonElement>
  onBlur?: () => void
  className?: string
  /** Classes for the popup (its width follows the field by default). */
  contentClassName?: string
  /** `auto` (the default) is a popover under a pointer and a bottom sheet on touch; force either one. */
  presentation?: OverlayPresentation
  'aria-label'?: string
}

/* An option matches when its name, value or a keyword starts with the query,
 * or has a word that does ("ada" finds Ada Lovelace and grace@ada.dev), then
 * anywhere inside one. cmdk's default scores loose subsequences, so "ada"
 * also found every name with an a, d and a in that order. */
function matchOption(value: string, search: string, keywords: string[] = []) {
  const query = search.trim().toLowerCase()
  if (!query) return 1
  const texts = [value, ...keywords].map((text) => text.toLowerCase())
  if (texts.some((text) => text.startsWith(query))) return 1
  if (texts.some((text) => text.split(/[\s@._/-]+/).some((word) => word.startsWith(query)))) return 0.8
  return texts.some((text) => text.includes(query)) ? 0.4 : 0
}

const chipClass = 'own:max-w-40 own:min-w-0 own:shrink gap-1 own:ps-2 own:pe-1 own:text-fg focus-ring-within'
/** Room the trigger keeps beside the chips: the chevron, and "+N" when chips overflow. */
const RESERVE = { chevron: 32, overflow: 44 }

function MultiSelect({
  options,
  value: valueProp,
  defaultValue = [],
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxCount,
  selectAll = true,
  disabled: disabledProp,
  name,
  id,
  ref,
  onBlur,
  className,
  contentClassName,
  presentation = 'auto',
  'aria-label': ariaLabel,
}: MultiSelectProps) {
  const labels = useComponentLabels(labelDefaults)
  const sheet = useSheetPresentation(presentation)
  const keyboard = useKeyboardSheet()
  placeholder ??= labels.selectPlaceholder
  searchPlaceholder ??= labels.searchPlaceholder
  emptyMessage ??= labels.noResults
  const control = useFieldControl(id)
  const disabled = disabledProp || control.disabled
  const rtl = useDirection() === 'rtl'
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { announce, announcer } = useAnnouncer()
  const listId = useId()
  const frame = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(Infinity)
  const [focusChip, setFocusChip] = useState<number | null>(null)

  const byValue = new Map(options.map((o) => [o.value, o]))
  const chosen = value.map((v) => byValue.get(v) ?? { value: v, label: v })
  const selected = new Set(value)
  const atMax = maxCount !== undefined && value.length >= maxCount
  const selectable = options.filter((o) => !o.disabled)
  const allChosen = selectable.length > 0 && selectable.every((o) => selected.has(o.value))
  const canSelectAll = selectAll && (maxCount === undefined || selectable.length <= maxCount) && search === ''

  // How many chips fit on the line: measured from an invisible copy of all of
  // them, again whenever the value or the frame's width changes.
  useResizeMeasure(
    frame,
    (el) => {
      const widths = [...(mirror.current?.children ?? [])].map((c) => (c as HTMLElement).offsetWidth)
      const width = el.clientWidth
      if (width === 0) return setFit(Infinity) // not laid out (jsdom, hidden): show them all
      const gap = 4
      const room = (reserve: number) => width - 8 - reserve
      let used = 0
      let count = 0
      for (const w of widths) {
        const last = count === widths.length - 1
        if (used + w > room(last ? RESERVE.chevron : RESERVE.chevron + RESERVE.overflow)) break
        used += w + gap
        count++
      }
      setFit(Math.max(1, count))
    },
    [value],
  )

  const visible = chosen.slice(0, fit)
  const overflow = chosen.length - visible.length

  // After a chip is removed, focus its neighbor once the list has re-rendered.
  useEffect(() => {
    if (focusChip === null) return
    const buttons = chipButtons()
    if (buttons.length === 0) trigger.current?.focus()
    else buttons[Math.min(focusChip, buttons.length - 1)]?.focus()
    setFocusChip(null)
  })

  const chipButtons = () => [
    ...(frame.current?.querySelectorAll<HTMLButtonElement>('[data-slot=multi-select-chips] > li:not([inert]) [data-slot=badge-remove]') ?? []),
  ]

  const commit = (next: string[]) => {
    setValue(next)
    onValueChange?.(next)
  }

  const toggle = (option: MultiSelectOption) => {
    if (selected.has(option.value)) {
      commit(value.filter((v) => v !== option.value))
      return
    }
    if (atMax) return
    const next = [...value, option.value]
    commit(next)
    if (maxCount !== undefined && next.length === maxCount) announce(labels.limitOfReached(maxCount))
  }

  // Past a hundred options only the best matches are mounted (option-list.tsx).
  const rows = useOptionWindow(options, search, matchOption)
  const cut = rows.windowed && rows.total > rows.shown
  const shownNote = labels.optionsShown(rows.shown, rows.total)
  useEffect(() => {
    if (open && cut) announce(shownNote)
  }, [open, cut, shownNote, announce])

  const toggleAll = () => {
    if (allChosen) {
      commit(value.filter((v) => !selectable.some((o) => o.value === v)))
      announce(labels.allDeselected)
    } else {
      commit([...value, ...selectable.map((o) => o.value).filter((v) => !selected.has(v))])
      announce(labels.allSelected(selectable.length))
    }
  }

  // Rows are memoised, so the handler they get must not change with each render.
  const toggleRef = useRef(toggle)
  toggleRef.current = toggle
  const onToggle = useCallback((option: MultiSelectOption) => toggleRef.current(option), [])

  const remove = (index: number) => {
    const option = chosen[index]
    if (!option) return
    commit(value.filter((v) => v !== option.value))
    announce(labels.removed(option.label))
    return option
  }

  const setOpenState = (next: boolean) => {
    setOpen(next)
    if (next) return
    setSearch('')
    // Closed with focus somewhere else (a click outside): the control was left.
    requestAnimationFrame(() => !frame.current?.contains(document.activeElement) && onBlur?.())
  }

  const [back, forward] = rtl ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight']

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpenState(true)
    } else if ((event.key === 'Backspace' || event.key === back) && visible.length > 0) {
      event.preventDefault()
      chipButtons().at(-1)?.focus()
    }
  }

  const onChipKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = chipButtons()
    const move = (to: number) => {
      event.preventDefault()
      if (to >= buttons.length) trigger.current?.focus()
      else buttons[Math.max(0, to)]?.focus()
    }
    if (event.key === back) move(index - 1)
    else if (event.key === forward) move(index + 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(buttons.length - 1)
    else if (event.key === 'Escape') move(buttons.length)
    else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault()
      remove(index)
      setFocusChip(Math.max(0, event.key === 'Backspace' ? index - 1 : index))
    }
  }

  const onFrameClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled || (event.target as HTMLElement).closest('button')) return
    trigger.current?.click()
  }

  const summary = chosen.length ? labels.selectedSummary(chosen.length, chosen.map((o) => o.label).join(', ')) : placeholder

  return (
    <Popover open={open} onOpenChange={setOpenState}>
      {/* shape: a field that wraps its chips grows past one control height; rounded-field-area is the theme's corner for a multi-line field */}
      <InputGroup
        ref={frame}
        role={undefined}
        data-slot="multi-select"
        data-disabled={disabled || undefined}
        onClick={onFrameClick}
        className={cn('relative cursor-default gap-0 own:rounded-field-area own:has-data-popup-open:border-focus', className)}
      >
        {chosen.length > 0 && (
          <PresenceList
            as="ul"
            data-slot="multi-select-chips"
            aria-label={labels.selectedItems}
            aria-disabled={disabled || undefined}
            className="own:flex own:min-w-0 own:shrink items-center gap-1 own:ps-1.5"
          >
            {visible.map((option, index) => (
              <PresenceItem as="li" key={option.value} className="own:flex own:min-w-0">
                <Badge variant="secondary" className={chipClass}>
                  <span className="truncate">{option.label}</span>
                  <BadgeRemove
                    tabIndex={-1}
                    disabled={disabled}
                    aria-label={labels.remove(option.label)}
                    onClick={() => {
                      remove(index)
                      trigger.current?.focus()
                    }}
                    onKeyDown={(event) => onChipKeyDown(event, index)}
                  />
                </Badge>
              </PresenceItem>
            ))}
          </PresenceList>
        )}
        <PopoverTrigger
          ref={(node: HTMLButtonElement | null) => {
            trigger.current = node
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
          }}
          id={control.id}
          role="combobox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel ? undefined : control.labelId}
          aria-describedby={control.describedBy}
          aria-invalid={control.invalid || undefined}
          aria-required={control.required}
          aria-controls={open ? listId : undefined}
          disabled={disabled}
          onKeyDown={onTriggerKeyDown}
          // Focus moving into the open list, or onto a chip, isn't leaving the control.
          onBlur={(event) => !open && !frame.current?.contains(event.relatedTarget as Node | null) && onBlur?.()}
          data-slot="input-group-control"
          className={cn(
            'flex h-full min-w-0 flex-1 cursor-default items-center gap-2 own:pe-2 text-start text-ui outline-none select-none',
            'disabled:cursor-not-allowed touch:text-base',
            chosen.length ? 'own:ps-1' : 'own:ps-2.5',
          )}
        >
          <span aria-hidden className="own:flex min-w-0 flex-1 items-center">
            {chosen.length === 0 && <span className="truncate own:text-fg-muted">{placeholder}</span>}
            {overflow > 0 && (
              <Badge variant="outline" className="own:px-1.5 own:text-fg own:tabular-nums">
                +{overflow}
              </Badge>
            )}
          </span>
          <span className="sr-only">{summary}</span>
          <YoujChevron size={16} strokeWidth={1.75} active={open} className="own:shrink-0 own:text-fg-muted" />
        </PopoverTrigger>
        {/* Every chip, invisible, for measuring what fits. */}
        <div
          ref={mirror}
          aria-hidden
          inert
          // No width of its own, so a long value can't widen the page (a phone would scroll sideways).
          className="pointer-events-none invisible absolute start-0 top-0 own:flex h-0 w-0 items-start gap-1 overflow-hidden whitespace-nowrap"
        >
          {chosen.map((option) => (
            <Badge key={option.value} variant="secondary" className={cn(chipClass, 'own:shrink-0')}>
              <span className="truncate">{option.label}</span>
              <BadgeRemove tabIndex={-1} />
            </Badge>
          ))}
        </div>
        {name && value.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
        {announcer}
      </InputGroup>
      <PopoverContent
        presentation={presentation}
        anchor={frame}
        align="start"
        aria-label={searchPlaceholder}
        {...(sheet && { ref: keyboard.ref, initialFocus: keyboard.initialFocus })}
        className={
          sheet
            ? cn(searchSheetClass, contentClassName)
            : cn('max-h-(--available-height) w-(--anchor-width) min-w-56 gap-0 overflow-hidden own:p-0', contentClassName)
        }
      >
        <Command label={searchPlaceholder} filter={matchOption} shouldFilter={!rows.managed}>
          <div data-slot="multi-select-search" className="own:flex own:shrink-0 items-start">
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              wrapperClassName="min-w-0 flex-1"
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && search === '' && value.length > 0) {
                  event.preventDefault()
                  remove(value.length - 1)
                }
              }}
            />
            {/* A sheet stays open while rows toggle; Done is the visible way out, as on a phone. */}
            {sheet && (
              <PopoverClose render={<Button variant="ghost" className="me-0.5 own:px-3 font-semibold own:text-accent own:active:bg-hover" />}>
                {labels.done}
              </PopoverClose>
            )}
          </div>
          <CommandList id={listId} aria-multiselectable>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            {canSelectAll && (
              <>
                <CommandGroup>
                  <CommandItem
                    value={'\u0000select-all'}
                    indicator="checkbox"
                    checked={allChosen ? true : selectable.some((o) => selected.has(o.value)) ? 'mixed' : false}
                    onSelect={toggleAll}
                  >
                    {labels.selectAll}
                    <span className="own:ms-auto own:text-ui-sm own:text-fg-muted own:tabular-nums">{selectable.length}</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            {rows.groups.map(([group, items]) => (
              <CommandGroup key={group ?? ''} heading={group}>
                {items.map(({ option, position }) => {
                  const checked = selected.has(option.value)
                  return (
                    <OptionRow
                      key={option.value}
                      option={option}
                      checked={checked}
                      disabled={!!option.disabled || (atMax && !checked)}
                      checkbox
                      onPick={onToggle}
                      position={rows.windowed ? position : undefined}
                      setSize={rows.windowed ? rows.total : undefined}
                    />
                  )
                })}
              </CommandGroup>
            ))}
            {cut && <OptionNote>{shownNote}</OptionNote>}
          </CommandList>
          {maxCount !== undefined && (
            <div
              data-slot="multi-select-limit"
              className={cn(
                'own:flex h-8 items-center justify-between border-t border-line own:px-3 own:text-ui-sm text-fg-muted',
                'group-data-sheet-popup/sheet:-mx-1.5 group-data-sheet-popup/sheet:h-11 group-data-sheet-popup/sheet:px-6 group-data-sheet-popup/sheet:text-ui',
              )}
            >
              <span className="own:tabular-nums">{labels.countOfMaxSelected(value.length, maxCount)}</span>
              {atMax && <span className="own:text-fg">{labels.limitReached}</span>}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelect, type MultiSelectOption, type MultiSelectProps }
