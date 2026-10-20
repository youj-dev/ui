'use client'

import { Fragment, lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react'
import Link from 'next/link'
import { CodeIcon, CopyIcon, GaugeIcon, MaximizeIcon, MinimizeIcon, ThemeIcon } from '@youj/icons'
import { Button, Popover, PopoverClose, PopoverContent, PopoverTrigger, Toolbar, ToolbarButton } from '@youj/react'
import { IslandButton, IslandSeparator, islandButton } from '@/components/explorer/island'
import { Stage } from '@/components/site/stage'
import { cn } from '@/lib/cn'
import type { BackdropId } from '@/lib/backdrops'
import { useSiteTheme } from '@/lib/site-theme'
import { useMediaQuery } from '@/lib/use-media-query'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import type { Scheme } from './hooks'
import type { ViewfinderPresentation } from './presentation'
import type { ViewfinderOrientation } from './viewfinder'
import { copyToast } from '@/lib/copy-toast'

const BackdropLayer = lazy(() => import('@/components/docs/backdrop-layer').then((m) => ({ default: m.BackdropLayer })))

/* A showroom's hero: one item on show, live and large, on a stage with its panel beside it (the panel's words above the
 * stage on a narrow screen, its controls and actions below). The stage is a plate (a Stage in its own light or dark), so
 * a frame's edges never show, on a faint drafting grid with the accent's light under it and registration marks at its corners.
 * What's on it is the area's (`stage`: a frame, a component, a composition), filling the plate. Across the plate's top
 * run what it's doing (`readout`, printed at the start corner in the stage's ink), Raw or In context where the area has
 * a context (`view`, at the middle) and its toolbar (the end corner): the area's playback (`transport`), then the view
 * (light or dark, reduced motion, the area's own `tool`, fullscreen), then what you take away (`keys`, Copy code).
 *
 * The panel is one grammar for every area, read top to bottom:
 * - the header, what it is: the area's name (the page's h1) with quiet `links` at its end, the item's name (an h2
 *   focus can land on), its `byline`, its `description` (a few lines, the rest a press away) and a `meta` line (its
 *   spec, its tags). It fades in with each item (`itemKey`), and `announce` is said as the item changes.
 * - its controls (`children`: PanelSections), and under them the actions (`actions`: PanelActions, Use it and Copy
 *   code). Both sit at the foot, the actions on the plate's bottom edge, so stepping through items never moves them:
 *   only the header changes length, into the room between.
 * The area's `viewfinder` stands in a column beside the stage from lg (`presentation="column"`) or floats as an island
 * on the plate's lower edge (`island`), and runs as a row under it on narrower screens; a `bar` is the area's own, in
 * its explorer, so the hero draws none. */

/** The floating chrome the stage's controls sit on: the kit's Toolbar's, a little tighter. */
const FLOAT = 'rounded-[10px] p-[3px]'

/** What the stage shows: the item on its own (`raw`), or set in a realistic screen it would live in (`context`). */
export type StageView = 'raw' | 'context'

const icon = { size: 15, strokeWidth: 1.75 } as const

export interface ShowroomHeroProps {
  /** The area's name, the page's h1: `Miniatures`. */
  eyebrow: ReactNode
  /** Quiet links at the end of the area's name, to the area's other pages: `Docs`, a builder (PanelLinks). */
  links?: ReactNode
  /** The item on show: what the header says fades in again when this changes. */
  itemKey: string
  /** The item's name, an h2 with this id (the section's label, and where a card's pick lands focus). */
  name: ReactNode
  nameId: string
  /** Classes for the item's words (name, byline, description, meta): hidden while the page reads a link, say. */
  itemClassName?: string
  /** Said (politely) as the item changes, since a step leaves focus where it was: `Espresso machine, 3 of 62`. */
  announce: string
  /** The line under the name, its parts joined by a dot, the first set strong: a category and an export, a model and a study. */
  byline?: readonly ReactNode[]
  /** What it is, in a few sentences: a few lines show, and More opens the rest over the panel. */
  description?: string
  /** One more line under the description: a spec, the tags. */
  meta?: ReactNode
  /** What's on show, filling the plate. */
  stage: ReactNode
  /** The plate's ground: `dots` (the default, a dotted field clear under the middle in Raw) or `paper` (the warm cream plate). */
  ground?: 'dots' | 'paper'
  /** The site's own look (no theme picked): the docs previews' aurora on the plate, with frosted keys, instead of the dotted field. */
  siteLook?: boolean
  /** A picked mood's backdrop behind the plate, as a block preview shows it (lib/backdrops `backdropForPreset`). Wins over `siteLook`. */
  backdrop?: BackdropId | null
  /** What it's doing, at the plate's top start corner: a StageReadout (a leaf of its own when it changes often). */
  readout?: ReactNode
  /** The stage's light or dark (useStageScheme), and its switch. */
  scheme: Scheme
  onSchemeChange: (scheme: Scheme) => void
  /** The stage's reduced motion, and its switch. */
  reduced: boolean
  onReducedChange: (reduced: boolean) => void
  /**
   * Raw or In context, for an area whose items have a context to be shown in (a loading screen, an empty state): the
   * stage's two views as segments leading its toolbar. Leave it out for an area without one.
   */
  view?: StageView
  onViewChange?: (view: StageView) => void
  /** The area's playback on the stage's toolbar (IslandButtons: replay, hold, speed), ahead of the view's controls. */
  transport?: ReactNode
  /** One more of the area's own icons on the stage's toolbar (an IslandButton), before Fullscreen. */
  tool?: ReactNode
  /** The code Copy code copies (the import and the item as it's set on the page): an icon at the toolbar's end. */
  copy?: string
  /**
   * What can be pressed, as one more icon in the toolbar's end group, beside Copy code: an IslandButton that opens the
   * area's keys (a popover; a sheet on touch). The stage itself stays clear of them.
   */
  keys?: ReactNode
  /** The stage toolbar's accessible name: `Espresso machine: view`. */
  toolbarLabel: string
  /**
   * The area's viewfinder (a ViewfinderStrip) in the orientation asked for: a column beside the stage from lg, a row
   * under it on narrower screens. It's drawn in the browser only, once the width is known (both places hold their
   * space on the server's page, so nothing shifts): a strip is hundreds of thumbnails the page's HTML needn't carry.
   */
  viewfinder?: (orientation: ViewfinderOrientation) => ReactNode
  /**
   * Where the viewfinder stands from lg: `column` (the default) beside the stage, or `island`, a glass pill floating on
   * the plate's lower edge, mostly under it, so the stage keeps the full width and its subject stays clear. `bar`: the
   * area keeps it in its explorer (a ViewfinderBar), and the hero draws none.
   */
  presentation?: ViewfinderPresentation
  /** The column's width from lg, for an area whose column holds more (icons: four small tiles a row). */
  columnClassName?: string
  /** The area's search (a ShowroomSearch) in the placement asked for: a companion island beside the island, or at the end of the row under the stage. */
  search?: (placement: 'island' | 'row') => ReactNode
  /** The panel's controls: PanelSections, over the actions. */
  children?: ReactNode
  /** The panel's foot: PanelActions. */
  actions?: ReactNode
  ref?: Ref<HTMLElement>
}

export function ShowroomHero({
  eyebrow,
  links,
  itemKey,
  name,
  nameId,
  itemClassName,
  announce,
  byline,
  description,
  meta,
  stage,
  ground = 'dots',
  siteLook,
  backdrop,
  readout,
  scheme,
  onSchemeChange,
  reduced,
  onReducedChange,
  view,
  onViewChange,
  transport,
  tool,
  copy,
  keys,
  toolbarLabel,
  viewfinder: strip,
  presentation = 'column',
  columnClassName,
  search,
  children,
  actions,
  ref,
}: ShowroomHeroProps) {
  const viewfinder = presentation === 'bar' ? undefined : strip
  const island = Boolean(viewfinder) && presentation === 'island'
  const site = useSiteTheme()
  const wide = useMedia(WIDE)
  // From sm the view switch leads the toolbar; on a phone, where the toolbar takes the paper's top, it sits under the
  // plate beside the readout. Until the width is known (the server's page) both are drawn, one shown by CSS.
  const roomy = useMedia(ROOMY)
  const plate = useRef<HTMLDivElement>(null)
  // The aurora or a mood's backdrop runs behind the plate (the docs previews' look, styles/site.css), so the dotted field steps aside.
  // Raw is plain: the item on the dotted field alone, no aurora or backdrop.
  const shownBackdrop = view === 'raw' ? null : backdrop
  const aurora = Boolean(siteLook) && !shownBackdrop && view !== 'raw'
  const dotted = ground === 'dots' && !aurora && !shownBackdrop
  const frameFocus = useFrameFocus(plate)
  // The toolbar's width, as a CSS variable the readout keeps clear of (it truncates rather than run under the toolbar).
  const column = useRef<HTMLDivElement>(null)
  const tools = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const bar = tools.current
    const box = column.current
    if (!bar || !box) return
    const set = () => box.style.setProperty('--stage-tools', `${bar.offsetWidth}px`)
    set()
    const observer = new ResizeObserver(set)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  const [full, setFull] = useState(false)
  useEffect(() => {
    const onChange = () => setFull(Boolean(document.fullscreenElement) && document.fullscreenElement === plate.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void plate.current?.requestFullscreen?.()
  }
  const canFullscreen = site.mounted && document.fullscreenEnabled

  return (
    <section ref={ref} aria-labelledby={nameId} className="relative isolate overflow-x-clip">
      <div
        className={cn(
          'gutter mx-auto grid max-w-[110rem] gap-x-10 gap-y-6 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:grid-rows-[auto_minmax(0,1fr)] lg:pt-8 lg:pb-12 xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-x-14',
          // The island's room under the plate is most of the page's foot: the hero and its island make one screen.
          island && 'lg:pb-6',
        )}
      >
        {/* The panel's header: what it is. */}
        <header className="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-1">
          <div className="flex h-8 min-w-0 items-center gap-3">
            <h1 className="flex min-w-0 items-center gap-2 type-label text-fg-muted">
              <span aria-hidden className="particle size-[5px]" />
              {eyebrow}
            </h1>
            <p aria-live="polite" className="sr-only">
              {announce}
            </p>
            {links && <div className="ms-auto flex shrink-0 items-center gap-4">{links}</div>}
          </div>
          {/* The heading stays put (focus can rest on it as the item changes); what it says fades in with each item. */}
          <div className="flex min-w-0 flex-col gap-2">
            <h2 id={nameId} tabIndex={-1} className="type-title text-fg outline-none">
              <span key={itemKey} className={cn('swap-in block', itemClassName)}>
                {name}
              </span>
            </h2>
            {byline && byline.length > 0 && (
              <p key={`${itemKey}:byline`} className={cn('swap-in flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] leading-5', itemClassName)}>
                {byline.map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 && (
                      <span aria-hidden className="text-fg-subtle">
                        ·
                      </span>
                    )}
                    <span className={i === 0 ? 'font-medium text-fg' : 'min-w-0 truncate text-fg-muted'}>{part}</span>
                  </Fragment>
                ))}
              </p>
            )}
          </div>
          {description && <Description key={`${itemKey}:description`} text={description} className={itemClassName} />}
          {meta && (
            <div key={`${itemKey}:meta`} className={cn('swap-in flex min-w-0 flex-col gap-2', itemClassName)}>
              {meta}
            </div>
          )}
        </header>

        {/* The stage: the paper plate, on a drafting grid that runs on past its edges and fades out, with the
            construction frame's registration marks at its corners and the accent's light under it. */}
        {/* An island hangs under the plate: the room it takes there is the stage's, held from the server's page on. */}
        <div className={cn('flex min-w-0 gap-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 xl:gap-6', island && 'lg:pb-[3.75rem]')}>
          {/* The column takes the stage's height and adds none of its own. */}
          {viewfinder && !island && (
            <div className={cn('relative hidden w-[7.25rem] shrink-0 lg:block xl:w-32', columnClassName)}>
              {wide && <div className="absolute inset-0">{viewfinder('vertical')}</div>}
            </div>
          )}
          <div ref={column} className="relative min-w-0 flex-1">
            {/* The plate's own box: its grid, its light and its marks keep to it when a caption runs under it. */}
            <div className="relative lg:h-full">
              <div aria-hidden className="pointer-events-none absolute -inset-8 -z-10 blueprint [mask-image:radial-gradient(closest-side,transparent_62%,black_82%,transparent)] sm:-inset-12" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[4%] top-[45%] -bottom-[6%] -z-10 rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_16%,transparent),transparent)] blur-2xl sm:-bottom-[14%] light:bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent)]"
              />
              <Marks />
              {/* Until the page is mounted the plate follows the site's mode, so a light visit never flashes a dark plate. */}
              <Stage
                ref={plate}
                mode={site.mounted ? scheme : undefined}
                data-scheme={scheme}
                data-frame-focus={frameFocus || undefined}
                data-plate={aurora ? 'aurora' : ground}
                data-preview-panel=""
                data-site-look={aurora || undefined}
                data-backdrop={shownBackdrop ?? undefined}
                className={cn(
                  'relative isolate h-[min(calc(100vw-2*var(--gutter)),68svh)] min-h-72 overflow-hidden rounded-2xl border border-line',
                  'sm:h-[clamp(24rem,62svh,40rem)] lg:h-full',
                  // An island's room under the plate comes out of the plate, so the island still shows in the first screen.
                  island ? 'lg:min-h-[clamp(26rem,calc(100dvh-var(--header-height)-7.25rem),56rem)]' : 'lg:min-h-[clamp(26rem,calc(100dvh-var(--header-height)-9rem),56rem)]',
                  // A frame on the stage has focus (its document takes the keys, ← and → too): a thin accent ring says so.
                  'outline-[1.5px] outline-offset-[3px] outline-transparent outline-solid transition-[outline-color] duration-(--yj-duration-fast) ease-standard data-frame-focus:outline-[color-mix(in_oklab,var(--color-accent)_55%,transparent)]',
                  '[&:fullscreen]:rounded-none [&:fullscreen]:border-0',
                )}
              >
                {/* Raw: the item alone on a dotted plate, the dots clear under the middle where the item stands. */}
                {shownBackdrop && (
                  <Suspense fallback={null}>
                    <BackdropLayer id={shownBackdrop} live={!reduced} className="-z-10" />
                  </Suspense>
                )}
                {dotted && <div aria-hidden className="dot-grid dots-edge pointer-events-none absolute inset-0 -z-10" />}
                {stage}
                {/* What it's doing, on the plate's top start corner from sm, level with the toolbar, in the stage's ink, clear
                    of the toolbar however wide it is (and of the view's toggle where there's one: its middle, less half its
                    9rem and a gap). On a phone it's a caption under the plate. */}
                {readout && roomy !== false && (
                  <div
                    className={cn(
                      'pointer-events-none absolute start-4 top-3.5 z-10 hidden min-w-0 sm:block',
                      view ? 'max-w-[min(24rem,calc(min(50%,100%-var(--stage-tools,14rem)-5.75rem)-6.25rem))]' : 'max-w-[min(24rem,calc(100%-var(--stage-tools,12rem)-3rem))]',
                    )}
                  >
                    {readout}
                  </div>
                )}
                {/* The view's controls, on the plate itself (so fullscreen keeps them), in the stage's light or dark; one that's on (reduced motion, held) is selected. */}
                <Toolbar ref={tools} aria-label={toolbarLabel} data-stage-keys="" className={cn('absolute end-2.5 top-2.5 z-10 flex items-center gap-0.5 sm:end-3 sm:top-3', FLOAT, '[&_button[aria-pressed=true]]:bg-selected [&_button[aria-pressed=true]]:text-fg [&_button[data-disabled]]:opacity-40')}>
                  {transport && (
                    <>
                      {transport}
                      <IslandSeparator />
                    </>
                  )}
                  <IslandButton label={scheme === 'dark' ? 'Show it on light' : 'Show it on dark'} onClick={() => onSchemeChange(scheme === 'dark' ? 'light' : 'dark')}>
                    <ThemeIcon {...icon} active={scheme === 'dark'} />
                  </IslandButton>
                  <IslandButton label="Reduced motion" aria-pressed={reduced} onClick={() => onReducedChange(!reduced)}>
                    <GaugeIcon {...icon} />
                  </IslandButton>
                  {tool}
                  {canFullscreen && (
                    <IslandButton label={full ? 'Exit fullscreen' : 'Fullscreen'} onClick={fullscreen}>
                      {full ? <MinimizeIcon {...icon} /> : <MaximizeIcon {...icon} />}
                    </IslandButton>
                  )}
                  {/* What you take away, apart from how you view it: the keys, and the code. */}
                  {(keys || copy !== undefined) && (
                    <>
                      <IslandSeparator />
                      {keys}
                      {/* Keyed on what it copies, so a new item or a new setting never inherits "Copied". */}
                      {copy !== undefined && <CopyCode key={copy} code={copy} />}
                    </>
                  )}
                </Toolbar>
                {/* Raw | In context, a control of its own at the top's middle, level with the toolbar; shifted toward the
                    start, if it must, to stay clear of the toolbar. Under the plate on a phone. */}
                {view && onViewChange && roomy !== false && (
                  <div className="absolute top-2.5 z-10 hidden -translate-x-1/2 [inset-inline-start:min(50%,calc(100%-var(--stage-tools,14rem)-5.75rem))] sm:top-3 sm:block rtl:translate-x-1/2">
                    <ViewSwitch view={view} onChange={onViewChange} tone="paper" />
                  </div>
                )}
              </Stage>
            </div>
            {/* On a phone, where the toolbar takes the plate's whole top: what it's doing as a caption under the plate, in
                the page's ink, with the view switch at its end. */}
            {roomy !== true && (readout || (view && onViewChange)) && (
              <div className="mt-3 flex min-w-0 items-start gap-3 sm:hidden">
                {readout && <div className="pointer-events-none min-w-0 flex-1">{readout}</div>}
                {view && onViewChange && <ViewSwitch view={view} onChange={onViewChange} tone="page" className="ms-auto" />}
              </div>
            )}
            {/* The island: centred on the plate's lower edge, a third of it on the paper, clear of the stage's subject. */}
            {island && (
              <div className="absolute inset-x-0 bottom-0 z-20 hidden translate-y-[calc(100%-1.75rem)] justify-center px-6 lg:flex">
                {wide && (
                  // The dock the search's panel rises from, as wide as it.
                  <div data-showroom-dock="" className={cn('flex w-full min-w-0 gap-2', search ? 'max-w-[51rem]' : 'max-w-[46rem]')}>
                    <div className="min-w-0 flex-1">{viewfinder!('island')}</div>
                    {search?.('island')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {viewfinder && (
          <div data-showroom-dock="" className="flex min-h-[calc(var(--spacing-control-lg)+12px)] min-w-0 items-center gap-2 lg:hidden">
            {wide === false && (
              <>
                <div className="min-w-0 flex-1">{viewfinder('horizontal')}</div>
                {search?.('row')}
              </>
            )}
          </div>
        )}

        {/* The panel's foot: its controls, then its actions, on the plate's bottom edge (the island's room is the stage's, not the panel's). */}
        {(children || actions) && (
          <div data-slot="showroom-dock" className={cn('flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-2 lg:justify-end', island && 'lg:pb-[3.75rem]')}>
            {children}
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}

/** The hero's three columns' width (Tailwind's lg), and the width from which the stage's toolbar has room for the view switch (sm). */
const WIDE = '(min-width: 64rem)'
const ROOMY = '(min-width: 40rem)'

/** Whether a media query matches: true or false once known, null on the server and while hydrating. */
const useMedia = (media: string) => useMediaQuery(media, null)

/** The room the whole description's card keeps around its text, px: its padding and its border. */
const PAD = 13

/**
 * The description: three lines on a narrow or short screen, four from lg. Cut short, it ends in More, which lays the whole of
 * it over the panel on a card, its text exactly over the lines it continues (a popover, a sheet on touch), so reading
 * it never pushes the page down; Less, Escape or a press outside put it away.
 */
function Description({ text, className }: { text: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const paragraph = useRef<HTMLParagraphElement>(null)
  const [cut, setCut] = useState(false)
  useLayoutEffect(() => {
    const el = paragraph.current
    if (!el) return
    const measure = () => setCut(el.scrollHeight - el.clientHeight > 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])
  const words = 'text-[13.5px] leading-[1.6] text-pretty text-fg-muted'
  return (
    <div ref={box} className={cn('swap-in relative min-w-0', className)}>
      <p ref={paragraph} className={cn(words, 'line-clamp-3 lg:line-clamp-4 lg:[@media(max-height:60rem)]:line-clamp-3')}>
        {text}
      </p>
      {cut && (
        <Popover>
          {/* Over the last line's end, on the page's own color, so the cut reads as a pause rather than a crop. */}
          <PopoverTrigger
            render={
              <button
                type="button"
                className="absolute end-0 bottom-0 rounded-sm bg-[linear-gradient(to_right,transparent,var(--color-canvas)_2.5rem)] ps-12 text-[13.5px] leading-[1.6] font-medium text-fg underline-offset-4 hover:underline focus-ring rtl:bg-[linear-gradient(to_left,transparent,var(--color-canvas)_2.5rem)]"
              />
            }
          >
            More
          </PopoverTrigger>
          <PopoverContent
            anchor={box}
            align="center"
            sideOffset={({ anchor }) => -anchor.height - PAD}
            aria-label="The whole description"
            className="w-[calc(var(--anchor-width)+26px)] max-w-[calc(100vw-1rem)] gap-0 p-3"
          >
            <p className={words}>
              {text}{' '}
              <PopoverClose render={<button type="button" className="rounded-sm font-medium text-fg underline-offset-4 hover:underline focus-ring" />}>Less</PopoverClose>
            </p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

/** A quiet link in the header, beside the area's name: to its docs, its builder. */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      prefetch={false}
      href={href}
      className="rounded-sm text-[13px] leading-5 text-fg-muted underline-offset-4 transition-colors duration-(--yj-duration-fast) ease-standard hover:text-fg hover:underline focus-ring"
    >
      {children}
    </Link>
  )
}

/**
 * A titled group of the panel's controls (Keys, Theme, Size & loop, Label), with a note or a control at its title's
 * end. Its rows keep one pitch: a row the controls' height, a small step between rows, a larger one between groups.
 */
export function PanelSection({ id, title, end, children }: { id: string; title: ReactNode; end?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-1.5">
      <div className="flex h-6 min-w-0 items-center justify-between gap-3">
        <h3 id={id} className="shrink-0 type-label">
          {title}
        </h3>
        {end}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">{children}</div>
    </section>
  )
}

/** A quiet note at a section title's end: what its settings reach. */
export function PanelNote({ children }: { children: ReactNode }) {
  return <span className="min-w-0 truncate text-[11.5px] text-fg-subtle">{children}</span>
}

/**
 * One row of a section, on the panel's grid: its name, the control, and the control's value at the end. Every row is
 * the controls' height (32px, 40 on touch) whatever it holds, so a slider's row and a menu's row keep the same pitch,
 * and a field never grows into its neighbours (a longer edit opens over the panel). Without a value the control takes
 * the value's room too, so every boxed control ends on the same edge.
 */
export function PanelRow({ label, value, children }: { label: string; value?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid h-control-sm min-w-0 grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-3">
      <span className="truncate text-[12.5px] leading-none text-fg-muted">{label}</span>
      <div className={cn('flex h-full min-w-0 items-center', value === undefined && 'col-span-2')}>{children}</div>
      {/* A value reads as code does, left to right, whichever way the page runs. */}
      {value !== undefined && (
        <span dir={typeof value === 'string' ? 'ltr' : undefined} className="flex min-w-[3.25rem] justify-end text-end font-mono text-[12px] leading-none text-fg tabular-nums">
          {value}
        </span>
      )}
    </div>
  )
}

/**
 * The panel's action, the same in every area: Use it, the panel's whole width, which opens the large code modal (how
 * to install it, import it or copy it in, its props, its files). Copying the code is the stage toolbar's (`copy`).
 */
export function PanelActions({ onUse }: { onUse: (opener: HTMLElement) => void }) {
  return (
    <Button className="w-full min-w-0" onClick={(e) => onUse(e.currentTarget)}>
      <CodeIcon {...icon} />
      Use it
    </Button>
  )
}

/** Copy code on the stage's toolbar: the copy icon writes its check and says Copied (an error says so), then rests. */
function CopyCode({ code }: { code: string }) {
  const cue = useSoundCue()
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setState('copied')
      cue('success')
      copyToast('Code copied')
    } catch {
      setState('failed')
      cue('error')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 1600)
  }
  return (
    <IslandButton label={state === 'copied' ? 'Copied' : state === 'failed' ? 'Couldn’t copy' : 'Copy code'} onClick={() => void copy()}>
      <CopyIcon {...icon} active={state === 'copied'} />
      <span aria-live="polite" className="sr-only">
        {state === 'copied' ? 'Code copied' : state === 'failed' ? 'The code couldn’t be copied' : ''}
      </span>
    </IslandButton>
  )
}

const VIEWS: { value: StageView; label: string }[] = [
  { value: 'raw', label: 'Raw' },
  { value: 'context', label: 'Context' },
]

/**
 * The stage's two views as segments: Raw, the item alone on the paper, and In context, the item in a screen it would
 * live in. On the plate (`paper`) in the stage's own light or dark, at the top's middle on the toolbar's chrome; under the
 * plate on a phone (`page`), in the page's. The key glides between the two halves on the CSS spring and turns round from
 * wherever it is if the choice changes mid-way; under reduced motion it jumps. CSS alone: a page without a context
 * (miniatures) loads none of it.
 */
function ViewSwitch({ view, onChange, tone, className }: { view: StageView; onChange: (view: StageView) => void; tone: 'paper' | 'page'; className?: string }) {
  return (
    <Toolbar aria-label="View" data-stage-keys="" className={cn('flex shrink-0 items-center gap-1', '[&_button[aria-pressed=true]]:bg-selected [&_button[aria-pressed=true]]:text-fg', className)}>
      {VIEWS.map((v) => (
        <ToolbarButton
          key={v.value}
          aria-pressed={view === v.value}
          onClick={() => onChange(v.value)}
          className={cn(islandButton, 'w-[4.25rem] px-0 text-[11.5px] font-medium whitespace-nowrap', tone === 'page' && 'w-20')}
        >
          {v.label}
        </ToolbarButton>
      ))}
    </Toolbar>
  )
}

/**
 * What the item is doing: a value (a readout, a state) and a line on it, the particle lit while it's live. The hero
 * prints it on the paper's top start corner in the stage's own ink (a caption under the plate on a phone, in the
 * page's). Named for assistive tech, never announced: it can change many times a second.
 */
export function StageReadout({ label, value, state, live = false, loading = false }: { label: string; value: ReactNode; state?: ReactNode; live?: boolean; loading?: boolean }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-col gap-0.5 select-none">
      <p className="truncate font-mono text-[12.5px] leading-[18px] font-medium text-fg tabular-nums">{value || '—'}</p>
      <p className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] leading-[14px] tracking-[0.08em] text-fg-muted uppercase">
        <span aria-hidden className={cn('particle size-[5px]', !live && 'opacity-40')} />
        <span className="truncate">{state || (loading ? 'Loading' : '')}</span>
      </p>
    </div>
  )
}

/** True while focus is in a frame on the stage: a frame's focus doesn't show to CSS here, so it's read from the page's events. */
function useFrameFocus(stage: RefObject<HTMLElement | null>) {
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    let timer = 0
    // Focus going into a frame blurs this window (the frame is the active element once it has); coming back, it moves in this document.
    const check = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setFocused(document.activeElement instanceof HTMLIFrameElement && Boolean(stage.current?.contains(document.activeElement))))
    }
    window.addEventListener('blur', check)
    window.addEventListener('focus', check)
    document.addEventListener('focusin', check)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('blur', check)
      window.removeEventListener('focus', check)
      document.removeEventListener('focusin', check)
    }
  }, [stage])
  return focused
}

/** Registration marks at the plate's four corners, as the site's frame sets them where its rules meet the rails. */
function Marks() {
  const mark =
    'absolute size-[11px] [background:linear-gradient(var(--color-line-strong),var(--color-line-strong))_center/1px_100%_no-repeat,linear-gradient(var(--color-line-strong),var(--color-line-strong))_center/100%_1px_no-repeat]'
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-[6px] z-10">
      <span className={cn(mark, 'start-0 top-0')} />
      <span className={cn(mark, 'end-0 top-0')} />
      <span className={cn(mark, 'start-0 bottom-0')} />
      <span className={cn(mark, 'end-0 bottom-0')} />
    </div>
  )
}
