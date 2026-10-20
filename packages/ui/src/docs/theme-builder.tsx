'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowRightIcon, CopyIcon, MoonIcon, SunIcon } from '@youj/icons'
import { basalt, checkTheme, deriveTheme, isPerMode, themeCss, ThemeScope, type PerMode, type Theme, type ThemeInput } from '@youj/core'
import { contrast, deriveChart, DEFAULTS, parseColor, type ThemeStyle } from '@youj/core/lib/youj/theme'
import { oklchToLinear } from '@youj/core/lib/youj/theme/color'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { cn } from '../lib/utils'
import { googleFontsHref, webFonts } from './create/fonts'
import { useThemeFonts } from './create/load-fonts'
import { ThemeControls } from './theme-controls'
import { draftFrom, STATUS, themeFrom } from './theme-draft'
import { ThemeSample } from './theme-sample'

/* A theme builder: edit the contract, see it in light and dark side by side,
 * read the contrast checks, and copy it out as CSS or JS. Used by the
 * Foundations/Themes story, the docs site's Theming page and, as controls
 * only, Create. Its typefaces load as they're chosen. */

/* ── Export ──────────────────────────────────────────────────────────────── */

const quote = (s: string) => (s.includes("'") ? JSON.stringify(s) : `'${s}'`)
/** A color or palette as source; a pair tuned per mode as `{ light, dark }`. */
const colorSource = <T,>(value: T | PerMode<T>, write: (v: T) => string) => (isPerMode(value) ? `{ light: ${write(value.light)}, dark: ${write(value.dark)} }` : write(value))
const paletteSource = (p: readonly string[]) => `[${p.map(quote).join(', ')}]`
const camel = (id: string) => {
  const name = id.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
  return /^[a-z]/.test(name) ? name : `theme${name}`
}

/** Where a theme's web fonts come from, for the export's note; null when it names none. */
const fontsImport = (t: Theme) => {
  const fonts = webFonts(t.fonts)
  return fonts.length ? `@import url('${googleFontsHref(fonts)}');` : null
}

/** The theme as `defineTheme` source. It has an id, so it's complete: defaults are left out. */
function toSource(t: Theme): string {
  const lines = [`  id: ${quote(t.id!)},`, `  name: ${quote(t.name!)},`]
  const n = t.neutral!
  const lift = n.lift ?? DEFAULTS.neutral.lift
  if (n.hue !== DEFAULTS.neutral.hue || n.chroma !== DEFAULTS.neutral.chroma || n.wash !== DEFAULTS.neutral.wash || lift !== DEFAULTS.neutral.lift)
    lines.push(`  neutral: { hue: ${n.hue}, chroma: ${n.chroma}, wash: ${n.wash}${lift !== DEFAULTS.neutral.lift ? `, lift: ${lift}` : ''} },`)
  if (t.accent) lines.push(`  accent: ${colorSource(t.accent, quote)},`)
  for (const key of STATUS) if (t[key]) lines.push(`  ${key}: ${colorSource(t[key]!, quote)},`)
  if (t.info) lines.push(`  info: ${colorSource(t.info, quote)},`)
  if (t.chart) lines.push(`  chart: ${colorSource(t.chart, paletteSource)},`)
  if (t.radius !== DEFAULTS.radius) lines.push(`  radius: ${quote(t.radius!)},`)
  if (t.controlSize !== DEFAULTS.controlSize) lines.push(`  controlSize: ${quote(t.controlSize!)},`)
  const fonts = [
    ...(t.fonts?.sans !== DEFAULTS.fonts.sans ? [`sans: ${JSON.stringify(t.fonts!.sans)}`] : []),
    ...(t.fonts?.display ? [`display: ${JSON.stringify(t.fonts.display)}`] : []),
    ...(t.fonts?.mono && t.fonts.mono !== DEFAULTS.fonts.mono ? [`mono: ${JSON.stringify(t.fonts.mono)}`] : []),
  ]
  if (fonts.length) lines.push(`  fonts: { ${fonts.join(', ')} },`)
  if (t.motionPersonality !== DEFAULTS.motionPersonality) lines.push(`  motionPersonality: ${quote(t.motionPersonality!)},`)
  // The character, as picked: groups written as objects, `shadow` as a word.
  const group = (value: object) => `{ ${Object.entries(value).map(([k, v]) => `${k}: ${typeof v === 'string' ? quote(v) : v}`).join(', ')} }`
  for (const key of ['stroke', 'surfaces', 'headings', 'labels', 'tone'] as const) if (t[key] && JSON.stringify(t[key]) !== JSON.stringify(DEFAULTS[key])) lines.push(`  ${key}: ${group(t[key]!)},`)
  if (t.shadow && t.shadow !== 'soft') lines.push(`  shadow: ${quote(t.shadow)},`)
  if (t.actions && t.actions !== DEFAULTS.actions) lines.push(`  actions: ${quote(t.actions)},`)
  if (t.controls && t.controls !== DEFAULTS.controls) lines.push(`  controls: ${quote(t.controls)},`)
  const name = camel(t.id!)
  const load = fontsImport(t)
  return [
    `import { defineTheme } from '@youj/core'`,
    '',
    `export const ${name} = defineTheme({`,
    ...lines,
    '})',
    '',
    `// The whole app: <YoujProvider theme={${name}}>, or <html {...themeProps(${name})}> for SSR.`,
    `// Part of a page: <ThemeScope theme={${name}}>.`,
    ...(load ? [`// Its typefaces, at the top of your stylesheet: ${load}`] : []),
    '',
  ].join('\n')
}

function toCss(t: Theme): string {
  const usage = t.motionPersonality === 'precise' ? `data-yj-theme="${t.id}"` : `data-yj-theme="${t.id}" data-yj-motion="${t.motionPersonality}"`
  const load = fontsImport(t)
  return `${load ? `${load}\n\n` : ''}${themeCss({ ...t, motionPersonality: undefined }, `[data-yj-theme='${t.id}']`)}\n/* Apply it on <html> for the whole app, or on any element for part of a page:\n   <html ${usage}> */\n`
}

/* ── Checks ──────────────────────────────────────────────────────────────── */

const SURFACES = ['canvas', 'surface', 'raised'] as const
const PAIRS = [
  { label: 'Body text', fg: 'fg', min: 4.5 },
  { label: 'Metadata (fg-subtle)', fg: 'fg-subtle', min: 4.5 },
  { label: 'Accent as text', fg: 'accent', min: 4.5 },
  { label: 'Field border', fg: 'input', min: 3 },
  { label: 'Text on accent', fg: 'accent-contrast', bg: 'accent', min: 4.5 },
] as const

function Ratio({ value, min }: { value: number; min: number }) {
  const pass = value >= min
  return (
    <span className={cn('inline-flex h-5 items-center rounded-full px-1.5 font-mono text-ui-xs font-medium tabular-nums', pass ? 'bg-success-subtle text-success-text' : 'bg-danger-subtle text-danger-text')}>
      {value.toFixed(2)}
    </span>
  )
}

function Checks({ theme }: { theme: Theme }) {
  const issues = useMemo(() => checkTheme(theme), [theme])
  const derived = useMemo(() => deriveTheme(theme), [theme])
  const worst = (mode: 'light' | 'dark', fg: string, bg?: string) => {
    const pal = derived[mode] as Record<string, string>
    const text = parseColor(pal[fg]!)!
    const against = bg ? [bg] : SURFACES
    return Math.min(...against.map((s) => contrast(text, parseColor(pal[s]!)!)))
  }
  // A chart palette's series are marks: the worst of them on the worst surface, at 3:1.
  const chart = (mode: 'light' | 'dark') => {
    const pal = derived[mode] as Record<string, string>
    const series = deriveChart(theme, mode).flatMap((c) => (c ? [oklchToLinear(c)] : []))
    return Math.min(...series.flatMap((c) => SURFACES.map((s) => contrast(c, parseColor(pal[s]!)!))))
  }
  const failing = issues.filter((i) => i.level === 'error' || i.code === 'contrast')
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div id={id} className="text-ui font-semibold text-fg">
          Checks
        </div>
        <Badge variant={failing.length ? 'danger' : 'success'}>{failing.length ? `${failing.length} to fix` : 'Passes WCAG AA in light and dark'}</Badge>
      </div>
      <table className="w-full border-collapse text-start">
        <thead>
          <tr className="text-ui-xs text-fg-muted">
            <th className="px-4 py-2 text-start font-medium">Pair, worst surface</th>
            <th className="px-2 py-2 text-end font-medium">Needs</th>
            <th className="px-2 py-2 text-end font-medium">Light</th>
            <th className="px-4 py-2 text-end font-medium">Dark</th>
          </tr>
        </thead>
        <tbody>
          {PAIRS.map((p) => (
            <tr key={p.label} className="border-t border-line">
              <th scope="row" className="px-4 py-1.5 text-start text-ui font-normal text-fg">
                {p.label}
              </th>
              <td className="px-2 py-1.5 text-end font-mono text-ui-xs text-fg-muted">{p.min}:1</td>
              <td className="px-2 py-1.5 text-end">
                <Ratio value={worst('light', p.fg, 'bg' in p ? p.bg : undefined)} min={p.min} />
              </td>
              <td className="px-4 py-1.5 text-end">
                <Ratio value={worst('dark', p.fg, 'bg' in p ? p.bg : undefined)} min={p.min} />
              </td>
            </tr>
          ))}
          {theme.chart && (
            <tr className="border-t border-line">
              <th scope="row" className="px-4 py-1.5 text-start text-ui font-normal text-fg">
                Chart series
              </th>
              <td className="px-2 py-1.5 text-end font-mono text-ui-xs text-fg-muted">3:1</td>
              <td className="px-2 py-1.5 text-end">
                <Ratio value={chart('light')} min={3} />
              </td>
              <td className="px-4 py-1.5 text-end">
                <Ratio value={chart('dark')} min={3} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {issues.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line px-4 py-3">
          {issues.map((i, n) => (
            <li key={n} className={cn('text-ui-sm', i.code === 'gamut' ? 'text-fg-muted' : 'text-danger-text')}>
              {i.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Export ──────────────────────────────────────────────────────────────── */

function Code({ code, name }: { code: string; name: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])
  return (
    <div className="relative">
      <pre tabIndex={0} aria-label={`${name} export`} className="focus-ring yj-scrollbar max-h-80 overflow-auto rounded-b-xl p-4 pe-12 font-mono text-[12px] leading-relaxed text-fg">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy the ${name}`}
        className="absolute end-2 top-2"
        onClick={() => navigator.clipboard?.writeText(code)?.then(() => setCopied(true), () => {})}
      >
        <CopyIcon active={copied} />
      </Button>
      <span role="status" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </div>
  )
}

function Export({ theme }: { theme: Theme }) {
  const css = useMemo(() => toCss(theme), [theme])
  const js = useMemo(() => toSource(theme), [theme])
  return (
    <Tabs defaultValue="css" className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line ps-2 pe-4">
        <TabsList aria-label="Export as">
          <TabsTrigger value="css">CSS</TabsTrigger>
          <TabsTrigger value="js">JS</TabsTrigger>
        </TabsList>
        <span className="font-mono text-ui-xs text-fg-muted">{theme.id}</span>
      </div>
      <TabsContent value="css">
        <Code code={css} name="CSS" />
      </TabsContent>
      <TabsContent value="js">
        <Code code={js} name="JS" />
      </TabsContent>
    </Tabs>
  )
}

/* ── Preview ─────────────────────────────────────────────────────────────── */

function Pane({ mode, theme }: { mode: 'light' | 'dark'; theme: Theme }) {
  return (
    <div data-theme={mode} className="overflow-hidden rounded-xl border border-line">
      <ThemeScope theme={theme}>
        <div className="flex items-center gap-1.5 border-b border-line bg-canvas px-4 py-2 font-mono text-ui-xs text-fg-muted">
          {mode === 'light' ? <SunIcon className="size-3.5" /> : <MoonIcon className="size-3.5" />}
          {mode}
        </div>
        <ThemeSample />
      </ThemeScope>
    </div>
  )
}

/* ── Builder ─────────────────────────────────────────────────────────────── */

export interface ThemeBuilderProps {
  /** The theme to start from. Default Graphite. */
  initial?: ThemeInput
  /** The theme being edited, when the page owns it (Create keeps it in its URL). */
  value?: Theme
  /** Every edit, as the complete theme. */
  onChange?: (theme: Theme) => void
  /** A style was picked: its look, for a page that shows one (Create). */
  onStyle?: (style: ThemeStyle) => void
  /** Only the controls: for a page that previews and exports the theme itself. */
  controlsOnly?: boolean
  /** Where "Open in Create" takes this theme; without it there's no link. */
  createHref?: (theme: Theme) => string
  className?: string
}

/** Edit a theme's contract, preview it in light and dark, check it and export it. */
export function ThemeBuilder({ initial = basalt, value, onChange, onStyle, controlsOnly = false, createHref, className }: ThemeBuilderProps) {
  const [own, setOwn] = useState(() => draftFrom(initial))
  const draft = useMemo(() => (value ? draftFrom(value, value.name) : own), [value, own])
  const theme = useMemo(() => themeFrom(draft), [draft])
  useThemeFonts(theme.fonts)
  const update = (next: typeof draft) => {
    if (!value) setOwn(next)
    onChange?.(themeFrom(next))
  }

  // Laid out by its own width (container queries), so it fits a docs column as well as a full page.
  return (
    <div className={cn('@container', className)}>
      <div className={cn('grid items-start gap-4', !controlsOnly && '@4xl:grid-cols-[20rem_minmax(0,1fr)]')}>
        <div className={cn('min-w-0 text-fg', !controlsOnly && 'rounded-xl border border-line bg-surface p-4')}>
          <ThemeControls draft={draft} onChange={update} onStyle={onStyle} />
        </div>
        {!controlsOnly && (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-4 @2xl:grid-cols-2">
              <Pane mode="light" theme={theme} />
              <Pane mode="dark" theme={theme} />
            </div>
            <Checks theme={theme} />
            <Export theme={theme} />
            {createHref && (
              <a
                href={createHref(theme)}
                className="focus-ring inline-flex items-center gap-2 self-start rounded-md text-ui font-medium text-accent-text hover:underline"
              >
                Open in Create: put this theme on a whole app frame
                <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
