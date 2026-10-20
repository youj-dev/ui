'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { DEFAULT_STYLE, type StyleId } from '@youj/core/lib/youj/theme'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { ArrowRightIcon, BookOpenIcon } from '@youj/icons'
import { ExportCommand } from '@/components/ui/code-export-dialog'
import { cn } from '@/lib/cn'
import type { FrameState } from '@/lib/frame-sync'
import type { Level } from '@/lib/taxonomy'
import { DEFAULT_PREVIEW_MOTION, defaultSize, modePreset, type PreviewMotion } from '@/lib/preview'
import { usePreviewSize } from '@/lib/preview-size'
import { DEVICE_WIDTH, MotionSizeTile, PreviewIsland, type IslandDevice, type IslandView } from './preview-island'
import type { ViewerEntry } from './viewer-entry'
import { attach, detach, go, reload, setDir, setLook, setTitle, useFramePainted } from './viewer-frame'
import { fitScale, ZOOMS, type Zoom } from './zoom'

/* What the full-page preview (./full-preview, an item's /view page opened on its
 * own) is made of: the stage with
 * the one live frame (./viewer-frame) at a device's width and a zoom, the
 * Code and Info screens, the state the island drives (named in the address,
 * so a view is a link) and the island itself (./preview-island). */

/** The address's names for what's on show: `tab=code|info`, `story`, `device`, `zoom`. */
export const PARAMS = { tab: 'tab', story: 'story', device: 'device', zoom: 'zoom' } as const

const DEVICES: IslandDevice[] = ['desktop', 'tablet', 'mobile']

/** A component opens at its own size; a card, section or screen is fitted to the stage. */
export const defaultZoom = (basic: boolean): Zoom => (basic ? '100' : 'fit')

/** The /view page an item's frame loads: its story, when not its first. */
export function viewerSrc(key: string, story?: string) {
  return `/view/${key}${story ? `?story=${encodeURIComponent(story)}` : ''}`
}

function read() {
  const params = new URLSearchParams(window.location.search)
  const tab = params.get(PARAMS.tab)
  const device = params.get(PARAMS.device)
  const zoom = params.get(PARAMS.zoom)
  return {
    view: (tab === 'code' || tab === 'info' ? tab : 'preview') as IslandView,
    story: params.get(PARAMS.story) ?? undefined,
    device: (DEVICES.includes(device as IslandDevice) ? device : 'desktop') as IslandDevice,
    zoom: ZOOMS.includes(zoom as Zoom) ? (zoom as Zoom) : null,
  }
}

/** Writes what's on show into the address, in place: a default leaves its name out. */
export function writeParams(next: { view?: IslandView; story?: string | null; device?: IslandDevice; zoom?: Zoom | null }) {
  const url = new URL(window.location.href)
  const set = (name: string, value: string | null | undefined, fallback?: string) => {
    if (value === undefined) return
    if (value === null || value === fallback) url.searchParams.delete(name)
    else url.searchParams.set(name, value)
  }
  set(PARAMS.tab, next.view, 'preview')
  set(PARAMS.story, next.story)
  set(PARAMS.device, next.device, 'desktop')
  set(PARAMS.zoom, next.zoom)
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
}

/**
 * The viewer's state, from the address to start with and written back as it
 * changes: the screen (Preview, Code, Info), the story, the device and the
 * zoom (each item's own default until one is picked), the look, which
 * starts as `opening` (the list's, or the site's), and the motion and size
 * (the reader's Size pick, shared by every preview, over the item's own),
 * which go to the frame as they change.
 */
export function useViewerState({ itemKey, entry, basic, opening }: { itemKey: string; entry?: ViewerEntry; basic: boolean; opening: { dark: boolean; preset?: ThemeId | null; style?: StyleId | null } }) {
  const k = useYouj()
  const [initial] = useState(read)
  const [view, setView] = useState<IslandView>(initial.view)
  const [device, setDevice] = useState<IslandDevice>(initial.device)
  const [zoomPick, setZoomPick] = useState<Zoom | null>(initial.zoom)
  const zoom = zoomPick ?? defaultZoom(basic)

  // A new item opens on its first story (the address's, for the item it was opened on).
  const [storyPick, setStoryPick] = useState<{ key: string; story?: string }>({ key: itemKey, story: initial.story })
  const stories = entry?.stories ?? []
  const asked = storyPick.key === itemKey ? storyPick.story : undefined
  const story = asked && (!entry || stories.some((s) => s.id === asked)) ? asked : stories[0]?.id
  const src = viewerSrc(itemKey, story && story !== stories[0]?.id ? story : undefined)

  const [dark, setDark] = useState(opening.dark)
  const [pickedPreset, setPickedPreset] = useState<ThemeId | null>(null)
  const [pickedLook, setPickedLook] = useState<StyleId | null>(null)
  const preset = pickedPreset ?? opening.preset ?? modePreset(dark)
  const style = pickedLook ?? opening.style ?? DEFAULT_STYLE
  const [dir, setDirPick] = useState<'ltr' | 'rtl'>('ltr')
  const [motion, setMotion] = useState<PreviewMotion>(DEFAULT_PREVIEW_MOTION)
  const sized = usePreviewSize(defaultSize())

  const reduced = motion.reduced || k.reduced
  const state = useMemo<FrameState>(() => ({ dark, preset, style, speed: motion.speed, reduced, size: sized.size }), [dark, preset, style, motion.speed, reduced, sized.size])
  useEffect(() => setLook(state), [state])
  useEffect(() => () => setLook(null), [])
  useEffect(() => {
    setDir(dir)
    return () => setDir('ltr')
  }, [dir])

  return {
    view,
    pickView: (next: IslandView) => {
      setView(next)
      writeParams({ view: next })
    },
    story,
    pickStory: (next: string) => {
      setStoryPick({ key: itemKey, story: next })
      writeParams({ story: next === stories[0]?.id ? null : next })
    },
    src,
    device,
    pickDevice: (next: IslandDevice) => {
      setDevice(next)
      writeParams({ device: next })
    },
    zoom,
    pickZoom: (next: Zoom) => {
      setZoomPick(next)
      writeParams({ zoom: next === defaultZoom(basic) ? null : next })
    },
    appearance: { preset, onPreset: setPickedPreset, style, onLook: setPickedLook, dark, onDark: setDark, dir, onDir: setDirPick },
    motion,
    setMotion,
    size: sized,
  }
}

export type ViewerState = ReturnType<typeof useViewerState>

/** The island over a viewer's stage: the same controls, in the same order, in the dialog and on the full page. */
export function ViewerIsland({ title, entry, viewer, fit, onReload, page, className }: { title: string; entry?: ViewerEntry; viewer: ViewerState; fit: number; onReload: () => void; page: { href: string; to: 'open' | 'exit' }; className?: string }) {
  const files = (entry?.files ?? entry?.stories.find((s) => s.id === viewer.story)?.files) ?? []
  const command = entry?.install ?? entry?.import
  return (
    <PreviewIsland
      label={`${title}: preview controls`}
      className={className}
      view={{ value: viewer.view, onChange: viewer.pickView, options: ['preview', 'code', 'info'], disabled: entry && files.length === 0 ? ['code'] : undefined }}
      story={{ value: viewer.story ?? '', options: entry?.stories ?? [], onChange: viewer.pickStory, heading: entry && !entry.files ? 'Example' : 'Story' }}
      appearance={viewer.appearance}
      device={{ value: viewer.device, onChange: viewer.pickDevice }}
      zoom={{ value: viewer.zoom, onChange: viewer.pickZoom, fit }}
      reload={{ label: 'Reload', onClick: onReload }}
      extra={(live) => <MotionSizeTile size={viewer.size.fallback} motion={viewer.motion} onMotion={viewer.setMotion} changed={viewer.size.changed || viewer.motion.speed !== 1 || viewer.motion.reduced} disabled={!live} />}
      page={page}
      copy={
        entry?.import && !entry.install
          ? { label: 'Copy the import', text: entry.import, done: 'Import copied', icon: 'code' }
          : { label: 'Copy the install command', text: command ?? '', done: 'Command copied', disabled: !command }
      }
    />
  )
}

/**
 * The live item's stage: the one frame (./viewer-frame), moved in when it
 * mounts and out when it goes. Calm while the item loads (its own ground and,
 * only if that takes a moment, a small spinner); the frame stays hidden until
 * it says it has painted, then fades in. Another item hides it again,
 * quickly; another story of the same item swaps in place; Reload hides it
 * until it has painted again. `device` holds it to a tablet's or a phone's
 * width (a phone's screen rounded as one), `zoom` lays it out wider and
 * draws it to fit (as a block's frame does: Fit lays a page out at 1280px
 * and scales it to the stage; a device's width at Fit is drawn at 100%).
 * `onFit` reports the scale Fit gives, for the island's readout.
 */
export function Stage({
  hidden,
  src,
  title,
  device,
  zoom,
  run,
  onFit,
  children,
}: {
  hidden: boolean
  src: string
  title: string
  device: IslandDevice
  zoom: Zoom
  /** Bumped by Reload. */
  run: number
  onFit: (fit: number) => void
  /** Over the stage: the island, the arrows. */
  children?: ReactNode
}) {
  const host = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLDivElement>(null)
  const painted = useFramePainted(src)
  // Another story of the item on show swaps in place; another item (or a reload) is hidden until it paints.
  const path = `${src.split('?')[0]}#${run}`
  const [shownPath, setShownPath] = useState<string | null>(null)
  if (painted && shownPath !== path) setShownPath(path)
  const covered = !painted && shownPath !== path

  const first = useRef({ src, title })
  useLayoutEffect(() => {
    const el = host.current!
    attach(el, first.current.src, first.current.title)
    return () => detach(el)
  }, [])
  useEffect(() => go(src), [src])
  useEffect(() => setTitle(title), [title])
  const ran = useRef(run)
  useEffect(() => {
    if (ran.current === run) return
    ran.current = run
    reload()
  }, [run])

  // The stage's width, for Fit and for a device's width at a zoom.
  const [available, setAvailable] = useState(0)
  useEffect(() => {
    const el = area.current
    if (!el) return
    const observer = new ResizeObserver(() => setAvailable(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const fit = available ? fitScale(available) : 1
  const report = useRef(onFit)
  report.current = onFit
  useEffect(() => report.current(Math.round(fit * 100)), [fit])

  const width = DEVICE_WIDTH[device]
  const inset = width !== null
  const fixed = zoom === 'fit' ? 1 : Number(zoom) / 100
  const scale = inset ? fixed : zoom === 'fit' ? fit : fixed
  const k = useYouj()

  return (
    <div className={cn('relative flex min-h-0 min-w-0 flex-1 flex-col', hidden && 'hidden')}>
      <div ref={area} className={cn('relative flex min-h-0 flex-1 justify-center overflow-hidden bg-surface', inset ? 'p-3' : 'p-2 md:p-3')}>
        {inset && <div aria-hidden className="blueprint pointer-events-none absolute inset-0" />}
        <div
          data-viewer-stage=""
          data-device={device}
          data-painted={covered ? undefined : ''}
          data-live={painted ? '' : undefined}
          className={cn(
            'relative h-full w-full overflow-hidden bg-canvas',
            device === 'mobile' ? 'rounded-[22px] shadow-md' : 'rounded-xl',
            !k.reduced && 'transition-[max-width] yj-duration-base ease-standard',
          )}
          style={{ maxWidth: inset ? Math.min(width * scale, available) : '100%' }}
        >
          {/* The frame lives here, put in and taken out by ./viewer-frame, not by React; laid out at the stage's size over the scale, drawn at the scale. */}
          <div
            ref={host}
            data-viewer-host=""
            className={cn('absolute top-0 left-0 transition-opacity ease-standard', covered ? 'opacity-0 duration-(--yj-duration-instant)' : 'opacity-100 duration-(--yj-duration-base)')}
            style={scale === 1 ? { width: '100%', height: '100%' } : { width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0' }}
          />
          {covered && (
            <div key={path} aria-hidden data-viewer-loading="" className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="viewer-spinner size-5 rounded-full border-2 border-line-strong border-t-fg-muted" />
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/** The island's place: a row of its own below the screen on show, centered, so it never covers the item (the stage gives it the room); the list's previous and next keys flank it. */
export function IslandDock({ children, start, end, className }: { children: ReactNode; start?: ReactNode; end?: ReactNode; className?: string }) {
  return (
    <div data-island-dock="" className={cn('flex shrink-0 items-center justify-center gap-2 px-2 pt-1 pb-3 md:pb-4', className)}>
      {start}
      {children}
      {end}
    </div>
  )
}

/** The Code screen's module: fetched once the viewer is idle, or at once when it's asked for. */
let codeChunk: Promise<typeof import('./viewer-code')> | null = null
const loadCodeChunk = () => {
  codeChunk ??= import('./viewer-code')
  codeChunk.catch(() => (codeChunk = null))
  return codeChunk
}

export function useCodeChunk(now: boolean) {
  const [chunk, setChunk] = useState<Awaited<ReturnType<typeof loadCodeChunk>> | null>(null)
  useEffect(() => {
    if (chunk) return
    let live = true
    const take = () => loadCodeChunk().then((m) => live && setChunk(m), () => {})
    if (now || !window.requestIdleCallback) {
      const id = window.setTimeout(take, now ? 0 : 800)
      return () => {
        live = false
        window.clearTimeout(id)
      }
    }
    const id = window.requestIdleCallback(take, { timeout: 2000 })
    return () => {
      live = false
      window.cancelIdleCallback(id)
    }
  }, [now, chunk])
  return chunk
}

/** The Code screen: the item's files (or the story's), as the site's code modal shows them, the whole width. */
export function CodeScreen({ title, entry, files, missing }: { title: string; entry?: ViewerEntry; files: NonNullable<ViewerEntry['files']>; missing: boolean }) {
  const code = useCodeChunk(true)
  return (
    <div id="item-viewer-code" role="region" aria-label={`${title}: code`} className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      {entry && code ? (
        <code.ViewerCode entry={entry} files={files} open />
      ) : (
        <p aria-busy className="m-auto type-small text-fg-muted">
          {missing ? 'This item’s code isn’t available.' : 'Loading…'}
        </p>
      )}
    </div>
  )
}

/** The Info screen: what it is, how to get it and its pages, the whole width. */
export function InfoScreen({ title, entry, story, missing, fullPage }: { title: string; entry?: ViewerEntry; story?: string; missing: boolean; fullPage?: string | null }) {
  if (!entry)
    return (
      <div role="region" aria-label={`${title}: info`} className="flex min-h-0 flex-1 bg-surface">
        <p aria-busy className="m-auto type-small text-fg-muted">
          {missing ? 'This item’s details aren’t available.' : 'Loading…'}
        </p>
      </div>
    )
  const full = fullPage !== undefined ? fullPage : viewerSrc(entry.key, story && story !== entry.stories[0]?.id ? story : undefined)
  return (
    <div role="region" aria-label={`${title}: info`} className="flex min-h-0 flex-1 overflow-y-auto bg-surface yj-scrollbar">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
        <div className="flex flex-col gap-3">
          <h3 className="type-heading text-fg">{entry.title}</h3>
          {entry.summary && <p className="type-lede text-pretty text-fg-muted">{entry.summary}</p>}
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 [&_dd]:type-body-strong [&_dd]:text-fg [&_dt]:type-label [&>div]:flex [&>div]:flex-col [&>div]:gap-1">
          <div>
            <dt>Level</dt>
            <dd>{entry.level}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{entry.category}</dd>
          </div>
          {entry.stories.length > 1 && (
            <div>
              <dt>{entry.files ? 'Stories' : 'Examples'}</dt>
              <dd className="tabular-nums">{entry.stories.length}</dd>
            </div>
          )}
        </dl>
        {entry.install && (
          <section className="flex flex-col gap-2">
            <h4 className="type-label">Install</h4>
            <ExportCommand command={entry.install} label="Install command" />
          </section>
        )}
        {entry.import && (
          <section className="flex flex-col gap-2">
            <h4 className="type-label">Import</h4>
            <ExportCommand command={entry.import} label="Import" prompt={false} />
          </section>
        )}
        <nav aria-label={`${entry.title}: pages`} className="flex flex-wrap gap-x-6 gap-y-2">
          {(entry.docs ?? entry.page) && (
            <a href={entry.docs ?? entry.page} className="link-quiet inline-flex items-center gap-2 rounded-sm py-1 type-body-strong focus-ring">
              <BookOpenIcon size={15} strokeWidth={1.75} />
              {entry.docs ? 'Docs page' : 'Its page'}
            </a>
          )}
          {full && (
            <a href={full} className="link-quiet inline-flex items-center gap-2 rounded-sm py-1 type-body-strong focus-ring">
              <ArrowRightIcon size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
              Full-page preview
            </a>
          )}
        </nav>
      </div>
    </div>
  )
}

const indexes = new Map<Level, Promise<ViewerEntry[]>>()

/** A level's items as the viewer shows them, fetched once per visit. */
export function loadIndex(level: Level) {
  let pending = indexes.get(level)
  if (!pending) {
    pending = fetch(`/viewer-index/${level}.json`).then((r) => (r.ok ? (r.json() as Promise<ViewerEntry[]>) : Promise.reject(new Error(String(r.status)))))
    pending.catch(() => indexes.delete(level))
    indexes.set(level, pending)
  }
  return pending
}

export function useIndex(level: Level) {
  const [entries, setEntries] = useState<ViewerEntry[] | null>(null)
  useEffect(() => {
    let live = true
    loadIndex(level).then(
      (list) => live && setEntries(list),
      () => live && setEntries([]),
    )
    return () => {
      live = false
    }
  }, [level])
  return entries
}
