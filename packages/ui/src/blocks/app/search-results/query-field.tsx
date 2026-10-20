'use client'

import { useRef, useState, type RefObject } from 'react'
import { ArrowUpRightIcon, FileTextIcon, HistoryIcon, KanbanIcon, SearchIcon, TrendingUpIcon, UserIcon, XIcon } from '@youj/icons'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '../../../components/ui/command'
import { InputGroup, InputGroupAddon, InputGroupButton } from '../../../components/ui/input-group'
import { Kbd } from '../../../components/ui/kbd'
import { Popover, PopoverContent } from '../../../components/ui/popover'
import { useSearchConfig } from './copy'
import type { SearchItem } from './data'
import { completions, EMPTY_STATE, runSearch, terms } from './model'
import { Highlight } from './result-cards'

/* The query field. Typing opens suggestions under it (a Popover anchored to
 * the field, so focus never leaves the input): the search as typed, matching
 * completions, and the top three results to jump straight to. An empty field
 * offers recent and popular searches instead. The list is cmdk's, so ↑/↓
 * glide the active row and Enter takes it; the first row is always "Search
 * for …", so Enter searches what you typed. With the list closed, ↓ steps
 * into the results. The search runs on Enter, not per keystroke, so the
 * address, the recent list and the loading state all mean one thing. */

const ICONS = { document: FileTextIcon, person: UserIcon, project: KanbanIcon }

interface QueryFieldProps {
  draft: string
  onDraftChange: (draft: string) => void
  onSubmit: (q: string) => void
  onJump: (item: SearchItem) => void
  recent: string[]
  onClearRecent: () => void
  /** ↓ with the list closed: move into the results. */
  onExit: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

export function QueryField({ draft, onDraftChange, onSubmit, onJump, recent, onClearRecent, onExit, inputRef }: QueryFieldProps) {
  const frame = useRef<HTMLDivElement>(null)
  const { copy, brand, items, people, popular } = useSearchConfig()
  const [open, setOpen] = useState(false)
  const typed = draft.trim()
  const words = terms(typed)
  const suggestions = completions(typed, recent, items, popular)
  const jumps = typed ? runSearch({ ...EMPTY_STATE, q: typed }, items, people).slice(0, 3) : []

  const submit = (q: string) => {
    setOpen(false)
    onDraftChange(q)
    onSubmit(q)
  }

  return (
    <Command shouldFilter={false} label={copy.fieldLabel(brand)} className="size-auto overflow-visible rounded-none bg-transparent">
      <InputGroup ref={frame} className="h-control-lg rounded-field-lg shadow-xs">
        <CommandInput
          ref={inputRef}
          expanded={open}
          data-slot="input-group-control"
          value={draft}
          onValueChange={(next) => {
            onDraftChange(next)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (open) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              onExit()
            } else if (event.key === 'Enter' && typed) {
              event.preventDefault()
              submit(typed)
            }
          }}
          placeholder={copy.placeholder}
          wrapperClassName="h-full flex-1 gap-2.5 border-0 ps-3.5 pe-1 [&>svg]:size-[18px]"
          className="text-ui-lg"
          enterKeyHint="search"
        />
        <InputGroupAddon align="inline-end">
          {draft ? (
            <InputGroupButton
              size="icon-xs"
              aria-label={copy.clear}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onDraftChange('')
                setOpen(true)
                inputRef.current?.focus()
              }}
            >
              <XIcon size={14} />
            </InputGroupButton>
          ) : (
            <Kbd aria-hidden className="max-sm:hidden">
              /
            </Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>
      <Popover
        open={open}
        onOpenChange={(next, details) => {
          // Pressing in the field itself isn't leaving it.
          if (!next && details.reason === 'outside-press' && frame.current?.contains(details.event.target as Node)) return
          setOpen(next)
        }}
      >
        <PopoverContent
          anchor={frame}
          align="start"
          initialFocus={false}
          finalFocus={false}
          aria-label={copy.suggestions}
          // Keep focus (and the caret) in the input while a row is clicked.
          onMouseDown={(event) => event.preventDefault()}
          className="w-(--anchor-width) gap-0 overflow-hidden p-0"
        >
          <CommandList className="[--command-list-max:--spacing(88)]">
            {typed ? (
              <>
                <CommandGroup heading={copy.groupSearch}>
                  <CommandItem value={`search:${typed}`} onSelect={() => submit(typed)}>
                    <SearchIcon />
                    <span className="min-w-0 flex-1 truncate">
                      {copy.searchFor} <span className="font-medium text-fg">“{typed}”</span>
                    </span>
                    <CommandShortcut aria-hidden>↵</CommandShortcut>
                  </CommandItem>
                  {suggestions.map((s) => (
                    <CommandItem key={s} value={`q:${s}`} onSelect={() => submit(s)}>
                      {recent.includes(s) ? <HistoryIcon /> : <SearchIcon />}
                      <span className="min-w-0 flex-1 truncate">
                        <Highlight text={s} words={words} />
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {jumps.length > 0 && (
                  <CommandGroup heading={copy.jumpTo}>
                    {jumps.map((item) => {
                      const Icon = ICONS[item.type]
                      return (
                        <CommandItem
                          key={item.id}
                          value={`open:${item.id}`}
                          onSelect={() => {
                            setOpen(false)
                            onJump(item)
                          }}
                        >
                          <Icon size={16} />
                          <span className="min-w-0 flex-1 truncate">
                            <Highlight text={item.title} words={words} />
                          </span>
                          <ArrowUpRightIcon size={14} className="text-fg-muted rtl:-scale-x-100" />
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )}
              </>
            ) : (
              <>
                {recent.length > 0 && (
                  <CommandGroup heading={copy.recentSearches}>
                    {recent.map((s) => (
                      <CommandItem key={s} value={`recent:${s}`} onSelect={() => submit(s)}>
                        <HistoryIcon />
                        <span className="min-w-0 flex-1 truncate">{s}</span>
                      </CommandItem>
                    ))}
                    <CommandItem value="clear-recent" onSelect={onClearRecent} className="text-fg-muted">
                      <XIcon size={16} />
                      {copy.clearRecent}
                    </CommandItem>
                  </CommandGroup>
                )}
                {popular.length > 0 && (
                <CommandGroup heading={copy.popularIn(brand)}>
                  {popular.map((s) => (
                    <CommandItem key={s} value={`popular:${s}`} onSelect={() => submit(s)}>
                      <TrendingUpIcon />
                      <span className="min-w-0 flex-1 truncate">{s}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  )
}
