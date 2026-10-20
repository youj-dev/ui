'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useYouj } from '@youj/core'
import { ExternalLinkIcon, LockIcon, RefreshIcon } from '@youj/icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react'
import { useEntranceQuery } from '@/components/site/ui-generation/opt-in'
import { TabList } from '@/components/ui/controls'
import { TOOLBAR_BUTTON, TOOLBAR_MENU } from '@/components/ui/preview-controls'
import { cn } from '@/lib/cn'
import { useFrameSync } from '@/lib/frame-sync'
import type { Framing } from '@/lib/showcase'
import { DEFAULT_PREVIEW_MOTION, ROOMY_SIZE, type PreviewMotion, type PreviewSize } from '@/lib/preview'
import { usePreviewSize } from '@/lib/preview-size'
import { CodePanel, type CodeFile, type CodeInstall } from './code-panel'
import { ViewOptions, ZOOMS, type Device, type Zoom } from './view-options'
import { Stage } from '@/components/site/stage'

// Only a block with an illustration slot shows it, and it carries every scene and the command palette: a chunk of its own.
const IllustrationPicker = dynamic(() => import('./illustration-picker').then((m) => m.IllustrationPicker))

export type { CodeFile, CodeInstall } from './code-panel'

/** Widths the device toggle snaps to; desktop fills the frame. */
const WIDTHS: Record<Exclude<Device, 'desktop'>, number> = { tablet: 768, phone: 390 }
const MIN_WIDTH = 320
const STEP = 16

const FIT_WIDTH = 1280
/** Below this the frame is a phone's or a small tablet's: Fit shows the demo at 100%, its own small layout. */
const FIT_MIN = 768
const ZOOM_STORAGE_KEY = 'youj-preview-zoom'

function readZoom(): Zoom {
  try {
    const stored = localStorage.getItem(ZOOM_STORAGE_KEY)
    return ZOOMS.includes(stored as Zoom) ? (stored as Zoom) : 'fit'
  } catch {
    return 'fit'
  }
}

function writeZoom(zoom: Zoom) {
  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, zoom)
  } catch {}
}

export interface ViewportFrameProps {
  /** The bare demo: `/view/blocks/auth-login`. */
  src: string
  title: string
  /** The demo's stories, when there are several to choose from. */
  stories?: { id: string; name: string }[]
  /** Scenes the demo's illustration slot can show, by category: an "Illustration" picker passes the chosen id to the demo as `illustration`. */
  illustrations?: { id: string; name: string; category: string }[]
  /** Source files for the Code tab. */
  files?: CodeFile[]
  /** The registry install for the Code tab. */
  install?: CodeInstall
  /** The Code tab's .zip name, without the extension. */
  download?: string
  /** The product's address, for the address bar: `folio.email/inbox`. */
  address?: string
  /** Frame height; any CSS length. */
  height?: string
  /** The frame's id; when the page's hash names it (`#code`), the Code tab opens. */
  id?: string
  /** The open tab, when the page drives it (Create's "Get the code"). */
  tab?: 'preview' | 'code'
  onTabChange?: (tab: 'preview' | 'code') => void
  /** Where "Open in a new tab" goes, when it isn't `src` (a page that sends the demo its state). */
  href?: string
  /** A control at the toolbar's start, before the tabs (Create's "Show the panel"). */
  start?: ReactNode
  /** The demo wears the page's showcase look (its theme bar's preset and style). Off for a demo that themes itself (Create's). */
  look?: boolean
  /** The page's look picker (ShowcaseLook, `toolbar`): at the toolbar's end from `sm` up, in View options on a phone. */
  picker?: ReactNode
  /** A zoom control (Fit, 50%, 75%, 100%, and ⌘/Ctrl − and + in the frame), remembered per visitor. */
  zoomable?: boolean
  /** The demo's own layout density and scale (lib/preview's defaultSize): a Size control renders it at the reader's pick (lib/preview-size). None for a demo that sizes itself (Create's). */
  size?: PreviewSize
  /**
   * How the demo is shown (lib/showcase's `framing`): a page fills the frame at `height`; a section or a
   * card fits it, as tall as its stage says it is (never more than `height`), and a card sits on the
   * stage itself, with no screen drawn around it.
   */
  framing?: Framing
  className?: string
}

/** A section's or card's frame before its demo has said how tall it is. */
const FITTED_START = 520
/** A card's frame is never shorter than this, so a small one still has a stage around it. */
const CARD_MIN_HEIGHT = 280

/**
 * A live page in a device frame: a bezel with its toolbar, and inside it the
 * screen, an iframe with its own canvas, border and radius, so the demo reads
 * as a product on the page and never as a patch of it. The iframe keeps the
 * demo's breakpoints honest: snap it to desktop, tablet or phone, or drag (or
 * arrow-key) the handle on its inline end to any width in between; narrower
 * than the stage, the screen floats on a drafting desk. It follows the site's
 * light or dark and the page's showcase look live (lib/frame-sync), runs at
 * the speed its own Motion menu sets (or in its reduced state), and is
 * revealed once its first frame has painted. Width changes glide on the `base` duration, except while
 * dragging and under reduced motion. With `zoomable`, the screen is scaled: a
 * desktop demo is laid out wider than the frame (1280px at Fit, twice the
 * frame at 50%) and drawn to fit, so a laptop shows it as a desktop would.
 */
export function ViewportFrame({
  src,
  title,
  stories = [],
  illustrations,
  files,
  install,
  download,
  address,
  height = 'min(820px, calc(100dvh - 9rem))',
  id: anchor,
  tab: tabProp,
  onTabChange,
  href,
  start,
  look = true,
  picker,
  zoomable = false,
  size,
  framing = 'screen',
  className,
}: ViewportFrameProps) {
  const id = useId()
  const k = useYouj()
  const [ownTab, setOwnTab] = useState<'preview' | 'code'>('preview')
  const tab = tabProp ?? ownTab
  const setTab = (next: 'preview' | 'code') => {
    if (tabProp === undefined) setOwnTab(next)
    onTabChange?.(next)
  }
  const [story, setStory] = useState(stories[0]?.id)
  const [illustration, setIllustration] = useState('')
  const [width, setWidth] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [run, setRun] = useState(0)
  const [available, setAvailable] = useState(0)
  const [zoom, setZoomState] = useState<Zoom>('fit')
  const [motion, setMotion] = useState<PreviewMotion>(DEFAULT_PREVIEW_MOTION)
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const drag = useRef<{ x: number; width: number } | null>(null)

  // The second document (its own runtime and stylesheet) is fetched once the page has loaded and the stage is near the screen; until then the stage shows its "Loading" label.
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    const el = stage.current
    if (!el || typeof IntersectionObserver === 'undefined') return setArmed(true)
    let cancelled = false
    const arm = () => !cancelled && setArmed(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        observer.disconnect()
        if (document.readyState === 'complete') arm()
        else window.addEventListener('load', arm, { once: true })
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(el)
    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('load', arm)
    }
  }, [])

  const sized = usePreviewSize(size ?? ROOMY_SIZE)
  const sync = useFrameSync(frame, { motion, look, size: size ? sized.size : undefined })
  const query = new URLSearchParams([...(story && stories.length > 1 ? [['story', story]] : []), ...(illustration ? [['illustration', illustration]] : [])]).toString()
  const plain = query ? `${src}?${query}` : src
  // The reader's Entrance pick: the frame's demo arrives with it too (components/site/ui-generation).
  const entrance = useEntranceQuery()
  const url = entrance ? `${plain}${plain.includes('?') ? '&' : '?'}${entrance}` : plain

  // The widest the frame can be, so the handle and readout stay truthful as the window resizes.
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const observer = new ResizeObserver(() => setAvailable(el.clientWidth))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // A link to the frame (the page's "Get the code", `#code`) opens the Code tab.
  useEffect(() => {
    if (!files?.length || !anchor) return
    const open = () => location.hash === `#${anchor}` && setTab('code')
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [files, anchor])

  const { reset, remeasure } = sync
  useEffect(reset, [url, run, reset])

  // Read after hydration: the server renders Fit.
  useEffect(() => {
    if (zoomable) setZoomState(readZoom())
  }, [zoomable])
  const setZoom = (next: Zoom) => {
    setZoomState(next)
    writeZoom(next)
  }

  // A device width is drawn at the fixed zoom (Fit leaves it at 100%, since it fits); `max` is in the demo's pixels.
  const fixed = zoomable && zoom !== 'fit' ? Number(zoom) / 100 : 1
  const inset = width !== null
  const max = Math.max(MIN_WIDTH, available / fixed)
  const current = width === null ? max : Math.min(width, max - 24 / fixed)
  const device: Device = width === null || current >= max ? 'desktop' : current <= WIDTHS.phone ? 'phone' : current <= WIDTHS.tablet ? 'tablet' : 'desktop'

  // The screen's scale, and the width the demo lays out at: the frame's width over the scale.
  const fit = available >= FIT_MIN ? Math.min(1, available / FIT_WIDTH) : 1
  const scale = !zoomable ? 1 : inset ? fixed : zoom === 'fit' ? fit : fixed
  const layout = Math.round(inset ? current : available / scale)
  const shown = zoom === 'fit' ? fit : fixed
  // A new layout width wraps a section or card anew: its next reported height replaces the last.
  useEffect(remeasure, [layout, remeasure])
  // A section or card is as tall as its stage, drawn at the scale, up to the page's height; a page fills it.
  const fitted = framing !== 'screen'
  const stageHeight = !fitted
    ? height
    : `min(${Math.max(framing === 'card' ? CARD_MIN_HEIGHT : 0, Math.ceil((sync.height ?? FITTED_START) * scale)) + (inset ? 24 : 0)}px, ${height})`
  const bare = framing === 'card' && !inset
  // ⌘/Ctrl − and + step through the fixed zooms from wherever the frame is, Fit included.
  const stepZoom = (dir: 1 | -1) => {
    const steps = ZOOMS.slice(1).map(Number)
    const next = dir > 0 ? steps.find((z) => z > Math.round(shown * 100)) : [...steps].reverse().find((z) => z < Math.round(shown * 100))
    if (next !== undefined) setZoom(String(next) as Zoom)
  }
  const zoomKeys = useRef<(e: globalThis.KeyboardEvent) => void>(() => {})
  zoomKeys.current = (e) => {
    if (!zoomable || !(e.metaKey || e.ctrlKey) || e.altKey) return
    const dir = e.key === '-' || e.key === '_' ? -1 : e.key === '=' || e.key === '+' ? 1 : 0
    if (!dir) return
    e.preventDefault()
    stepZoom(dir)
  }

  const setDevice = (next: Device) => setWidth(next === 'desktop' ? null : WIDTHS[next])
  const resizeTo = (next: number) => setWidth(next >= max - 24 / fixed ? null : Math.max(MIN_WIDTH, Math.round(next)))

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, width: current }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    // The screen is centered, so each pixel of pointer travel moves both edges.
    const dir = getComputedStyle(e.currentTarget).direction === 'rtl' ? -1 : 1
    resizeTo(drag.current.width + ((e.clientX - drag.current.x) * 2 * dir) / fixed)
  }
  const onPointerUp = () => {
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? STEP * 4 : STEP
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const keys: Record<string, number | undefined> = {
      ArrowLeft: rtl ? current + step : current - step,
      ArrowRight: rtl ? current - step : current + step,
      Home: MIN_WIDTH,
      End: max,
    }
    const next = keys[e.key]
    if (next === undefined) return
    e.preventDefault()
    resizeTo(next)
  }

  return (
    <div
      id={anchor}
      className={cn(
        // A lifted object in the dark, with a hairline of light along its top edge; in light a shell on the page's
        // planes, which carry its depth, on the card's faint ring and contact shadow.
        'not-prose site-card rounded-xl p-1.5',
        '[box-shadow:var(--ui-shadow-md),inset_0_1px_0_color-mix(in_oklab,var(--color-fg)_5%,transparent)] light:[box-shadow:var(--ui-shadow-sm)]',
        className,
      )}
      onKeyDown={(e) => zoomKeys.current(e.nativeEvent)}
    >
      {/* One compact row, every control the toolbar's size; its ends sit in the bezel's corners, concentric with it. */}
      <div data-slot="preview-toolbar" className="flex min-h-control-xs flex-nowrap items-center gap-1.5 pb-1.5">
        {start}
        {files?.length ? (
          <TabList
            idBase={id}
            label={title}
            value={tab}
            onChange={setTab}
            compact
            tabs={[
              { value: 'preview', label: 'Preview' },
              { value: 'code', label: 'Code' },
            ]}
          />
        ) : null}
        {tab === 'preview' && stories.length > 1 && (
          <Select items={Object.fromEntries(stories.map((s) => [s.id, s.name]))} value={story} onValueChange={(next) => next && setStory(next as string)}>
            <SelectTrigger
              size="sm"
              aria-label={`Story: ${stories.find((s) => s.id === story)?.name ?? ''}`}
              // On a phone the menu is narrow: the whole name on hover.
              title={stories.find((s) => s.id === story)?.name}
              className={cn(TOOLBAR_MENU, 'min-w-0 max-sm:max-w-36 [&>[data-slot=select-value]]:truncate')}
            >
              <span className="text-fg-subtle max-lg:hidden">Story</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false} className="w-auto min-w-44">
              {stories.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tab === 'preview' && illustrations?.length ? <IllustrationPicker scenes={illustrations} value={illustration} onChange={setIllustration} className="min-w-0 max-sm:max-w-44" /> : null}
        {address && (
          <div className="mx-auto hidden h-control-xs max-w-[24rem] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-field px-3 type-small text-fg-muted lg:flex">
            <LockIcon size={11} strokeWidth={1.8} aria-hidden className="shrink-0 text-fg-subtle" />
            <span className="truncate" title={address}>
              {address}
            </span>
          </div>
        )}
        <div className="ms-auto flex shrink-0 items-center gap-1.5">
          {tab === 'preview' && (
            <>
              {/* The look from `lg` up; below that, in View options, so the row never wraps. */}
              {picker && <div className="contents max-lg:hidden">{picker}</div>}
              {picker && <span aria-hidden className="mx-0.5 h-4 w-px bg-line max-lg:hidden" />}
              <ViewOptions
                look={picker}
                lookFrom="lg"
                viewport={{
                  device,
                  onDevice: setDevice,
                  // The width the demo lays out at, and the scale it's drawn at (a device width at Fit is drawn at 100%).
                  readout: available ? `${layout}px · ${Math.round(scale * 100)}%` : '',
                  zoom: zoomable ? { value: zoom, onChange: setZoom, fit: Math.round((inset ? 1 : fit) * 100) } : undefined,
                }}
                size={size}
                motion={motion}
                onMotion={setMotion}
                changed={(!!size && sized.changed) || (zoomable && zoom !== 'fit') || inset || motion.speed !== 1 || motion.reduced}
              />
              <button type="button" onClick={() => setRun((r) => r + 1)} aria-label="Reload" title="Reload" className={TOOLBAR_BUTTON}>
                <RefreshIcon size={14} strokeWidth={1.6} />
              </button>
              {/* A phone's toolbar keeps to one row: the tabs, the story, View and Reload. */}
              <a href={href ?? url} target="_blank" rel="noreferrer" aria-label="Open in a new tab" title="Open in a new tab" className={cn(TOOLBAR_BUTTON, 'max-sm:hidden')}>
                <ExternalLinkIcon size={14} strokeWidth={1.6} />
              </a>
            </>
          )}
        </div>
      </div>

      <Stage
        role={files?.length ? 'tabpanel' : undefined}
        id={`${id}-panel-preview`}
        aria-labelledby={files?.length ? `${id}-tab-preview` : undefined}
        hidden={tab !== 'preview'}
        ref={stage}
        data-framing={framing}
        className={cn(
          'relative flex justify-center overflow-hidden rounded-[calc(var(--radius-xl)-6px)]',
          fitted && !dragging && !k.reduced && 'transition-[height] duration-(--yj-duration-slow) ease-standard',
        )}
        style={{ height: stageHeight }}
      >
        {/* The drafting desk the screen floats on when it's narrower than the stage. */}
        <div aria-hidden className={cn('blueprint absolute inset-0 transition-opacity duration-(--yj-duration-slow) ease-standard', inset ? 'opacity-100' : 'opacity-0')} />
        <div
          className={cn(
            'relative h-full',
            inset && 'py-3',
            !dragging && !k.reduced && 'transition-[width,padding] duration-(--yj-duration-base) ease-standard',
          )}
          style={{ width: width === null ? '100%' : current * scale }}
        >
          <div
            className={cn(
              'relative h-full overflow-hidden bg-canvas',
              // A card sits on the stage itself; a page or section has a screen of its own.
              !bare && 'ring-1 ring-line',
              inset ? (device === 'phone' ? 'rounded-[22px] shadow-md' : 'rounded-[calc(var(--radius-xl)-6px)] shadow-md') : 'rounded-[calc(var(--radius-xl)-6px)]',
            )}
          >
            {armed && (
              <iframe
                ref={frame}
                key={`${url}-${run}`}
                src={url}
                loading="lazy"
                title={`${title} preview`}
                onLoad={() => frame.current?.contentWindow?.addEventListener('keydown', (e) => zoomKeys.current(e))}
                // Laid out at the frame's size over the scale, then drawn at the scale: from the top left, which is where it sits.
                style={scale === 1 ? undefined : { width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: '0 0' }}
                className={cn(
                  'absolute top-0 left-0 size-full bg-canvas transition-opacity duration-(--yj-duration-slow) ease-enter',
                  sync.ready ? 'opacity-100' : 'opacity-0',
                  dragging && 'pointer-events-none',
                )}
              />
            )}
            {!sync.ready && (
              <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="type-small text-fg-subtle">Loading {title}…</span>
              </div>
            )}
          </div>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-valuetext={`${current} pixels wide`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            onDoubleClick={() => setWidth(null)}
            className={cn('group/handle absolute inset-y-0 z-10 flex', inset ? '-end-4' : 'end-0', 'w-6 cursor-ew-resize touch-none items-center justify-center focus-visible:outline-none')}
          >
            <span
              aria-hidden
              className={cn(
                'h-10 w-1.5 rounded-full border border-line-strong bg-surface shadow-xs transition-colors duration-(--yj-duration-fast) ease-standard',
                'group-hover/handle:bg-well group-focus-visible/handle:border-accent group-focus-visible/handle:ring-2 group-focus-visible/handle:ring-accent',
                dragging && 'border-accent bg-well',
              )}
            />
          </div>
        </div>
      </Stage>

      {files?.length ? (
        <div
          role="tabpanel"
          id={`${id}-panel-code`}
          aria-labelledby={`${id}-tab-code`}
          hidden={tab !== 'code'}
          className="overflow-hidden rounded-[calc(var(--radius-xl)-6px)] bg-canvas ring-1 ring-line"
        >
          <CodePanel idBase={`${id}-code`} files={files} install={install} download={download ?? title.toLowerCase().replace(/\W+/g, '-')} height={height} open={tab === 'code'} />
        </div>
      ) : null}
    </div>
  )
}
