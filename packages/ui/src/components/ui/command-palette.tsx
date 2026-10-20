'use client'

import {
  createContext,
  Fragment,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { useComponentLabels } from '@youj/core/labels'
import { commandPaletteLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { Command, CommandDialog, CommandInput, CommandList } from './command'
import { Kbd, KbdGroup } from './kbd'
import { isSheetPull } from './presentation'

/* A ⌘K palette: CommandDialog + Command with pages. Choosing a row can push
 * a page (Projects, then a project, then its actions); the trail shows as a
 * breadcrumb in the search row, and Backspace on an empty search or Escape
 * steps back one page before Escape closes. Each page starts with an empty
 * search and its first row active. The active row is Command's
 * SlidingIndicator and the list eases between heights, so moving through
 * results and between pages glides. A footer spells out the keys.
 *
 * The page stack is in context: read and change it with useCommandPalette()
 * from the rows. Recent items and async results are yours to compose from
 * Command's parts (CommandGroup, CommandLoading…); the story shows both.
 *
 * On touch it is CommandDialog's tall bottom sheet: the search field stays at
 * the top and follows the on-screen keyboard, the key footer is gone, the
 * breadcrumb is the way back (its crumbs are thumb-sized), and pulling the
 * sheet down closes the palette from any page. */

interface CommandPalettePage {
  /** Stable key, for rendering the page's rows. */
  id: string
  /** Shown in the breadcrumb, and names the search field. */
  label: string
  placeholder?: string
}

interface CommandPaletteState {
  /** The page being shown; undefined on the first page. */
  page: CommandPalettePage | undefined
  pages: CommandPalettePage[]
  search: string
  /** Opens a page on top of the current one. */
  push: (page: CommandPalettePage) => void
  /** Steps back one page, or to `depth` pages (0 is the first page). */
  pop: (depth?: number) => void
  /** Closes the palette, e.g. after running a command. */
  close: () => void
}

const CommandPaletteContext = createContext<CommandPaletteState | null>(null)

/** The palette's pages and search, for the rows inside it. */
function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) throw new Error('useCommandPalette must be used inside <CommandPalette>')
  return context
}

interface CommandPaletteProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** A key that toggles the palette with ⌘ (Ctrl elsewhere) from anywhere on the page. `false` for none. Default `k`. */
  shortcut?: string | false
  /** The first page's placeholder. */
  placeholder?: string
  /** The dialog's accessible name. Default "Command palette". */
  title?: string
  /** Describes the dialog for screen readers. Default: the built-in "Search for a command to run" (a label, so translated with the rest). */
  description?: string
  /** Controlled search, e.g. to fetch results as the user types. */
  search?: string
  onSearchChange?: (search: string) => void
  /** Turn off cmdk's filtering when results arrive already matched. */
  shouldFilter?: boolean
  /**
   * Whether the search field takes focus on open. By default it does from a
   * keyboard or a mouse and not from a touch (the list shows first). Pass true
   * when a search button opens it to type in; on iOS also call
   * `primeKeyboard()` in that button's tap handler so the keyboard comes up.
   */
  autoFocusField?: boolean
  className?: string
  /** The rows for the current page, or a function of the palette's state. */
  children: ReactNode | ((state: CommandPaletteState) => ReactNode)
}

function CommandPalette({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  shortcut = 'k',
  placeholder,
  title,
  description,
  search: searchProp,
  onSearchChange,
  shouldFilter,
  autoFocusField,
  className,
  children,
}: CommandPaletteProps) {
  const labels = useComponentLabels(commandPaletteLabels)
  title ??= labels.commandPalette
  const [openState, setOpenState] = useState(defaultOpen)
  const open = openProp ?? openState
  // Opening mounts the dialog, cmdk and every row: that render runs as a
  // transition, so the click or ⌘K that asked for it paints at once and the
  // palette follows without blocking input. Closing is immediate.
  const [opened, setOpened] = useState(open)
  useEffect(() => {
    if (open) startTransition(() => setOpened(true))
    else setOpened(false)
  }, [open])
  const [pages, setPages] = useState<CommandPalettePage[]>([])
  const [searchState, setSearchState] = useState('')
  const search = searchProp ?? searchState

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  const setSearch = useCallback(
    (next: string) => {
      if (searchProp === undefined) setSearchState(next)
      onSearchChange?.(next)
    },
    [searchProp, onSearchChange],
  )

  const push = useCallback(
    (page: CommandPalettePage) => {
      setPages((stack) => [...stack, page])
      setSearch('')
    },
    [setSearch],
  )
  const pop = useCallback(
    (depth?: number) => {
      setPages((stack) => stack.slice(0, depth ?? stack.length - 1))
      setSearch('')
    },
    [setSearch],
  )
  const close = useCallback(() => setOpen(false), [setOpen])

  const [list, setList] = useState<HTMLDivElement | null>(null)

  // ⌘K / Ctrl+K toggles it from anywhere, unless something else on the page
  // claimed the keystroke. Inside the palette cmdk claims Ctrl+K for its vim
  // bindings, which must not keep the shortcut from closing it.
  useEffect(() => {
    if (!shortcut) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== shortcut) return
      const fromPalette = !!list?.closest('[cmdk-root]')?.contains(event.target as Node)
      if (event.defaultPrevented && !fromPalette) return
      event.preventDefault()
      setOpen(!open)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [shortcut, open, setOpen, list])

  // cmdk keeps pointing at a row that has gone (a page change, results that
  // arrived later) and then nothing is active. Whenever no row is active and
  // some exist, the first enabled row takes over.
  const [selected, setSelected] = useState('')
  useEffect(() => {
    if (!list) return
    const heal = () => {
      if (list.querySelector('[cmdk-item][aria-selected="true"]')) return
      const first = list.querySelector('[cmdk-item]:not([aria-disabled="true"])')?.getAttribute('data-value')
      if (first) setSelected(first)
    }
    heal()
    const rows = new MutationObserver(heal)
    rows.observe(list, { childList: true, subtree: true })
    return () => rows.disconnect()
  }, [list])

  const page = pages.at(-1)
  const state = useMemo<CommandPaletteState>(
    () => ({ page, pages, search, push, pop, close }),
    [page, pages, search, push, pop, close],
  )

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && search === '' && pages.length > 0) {
      event.preventDefault()
      pop()
    }
  }

  return (
    <CommandPaletteContext.Provider value={state}>
      <CommandDialog
        open={open && opened}
        onOpenChange={(next, details) => {
          // Escape steps back a page first; the last Escape closes. Pulling
          // the sheet down sends an Escape too, but it means "put this away".
          if (!next && details.reason === 'escape-key' && pages.length > 0 && !isSheetPull(details.event)) {
            pop()
            return
          }
          setOpen(next)
        }}
        onOpenChangeComplete={(isOpen) => {
          // Reopening starts fresh, once the closing animation is over.
          if (isOpen) return
          setPages([])
          setSearch('')
        }}
        title={title}
        description={description}
        autoFocusField={autoFocusField}
        className={cn('max-w-2xl', className)}
      >
        <Command label={page?.label ?? title} shouldFilter={shouldFilter} value={selected} onValueChange={setSelected}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            onKeyDown={onInputKeyDown}
            placeholder={page?.placeholder ?? placeholder ?? labels.commandPalettePlaceholder}
            wrapperClassName="h-13 gap-2.5 own:px-4"
            className="text-ui-lg"
          />
          <PaletteBreadcrumb pages={pages} onNavigate={pop} />
          <CommandList
            ref={setList}
            className={cn(
              '[--command-list-max:min(24rem,55dvh)] [&>[cmdk-list-sizer]]:p-2 **:data-[slot=command-item]:min-h-10 **:data-[slot=command-item]:gap-3 **:data-[slot=command-item]:px-2.5',
              // The sheet's rows are 48px, with the sheet's inset, whatever the desktop's are.
              'group-data-sheet-popup/sheet:[&>[cmdk-list-sizer]]:p-1.5 group-data-sheet-popup/sheet:**:data-[slot=command-item]:min-h-12 group-data-sheet-popup/sheet:**:data-[slot=command-item]:ps-3',
            )}
          >
            {typeof children === 'function' ? children(state) : children}
          </CommandList>
          <PaletteFooter nested={pages.length > 0} />
          <span role="status" className="sr-only">
            {page ? labels.commandPalettePage(page.label) : ''}
          </span>
        </Command>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  )
}

/* A crumb's hit area grows past its pill on touch, to the row's full height. */
const crumbClass = cn(
  'relative rounded-sm px-1.5 py-0.5 transition-[color,background-color] yj-duration-fast ease-standard hover:bg-hover hover:text-fg',
  'touch:after:absolute touch:after:-inset-x-1 touch:after:-inset-y-3 touch:active:bg-hover touch:active:text-fg',
)

/** The page trail under the search row. Pointer and touch only: Backspace and Escape walk it from the keyboard. */
function PaletteBreadcrumb({ pages, onNavigate }: { pages: CommandPalettePage[]; onNavigate: (depth: number) => void }) {
  const labels = useComponentLabels(commandPaletteLabels)
  if (pages.length === 0) return null
  return (
    <div
      data-slot="command-palette-breadcrumb"
      className={cn(
        'own:flex h-9 shrink-0 items-center gap-1 overflow-x-auto yj-scrollbar border-b border-line own:px-3 own:text-ui-sm text-fg-muted',
        'touch:h-11 touch:gap-1.5 own:touch:text-ui',
        // In the sheet it sits under the filled search field, with the rows' inset.
        'group-data-sheet-popup/sheet:mx-1.5 group-data-sheet-popup/sheet:border-b-0 group-data-sheet-popup/sheet:px-1.5',
      )}
    >
      <button type="button" tabIndex={-1} onClick={() => onNavigate(0)} className={crumbClass}>
        {labels.home}
      </button>
      {pages.map((page, i) => (
        <Fragment key={page.id}>
          <ChevronRightIcon trigger="none" className="own:size-3.5 shrink-0 own:text-fg-subtle rtl:-scale-x-100" />
          {i === pages.length - 1 ? (
            <span className="rounded-sm px-1.5 py-0.5 own:font-medium own:text-fg">{page.label}</span>
          ) : (
            <button type="button" tabIndex={-1} onClick={() => onNavigate(i + 1)} className={crumbClass}>
              {page.label}
            </button>
          )}
        </Fragment>
      ))}
    </div>
  )
}

/** The keys, spelled out. Escape reads Back while there is a page to go back to. */
function PaletteFooter({ nested }: { nested: boolean }) {
  const labels = useComponentLabels(commandPaletteLabels)
  return (
    <div
      data-slot="command-palette-footer"
      // Keys mean nothing on a touch screen without a keyboard.
      className="own:flex own:h-10 shrink-0 items-center gap-4 border-t border-line own:bg-band own:px-4 own:text-ui-xs own:text-fg-muted own:touch:hidden"
    >
      <span className="own:flex items-center gap-1.5">
        <KbdGroup>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </KbdGroup>
        {labels.navigate}
      </span>
      <span className="own:flex items-center gap-1.5">
        <Kbd>↵</Kbd>
        {labels.open}
      </span>
      <span className="own:flex items-center gap-1.5">
        <Kbd>{labels.escKey}</Kbd>
        {nested ? labels.back : labels.close}
      </span>
      {nested && (
        <span className="own:flex items-center gap-1.5">
          <Kbd>⌫</Kbd>
          {labels.back}
        </span>
      )}
    </div>
  )
}

export { CommandPalette, useCommandPalette }
export type { CommandPalettePage, CommandPaletteProps, CommandPaletteState }
