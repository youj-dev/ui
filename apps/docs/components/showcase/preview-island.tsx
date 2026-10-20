'use client'

import { cloneElement, useEffect, useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode, type Ref } from 'react'
import { useYouj } from '@youj/core'
import { styleById, styles, type StyleId } from '@youj/core/lib/youj/theme'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { CheckIcon, ClapperboardIcon, CodeIcon, CopyIcon, EyeIcon, InfoIcon, LayersIcon, MaximizeIcon, MinimizeIcon, MonitorIcon, MoonIcon, RefreshIcon, SlidersIcon, SmartphoneIcon, SunIcon, TabletIcon, TerminalIcon, ZoomInIcon } from '@youj/icons'
import { ActionIsland, ActionIslandSeparator, ActionIslandTile } from '@youj/react/components/ui/action-island'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@youj/react/components/ui/dropdown-menu'
import { toast } from '@youj/react/components/ui/toast'
import type { PreviewMotion, PreviewSize } from '@/lib/preview'
import { cn } from '@/lib/cn'
import { previewName, previewPresets } from '@/lib/preview'
import { Swatch } from './theme-tag'
import { ViewOptions } from './view-options'
import { ZOOMS, type Zoom } from './zoom'
import { copyToast } from '@/lib/copy-toast'
import { ENTRANCES } from '@/components/site/ui-generation/entrances'
import { setEntrance, useEntranceId } from '@/components/site/ui-generation/opt-in'

/* The one island every live preview on the site carries (the item viewer,
 * the full-page preview, a docs page's examples), so each offers the same
 * controls in the same order with the same icons: what's shown (Preview,
 * Code, Info), the story, the look (one Appearance menu), the device's
 * width, the zoom, Reload, the way to or from the full page, and a last tile
 * to copy what installs it (or the code), quiet like the rest. A control a preview
 * doesn't have is left out, but a surface's island never changes its tiles or
 * its width: a control that doesn't apply right now (the live item's, while
 * its code or details show; a story menu with one story) stays, greyed. The
 * kit's ActionIsland: one tab stop, the arrows rove its tiles. On a phone the
 * tiles are a step smaller and show no labels, so the island fits the screen.
 * `bare` drops the tray (its surface, hairline and shadow) and the quiet
 * tiles' hairlines, so the keys sit straight on the strip that holds them (a
 * docs example's, on the stage's colour); hover still tints a key, and a
 * pressed key or an open menu's keeps its accent outline. */

export type IslandView = 'preview' | 'code' | 'info'
export type IslandDevice = 'desktop' | 'tablet' | 'mobile'

/** The widths Device snaps a frame to; desktop fills it. */
export const DEVICE_WIDTH: Record<IslandDevice, number | null> = { desktop: null, tablet: 768, mobile: 393 }

const VIEWS: Record<IslandView, { label: string; icon: typeof EyeIcon }> = {
  preview: { label: 'Preview', icon: EyeIcon },
  code: { label: 'Code', icon: CodeIcon },
  info: { label: 'Info', icon: InfoIcon },
}

const DEVICES: Record<IslandDevice, { label: string; detail: string; icon: typeof EyeIcon }> = {
  desktop: { label: 'Desktop', detail: 'the full width', icon: MonitorIcon },
  tablet: { label: 'Tablet', detail: '768px', icon: TabletIcon },
  mobile: { label: 'Mobile', detail: '393 × 852', icon: SmartphoneIcon },
}

const glyph = { size: 18, strokeWidth: 1.75 } as const
const item = { size: 15, strokeWidth: 1.75 } as const

/** A menu's picked row: its text and icon in the accent, no check (it would sit on a row's trailing detail). */
export const PICKED = 'own:pe-2 [&>[data-slot=dropdown-menu-radio-item-indicator]]:hidden data-checked:text-accent-text data-checked:[&>svg]:text-accent-text!'

export const zoomName = (zoom: Zoom, fit?: number) => (zoom === 'fit' ? (fit ? `Fit, ${fit}%` : 'Fit') : `${zoom}%`)

export interface IslandAppearance {
  preset: ThemeId
  onPreset: (preset: ThemeId) => void
  /** The style (it brings its look); `preset` names the palette. */
  style: StyleId
  onLook: (style: StyleId) => void
  /** The mode the palettes are listed for; with `onDark`, a Mode group too. */
  dark: boolean
  onDark?: (dark: boolean) => void
  dir: 'ltr' | 'rtl'
  onDir: (dir: 'ltr' | 'rtl') => void
  /** The site's own look (monochrome on the aurora) as the first theme: `active` while no preset is picked. */
  site?: { active: boolean; onSelect: () => void }
}

export interface PreviewIslandProps {
  /** Names the toolbar: "Uptime: preview controls". */
  label: string
  /** No tray: the keys sit on whatever holds the island. */
  bare?: boolean
  view?: { value: IslandView; onChange: (view: IslandView) => void; options: IslandView[]; disabled?: IslandView[] }
  /** Instead of `view`: a Code tile that opens the code modal, and gets focus back when it closes. */
  code?: { onOpen: () => void; tileRef?: Ref<HTMLButtonElement>; onIntent?: () => void }
  story?: {
    value: string
    options: { id: string; label: string }[]
    onChange: (story: string) => void
    heading?: string
    /** Show the story's name on the tile, not only in its tooltip. */
    named?: boolean
    /** The picked story is still on its way: a small dot by its name (components/docs/story-switch.ts). */
    pending?: boolean
    /** A story is about to be picked (its item pointed at or focused), so its demo can load ahead. */
    onIntent?: (story: string) => void
  }
  appearance?: IslandAppearance
  device?: { value: IslandDevice; onChange: (device: IslandDevice) => void; options?: IslandDevice[] }
  zoom?: { value: Zoom; onChange: (zoom: Zoom) => void; fit: number }
  /** The Entrance menu: how the demo arrives (None, or an effect from components/site/ui-generation/entrances.ts), the
   *  reader's pick on every preview. It plays when asked for: `onPick` replays the demo with the effect just picked. */
  entrance?: { onPick: () => void }
  /** Reload (a frame) or Replay (a demo on the page). */
  reload?: { label: string; onClick: () => void }
  /** To the full page (`open`) or back from it (`exit`). */
  page?: { href: string; to: 'open' | 'exit'; label?: string }
  /** The last tile: copies what installs the item, or its code. */
  copy?: { label: string; text: string | (() => Promise<string>); done: string; icon?: 'terminal' | 'code' | 'copy'; disabled?: boolean }
  /** A tile after Reload: a preview's own extra settings (motion and size), given whether the live item is on show. */
  extra?: (live: boolean) => ReactNode
  className?: string
}

export function PreviewIsland({ label, bare, view, code, story, appearance, device, zoom, entrance, reload, extra, page, copy, className }: PreviewIslandProps) {
  const live = !view || view.value === 'preview'
  const devices = device ? (device.options ?? (['desktop', 'tablet', 'mobile'] as IslandDevice[])) : []
  return (
    <ActionIsland
      size="lg"
      aria-label={label}
      data-preview-island=""
      // A phone's tiles: a step smaller, so the island fits a 390px screen. On touch they're 44px tall, and 44px wide where the row has room (the docs' island); the viewer's, with more tiles, keeps them narrow and leans on the tile's 44px hit area (an ::after).
      className={cn(
        'max-w-[calc(100%-1rem)] max-sm:max-w-full max-sm:gap-0.5 max-sm:p-1',
        'max-sm:[&_[data-slot=action-island-tile]]:h-9! max-sm:[&_[data-slot=action-island-tile]]:min-w-8! max-sm:[&_[data-slot=action-island-tile]]:px-1!',
        'max-sm:touch:[&_[data-slot=action-island-tile]]:h-11!',
        // The viewer's island (its views, a story, looks, device, zoom, reload, motion, page and copy) is more tiles than 44px each fit a phone's width.
        !view && 'max-sm:touch:[&_[data-slot=action-island-tile]]:min-w-11!',
        bare && 'border-0 bg-transparent p-0 shadow-none max-sm:p-0 [&_[data-slot=action-island-tile]:not([aria-pressed=true],[data-popup-open])]:border-transparent',
        className,
      )}
    >
      {code && (
        <ActionIslandTile label="Code" aria-haspopup="dialog" ref={code.tileRef} onClick={code.onOpen} onPointerEnter={code.onIntent} onFocus={code.onIntent}>
          <CodeIcon {...glyph} />
        </ActionIslandTile>
      )}
      {view && <ViewTabs view={view} />}
      {(code || view) && (story || appearance || devices.length > 1 || zoom) && <ActionIslandSeparator className="max-sm:hidden" />}
      {story && <StoryMenu story={story} disabled={!live || story.options.length < 2} />}
      {appearance && <AppearanceMenu {...appearance} disabled={!live} />}
      {device && devices.length > 1 && <DeviceMenu device={device} devices={devices} disabled={!live} />}
      {zoom && <ZoomMenu zoom={zoom} disabled={!live} />}
      {entrance && <EntranceMenu disabled={!live} onPick={entrance.onPick} />}
      {reload && (
        <ActionIslandTile label={reload.label} onClick={reload.onClick} disabled={!live}>
          <RefreshIcon {...glyph} />
        </ActionIslandTile>
      )}
      {extra?.(live)}
      {page && (
        <ActionIslandTile label={page.label ?? (page.to === 'open' ? 'Open as a full page' : 'Leave the full page')} render={<a href={page.href} />}>
          {page.to === 'open' ? <MaximizeIcon {...glyph} /> : <MinimizeIcon {...glyph} />}
        </ActionIslandTile>
      )}
      {copy && <CopyTile {...copy} />}
    </ActionIsland>
  )
}

/**
 * Preview, Code and Info as tabs: one connected track with one segment
 * selected (they're mutually exclusive, not three toggles). A tablist of its
 * own inside the island: ← and → (mirrored in RTL), Home and End move and
 * select, and keep the keys from roving the island's tiles.
 */
function ViewTabs({ view }: { view: NonNullable<PreviewIslandProps['view']> }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const options = view.options.filter((v) => !view.disabled?.includes(v))
    const at = options.indexOf(view.value)
    const step = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : step ? (at + step + options.length) % options.length : -1
    if (to < 0) return
    e.preventDefault()
    e.stopPropagation()
    const next = options[to]!
    view.onChange(next)
    refs.current[next]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="View"
      data-slot="island-view-tabs"
      onKeyDown={onKeyDown}
      className="flex h-11 shrink-0 items-center gap-0.5 rounded-control-sm border border-line-subtle bg-transparent p-0.5 max-sm:h-9 max-sm:touch:h-11"
    >
      {view.options.map((v) => {
        const { label: name, icon: Icon } = VIEWS[v]
        const selected = view.value === v
        const off = !selected && view.disabled?.includes(v)
        return (
          <button
            key={v}
            ref={(node) => {
              refs.current[v] = node
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={name}
            aria-disabled={off || undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => !off && view.onChange(v)}
            className={cn(
              'relative inline-flex h-full w-10 items-center justify-center rounded-[calc(var(--radius-control-sm)-2px)] border border-transparent text-ui-sm font-medium whitespace-nowrap select-none outline-none focus-ring touch:yj-hit max-sm:w-8',
              'aria-disabled:pointer-events-none aria-disabled:opacity-50',
              'transition-[color,background-color,border-color] duration-(--yj-duration-fast) ease-standard',
              selected ? 'border-accent bg-accent-subtle text-accent-text' : 'text-fg-muted hover:bg-hover hover:text-fg',
            )}
          >
            <Icon {...glyph} />
          </button>
        )
      })}
    </div>
  )
}

function StoryMenu({ story, disabled }: { story: NonNullable<PreviewIslandProps['story']>; disabled: boolean }) {
  const current = story.options.find((s) => s.id === story.value) ?? story.options[0]
  const heading = story.heading ?? 'Story'
  return (
    <DropdownMenu>
      <ActionIslandTile
        label={`${heading}: ${current?.label ?? '—'}`}
        showLabel={story.named ? <>{current?.label}{story.pending && <span aria-hidden className="story-dot ms-1.5" />}</> : undefined}
        aria-busy={story.pending || undefined}
        disabled={disabled}
        render={<DropdownMenuTrigger disabled={disabled} />}
      >
        <LayersIcon {...glyph} />
      </ActionIslandTile>
      <DropdownMenuContent side="top" align="center" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{heading}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={current?.id} onValueChange={(v) => story.onChange(v as string)}>
            {story.options.map((s) => (
              <DropdownMenuRadioItem key={s.id} value={s.id} closeOnClick className={PICKED} onPointerEnter={() => story.onIntent?.(s.id)} onFocus={() => story.onIntent?.(s.id)}>
                {s.label}
                {story.pending && s.id === current?.id && <span aria-hidden className="story-dot ms-auto" />}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** How the demo arrives, from the effects in ENTRANCES; the pick is the reader's, kept across previews and visits. */
function EntranceMenu({ disabled, onPick }: { disabled: boolean; onPick: () => void }) {
  const id = useEntranceId()
  const current = ENTRANCES.find((e) => e.id === id) ?? ENTRANCES[0]!
  return (
    <DropdownMenu>
      <ActionIslandTile label={`Entrance: ${current.label}`} disabled={disabled} render={<DropdownMenuTrigger disabled={disabled} />}>
        <ClapperboardIcon {...glyph} />
      </ActionIslandTile>
      <DropdownMenuContent side="top" align="center" className="w-auto min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Entrance</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={current.id} onValueChange={(v) => {
              setEntrance(v as string)
              onPick()
            }}
          >
            {ENTRANCES.map((e) => (
              <DropdownMenuRadioItem key={e.id} value={e.id} closeOnClick className={PICKED}>
                <span className="flex flex-col items-start">
                  {e.label}
                  <span className="text-ui-xs font-normal text-fg-muted">{e.description}</span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The look the item wears, in one menu: its palette, its style, light or
 * dark (where the preview has its own), and direction, each a group of
 * choices. A pick applies at once and the menu stays open, so looks can be
 * compared. Its tile shows the theme's swatch.
 */
/** The site look's value in the Theme group. */
const SITE = 'youj-site'

/** The site look's swatch: ink on the aurora. */
export function SiteSwatch({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('site-look-swatch inline-block size-3 shrink-0 rounded-full ring-1 ring-line', className)}
    />
  )
}

function AppearanceMenu({ preset, onPreset, style, onLook, dark, onDark, dir, onDir, site, disabled }: IslandAppearance & { disabled: boolean }) {
  // The site's own look is Youj on the aurora: with it offered, the list holds only the Wada palettes after it.
  const presets = site ? previewPresets(dark).slice(1) : previewPresets(dark)
  const name = site?.active ? 'Youj' : previewName(preset)
  const summary = `${name}, ${styleById(style).name}${onDark ? `, ${dark ? 'dark' : 'light'}` : ''}${dir === 'rtl' ? ', right to left' : ''}`
  return (
    <DropdownMenu>
      <ActionIslandTile label={`Appearance: ${summary}`} disabled={disabled} render={<DropdownMenuTrigger disabled={disabled} />}>
        {site?.active ? <SiteSwatch className="island-glyph size-3.5" /> : <Swatch preset={preset} className="island-glyph size-3.5" />}
      </ActionIslandTile>
      <DropdownMenuContent side="top" align="center" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Palette</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={site?.active ? SITE : preset} onValueChange={(v) => (v === SITE ? site?.onSelect() : onPreset(v as ThemeId))}>
            {site && (
              <DropdownMenuRadioItem value={SITE} closeOnClick={false} className={PICKED}>
                <SiteSwatch />
                Youj
              </DropdownMenuRadioItem>
            )}
            {presets.map((t) => (
              <DropdownMenuRadioItem key={t.id} value={t.id} closeOnClick={false} className={PICKED}>
                <Swatch preset={t.id} />
                {t.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Style</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={style} onValueChange={(v) => onLook(v as StyleId)}>
            {styles.map((s) => (
              <DropdownMenuRadioItem key={s.id} value={s.id} closeOnClick={false} className={PICKED}>
                {s.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        {onDark && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mode</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={dark ? 'dark' : 'light'} onValueChange={(v) => onDark(v === 'dark')}>
                <DropdownMenuRadioItem value="light" closeOnClick={false} className={PICKED}>
                  <SunIcon {...item} />
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" closeOnClick={false} className={PICKED}>
                  <MoonIcon {...item} />
                  Dark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Direction</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={dir} onValueChange={(v) => onDir(v as 'ltr' | 'rtl')}>
            <DropdownMenuRadioItem value="ltr" closeOnClick={false} className={PICKED}>
              Left to right
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="rtl" closeOnClick={false} className={PICKED}>
              Right to left
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The Device control: a one-press toggle between two devices, or a menu of more. `side` is its tooltip's (a key in a stage's top corner: below). */
export function DeviceMenu({ device, devices, disabled, side }: { device: NonNullable<PreviewIslandProps['device']>; devices: IslandDevice[]; disabled: boolean; side?: 'top' | 'bottom' }) {
  const { label, detail, icon: Icon } = DEVICES[device.value]
  // Two devices: one tile that switches between them, showing the one on stage; a menu only earns its place with more.
  if (devices.length === 2) {
    const next = devices.find((d) => d !== device.value)!
    return (
      <ActionIslandTile label={`Device: ${label}, ${detail}. Switch to ${DEVICES[next].label}`} disabled={disabled} side={side} onClick={() => device.onChange(next)}>
        <Icon {...glyph} key={device.value} trigger="mount" />
      </ActionIslandTile>
    )
  }
  return (
    <DropdownMenu>
      {/* A tablet's or desktop's width is wider than a phone's screen: there, the widths step aside (as View options' viewport does). */}
      <ActionIslandTile label={`Device: ${label}, ${detail}`} disabled={disabled} render={<DropdownMenuTrigger disabled={disabled} />} className={cn(devices.includes('tablet') && 'max-sm:hidden')}>
        <Icon {...glyph} />
      </ActionIslandTile>
      <DropdownMenuContent side="top" align="center" className="w-auto min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Device</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={device.value} onValueChange={(v) => device.onChange(v as IslandDevice)}>
            {devices.map((d) => {
              const { label: name, detail: width, icon: DeviceIcon } = DEVICES[d]
              return (
                <DropdownMenuRadioItem key={d} value={d} closeOnClick className={PICKED}>
                  <DeviceIcon {...item} />
                  {name}
                  <span className="ms-auto ps-3 type-small text-fg-subtle tabular-nums">{width}</span>
                </DropdownMenuRadioItem>
              )
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ZoomMenu({ zoom, disabled }: { zoom: NonNullable<PreviewIslandProps['zoom']>; disabled: boolean }) {
  return (
    <DropdownMenu>
      <ActionIslandTile
        label={`Zoom: ${zoomName(zoom.value, zoom.fit)}`}
        disabled={disabled}
        render={<DropdownMenuTrigger disabled={disabled} />}
      >
        <ZoomInIcon {...glyph} />
      </ActionIslandTile>
      <DropdownMenuContent side="top" align="center" className="w-auto min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Zoom</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={zoom.value} onValueChange={(v) => zoom.onChange(v as Zoom)}>
            {ZOOMS.map((z) => (
              <DropdownMenuRadioItem key={z} value={z} closeOnClick className={PICKED}>
                {z === 'fit' ? 'Fit' : `${z}%`}
                {z === 'fit' && <span className="ms-auto ps-3 type-small text-fg-subtle tabular-nums">{zoom.fit}%</span>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CopyTile({ label, text, done, icon = 'terminal', disabled }: NonNullable<PreviewIslandProps['copy']>) {
  const k = useYouj()
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const onClick = async () => {
    try {
      const value = typeof text === 'string' ? text : await text()
      await navigator.clipboard.writeText(value)
      copyToast(done, value.length > 80 ? undefined : value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
    } catch {
      toast.error('Couldn’t copy', { id: 'island-copy', description: 'The browser blocked the clipboard.' })
    }
  }
  const Icon = icon === 'copy' ? CopyIcon : icon === 'code' ? CodeIcon : TerminalIcon
  return (
    <ActionIslandTile label={copied ? 'Copied' : label} onClick={onClick} disabled={disabled} className="ms-0.5">
      {copied ? <CheckIcon {...glyph} trigger="mount" className="text-accent" /> : <Icon {...glyph} className="text-accent" />}
    </ActionIslandTile>
  )
}

/** Motion and size: View options' panel (the demo's density and scale, its speed and reduced motion) from an island tile, with a dot while anything is off its default. */
export function MotionSizeTile({ size, motion, onMotion, changed, disabled }: { size: PreviewSize; motion: PreviewMotion; onMotion: (motion: PreviewMotion) => void; changed: boolean; disabled: boolean }) {
  return (
    <ViewOptions
      size={size}
      motion={motion}
      onMotion={onMotion}
      changed={changed}
      renderTrigger={(trigger) => (
        <ActionIslandTile label={`Motion and size${changed ? ', changed' : ''}`} disabled={disabled} render={cloneElement(trigger as ReactElement<{ disabled?: boolean }>, { disabled })}>
          <SlidersIcon size={16} strokeWidth={1.75} />
          {changed && <span aria-hidden className="absolute end-1 top-1 size-1.5 rounded-full bg-accent" />}
        </ActionIslandTile>
      )}
    />
  )
}
