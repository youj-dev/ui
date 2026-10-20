'use client'

import { lazy, Suspense, useDeferredValue, useRef, useState, type Ref } from 'react'
import { ThemeScope, useYouj } from '@youj/core'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { LayersIcon, RefreshIcon } from '@youj/icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react'
import { Segmented } from '@/components/ui/controls'
import { cn } from '@/lib/cn'
import { IslandButton, returnFocus } from '@/components/explorer/island'
import { useCoarse } from '@/components/icons/adaptive'
import { backdropForPreset } from '@/lib/backdrops'
import { SiteSwatch } from '@/components/showcase/preview-island'
import { Swatch } from '@/components/showcase/theme-tag'
import { PanelActions, PanelLink, PanelNote, PanelRow, PanelSection, ShowroomHero, StageReadout, type ShowroomHeroProps, type StageView } from '@/components/showroom/hero'
import { useStageScheme } from '@/components/showroom/hooks'
import type { ComponentDoc } from '@/lib/props'
import { modePreset, previewPresets, sitePreset } from '@/lib/preview'
import type { BlockLink, SceneEntry } from './catalog'
import { contextFor } from './context-copy'
import { download, fileName, naturalSize, rasterize, serializeScene } from './export'
import { usePreviewTheme } from './preview'
import type { SceneDownload } from './scene-code-dialog'
import { byIdSnippet } from './snippets'
import { SceneStage } from './stage'
import { Stage } from '@/components/site/stage'

/* The illustrations' hero, on the showroom's (components/showroom/hero): the scene on show, live, on the stage
 * (./stage: in the screen it would live in, or alone), its motion printed on the paper (assembling, floating, apart,
 * still). The stage's toolbar is the shell's (light or dark, reduced motion, fullscreen), with Replay and Apart ahead of
 * it and In context, which takes the screen away to show the scene alone and brings it back. The panel is the scene's
 * name, category and component and what it shows (its tags are the search's words, not the panel's); then the theme it's
 * drawn in (any preset, and the colors it takes from it) and the actions: Use it, the large code modal (the usage, the
 * install, the downloads, the props, the blocks that take it, the source), and Copy code. The stage's settings are the
 * viewer's: they stay as the scene changes (but light or dark follows the site again). */

/** The code modal comes with its first opening. */
const SceneCodeDialog = lazy(() => import('./scene-code-dialog').then((m) => ({ default: m.SceneCodeDialog })))

export interface SceneHeroProps {
  scene: SceneEntry
  /** Its place in the registry's order, from 1, and how many there are: announced as it changes. */
  index: number
  total: number
  /** The props every scene takes, for the code modal (read on the server). */
  props: ComponentDoc
  /** The blocks with an illustration slot, for the code modal. */
  blocks: BlockLink[]
  /** Opens the search narrowed to the category. */
  onCategory: (category: string) => void
  /** Every scene's viewfinder, and where it stands from lg: an island on the stage, a column beside it, or none here (a bar in the explorer). */
  viewfinder?: ShowroomHeroProps['viewfinder']
  presentation?: ShowroomHeroProps['presentation']
  /** The search beside the viewfinder. */
  search?: ShowroomHeroProps['search']
  ref?: Ref<HTMLElement>
}

const icon = { size: 15, strokeWidth: 1.75 } as const

export function SceneHero({ scene, index, total, props, blocks, onCategory, viewfinder, presentation, search, ref }: SceneHeroProps) {
  const site = useYouj()
  const touch = useCoarse()
  const { scheme, setScheme, mounted } = useStageScheme(scene.id)
  // In context by default: the item set in a screen it would live in; Raw is the item alone on the paper.
  const [view, setView] = useState<StageView>('context')
  const context = view === 'context'
  const [reduced, setReduced] = useState(false)
  const [preset, setPreset] = useState<ThemeId | null>(null)
  const [apart, setApart] = useState(false)
  // Colour: off (mono) by default, or the theme's hues, or hues picked here ('' keeps the theme's).
  const [coloured, setColoured] = useState(false)
  const [hues, setHues] = useState<string[]>(['', ''])
  const colors = !coloured ? undefined : hues.some(Boolean) ? hues : 'theme'
  const [replay, setReplay] = useState(0)
  // Whether the pointer is on the scene, and whether it's assembling: each about the scene it was said of.
  const [hover, setHover] = useState({ id: '', on: false })
  const [assembly, setAssembly] = useState({ id: '', on: false })
  const hovering = hover.id === scene.id && hover.on
  const assembling = assembly.id === scene.id && assembly.on
  const [wantStill, setWantStill] = useState(false)
  const still = useRef<SVGSVGElement | null>(null)
  // The stage takes a new scene in a render of its own, after the panel and the strip have answered the step: drawing a
  // scene is the step's heaviest work, and a run of quick steps draws only the scene they stop on.
  const staged = useDeferredValue(scene)
  const copy = contextFor(staged)
  // Reduced motion, the stage's or the site's: the scene drawn finished and still.
  const resting = reduced || site.reduced
  const motion = motionState({ still: resting, assembling, apart, hovering, touch })
  const theme = usePreviewTheme({ preset, mode: scheme, apart: false, reduced: false })
  // A picked mood brings its backdrop, as in a block preview.
  const backdrop = backdropForPreset(theme.themed ? theme.preset : null)
  // The code modal, mounted with its first opening (which also draws the still copy the downloads are made from).
  const [code, setCode] = useState<{ open: boolean } | null>(null)
  const opener = useRef<HTMLElement | null>(null)

  return (
    <>
      <ShowroomHero
        ref={ref}
        siteLook={!theme.themed}
        backdrop={backdrop?.id}
        viewfinder={viewfinder}
        presentation={presentation}
        search={search}
        eyebrow="Illustrations"
        links={
          <>
            <PanelLink href="/docs/illustrations">Docs</PanelLink>
            <PanelLink href="/illustrations/build">Builder</PanelLink>
          </>
        }
        itemKey={scene.id}
        itemClassName="in-data-[scene-link]:invisible"
        name={scene.name}
        nameId="illustration-name"
        announce={`${scene.name}, ${index} of ${total}`}
        byline={[
          <button
            key="category"
            type="button"
            onClick={() => onCategory(scene.category)}
            className="rounded-sm underline-offset-4 hover:underline focus-ring"
            aria-label={`${scene.categoryName}: search the category`}
          >
            {scene.categoryName}
          </button>,
          <code key="component" className="font-mono text-[12.5px]">
            {scene.component}
          </code>,
        ]}
        description={scene.description || undefined}
        stage={
          mounted ? (
            <SceneStage
              scene={staged}
              copy={copy}
              context={context}
              scheme={scheme}
              preset={preset}
              backdrop={context && backdrop !== null}
              apart={apart}
              colors={theme.preset === modePreset(theme.mode === 'dark') ? undefined : colors}
              reduced={reduced}
              replay={replay}
              still={wantStill}
              stillRef={still}
              onHover={(on) => setHover({ id: staged.id, on })}
              onAssembling={(on) => setAssembly({ id: staged.id, on })}
            />
          ) : null
        }
        readout={<StageReadout label="Motion" value={mounted ? motion.value : undefined} state={mounted ? motion.state : undefined} live={mounted && !resting} loading={!mounted} />}
        scheme={scheme}
        onSchemeChange={setScheme}
        reduced={resting}
        onReducedChange={setReduced}
        transport={
          <>
            <IslandButton label="Replay the assemble" disabled={resting} onClick={() => setReplay((r) => r + 1)}>
              <RefreshIcon {...icon} />
            </IslandButton>
            <IslandButton label="Take it apart" aria-pressed={apart} onClick={() => setApart(!apart)}>
              <LayersIcon {...icon} active={apart} />
            </IslandButton>
          </>
        }
        view={view}
        onViewChange={setView}
        toolbarLabel={`${scene.name}: view`}
        copy={byIdSnippet(scene, { colors })}
        actions={
          <PanelActions
            onUse={(from) => {
              opener.current = from
              setWantStill(true)
              setCode({ open: true })
            }}
          />
        }
      >
        <PanelSection id="illustration-theme" title="Theme" end={<PanelNote>Your theme’s tokens, never baked in</PanelNote>}>
          <Colors theme={theme} onPreset={setPreset} />
          <Colour theme={theme} coloured={coloured} onColoured={setColoured} hues={hues} onHues={setHues} />
        </PanelSection>
      </ShowroomHero>
      {code && (
        <Suspense fallback={null}>
          <SceneCodeDialog
            scene={scene}
            blocks={blocks}
            props={props}
            download={{ look: `${presetName(theme.preset)}, ${theme.mode}`, save: (kind, scale, transparent) => save(still.current, scene, kind, scale, transparent) }}
            look={{ preset: theme.preset, mode: theme.mode, themed: theme.themed }}
            open={code.open}
            onOpenChange={(open) => setCode({ open })}
            finalFocus={returnFocus(opener)}
          />
        </Suspense>
      )}
    </>
  )
}

/** What the scene is doing now, for the readout: its state and a line on it (on touch, where nothing is pointed at, how to part it). */
export function motionState({ still, assembling, apart, hovering, touch = false }: { still: boolean; assembling: boolean; apart: boolean; hovering: boolean; touch?: boolean }) {
  if (still) return { value: 'Still', state: 'Reduced motion · drawn finished' }
  if (assembling) return { value: 'Assembling', state: 'Parts drop in, far ones first' }
  if (apart) return { value: 'Apart', state: 'Held apart · each part lifted' }
  if (hovering) return { value: 'Apart', state: 'While the pointer is on it' }
  return { value: 'Floating', state: touch ? 'Press Apart to take it apart' : 'Point at it to take it apart' }
}

const presetName = (preset: string) => `${preset[0]!.toUpperCase()}${preset.slice(1)}`

/** Makes a file of the still copy: SVG, or PNG at a scale, in the stage's theme, transparent or on its canvas. */
async function save(svg: SVGSVGElement | null, scene: SceneEntry, kind: 'svg' | 'png', scale: number, transparent: boolean): ReturnType<SceneDownload['save']> {
  if (!svg) throw new Error('The drawing isn’t ready')
  // The canvas behind the scene, read from the still copy's holder (the stage theme's canvas), unless it's left transparent.
  const holder = svg.closest('[data-slot=illustration-still]')
  const background = transparent || !holder ? undefined : getComputedStyle(holder).backgroundColor
  const text = serializeScene(svg, { title: scene.name, scale, background })
  if (kind === 'svg') download(text, fileName(scene.id, 'svg'))
  else {
    const { width, height } = naturalSize(svg)
    download(await rasterize(text, Math.round(width * scale), Math.round(height * scale)), fileName(scene.id, 'png', scale))
  }
}

const SWATCHES = [
  { name: 'Accent', token: '--color-accent', note: 'its hero part' },
  { name: 'Surface', token: '--color-surface', note: 'its faces, lit' },
  { name: 'Ink', token: '--color-fg', note: 'its faces, shaded, and its edges' },
] as const

/** The preset it's drawn in, and the colors it takes from it, as the stage shows them: two rows on the panel's grid. */
function Colors({ theme, onPreset }: { theme: ReturnType<typeof usePreviewTheme>; onPreset: (preset: ThemeId | null) => void }) {
  return (
    <>
      <PanelRow label="Preset">
        <PresetSelect value={theme.preset} dark={theme.mode === 'dark'} onChange={(next) => onPreset(next === modePreset(theme.mode === 'dark') ? null : next)} />
      </PanelRow>
      <PanelRow label="Colors">
        <ul aria-label="Its colors, from any preset, light or dark" className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          {SWATCHES.map((s) => (
            <li key={s.token} className="flex items-center gap-1.5 rounded-full border border-line py-0.5 ps-0.5 pe-2 text-[11.5px] text-fg-muted" title={`var(${s.token}): ${s.note}`}>
              {/* The color as the stage shows it: in the stage's preset and scheme, the label in the page's. */}
              <ThemeScope theme={theme.themed ? sitePreset(theme.preset) : undefined}>
                <Stage as="span" aria-hidden theme={theme.themed ? theme.preset : undefined} mode={theme.mode} className="size-4 rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_14%,transparent)]" style={{ background: `var(${s.token})` }} />
              </ThemeScope>
              {s.name}
            </li>
          ))}
        </ul>
      </PanelRow>
    </>
  )
}

const HUES = [
  { name: 'Hue 1', role: '--kg-hue-1', note: 'its main colour' },
  { name: 'Hue 2', role: '--kg-hue-2', note: 'a second kind of thing' },
] as const

/** Colour, as the scenes take it: off (mono) or the theme's hues, and each hue's own color if you pick one. */
function Colour({ theme, coloured, onColoured, hues, onHues }: { theme: ReturnType<typeof usePreviewTheme>; coloured: boolean; onColoured: (coloured: boolean) => void; hues: string[]; onHues: (hues: string[]) => void }) {
  const custom = hues.some(Boolean)
  return (
    <>
      <PanelRow label="Colour">
        <Segmented
          label="Colour"
          compact
          options={[
            { value: 'mono', label: 'Mono' },
            { value: 'theme', label: 'Theme' },
          ]}
          value={coloured ? 'theme' : 'mono'}
          onChange={(next) => onColoured(next === 'theme')}
        />
      </PanelRow>
      {coloured && (
        <PanelRow label="Hues">
          <div className="flex min-w-0 items-center gap-1.5">
            {HUES.map((h, i) => (
              <label
                key={h.role}
                className={cn('flex cursor-pointer items-center gap-1.5 rounded-full border border-line py-0.5 ps-0.5 pe-2 text-[11.5px] text-fg-muted focus-within:focus-ring')}
                title={hues[i] ? `${h.name}: ${hues[i]}` : `${h.name}: ${h.note}`}
              >
                <ThemeScope theme={theme.themed ? sitePreset(theme.preset) : undefined}>
                  <Stage as="span" aria-hidden data-yj-colors="" theme={theme.themed ? theme.preset : undefined} mode={theme.mode} className="size-4 rounded-full shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-fg)_14%,transparent)]" style={{ background: hues[i] || `var(${h.role})` }} />
                </ThemeScope>
                {h.name}
                <input
                  type="color"
                  className="sr-only"
                  aria-label={`${h.name}: pick a color`}
                  onChange={(e) => onHues(hues.map((c, k) => (k === i ? e.target.value : c)))}
                />
              </label>
            ))}
            {custom && (
              <button type="button" onClick={() => onHues(['', ''])} className="ms-1 rounded-sm text-[11.5px] text-fg-muted underline-offset-4 hover:underline focus-ring">
                Theme’s
              </button>
          )}
        </div>
      </PanelRow>
      )}
    </>
  )
}

/** The preset the stage draws in, as the panel's menu: every preset the library ships, the stage's mode's own first. */
function PresetSelect({ value, dark, onChange }: { value: ThemeId; dark: boolean; onChange: (preset: ThemeId) => void }) {
  const presets = previewPresets(dark)
  const modeDefault = modePreset(dark)
  return (
    <Select items={Object.fromEntries(presets.map((t) => [t.id, t.name]))} value={value} onValueChange={(next) => next && onChange(next as ThemeId)}>
      <SelectTrigger size="sm" aria-label={`Preset: ${internalPresetById(value).name}`} className="w-full min-w-0 gap-2 text-[12.5px]">
        {value === modeDefault ? <SiteSwatch /> : <Swatch preset={value} />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="min-w-(--anchor-width)">
        {presets.map((t) => (
          <SelectItem key={t.id} value={t.id} className="text-[12.5px]">
            {t.id === modeDefault ? <SiteSwatch /> : <Swatch preset={t.id} />}
            {t.name}
            {t.id === modeDefault && <span className="ms-auto ps-3 text-[11.5px] text-fg-muted">Default</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
