'use client'

import { Fragment, lazy, startTransition, Suspense, useDeferredValue, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { staticClient } from 'fumadocs-core/search/client/orama-static'
import type { SharedProps } from 'fumadocs-ui/contexts/search'
import { useDevice } from '@youj/core'
import { commandPaletteLabels, useComponentLabels } from '@youj/core/labels'
import { shippedThemes } from '@youj/core/lib/youj/theme'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { AlignLeftIcon, ArrowRightIcon, CopyIcon, FileTextIcon, HeadingIcon, ThemeIcon, type YoujIconComponent } from '@youj/icons'
import { Kbd, KbdGroup, toast } from '@youj/react'
import {
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
} from '@youj/react/command'
import { LoadersGlyph, IconsGlyph, IllustrationsGlyph, navGlyph, pillarGlyph } from '@/components/site/pillar-icons'
import type { StageItem } from '@/components/site/search-stage'
import { revealHash } from '@/components/docs/reveal'
import { takeSearchSeed } from '@/components/site/search-seed'
import { groupResults, rankResults, resultGroup, searchTerms, splits, titleFit, type Result, type ResultGroup } from '@/components/site/search-rank'
import { readRecent, remember, type Recent } from '@/components/site/search-recent'
import { cn } from '@/lib/cn'
import { modePreset } from '@/lib/site-mode'
import { useSiteTheme } from '@/lib/site-theme'
import type { NavLink, Pillar, PillarId } from '@/lib/nav'
import { isPageArt, PAGE_ART_SCENE, type PageArtId } from '@/lib/page-art'
import { copyToast } from '@/lib/copy-toast'

/* ⌘K: the docs search, on Youj UI's CommandDialog and Command parts. Search
 * runs in the browser against the index exported at build time (/api/search:
 * the docs pages and the levels' items), so the site needs no server. With
 * nothing typed it's a launcher: the pages last opened from it, the parts of
 * the family (each opens its docs, as the header's menus do), the explorers,
 * the start pages, and the site's own settings. Icon names and theme presets
 * match too.
 *
 * Beside the list stands a stage (./search-stage): the highlighted row, shown
 * as what it is, a loader playing, an icon moving, a scene, a
 * theme worn. The highlighted row's glyph plays its gesture, and with the
 * site's sound on, the highlight ticks as it steps. On touch the palette is
 * a sheet with no room beside the list, so it's the list alone.
 *
 * Every row of a result list belongs to the query that produced it, and its
 * value says so: when the next query's results land, every row is new, so the
 * palette's selection falls to the first one, the top page, and Enter opens
 * what the list shows first. A query with no match tries again as two words
 * (a compound typed without its space), then with a typo allowed per word. */

// Up to 16 hits a page rather than 8, so a page whose heading names the query keeps that heading among its hits however often its text repeats the word.
const hits = { limit: 160, groupBy: { properties: ['page_id'], maxResult: 16 } }
const client = staticClient({ from: '/api/search', search: hits })
// The same index (the client caches it by URL), searched with a typo's tolerance.
const lenient = staticClient({ from: '/api/search', search: { ...hits, tolerance: 1 } })
// …and with every word required: for a compound typed without its space ("datepiker" as "date piker").
const together = staticClient({ from: '/api/search', search: { ...hits, tolerance: 1, threshold: 0 } })

/** Results for a query, kept with that query; the last ones stay up while the next are found. */
function useSearchResults(search: string) {
  // `terms` is what found them, which ranks them: the split words, for a compound.
  const [shown, setShown] = useState<{ q: string; terms: string; results: Result[]; close: boolean }>({ q: '', terms: '', results: [], close: false })
  const [loading, setLoading] = useState(false)
  const q = search.trim()
  useEffect(() => {
    if (!q) {
      setShown({ q: '', terms: '', results: [], close: false })
      setLoading(false)
      return
    }
    let live = true
    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        let terms = searchTerms(q)
        let results = await client.search(terms)
        let close = false
        // No title holds the word: maybe a compound missing its space ("datepicker"). The split a title holds best wins.
        if (titleFit(results, terms) > 0) {
          let best = titleFit(results, terms)
          for (const split of splits(terms)) {
            const found = await together.search(split)
            const fit = titleFit(found, split)
            if (fit < best) [best, results, terms, close] = [fit, found, split, true]
          }
        }
        // Still nothing: a typo allowed per word.
        if (results.length === 0 && terms.length > 3) {
          results = await lenient.search(terms)
          close = results.length > 0
        }
        if (live) setShown({ q, terms, results, close })
      } catch {
        if (live) setShown({ q, terms: q, results: [], close: false })
      } finally {
        if (live) setLoading(false)
      }
    }, 100)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [q])
  return { ...shown, loading }
}

export interface SearchOptions {
  pillars: Pillar[]
  /** The icons and illustrations explorers and the loaders gallery: tools outside the docs, listed on their own. */
  explorers: NavLink[]
  start: NavLink[]
  install: string
}

/* The icon names arrive the first time the palette opens (/icon-names.json, app/icon-names.json), not with every page. */
let iconRequest: Promise<string[]> | undefined
function loadIconNames(): Promise<string[]> {
  iconRequest ??= fetch('/icon-names.json').then((res) => {
    if (!res.ok) throw new Error(`/icon-names.json: ${res.status}`)
    return res.json() as Promise<string[]>
  })
  iconRequest.catch(() => (iconRequest = undefined))
  return iconRequest
}

type Props = SharedProps & Partial<SearchOptions>

/** Search excerpts arrive as Markdown with <mark> around the matches: they're shown as text, the matches marked. */
export function renderExcerpt(text: string): ReactNode {
  return text
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*|__/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split(/(<mark>[\s\S]*?<\/mark>)/g)
    .map((part, i) =>
      part.startsWith('<mark>') ? (
        <mark key={i} className="rounded-[3px] bg-accent-subtle px-0.5 text-fg">
          {part.slice(6, -7)}
        </mark>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    )
}

const ICON = { size: 16, strokeWidth: 1.6 } as const

/** Each level's glyph, as the header's menus draw it. */
const GROUP_GLYPH: Record<ResultGroup, YoujIconComponent> = {
  Components: navGlyph.components,
  Cards: navGlyph.cards,
  Sections: navGlyph.sections,
  Screens: navGlyph.screens,
  Specialized: navGlyph.cards,
  Create: navGlyph.frames,
  Visuals: IconsGlyph,
  Docs: FileTextIcon,
}

/** What a row of a group is, said once on the stage. */
const KIND: Record<ResultGroup, string> = {
  Components: 'Component',
  Cards: 'Card',
  Sections: 'Section',
  Screens: 'Screen',
  Specialized: 'Block',
  Create: 'Builder',
  Visuals: 'Explorer',
  Docs: 'Docs page',
}

/** A page's glyph by its URL: the explorers their own, a level's item its level's, the rest a page. */
export function glyphOf(url: string): YoujIconComponent {
  const path = url.split(/[?#]/)[0]!
  if (path === '/loaders') return LoadersGlyph
  if (path === '/icons') return IconsGlyph
  if (path === '/illustrations') return IllustrationsGlyph
  if (path === '/miniatures') return navGlyph.miniatures
  return GROUP_GLYPH[resultGroup(url)]
}

/** The pages whose picture isn't named after them, by the page-art they open with (the rest of the docs: their section's scene). */
const PAGE_OF_SLUG: Record<string, PageArtId> = {
  mcp: 'ai',
  'guides/rtl': 'i18n',
  'guides/touch-mode': 'composing',
  'guides/ssr': 'installation',
  'guides/styling-hooks': 'composing',
  'guides/composing-components': 'composing',
}
const SECTION_SCENE: Record<string, string> = { '': 'laptop', motion: 'stopwatch', sound: 'music', icons: 'design-tools', illustrations: 'easel', looks: 'easel', guides: 'map' }

/** The isometric scene that stands for a docs page or an explorer. */
export function sceneOf(path: string): string {
  if (path === '/icons') return 'design-tools'
  if (path === '/illustrations') return 'idea'
  if (path === '/miniatures') return 'phone'
  const slug = path.replace(/^\/docs\/?/, '').replace(/\/$/, '')
  const art = PAGE_OF_SLUG[slug] ?? (isPageArt(slug) ? slug : undefined)
  if (art) return PAGE_ART_SCENE[art]
  return SECTION_SCENE[slug.split('/')[0]!] ?? 'documents'
}

/**
 * What the stage shows for a page: a loader, a scene or an icon its URL opens
 * the explorer on, the theme for the theming page, and the rest as its glyph.
 */
export function stageOf(url: string, title: string, text?: ReactNode, dark = false): StageItem {
  const at = new URL(url, 'https://youj.dev')
  const param = (key: string) => at.searchParams.get(key)
  if (at.pathname === '/loaders' && param('id')) return { art: { kind: 'loader', id: param('id')! }, kind: 'Loader', title, text }
  if (at.pathname === '/illustrations' && param('scene')) return { art: { kind: 'scene', id: param('scene')! }, kind: 'Illustration', title, text }
  if (at.pathname === '/icons' && param('icon')) return { art: { kind: 'icon', name: param('icon')! }, kind: 'Icon', title, text }
  if (at.pathname === '/docs/theming') return { art: { kind: 'theme', id: modePreset(dark) }, kind: KIND.Docs, title, text }
  if (at.pathname === '/loaders') return { art: { kind: 'loader', id: 'tittle' }, kind: KIND.Visuals, title, text }
  const group = resultGroup(url)
  const Glyph = glyphOf(url)
  if (group === 'Visuals' || group === 'Docs') return { art: { kind: 'scene', id: sceneOf(at.pathname) }, kind: KIND[group], title, text }
  return { art: { kind: 'glyph', Glyph }, kind: KIND[group], title, text }
}

const PILLAR_SCENE: Record<Exclude<PillarId, 'loaders' | 'themes'>, string> = {
  ui: 'puzzle',
  motion: 'stopwatch',
  icons: 'design-tools',
  illustrations: 'idea',
  sound: 'music',
  blocks: 'warehouse',
}

/** What each part of the family shows on the stage while it's highlighted: one of its own, playing, else its glyph. */
function pillarStage(p: Pillar, dark: boolean): StageItem {
  const art: StageItem['art'] =
    p.id === 'loaders'
      ? { kind: 'loader', id: 'tittle' }
      : p.id === 'themes'
        ? { kind: 'theme', id: modePreset(dark) }
        : { kind: 'scene', id: PILLAR_SCENE[p.id] }
  return { art, kind: 'Youj', title: p.name, text: p.blurb }
}

const plain = (text: string) => text.replace(/<\/?mark>/g, '')

/** A preset's value for the mode: one for both, or one each (`{ light, dark }`). */
const forMode = <T,>(value: T | { light: T; dark: T } | undefined, dark: boolean): T | undefined =>
  value && typeof value === 'object' && 'light' in value ? value[dark ? 'dark' : 'light'] : (value as T | undefined)

/** The palette's own stage: its chunk arrives once the palette is open, after the list it stands beside. */
const SearchStage = lazy(() => import('./search-stage'))

export default function SiteSearch({ open, onOpenChange, pillars = [], explorers = [], start = [], install = '' }: Props) {
  const router = useRouter()
  const labels = useComponentLabels(commandPaletteLabels)
  const [search, setSearch] = useState('')
  const found = useSearchResults(search)
  const theme = useSiteTheme()
  const q = search.trim().toLowerCase()
  // What the result rows show: the query whose results are in.
  const shownQ = found.q.toLowerCase()
  const cue = useSoundCue()
  // On touch the palette is a sheet, a column with no room beside the list: no stage.
  const sheet = useDevice() === 'touch'
  // The launcher opens on its first rows (Youj, Explorers); the rest are drawn a moment later, in a render that gives way to typing.
  const whole = useDeferredValue(true, false)

  // Opening mounts the dialog, cmdk and every row: that render runs as a transition, so the press or ⌘K that asked for it paints at once. Closing is immediate.
  const [opened, setOpened] = useState(open)
  useEffect(() => {
    if (open) startTransition(() => setOpened(true))
    else setOpened(false)
  }, [open])

  // The palette's code arrives with its first open, so its dialog mounts open and can't hear itself open: say it once here. Later opens are the dialog's.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the first open only
  useEffect(() => {
    if (open) cue('open')
  }, [])

  // Opening starts the index's download, so it's in (or on its way) by the first keystroke; an opener may hand over a query.
  const [icons, setIcons] = useState<string[]>([])
  const [recent, setRecent] = useState<Recent[]>([])
  useEffect(() => {
    if (!open) return
    void Promise.resolve(client.search('youj')).catch(() => {})
    loadIconNames().then(setIcons, () => {})
    setRecent(readRecent())
    const seed = takeSearchSeed()
    if (seed) setSearch(seed)
  }, [open])

  // The highlighted row, read from the list (cmdk highlights the first row of a new list without saying so). cmdk keeps
  // pointing at a row that has gone (results that arrived later) and then nothing is highlighted: whenever no row is and
  // some exist, the first takes over.
  const [selected, setSelected] = useState('')
  const [list, setList] = useState<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!list) return
    const heal = () => {
      const row = list.querySelector('[cmdk-item][aria-selected="true"]') ?? list.querySelector('[cmdk-item]:not([aria-disabled="true"])')
      const value = row?.getAttribute('data-value')
      if (value) setSelected(value)
    }
    heal()
    const rows = new MutationObserver(heal)
    rows.observe(list, { childList: true, subtree: true, attributeFilter: ['aria-selected'] })
    return () => rows.disconnect()
  }, [list])

  const go = (url: string, title?: string) => {
    if (title) remember({ url, title })
    onOpenChange(false)
    router.push(url)
    // On the page it points into, the router doesn't fire `hashchange`: a fold or tab holding the heading opens once the URL has settled.
    if (new URL(url, window.location.href).pathname === window.location.pathname) window.setTimeout(revealHash, 120)
  }

  const results = q && shownQ ? rankResults(found.results, found.terms) : []
  // A close-match list is one group of its own; an exact one is listed by level.
  const groups = found.close || results.length === 0 ? [] : groupResults(found.results, found.terms)
  const iconMatches = q && shownQ.length > 1 ? icons.filter((name) => name.includes(shownQ.replace(/\s+/g, '-'))).slice(0, 6) : []
  // The presets, for a query that asks for themes or names one.
  const presetMatches =
    q && shownQ.length > 2 ? shippedThemes.filter((t) => /^(them|preset)/.test(shownQ) || t.name.toLowerCase().startsWith(shownQ)) : []

  const actions = [
    {
      id: 'theme',
      label: theme.dark ? 'Switch to light theme' : 'Switch to dark theme',
      icon: <ThemeIcon {...ICON} active={theme.dark} />,
      run: () => theme.toggleMode(),
      shortcut: 'D',
      stage: {
        art: { kind: 'theme', id: modePreset(!theme.dark) },
        kind: 'Site',
        title: theme.dark ? 'Light' : 'Dark',
        text: 'The whole site, in light or dark.',
      } satisfies StageItem,
    },
    {
      id: 'install',
      label: 'Copy the install command',
      icon: <CopyIcon {...ICON} />,
      run: async () => {
        try {
          await navigator.clipboard.writeText(install)
          copyToast('Command copied', install)
        } catch {
          toast.error('Couldn’t reach the clipboard')
        }
      },
      hidden: !install,
      stage: {
        art: { kind: 'scene', id: 'delivery' },
        kind: 'Site',
        title: 'Install Youj',
        text: <code className="font-mono text-fg">{install}</code>,
      } satisfies StageItem,
    },
  ].filter((a) => !a.hidden && (!q || (shownQ && a.label.toLowerCase().includes(shownQ))))
  // A row's value names the query its list is for (see the top of the file).
  const valueOf = (id: string) => (q ? `${id}::${shownQ}` : id)

  // What each row shows on the stage, by its value, gathered as the rows are drawn.
  const stage = new Map<string, StageItem>()
  // The highlighted row's glyph plays its gesture.
  const glyphRow = (value: string, Glyph: YoujIconComponent) => <Glyph {...ICON} active={selected === value} />
  const row = (value: string, item: StageItem) => (stage.set(value, item), value)
  // The presets: first for a query that names one, else after the best group of pages (Theming, for "theme").
  const themes = presetMatches.length > 0 && (
    <CommandGroup heading="Themes">
      {presetMatches.map((preset) => {
        const value = row(valueOf(`theme-${preset.id}`), {
          art: { kind: 'theme', id: preset.id },
          kind: 'Theme preset',
          title: preset.name,
          text: preset.description,
        })
        const chart = forMode<readonly string[]>(preset.chart, theme.dark) ?? []
        return (
          <CommandItem key={preset.id} value={value} onSelect={() => go('/docs/theming#presets', 'Theming')}>
            <span aria-hidden className="flex w-4 shrink-0 -space-x-1">
              {[forMode<string>(preset.accent, theme.dark), ...chart.slice(0, 2)].map((color, i) => (
                <span key={i} className="size-2.5 rounded-full ring-2 ring-overlay" style={{ background: color }} />
              ))}
            </span>
            <span className="flex-1 truncate">{preset.name}</span>
            <CommandShortcut>Theme</CommandShortcut>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
  const namesPreset = presetMatches.some((t) => t.name.toLowerCase().startsWith(shownQ))
  const listed = found.close ? [{ group: `Close matches for “${found.q}”`, items: results }] : groups
  const rows = (
    <>
      {!q && (
        <>
          {recent.length > 0 && (
            <CommandGroup heading="Recent">
              {recent.map((r) => {
                const value = row(`recent-${r.url}`, stageOf(r.url, r.title, undefined, theme.dark))
                return (
                  <CommandItem key={r.url} value={value} onSelect={() => go(r.url, r.title)}>
                    {glyphRow(value, glyphOf(r.url))}
                    <span className="flex-1 truncate">{r.title}</span>
                    <ArrowRightIcon {...ICON} className="opacity-0 group-data-[selected=true]/command-item:opacity-100" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          <CommandGroup heading="Youj">
            {pillars.map((p) => {
              const value = row(`pillar-${p.id}`, pillarStage(p, theme.dark))
              return (
                <CommandItem key={p.id} value={value} onSelect={() => go(p.url)}>
                  {glyphRow(value, pillarGlyph[p.id])}
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate">{p.label}</span>
                    {p.status && (
                      <span data-status={p.status} className="sidebar-badge ms-0! shrink-0">
                        {p.status}
                      </span>
                    )}
                  </span>
                  <span className="type-small text-fg-muted">{p.stat}</span>
                </CommandItem>
              )
            })}
          </CommandGroup>
          {explorers.length > 0 && (
            <CommandGroup heading="Explorers">
              {explorers.map((tool) => {
                const value = row(`explorer-${tool.url}`, { ...stageOf(tool.url, tool.title, tool.description, theme.dark), kind: KIND.Visuals })
                return (
                  <CommandItem key={tool.url} value={value} onSelect={() => go(tool.url)}>
                    {glyphRow(value, glyphOf(tool.url))}
                    <span className="flex-1 truncate">{tool.title}</span>
                    <ArrowRightIcon {...ICON} className="opacity-0 group-data-[selected=true]/command-item:opacity-100" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {whole && start.length > 0 && (
            <CommandGroup heading="Start here">
              {start.map((page) => {
                const value = row(`start-${page.url}`, stageOf(page.url, page.title, page.description, theme.dark))
                return (
                  <CommandItem key={page.url} value={value} onSelect={() => go(page.url)}>
                                        <span className="flex-1 truncate">{page.title}</span>
                    <ArrowRightIcon {...ICON} className="opacity-0 group-data-[selected=true]/command-item:opacity-100" />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
          {whole && <CommandSeparator />}
        </>
      )}

      {q && found.loading && results.length === 0 && <CommandLoading label="Searching…" />}

      {namesPreset && themes}

      {listed.map(({ group, items }, at) => {
        // A heading or an excerpt shows its page on the stage, with its own words under the page's title.
        let page = items[0]
        return (
          <Fragment key={group}>
            <CommandGroup heading={group}>
              {items.map((item, i) => {
                if (item.type === 'page') page = item
                // Under a page's title: its first excerpt among the hits, else where it is.
                let excerpt: Result | undefined
                for (const other of items.slice(i + 1)) {
                  if (other.type === 'page') break
                  if (other.type === 'text') {
                    excerpt = other
                    break
                  }
                }
                const title = plain(String((item.type === 'page' ? item : page)?.content ?? item.content))
                const text =
                  item.type === 'page'
                    ? excerpt
                      ? renderExcerpt(String(excerpt.content))
                      : item.breadcrumbs?.join(' / ')
                    : renderExcerpt(String(item.content))
                const value = row(valueOf(item.id), stageOf(item.url, title, text, theme.dark))
                return (
                  <CommandItem
                    key={item.id}
                    value={value}
                    onSelect={() => go(item.url, item.type === 'heading' ? plain(String(item.content)) : title)}
                    className={item.type === 'page' ? undefined : 'ps-9!'}
                  >
                    {item.type === 'page' ? (
                      glyphRow(value, glyphOf(item.url))
                    ) : item.type === 'heading' ? (
                      <HeadingIcon {...ICON} />
                    ) : (
                      <AlignLeftIcon {...ICON} />
                    )}
                    <span className="flex min-w-0 flex-1 flex-col py-1.5">
                      <span className="truncate">{renderExcerpt(String(item.content))}</span>
                      {item.type === 'page' && item.breadcrumbs && item.breadcrumbs.length > 0 && (
                        <span className="truncate text-ui-sm text-fg-muted">{item.breadcrumbs.join(' / ')}</span>
                      )}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {at === 0 && !namesPreset && themes}
          </Fragment>
        )
      })}

      {listed.length === 0 && !namesPreset && themes}

      {iconMatches.length > 0 && (
        <CommandGroup heading="Icons">
          {iconMatches.map((name) => {
            const url = `/icons?icon=${encodeURIComponent(name)}`
            const value = row(valueOf(`icon-${name}`), stageOf(url, name, 'Animated, in your theme’s stroke. Opens in the icon explorer.'))
            return (
              <CommandItem key={name} value={value} onSelect={() => go(url, name)}>
                {glyphRow(value, IconsGlyph)}
                <span className="flex-1 truncate font-mono text-ui-sm">{name}</span>
                <CommandShortcut>Icon</CommandShortcut>
              </CommandItem>
            )
          })}
        </CommandGroup>
      )}

      {(whole || q) && actions.length > 0 && (
        <CommandGroup heading="Site">
          {actions.map((action) => {
            const value = row(valueOf(`action-${action.id}`), action.stage)
            return (
              <CommandItem
                key={action.id}
                value={value}
                onSelect={() => {
                  onOpenChange(false)
                  void action.run()
                }}
              >
                {action.icon}
                <span className="flex-1 truncate">{action.label}</span>
                {action.shortcut && <CommandShortcut>{action.shortcut}</CommandShortcut>}
              </CommandItem>
            )
          })}
        </CommandGroup>
      )}

      {q && !found.loading && found.q === search.trim() && <CommandEmpty>No results for “{search.trim()}”.</CommandEmpty>}
    </>
  )

  // A row the list has just left (new results on their way) keeps the stage on what it showed.
  const [held, setHeld] = useState<{ value: string; item: StageItem }>()
  const current = stage.get(selected)
  if (current && held?.value !== selected) setHeld({ value: selected, item: current })
  const shown = current ?? held?.item

  return (
    <CommandDialog
      open={open && opened}
      onOpenChange={onOpenChange}
      // Reopening starts fresh, once the closing animation is over.
      onOpenChangeComplete={(isOpen) => !isOpen && setSearch('')}
      title="Search the docs"
      description="Search the docs, components, blocks, icons, loaders, illustrations and themes, then open one."
      autoFocusField
      className={cn('max-w-2xl', !sheet && 'md:max-w-[56rem]')}
    >
      <Command
        label="Search the docs"
        shouldFilter={false}
        value={selected}
        onValueChange={setSelected}
        onKeyDown={(event) => {
          // A detent as the highlight steps, when the site's sound is on.
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') cue('tick')
        }}
      >
        <CommandInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search docs, components, loaders, icons…"
          wrapperClassName="h-13 gap-2.5 own:px-4"
          className="text-ui-lg"
        />
        <div className="flex min-h-0 flex-1">
          <CommandList
            ref={setList}
            className={cn(
              'min-w-0 flex-1 [&>[cmdk-list-sizer]]:p-2 **:data-[slot=command-item]:min-h-10 **:data-[slot=command-item]:gap-3 **:data-[slot=command-item]:px-2.5',
              // Beside the stage the list holds one height, so the stage never moves; alone it eases to its rows.
              sheet ? '' : 'md:h-[min(27rem,62dvh)] md:max-h-none md:transition-none [--command-list-max:min(24rem,55dvh)]',
              // The sheet's rows are 48px, with the sheet's inset, whatever the desktop's are.
              'group-data-sheet-popup/sheet:[&>[cmdk-list-sizer]]:p-1.5 group-data-sheet-popup/sheet:**:data-[slot=command-item]:min-h-12 group-data-sheet-popup/sheet:**:data-[slot=command-item]:ps-3',
            )}
          >
            {rows}
          </CommandList>
          {!sheet && (
            <div className="hidden w-[19rem] shrink-0 border-s border-line md:block">
              <Suspense fallback={null}>
                <SearchStage item={shown} />
              </Suspense>
            </div>
          )}
        </div>
        <footer
          data-slot="command-palette-footer"
          // Keys mean nothing on a touch screen without a keyboard.
          className="flex h-10 shrink-0 items-center gap-4 border-t border-line-subtle px-4 text-ui-xs text-fg-muted touch:hidden [&_kbd]:border-0 [&_kbd]:bg-transparent [&_kbd]:px-0 [&_kbd]:text-fg-subtle [&_kbd]:shadow-none"
        >
          <span className="flex items-center gap-1.5">
            <KbdGroup>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
            </KbdGroup>
            {labels.navigate}
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd>
            {labels.open}
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>{labels.escKey}</Kbd>
            {labels.close}
          </span>
        </footer>
      </Command>
    </CommandDialog>
  )
}
