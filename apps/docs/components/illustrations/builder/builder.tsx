'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type Dispatch, type KeyboardEvent, type ReactNode, type RefObject, type SetStateAction } from 'react'
import { ArrowRightIcon, RedoIcon, UndoIcon } from '@youj/icons'
import { DEFAULT_LOOK, YoujProvider, ThemeScope, useYouj } from '@youj/core'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { AsyncButton, Kbd, ScrollArea, Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@youj/react'
import { useDocked } from '@/components/icons/adaptive'
import { ButtonLink } from '@/components/ui/button-link'
import { Segmented } from '@/components/ui/controls'
import { TOOLBAR_BUTTON } from '@/components/ui/preview-controls'
import { cn } from '@/lib/cn'
import { sitePreset } from '@/lib/preview'
import { DEFAULT_PREVIEW, PreviewControls, usePreviewTheme, type PreviewSettings } from '../preview'
import { ExplorerViews } from '../views'
import { Canvas, UNIT, VIEW, type CanvasHandle } from './canvas'
import { ExportPanel } from './export-panel'
import { CANVAS_HELP, HelpPopover } from './help'
import { commit, redo as redoStep, startHistory, undo as undoStep, type History } from '@youj/illustrations/builder'
import { Layers } from './layers'
import {
  cleanName,
  decodeScene,
  duplicateParts,
  encodeScene,
  groupParts,
  moveParts,
  nextId,
  nudge,
  partNames,
  placeNew,
  removeParts,
  tidyGroups,
  ungroupParts,
  updateParts,
  type BuilderScene,
  type Part,
} from '@youj/illustrations/builder'
import { Palette } from './palette'
import { Properties, type PartAction } from './properties'
import { BuiltScene } from '@youj/illustrations/builder'
import { DEFAULT_TEMPLATE, type Template } from '@youj/illustrations/builder'
import { Stage as SiteStage } from '@/components/site/stage'
import { copyToast } from '@/lib/copy-toast'

/* The illustration builder (experimental): new scenes made from the kit's parts on
 * the shared 8 × 8 floor, and taken home as code, SVG, PNG or JSON. A studio
 * in three columns: the parts and the layers on the inline start, the canvas
 * (edit, or a live preview in any preset and scheme), and the properties
 * on the inline end, with the export's actions on its bottom edge (the code
 * opens in the site's large code modal). The scene is data (model.ts), drawn by the
 * kit and written out from one spec, so the code draws what the canvas does.
 * It lives in the URL as you go, so a scene is a link, and in this browser's
 * storage, so a reload keeps it. Below a desktop width it shows the scene in
 * preview, with a note that building wants a larger screen. */

export const STORAGE_KEY = 'youj-illustration-builder'

/** The scene as the query string: its name (when it has one) and its parts, compact. */
export function builderQuery(scene: BuilderScene): string {
  const name = scene.name === 'Untitled' ? '' : `name=${encodeURIComponent(scene.name)}&`
  return `${name}s=${encodeScene(scene)}`
}

/** The scene a visit opens on: the link's, else the one this browser kept, else the first template. */
export function readStart(search: string): BuilderScene {
  const params = new URLSearchParams(search)
  const s = params.get('s')
  const linked = s ? decodeScene(s, params.get('name')) : null
  if (linked) return linked
  try {
    const kept = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as { s?: unknown; name?: unknown } | null
    const scene = typeof kept?.s === 'string' ? decodeScene(kept.s, typeof kept.name === 'string' ? kept.name : null) : null
    if (scene) return scene
  } catch {
    // Storage blocked or unreadable: the template.
  }
  return DEFAULT_TEMPLATE.scene
}

const noop = () => () => {}
const useOrigin = () =>
  useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => '',
  )

type Mode = 'edit' | 'preview'

export function IllustrationBuilder() {
  const docked = useDocked()
  const [history, setHistory] = useState<History>(() => startHistory(DEFAULT_TEMPLATE.scene))
  const [ready, setReady] = useState(false)
  const scene = history.present

  // The link's scene, read before the first paint, so a shared scene never flashes the template.
  useLayoutEffect(() => {
    setHistory(startHistory(readStart(window.location.search)))
    setReady(true)
  }, [])

  // Written back as it changes: the address (no history entry) and this browser's copy.
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      const next = `${window.location.pathname}?${builderQuery(scene)}`
      if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, '', next)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ s: encodeScene(scene), name: scene.name }))
      } catch {
        // Private mode or full: the link still holds it.
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [scene, ready])

  const origin = useOrigin()
  const link = `${origin}/illustrations/build?${builderQuery(scene)}`

  return (
    <div className="flex h-[calc(100dvh-var(--header-height))] min-h-[36rem] flex-col">
      {/* The gallery's toolbar row, the views in the same place: no visible title on either, the h1 for assistive technology. */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 md:px-4">
        <h1 className="sr-only">Illustration builder</h1>
        <ExplorerViews current="build" />
        <ButtonLink href="/docs/illustrations/draw-your-own#the-builder" variant="ghost" size="sm" className="ms-auto">
          <span className="max-sm:hidden">Drawing your own</span>
          <span className="sm:hidden">Docs</span>
          <ArrowRightIcon size={14} strokeWidth={1.75} className="rtl:-scale-x-100" />
        </ButtonLink>
      </header>
      {docked ? <Studio history={history} setHistory={setHistory} link={link} /> : <Narrow scene={scene} link={link} />}
    </div>
  )
}

/** The canvas's stage: the preview's preset and scheme scoped to it, and the still copy the downloads are made from. */
function Stage({ settings, scene, stillRef, children }: { settings: PreviewSettings; scene: BuilderScene; stillRef: RefObject<HTMLDivElement | null>; children: ReactNode }) {
  const site = useYouj()
  const { preset, mode, themed } = usePreviewTheme(settings)
  const reduced = settings.reduced || site.reduced
  return (
    <YoujProvider timeScale={site.timeScale} reducedMotion={reduced ? 'always' : 'user'} look={DEFAULT_LOOK}>
      <ThemeScope theme={themed ? sitePreset(preset) : undefined}>
        <SiteStage theme={themed ? preset : undefined} mode={mode} data-slot="illustration-stage" className="relative isolate flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-canvas">
          {children}
          <div ref={stillRef} aria-hidden inert className="pointer-events-none fixed -start-[200vw] top-0 w-[400px]">
            <YoujProvider reducedMotion="always">
              <BuiltScene scene={scene} assemble={false} float={false} explode={settings.apart ? 1 : 0} unit={UNIT} />
            </YoujProvider>
          </div>
        </SiteStage>
      </ThemeScope>
    </YoujProvider>
  )
}

/** The scene live, as it ships: assembling, bobbing and coming apart on hover (or held apart), framed where the canvas frames it. */
function Preview({ scene, settings, replay }: { scene: BuilderScene; settings: PreviewSettings; replay: number }) {
  const k = useYouj()
  return (
    <div className="grid min-h-0 flex-1 place-items-center overflow-hidden [container-type:size]">
      <div className="relative" style={{ width: `min(100cqw, calc(100cqh * ${VIEW.width / VIEW.height}))`, aspectRatio: `${VIEW.width} / ${VIEW.height}` }}>
        <BuiltScene key={`${replay}-${k.reduced}`} scene={scene} assemble float explode={settings.apart ? 1 : 'hover'} unit={UNIT} grow title={scene.name} />
      </div>
    </div>
  )
}

function Studio({ history, setHistory, link }: { history: History; setHistory: Dispatch<SetStateAction<History>>; link: string }) {
  const id = useId()
  const scene = history.present
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<CanvasHandle>(null)
  const canvasEl = useRef<HTMLDivElement>(null)
  const still = useRef<HTMLDivElement>(null)
  const [picked, setSelected] = useState<string[]>([])
  const [mode, setMode] = useState<Mode>('edit')
  const [settings, setSettings] = useState<PreviewSettings>(DEFAULT_PREVIEW)
  const [replay, setReplay] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const names = useMemo(() => partNames(scene), [scene])
  const { preset, mode: scheme } = usePreviewTheme(settings)
  const look = `${internalPresetById(preset).name}, ${scheme}`

  // Only parts that are still there are selected (an undo can take one away).
  const selected = useMemo(() => picked.filter((pid) => scene.parts.some((p) => p.id === pid)), [picked, scene])

  const say = useCallback((message: string) => setAnnouncement((prev) => (prev === message ? `${message}​` : message)), [])
  const change = useCallback((next: (s: BuilderScene) => BuilderScene, key?: string) => setHistory((h) => commit(h, next(h.present), key)), [setHistory])
  const where = (p: Part) => `x ${p.x}, y ${p.y}, z ${p.z}`

  const add = (part: Part, dropped: boolean) => {
    const pid = nextId(scene.parts.map((p) => p.id), 'p')
    const placed = dropped ? { ...part, id: pid } : placeNew(scene, { ...part, id: pid })
    change((s) => ({ ...s, parts: [...s.parts, placed] }))
    setSelected([pid])
    setMode('edit')
    say(`${partNames({ ...scene, parts: [...scene.parts, placed] }).get(pid)} added at ${where(placed)}.`)
  }

  const act = (action: PartAction) => {
    if (!selected.length) return
    if (action === 'delete') {
      change((s) => removeParts(s, selected))
      say(`${selected.length === 1 ? names.get(selected[0]!) : `${selected.length} parts`} deleted.`)
      setSelected([])
    } else if (action === 'duplicate') {
      const out = duplicateParts(scene, selected)
      change(() => out.scene)
      setSelected(out.ids)
      say(`Duplicated ${out.ids.length === 1 ? 'a part' : `${out.ids.length} parts`}.`)
    } else if (action === 'group') {
      const out = groupParts(scene, selected)
      if (out.group) {
        change(() => out.scene)
        say(`Grouped ${selected.length} parts.`)
      }
    } else {
      change((s) => ungroupParts(s, selected))
      say('Ungrouped.')
    }
  }

  const undo = () => {
    if (!history.past.length) return say('Nothing to undo.')
    setHistory(undoStep)
    say('Undone.')
  }
  const redo = () => {
    if (!history.future.length) return say('Nothing to redo.')
    setHistory(redoStep)
    say('Redone.')
  }

  const toggleMode = () => setMode((m) => (m === 'edit' ? 'preview' : 'edit'))

  // The builder's shortcuts, from anywhere in it that isn't a text field (and not from a menu it opened).
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!root.current?.contains(e.target as Node) || e.defaultPrevented) return
    const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')
    const mod = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()
    if (mod && (key === 'z' || key === 'y')) {
      if (typing) return
      e.preventDefault()
      return key === 'y' || e.shiftKey ? redo() : undo()
    }
    if (typing || e.altKey) return
    if (mod && key === 'd') {
      e.preventDefault()
      act('duplicate')
    } else if (mod && key === 'g') {
      e.preventDefault()
      act(e.shiftKey ? 'ungroup' : 'group')
    } else if (mod && key === 'a') {
      e.preventDefault()
      setSelected(scene.parts.map((p) => p.id))
    } else if (!mod && (e.key === 'Delete' || e.key === 'Backspace') && selected.length) {
      e.preventDefault()
      act('delete')
    } else if (!mod && e.key === 'Escape' && selected.length) {
      e.preventDefault()
      setSelected([])
    } else if (!mod && key === 'p' && !e.repeat) {
      e.preventDefault()
      toggleMode()
    }
  }

  // Arrows and Page Up/Down move the selection when the canvas has focus; a run of presses is one step to undo.
  const onCanvasKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const next = nudge(scene, selected, e.key, e.shiftKey)
    if (!next) return
    e.preventDefault()
    change(() => next, `nudge:${selected.join(',')}`)
    const moved = next.parts.find((p) => p.id === selected.at(-1))
    if (moved) say(`${selected.length > 1 ? `${selected.length} parts` : names.get(moved.id)} at ${where(moved)}.`)
  }

  const select = useCallback((ids: string[]) => setSelected(ids), [])

  return (
    <TooltipProvider>
      <div ref={root} onKeyDown={onKeyDown} className="grid min-h-0 flex-1 grid-cols-[15.5rem_minmax(0,1fr)_19.5rem] gap-2 p-2">
        <aside aria-label="Parts and layers" className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <section aria-labelledby={`${id}-parts`} className="flex shrink-0 flex-col gap-2 border-b border-line p-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id={`${id}-parts`} className="text-ui-sm font-medium text-fg">
                Parts
              </h2>
              <span className="text-[11px] text-fg-subtle">Drag or press</span>
            </div>
            <Palette canvas={canvas} onAdd={add} />
          </section>
          <section aria-labelledby={`${id}-layers`} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-baseline justify-between gap-2 px-3 pt-3 pb-2">
              <h2 id={`${id}-layers`} className="text-ui-sm font-medium text-fg">
                Layers
              </h2>
              <span className="type-label text-fg-subtle tabular-nums">{scene.parts.length}</span>
            </div>
            <ScrollArea className="min-h-0 flex-1" viewportClassName="px-2 pb-2">
              <Layers
                scene={scene}
                names={names}
                selected={selected}
                onSelect={select}
                onEnter={() => canvasEl.current?.querySelector<HTMLElement>('[role=application]')?.focus()}
                onRename={(pid, name) => {
                  change((s) => updateParts(s, [pid], (p) => ({ ...p, name: cleanName(name) })))
                  say(cleanName(name) ? `Renamed ${cleanName(name)}.` : 'Name cleared.')
                }}
                onKeyDown={() => {}}
              />
            </ScrollArea>
          </section>
        </aside>

        <section aria-label="Canvas" className="flex min-h-0 min-w-0 flex-col gap-2">
          <div className="flex h-control-xs shrink-0 items-center gap-1.5">
            <Segmented
              label="Mode"
              compact
              value={mode}
              onChange={setMode}
              options={[
                { value: 'edit', label: 'Edit', title: 'Edit (P)' },
                { value: 'preview', label: 'Preview', title: 'Preview (P)' },
              ]}
            />
            <span aria-hidden className="mx-1 h-4 w-px bg-line" />
            <ToolButton label="Undo" keys="⌘Z" shortcut="Meta+Z Control+Z" disabled={!history.past.length} onClick={undo}>
              <UndoIcon size={15} strokeWidth={1.75} />
            </ToolButton>
            <ToolButton label="Redo" keys="⇧⌘Z" shortcut="Shift+Meta+Z Control+Y" disabled={!history.future.length} onClick={redo}>
              <RedoIcon size={15} strokeWidth={1.75} />
            </ToolButton>
            <div className="ms-auto flex min-w-0 items-center gap-1.5">
              {mode === 'preview' && (
                <PreviewControls settings={settings} onChange={(patch) => setSettings((p) => ({ ...p, ...patch }))} onReplay={() => setReplay((r) => r + 1)} />
              )}
              <HelpPopover />
            </div>
          </div>
          <Stage settings={settings} scene={scene} stillRef={still}>
            <div ref={canvasEl} className="flex min-h-0 flex-1 flex-col p-2">
              {mode === 'edit' ? (
                <Canvas
                  ref={canvas}
                  scene={scene}
                  selected={selected}
                  names={names}
                  onSelect={select}
                  onMove={(ids, dx, dy, dz) => {
                    change((s) => moveParts(s, ids, dx, dy, dz))
                    const moved = moveParts(scene, ids, dx, dy, dz).parts.find((p) => p.id === ids.at(-1))
                    if (moved) say(`${ids.length > 1 ? `${ids.length} parts` : names.get(moved.id)} moved to ${where(moved)}.`)
                  }}
                  onResize={(part) => change((s) => updateParts(s, [part.id], () => part))}
                  onKeyDown={onCanvasKey}
                  describedBy={`${id}-help`}
                />
              ) : (
                <Preview scene={scene} settings={settings} replay={replay} />
              )}
            </div>
          </Stage>
          <p id={`${id}-help`} className="sr-only">
            {CANVAS_HELP}
          </p>
          <div role="status" aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </section>

        <aside aria-labelledby={`${id}-design`} className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex h-11 shrink-0 items-center border-b border-line px-4">
            <h2 id={`${id}-design`} className="text-ui-sm font-medium text-fg">
              Design
            </h2>
          </div>
          <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4">
            <Properties
              scene={scene}
              selected={selected}
              names={names}
              onParts={(ids, patch, key) => change((s) => updateParts(s, ids, patch), key)}
              onScene={(patch, key) => change((s) => ({ ...s, ...patch, name: patch.name !== undefined ? patch.name.slice(0, 40) || 'Untitled' : s.name }), key)}
              onGroupChange={(gid, patch, key) => change((s) => tidyGroups({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, ...patch } : g)) }), key)}
              onAction={act}
              onTemplate={(t: Template) => {
                change(() => t.scene)
                setSelected([])
                say(`Started from ${t.name}.`)
              }}
            />
          </ScrollArea>
          <div className="shrink-0 border-t border-line p-2.5">
            <ExportPanel scene={scene} link={link} still={still} look={look} />
          </div>
        </aside>
      </div>
    </TooltipProvider>
  )
}

function ToolButton({ label, keys, shortcut, disabled, onClick, children }: { label: string; keys: string; shortcut: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<button type="button" onClick={onClick} aria-label={label} aria-keyshortcuts={shortcut} aria-disabled={disabled || undefined} className={cn(TOOLBAR_BUTTON, disabled && 'opacity-40')} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        {label}
        <Kbd>{keys}</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

/** Below a desktop width: the scene in preview, and a word about where building works best. */
function Narrow({ scene, link }: { scene: BuilderScene; link: string }) {
  const [settings, setSettings] = useState<PreviewSettings>(DEFAULT_PREVIEW)
  const [replay, setReplay] = useState(0)
  const still = useRef<HTMLDivElement>(null)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      <div role="note" className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-[13.5px] font-medium text-fg">The builder is best on a larger screen</p>
        <p className="text-[12.5px] leading-relaxed text-pretty text-fg-muted">
          Dragging parts wants a pointer and room for its panels. Here’s {scene.name === 'Untitled' ? 'the scene' : scene.name} in preview; open this page on a desktop to build it, or browse the finished scenes meanwhile.
        </p>
        <ButtonLink href="/illustrations" variant="outline" size="sm" className="mt-2 self-start">
          Browse the gallery
        </ButtonLink>
      </div>
      <div className="flex aspect-[5/4] min-h-0 flex-col">
        <Stage settings={settings} scene={scene} stillRef={still}>
          <Preview scene={scene} settings={settings} replay={replay} />
        </Stage>
      </div>
      <PreviewControls settings={settings} onChange={(patch) => setSettings((p) => ({ ...p, ...patch }))} onReplay={() => setReplay((r) => r + 1)} />
      <AsyncButton variant="outline" onAction={() => navigator.clipboard.writeText(link).then(() => copyToast('Link copied', 'To this illustration.'))} successLabel="Copied" errorLabel="Blocked">
        Send to desktop: copy the link
      </AsyncButton>
    </div>
  )
}
