'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLabels } from '@youj/core'
import { FolderPlusIcon, SearchIcon, UserPlusIcon } from '@youj/icons'
import { Collapse } from '@youj/motion'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { Kbd } from '../../../components/ui/kbd'
import { useSidebar } from '../../../components/ui/sidebar'
import { badgeText, useFrame } from '../shell'
import { pagesOf, pathOf, rank, score, type CommandPage, type FrameCommandAction, type FrameSidebarCommandCopy } from './command-model'
import { CommandResults, optionId, type CommandGroup, type CommandOption } from './command-results'

/* Workspace's command field: the search is the way around.
 * - Typing turns the nav into results: pages ranked by how well their name
 *   answers (the start of the name, then of a word, then anywhere; a
 *   section's or a group's name brings its pages after), each with where it
 *   sits, then the actions that match. The field keeps focus and drives the
 *   list as a combobox: ↑↓ glide the highlight, ↵ goes, Escape clears. The
 *   count is announced.
 * - ↓ in the empty field lists where you've been this session, most recent
 *   first, and the actions.
 * - `/` focuses the field from anywhere that isn't a text field (a folded
 *   sidebar opens first), and G then a page's key goes straight there, as in
 *   Linear. While G is held open each row shows its key. */

export const SAMPLE_ACTIONS: FrameCommandAction[] = [
  { id: 'new-project', label: 'New project', icon: FolderPlusIcon },
  { id: 'invite', label: 'Invite people', icon: UserPlusIcon },
]

/** How long G waits for a page's key. */
const GO_WINDOW = 1500

/** A keystroke meant for a text field, not for the app. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** `/` to the field, and G then a page's key to that page. */
function useKeys(pages: CommandPage[], go: (id: string) => void, focusField: () => void, enabled: boolean) {
  const [armed, setArmed] = useState(false)
  // The listener reads the latest of these without being added again on every render.
  const latest = useRef({ pages, go, focusField })
  useLayoutEffect(() => {
    latest.current = { pages, go, focusField }
  })
  useEffect(() => {
    if (!enabled) return
    let on = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const arm = (next: boolean) => {
      clearTimeout(timer)
      on = next
      setArmed(next)
      if (next) timer = setTimeout(() => arm(false), GO_WINDOW)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented || isTyping(event.target)) return
      const key = event.key.toLowerCase()
      if (on) {
        arm(false)
        const page = latest.current.pages.find((p) => p.key === key)
        if (!page) return
        event.preventDefault()
        latest.current.go(page.item.id)
      } else if (key === 'g' && !event.repeat) arm(true)
      else if (event.key === '/') {
        event.preventDefault()
        latest.current.focusField()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(timer)
      setArmed(false)
    }
  }, [enabled])
  return armed
}

/** The field's state, its results and the go-to keys, for the header and the content to share. */
export function useCommand({ actions, copy }: { actions: FrameCommandAction[]; copy: FrameSidebarCommandCopy }) {
  const { nav, active, navigate } = useFrame()
  const { state, isMobile, openMobile, setOpen, setOpenMobile } = useSidebar()
  const labels = useLabels()
  const listId = useId()
  const field = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  // The list without a query: opened with ↓, closed by leaving the field.
  const [browsing, setBrowsing] = useState(false)
  const [highlight, setHighlight] = useState<string>()
  const [recent, setRecent] = useState<string[]>([])
  const [seenActive, setSeenActive] = useState<typeof active>()
  if (seenActive !== active) {
    setSeenActive(active)
    if (active) setRecent((r) => [active, ...r.filter((id) => id !== active)].slice(0, 5))
  }

  const pages = useMemo(() => pagesOf(nav), [nav])
  const keys = useMemo(() => new Map(pages.flatMap((p) => (p.key ? [[p.item.id, p.key] as const] : []))), [pages])
  const pageOption = (p: CommandPage): CommandOption => ({
    id: `page:${p.item.id}`,
    label: p.item.label,
    icon: p.item.icon ?? p.parents.find((parent) => parent.icon)?.icon,
    detail: pathOf(p),
    note: p.item.badge !== undefined ? badgeText(p.item) : undefined,
  })
  const actionOption = (a: FrameCommandAction): CommandOption => ({ id: `action:${a.id}`, label: a.label, icon: a.icon, detail: copy.action })

  const searching = query.trim() !== ''
  const listed = searching || browsing
  let groups: CommandGroup[]
  if (searching)
    groups = [
      { id: 'pages', label: copy.pages, options: rank(pages, query).map(pageOption) },
      { id: 'actions', label: copy.actions, options: actions.filter((a) => score(a.label, query) > 0).map(actionOption) },
    ]
  else {
    const been = recent.filter((id) => id !== active).flatMap((id) => pages.filter((p) => p.item.id === id))
    groups = [
      been.length ? { id: 'recent', label: copy.recent, options: been.map(pageOption) } : { id: 'pages', label: copy.pages, options: pages.slice(0, 5).map(pageOption) },
      { id: 'actions', label: copy.actions, options: actions.map(actionOption) },
    ]
  }
  groups = groups.filter((g) => g.options.length)
  const options = groups.flatMap((g) => g.options)
  // The highlight stays on its option while it's listed, else goes to the first.
  const current = options.some((o) => o.id === highlight) ? highlight : options[0]?.id

  const close = () => {
    setQuery('')
    setBrowsing(false)
  }
  const pick = (id: string) => {
    const [kind, key] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)]
    close()
    if (kind === 'page') navigate(key)
    else actions.find((a) => a.id === key)?.onSelect?.()
  }
  // `/` from anywhere: a folded sidebar opens (the phone's sheet too) with the field focused once it's in reach.
  const focusField = () => {
    if (isMobile) setOpenMobile(true)
    else if (state === 'collapsed') setOpen(true)
    requestAnimationFrame(() => requestAnimationFrame(() => field.current?.focus()))
  }
  const armed = useKeys(pages, navigate, focusField, !isMobile || openMobile)

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const at = options.findIndex((o) => o.id === current)
    const step = (by: number) => options.length && setHighlight(options[(at + by + options.length) % options.length]!.id)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (listed) step(1)
      else setBrowsing(true)
    } else if (event.key === 'ArrowUp' && listed) {
      event.preventDefault()
      step(-1)
    } else if (event.key === 'Enter' && listed && current) {
      event.preventDefault()
      pick(current)
    } else if (event.key === 'Escape' && listed) {
      // Clears the field before anything around it (the phone's sheet) closes.
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const status = armed ? copy.goStatus : searching ? (options.length ? labels.pagesFound(options.length) : labels.pagesNoMatch(query.trim())) : ''

  const fieldNode = (
    <div role="search" data-slot="frame-command" className="group-data-[collapsible=icon]:hidden">
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          ref={field}
          role="combobox"
          aria-label={copy.search}
          aria-autocomplete="list"
          aria-expanded={listed}
          aria-controls={listed ? listId : undefined}
          aria-activedescendant={listed && current ? optionId(listId, current) : undefined}
          aria-keyshortcuts="/"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => setBrowsing(false)}
        />
        <InputGroupAddon align="inline-end">
          <Kbd aria-hidden>/</Kbd>
        </InputGroupAddon>
      </InputGroup>
      {/* G is held open: which key does what, said once. */}
      <Collapse open={armed}>
        <p className="flex items-center gap-1.5 px-1 pt-1.5 text-ui-xs text-fg-muted">
          <Kbd>G</Kbd> {copy.goHint}
        </p>
      </Collapse>
      <div role="status" className="sr-only">
        {status}
      </div>
    </div>
  )

  const resultsNode = listed ? (
    <CommandResults id={listId} label={copy.results} query={query} groups={groups} active={current} empty={labels.pagesNoMatch(query.trim())} onActive={setHighlight} onPick={pick} />
  ) : null

  return { fieldNode, resultsNode, armed, keys }
}
