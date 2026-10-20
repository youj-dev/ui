'use client'

import { commandLabels } from '@youj/core/labels'
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { createPortal } from 'react-dom'
import { Command as CommandPrimitive, useCommandState } from 'cmdk'
import { SearchIcon } from '@youj/icons/components/youj/icons/search'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { useYoujScope, usePortalContainer } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { CheckIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import { CheckboxMark } from './checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog'
import {
  SheetHandle,
  SheetLayer,
  sheetKeyboardClass,
  sheetPopupClass,
  sheetPositionerClass,
  sheetRowClass,
  sheetScrimClass,
  useKeyboardSheet,
  useSheetPresentation,
  type OverlayPresentation,
} from './presentation'
import { Spinner } from './spinner'

/* cmdk's command menu, re-skinned: a flush search row over a list. The
 * active row is a single SlidingIndicator that glides as you arrow through
 * (the smooth spring, retargeting mid-glide when a key repeats) and stays put
 * while you type, since filtering keeps the first result active. The list
 * eases its height as results come and go. Reduced motion: the highlight
 * jumps and the height snaps.
 *
 * Accessibility is cmdk's: the input is a combobox pointing at the listbox
 * with aria-activedescendant, groups are labeled by their headings, and the
 * `label` names the input for screen readers.
 *
 * In a bottom sheet (a Combobox, a MultiSelect or a CommandDialog on touch,
 * see presentation.tsx) the parts restyle themselves from the sheet: the
 * search row becomes a filled search field that stays put at the top, the
 * list fills the rest of the sheet and scrolls under it, rows are 48px with
 * 16px type, shortcut hints are gone, and the sliding highlight only shows
 * while the field has focus (then Enter picks the highlighted row, as it
 * does on a keyboard); otherwise a row simply darkens under the finger. */

function Command({
  className,
  label,
  loop = true,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  const labels = useComponentLabels(commandLabels)
  return (
    <CommandPrimitive
      data-slot="command"
      label={label ?? labels.search}
      loop={loop}
      className={cn(
        'flex size-full flex-col overflow-hidden own:rounded-[inherit] bg-overlay text-fg',
        // In a sheet it takes what the handle leaves, and the list inside it scrolls.
        'group-data-sheet-popup/sheet:h-auto group-data-sheet-popup/sheet:min-h-0 group-data-sheet-popup/sheet:flex-1 group-data-sheet-popup/sheet:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

/* cmdk marks its input `aria-expanded="true"` and points it at the list
 * unconditionally, which is right wherever the list is always shown (a
 * palette, a dialog, a popover holding both). When the input stays put and
 * the list comes and goes, as in a search field with suggestions, pass
 * `expanded`: collapsed, the input says so and stops pointing at a list that
 * isn't there. cmdk writes these attributes after any props, so they're set
 * on the element instead. */
type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input> & {
  wrapperClassName?: string
  /** Whether the list is showing. Leave unset when it always is (cmdk's default). */
  expanded?: boolean
}

function CommandInput({ className, wrapperClassName, expanded, ...props }: CommandInputProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const listId = useRef<string | null>(null)
  useLayoutEffect(() => {
    const input = wrapper.current?.querySelector('[cmdk-input]')
    if (!input || expanded === undefined) return
    listId.current ??= input.getAttribute('aria-controls')
    input.setAttribute('aria-expanded', String(expanded))
    if (expanded && listId.current) input.setAttribute('aria-controls', listId.current)
    else input.removeAttribute('aria-controls')
  }, [expanded])
  return (
    <div
      ref={wrapper}
      data-slot="command-input-wrapper"
      className={cn(
        'own:flex h-10 shrink-0 items-center own:gap-2 border-b border-line own:px-3',
        // In a sheet: a filled field, like a phone's own search bar, whose icon lines up with the row text.
        'group-data-sheet-popup/sheet:mx-1.5 group-data-sheet-popup/sheet:mb-1.5 group-data-sheet-popup/sheet:h-11 group-data-sheet-popup/sheet:gap-2',
        'group-data-sheet-popup/sheet:rounded-lg group-data-sheet-popup/sheet:border-0 group-data-sheet-popup/sheet:bg-band own:group-data-sheet-popup/sheet:px-3',
        wrapperClassName,
      )}
    >
      <SearchIcon className="own:size-4 shrink-0 own:text-fg-muted" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'own:h-full own:w-full own:min-w-0 own:bg-transparent own:text-ui own:text-fg outline-none own:placeholder:text-fg-muted',
          'disabled:cursor-not-allowed disabled:opacity-50 own:touch:text-base',
          className,
        )}
        {...props}
      />
    </div>
  )
}

/* A listbox may only own options and groups, so anything else inside the list
 * (separators, the loading row, the empty message) is hidden from assistive
 * tech. The list keeps a status region beside itself instead, which announces
 * loading and "no results". */
interface CommandStatus {
  busy: boolean
  setBusy: Dispatch<SetStateAction<string | null>>
  /** Where CommandEmpty repeats its message for screen readers. */
  emptyNode: HTMLElement | null
}
const CommandStatusContext = createContext<CommandStatus>({ busy: false, setBusy: () => {}, emptyNode: null })

/* The list eases between heights cmdk measures (--cmdk-list-height), capped
 * by --command-list-max; past the cap it scrolls. cmdk wraps the children in
 * a sizer, which is the indicator's container. */
function CommandList({ className, children, ref, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  const [busy, setBusy] = useState<string | null>(null)
  const [emptyNode, setEmptyNode] = useState<HTMLElement | null>(null)
  const status = useMemo(() => ({ busy: busy !== null, setBusy, emptyNode }), [busy, emptyNode])
  const list = useRef<HTMLDivElement | null>(null)
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      list.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  const search = useCommandState((state) => state.search)
  // A new search makes its best match the active row, but cmdk may scroll
  // the row that was active before into view first, leaving the best match
  // half under the field (most visibly in a sheet shortened by a keyboard).
  // When the active row is the first, the list starts at the top.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const el = list.current
      if (el?.querySelector('[cmdk-item]')?.getAttribute('aria-selected') === 'true') el.scrollTop = 0
    })
    return () => cancelAnimationFrame(frame)
  }, [search])
  return (
    <CommandStatusContext.Provider value={status}>
      <CommandPrimitive.List
        ref={setRef}
        data-slot="command-list"
        aria-busy={busy !== null || undefined}
        className={cn(
          '[--command-list-max:20rem] h-[min(var(--cmdk-list-height),var(--command-list-max))] max-h-(--command-list-max)',
          'transition-[height] yj-duration-base ease-standard',
          'scroll-py-1.5 overflow-x-hidden overflow-y-auto overscroll-contain outline-none yj-scrollbar',
          '[&>[cmdk-list-sizer]]:relative [&>[cmdk-list-sizer]]:isolate [&>[cmdk-list-sizer]]:p-1.5',
          // In a sheet the sheet sets the height (it holds it while a search narrows the list).
          'group-data-sheet-popup/sheet:h-auto group-data-sheet-popup/sheet:max-h-none group-data-sheet-popup/sheet:min-h-0 group-data-sheet-popup/sheet:flex-1',
          className,
        )}
        {...props}
      >
        {children}
        <SlidingIndicator
          match='[aria-selected="true"]'
          className={cn(
            'own:rounded-md bg-cursor',
            // A sheet shows the highlight only while typing, when Enter would pick it.
            'group-data-sheet-popup/sheet:invisible group-data-sheet-popup/sheet:rounded-lg group-has-[[cmdk-input]:focus]/sheet:visible',
          )}
        />
      </CommandPrimitive.List>
      <span role="status" className="sr-only">
        <span>{busy ?? ''}</span>
        <span ref={setEmptyNode} />
      </span>
    </CommandStatusContext.Provider>
  )
}

/**
 * The message shown when no row matches. Screen readers hear it from the
 * list's status region as it appears; the copy inside the listbox is hidden
 * from them. It waits while a CommandLoading is shown, since nothing having
 * arrived yet is not the same as no results.
 */
function CommandEmpty({ className, children, ...props }: ComponentProps<'div'>) {
  const empty = useCommandState((state) => state.filtered.count === 0)
  const { busy, emptyNode } = useContext(CommandStatusContext)
  if (!empty || busy) return null
  return (
    <>
      <div
        data-slot="command-empty"
        aria-hidden
        className={cn('own:px-4 own:py-8 text-center own:text-ui own:text-fg-muted', className)}
        {...props}
      >
        {children}
      </div>
      {emptyNode && createPortal(children, emptyNode)}
    </>
  )
}

interface CommandLoadingProps extends ComponentProps<'div'> {
  /** Announced politely while the row is shown, and shown when there are no children. Default "Loading…". */
  label?: string
}

/**
 * A row to render inside CommandList while results load. It is decorative to
 * assistive tech; the list announces `label` and is aria-busy meanwhile.
 */
function CommandLoading({ className, children, label: labelProp, ...props }: CommandLoadingProps) {
  const { setBusy } = useContext(CommandStatusContext)
  const labels = useComponentLabels(commandLabels)
  const label = labelProp ?? labels.loadingEllipsis
  // Before paint: a CommandEmpty beside it must not flash "no results".
  useLayoutEffect(() => {
    setBusy(label)
    return () => setBusy(null)
  }, [label, setBusy])
  return (
    <div
      data-slot="command-loading"
      aria-hidden
      className={cn('own:flex own:min-h-control items-center own:gap-2.5 own:px-2 own:text-ui own:text-fg-muted', className)}
      {...props}
    >
      <Spinner label={null} size={14} />
      {children ?? label}
    </div>
  )
}

function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'text-fg',
        '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:select-none',
        '**:[[cmdk-group-heading]]:text-ui-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:tracking-wide',
        '**:[[cmdk-group-heading]]:text-fg-muted **:[[cmdk-group-heading]]:uppercase',
        'group-data-sheet-popup/sheet:**:[[cmdk-group-heading]]:ps-3',
        className,
      )}
      {...props}
    />
  )
}

/** A hairline between groups. Like cmdk's, it hides while a search is filtering, unless `alwaysRender`. */
function CommandSeparator({ className, alwaysRender, ...props }: ComponentProps<'div'> & { alwaysRender?: boolean }) {
  const searching = useCommandState((state) => state.search !== '')
  if (searching && !alwaysRender) return null
  return <div data-slot="command-separator" aria-hidden className={cn('own:-mx-1.5 own:my-1 own:h-px own:bg-line', className)} {...props} />
}

interface CommandItemProps extends ComponentProps<typeof CommandPrimitive.Item> {
  /**
   * For multi-select lists (a filter): a trailing check that draws in, and
   * aria-checked on the option. `'mixed'` is for a "select all" row over a
   * partial selection. Leave undefined for plain commands.
   */
  checked?: boolean | 'mixed'
  /** How `checked` shows: a trailing check (default) or a leading checkbox. */
  indicator?: 'check' | 'checkbox'
}

function CommandItem({ className, children, checked, indicator = 'check', ...props }: CommandItemProps) {
  const box = indicator === 'checkbox' && checked !== undefined
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      data-checked={checked}
      aria-checked={checked}
      className={cn(
        'group/command-item relative flex min-h-control cursor-default items-center own:gap-2.5 own:rounded-md own:px-2 text-ui outline-none select-none',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        'forced-colors:data-[selected=true]:outline-2 forced-colors:data-[selected=true]:-outline-offset-2',
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        '[&>svg]:text-fg-muted data-[selected=true]:[&>svg]:text-fg',
        // The highlight's lettering, except in a sheet while its field is idle, where the highlight is hidden.
        'data-[selected=true]:yj-on-cursor group-data-sheet-popup/sheet:data-[selected=true]:yj-off-cursor group-has-[[cmdk-input]:focus]/sheet:data-[selected=true]:yj-on-cursor',
        checked !== undefined && !box && 'own:pe-8',
        sheetRowClass,
        className,
      )}
      {...props}
    >
      {box && <CheckboxMark checked={checked === 'mixed' ? 'indeterminate' : checked} />}
      {children}
      {checked === true && !box && (
        <span className="pointer-events-none absolute end-2 own:flex size-4 items-center justify-center own:text-accent">
          <CheckIcon trigger="mount" size={16} strokeWidth={2.25} />
        </span>
      )}
    </CommandPrimitive.Item>
  )
}

/* What Combobox and MultiSelect share to stay fast on long lists. Past
 * OPTION_LIMIT options they mount only the best OPTION_LIMIT matches (every
 * mounted row costs the list a registration, a score and a re-render on each
 * key), say how many more there are, and filter for cmdk, which can only
 * score the rows it has. Rows are memoised, so a key re-renders only the rows
 * that changed. */

/** The most rows a Combobox or MultiSelect mounts at once. Narrow the search to reach the rest. */
const OPTION_LIMIT = 100

interface ListOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  group?: string
  keywords?: string[]
  disabled?: boolean
}

/** What cmdk's filter is given besides the value: the words the search also matches. */
type OptionScore = (value: string, search: string, keywords: string[]) => number

const keywordCache = new WeakMap<ListOption, string[]>()

/** The option's searchable words, the same array each time so cmdk doesn't re-register the row. */
function optionKeywords(option: ListOption) {
  let words = keywordCache.get(option)
  if (!words) {
    words = [option.label, ...(option.description ? [option.description] : []), ...(option.keywords ?? [])]
    keywordCache.set(option, words)
  }
  return words
}

interface OptionEntry<T> {
  option: T
  /** 1-based place among the matches, for aria-posinset. */
  position: number
}

/**
 * The rows to mount for `search`. `score` is the filter cmdk would use (null:
 * the consumer filters, as with async search). Lists up to OPTION_LIMIT stay
 * cmdk's: everything mounted and filtered by it. Longer ones are filtered
 * here, best match first, and cut to OPTION_LIMIT; `windowed` says so, and
 * `total` is the number of matches, for aria-setsize and the "keep typing" note.
 */
function useOptionWindow<T extends ListOption>(options: T[], search: string, score: OptionScore | null) {
  return useMemo(() => {
    const windowed = options.length > OPTION_LIMIT
    const managed = windowed && score !== null
    let matches = options
    if (managed && search !== '') {
      const scored: [number, number, T][] = []
      options.forEach((option, index) => {
        const s = score(option.value, search, optionKeywords(option))
        if (s > 0) scored.push([s, index, option])
      })
      scored.sort((a, b) => b[0] - a[0] || a[1] - b[1])
      matches = scored.map((entry) => entry[2])
    }
    const shown = windowed ? matches.slice(0, OPTION_LIMIT) : matches
    // Groups in the order their best match appears, as cmdk orders them.
    const byGroup = new Map<string | undefined, T[]>()
    for (const option of shown) {
      const list = byGroup.get(option.group)
      if (list) list.push(option)
      else byGroup.set(option.group, [option])
    }
    let position = 0
    const groups = [...byGroup].map(([group, items]): [string | undefined, OptionEntry<T>[]] => [
      group,
      items.map((option) => ({ option, position: ++position })),
    ])
    return { groups, managed, windowed, total: matches.length, shown: shown.length }
  }, [options, search, score])
}

interface OptionRowProps {
  option: ListOption
  checked: boolean
  disabled: boolean
  /** A MultiSelect row: a leading checkbox instead of a trailing check. */
  checkbox?: boolean
  onPick: (option: ListOption) => void
  /** Only when the list is windowed: the row's place among all `setSize` matches. */
  position?: number
  setSize?: number
}

/** A row: re-rendered only when its option, its checked or disabled state, or its place changes. */
const OptionRow = memo(function OptionRow({ option, checked, disabled, checkbox, onPick, position, setSize }: OptionRowProps) {
  return (
    <CommandItem
      value={option.value}
      keywords={optionKeywords(option)}
      disabled={disabled}
      checked={checked}
      indicator={checkbox ? 'checkbox' : undefined}
      aria-posinset={position}
      aria-setsize={setSize}
      onSelect={() => onPick(option)}
    >
      {option.icon}
      <span className="min-w-0 truncate">{option.label}</span>
      {option.description && (
        // The description gives way first, so the name stays readable.
        <span className="own:ms-auto min-w-0 shrink-4 truncate own:ps-2 own:text-ui-sm own:text-fg-muted">{option.description}</span>
      )}
    </CommandItem>
  )
})

/** The line under a cut list: how many rows are showing. Decorative; the list announces it. */
function OptionNote({ children }: { children: ReactNode }) {
  return (
    <div data-slot="option-note" aria-hidden className="own:px-2 own:py-2 text-center own:text-ui-sm own:text-fg-muted">
      {children}
    </div>
  )
}

function CommandShortcut({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'own:ms-auto own:ps-4 own:font-sans own:text-ui-sm own:tracking-wider own:text-fg-muted own:group-data-[selected=true]/command-item:text-fg-muted',
        // Keys mean nothing without a keyboard.
        'own:touch:hidden',
        className,
      )}
      {...props}
    />
  )
}

interface CommandDialogProps extends Omit<ComponentProps<typeof Dialog>, 'children'> {
  /** Names the dialog for screen readers. Default "Command palette". */
  title?: string
  /** Describes the dialog for screen readers. */
  description?: string
  className?: string
  showCloseButton?: boolean
  /** `auto` (the default) is a dialog under a pointer and a tall bottom sheet on touch; force either one. */
  presentation?: OverlayPresentation
  /**
   * Whether the search field takes focus on open. By default it does when
   * opened from a keyboard or a mouse, and not when opened by a touch, so the
   * on-screen keyboard doesn't cover the list before it is seen. Pass true
   * when the dialog is opened to type in (a search button); on iOS also call
   * `primeKeyboard()` in that button's tap handler, or iOS won't raise the
   * keyboard for a focus that comes after the tap.
   */
  autoFocusField?: boolean
  children: ReactNode
}

/* On touch the palette is a tall sheet, not a window in the middle of the
 * screen: the search field sits at its top, under the handle, and the list
 * fills the rest. Its height is fixed (85% of the screen) so moving between
 * results and pages never moves the field, and it follows the on-screen
 * keyboard: while the keys are up the sheet sits on them and is as tall as
 * what is left. Pulling it down dismisses it, like Escape. */
function CommandSheet({
  className,
  autoFocusField,
  children,
}: {
  className?: string
  autoFocusField?: boolean
  children: ReactNode
}) {
  const scope = useYoujScope()
  const container = usePortalContainer()
  const keyboard = useKeyboardSheet({ holdHeight: false, focusField: autoFocusField })
  return (
    <DialogPrimitive.Portal container={container} {...scope}>
      <SheetLayer>
        <DialogPrimitive.Backdrop data-sheet-scrim="" className={sheetScrimClass} />
        <DialogPrimitive.Viewport data-slot="command-dialog-viewport" className={sheetPositionerClass}>
          <DialogPrimitive.Popup
            ref={keyboard.ref}
            initialFocus={keyboard.initialFocus}
            data-slot="command-dialog"
            data-sheet-popup=""
            data-yj-tone="overlay"
            className={cn(sheetPopupClass, sheetKeyboardClass, 'h-(--yj-sheet-max-height) own:gap-0 overflow-hidden', className)}
          >
            <SheetHandle />
            {children}
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </SheetLayer>
    </DialogPrimitive.Portal>
  )
}

/**
 * A Command in a Dialog, hung from the top third of the screen so the list
 * grows downwards and the input never moves. Put a `<Command>` inside. On
 * touch it is a tall bottom sheet instead.
 */
function CommandDialog({
  title,
  description,
  children,
  className,
  showCloseButton = false,
  presentation = 'auto',
  autoFocusField,
  ...props
}: CommandDialogProps) {
  const labels = useComponentLabels(commandLabels)
  const sheet = useSheetPresentation(presentation)
  const popup = useRef<HTMLDivElement>(null)
  if (sheet) {
    return (
      <Dialog {...props}>
        <CommandSheet className={className} autoFocusField={autoFocusField}>
          <DialogTitle className="sr-only">{title ?? labels.commandPalette}</DialogTitle>
          <DialogDescription className="sr-only">{description ?? labels.commandPaletteDescription}</DialogDescription>
          {children}
        </CommandSheet>
      </Dialog>
    )
  }
  return (
    <Dialog {...props}>
      <DialogContent
        ref={popup}
        // This branch is the centered dialog: on touch, `presentation="popover"` keeps it, so DialogContent must not turn it into its own sheet.
        presentation="dialog"
        // Asked not to focus the field: the dialog itself takes focus, as Base UI's fallback would.
        initialFocus={autoFocusField === false ? popup : undefined}
        className={cn('own:mt-[12vh] own:mb-auto max-w-xl origin-top own:gap-0 own:overflow-hidden own:p-0', className)}
        showCloseButton={showCloseButton}
      >
        <DialogTitle className="sr-only">{title ?? labels.commandPalette}</DialogTitle>
        <DialogDescription className="sr-only">{description ?? labels.commandPaletteDescription}</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
  OPTION_LIMIT,
  OptionNote,
  OptionRow,
  useOptionWindow,
}
export type { CommandDialogProps, CommandItemProps, ListOption }
