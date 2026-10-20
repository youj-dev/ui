'use client'

import { useId, useState, type CSSProperties } from 'react'
import { RotateCcwIcon } from '@youj/icons'
import { basalt, deriveTheme, isPerMode, type ActionFill, type BarTone, type ChromeTone, type ControlShape, type ControlSize, type MotionPersonality, type OverlayTone, type PerMode, type RadiusScale, type ShadowStyle, type ThemeColor, type ThemeInput } from '@youj/core'
import { composeTheme, DEFAULTS, deriveChart, formatOklch, LABEL_TRACKING, palettes, parseColor, RADIUS, styles, toHex, type ThemeStyle } from '@youj/core/lib/youj/theme'
import { Button } from '../components/ui/button'
import { ColorPicker, presetSwatches } from '../components/ui/color-picker'
import { Input } from '../components/ui/input'
import { Slider } from '../components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { cn } from '../lib/utils'
import { FAMILIES, fontOf, onlyWeight, pairingFonts, pairingOf, PAIRINGS, type FontFamily } from './create/fonts'
import { loadFonts } from './create/load-fonts'
import { InspectorAdvanced, InspectorRow, InspectorSection, InspectorSelect, InspectorSwitch, type InspectorOption } from './inspector'
import { closestPalette, closestStyle, draftFrom, STATUS, themeFrom, withPalette, withStyle, type Character, type Draft, type Status } from './theme-draft'

/* The theme builder's controls, as an inspector: the basics a theme is
 * mostly made of (palette, style, name, accent, typeface, radius, control size, motion personality,
 * shadow, actions, controls and the chrome and overlay tones) as one column of menus, and the fine-tuning (the neutral's lean,
 * status and chart colors, lines, type and labels) folded under Advanced.
 * The only sliders are the neutral's, whose values are continuous; the
 * colors have their color pickers. */

/* ── Option lists ─────────────────────────────────────────────────────── */

const px = (rem: string) => `${Math.round(parseFloat(rem) * 16)}px`

/** A corner, drawn at the radius it names. */
function Corner({ radius }: { radius: RadiusScale }) {
  return <span className="block size-3.5 border-s-[1.5px] border-t-[1.5px] border-current text-fg-muted" style={{ borderStartStartRadius: `min(${RADIUS[radius]}, 0.875rem)` }} />
}

const RADII: InspectorOption<RadiusScale>[] = (
  [
    ['none', 'None'],
    ['sm', 'Small'],
    ['md', 'Medium'],
    ['lg', 'Large'],
    ['xl', 'Larger'],
    ['full', 'Full'],
  ] as const
).map(([value, label]) => ({ value, label, detail: value === 'full' ? 'pills' : px(RADIUS[value]), glyph: <Corner radius={value} /> }))

const CONTROL_SIZES: InspectorOption<ControlSize>[] = [
  { value: 'compact', label: 'Compact', detail: '28px', note: 'Tighter rows for dense tools' },
  { value: 'default', label: 'Default', detail: '32px', note: 'The standard control height' },
  { value: 'comfortable', label: 'Comfortable', detail: '36px', note: 'More room around every control' },
]

const MOTIONS: InspectorOption<MotionPersonality>[] = [
  { value: 'precise', label: 'Precise', note: 'Quick and exact, no overshoot' },
  { value: 'calm', label: 'Calm', note: 'Longer and softer' },
  { value: 'lively', label: 'Lively', note: 'Shorter, with a touch of bounce' },
]

function ShadowGlyph({ shadow }: { shadow: ShadowStyle }) {
  return (
    <span
      className={cn(
        'block size-3.5 rounded-[3px] border border-line bg-canvas',
        shadow === 'soft' && 'shadow-[0_1px_3px_color-mix(in_oklab,var(--color-fg)_25%,transparent)]',
        shadow === 'hard' && 'border-fg shadow-[2px_2px_0_var(--color-fg)]',
      )}
    />
  )
}

const SHADOWS: InspectorOption<ShadowStyle>[] = [
  { value: 'soft', label: 'Soft', note: 'Blurred, tinted elevation', glyph: <ShadowGlyph shadow="soft" /> },
  { value: 'hard', label: 'Hard', note: 'Solid offsets in ink; buttons press in', glyph: <ShadowGlyph shadow="hard" /> },
  { value: 'none', label: 'None', note: 'Flat: borders only', glyph: <ShadowGlyph shadow="none" /> },
]

const ACTION_FILLS: InspectorOption<ActionFill>[] = [
  { value: 'accent', label: 'Accent', note: 'Primary buttons in the accent', glyph: <span className="block size-3.5 rounded-full bg-accent" /> },
  { value: 'ink', label: 'Ink', note: 'Primary buttons in the text color; the accent marks state', glyph: <span className="block size-3.5 rounded-full bg-fg" /> },
]

const CONTROL_SHAPES: InspectorOption<ControlShape>[] = [
  { value: 'pill', label: 'Pills', note: 'Buttons, tabs and toggles with round ends', glyph: <span className="block h-2.5 w-4 rounded-full border-[1.5px] border-current text-fg-muted" /> },
  { value: 'rounded', label: 'Rounded', note: 'The control radius, in proportion to each height', glyph: <span className="block h-2.5 w-4 rounded-[3px] border-[1.5px] border-current text-fg-muted" /> },
]

const CHROME_CHOICES: InspectorOption<ChromeTone>[] = [
  { value: 'match', label: 'Match', note: 'Bars and sidebars follow the page' },
  { value: 'dark', label: 'Dark', note: 'Two-tone in light mode: dark bars on a light page' },
  { value: 'light', label: 'Light', note: 'Two-tone in dark mode: light bars on a dark page' },
]

const OVERLAY_CHOICES: InspectorOption<OverlayTone>[] = [
  { value: 'content', label: 'Content', note: 'Menus and dialogs in the page’s mode' },
  { value: 'chrome', label: 'Chrome', note: 'Menus and dialogs in the chrome’s mode' },
  { value: 'ink', label: 'Ink', note: 'The page’s mode, the row under the pointer in ink' },
]

const BAR_CHOICES: InspectorOption<BarTone>[] = [
  { value: 'chrome', label: 'Chrome', note: 'Headers and sidebars take the chrome’s mode' },
  { value: 'content', label: 'Content', note: 'Headers and sidebars stay the page’s; only islands and toolbars change' },
  { value: 'top', label: 'Top', note: 'The header takes the chrome’s mode; sidebars stay the page’s' },
]

/** A chart palette in miniature: five stripes. */
function PaletteGlyph({ colors }: { colors: string[] }) {
  return (
    <span className="flex h-3.5 w-5 overflow-hidden rounded-[3px] border border-line">
      {colors.map((color, i) => (
        <span key={i} className="flex-1" style={{ background: color }} />
      ))}
    </span>
  )
}

type Palette = NonNullable<Draft['chart']>

/** A palette the draft can edit: its own copy, per mode when it's given per mode. */
const copyPalette = (chart: Palette | ThemeInput['chart']): Palette => (isPerMode(chart) ? { light: [...chart.light], dark: [...chart.dark] } : [...chart!])

/** Where "Own colors" starts when the theme has none: Basalt's series, tuned per mode. */
const STARTER_PALETTE = copyPalette(basalt.chart)

/** A color for a glyph: the light side of a pair, as the preset glyphs show light. */
const lightSide = <T,>(value: T | PerMode<T>): T => (isPerMode(value) ? value.light : value)

/** The two ways a theme colors its charts, each drawn from this draft's own colors. */
function chartOptions(draft: Draft): InspectorOption<'accent' | 'own'>[] {
  const drawn = deriveChart(themeFrom({ ...draft, chart: null }), 'light').map((c) => formatOklch(c!))
  return [
    { value: 'accent', label: 'From the accent', note: 'The accent, then four hues around it, each held to 3:1', glyph: <PaletteGlyph colors={drawn} /> },
    { value: 'own', label: 'Own colors', note: 'Five series colors, each held to 3:1', glyph: <PaletteGlyph colors={lightSide(draft.chart ?? STARTER_PALETTE)} /> },
  ]
}

/** Named steps for a number, plus the current value when it's between them (a link can carry any). */
function steps(values: [number, string, string?][], current: number, format: (n: number) => string): InspectorOption<string>[] {
  const options = values.map(([n, label, note]) => ({ value: String(n), label, detail: format(n), ...(note ? { note } : {}) }))
  if (!values.some(([n]) => n === current)) options.unshift({ value: String(current), label: 'Custom', detail: format(current) })
  return options
}

const LINE_WIDTHS: [number, string, string?][] = [
  [0.5, 'Fine'],
  [1, 'Hairline', 'The default'],
  [1.5, 'Medium'],
  [2, 'Bold'],
  [3, 'Heavy'],
  [4, 'Black'],
]
const INKS: [number, string, string?][] = [
  [0, 'Quiet', 'The neutral line color'],
  [0.35, 'Soft'],
  [0.65, 'Firm'],
  [1, 'Ink', 'Lines in the text color'],
]
const ICON_WEIGHTS: [number, string, string?][] = [
  [0.75, 'Light'],
  [1, 'Regular', 'As drawn'],
  [1.15, 'Medium'],
  [1.3, 'Bold'],
  [1.6, 'Heavy'],
]
const TITLE_WEIGHTS: [number, string, string?][] = [
  [300, 'Light'],
  [400, 'Regular'],
  [500, 'Medium'],
  [600, 'Semibold', 'The default'],
  [700, 'Bold'],
  [800, 'Extra bold'],
  [900, 'Black'],
]
const TITLE_TRACKINGS: [number, string, string?][] = [
  [-0.05, 'Tightest'],
  [-0.035, 'Tighter'],
  [-0.025, 'Tight', 'The default'],
  [-0.01, 'Snug'],
  [0, 'Normal'],
  [0.02, 'Open'],
]
const LABEL_TRACKINGS: [number, string, string?][] = [
  [0, 'None'],
  [0.02, 'Slight'],
  [0.04, 'Loose'],
  [0.06, 'Wide'],
  [0.1, 'Wider'],
]

const em = (n: number) => `${n > 0 ? '' : n < 0 ? '−' : ''}${Math.abs(n)}em`

/** A family's name, set in itself. */
const face = (f: FontFamily): CSSProperties => ({ fontFamily: f.stack })

/** Loads every web font the menus show, the first time one is about to open. */
const loadAll = () => loadFonts(FAMILIES)

function typefaceOptions(fonts: Draft['fonts']): InspectorOption<string>[] {
  const options: InspectorOption<string>[] = PAIRINGS.map((p) => {
    const f = pairingFonts(p)
    return { value: p.id, label: p.label, note: p.note, group: p.group, style: { fontFamily: f.display ?? f.sans, fontSize: '0.9375rem' } }
  })
  if (pairingOf(fonts)) return options
  const names = [fonts.sans, fonts.display, fonts.mono].map((s) => fontOf(s)?.label).filter(Boolean)
  return [{ value: 'custom', label: 'Custom', note: [...new Set(names)].join(', ') || 'Faces of your own', style: { fontFamily: fonts.display ?? fonts.sans } }, ...options]
}

const familyOptions = (kinds: FontFamily['kind'][]): InspectorOption<string>[] =>
  FAMILIES.filter((f) => kinds.includes(f.kind)).map((f) => ({ value: f.id, label: f.label, style: face(f), group: { sans: 'Sans', serif: 'Serif', mono: 'Mono' }[f.kind] }))

/** A stack the catalog doesn't know stays as the theme has it, listed first as Custom. */
const withCurrent = (options: InspectorOption<string>[], stack: string | undefined) =>
  !stack || fontOf(stack) ? options : [{ value: 'custom', label: 'Custom', note: stack, style: { fontFamily: stack } }, ...options]

/* ── The controls ─────────────────────────────────────────────────────── */

function PresetGlyph({ canvas, accent }: { canvas: string; accent: string }) {
  return (
    <span className="relative block size-3.5 rounded-full border border-line" style={{ background: canvas }}>
      <span className="absolute inset-[3px] rounded-full" style={{ background: accent }} />
    </span>
  )
}

const PALETTES: InspectorOption<string>[] = palettes.map((p) => {
  const light = deriveTheme(p).light
  return { value: p.id, label: p.name, note: p.description?.split('.')[0], glyph: <PresetGlyph canvas={light.canvas} accent={light.accent} /> }
})

const STYLES: InspectorOption<string>[] = styles.map((s) => ({ value: s.id, label: s.name, note: s.description, style: { fontFamily: s.fonts?.sans } }))

/** A color as the picker reads it: any CSS color the theme takes, shown as hex. */
const pickable = (color: string) => {
  const rgb = parseColor(color)
  return rgb ? toHex(rgb) : color
}

/** Sits beside a row's label: small, so the control keeps its width, with a 24px target and the name in a tooltip. */
export function ResetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={label} onClick={onClick} className="size-6 shrink-0 text-fg-muted" />}>
        <RotateCcwIcon size={13} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function SliderRow(props: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <InspectorRow label={props.label}>
      <Slider
        aria-label={props.label}
        value={[props.value]}
        min={props.min}
        max={props.max}
        step={props.step}
        onValueChange={(v) => props.onChange(Array.isArray(v) ? v[0]! : (v as number))}
        className="min-w-0 flex-1"
      />
      <span className="w-11 shrink-0 text-end text-ui-xs text-fg tabular-nums">{props.format(props.value)}</span>
    </InspectorRow>
  )
}

/** Sliders step in binary fractions; the theme keeps the decimal the step meant. */
export const round = (value: number, places: number) => Number(value.toFixed(places))

/**
 * One color picker, or two for a color a preset tunes per mode: light and
 * dark side by side, each edited on its own, so the pair stays a pair.
 */
export function ColorField({ id, label, value, onChange }: { id: string; label: string; value: ThemeColor; onChange: (v: ThemeColor) => void }) {
  if (!isPerMode(value)) return <ColorPicker id={id} aria-label={`${label} color`} value={pickable(value)} onValueChange={onChange} className="h-control-sm w-full min-w-0 flex-1" />
  return (
    <div className="flex min-w-0 flex-1 gap-1.5">
      {(['light', 'dark'] as const).map((mode) => (
        <ColorPicker
          key={mode}
          id={mode === 'light' ? id : undefined}
          aria-label={`${label} color in ${mode} mode`}
          value={pickable(value[mode])}
          onValueChange={(v) => onChange({ ...value, [mode]: v })}
          swatches={presetSwatches((theme) => `${theme} accent, ${mode}`, mode)}
          className="h-control-sm w-full min-w-0 flex-1"
        />
      ))}
    </div>
  )
}

function StatusRow({ name, value, fallback, onChange }: { name: Status; value: ThemeColor | null; fallback: string; onChange: (v: ThemeColor | null) => void }) {
  const id = useId()
  const label = name[0]!.toUpperCase() + name.slice(1)
  return (
    <InspectorRow label={label} htmlFor={id} action={value ? <ResetButton label={`Reset ${name} to the default pair`} onClick={() => onChange(null)} /> : undefined}>
      <ColorField id={id} label={label} value={value ?? fallback} onChange={onChange} />
    </InspectorRow>
  )
}

function SeriesRow({ index, value, onChange }: { index: number; value: ThemeColor; onChange: (v: ThemeColor) => void }) {
  const id = useId()
  const label = `Series ${index + 1}`
  return (
    <InspectorRow label={label} htmlFor={id}>
      <ColorField id={id} label={label} value={value} onChange={onChange} />
    </InspectorRow>
  )
}

/** Series `i` of a palette, a pair when the palette is given per mode. */
const seriesOf = (chart: Palette, i: number): ThemeColor => (isPerMode(chart) ? { light: chart.light[i]!, dark: chart.dark[i]! } : chart[i]!)

/** The palette with series `i` replaced. */
function withSeries(chart: Palette, i: number, value: ThemeColor): Palette {
  const put = (list: string[], v: string) => list.map((c, k) => (k === i ? v : c))
  if (!isPerMode(chart)) return put(chart, isPerMode(value) ? value.light : value)
  return isPerMode(value) ? { light: put(chart.light, value.light), dark: put(chart.dark, value.dark) } : { light: put(chart.light, value), dark: put(chart.dark, value) }
}

export interface ThemeControlsProps {
  draft: Draft
  onChange: (draft: Draft) => void
  /** A style was picked: for a page that also shows its look (Create). */
  onStyle?: (style: ThemeStyle) => void
}

/**
 * A draft on new faces. Titles in a face with a single weight (Instrument
 * Serif) are set at it rather than a synthesized bold, and moving on to a face
 * with a range hands them back the preset's weight.
 */
function withFaces(draft: Draft, fonts: Draft['fonts'], preset: ThemeInput): Draft {
  const leaving = onlyWeight(fontOf(draft.fonts.display)) !== undefined
  const weight = onlyWeight(fontOf(fonts.display)) ?? (leaving ? { ...DEFAULTS.headings, ...draftFrom(preset).character.headings }.weight : undefined)
  if (weight === undefined) return { ...draft, fonts }
  return { ...draft, fonts, character: { ...draft.character, headings: { ...draft.character.headings, weight } } }
}

export function ThemeControls({ draft, onChange, onStyle }: ThemeControlsProps) {
  const [advanced, setAdvanced] = useState(false)
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch })
  const character = (patch: Partial<Character>) => set({ character: { ...draft.character, ...patch } })
  const ids = { name: useId(), accent: useId(), info: useId() }
  const palette = closestPalette(draft)
  const style = closestStyle(draft)
  // The faces' weight falls back to the style the draft is closest to.
  const preset = composeTheme(palette.pick, style.pick)
  // What each status color is when the theme leaves it unset: the default pair, derived over this theme's neutral.
  const fallback = deriveTheme({ ...themeFrom(draft), success: undefined, warning: undefined, danger: undefined }).light
  const stroke = { ...DEFAULTS.stroke, ...draft.character.stroke }
  const surfaces = { ...DEFAULTS.surfaces, ...draft.character.surfaces }
  const headings = { ...DEFAULTS.headings, ...draft.character.headings }
  const labels = { ...DEFAULTS.labels, ...draft.character.labels }
  const tone = { ...DEFAULTS.tone, ...draft.character.tone }
  const tracking = draft.character.labels?.tracking ?? (labels.case === 'upper' ? LABEL_TRACKING[labels.font] : 0)
  const pairing = pairingOf(draft.fonts)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <InspectorSection title="Basics">
        <div className="grid gap-2 @2xl:grid-cols-2 @2xl:gap-x-8 @4xl:grid-cols-1">
          <InspectorSelect
            label="Palette"
            value={palette.pick.id}
            rich
            options={PALETTES.map((o) => (o.value === palette.pick.id && palette.edited ? { ...o, detail: 'Edited' } : o))}
            onChange={(id) => onChange(withPalette(draft, palettes.find((p) => p.id === id)!))}
            action={palette.edited ? <ResetButton label={`Reset to the ${palette.pick.name} palette`} onClick={() => onChange(withPalette(draft, palette.pick))} /> : undefined}
          />
          <InspectorSelect
            label="Style"
            value={style.pick.id}
            rich
            options={STYLES.map((o) => (o.value === style.pick.id && style.edited ? { ...o, detail: 'Edited' } : o))}
            onChange={(id) => {
              const next = styles.find((s) => s.id === id)!
              onChange(withStyle(draft, next))
              onStyle?.(next)
            }}
            action={style.edited ? <ResetButton label={`Reset to the ${style.pick.name} style`} onClick={() => onChange(withStyle(draft, style.pick))} /> : undefined}
          />
          <InspectorRow label="Name" htmlFor={ids.name}>
            <Input id={ids.name} value={draft.name} onChange={(e) => set({ name: e.target.value })} className="h-control-sm" />
          </InspectorRow>
          <InspectorRow label="Accent" htmlFor={ids.accent}>
            <ColorField id={ids.accent} label="Accent" value={draft.accent} onChange={(accent) => set({ accent })} />
          </InspectorRow>
          <InspectorSelect
            label="Typeface"
            value={pairing?.id ?? 'custom'}
            rich
            options={typefaceOptions(draft.fonts)}
            onOpen={loadAll}
            onChange={(id) => {
              const p = PAIRINGS.find((x) => x.id === id)
              if (p) onChange(withFaces(draft, pairingFonts(p) as Draft['fonts'], preset))
            }}
          />
          <InspectorSelect label="Radius" value={draft.radius} options={RADII} onChange={(radius) => set({ radius })} />
          <InspectorSelect label="Control size" value={draft.controlSize} options={CONTROL_SIZES} rich onChange={(controlSize) => set({ controlSize })} />
          <InspectorSelect label="Motion" value={draft.motionPersonality} options={MOTIONS} rich onChange={(motionPersonality) => set({ motionPersonality })} />
          <InspectorSelect label="Shadow" value={draft.character.shadow ?? DEFAULTS.shadow} options={SHADOWS} rich onChange={(shadow) => character({ shadow })} />
          <InspectorSelect label="Actions" value={draft.character.actions ?? DEFAULTS.actions} options={ACTION_FILLS} rich onChange={(actions) => character({ actions })} />
          <InspectorSelect label="Controls" value={draft.character.controls ?? DEFAULTS.controls} options={CONTROL_SHAPES} rich onChange={(controls) => character({ controls })} />
          <InspectorSelect label="Chrome" value={tone.chrome} options={CHROME_CHOICES} rich onChange={(chrome) => character({ tone: { ...draft.character.tone, chrome } })} />
          <InspectorSelect label="Bars" value={tone.bars} options={BAR_CHOICES} rich onChange={(bars) => character({ tone: { ...draft.character.tone, bars } })} />
          <InspectorSelect label="Overlays" value={tone.overlays} options={OVERLAY_CHOICES} rich onChange={(overlays) => character({ tone: { ...draft.character.tone, overlays } })} />
        </div>
      </InspectorSection>

      <InspectorAdvanced open={advanced} onOpenChange={setAdvanced} hint="Neutral and surfaces, status and info, charts, lines, type, labels">
        <div className="grid gap-5 @2xl:grid-cols-2 @2xl:gap-x-8 @4xl:grid-cols-1">
          <InspectorSection title="Neutral and surfaces">
            <SliderRow label="Hue" value={draft.hue} min={0} max={360} step={1} format={(v) => `${v}°`} onChange={(hue) => set({ hue })} />
            <SliderRow label="Tint" value={draft.chroma} min={0} max={0.04} step={0.001} format={(v) => v.toFixed(3)} onChange={(chroma) => set({ chroma: round(chroma, 3) })} />
            <SliderRow label="Wash" value={draft.wash} min={0} max={1} step={0.05} format={(v) => v.toFixed(2)} onChange={(wash) => set({ wash: round(wash, 2) })} />
            <SliderRow label="Lift" value={draft.lift} min={0} max={1} step={0.05} format={(v) => v.toFixed(2)} onChange={(lift) => set({ lift: round(lift, 2) })} />
            <SliderRow
              label="Gradient"
              value={surfaces.gradient}
              min={0}
              max={1}
              step={0.05}
              format={(v) => v.toFixed(2)}
              onChange={(gradient) => character({ surfaces: { ...draft.character.surfaces, gradient: round(gradient, 2) } })}
            />
          </InspectorSection>
          <InspectorSection title="Status">
            {STATUS.map((name) => (
              <StatusRow key={name} name={name} value={draft.status[name]} fallback={fallback[name]} onChange={(v) => set({ status: { ...draft.status, [name]: v } })} />
            ))}
            <InspectorRow label="Info" htmlFor={ids.info} action={draft.info ? <ResetButton label="Reset info to the accent" onClick={() => set({ info: null })} /> : undefined}>
              <ColorField id={ids.info} label="Info" value={draft.info ?? draft.accent} onChange={(info) => set({ info })} />
            </InspectorRow>
          </InspectorSection>
          <InspectorSection title="Charts">
            <InspectorSelect
              label="Series colors"
              value={draft.chart ? 'own' : 'accent'}
              rich
              options={chartOptions(draft)}
              onChange={(v) => set({ chart: v === 'own' ? (draft.chart ?? copyPalette((preset as ThemeInput).chart ?? STARTER_PALETTE)) : null })}
            />
            {draft.chart &&
              Array.from({ length: 5 }, (_, i) => (
                <SeriesRow key={i} index={i} value={seriesOf(draft.chart!, i)} onChange={(v) => set({ chart: withSeries(draft.chart!, i, v) })} />
              ))}
          </InspectorSection>
          <InspectorSection title="Lines">
            <InspectorSelect label="Width" value={String(stroke.width)} rich options={steps(LINE_WIDTHS, stroke.width, (n) => `${n}px`)} onChange={(v) => character({ stroke: { ...draft.character.stroke, width: Number(v) } })} />
            <InspectorSelect label="Ink" value={String(stroke.ink)} rich options={steps(INKS, stroke.ink, (n) => String(n))} onChange={(v) => character({ stroke: { ...draft.character.stroke, ink: Number(v) } })} />
            <InspectorSelect label="Icons" value={String(stroke.icons)} rich options={steps(ICON_WEIGHTS, stroke.icons, (n) => `${n}×`)} onChange={(v) => character({ stroke: { ...draft.character.stroke, icons: Number(v) } })} />
          </InspectorSection>
          <InspectorSection title="Type">
            <InspectorSelect
              label="Titles"
              value={fontOf(draft.fonts.display)?.id ?? (draft.fonts.display ? 'custom' : 'text')}
              rich
              onOpen={loadAll}
              options={withCurrent([{ value: 'text', label: 'Same as text', note: fontOf(draft.fonts.sans)?.label }, ...familyOptions(['sans', 'serif', 'mono'])], draft.fonts.display)}
              onChange={(id) => {
                if (id === 'custom') return
                const { display: _, ...rest } = draft.fonts
                const f = FAMILIES.find((x) => x.id === id)
                onChange(withFaces(draft, f ? { ...rest, display: f.stack } : rest, preset))
              }}
            />
            <InspectorSelect label="Weight" value={String(headings.weight)} rich options={steps(TITLE_WEIGHTS, headings.weight, String)} onChange={(v) => character({ headings: { ...draft.character.headings, weight: Number(v) } })} />
            <InspectorSelect label="Tracking" value={String(headings.tracking)} rich options={steps(TITLE_TRACKINGS, headings.tracking, em)} onChange={(v) => character({ headings: { ...draft.character.headings, tracking: Number(v) } })} />
            <InspectorSelect
              label="Mono"
              value={fontOf(draft.fonts.mono)?.id ?? 'custom'}
              rich
              onOpen={loadAll}
              options={withCurrent(familyOptions(['mono']), draft.fonts.mono)}
              onChange={(id) => {
                const f = FAMILIES.find((x) => x.id === id)
                if (f) set({ fonts: { ...draft.fonts, mono: f.stack } })
              }}
            />
          </InspectorSection>
          <InspectorSection title="Labels">
            <InspectorSwitch label="Capitals" note="Badges, column heads, tabs" checked={labels.case === 'upper'} onChange={(on) => character({ labels: { ...draft.character.labels, case: on ? 'upper' : 'none' } })} />
            <InspectorSwitch label="Monospace" note="Set in the mono face" checked={labels.font === 'mono'} onChange={(on) => character({ labels: { ...draft.character.labels, font: on ? 'mono' : 'sans' } })} />
            <InspectorSelect label="Tracking" value={String(tracking)} rich options={steps(LABEL_TRACKINGS, tracking, em)} onChange={(v) => character({ labels: { ...draft.character.labels, tracking: Number(v) } })} />
          </InspectorSection>
        </div>
      </InspectorAdvanced>
    </div>
  )
}
