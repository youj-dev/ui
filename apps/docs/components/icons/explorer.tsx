'use client'

import { lazy, Suspense, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SearchIcon } from '@youj/icons'
import {
  Button,
  Collapsible,
  CollapsibleChevron,
  CollapsibleContent,
  CollapsibleTrigger,
  toast,
  TooltipProvider,
} from '@youj/react'
import {
  isState,
  youjEntries,
  pairsOf,
  type Entry,
  type ExplorerType,
  type IconCategory,
  type IconEntry,
  type PairEntry,
} from './catalog'
import { returnFocus } from '@/components/explorer/island'
import { useCoarse } from './adaptive'
import type { IconCardActions } from './card-actions'
import type { IconFileKind } from './download'
import { IconGrid } from './icon-grid'
import { DEFAULT_QUERY, parseQuery, type ExplorerQuery } from './query'
import { indexIcons, searchIndex, type Searchable } from './search'
import { DEFAULT_SETTINGS, ExplorerSettingsContext, inkColor, isCustomInk, type DisplaySettings } from './settings'
import { reactSnippet, type SnippetOptions } from './snippets'
import type { IconNode } from './static-svg'
import { MorphAllToggle } from './toolbar'
import { copyToast } from '@/lib/copy-toast'

/* The icons library, under the page's hero: every Youj icon in a virtualized grid that scrolls with the page, each
 * card with an island of actions while you're on it (copy, the code, a download). A Youj icon picked here goes on the
 * hero's stage, or into its chain while that's on. The address can still filter it (`q`, `type`, `category`);
 * the page has no controls for that. */

/** The code modal comes with its first opening. */
const IconCodeDialog = lazy(() => import('./icon-code-dialog'))

export interface IconExplorerProps {
  svgs: Record<string, IconNode[]>
  descriptions: Record<string, string>
  /** An intro for the morph pairs, rendered above their grid. */
  morphIntro?: ReactNode
  /** Told when a Youj icon is picked, so a hero above can put it on stage. */
  onPick?: (id: string) => void
  /** Told when a card opens the hero's Chain: on a pair of Youj icons (from, to), or on a state icon alone (to is null). */
  onChain?: (from: string, to: string | null) => void
  /** The chain (Youj icon ids in order), or null while it's off: the cards show it, and a click on a Youj card goes to onPick without being selected. */
  chain?: readonly string[] | null
}


const describeIcon = (e: IconEntry): Searchable =>
  e.kind === 'youj' ? { name: e.name, keywords: e.keywords, category: e.category, description: e.description } : { name: e.name, keywords: e.keywords }
const describePair = (p: PairEntry): Searchable => ({ name: p.from.name, keywords: [p.to.name, ...p.from.keywords, ...p.to.keywords] })

const categoryOf = (e: Entry): IconCategory | null => {
  const icon = e.kind === 'pair' ? e.from : e
  return icon.kind === 'youj' ? icon.category : null
}

/** What the code modal shows: the entry, its rest drawing, and the options its snippets are written with. */
interface CodeState {
  entry: Entry
  nodes: IconNode[] | null
  options: SnippetOptions
  open: boolean
}

export function IconExplorer({ svgs, descriptions, morphIntro, onPick, onChain, chain = null }: IconExplorerProps) {
  const touch = useCoarse()
  const youj = useMemo(() => youjEntries(svgs, descriptions), [svgs, descriptions])
  const [query, setQuery] = useState<ExplorerQuery>(DEFAULT_QUERY)
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_SETTINGS)
  const [waveAt, setWaveAt] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [code, setCode] = useState<CodeState | null>(null)
  // The card whose code is open holds its island up until the modal has gone and focus is back on its button.
  const [pinned, setPinned] = useState<string | null>(null)

  // The link's state, read before the first paint so a shared view never flashes the default one.
  useLayoutEffect(() => {
    setQuery(parseQuery(window.location.search))
  }, [])

  const update = useCallback((patch: Partial<ExplorerQuery>) => setQuery((q) => ({ ...q, ...patch })), [])
  const changeSettings = useCallback((patch: Partial<DisplaySettings>) => {
    setSettings((s) => {
      if (patch.mode && patch.mode !== s.mode && (patch.mode === 'morph' || s.mode === 'morph')) setWaveAt(performance.now())
      return { ...s, ...patch }
    })
  }, [])

  const pairs = useMemo(() => pairsOf(youj), [youj])
  const indexes = useMemo(
    () => ({
      icons: indexIcons<Entry>(youj, (e) => describeIcon(e as IconEntry), youj),
      morph: indexIcons<Entry>(youj.filter(isState), (e) => describeIcon(e as IconEntry), youj),
      swap: indexIcons<Entry>(pairs, (e) => describePair(e as PairEntry), youj),
    }),
    [youj, pairs],
  )

  const q = useDeferredValue(query.q)
  const found = useMemo(() => ({ icons: searchIndex(indexes.icons, q), morph: searchIndex(indexes.morph, q), swap: searchIndex(indexes.swap, q) }), [indexes, q])
  const setOf = (type: ExplorerType) => (type === 'morph' ? found.morph : type === 'swap' ? found.swap : found.icons)

  const inCategories = (e: Entry, categories: IconCategory[]) => categories.length === 0 || categories.includes(categoryOf(e)!)

  const entries = useMemo(
    () => setOf(query.type).filter((e) => inCategories(e, query.categories)),
    [found, query.type, query.categories], // setOf and the filters read only these
  )

  const marks = useMemo(() => (chain ? new Map(chain.map((id, i) => [id, i + 1])) : null), [chain])

  const select = useCallback(
    (entry: Entry) => {
      if (entry.kind === 'youj') onPick?.(entry.id)
      if (!(chain && entry.kind === 'youj')) setSelectedId(entry.id)
    },
    [onPick, chain],
  )

  const openChain = useCallback(
    (entry: Entry) => {
      if (entry.kind === 'pair') onChain?.(entry.from.id, entry.to.id)
      else onChain?.(entry.id, null)
    },
    [onChain],
  )

  const activate = useCallback(
    (entry: Entry) => {
      if (entry.kind === 'pair') openChain(entry)
    },
    [openChain],
  )

  const snippetOptions = useMemo<SnippetOptions>(
    () => ({ size: settings.size, strokeWidth: settings.strokeWidth, ink: settings.ink, transition: settings.transition }),
    [settings],
  )

  const copy = useCallback(
    async (entry: Entry) => {
      const text = reactSnippet(entry, snippetOptions)
      try {
        await navigator.clipboard.writeText(text)
        copyToast(`${entry.kind === 'pair' ? 'IconSwap' : entry.component} copied`, 'React code, with its import.')
        return true
      } catch {
        toast.error('Couldn’t copy', { id: 'icon-copy', description: 'The browser blocked the clipboard.' })
        return false
      }
    },
    [snippetOptions],
  )

  // The control that opened the code modal: focus goes back to it when it closes.
  const opener = useRef<HTMLElement | null>(null)

  /** Opens the code modal on an entry, with the options its snippets are written with. */
  const openCode = useCallback(
    async (entry: Entry, options: SnippetOptions = snippetOptions, from?: HTMLElement) => {
      opener.current = from ?? (document.activeElement as HTMLElement | null)
      // Opened from a card, the card is the one you're working with: it's selected, so it's the grid's tab stop focus can come back to.
      if (opener.current?.closest('[role=gridcell]')) setSelectedId(entry.id)
      setCode({ entry, nodes: entry.kind === 'youj' ? entry.nodes : null, options, open: true })
      setPinned(entry.id)
    },
    [snippetOptions],
  )

  const save = useCallback(
    async (entry: Entry, kind: IconFileKind, from: HTMLElement) => {
      if (entry.kind === 'pair') return
      try {
        const { hexOf, saveIcon } = await import('./download')
        // Read where the icon is drawn, so a token is the color it is on that card.
        const color = (css: string) => {
          const probe = document.createElement('span')
          probe.style.color = css
          from.appendChild(probe)
          const value = getComputedStyle(probe).color
          probe.remove()
          return hexOf(value)
        }
        const ink = settings.ink
        const name = await saveIcon(entry, kind, {
          size: settings.size,
          strokeWidth: settings.strokeWidth,
          color: ink === 'default' ? undefined : isCustomInk(ink) ? ink : color(inkColor(ink)),
          text: color('var(--color-fg)'),
        })
        toast.success(`Saved ${name}`, { id: 'icon-save' })
      } catch {
        toast.error('Couldn’t make the file', { id: 'icon-save', description: 'The browser blocked the download.' })
      }
    },
    [settings.ink, settings.size, settings.strokeWidth],
  )

  const actions = useMemo<IconCardActions>(
    () => ({ copy, code: (entry, from) => void openCode(entry, undefined, from), save: (entry, kind, from) => void save(entry, kind, from), chain: openChain }),
    [copy, openCode, save, openChain],
  )

  const context = useMemo(() => ({ ...settings, waveAt }), [settings, waveAt])
  const gridId = 'icon-results'
  const typeLabel = { animated: 'icons', morph: 'state icons', swap: 'swap pairs' }[query.type]

  const empty = <Empty query={query.q} onClear={() => update({ q: '', categories: [], type: 'animated' })} />

  return (
    <TooltipProvider>
      <ExplorerSettingsContext.Provider value={context}>
        <section aria-label="Icons" id={gridId} className="min-w-0 -mt-4 lg:-mt-6">
          <IconGrid
            entries={entries}
            selectedId={chain ? null : selectedId}
            marks={marks}
            onSelect={select}
            onActivate={activate}
            onCopy={(entry) => void copy(entry)}
            label={`${entries.length.toLocaleString('en-US')} ${typeLabel}`}
            empty={empty}
            actions={actions}
            touch={touch}
            pinnedId={pinned}
            header={
              query.type === 'morph' ? (
                <MorphIntroFrame action={<MorphAllToggle on={settings.mode === 'morph'} onChange={(on) => changeSettings({ mode: on ? 'morph' : 'hover' })} />}>
                  {query.q ? undefined : morphIntro}
                </MorphIntroFrame>
              ) : undefined
            }
          />
        </section>

        {code && (
          <Suspense fallback={null}>
            <IconCodeDialog entry={code.entry} nodes={code.nodes} options={code.options} open={code.open} onOpenChange={(open) => setCode((c) => c && { ...c, open })} onOpenChangeComplete={(open) => !open && setPinned(null)} finalFocus={returnFocus(opener)} />
          </Suspense>
        )}
      </ExplorerSettingsContext.Provider>
    </TooltipProvider>
  )
}

const INTRO_KEY = 'youj-icons-morph-intro'

/**
 * The morph pairs' bar over their grid: the explainer, under a disclosure a
 * viewer can fold away (remembered in this browser; while searching there's
 * only the line), and Morph all at its end, out of the search row so the row
 * never moves when the type changes.
 */
function MorphIntroFrame({ children, action }: { children?: ReactNode; action: ReactNode }) {
  const [open, setOpen] = useState(true)
  useEffect(() => {
    try {
      if (localStorage.getItem(INTRO_KEY) === 'hidden') setOpen(false)
    } catch {
      // Storage blocked: the intro shows.
    }
  }, [])
  const toggle = (next: boolean) => {
    setOpen(next)
    try {
      localStorage.setItem(INTRO_KEY, next ? 'shown' : 'hidden')
    } catch {
      // Private mode: for this page only.
    }
  }
  return (
    <Collapsible open={open && Boolean(children)} onOpenChange={toggle} className="border-b border-line">
      <div className="flex h-12 items-center gap-3 ps-4 pe-3 md:ps-6 md:pe-4">
        {children ? (
          <CollapsibleTrigger className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md text-start focus-ring">
            <span aria-hidden className="particle size-[5px]" />
            <span className="truncate text-[13px] font-medium text-fg-muted">How a morph is built</span>
            <CollapsibleChevron size={15} className="ms-1 shrink-0 text-fg-muted" />
          </CollapsibleTrigger>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[13px] text-fg-muted">State icons turn between two states: point at one, or turn them all.</span>
        )}
        {action}
      </div>
      {children && <CollapsibleContent>{children}</CollapsibleContent>}
    </Collapsible>
  )
}

function Empty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
      <span className="grid size-12 place-items-center rounded-xl border border-line bg-surface text-fg-muted">
        <SearchIcon size={20} strokeWidth={1.6} trigger="mount" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-medium text-fg">{query ? `Nothing here matches “${query}”` : 'Nothing matches these filters'}</p>
        <p className="text-[13px] text-fg-muted">Try a broader word, another type, or all categories.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      </div>
    </div>
  )
}
