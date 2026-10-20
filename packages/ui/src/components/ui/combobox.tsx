'use client'

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import { ChevronDownIcon as YoujChevron } from '@youj/icons/components/youj/icons/chevron-down'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useComponentLabels } from '@youj/core/labels'
import { comboboxLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { defaultFilter } from 'cmdk'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandLoading, OptionNote, OptionRow, useOptionWindow } from './command'
import { useFieldControl } from './field'
import { fieldControlClass } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { sheetKeyboardClass, useKeyboardSheet, useSheetPresentation, type OverlayPresentation } from './presentation'

/* A single-select picker with search: a field-styled trigger (role
 * "combobox", named by its FieldLabel) opens a Popover holding a Command. So
 * it moves like both: the popup grows out of the trigger on yj-pop (instant
 * when opened from the keyboard), the active row glides, the list eases its
 * height as results change, the chevron turns over, and the chosen row draws
 * its check. Reduced motion: all of that is instant.
 *
 * Keyboard: ArrowDown, Enter or Space opens; typing a letter on the trigger
 * opens with that letter already searched; arrows move, Enter picks and
 * returns focus to the trigger, Escape closes. Delete or Backspace on the
 * trigger clears a clearable value. Clearing is announced.
 *
 * Async: pass `onSearchChange` and filter yourself; `loading` shows the list's
 * loading row (announced, and the empty message waits for it). `onCreate`
 * offers "Create “…”" for text that matches nothing.
 *
 * On touch the list is a bottom sheet (presentation.tsx): the search field
 * sits at its top, rows are 48px, and a tap picks and closes it. It opens
 * with the list in view and the keyboard down; a tap on the field raises the
 * keyboard, and the sheet then sits on the keys, as tall as what is left, so
 * the field stays visible. It keeps its height while the search narrows the
 * list. Pull it down, tap outside or press Escape to dismiss it.
 * `presentation="popover"` keeps the popover on touch; "sheet" forces it. */

/** The popup as a search sheet: the Command fills it under the handle, and it follows the keyboard. */
const searchSheetClass = cn(sheetKeyboardClass, 'gap-0 overflow-hidden own:px-1.5')

interface ComboboxOption {
  value: string
  label: string
  /** Secondary text on the row (an email, a count). Searched too. */
  description?: string
  /** Leading visual, on the row and in the trigger (an avatar, a status dot). */
  icon?: ReactNode
  /** Rows with the same group sit under one heading, in the order groups first appear. */
  group?: string
  /** Extra words the search matches. */
  keywords?: string[]
  disabled?: boolean
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null, option: ComboboxOption | null) => void
  /** Shown in the trigger when nothing is chosen. Default "Select…". */
  placeholder?: string
  /** The search field's placeholder and accessible name. Default "Search…". */
  searchPlaceholder?: string
  /** Shown when no row matches. Default "No results." */
  emptyMessage?: ReactNode
  /** Shows a clear button (and lets Delete clear) while a value is chosen. */
  clearable?: boolean
  /** Async search: called as the text changes. Built-in filtering turns off; pass the matching `options`. */
  onSearchChange?: (search: string) => void
  /** Shows the loading row (async search). */
  loading?: boolean
  /** Announced and shown while loading. Default "Loading…". */
  loadingLabel?: string
  /**
   * Offers a "Create" row for text that matches no option. Return (or resolve
   * to) the new option to select it; the Combobox remembers it for display.
   */
  onCreate?: (label: string) => ComboboxOption | void | Promise<ComboboxOption | void>
  /** The create row's label. Default `Create “text”`. */
  createLabel?: (search: string) => ReactNode
  disabled?: boolean
  /** Also submits the value with a native form. */
  name?: string
  id?: string
  ref?: Ref<HTMLButtonElement>
  onBlur?: () => void
  className?: string
  /** Classes for the popup (its width follows the trigger by default). */
  contentClassName?: string
  /** `auto` (the default) is a popover under a pointer and a bottom sheet on touch; force either one. */
  presentation?: OverlayPresentation
  'aria-label'?: string
}

function Combobox({
  options,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  clearable = false,
  onSearchChange,
  loading = false,
  loadingLabel,
  onCreate,
  createLabel,
  disabled: disabledProp,
  name,
  id,
  ref,
  onBlur,
  className,
  contentClassName,
  presentation = 'auto',
  'aria-label': ariaLabel,
}: ComboboxProps) {
  const labels = useComponentLabels(comboboxLabels)
  const sheet = useSheetPresentation(presentation)
  const keyboard = useKeyboardSheet()
  // Opened by typing on the trigger: the field takes focus even in a sheet.
  const typed = useRef(false)
  placeholder ??= labels.selectPlaceholder
  searchPlaceholder ??= labels.searchPlaceholder
  emptyMessage ??= labels.noResults
  loadingLabel ??= labels.loadingEllipsis
  createLabel ??= labels.createOption
  const control = useFieldControl(id)
  const disabled = disabledProp || control.disabled
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  // Options that left `options` (async results moved on, or a created one)
  // stay displayable in the trigger.
  const [remembered, setRemembered] = useState<ComboboxOption | null>(null)
  const { announce, announcer } = useAnnouncer()
  const listId = useId()
  const trigger = useRef<HTMLButtonElement | null>(null)

  const selected =
    value === null ? null : (options.find((o) => o.value === value) ?? (remembered?.value === value ? remembered : null))
  const query = search.trim()
  const canCreate =
    !!onCreate && query !== '' && !loading && !options.some((o) => o.label.toLowerCase() === query.toLowerCase())

  // Past a hundred options only the best matches are mounted (option-list.tsx).
  const rows = useOptionWindow(options, search, onSearchChange ? null : defaultFilter)
  const cut = rows.windowed && rows.total > rows.shown
  const shownNote = labels.optionsShown(rows.shown, rows.total)
  useEffect(() => {
    if (open && cut) announce(shownNote)
  }, [open, cut, shownNote, announce])

  const commit = (option: ComboboxOption | null) => {
    setValue(option?.value ?? null)
    setRemembered(option)
    onValueChange?.(option?.value ?? null, option)
  }

  const changeSearch = (next: string) => {
    setSearch(next)
    onSearchChange?.(next)
  }

  const setOpenState = (next: boolean) => {
    setOpen(next)
    if (!next) typed.current = false
    if (!next && search !== '') changeSearch('')
    // Closed with focus somewhere else (a click outside): the control was left.
    if (!next) requestAnimationFrame(() => document.activeElement !== trigger.current && onBlur?.())
  }

  const pick = (option: ComboboxOption) => {
    commit(option)
    setOpenState(false)
  }
  // Rows are memoised, so the handler they get must not change with each render.
  const pickRef = useRef(pick)
  pickRef.current = pick
  const onPick = useCallback((option: ComboboxOption) => pickRef.current(option), [])

  const create = async () => {
    const label = query
    setOpenState(false)
    const created = await onCreate?.(label)
    if (created) commit(created)
  }

  const clear = () => {
    commit(null)
    announce(labels.selectionCleared)
    trigger.current?.focus()
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      typed.current = true
      setOpenState(true)
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && clearable && selected) {
      event.preventDefault()
      clear()
    } else if (event.key.length === 1 && event.key !== ' ' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      // Typing on the trigger opens it with the letter already searched.
      event.preventDefault()
      typed.current = true
      changeSearch(event.key)
      setOpen(true)
    }
  }

  const showClear = clearable && !!selected && !disabled

  return (
    <Popover open={open} onOpenChange={setOpenState}>
      <div data-slot="combobox" className={cn('relative w-full min-w-0', className)}>
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
          // Focus moving into the open list isn't leaving the control.
          onBlur={() => !open && onBlur?.()}
          data-slot="combobox-trigger"
          data-placeholder={selected ? undefined : ''}
          className={cn(
            fieldControlClass,
            'flex h-control cursor-default items-center gap-2 own:ps-2.5 own:pe-2 text-start select-none',
            'own:data-popup-open:border-focus data-placeholder:text-fg-muted',
            "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          )}
        >
          <span className="own:flex min-w-0 flex-1 items-center gap-2">
            {selected?.icon}
            <span className="truncate">{selected ? selected.label : (value ?? placeholder)}</span>
          </span>
          {/* Room for the clear button, which sits over the trigger (a button can't hold one). */}
          {showClear && <span aria-hidden className="w-6 shrink-0" />}
          <YoujChevron size={16} strokeWidth={1.75} active={open} className="own:text-fg-muted" />
        </PopoverTrigger>
        {showClear && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={labels.clearSelection}
            onClick={clear}
            className="absolute end-8 top-1/2 -translate-y-1/2 own:text-fg-muted"
          >
            <XIcon />
          </Button>
        )}
        {name && <input type="hidden" name={name} value={value ?? ''} />}
        {announcer}
      </div>
      <PopoverContent
        presentation={presentation}
        align="start"
        aria-label={searchPlaceholder}
        {...(sheet && {
          ref: keyboard.ref,
          initialFocus: (openType: string) => (typed.current ? true : keyboard.initialFocus(openType)),
        })}
        className={
          sheet
            ? cn(searchSheetClass, contentClassName)
            : cn('max-h-(--available-height) w-(--anchor-width) min-w-56 gap-0 overflow-hidden own:p-0', contentClassName)
        }
      >
        <Command label={searchPlaceholder} shouldFilter={!onSearchChange && !rows.managed} defaultValue={value ?? undefined}>
          <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={changeSearch} />
          <CommandList id={listId}>
            {loading && <CommandLoading label={loadingLabel} />}
            {!canCreate && <CommandEmpty>{emptyMessage}</CommandEmpty>}
            {rows.groups.map(([group, items]) => (
              <CommandGroup key={group ?? ''} heading={group}>
                {items.map(({ option, position }) => (
                  <OptionRow
                    key={option.value}
                    option={option}
                    checked={option.value === value}
                    disabled={!!option.disabled}
                    onPick={onPick}
                    position={rows.windowed ? position : undefined}
                    setSize={rows.windowed ? rows.total : undefined}
                  />
                ))}
              </CommandGroup>
            ))}
            {cut && <OptionNote>{shownNote}</OptionNote>}
            {canCreate && (
              <CommandGroup forceMount>
                <CommandItem forceMount value={`\u0000create:${query}`} onSelect={create}>
                  <PlusIcon trigger="none" />
                  <span className="truncate">{createLabel(query)}</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox, type ComboboxOption, type ComboboxProps }
