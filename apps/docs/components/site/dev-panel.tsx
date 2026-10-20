'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useTheme as useColorScheme } from 'fumadocs-ui/provider/base'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon, PaletteIcon, RotateCcwIcon, XIcon } from '@youj/icons'
import { resolveTheme, type Mode } from '@youj/core/lib/youj/theme'
import { Button } from '@youj/react/components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '@youj/react/components/ui/segmented-control'
import { InspectorRow, InspectorSection, InspectorSelect } from '@youj/react/docs/inspector'
import { ColorField, round, SliderRow } from '@youj/react/docs/theme-controls'
import { STAGE_PATTERN, type StagePattern } from '@/components/site/stage'
import { cn } from '@/lib/cn'
import {
  applyDevTheme,
  applyStage,
  applyStagePattern,
  DEV_PRESETS,
  devPreset,
  devSnippet,
  devTheme,
  FIELDS,
  patchOverrides,
  presetSwatch,
  SITE_PRESET_ID,
  type DevPreset,
  type Field,
  type Overrides,
  type StageLook,
} from '@/lib/dev-theme'

/* The developer colour panel: the site's theme inputs, live. A gallery of
 * whole looks sits on top (lib/dev-theme DEV_PRESETS): one click puts the
 * site in it, two-tone looks in the mode they're for, and the controls under
 * it show its values and edit from there, with Reset back to it. Edits are
 * written to <html> as the site's scope, so every page follows as they move,
 * and come off again when the panel closes. Its Stage switch puts every stage
 * on the paper preset (lib/dev-theme PAPER) or back on the gray page, and its
 * Pattern switch puts the light stages on another grid (Stage STAGE_PATTERN). The
 * controls are the FIELDS list, drawn as it stands. The panel is a chrome
 * tone, like the site's islands, so a two-tone look reaches it too. */

/** A look in miniature: its top bar and side rail, its page, a card on it, a floating island, and the accent. */
function PresetCard({ preset, mode, active, edited, onPick }: { preset: DevPreset; mode: Mode; active: boolean; edited: boolean; onPick: () => void }) {
  const s = useMemo(() => presetSwatch(preset, preset.mode ?? mode), [preset, mode])
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onPick}
      className={cn('flex min-w-0 flex-col gap-1.5 rounded-lg p-1.5 text-start transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring', active && 'bg-selected hover:bg-selected')}
    >
      <span aria-hidden className="relative block h-12 overflow-hidden rounded-md" style={{ background: s.page, boxShadow: `inset 0 0 0 1px ${s.line}` }}>
        <span className="absolute inset-x-0 top-0 flex h-3 items-center gap-1 px-1.5" style={{ background: s.bar }}>
          <span className="size-1.5 rounded-full" style={{ background: s.accent }} />
          <span className="h-0.5 w-5 rounded-full" style={{ background: s.barFg }} />
        </span>
        <span className="absolute start-0 top-3 bottom-0 w-3.5" style={{ background: s.chrome }} />
        <span className="absolute end-1.5 top-[1.125rem] bottom-1.5 start-5 flex items-end rounded-[3px] p-1" style={{ background: s.card, boxShadow: `0 0 0 1px ${s.line}` }}>
          <span className="h-1.5 w-5 rounded-full" style={{ background: s.accent }} />
        </span>
        <span className="absolute bottom-1 left-1/2 h-1.5 w-6 -translate-x-1/4 rounded-full" style={{ background: s.float, boxShadow: `0 0 0 1px ${s.floatLine}` }} />
      </span>
      <span className="min-w-0 px-0.5">
        <span className="block truncate text-ui-sm font-medium text-fg">{preset.name}</span>
        <span className="block truncate text-ui-xs text-fg-muted">{active && edited ? 'Edited' : preset.note}</span>
      </span>
    </button>
  )
}

/** Keeps a dragged panel under the header and inside the window. */
function clampOffset(el: HTMLElement, dx: number, dy: number, from: { x: number; y: number }) {
  const rect = el.getBoundingClientRect()
  const top = (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) + 8
  const x = Math.min(Math.max(dx, from.x - rect.left + 8), from.x + window.innerWidth - rect.right - 8)
  const y = Math.min(Math.max(dy, from.y - rect.top + top), from.y + window.innerHeight - rect.bottom - 8)
  return { x, y }
}

function FieldRow({ field, theme, mode, onChange }: { field: Field; theme: ReturnType<typeof devTheme>; mode: Mode; onChange: (patch: Overrides) => void }) {
  const resolved = resolveTheme(theme)
  if (field.kind === 'slider') {
    const value = field.read(resolved)
    return (
      <SliderRow
        label={field.label}
        value={value}
        min={field.min}
        max={field.max}
        step={field.step}
        format={(v) => v.toFixed(field.digits)}
        onChange={(v) => onChange(field.write(round(v, field.digits)))}
      />
    )
  }
  if (field.kind === 'color') {
    return (
      <InspectorRow label={field.label}>
        <ColorField id={`dev-${field.id}`} label={field.label} value={field.read(resolved, mode)} onChange={(v) => onChange(field.write(v))} />
      </InspectorRow>
    )
  }
  // Two or three choices read at a glance as a segmented row; more get a menu.
  if (field.options.length <= 3) {
    return (
      <InspectorRow label={field.label}>
        <SegmentedControl aria-label={field.label} value={field.read(resolved)} onValueChange={(v) => onChange(field.write(v as string))} className="w-full">
          {field.options.map((o) => (
            <SegmentedControlItem key={o.value} value={o.value}>
              {o.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </InspectorRow>
    )
  }
  return <InspectorSelect label={field.label} value={field.read(resolved)} options={field.options} onChange={(v) => onChange(field.write(v))} />
}

export default function DevPanel({ onClose }: { onClose: () => void }) {
  const { resolvedTheme, setTheme } = useColorScheme()
  const mode: Mode = resolvedTheme === 'light' ? 'light' : 'dark'
  const [presetId, setPresetId] = useState(SITE_PRESET_ID)
  const [overrides, setOverrides] = useState<Overrides>({})
  const [stage, setStage] = useState<StageLook>('gray')
  const [pattern, setPattern] = useState<StagePattern>(STAGE_PATTERN)
  const [loaderColor, setLoaderColor] = useState<'mono' | 'theme'>('mono')
  const [collapsed, setCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const panel = useRef<HTMLDivElement>(null)
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)

  const theme = useMemo(() => devTheme(presetId, mode, overrides), [presetId, mode, overrides])
  const edited = Object.keys(overrides).length > 0
  useEffect(() => applyDevTheme(document.documentElement, theme), [theme])
  useEffect(() => applyStage(document.documentElement, stage), [stage])
  useEffect(() => applyStagePattern(document.documentElement, pattern), [pattern])
  // The menus' loaders in the theme's colors (feature-art.tsx reads it as a menu opens), for comparing in the real menu; Mono is the default.
  useEffect(() => {
    if (loaderColor === 'mono') return
    document.documentElement.dataset.loaderColor = loaderColor
    return () => void delete document.documentElement.dataset.loaderColor
  }, [loaderColor])

  const edit = (patch: Overrides) => setOverrides((current) => patchOverrides(current, patch))
  const pick = (p: DevPreset) => {
    setPresetId(p.id)
    setOverrides({})
    if (p.mode && p.mode !== mode) setTheme(p.mode)
  }
  const reset = () => {
    setOverrides({})
    setStage('gray')
    setPattern(STAGE_PATTERN)
    setLoaderColor('mono')
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(devSnippet(presetId, mode, overrides))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked: nothing to confirm.
    }
  }

  const onDragStart = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onDragMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !panel.current) return
    setOffset(clampOffset(panel.current, d.ox + e.clientX - d.px, d.oy + e.clientY - d.py, offset))
  }

  const groups = [...new Set(FIELDS.map((f) => f.group))]

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Theme inputs"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, maxHeight: 'calc(100dvh - var(--header-height) - 1.5rem)' }}
      data-yj-tone="float"
      className="fixed right-3 bottom-3 z-40 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-xl border border-line bg-chrome-float text-fg shadow-lg"
    >
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={() => (drag.current = null)}
        className="flex h-9 shrink-0 cursor-grab touch-none items-center gap-2 border-b border-line px-3 select-none active:cursor-grabbing"
      >
        <PaletteIcon size={14} className="text-fg-muted" />
        <span className="flex-1 text-ui-sm font-medium">Theme inputs</span>
        <Button variant="ghost" size="icon-xs" aria-label={collapsed ? 'Expand panel' : 'Collapse panel'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="Close panel" onClick={onClose}>
          <XIcon size={14} />
        </Button>
      </div>
      {!collapsed && (
        <>
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain p-3">
            <InspectorSection title="Presets">
              <div className="-mx-1.5 grid grid-cols-2 gap-0.5">
                {DEV_PRESETS.map((p) => (
                  <PresetCard key={p.id} preset={p} mode={mode} active={p.id === presetId} edited={edited} onPick={() => pick(p)} />
                ))}
              </div>
            </InspectorSection>
            <InspectorSection title="Quick">
              <InspectorRow label="Mode">
                <SegmentedControl aria-label="Mode" value={mode} onValueChange={setTheme} className="w-full">
                  <SegmentedControlItem value="light">Light</SegmentedControlItem>
                  <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                </SegmentedControl>
              </InspectorRow>
              <InspectorRow label="Stage">
                <SegmentedControl aria-label="Stage" value={stage} onValueChange={(s) => setStage(s as StageLook)} className="w-full">
                  <SegmentedControlItem value="gray">Gray</SegmentedControlItem>
                  <SegmentedControlItem value="paper">Paper</SegmentedControlItem>
                </SegmentedControl>
              </InspectorRow>
              <InspectorRow label="Pattern">
                <SegmentedControl aria-label="Stage pattern" value={pattern} onValueChange={(p) => setPattern(p as StagePattern)} className="w-full">
                  <SegmentedControlItem value="none">None</SegmentedControlItem>
                  <SegmentedControlItem value="blueprint">Grid</SegmentedControlItem>
                  <SegmentedControlItem value="iso">Iso</SegmentedControlItem>
                  <SegmentedControlItem value="lines">Lines</SegmentedControlItem>
                  <SegmentedControlItem value="dots">Dots</SegmentedControlItem>
                </SegmentedControl>
              </InspectorRow>
              <InspectorRow label="Loader color">
                <SegmentedControl aria-label="Menu loader color" value={loaderColor} onValueChange={(c) => setLoaderColor(c as 'mono' | 'theme')} className="w-full">
                  <SegmentedControlItem value="mono">Mono</SegmentedControlItem>
                  <SegmentedControlItem value="theme">Theme</SegmentedControlItem>
                </SegmentedControl>
              </InspectorRow>
            </InspectorSection>
            {groups.map((group) => (
              <InspectorSection key={group} title={group}>
                {FIELDS.filter((f) => f.group === group).map((field) => (
                  <FieldRow key={field.id} field={field} theme={theme} mode={mode} onChange={edit} />
                ))}
              </InspectorSection>
            ))}
          </div>
          <div className="flex shrink-0 gap-2 border-t border-line p-3">
            <Button variant="outline" size="sm" className="flex-1" disabled={!edited && stage === 'gray' && pattern === STAGE_PATTERN && loaderColor === 'mono'} onClick={reset} title={`Back to ${devPreset(presetId).name}`}>
              <RotateCcwIcon size={13} /> Reset
            </Button>
            <Button size="sm" className="flex-1" onClick={copy}>
              {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />} {copied ? 'Copied' : 'Copy values'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
