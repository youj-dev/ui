'use client'

import { lazy, memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { useDirection, useYouj } from '@youj/core'
import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/lib/use-media-query'
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, IconSwap, PlayIcon, TrashIcon, XIcon, RefreshIcon, ShuffleIcon, type IconSwapDirection, type IconSwapTransition } from '@youj/icons'
import { SegmentedControl, SegmentedControlItem, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider, SortableList, SortableListHandle, SortableListItem, Toolbar, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@youj/react'
import { IslandButton, returnFocus } from '@/components/explorer/island'
import { PanelActions, PanelLink, PanelRow as Row, PanelSection, ShowroomHero, StageReadout } from '@/components/showroom/hero'
import { useArrowStepping, useRevealHero, useShowroomSelection, useStageScheme } from '@/components/showroom/hooks'
import { ShowroomSearch, type SearchEntry, type ShowroomSearchHandle } from '@/components/showroom/search'
import { SiteInk } from '@/components/showroom/site-ink'
import type { ShowroomItem } from '@/components/showroom/thumb'
import { ViewfinderStrip } from '@/components/showroom/viewfinder'
import { categoryLabel, TRANSITIONS, youjEntries, type YoujEntry } from './catalog'
import { ColorControl } from './color-control'
import { StaticGlyph } from './glyph'
import { IconExplorer, type IconExplorerProps } from './explorer'
import { indexIcons, searchIndex, type SearchIndex } from './search'
import { DEFAULT_SETTINGS, inkColor, SIZE_RANGE, STROKE_RANGE, type Ink } from './settings'
import { chainSnippet, reactSnippet, type SnippetOptions } from './snippets'

/* The icons page on the showroom shell (components/showroom): one Youj icon large on the paper stage, playing its
 * choreography, with its panel; a column of every Youj icon beside it (a strip and the search under it on narrow
 * screens). The Chain is a mode of the same hero: a chain of up to ten icons the stage morphs through, one swap
 * after another (`?chain=a~b~c`). The library grid under it picks icons onto the stage, and opens the Chain on a pair. */

const IconCodeDialog = lazy(() => import('./icon-code-dialog'))

const FALLBACK = 'bell'
type Trigger = 'hover' | 'loop' | 'mount'
const DIRECTIONS = [
  { id: 'up', Icon: ArrowUpIcon },
  { id: 'down', Icon: ArrowDownIcon },
  { id: 'left', Icon: ArrowLeftIcon },
  { id: 'right', Icon: ArrowRightIcon },
] as const satisfies readonly { id: IconSwapDirection; Icon: unknown }[]

const COLUMNS = 4
const MAX_CHAIN = 10
const CHAIN_TIP = 'Morph through up to 10 icons in a row'
/** The address names the chain `a~b~c`; `~` stays readable. */
const morphParam = (ids: string[] | null) => (ids && ids.length ? ids.join('~') : null)

/** The chain: its icons, where the next pick goes (null: the end), the step playing, and what can be done to it. */
interface Chain {
  icons: YoujEntry[]
  at: number | null
  step: number
  onStep: (step: number) => void
  onJump: (index: number) => void
  onEnd: () => void
  onRemove: (index: number) => void
  onClear: () => void
  onReorder: (ids: string[]) => void
}
const icon = { size: 15, strokeWidth: 1.75 } as const
const Strip = memo(ViewfinderStrip)
const Search = memo(ShowroomSearch)

export function IconsShowroom(props: IconExplorerProps) {
  const { svgs, descriptions } = props
  const entries = useMemo(() => youjEntries(svgs, descriptions), [svgs, descriptions])
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])
  const items = useMemo<ShowroomItem[]>(
    () =>
      entries.map((e) => ({
        id: e.id,
        label: e.name,
        draw: () => (
          <span aria-hidden className="absolute inset-0 grid place-items-center text-fg">
            <StaticGlyph nodes={e.nodes} size={22} strokeWidth={1.5} />
          </span>
        ),
      })),
    [entries],
  )
  const { item, prev, next, index, select } = useShowroomSelection({ items, param: 'icon', initial: null, fallback: FALLBACK })
  const entry = byId.get(item?.id ?? FALLBACK) ?? entries[0]!
  // The Chain: off (null), or the chain's ids and where the next pick goes (null: the end).
  const [chain, setChain] = useState<{ ids: string[]; at: number | null } | null>(null)
  const morph = chain && chain.ids
  const [step, setStep] = useState(0)
  const remove = useCallback((i: number) => setChain((l) => l && { ids: l.ids.filter((_, j) => j !== i), at: l.at === null ? null : i < l.at ? l.at - 1 : l.at }), [])
  const pick = useCallback(
    (id: string) => {
      if (!chain) return
      const i = chain.ids.indexOf(id)
      if (i >= 0) return remove(i)
      if (chain.ids.length >= MAX_CHAIN) return
      const where = Math.min(chain.at ?? chain.ids.length, chain.ids.length)
      setChain({ ids: [...chain.ids.slice(0, where), id, ...chain.ids.slice(where)], at: chain.at === null ? null : where + 1 })
    },
    [chain, remove],
  )
  const jump = useCallback((i: number) => {
    setStep(i)
    setChain((l) => l && { ...l, at: i + 1 >= l.ids.length ? null : i + 1 })
  }, [])
  const clear = useCallback(() => {
    setStep(0)
    setChain((l) => l && { ids: [], at: null })
  }, [])
  const end = useCallback(() => setChain((l) => l && { ...l, at: null }), [])
  const reorder = useCallback(
    (ids: string[]) => {
      if (!chain) return
      // The playing step follows its icon.
      setStep(ids.indexOf(chain.ids[step % chain.ids.length]!))
      setChain({ ids, at: null })
    },
    [chain, step],
  )

  const hero = useRef<HTMLElement>(null)
  const search = useRef<ShowroomSearchHandle>(null)
  const reveal = useRevealHero(hero, 'icon-name')
  useArrowStepping({ prev, next, onStep: select })

  // The address as the page was opened: a link names the icon on stage and, in the Chain, the icons picked.
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('icon')
    if (id && byId.has(id)) select(id)
    const named = [...new Set((params.get('chain') ?? '').split('~'))].filter((id) => byId.has(id)).slice(0, MAX_CHAIN)
    if (named.length) setChain({ ids: named, at: null })
    setReady(true)
  }, [byId, select])
  useEffect(() => {
    if (!ready) return
    const url = new URL(window.location.href)
    const value = morphParam(morph)
    if (url.searchParams.get('chain') === value) return
    if (value) url.searchParams.set('chain', value)
    else url.searchParams.delete('chain')
    url.search = url.search.replace(/%7E/gi, '~')
    window.history.replaceState(window.history.state, '', url)
  }, [morph, ready])

  const searchEntries = useMemo<SearchEntry[]>(
    () => entries.map((e, i) => ({ item: items[i]!, meta: `${categoryLabel(e.category)} · ${e.component}`, tags: e.keywords.slice(0, 4), category: e.category })),
    [entries, items],
  )
  const ids = useMemo(() => entries.map((e) => e.id), [entries])
  const index_ = useRef<SearchIndex<YoujEntry> | null>(null)
  const find = useCallback(
    (q: string) => {
      if (!q) return ids
      index_.current ??= indexIcons(entries, (e) => ({ name: e.name, keywords: e.keywords, category: e.category, description: e.description }))
      return searchIndex(index_.current, q).map((e) => e.id)
    },
    [ids, entries],
  )
  const chips = useMemo(() => [...new Set(entries.map((e) => e.category))].map((c) => ({ id: c, name: categoryLabel(c) })), [entries])
  const strip = { label: 'Icons', noun: 'icon', items, current: entry.id, prev, next, onSelect: morph ? pick : select }
  const toggle = useCallback(() => {
    setStep(0)
    setChain((l) => (l ? null : { ids: [entry.id], at: null }))
  }, [entry.id])
  const openChain = useCallback(
    (from: string, to: string | null) => {
      if (!byId.has(from)) return
      setChain({ ids: to && to !== from && byId.has(to) ? [from, to] : [from], at: null })
      setStep(0)
      reveal()
    },
    [byId, reveal],
  )

  return (
    <TooltipProvider>
      <IconHero
        ref={hero}
        entry={entry}
        index={index + 1}
        total={entries.length}
        chain={chain && { icons: chain.ids.map((id) => byId.get(id)!), at: chain.at, step, onStep: setStep, onJump: jump, onEnd: end, onRemove: remove, onClear: clear, onReorder: reorder }}
        onMorph={toggle}
        onCategory={(id) => search.current?.open({ categories: [id] })}
        viewfinder={(orientation) => (
          <SiteInk ink={false}>
            {orientation === 'vertical' ? <IconColumn entries={entries} current={entry.id} onSelect={select} morph={morph} onToggle={toggle} onPick={pick} /> : <Strip orientation={orientation} {...strip} />}
          </SiteInk>
        )}
        search={(placement) => (
          <SiteInk ink={false}>
            <Search ref={search} placement={placement} noun="icon" plural="icons" entries={searchEntries} find={find} categories={chips} current={entry.id} onSelect={select} />
          </SiteInk>
        )}
      />
      <IconExplorer {...props} chain={morph} onPick={(id) => byId.has(id) && (morph ? pick(id) : (select(id), reveal()))} onChain={openChain} />
    </TooltipProvider>
  )
}

function IconHero({
  entry,
  index,
  total,
  onCategory,
  chain,
  onMorph,
  viewfinder,
  search,
  ref,
}: {
  entry: YoujEntry
  index: number
  total: number
  onCategory: (category: string) => void
  /** The chain: off (null), or on. */
  chain: Chain | null
  /** Turns the chain on (the icon on stage is the first pick) or off. */
  onMorph: () => void
} & Pick<ComponentProps<typeof ShowroomHero>, 'viewfinder' | 'search' | 'ref'>) {
  const k = useYouj()
  const wide = useMediaQuery('(min-width: 64rem)')
  const roomy = useMediaQuery('(min-width: 40rem)')
  const [paused, setPaused] = useState(false)
  const { scheme, setScheme, mounted } = useStageScheme(entry.id)
  const [reduced, setReduced] = useState(false)
  const resting = reduced || k.reduced
  const [size, setSize] = useState(DEFAULT_SETTINGS.size)
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_SETTINGS.strokeWidth)
  const [ink, setInk] = useState<Ink>('default')
  const defaultTrigger: Trigger = entry.loops ? 'loop' : 'hover'
  const [trigger, setTrigger] = useState<Trigger>(defaultTrigger)
  const [manual, setManual] = useState<boolean | undefined>(undefined)
  const [pulse, setPulse] = useState(false)
  const [replay, setReplay] = useState(0)
  const [transition, setTransition] = useState<IconSwapTransition>('morph')
  const [direction, setDirection] = useState<IconSwapDirection | null>(null)
  const [previous, setPrevious] = useState(entry.id)
  if (previous !== entry.id) {
    setPrevious(entry.id)
    setTrigger(defaultTrigger)
    setManual(undefined)
    setPulse(false)
  }
  const state = entry.states
  const [code, setCode] = useState<{ open: boolean } | null>(null)
  const opener = useRef<HTMLElement | null>(null)

  // A new icon, or a replay, performs once a frame after it mounts (mounting already on would skip to the pose).
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new icon or a replay is the cue to perform again
  useEffect(() => {
    if (resting || trigger !== 'hover') return
    setPulse(false)
    const frame = requestAnimationFrame(() => setPulse(true))
    return () => cancelAnimationFrame(frame)
  }, [entry.id, replay, trigger, resting])
  useEffect(() => {
    if (!pulse) return
    const timer = setTimeout(() => setPulse(false), k.ms('deliberate') * 2)
    return () => clearTimeout(timer)
  }, [pulse, k])

  const stageSize = Math.round(size * 6)
  const active = manual ?? (pulse && trigger === 'hover' ? true : undefined)
  const playProps = active !== undefined ? { active } : { trigger }
  const chained = chain && chain.icons.length >= 2 ? chain.icons : null
  const n = chain ? chain.icons.length : 0
  const at = chain ? chain.step % Math.max(n, 1) : 0
  const directional = transition === 'slide' || transition === 'wipe'
  const options: SnippetOptions = chain
    ? { size, strokeWidth, ink, transition, direction }
    : { size, strokeWidth, ink, trigger: trigger === defaultTrigger ? undefined : trigger }

  const readout = resting
    ? 'Still · reduced motion'
    : state && manual !== undefined
      ? `Morph · ${state[manual ? 1 : 0]}`
      : trigger === 'loop'
        ? 'Animated · looping'
        : trigger === 'mount'
          ? 'Animated · on mount'
          : state
            ? `Morph · ${state[0]} to ${state[1]} on hover`
            : 'Animated · hover'

  return (
    <>
      <ShowroomHero
        ref={ref}
        viewfinder={viewfinder}
        columnClassName="lg:w-[11.5rem] xl:w-[12.5rem]"
        search={search}
        eyebrow="Icons"
        links={<PanelLink href="/docs/icons">Docs</PanelLink>}
        itemKey={entry.id}
        name={chain ? 'Chain' : entry.name}
        nameId="icon-name"
        announce={`${entry.name}, ${index} of ${total}`}
        byline={chain ? [`${n} ${n === 1 ? 'icon' : 'icons'}`, transition] : [
          <button key="category" type="button" onClick={() => onCategory(entry.category)} className="rounded-sm underline-offset-4 hover:underline focus-ring" aria-label={`${categoryLabel(entry.category)}: search the category`}>
            {categoryLabel(entry.category)}
          </button>,
          <code key="component" className="font-mono text-[12.5px]">
            {entry.component}
          </code>,
        ]}
        description={chain ? 'Icons morphing one into the next, round and round. Pick from the column to add one; pick one that’s in the chain to take it out; tap the stage for the next step.' : entry.description || undefined}
        stage={
          mounted && chain ? (
            <MorphStage chain={chain} card={wide} island={roomy} paused={paused} onPaused={setPaused} size={stageSize} strokeWidth={strokeWidth} resting={resting} transition={transition} direction={direction} ink={ink} />
          ) : mounted ? (
            <div className="absolute inset-0 grid place-items-center" style={ink === 'default' ? undefined : { color: inkColor(ink) }}>
              <span className={ink === 'default' ? 'text-fg' : undefined}>
                {resting ? (
                  <StaticGlyph nodes={entry.nodes} size={stageSize} strokeWidth={strokeWidth} />
                ) : (
                  <entry.Icon key={`${entry.id}-${replay}-${trigger}`} size={stageSize} strokeWidth={strokeWidth} {...playProps} />
                )}
              </span>
            </div>
          ) : null
        }
        readout={<StageReadout label="Status" value={chain ? (n >= 2 ? `Chain · ${at + 1} of ${n}` : n === 0 ? 'Chain · pick an icon' : 'Chain · pick another') : readout} state={state && !chain ? `${state[0]} / ${state[1]}` : undefined} live={!resting && trigger === 'loop'} />}
        scheme={scheme}
        onSchemeChange={setScheme}
        reduced={resting}
        onReducedChange={setReduced}
        toolbarLabel={`${chain ? 'Chain' : entry.name}: view`}
        copy={chained ? chainSnippet(chained, options) : reactSnippet(entry, options)}
        tool={
          <IslandButton label="Chain" tip={CHAIN_TIP} aria-pressed={chain !== null} onClick={onMorph} className="lg:hidden">
            <ShuffleIcon {...icon} />
          </IslandButton>
        }
        transport={
          <>
            <IslandButton
              label="Replay"
              disabled={resting}
              onClick={() => {
                setManual(undefined)
                setReplay((r) => r + 1)
              }}
            >
              <RefreshIcon {...icon} />
            </IslandButton>
            {state && (
              <IslandButton label={`Morph to ${state[1]}`} aria-pressed={manual === true} disabled={resting} onClick={() => setManual(!manual)}>
                <ShuffleIcon {...icon} />
              </IslandButton>
            )}
          </>
        }
        actions={
          <PanelActions
            onUse={(from) => {
              opener.current = from
              setCode({ open: true })
            }}
          />
        }
      >
        {chain && (!wide || !roomy) && (
          <div className="flex flex-col items-start gap-2">
            {!roomy && <ChainTools chain={chain} paused={paused} onPaused={setPaused} />}
            {!wide && <ChainCard chain={chain} className="w-full" />}
          </div>
        )}
        <PanelSection id="icon-style" title="Style">
          <Row label="Size" value={`${size} px`}>
            <Slider aria-label="Size" min={SIZE_RANGE.min} max={SIZE_RANGE.max} step={SIZE_RANGE.step} value={size} onValueChange={(v) => setSize(Array.isArray(v) ? v[0]! : v)} className="min-w-0 flex-1" />
          </Row>
          <Row label="Stroke" value={String(strokeWidth)}>
            <Slider aria-label="Stroke" min={STROKE_RANGE.min} max={STROKE_RANGE.max} step={STROKE_RANGE.step} value={strokeWidth} onValueChange={(v) => setStrokeWidth(Array.isArray(v) ? v[0]! : v)} className="min-w-0 flex-1" />
          </Row>
          <Row label="Color">
            <ColorControl ink={ink} onChange={setInk} wide />
          </Row>
        </PanelSection>
        {chain ? (
          <PanelSection id="icon-transition" title="Transition">
            <Row label="Type">
              <Select items={Object.fromEntries(TRANSITIONS.map((t) => [t.id, t.id]))} value={transition} onValueChange={(next) => next && setTransition(next as IconSwapTransition)}>
                <SelectTrigger size="sm" aria-label="Transition" className="w-full min-w-0 text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="min-w-(--anchor-width)">
                  {TRANSITIONS.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-[12.5px]">
                      {t.id}
                      <span className="ms-auto ps-4 text-[11.5px] text-fg-muted">{t.note}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Direction">
              <SegmentedControl
                aria-label="Direction"
                size="sm"
                disabled={!directional}
                value={direction ?? (transition === 'slide' ? 'up' : 'right')}
                onValueChange={(next) => setDirection(next as IconSwapDirection)}
                className="w-full"
              >
                {DIRECTIONS.map(({ id, Icon }) => (
                  <SegmentedControlItem key={id} value={id} aria-label={id} className="min-w-0 px-1.5">
                    <Icon size={14} strokeWidth={1.75} />
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </Row>
            <p className="text-[11.5px] leading-snug text-pretty text-fg-subtle">Capped at {MAX_CHAIN} in this demo. Your code can chain as many as you like.</p>
          </PanelSection>
        ) : (
          <PanelSection id="icon-motion" title="Motion">
            <Row label="Trigger">
              <SegmentedControl
                aria-label="Trigger"
                size="sm"
                value={trigger}
                onValueChange={(next) => {
                  setManual(undefined)
                  setTrigger(next as Trigger)
                }}
                className="w-full"
              >
                {(['hover', 'loop', 'mount'] as const).map((t) => (
                  <SegmentedControlItem key={t} value={t} className="min-w-0 px-1.5 text-[12.5px] capitalize">
                    {t}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </Row>
          </PanelSection>
        )}
      </ShowroomHero>
      {code && (
        <Suspense fallback={null}>
          <IconCodeDialog entry={entry} nodes={chained ? null : entry.nodes} chain={chained ?? undefined} options={options} open={code.open} onOpenChange={(open) => setCode({ open })} finalFocus={returnFocus(opener)} />
        </Suspense>
      )}
    </>
  )
}

/** The column beside the stage, for icons: four small tiles a row, scrolling, so many are in view to pick from; the one on stage keeps in view.
 * Chain at its head turns picking into building a chain of up to ten icons, numbered in order, for the stage to morph through. */
const IconColumn = memo(function IconColumn({
  entries,
  current,
  onSelect,
  morph,
  onToggle,
  onPick,
}: {
  entries: YoujEntry[]
  current: string
  onSelect: (id: string) => void
  morph: string[] | null
  onToggle: () => void
  onPick: (id: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const rtl = useDirection() === 'rtl'
  // The one tab stop: the tile on stage until the arrows move it.
  const [rove, setRove] = useState(current)
  const reveal = useCallback((id: string) => {
    const el = box.current
    const tile = el?.querySelector<HTMLElement>(`[data-id="${id}"]`)
    if (!el || !tile) return
    const t = tile.getBoundingClientRect()
    const b = el.getBoundingClientRect()
    // Kept clear of the box's edges and its fade, so the tile's ring is never cut or faded.
    if (t.top < b.top + 8 || t.bottom > b.bottom - 40) el.scrollTo({ top: el.scrollTop + (t.top - b.top) - el.clientHeight / 2 + t.height / 2 })
  }, [])
  useEffect(() => {
    setRove(current)
    reveal(current)
  }, [current, reveal])
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
    const from = entries.findIndex((x) => x.id === rove)
    const side = rtl ? -1 : 1
    const step = ({ ArrowRight: side, ArrowLeft: -side, ArrowDown: COLUMNS, ArrowUp: -COLUMNS } as Record<string, number | undefined>)[e.key]
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? entries.length - 1 : step === undefined ? -1 : Math.min(Math.max(from + step, 0), entries.length - 1)
    if (to < 0) return
    e.preventDefault()
    const id = entries[to]!.id
    setRove(id)
    box.current?.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus({ preventScroll: true })
    reveal(id)
  }
  const on = morph !== null
  return (
    <div className="flex h-full flex-col gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Chain"
              aria-pressed={on}
              onClick={onToggle}
              className={cn(
                'flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border text-[13px] font-medium transition-colors focus-ring',
                on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface text-fg hover:bg-band',
              )}
            />
          }
        >
          <ShuffleIcon size={15} strokeWidth={1.75} />
          Chain
          {on && (
            <span aria-hidden>
              · {morph.length}/{MAX_CHAIN}
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{CHAIN_TIP}</TooltipContent>
      </Tooltip>
      <div ref={box} role="listbox" aria-label="Icons" onKeyDown={onKeyDown} aria-multiselectable={on || undefined} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)] [scrollbar-width:none]">
        <div className="grid grid-cols-4 gap-1.5 p-2 pb-12">
          {entries.map((e) => {
            const n = on ? morph.indexOf(e.id) + 1 : 0
            const lit = on ? n > 0 : e.id === current
            return (
              <button
                key={e.id}
                type="button"
                role="option"
                data-id={e.id}
                tabIndex={e.id === rove ? 0 : -1}
                aria-selected={lit}
                aria-label={n ? `${e.name}, morph ${n}` : e.name}
                title={e.name}
                onClick={() => (on ? onPick(e.id) : onSelect(e.id))}
                className={cn(
                  'relative grid aspect-square place-items-center rounded-lg border bg-surface text-fg-muted transition-colors [content-visibility:auto] hover:text-fg',
                  lit ? 'border-accent text-fg ring-1 ring-accent' : 'border-line light:border-transparent light:bg-fg/[0.06] youj-allow-tint',
                )}
              >
                <StaticGlyph nodes={e.nodes} size={16} strokeWidth={1.5} />
                {n > 0 && (
                  <span aria-hidden className="absolute top-0.5 right-0.5 grid size-3.5 place-items-center rounded-[3px] bg-accent font-mono text-[9px] leading-none text-on-accent">
                    {n}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
})

/** The stage in the Chain: the chain's icons, one swap after another, round and round; a tap goes to the next step.
 * Under reduced motion it shows the icon at the step, still, and a tap steps without animation. */
function MorphStage({
  chain,
  card,
  island,
  paused,
  onPaused,
  size,
  strokeWidth,
  resting,
  transition,
  direction,
  ink,
}: {
  chain: Chain
  /** Draw the chain's card on the plate (from lg); below that it's under the plate. */
  card: boolean
  /** Draw the chain's island (pause, clear) at the plate's top center, from sm; below that it's under the plate. */
  island: boolean
  paused: boolean
  onPaused: (paused: boolean) => void
  size: number
  strokeWidth: number
  resting: boolean
  transition: IconSwapTransition
  direction: IconSwapDirection | null
  ink: Ink
}) {
  const k = useYouj()
  const { icons, step, onStep } = chain
  const n = icons.length
  const at = step % Math.max(n, 1)
  const [active, setActive] = useState(false)
  // A step that isn't this stage's own (a chip's jump) starts from rest.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new step is the cue to start from rest
  useEffect(() => setActive(false), [step])
  // At rest on step s: the swap to s + 1 starts after a beat, then the step moves on to it, which is that icon at rest.
  useEffect(() => {
    // Paused, it holds still on its step; a tap still takes the swap to the next one.
    if (n < 2 || resting || (paused && !active)) return
    const timers: ReturnType<typeof setTimeout>[] = []
    if (!active) timers.push(setTimeout(() => setActive(true), k.ms('deliberate') * 1.5))
    timers.push(
      setTimeout(
        () => {
          onStep((at + 1) % n)
          setActive(false)
        },
        active ? k.ms('deliberate') * 1.25 : k.ms('deliberate') * 2.5,
      ),
    )
    return () => timers.forEach(clearTimeout)
  }, [n, resting, paused, active, at, onStep, k])
  const next = () => (resting ? onStep((at + 1) % n) : setActive(true))
  return (
    <div className={cn('absolute inset-0 grid place-items-center', ink === 'default' && 'text-fg')} style={ink === 'default' ? undefined : { color: inkColor(ink) }}>
      {n < 2 ? (
        <div className="flex flex-col items-center gap-4 text-fg-muted">
          <div className="flex items-center gap-3">
            {[0, 1].map((i) => {
              const e = icons[i]
              return (
                <span key={i} data-slot="chain-slot" className={cn('relative grid size-24 place-items-center rounded-sm border-2 font-mono text-lg', e ? 'border-accent text-fg' : 'border-dashed border-line')}>
                  {e ? <StaticGlyph nodes={e.nodes} size={44} strokeWidth={1.5} /> : <span aria-hidden>{i + 1}</span>}
                  {e && <span className="absolute top-1.5 left-1.5 grid size-4 place-items-center rounded-[3px] bg-accent text-[10px] text-on-accent">{i + 1}</span>}
                </span>
              )
            })}
          </div>
          <p className="text-[13.5px]">Pick {n === 0 ? 'two icons' : 'a second icon'} from the column to morph through.</p>
        </div>
      ) : (
        <button type="button" aria-label={`Next step: ${icons[(at + 1) % n]!.name}`} onClick={next} className="rounded-2xl focus-ring">
          {resting ? (
            <StaticGlyph nodes={icons[at]!.nodes} size={size} strokeWidth={strokeWidth} />
          ) : (
            <IconSwap
              key={`${at}~${transition}~${icons[at]!.id}~${icons[(at + 1) % n]!.id}`}
              from={icons[at]!.Icon}
              to={icons[(at + 1) % n]!.Icon}
              transition={transition}
              direction={direction ?? undefined}
              active={active}
              size={size}
              strokeWidth={strokeWidth}
            />
          )}
        </button>
      )}
      {island && <ChainTools chain={chain} paused={paused} onPaused={onPaused} className="absolute start-1/2 top-3 z-10 -translate-x-1/2" />}
      {card && <ChainCard chain={chain} className="absolute end-3 bottom-3 z-10 w-[12rem]" />}
    </div>
  )
}

/** The chain's island: pause or play the loop (a tap on the stage still steps), and clear the chain. The stage toolbar's chrome. */
function ChainTools({ chain, paused, onPaused, className }: { chain: Chain; paused: boolean; onPaused: (paused: boolean) => void; className?: string }) {
  return (
    <Toolbar aria-label="Chain" data-stage-keys="" className={cn('flex items-center gap-0.5 rounded-[10px] p-[3px] [&_button[data-disabled]]:opacity-40', className)}>
      <IslandButton label={paused ? 'Play' : 'Pause'} disabled={chain.icons.length < 2} onClick={() => onPaused(!paused)}>
        <PlayIcon {...icon} active={!paused} />
      </IslandButton>
      <IslandButton label="Clear" disabled={chain.icons.length === 0} onClick={chain.onClear}>
        <TrashIcon {...icon} />
      </IslandButton>
    </Toolbar>
  )
}

/** The chain as a small card, only its rows: on the stage's plate in the bottom corner from lg, under it below. The data table's column list (grip, number, glyph, name, ×), scrolling inside. The playing step is lit; a row jumps to its step and puts the insertion line after it; the empty space under the rows, or Escape on a row, puts the line back at the end. */
function ChainCard({ chain, className }: { chain: Chain; className?: string }) {
  const { icons, at, step, onJump, onRemove, onReorder, onEnd } = chain
  const playing = icons.length >= 2 ? step % icons.length : -1
  return (
    <section
      aria-label="Chain"
      onKeyDown={(e) => e.key === 'Escape' && !e.defaultPrevented && onEnd()}
      className={cn('flex flex-col rounded-[6px] border border-line bg-chrome-float p-1.5 pb-0 text-fg shadow-xs backdrop-blur-sm', className)}
    >
      <div className="min-h-0">
        {icons.length === 0 ? (
          <p className="p-2 text-[12.5px] text-fg-muted">Pick icons from the column.</p>
        ) : (
          <SortableList aria-label="Chain" value={icons.map((e) => e.id)} onValueChange={onReorder} className="gap-0.5">
            {icons.map((e, i) => (
              <SortableListItem
                key={e.id}
                value={e.id}
                textValue={e.name}
                className={cn('min-h-8 own:rounded-sm own:border-transparent own:py-0.5 own:ps-0.5 own:pe-0.5 hover:bg-hover', i === playing ? 'own:bg-accent-subtle' : 'own:bg-transparent')}
              >
                {at === i && <span aria-hidden data-caret="" className="pointer-events-none absolute inset-x-0 -top-[2px] h-0.5 bg-accent" />}
                <SortableListHandle />
                <button type="button" aria-label={`${i + 1}. ${e.name}`} aria-current={i === playing ? 'step' : undefined} onClick={() => onJump(i)} className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-start focus-ring">
                  <span className={cn('grid size-5 shrink-0 place-items-center rounded-sm font-mono text-[11px] tabular-nums', i === playing ? 'bg-accent text-on-accent' : 'bg-band text-fg-muted')}>{i + 1}</span>
                  <StaticGlyph nodes={e.nodes} size={16} strokeWidth={1.75} />
                  <span className="min-w-0 truncate text-[12.5px]">{e.name}</span>
                </button>
                <button type="button" aria-label={`Remove ${e.name}`} onClick={() => onRemove(i)} className="grid size-6 shrink-0 place-items-center rounded-sm text-fg-muted hover:text-fg focus-ring">
                  <XIcon size={13} strokeWidth={2} />
                </button>
              </SortableListItem>
            ))}
          </SortableList>
        )}
        {/* The empty space under the rows: a click here puts the insertion line back at the end. */}
        <div data-slot="chain-end" className="h-1.5 shrink-0" onClick={onEnd} />
      </div>
    </section>
  )
}
